/**
 * paypal-checkout · Fluxo de assinaturas e ordens one-time via PayPal.
 *
 * SEGURANÇA (Sprint 1 · hardening pré-lançamento):
 *  1. Exige JWT em TODAS as ações que criam dinheiro (create_subscription,
 *     create_order). Ações somente de leitura (verify/check) também exigem
 *     JWT — não permitimos enumerar order/subscription IDs de terceiros.
 *  2. `amount`/`currency` do body são REFERÊNCIA — a autoridade é o catálogo
 *     server-side (`_shared/plan-catalog.ts`). Qualquer divergência maior
 *     que 0.01 rejeita a request. Cliente não pode escolher preço.
 *  3. `setup_fee` é limitado ao teto do slug (0-5000 BRL, dependendo do
 *     departamento/vertical).
 *  4. Erros do PayPal são logados no server mas NÃO propagados ao cliente
 *     com detalhe cru (evita vazamento de informação interna).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getUserFromRequest, unauthorizedResponse } from "../_shared/auth.ts";
import {
  resolveSubscriptionPrice,
  resolveOrderPrice,
  assertPriceMatches,
  assertSetupFeeAllowed,
} from "../_shared/plan-catalog.ts";

const PAYPAL_BASE = "https://api-m.paypal.com";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secretKey = Deno.env.get("PAYPAL_SECRET_KEY");
  if (!clientId || !secretKey) throw new Error("PayPal credentials not configured");
  const auth = btoa(`${clientId}:${secretKey}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function findOrCreateProduct(accessToken: string, agentSlug: string, agentName: string): Promise<string> {
  const listRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products?page_size=20&total_required=true`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.products?.find((p: any) => p.name === `clauthor-agent-${agentSlug}`);
    if (existing) return existing.id;
  }
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `product-${agentSlug}-${Date.now()}`,
    },
    body: JSON.stringify({
      name: `clauthor-agent-${agentSlug}`,
      description: `Assinatura mensal do agente ${agentName} - Clauthor`,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  if (!res.ok) throw new Error(`Create product failed: ${await res.text()}`);
  return (await res.json()).id;
}

async function findOrCreatePlan(
  accessToken: string,
  productId: string,
  agentSlug: string,
  amount: number,
  currency: string,
  setupFee: number,
): Promise<string> {
  const planName = `plan-${agentSlug}-${currency}-${amount}-setup${setupFee}`;
  const listRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans?product_id=${productId}&page_size=20&total_required=true`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.plans?.find((p: any) => p.status === "ACTIVE" && p.name === planName);
    if (existing) return existing.id;
  }
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `plan-${agentSlug}-${currency}-${amount}-${setupFee}-${Date.now()}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: planName,
      description: setupFee > 0
        ? `Setup ${currency} ${setupFee.toFixed(2)} + Mensalidade - ${agentSlug}`
        : `Assinatura mensal - ${agentSlug}`,
      status: "ACTIVE",
      billing_cycles: [{
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: amount.toFixed(2), currency_code: currency } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
        setup_fee: { value: setupFee.toFixed(2), currency_code: currency },
        setup_fee_failure_action: "CONTINUE",
      },
    }),
  });
  if (!res.ok) throw new Error(`Create plan failed: ${await res.text()}`);
  return (await res.json()).id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const APP_URL = Deno.env.get("APP_URL") || "https://clauthor.com";
    const body = await req.json().catch(() => ({}));
    const { action } = body ?? {};

    if (!action || typeof action !== "string") {
      return json({ error: "action is required" }, 400);
    }

    // ── get_client_id é público (só devolve o PAYPAL_CLIENT_ID, que é público mesmo) ──
    if (action === "get_client_id") {
      const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
      if (!clientId) return json({ error: "PayPal client ID not configured" }, 500);
      return json({ success: true, client_id: clientId });
    }

    // ── Todas as outras ações exigem JWT válido ──
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) {
      console.warn(`[paypal-checkout] blocked ${action}: ${authError}`);
      return unauthorizedResponse(corsHeaders, authError ?? "unauthorized");
    }

    const accessToken = await getAccessToken();

    // ═══════════════════════════════════════════════════════════════════
    // CREATE SUBSCRIPTION — preço RESOLVIDO SERVER-SIDE do catálogo
    // ═══════════════════════════════════════════════════════════════════
    if (action === "create_subscription") {
      const { agent_slug, agent_name, amount: requestedAmount, currency: requestedCurrency, return_url, cancel_url, setup_fee } = body;

      if (!agent_slug || typeof agent_slug !== "string") {
        return json({ error: "agent_slug is required" }, 400);
      }

      // ── Resolve preço autoritativo do catálogo ─────────────────────
      const catalog = resolveSubscriptionPrice(agent_slug);
      if (!catalog) {
        console.warn(`[paypal-checkout] unknown slug: ${agent_slug} (user=${user.id})`);
        return json({ error: `unknown_plan: ${agent_slug}` }, 400);
      }

      // ── Se o cliente mandou amount/currency, tem que bater ─────────
      const priceCheck = assertPriceMatches(
        { amount: requestedAmount, currency: requestedCurrency },
        catalog,
      );
      if (!priceCheck.ok) {
        console.warn(`[paypal-checkout] price mismatch for ${agent_slug} (user=${user.id}): ${priceCheck.reason}`);
        return json({ error: "price_mismatch" }, 400);
      }

      // ── Valida setup fee dentro do teto do slug ────────────────────
      const setupFeeAmount = typeof setup_fee === "number" && setup_fee > 0 ? setup_fee : 0;
      const setupCheck = assertSetupFeeAllowed(setupFeeAmount, catalog);
      if (!setupCheck.ok) {
        console.warn(`[paypal-checkout] setup fee rejected for ${agent_slug} (user=${user.id}): ${setupCheck.reason}`);
        return json({ error: "setup_fee_out_of_range" }, 400);
      }

      // A partir daqui usamos SEMPRE o catálogo, nunca o valor do cliente.
      const authoritativeAmount = catalog.amount;
      const authoritativeCurrency = catalog.currency;

      const productId = await findOrCreateProduct(accessToken, agent_slug, agent_name || catalog.displayName);
      const planId = await findOrCreatePlan(accessToken, productId, agent_slug, authoritativeAmount, authoritativeCurrency, setupFeeAmount);

      const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `sub-${agent_slug}-${user.id.slice(0, 8)}-${Date.now()}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: `user:${user.id}`,
          application_context: {
            brand_name: "Clauthor",
            locale: "pt-BR",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: return_url || `${APP_URL}/dashboard?subscription=success`,
            cancel_url: cancel_url || `${APP_URL}/library?subscription=cancelled`,
          },
        }),
      });

      if (!subRes.ok) {
        const detail = await subRes.text();
        console.error(`[paypal-checkout] create_subscription failed for user=${user.id} slug=${agent_slug}: ${detail}`);
        return json({ error: "paypal_subscription_creation_failed" }, 502);
      }

      const subscription = await subRes.json();
      const approveLink = subscription.links?.find((l: any) => l.rel === "approve")?.href;

      return json({
        success: true,
        subscription_id: subscription.id,
        approve_url: approveLink,
        status: subscription.status,
        plan_id: planId,
        product_id: productId,
        amount: authoritativeAmount,
        currency: authoritativeCurrency,
        setup_fee: setupFeeAmount,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // VERIFY SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════
    if (action === "verify_subscription") {
      const { subscription_id } = body;
      if (!subscription_id || typeof subscription_id !== "string") {
        return json({ error: "subscription_id is required" }, 400);
      }
      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscription_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error(`[paypal-checkout] verify failed for user=${user.id}: ${await res.text()}`);
        return json({ error: "verify_failed" }, 502);
      }
      const sub = await res.json();
      // Se o campo custom_id existe e não bate com o user, bloqueia.
      if (sub.custom_id && sub.custom_id !== `user:${user.id}`) {
        console.warn(`[paypal-checkout] cross-user verify blocked: user=${user.id} sub=${subscription_id}`);
        return json({ error: "subscription_not_owned" }, 403);
      }
      return json({
        success: true,
        subscription_id: sub.id,
        status: sub.status,
        plan_id: sub.plan_id,
        subscriber: sub.subscriber,
        start_time: sub.start_time,
        billing_info: sub.billing_info,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CANCEL SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════
    if (action === "cancel_subscription") {
      const { subscription_id, reason } = body;
      if (!subscription_id || typeof subscription_id !== "string") {
        return json({ error: "subscription_id is required" }, 400);
      }
      // Antes de cancelar, confere que pertence ao user.
      const infoRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscription_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (infoRes.ok) {
        const infoSub = await infoRes.json();
        if (infoSub.custom_id && infoSub.custom_id !== `user:${user.id}`) {
          console.warn(`[paypal-checkout] cross-user cancel blocked: user=${user.id} sub=${subscription_id}`);
          return json({ error: "subscription_not_owned" }, 403);
        }
      }
      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscription_id}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Customer requested cancellation" }),
      });
      if (!res.ok && res.status !== 204) {
        console.error(`[paypal-checkout] cancel failed for user=${user.id}: ${await res.text()}`);
        return json({ error: "cancel_failed" }, 502);
      }
      return json({ success: true, message: "Subscription cancelled" });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CREATE ORDER (token pack one-time) — também com preço server-side
    // ═══════════════════════════════════════════════════════════════════
    if (action === "create_order") {
      const { pack_slug, amount: requestedAmount, currency: requestedCurrency, description } = body;
      if (!pack_slug || typeof pack_slug !== "string") {
        return json({ error: "pack_slug is required" }, 400);
      }
      const catalog = resolveOrderPrice(pack_slug);
      if (!catalog) {
        console.warn(`[paypal-checkout] unknown pack: ${pack_slug} (user=${user.id})`);
        return json({ error: `unknown_pack: ${pack_slug}` }, 400);
      }
      const priceCheck = assertPriceMatches(
        { amount: requestedAmount, currency: requestedCurrency },
        catalog,
      );
      if (!priceCheck.ok) {
        console.warn(`[paypal-checkout] pack price mismatch (user=${user.id}): ${priceCheck.reason}`);
        return json({ error: "price_mismatch" }, 400);
      }

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: catalog.currency, value: catalog.amount.toFixed(2) },
            description: description || catalog.displayName,
            custom_id: `user:${user.id}`,
          }],
          application_context: {
            brand_name: "Clauthor",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: `${APP_URL}/dashboard?payment=success`,
            cancel_url: `${APP_URL}/dashboard?payment=cancelled`,
          },
        }),
      });
      if (!res.ok) {
        console.error(`[paypal-checkout] create_order failed for user=${user.id}: ${await res.text()}`);
        return json({ error: "paypal_order_creation_failed" }, 502);
      }
      const order = await res.json();
      const approveLink = order.links?.find((l: any) => l.rel === "approve")?.href;
      return json({
        success: true,
        order_id: order.id,
        approve_url: approveLink,
        status: order.status,
        amount: catalog.amount,
        currency: catalog.currency,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CAPTURE ORDER
    // ═══════════════════════════════════════════════════════════════════
    if (action === "capture_order") {
      const { order_id } = body;
      if (!order_id || typeof order_id !== "string") return json({ error: "order_id is required" }, 400);
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        console.error(`[paypal-checkout] capture failed for user=${user.id}: ${await res.text()}`);
        return json({ error: "capture_failed" }, 502);
      }
      const capture = await res.json();
      return json({ success: true, order_id: capture.id, status: capture.status, payer: capture.payer });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CHECK ORDER STATUS
    // ═══════════════════════════════════════════════════════════════════
    if (action === "check_order") {
      const { order_id } = body;
      if (!order_id || typeof order_id !== "string") return json({ error: "order_id is required" }, 400);
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) return json({ error: "check_failed" }, 502);
      const order = await res.json();
      return json({ success: true, order_id: order.id, status: order.status });
    }

    return json({
      error: "invalid_action",
      message: "Use: get_client_id, create_subscription, verify_subscription, cancel_subscription, create_order, capture_order, check_order",
    }, 400);

  } catch (error) {
    console.error("[paypal-checkout] internal error:", error);
    return json({ success: false, error: "internal_error" }, 500);
  }
});
