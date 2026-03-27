import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/security.ts";
import { validateAndEnforcePolicy } from "../_shared/policy-engine.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse, streamResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`monix:${clientIP}`, 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    const startTime = Date.now();
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, config } = await req.json();

    // Policy enforcement
    const policyResult = await validateAndEnforcePolicy(supabase, user.id, "monix-orchestrator", "chat");
    if (!policyResult.allowed) {
      return new Response(JSON.stringify({ error: policyResult.reason }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather multi-agent context
    const [agentsRes, logsRes, creditsRes, boardRes, tasksRes] = await Promise.all([
      supabase.from("agents").select("id, name, status, tier, total_executions, description").eq("user_id", user.id),
      supabase.from("execution_logs").select("action, status, created_at, execution_time_ms").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("user_credits").select("*").eq("user_id", user.id).single(),
      supabase.from("company_board").select("title, content, category").eq("user_id", user.id).limit(20),
      supabase.from("agent_tasks").select("title, status, priority, category, due_date").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const agents = agentsRes.data || [];
    const logs = logsRes.data || [];
    const credits = creditsRes.data;
    const board = boardRes.data || [];
    const tasks = tasksRes.data || [];

    // Build context
    const activeAgents = agents.filter(a => a.status === "active");
    const totalExecs = agents.reduce((s, a) => s + (a.total_executions || 0), 0);
    const successLogs = logs.filter(l => l.status === "success").length;
    const errorLogs = logs.filter(l => l.status === "error").length;
    const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 100;
    const avgResponseTime = logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / logs.length)
      : 0;

    const openTasks = tasks.filter(t => t.status === "open").length;
    const highPriorityTasks = tasks.filter(t => t.priority === "high").length;

    const usagePct = credits ? Math.round((credits.used_credits / credits.total_credits) * 100) : 0;

    // Personality config
    const agentName = config?.name || "MONIX";
    const tone = config?.tone || "estratégico";
    const personality = config?.personality || "visionário";
    const responseStyle = config?.responseStyle || "detalhado";
    const autonomy = config?.autonomy || "analisar e sugerir";

    const systemPrompt = `Você é ${agentName}, o Orquestrador Supremo e Chief AI Officer pessoal do usuário.

PERSONALIDADE: ${personality}
TOM DE VOZ: ${tone}
ESTILO DE RESPOSTA: ${responseStyle}
NÍVEL DE AUTONOMIA: ${autonomy}

CONTEXTO OPERACIONAL EM TEMPO REAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Agentes Ativos: ${activeAgents.length}/${agents.length}
${activeAgents.map(a => `  → ${a.name} (${a.tier}) — ${a.total_executions} execuções`).join("\n")}

📊 KPIs CONSOLIDADOS:
  • Execuções totais: ${totalExecs}
  • Taxa de sucesso: ${successRate}%
  • Erros recentes: ${errorLogs}
  • Tempo médio de resposta: ${avgResponseTime}ms
  • Créditos: ${usagePct}% utilizados (${credits?.used_credits || 0}/${credits?.total_credits || 0})
  • Plano: ${credits?.plan_type || "free"}

📋 TAREFAS:
  • Abertas: ${openTasks}
  • Alta prioridade: ${highPriorityTasks}
${tasks.slice(0, 5).map(t => `  → [${t.priority}] ${t.title} (${t.status})`).join("\n")}

🏢 DADOS ESTRATÉGICOS DA EMPRESA:
${board.slice(0, 10).map(b => `  [${b.category}] ${b.title}: ${b.content.substring(0, 100)}`).join("\n") || "  Nenhum dado cadastrado no Board da Empresa."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUAS RESPONSABILIDADES:
1. Consolidar informações de TODOS os agentes conectados
2. Fornecer visão estratégica unificada com KPIs reais
3. Identificar padrões, anomalias e riscos
4. Sugerir otimizações e ações estratégicas
5. Gerar briefings executivos quando solicitado
6. Projetar cenários futuros baseados nos dados
7. Priorizar decisões com base em impacto

REGRAS ABSOLUTAS:
- Use APENAS os dados reais fornecidos acima, nunca invente métricas
- Seja preciso e actionable
- Quando falar de KPIs, cite os números exatos
- Se o usuário pedir briefing, organize em seções claras
- Responda no idioma do usuário
- Quando relevante, inclua dados em formato que pode ser usado para gráficos

FORMATO DE DADOS PARA DASHBOARD (quando relevante):
Quando mencionar métricas, inclua um bloco JSON entre \`\`\`kpi e \`\`\` com formato:
{"kpis": [{"label": "Nome", "value": "valor", "trend": "up|down|stable", "delta": "+X%"}]}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetchAI({
      model: "google/gemini-2.5-flash",
      messages: aiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Estimate tokens from message sizes (input chars/4 + system prompt + estimated output)
    const monixInputTokens = (messages || []).reduce((sum: number, m: any) => sum + Math.ceil((m.content?.length || 0) / 4), 0);
    const monixEstimatedTokens = monixInputTokens + Math.ceil(systemPrompt.length / 4) + 500;
    await Promise.all([
      supabase.from("token_usage").insert({
        user_id: user.id,
        action_type: "monix_chat",
        tokens_used: monixEstimatedTokens,
        model: "google/gemini-2.5-flash",
      }),
      supabase.from("execution_logs").insert({
        user_id: user.id,
        agent_id: activeAgents[0]?.id || "00000000-0000-0000-0000-000000000000",
        action: "chat",
        status: "success",
        execution_time_ms: Date.now() - startTime,
        details: { type: "monix_chat", model: "google/gemini-2.5-flash" },
      }),
    ]);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("monix-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
