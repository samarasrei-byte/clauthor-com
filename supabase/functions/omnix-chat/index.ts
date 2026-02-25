import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { validateAndEnforcePolicy } from "../_shared/policy-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Credential tools for THOR ──
const CREDENTIAL_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "save_credentials",
      description: "Save user credentials/access info for an integration (WhatsApp, Email, LinkedIn, etc). Call this when the user provides login details, API keys, passwords, phone numbers, or access tokens for any service.",
      parameters: {
        type: "object",
        properties: {
          agent_id: { type: "string", description: "The agent ID to associate credentials with. Use the first active agent if not specified." },
          credentials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                integration_name: { type: "string", description: "Service name: whatsapp, email, linkedin, instagram, hubspot, etc." },
                credential_key: { type: "string", description: "Key name: api_key, password, phone_number, access_token, smtp_host, smtp_user, smtp_password, etc." },
                credential_value: { type: "string", description: "The actual credential value provided by the user." },
              },
              required: ["integration_name", "credential_key", "credential_value"],
            },
          },
        },
        required: ["credentials"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_credentials",
      description: "List all saved credentials for an agent. Shows integration names and keys (values are always masked). Call when the user asks to see, check, or verify their saved credentials.",
      parameters: {
        type: "object",
        properties: {
          agent_id: { type: "string", description: "The agent ID. Use the first active agent if not specified." },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "revoke_credentials",
      description: "Revoke/delete all credentials for a specific integration from an agent. Call when the user wants to remove, delete, or revoke access for a service.",
      parameters: {
        type: "object",
        properties: {
          agent_id: { type: "string", description: "The agent ID. Use the first active agent if not specified." },
          integration_name: { type: "string", description: "Service name to revoke: whatsapp, email, linkedin, etc." },
        },
        required: ["integration_name"],
      },
    },
  },
];

