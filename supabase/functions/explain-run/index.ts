// explain-run: Gera narrativa em linguagem natural dos passos de uma execução.
// Cacheia o resultado em mcp_executions.results.explanation para não gastar tokens duas vezes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const runId: string | undefined = body?.run_id;
    const force: boolean = Boolean(body?.force);
    if (!runId) return errorResponse("run_id obrigatório", 400);

    // Busca run (RLS garante que o usuário só vê os próprios)
    const { data: run, error: runErr } = await supabase
      .from("mcp_executions")
      .select("id, run_type, status, summary, total_ms, selected_agents, results, message")
      .eq("id", runId)
      .maybeSingle();

    if (runErr) return errorResponse(runErr.message, 400);
    if (!run) return errorResponse("Run não encontrado", 404);

    // Cache hit
    const cached = (run.results as Record<string, unknown> | null)?.explanation;
    if (cached && typeof cached === "string" && !force) {
      return jsonResponse({ explanation: cached, cached: true });
    }

    const { data: steps } = await supabase
      .from("execution_steps")
      .select("step_index, step_type, title, tool_name, duration_ms, tokens_out")
      .eq("run_id", runId)
      .order("step_index", { ascending: true })
      .limit(80);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return errorResponse("LOVABLE_API_KEY não configurado", 500);

    const stepsSummary = (steps ?? [])
      .map(
        (s) =>
          `${s.step_index + 1}. [${s.step_type}]${s.tool_name ? ` (${s.tool_name})` : ""} ${s.title}${s.duration_ms ? ` — ${s.duration_ms}ms` : ""}`,
      )
      .join("\n");

    const systemPrompt = `Você é um analista técnico do CLAUTHOR. Explique em português, de forma clara e concisa, o que aconteceu nesta execução de agente. Máximo 4 parágrafos curtos. Comece com um resumo em uma linha, depois descreva as decisões-chave, ferramentas usadas e o resultado. Não invente dados que não estejam nos passos. Não use markdown pesado — texto corrido.`;

    const userPrompt = `**Run:** ${run.run_type} · status=${run.status} · duração=${run.total_ms ?? "?"}ms
**Agentes:** ${(run.selected_agents ?? []).join(", ") || "—"}
**Pedido inicial:** ${run.message ?? "—"}

**Passos executados (${steps?.length ?? 0}):**
${stepsSummary || "(nenhum passo registrado)"}

**Resumo do agente:** ${run.summary ?? "—"}`;

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (aiRes.status === 402) return errorResponse("Créditos AI esgotados", 402);
    if (aiRes.status === 429) return errorResponse("Rate limit", 429);
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[explain-run] AI gateway error", aiRes.status, errText);
      return errorResponse("Falha ao gerar explicação", 502);
    }

    const aiData = await aiRes.json();
    const explanation: string = aiData.choices?.[0]?.message?.content?.trim() || "Sem narrativa disponível.";

    // Cache best-effort (não bloqueia a resposta)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    admin
      .from("mcp_executions")
      .update({
        results: { ...(run.results ?? {}), explanation, explanation_generated_at: new Date().toISOString() },
      })
      .eq("id", runId)
      .then(() => {}, () => {});

    return jsonResponse({ explanation, cached: false });
  } catch (e) {
    console.error("[explain-run] error:", e);
    return errorResponse((e as Error).message || "Erro interno", 500);
  }
});
