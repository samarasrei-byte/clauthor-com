// wow-generate — Edge Function que streama o primeiro entregável do usuário
// via Lovable AI Gateway (SSE). Auth JWT obrigatório, rate limit em memória
// (1 wow / 60s / user), validação Zod, fallback silencioso para o cliente.
// Instrumentado com execution-tracer: cada wow vira uma run replayável.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { startRun } from "../_shared/execution-tracer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "content-type, x-run-id",
};

const BodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  company: z.string().trim().min(1).max(120),
  pain: z.string().trim().min(1).max(500),
  painCategory: z.enum(["vendas_b2b", "juridico", "marketing", "operacoes", "financeiro", "outro"]),
  agentSlug: z.string().trim().min(1).max(60).optional(),
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

    const last = rateLimitMap.get(user.id) ?? 0;
    if (Date.now() - last < RATE_LIMIT_MS) {
      return new Response(JSON.stringify({ error: "rate_limited", retry_after_ms: RATE_LIMIT_MS - (Date.now() - last) }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    rateLimitMap.set(user.id, Date.now());

    const rawBody = await req.json();
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_input", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { tenantId, company, pain, painCategory, agentSlug, systemPrompt, userPrompt } = parsed.data;

    // Resolve tenant if not passed
    let resolvedTenantId = tenantId ?? null;
    if (!resolvedTenantId) {
      try {
        const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
        if (typeof data === "string") resolvedTenantId = data;
      } catch { /* best-effort */ }
    }

    // Start tracer (best-effort — never blocks generation)
    const tracer = resolvedTenantId
      ? await startRun(supabase, {
          tenantId: resolvedTenantId,
          userId: user.id,
          runType: "agent_execute",
          agents: agentSlug ? [agentSlug] : [],
          message: `[InstantWow] ${company} — ${pain}`.slice(0, 500),
        })
      : null;

    await tracer?.step("thought", {
      title: "Analisando pedido do cliente",
      agent_slug: agentSlug ?? null,
      content: { company, pain_category: painCategory },
    });

    const callStart = Date.now();
    await tracer?.step("tool_call", {
      title: "Chamando Lovable AI Gateway (Gemini 2.5 Flash)",
      tool_name: "lovable_ai_gateway",
      agent_slug: agentSlug ?? null,
      content: { model: "google/gemini-2.5-flash", stream: true },
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
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
      await tracer?.step("error", {
        title: `AI Gateway falhou (${aiResp.status})`,
        agent_slug: agentSlug ?? null,
        content: { status: aiResp.status, details: errText.slice(0, 500) },
      });
      await tracer?.finish({ status: "failed", summary: "AI gateway error" });
      return new Response(JSON.stringify({ error: "ai_gateway_error", status: aiResp.status, details: errText.slice(0, 500) }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tee: pass-through to client + accumulate for tracer.
    let accumulated = "";
    const decoder = new TextDecoder();
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        try {
          const text = decoder.decode(chunk, { stream: true });
          for (const line of text.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) accumulated += delta;
            } catch { /* keep-alive */ }
          }
        } catch { /* decode fail */ }
        controller.enqueue(chunk);
      },
      async flush() {
        const durationMs = Date.now() - callStart;
        await tracer?.step("tool_result", {
          title: "Resposta recebida do modelo",
          tool_name: "lovable_ai_gateway",
          agent_slug: agentSlug ?? null,
          duration_ms: durationMs,
          content: { output_chars: accumulated.length },
        });
        await tracer?.step("final_output", {
          title: "Primeiro entregável gerado",
          agent_slug: agentSlug ?? null,
          content: { markdown: accumulated.slice(0, 4000) },
        });
        await tracer?.finish({
          status: "completed",
          summary: `InstantWow • ${painCategory} • ${accumulated.length} chars`,
          total_ms: durationMs,
        });
      },
    });

    return new Response(aiResp.body.pipeThrough(transform), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...(tracer ? { "X-Run-Id": tracer.runId } : {}),
      },
    });
  } catch (err) {
    console.error("[wow-generate] fatal:", (err as Error).message);
    return new Response(JSON.stringify({ error: "internal", message: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
