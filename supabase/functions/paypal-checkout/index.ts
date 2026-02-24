import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAYPAL_BASE = "https://api-m.paypal.com"; // Production

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const secretKey = Deno.env.get("PAYPAL_SECRET_KEY");

  if (!clientId || !secretKey) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${secretKey}`);
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, order_id, amount, currency, description } = await req.json();

    const accessToken = await getAccessToken();

    // CREATE ORDER
    if (action === "create_order") {
      const orderAmount = amount || 100;
      const orderCurrency = currency || "USD";
      const orderDescription = description || "Clauthor Agent Subscription";

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: orderCurrency,
              value: orderAmount.toFixed(2),
            },
            description: orderDescription,
          }],
          application_context: {
            brand_name: "Clauthor",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: "https://clauthor-com.lovable.app/dashboard?payment=success",
            cancel_url: "https://clauthor-com.lovable.app/dashboard?payment=cancelled",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`PayPal create order failed: ${err}`);
      }

      const order = await res.json();
      const approveLink = order.links?.find((l: any) => l.rel === "approve")?.href;

      return new Response(JSON.stringify({
        success: true,
        order_id: order.id,
        approve_url: approveLink,
        status: order.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CAPTURE ORDER (after user approves)
    if (action === "capture_order") {
      if (!order_id) throw new Error("order_id is required for capture");

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`PayPal capture failed: ${err}`);
      }

      const capture = await res.json();

      return new Response(JSON.stringify({
        success: true,
        order_id: capture.id,
        status: capture.status,
        payer: capture.payer,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CHECK ORDER STATUS
    if (action === "check_order") {
      if (!order_id) throw new Error("order_id is required");

      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`PayPal check order failed: ${err}`);
      }

      const order = await res.json();

      return new Response(JSON.stringify({
        success: true,
        order_id: order.id,
        status: order.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      error: "Invalid action. Use: create_order, capture_order, check_order",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("PayPal checkout error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
