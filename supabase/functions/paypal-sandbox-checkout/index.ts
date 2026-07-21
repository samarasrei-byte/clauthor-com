/**
 * paypal-sandbox-checkout · Modo sandbox do PayPal para admins validarem
 * o fluxo de checkout ponta-a-ponta sem gastar dinheiro real.
 *
 * Aponta para `https://api-m.sandbox.paypal.com` e usa as credenciais
 * PAYPAL_SANDBOX_CLIENT_ID / PAYPAL_SANDBOX_SECRET_KEY. Todas as ações
 * exigem JWT válido + role `admin` (checado via has_role no banco).
 *
 * Ações suportadas:
 *  - create_order   → cria uma ordem one-time em sandbox (default: BRL 1.00)
 *  - capture_order  → captura a ordem após aprovação do payer sandbox
 *  - check_order    → consulta status de uma ordem
 *  - get_client_id  → devolve o CLIENT_ID sandbox (para SDK JS opcional)
 *
 * Cada execução é registrada em `public.paypal_sandbox_tests` para auditoria.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getUserFromRequest, unauthorizedResponse } from "../_shared/auth.ts";

const PAYPAL_SANDBOX_BASE = "https://api-m.sandbox.paypal.com";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(userId: string): Promise<boolean> {
  const svc = serviceClient();
  const { data, error } = await svc.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) {
    console.error("[paypal-sandbox] has_role error:", error.message);
    return false;
  }
  return data === true;
}

async function getSandboxAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_SANDBOX_CLIENT_ID");
  const secretKey = Deno.env.get("PAYPAL_SANDBOX_SECRET_KEY");
  if (!clientId || !secretKey) {
    throw new Error("sandbox_credentials_missing");
  }
  const auth = btoa(`${clientId}:${secretKey}`);
  const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`sandbox_auth_failed: ${detail.slice(0, 200)}`);
  }
  return (await res.json()).access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (!action || typeof action !== "string") {
      return json({ error: "action is required" }, 400);
    }

    // ── Auth: exige JWT + role admin em toda ação ──────────────────────
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse(corsHeaders, authError ?? "unauthorized");

    const isAdmin = await assertAdmin(user.id);
    if (!isAdmin) {
      console.warn(`[paypal-sandbox] non-admin blocked: user=${user.id}`);
      return json({ error: "admin_required" }, 403);
    }

    const svc = serviceClient();
    const APP_URL = Deno.env.get("APP_URL") || "https://clauthor.com";

    // ── get_client_id (só admin) ──────────────────────────────────────
    if (action === "get_client_id") {
      const clientId = Deno.env.get("PAYPAL_SANDBOX_CLIENT_ID");
      if (!clientId) return json({ error: "sandbox_credentials_missing" }, 500);
      return json({ success: true, client_id: clientId, environment: "sandbox" });
    }

    // ── create_order ──────────────────────────────────────────────────
    if (action === "create_order") {
      const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 1.0;
      const currency = typeof body.currency === "string" ? body.currency : "BRL";
      const description = typeof body.description === "string"
        ? body.description
        : "Clauthor · Teste sandbox PayPal (não é cobrança real)";

      // Cap defensivo: no sandbox nunca deixamos passar de 10 unidades.
      const cappedAmount = Math.min(amount, 10);

      let accessToken: string;
      try {
        accessToken = await getSandboxAccessToken();
      } catch (e) {
        const msg = (e as Error).message;
        await svc.from("paypal_sandbox_tests").insert({
          admin_user_id: user.id,
          action: "create_order",
          status: "failed",
          amount: cappedAmount,
          currency,
          description,
          error_message: msg,
        });
        return json({ error: msg }, 500);
      }

      const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `sandbox-${user.id.slice(0, 8)}-${Date.now()}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: currency, value: cappedAmount.toFixed(2) },
            description,
            custom_id: `sandbox:admin:${user.id}`,
          }],
          application_context: {
            brand_name: "Clauthor Sandbox",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${APP_URL}/admin/paypal-sandbox?result=success`,
            cancel_url: `${APP_URL}/admin/paypal-sandbox?result=cancelled`,
          },
        }),
      });

      const rawText = await res.text();
      let raw: unknown;
      try { raw = JSON.parse(rawText); } catch { raw = { raw: rawText }; }

      if (!res.ok) {
        console.error(`[paypal-sandbox] create_order failed: ${rawText}`);
        await svc.from("paypal_sandbox_tests").insert({
          admin_user_id: user.id,
          action: "create_order",
          status: "failed",
          amount: cappedAmount,
          currency,
          description,
          raw_response: raw as never,
          error_message: `paypal_error_${res.status}`,
        });
        return json({ error: "sandbox_order_creation_failed", detail: raw }, 502);
      }

      const order = raw as { id: string; status: string; links?: Array<{ rel: string; href: string }> };
      const approveLink = order.links?.find((l) => l.rel === "approve")?.href ?? null;

      await svc.from("paypal_sandbox_tests").insert({
        admin_user_id: user.id,
        action: "create_order",
        status: "pending",
        order_id: order.id,
        approve_url: approveLink,
        amount: cappedAmount,
        currency,
        description,
        raw_response: raw as never,
      });

      return json({
        success: true,
        environment: "sandbox",
        order_id: order.id,
        approve_url: approveLink,
        status: order.status,
        amount: cappedAmount,
        currency,
      });
    }

    // ── capture_order ─────────────────────────────────────────────────
    if (action === "capture_order") {
      const order_id = body.order_id;
      if (!order_id || typeof order_id !== "string") {
        return json({ error: "order_id is required" }, 400);
      }
      const accessToken = await getSandboxAccessToken();
      const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders/${order_id}/capture`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const rawText = await res.text();
      let raw: unknown;
      try { raw = JSON.parse(rawText); } catch { raw = { raw: rawText }; }

      if (!res.ok) {
        await svc.from("paypal_sandbox_tests").insert({
          admin_user_id: user.id,
          action: "capture_order",
          status: "failed",
          order_id,
          raw_response: raw as never,
          error_message: `paypal_error_${res.status}`,
        });
        return json({ error: "sandbox_capture_failed", detail: raw }, 502);
      }

      const capture = raw as { id: string; status: string };
      await svc.from("paypal_sandbox_tests").insert({
        admin_user_id: user.id,
        action: "capture_order",
        status: capture.status === "COMPLETED" ? "captured" : "pending",
        order_id: capture.id,
        raw_response: raw as never,
      });

      return json({ success: true, environment: "sandbox", order_id: capture.id, status: capture.status });
    }

    // ── check_order ───────────────────────────────────────────────────
    if (action === "check_order") {
      const order_id = body.order_id;
      if (!order_id || typeof order_id !== "string") {
        return json({ error: "order_id is required" }, 400);
      }
      const accessToken = await getSandboxAccessToken();
      const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v2/checkout/orders/${order_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      const rawText = await res.text();
      let raw: unknown;
      try { raw = JSON.parse(rawText); } catch { raw = { raw: rawText }; }
      if (!res.ok) {
        return json({ error: "sandbox_check_failed", detail: raw }, 502);
      }
      const order = raw as { id: string; status: string };
      return json({ success: true, environment: "sandbox", order_id: order.id, status: order.status, detail: raw });
    }

    return json({ error: `unknown_action: ${action}` }, 400);
  } catch (e) {
    console.error("[paypal-sandbox] unhandled error:", (e as Error).message);
    return json({ error: (e as Error).message || "internal_error" }, 500);
  }
});
