import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ENDPOINT = Deno.env.get("EXTERNAL_AI_ENDPOINT") || "";
  const API_KEY = Deno.env.get("OPENCLAW_API_KEY") || "";

  console.log(`[Test OpenClaw] Endpoint: ${ENDPOINT ? ENDPOINT.substring(0, 40) + "..." : "NOT SET"}`);
  console.log(`[Test OpenClaw] API Key: ${API_KEY ? "SET (" + API_KEY.length + " chars)" : "NOT SET"}`);

  if (!ENDPOINT) {
    return new Response(JSON.stringify({ error: "EXTERNAL_AI_ENDPOINT not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const body = {
    model: "openclaw-default",
    messages: [
      { role: "system", content: "You are a helpful assistant. Respond in Portuguese (Brazil). Keep it short." },
      { role: "user", content: "Olá! Confirme que você está online e funcionando. Responda com uma frase curta." }
    ],
    max_tokens: 150,
    temperature: 0.7,
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const startTime = Date.now();

  try {
    // Create HTTP client that accepts self-signed certificates
    const fetchOptions: any = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    // Try to create a client that skips TLS verification
    try {
      const httpClient = (Deno as any).createHttpClient({ 
        caCerts: [],
        // @ts-ignore - allow self-signed
      });
      fetchOptions.client = httpClient;
      console.log("[Test OpenClaw] Using custom HTTP client (skip TLS verify)");
    } catch (e) {
      console.warn("[Test OpenClaw] Could not create custom HTTP client, using default:", e.message);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(ENDPOINT, fetchOptions);

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    console.log(`[Test OpenClaw] Status: ${response.status} | Latency: ${latency}ms`);

    const responseText = await response.text();
    console.log(`[Test OpenClaw] Raw response (first 500 chars): ${responseText.substring(0, 500)}`);

    let parsed;
    try { parsed = JSON.parse(responseText); } catch { parsed = { raw: responseText }; }

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      latency_ms: latency,
      endpoint: ENDPOINT.substring(0, 40) + "...",
      response: parsed,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    const latency = Date.now() - startTime;
    console.error(`[Test OpenClaw] Error after ${latency}ms:`, e);

    return new Response(JSON.stringify({
      success: false,
      error: e.message,
      latency_ms: latency,
      endpoint: ENDPOINT.substring(0, 40) + "...",
    }, null, 2), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