async function callCredentialManager(
  action: string, body: Record<string, any>,
  supabaseUrl: string, authHeader: string,
): Promise<any> {
  const res = await fetch(`${supabaseUrl}/functions/v1/credential-manager`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json().catch(() => ({ error: "Parse error" }));
}

async function handleToolCall(
  toolName: string, args: any,
  userId: string, activeAgents: any[],
  supabaseUrl: string, authHeader: string,
): Promise<string> {
  const agentId = args.agent_id || activeAgents[0]?.id;
  if (!agentId) return JSON.stringify({ error: "Nenhum agente ativo encontrado." });
  const agentName = activeAgents.find(a => a.id === agentId)?.name || "Agente";

  switch (toolName) {
    case "save_credentials": {
      const saved: string[] = [];
      const errors: string[] = [];
      for (const cred of args.credentials || []) {
        const result = await callCredentialManager("save", {
          agent_id: agentId,
          integration_name: cred.integration_name.toLowerCase(),
          credential_key: cred.credential_key.toLowerCase(),
          credential_value: cred.credential_value,
          is_secret: true,
        }, supabaseUrl, authHeader);
        if (result.success) saved.push(`${cred.integration_name}/${cred.credential_key}`);
        else errors.push(`${cred.integration_name}: ${result.error || "failed"}`);
      }
      return JSON.stringify({ success: saved.length > 0, saved, errors, agent_name: agentName });
    }
    case "list_credentials": {
      const result = await callCredentialManager("list", { agent_id: agentId }, supabaseUrl, authHeader);
      return JSON.stringify({ agent_name: agentName, credentials: result.credentials || [] });
    }
    case "revoke_credentials": {
      const result = await callCredentialManager("revoke", {
        agent_id: agentId,
        integration_name: args.integration_name.toLowerCase(),
      }, supabaseUrl, authHeader);
      return JSON.stringify({ success: result.success, revoked_count: result.revoked_count || 0, integration: args.integration_name, agent_name: agentName });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const policyResult = await validateAndEnforcePolicy(supabase, user.id, "omnix-orchestrator", "chat");
    if (!policyResult.allowed) {
      return new Response(JSON.stringify({ error: policyResult.reason }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather full context
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

    const agentName = config?.name || "THOR";
    const tone = config?.tone || "estratégico";
    const personality = config?.personality || "futurista";
    const responseStyle = config?.responseStyle || "detalhado";
    const autonomy = config?.autonomy || "analisar e sugerir";

    const systemPrompt = `Você é ${agentName}, o Agente Central de IA e Orquestrador Supremo da plataforma Clautor.

PERSONALIDADE: ${personality}
TOM DE VOZ: ${tone}
ESTILO DE RESPOSTA: ${responseStyle}
NÍVEL DE AUTONOMIA: ${autonomy}

CONTEXTO OPERACIONAL EM TEMPO REAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Agentes Ativos: ${activeAgents.length}/${agents.length}
${activeAgents.map(a => `  → ${a.name} (${a.tier}) [ID: ${a.id}] — ${a.total_executions} execuções`).join("\n")}

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

MÓDULOS DO SISTEMA ${agentName}:
  ✅ Voice Waveform — Online
  ✅ Audio Spectrum Visualizer — Online
  ✅ Streaming SSE — Online
  ✅ Speech-to-Text — Online
  ✅ Text-to-Speech — Online
  ✅ Dashboard de KPIs — Online
  ✅ Policy Engine — Online
  ✅ AI Gateway (Lovable + Fallback) — Online
  ✅ Credential Vault (AES-256-GCM) — Online

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUAS RESPONSABILIDADES:
1. Consolidar informações de TODOS os agentes conectados
2. Fornecer visão estratégica unificada com KPIs reais
3. Identificar padrões, anomalias e riscos
4. Sugerir otimizações e ações estratégicas
5. Gerar briefings executivos quando solicitado
6. Realizar auditorias de sistema quando solicitado
7. Priorizar decisões com base em impacto
8. **Gerenciar credenciais de integrações** (salvar, listar, revogar)

GESTÃO DE CREDENCIAIS:
- **save_credentials**: Quando o usuário fornecer dados de acesso (senhas, tokens, API keys, telefones, etc.)
- **list_credentials**: Quando o usuário pedir para ver, verificar ou listar suas credenciais salvas
- **revoke_credentials**: Quando o usuário pedir para remover, deletar ou revogar acesso a um serviço
Regras:
1. Se o usuário não especificar qual agente, use o primeiro agente ativo: ${activeAgents[0]?.id || "nenhum"}
2. Confirme o resultado da operação
3. NUNCA repita os valores das credenciais na sua resposta
4. Integrações suportadas: whatsapp, email, linkedin, instagram, hubspot, apollo, slack, google, meta_ads

REGRAS:
- Use APENAS os dados reais fornecidos acima, nunca invente métricas
- Seja preciso e actionable
- Quando falar de KPIs, cite os números exatos
- Se o usuário pedir auditoria, verifique TODOS os módulos listados acima
- Responda no idioma do usuário

FORMATO DE DADOS PARA DASHBOARD (quando relevante):
Quando mencionar métricas, inclua um bloco JSON entre \`\`\`kpi e \`\`\` com formato:
{"kpis": [{"label": "Nome", "value": "valor", "trend": "up|down|stable", "delta": "+X%"}]}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Detect credential intent (save, list, revoke)
    const lastUserMsg = (messages || []).filter((m: any) => m.role === "user").pop()?.content || "";
    const credentialIntent = /senha|password|api.?key|token|acesso|login|credencial|chave|phone|telefone|whatsapp|smtp|e-?mail.*senha|linkedin.*senha|listar|mostrar|ver.*credencia|revogar|remover|deletar.*credencia|quais.*credencia/i.test(lastUserMsg);

    if (credentialIntent && activeAgents.length > 0) {
      const toolResponse = await fetchAI({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: false,
        max_tokens: 500,
        temperature: 0.3,
        tools: CREDENTIAL_TOOLS,
        tool_choice: "auto",
      });

      if (toolResponse.ok) {
        const toolData = await toolResponse.json();
        const choice = toolData.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          const toolResults: any[] = [];
          for (const tc of toolCalls) {
            const args = JSON.parse(tc.function.arguments);
            const result = await handleToolCall(tc.function.name, args, user.id, activeAgents, supabaseUrl, authHeader);
            toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
          }

          const finalResponse = await fetchAI({
            model: "google/gemini-2.5-flash",
            messages: [...aiMessages, choice.message, ...toolResults],
            stream: true, max_tokens: 500, temperature: 0.7,
          });

          if (finalResponse.ok) {
            await supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_credential_mgmt", tokens_used: 800, model: "google/gemini-2.5-flash" });
            return new Response(finalResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
        }

        if (choice?.message?.content) {
          const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: choice.message.content } }] })}\n\ndata: [DONE]\n\n`;
          await supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_chat", tokens_used: 500, model: "google/gemini-2.5-flash" });
          return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }
      }
    }

    // Normal streaming
    const response = await fetchAI({
      model: "google/gemini-2.5-flash",
      messages: aiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_chat", tokens_used: 500, model: "google/gemini-2.5-flash" });

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("omnix-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
