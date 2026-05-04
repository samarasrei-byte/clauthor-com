import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const PAYPAL_BASE = "https://api-m.paypal.com";

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
  // Try to find existing product
  const listRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products?page_size=20&total_required=true`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  
  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.products?.find((p: any) => p.name === `clauthor-agent-${agentSlug}`);
    if (existing) return existing.id;
  }

  // Create new product
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `product-${agentSlug}-${Date.now()}`,
    },
    body: JSON.stringify({
      name: `clauthor-agent-${agentSlug}`,
      description: `Assinatura mensal do agente ${agentName} — Clauthor`,
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
  setupFee: number = 0,
): Promise<string> {
  const planName = `plan-${agentSlug}-${currency}-${amount}-setup${setupFee}`;
  // List plans for this product
  const listRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans?product_id=${productId}&page_size=20&total_required=true`, {
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.plans?.find((p: any) =>
      p.status === "ACTIVE" && p.name === planName
    );
    if (existing) return existing.id;
  }

  // Create plan
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
        ? `Setup ${currency} ${setupFee.toFixed(2)} + Mensalidade — ${agentSlug}`
        : `Assinatura mensal — ${agentSlug}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: amount.toFixed(2),
              currency_code: currency,
            },
          },
        },
      ],
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const APP_URL = Deno.env.get("APP_URL") || "https://www.clauthor.com";
    const body = await req.json();
    const { action } = body;
    const accessToken = await getAccessToken();

    // ═══════════════════════════════════════════════════════
    // CREATE SUBSCRIPTION (monthly recurring for an agent)
    // ═══════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════
    // GET CLIENT ID (for JS SDK on frontend)
    // ═══════════════════════════════════════════════════════
    if (action === "get_client_id") {
      const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
      if (!clientId) throw new Error("PayPal client ID not configured");
      return new Response(JSON.stringify({
        success: true,
        client_id: clientId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_subscription") {
      const { agent_slug, agent_name, amount, currency, return_url, cancel_url, setup_fee } = body;
      
      if (!agent_slug || !amount || amount <= 0) {
        throw new Error("agent_slug and amount are required");
      }

      const cur = currency || "BRL";
      const setupFeeAmount = typeof setup_fee === "number" && setup_fee > 0 ? setup_fee : 0;

      // 1. Find or create product
      const productId = await findOrCreateProduct(accessToken, agent_slug, agent_name || agent_slug);

      // 2. Find or create plan (with optional one-time setup fee charged at first billing)
      const planId = await findOrCreatePlan(accessToken, productId, agent_slug, amount, cur, setupFeeAmount);

      // 3. Create subscription
      const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `sub-${agent_slug}-${Date.now()}`,
        },
        body: JSON.stringify({
          plan_id: planId,
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

      if (!subRes.ok) throw new Error(`Create subscription failed: ${await subRes.text()}`);

      const subscription = await subRes.json();
      const approveLink = subscription.links?.find((l: any) => l.rel === "approve")?.href;

      return new Response(JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        approve_url: approveLink,
        status: subscription.status,
        plan_id: planId,
        product_id: productId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════
    // VERIFY SUBSCRIPTION (after user approves)
    // ═══════════════════════════════════════════════════════
    if (action === "verify_subscription") {
      const { subscription_id } = body;
      if (!subscription_id) throw new Error("subscription_id is required");

      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscription_id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Verify subscription failed: ${await res.text()}`);

      const sub = await res.json();

      return new Response(JSON.stringify({
        success: true,
        subscription_id: sub.id,
        status: sub.status, // APPROVAL_PENDING, APPROVED, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
        plan_id: sub.plan_id,
        subscriber: sub.subscriber,
        start_time: sub.start_time,
        billing_info: sub.billing_info,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════
    // CANCEL SUBSCRIPTION
    // ═══════════════════════════════════════════════════════
    if (action === "cancel_subscription") {
      const { subscription_id, reason } = body;
      if (!subscription_id) throw new Error("subscription_id is required");

      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscription_id}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "Customer requested cancellation" }),
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Cancel subscription failed: ${await res.text()}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Subscription cancelled",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════
    // LEGACY: CREATE ORDER (one-time payment for token packs)
    // ═══════════════════════════════════════════════════════
    if (action === "create_order") {
      const { order_id, amount, currency, description } = body;
      const orderAmount = amount || 100;
      const orderCurrency = currency || "USD";
      const orderDescription = description || "Clauthor Token Pack";

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: orderCurrency, value: orderAmount.toFixed(2) },
            description: orderDescription,
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

      if (!res.ok) throw new Error(`PayPal create order failed: ${await res.text()}`);
      const order = await res.json();
      const approveLink = order.links?.find((l: any) => l.rel === "approve")?.href;

      return new Response(JSON.stringify({
        success: true, order_id: order.id, approve_url: approveLink, status: order.status,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CAPTURE ORDER
    if (action === "capture_order") {
      const { order_id } = body;
      if (!order_id) throw new Error("order_id is required for capture");

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`PayPal capture failed: ${await res.text()}`);
      const capture = await res.json();

      return new Response(JSON.stringify({
        success: true, order_id: capture.id, status: capture.status, payer: capture.payer,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CHECK ORDER STATUS
    if (action === "check_order") {
      const { order_id } = body;
      if (!order_id) throw new Error("order_id is required");

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`PayPal check order failed: ${await res.text()}`);
      const order = await res.json();

      return new Response(JSON.stringify({
        success: true, order_id: order.id, status: order.status,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      error: "Invalid action. Use: create_subscription, verify_subscription, cancel_subscription, create_order, capture_order, check_order",
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("PayPal checkout error:", error);
    return new Response(JSON.stringify({
      success: false, error: error.message || "Internal server error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
