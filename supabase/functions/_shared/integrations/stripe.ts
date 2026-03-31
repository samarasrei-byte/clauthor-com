import { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.stripe.com/v1";

function headers(secretKey: string) {
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function toForm(obj: Record<string, any>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      parts.push(toForm(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
}

export async function handleStripe(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const sk = creds.secret_key;
  if (!sk) return { success: false, error: "Missing Stripe secret_key" };

  const h = headers(sk);

  try {
    switch (action) {
      case "create-customer": {
        const body: Record<string, any> = {};
        if (params.email) body.email = params.email;
        if (params.name) body.name = params.name;
        if (params.metadata) body.metadata = params.metadata;

        const res = await fetch(`${BASE}/customers`, {
          method: "POST", headers: h, body: toForm(body),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error?.message || `Stripe ${res.status}` };
        return { success: true, data };
      }

      case "create-checkout-session": {
        const body: Record<string, any> = {
          mode: params.mode || "payment",
          success_url: params.success_url,
          cancel_url: params.cancel_url,
          ...params.data,
        };
        if (params.customer) body.customer = params.customer;
        if (params.line_items) body.line_items = params.line_items;

        const res = await fetch(`${BASE}/checkout/sessions`, {
          method: "POST", headers: h, body: toForm(body),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error?.message || `Stripe ${res.status}` };
        return { success: true, data };
      }

      case "get-subscriptions": {
        const qs = new URLSearchParams();
        if (params.customer_id) qs.set("customer", params.customer_id);
        qs.set("status", params.status || "active");

        const res = await fetch(`${BASE}/subscriptions?${qs}`, { headers: h });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error?.message || `Stripe ${res.status}` };
        return { success: true, data: data.data };
      }

      case "cancel-subscription": {
        if (!params.subscription_id) return { success: false, error: "subscription_id required" };
        const res = await fetch(`${BASE}/subscriptions/${params.subscription_id}`, {
          method: "DELETE", headers: h,
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error?.message || `Stripe ${res.status}` };
        return { success: true, data };
      }

      default:
        return { success: false, error: `Unknown Stripe action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Stripe request failed" };
  }
}
