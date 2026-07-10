// wow-generate — Edge Function que streama o primeiro entregável do usuário
// via Lovable AI Gateway (SSE). Auth JWT obrigatório, rate limit em memória
// (1 wow / 60s / user), validação Zod, fallback silencioso para o cliente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-type",
};

const BodySchema = z.object({
  company: z.string().trim().min(1).max(120),
  pain: z.string().trim().min(1).max(500),
  painCategory: z.enum(["vendas_b2b", "juridico", "marketing", "operacoes", "financeiro", "outro"]),
  systemPrompt: z.string().min(10).max(2000),
  userPrompt: z.string().min(10).max(3000),
});

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const last = rateLimitMap.get(user.id) ?? 0;
    if (Date.now() - last < RATE_LIMIT_MS) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after_ms: RATE_LIMIT_MS - (Date.now() - last) }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rateLimitMap.set(user.id, Date.now());

    // Validate
    const rawBody = await req.json();
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_input", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { systemPrompt, userPrompt } = parsed.data;

    // Stream from Lovable AI Gateway
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok || !aiResp.body) {
      const errText = await aiResp.text().catch(() => "");
      const status = aiResp.status === 402 || aiResp.status === 429 ? aiResp.status : 502;
      return new Response(JSON.stringify({ error: "ai_gateway_error", status: aiResp.status, details: errText.slice(0, 500) }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Passa o stream SSE direto adiante
    return new Response(aiResp.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[wow-generate] fatal:", (err as Error).message);
    return new Response(JSON.stringify({ error: "internal", message: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
