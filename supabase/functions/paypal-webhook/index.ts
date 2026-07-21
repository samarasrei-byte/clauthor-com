/**
 * paypal-webhook · Receives PayPal event notifications.
 *
 * Security:
 *  - Public endpoint (no JWT). PayPal signs each request; we verify signature
 *    against PAYPAL_WEBHOOK_ID via /v1/notifications/verify-webhook-signature.
 *  - All events persisted to `paypal_webhook_events` for audit/idempotency.
 *  - Duplicate event IDs are ignored (unique constraint on event_id).
 *
 * Supported events:
 *  - BILLING.SUBSCRIPTION.ACTIVATED / .CANCELLED / .SUSPENDED / .EXPIRED
 *  - PAYMENT.SALE.COMPLETED (subscription renewal)
 *  - CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED (one-time)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

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
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function verifySignature(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) {
    console.error("[paypal-webhook] PAYPAL_WEBHOOK_ID not configured — rejecting for safety");
    return false;
  }
  const accessToken = await getAccessToken();
  const verifyPayload = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  };
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyPayload),
  });
  if (!res.ok) {
    console.error("[paypal-webhook] verify call failed:", await res.text());
    return false;
  }
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

type Supa = ReturnType<typeof createClient>;

async function processEvent(supa: Supa, event: any): Promise<void> {
  const type: string = event.event_type;
  const resource = event.resource ?? {};
  const resourceId: string | null = resource.id ?? resource.billing_agreement_id ?? null;

  switch (type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      if (!resourceId) return;
      await supa
        .from("contracted_departments")
        .update({ status: "active", paypal_subscription_id: resourceId, updated_at: new Date().toISOString() })
        .eq("paypal_subscription_id", resourceId);
      break;
    }
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
    case "BILLING.SUBSCRIPTION.SUSPENDED": {
      if (!resourceId) return;
      const newStatus = type.endsWith("SUSPENDED") ? "suspended" : "cancelled";
      await supa
        .from("contracted_departments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("paypal_subscription_id", resourceId);
      break;
    }
    case "PAYMENT.SALE.COMPLETED": {
      // Recurring subscription payment · mark last renewal
      const subId = resource.billing_agreement_id;
      if (!subId) return;
      await supa
        .from("contracted_departments")
        .update({ status: "active", last_renewal_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("paypal_subscription_id", subId);
      break;
    }
    case "CHECKOUT.ORDER.APPROVED":
    case "PAYMENT.CAPTURE.COMPLETED": {
      if (!resourceId) return;
      await supa
        .from("contracted_departments")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("paypal_order_id", resourceId);
      break;
    }
    default:
      // Ignore unknown types (still persisted for audit)
      break;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventId: string | undefined = event.id;
  const eventType: string | undefined = event.event_type;
  if (!eventId || !eventType) {
    return json({ error: "Missing event id/type" }, 400);
  }

  // Signature verification — reject if not valid
  const valid = await verifySignature(req.headers, rawBody).catch((e) => {
    console.error("[paypal-webhook] verify error:", e);
    return false;
  });
  if (!valid) {
    return json({ error: "Invalid signature" }, 401);
  }

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Idempotent insert · duplicate event_id returns conflict
  const resource = event.resource ?? {};
  const resourceId: string | null = resource.id ?? resource.billing_agreement_id ?? null;
  const { error: insertErr } = await supa.from("paypal_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    resource_id: resourceId,
    payload: event,
  });

  if (insertErr) {
    // Duplicate → already processed, just ack
    if (insertErr.code === "23505") {
      return json({ ok: true, duplicate: true });
    }
    console.error("[paypal-webhook] insert failed:", insertErr);
    return json({ error: "Storage error" }, 500);
  }

  try {
    await processEvent(supa, event);
    await supa
      .from("paypal_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", eventId);
  } catch (e) {
    console.error("[paypal-webhook] process error:", e);
    await supa
      .from("paypal_webhook_events")
      .update({ error: (e as Error).message })
      .eq("event_id", eventId);
    // Still 200 · we've persisted; PayPal retry would create a duplicate we skip
  }

  return json({ ok: true });
});
