import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { checkRateLimit, rateLimitResponse, detectPromptInjection, scanToolArguments, securityHeaders } from "../_shared/security.ts";
import { validateAndEnforcePolicy } from "../_shared/policy-engine.ts";
import { autonomousExecute } from "../_shared/tool-executor.ts";

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

// ── Execution tools for THOR ──
const EXECUTION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task assigned to an agent or the user. Use when the user asks to create, add, or register a task, to-do, or action item.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task details" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          category: { type: "string", description: "Category: sales, marketing, support, finance, hr, tech, other" },
          agent_id: { type: "string", description: "Agent to assign. Optional." },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format. Optional." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_report",
      description: "Generate a report based on current data. Use when the user asks for reports, summaries, or analysis documents.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Report title" },
          report_type: { type: "string", enum: ["performance", "financial", "sales", "marketing", "custom"], description: "Type of report" },
          period: { type: "string", description: "Period: today, week, month, quarter" },
        },
        required: ["title", "report_type"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_leads",
      description: "Search for leads or prospects based on criteria. Use when the user asks to find, search, or look up leads or potential clients.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query or criteria" },
          category: { type: "string", description: "Industry or segment filter" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_meeting",
      description: "Schedule a meeting or appointment. Use when the user wants to book, schedule, or arrange a meeting.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title" },
          meeting_date: { type: "string", description: "Date in YYYY-MM-DD" },
          meeting_time: { type: "string", description: "Time in HH:MM" },
          duration_minutes: { type: "number", description: "Duration in minutes. Default 30." },
          participants: { type: "array", items: { type: "string" }, description: "List of participant names/emails" },
          notes: { type: "string", description: "Meeting notes or agenda" },
        },
        required: ["title", "meeting_date", "meeting_time"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_data",
      description: "Analyze internal data (tasks, logs, credits, agents) and return insights. Use when the user asks for analysis, insights, or diagnostics.",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["agents", "tasks", "credits", "logs", "full"], description: "What to analyze" },
        },
        required: ["scope"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delegate_to_agent",
      description: "Delegate a task or mission to a specific agent. Use when orchestrating work between agents.",
      parameters: {
        type: "object",
        properties: {
          agent_id: { type: "string", description: "Target agent ID" },
          mission: { type: "string", description: "What the agent should do" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Mission priority" },
        },
        required: ["agent_id", "mission"],
      },
    },
  },
];

const ALL_TOOLS = [...CREDENTIAL_TOOLS, ...EXECUTION_TOOLS];

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
  adminClient: any, tenantId: string,
): Promise<string> {
  const agentId = args.agent_id || activeAgents[0]?.id;
  if (!agentId && ["save_credentials", "list_credentials", "revoke_credentials"].includes(toolName)) {
    return JSON.stringify({ error: "Nenhum agente ativo encontrado." });
  }
  const agentName = activeAgents.find(a => a.id === agentId)?.name || "THOR";
  const effectiveAgentId = agentId || "00000000-0000-0000-0000-000000000000";

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

    // ── Execution Tools (via Autonomy Engine) ──
    case "create_task": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        const { data, error } = await adminClient.from("agent_tasks").insert({
          user_id: userId, tenant_id: tenantId, agent_id: agentId || null,
          title: args.title, description: args.description || "",
          priority: args.priority || "medium", category: args.category || "other",
          due_date: args.due_date || null,
        }).select("id, title").single();
        if (error) return { success: false, result: { error: error.message } };
        return { success: true, result: { task_id: data.id, title: data.title, message: `Tarefa "${data.title}" criada com sucesso.` } };
      });
      return JSON.stringify(result);
    }

    case "generate_report": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        // Gather data for report
        const [logsRes, tasksRes, creditsRes] = await Promise.all([
          adminClient.from("execution_logs").select("action, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
          adminClient.from("agent_tasks").select("title, status, priority, category").eq("user_id", userId).limit(50),
          adminClient.from("user_credits").select("*").eq("user_id", userId).single(),
        ]);
        const sections = [
          { title: "Resumo de Execuções", content: `${logsRes.data?.length || 0} logs recentes. Sucesso: ${logsRes.data?.filter((l: any) => l.status === "success").length || 0}` },
          { title: "Tarefas", content: `${tasksRes.data?.length || 0} tarefas. Abertas: ${tasksRes.data?.filter((t: any) => t.status === "open").length || 0}` },
          { title: "Créditos", content: `${creditsRes.data?.used_credits || 0}/${creditsRes.data?.total_credits || 0} usados (${creditsRes.data?.plan_type || "free"})` },
        ];
        const { data, error } = await adminClient.from("agent_reports").insert({
          user_id: userId, tenant_id: tenantId, agent_id: agentId || null,
          title: args.title, report_type: args.report_type, period: args.period || "custom",
          sections,
        }).select("id, title").single();
        if (error) return { success: false, result: { error: error.message } };
        return { success: true, result: { report_id: data.id, title: data.title, sections, message: `Relatório "${data.title}" gerado.` } };
      });
      return JSON.stringify(result);
    }

    case "search_leads": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        // Search company board and knowledge base for lead-like data
        const { data: boardResults } = await adminClient.from("company_board")
          .select("title, content, category").eq("user_id", userId)
          .or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`).limit(10);
        const { data: kbResults } = await adminClient.rpc("search_knowledge", {
          _user_id: userId, _query: args.query, _limit: 5,
        });
        return {
          success: true,
          result: {
            board_matches: boardResults?.length || 0,
            knowledge_matches: kbResults?.length || 0,
            results: [...(boardResults || []).map((b: any) => ({ source: "board", title: b.title, preview: b.content.substring(0, 120) })),
                      ...(kbResults || []).map((k: any) => ({ source: "knowledge", title: k.title, preview: k.content.substring(0, 120) }))],
            message: `Encontrados ${(boardResults?.length || 0) + (kbResults?.length || 0)} resultados para "${args.query}".`,
          },
        };
      });
      return JSON.stringify(result);
    }

    case "schedule_meeting": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        const { data, error } = await adminClient.from("agent_meetings").insert({
          user_id: userId, tenant_id: tenantId, agent_id: agentId || null,
          title: args.title, meeting_date: args.meeting_date, meeting_time: args.meeting_time,
          duration_minutes: args.duration_minutes || 30,
          participants: args.participants || [],
          notes: args.notes || "",
        }).select("id, title, meeting_date, meeting_time").single();
        if (error) return { success: false, result: { error: error.message } };
        return { success: true, result: { meeting_id: data.id, title: data.title, date: data.meeting_date, time: data.meeting_time, calendar_link: "https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe", message: `Reunião "${data.title}" agendada para ${data.meeting_date} às ${data.meeting_time}.` } };
      });
      return JSON.stringify(result);
    }

    case "analyze_data": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        const scope = args.scope || "full";
        const analysis: any = {};
        if (scope === "agents" || scope === "full") {
          const { data } = await adminClient.from("agents").select("name, status, tier, total_executions").eq("user_id", userId);
          analysis.agents = { total: data?.length || 0, active: data?.filter((a: any) => a.status === "active").length || 0, total_executions: data?.reduce((s: number, a: any) => s + (a.total_executions || 0), 0) || 0 };
        }
        if (scope === "tasks" || scope === "full") {
          const { data } = await adminClient.from("agent_tasks").select("status, priority").eq("user_id", userId);
          analysis.tasks = { total: data?.length || 0, open: data?.filter((t: any) => t.status === "open").length || 0, high_priority: data?.filter((t: any) => t.priority === "high").length || 0 };
        }
        if (scope === "credits" || scope === "full") {
          const { data } = await adminClient.from("user_credits").select("*").eq("user_id", userId).single();
          analysis.credits = data ? { used: data.used_credits, total: data.total_credits, pct: Math.round((data.used_credits / data.total_credits) * 100), plan: data.plan_type } : null;
        }
        if (scope === "logs" || scope === "full") {
          const { data } = await adminClient.from("execution_logs").select("status").eq("user_id", userId).limit(100);
          const success = data?.filter((l: any) => l.status === "success").length || 0;
          analysis.logs = { total: data?.length || 0, success, errors: (data?.length || 0) - success, success_rate: data?.length ? Math.round((success / data.length) * 100) : 100 };
        }
        return { success: true, result: { scope, analysis, message: `Análise de ${scope} completa.` } };
      });
      return JSON.stringify(result);
    }

    case "delegate_to_agent": {
      const result = await autonomousExecute(toolName, args, adminClient, userId, tenantId, effectiveAgentId, agentName, async () => {
        const targetAgent = activeAgents.find(a => a.id === args.agent_id);
        if (!targetAgent) return { success: false, result: { error: `Agente ${args.agent_id} não encontrado ou inativo.` } };
        // Create a task for the target agent
        const { data, error } = await adminClient.from("agent_tasks").insert({
          user_id: userId, tenant_id: tenantId, agent_id: args.agent_id,
          title: `[Delegado] ${args.mission}`, description: `Missão delegada pelo THOR: ${args.mission}`,
          priority: args.priority || "medium", category: "delegation",
        }).select("id, title").single();
        if (error) return { success: false, result: { error: error.message } };
        // Notify
        await adminClient.from("notifications").insert({
          user_id: userId, type: "agent_delegation",
          title: `🔀 Missão delegada: ${targetAgent.name}`,
          message: `THOR delegou para ${targetAgent.name}: ${args.mission}`,
          metadata: { agent_id: args.agent_id, task_id: data.id },
        });
        return { success: true, result: { task_id: data.id, agent_name: targetAgent.name, mission: args.mission, message: `Missão delegada para ${targetAgent.name}.` } };
      });
      return JSON.stringify(result);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const startTime = Date.now();
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse body early before any async work
    let messages: any[], config: any, imageBase64: string | null = null;
    try {
      const body = await req.json();
      messages = body.messages;
      config = body.config;
      imageBase64 = body.image || null; // base64 JPEG frame from webcam
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit by user ID, not IP
    const rl = checkRateLimit(`omnix:${user.id}`, 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    // ── PromptInjectionGuard: scan last user message ──
    const lastUserContent = (messages || []).filter((m: any) => m.role === "user").pop()?.content || "";
    const injectionCheck = detectPromptInjection(lastUserContent);
    if (injectionCheck.blocked) {
      console.warn(`[PromptInjectionGuard] Blocked injection from user ${user.id}: ${injectionCheck.pattern}`);
      return new Response(
        JSON.stringify({ error: injectionCheck.message }),
        { status: 403, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
      );
    }

    const policyResult = await validateAndEnforcePolicy(supabase, user.id, "omnix-orchestrator", "chat");
    if (!policyResult.allowed) {
      return new Response(JSON.stringify({ error: policyResult.reason }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lastUserMessage = (messages || []).filter((m: any) => m.role === "user").pop()?.content?.toLowerCase?.() || "";
    const platformIntentRegex = /(agente|tarefa|relat[óo]rio|cr[ée]dito|plano|dashboard|empresa|neg[óo]cio|vendas|opera[cç][ãa]o|squad|automa[cç][ãa]o|integra[cç][ãa]o|lead|reuni[aã]o|board|an[aá]lise|meta|thor|omnix|clauthor|plataforma)/i;
    const toolIntentRegex = /(criar|crie|cria|gera|gerar|agendar|delegar|buscar|procurar|analisar|salvar|revogar|remover|deletar|executar|fazer agora|agenda|task|report|credentials?|configur|ativ|lista|mostr|ver credenciais|exclu|cancel)/i;

    const needsOperationalContext = platformIntentRegex.test(lastUserMessage);
    // Tools trigger on EITHER explicit tool verbs OR platform context + action verbs
    const shouldAttemptTools = toolIntentRegex.test(lastUserMessage) || (needsOperationalContext && lastUserMessage.length > 15);

    let agents: any[] = [];
    let credits: any = null;
    let tasks: any[] = [];
    let activeAgents: any[] = [];
    let usagePct = 0;
    let openTasks = 0;
    let highPriorityTasks = 0;

    if (needsOperationalContext) {
      const [agentsRes, creditsRes, tasksRes] = await Promise.all([
        supabase.from("agents").select("id, name, status, tier, total_executions, description").eq("user_id", user.id),
        supabase.from("user_credits").select("*").eq("user_id", user.id).single(),
        supabase.from("agent_tasks").select("title, status, priority, category, due_date").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);

      agents = agentsRes.data || [];
      credits = creditsRes.data;
      tasks = tasksRes.data || [];

      activeAgents = agents.filter(a => a.status === "active");
      openTasks = tasks.filter(t => t.status === "open").length;
      highPriorityTasks = tasks.filter(t => t.priority === "high").length;
      usagePct = credits ? Math.round((credits.used_credits / credits.total_credits) * 100) : 0;
    }

    const agentName = config?.name || "THOR";
    const tone = config?.tone || "estratégico";
    const responseStyle = config?.responseStyle || "direto";
    const autonomy = config?.autonomy || "analisar e sugerir";

    const operationalContext = needsOperationalContext
      ? `\nCONTEXTO OPERACIONAL (use só se ajudar):\n- Agentes ativos: ${activeAgents.length}/${agents.length}\n- Créditos: ${usagePct}% (${credits?.plan_type || "free"})\n- Tarefas abertas: ${openTasks}${highPriorityTasks ? ` | urgentes: ${highPriorityTasks}` : ""}`
      : "";

    const systemPrompt = `Você é ${agentName}, CEO-sócio e parceiro de negócios do usuário: humano, confiante e natural.

REGRAS DE CONVERSA:
- Responda em português brasileiro de forma clara e completa.
- Vá direto ao ponto mas cubra o que o usuário pediu — não corte respostas pela metade.
- NUNCA responda apenas "Opa, desculpa" ou frases genéricas vazias. Sempre entregue conteúdo útil.
- Se o usuário pedir algo (gerar leads, criar tarefa, relatório), EXECUTE usando as tools disponíveis e explique o que fez.
- Se o usuário reclamar que algo não foi feito, reconheça, peça desculpas e execute imediatamente.
- Se o tema for geral (vida, mercado, rotina), converse normal sem puxar plataforma à força.
- Pode dar opinião sobre negócios/tecnologia; em política partidária, mantenha neutralidade.
- Feche com energia de parceiro: direto, firme e amigável.
${imageBase64 ? "- VISÃO ATIVA: Você está vendo o usuário pela webcam. Comente naturalmente só se relevante." : ""}

ESTILO: tom ${tone} | formato ${responseStyle} | autonomia ${autonomy}.${operationalContext}

Quando houver pedido claro de ação na plataforma, use tools com segurança e sem expor credenciais.`;

    // Trim conversation history to last 30 messages to avoid context overflow
    const trimmedMessages = messages.length > 30 ? messages.slice(-30) : messages;

    // Build AI messages — include image in last user message if available
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const m of trimmedMessages) {
      if (m === trimmedMessages[trimmedMessages.length - 1] && m.role === "user" && imageBase64) {
        // Multimodal message with image
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        });
      } else {
        aiMessages.push({ role: m.role, content: m.content });
      }
    }

    // Use vision-capable model when image is present, otherwise use flash for quality
    const chatModel = imageBase64 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    // ── Tool-calling somente quando há intenção operacional explícita ──
    if (shouldAttemptTools) {
      const toolResponse = await fetchAI({
        model: chatModel,
        messages: aiMessages,
        stream: false,
        max_tokens: 1200,
        temperature: 0.2,
        tools: ALL_TOOLS,
        tool_choice: "auto",
      }, {
        complexity: "auto",
      });

      if (toolResponse.ok) {
        const toolData = await toolResponse.json();
        const choice = toolData.choices?.[0];
        const toolCalls = choice?.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          const { data: tenantData } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
          const tenantId = tenantData || "00000000-0000-0000-0000-000000000000";

          const toolResults: any[] = [];
          for (const tc of toolCalls) {
            let args: any;
            try {
              args = JSON.parse(tc.function.arguments);
            } catch {
              toolResults.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "Argumentos inválidos da IA" }) });
              continue;
            }

            const toolScan = scanToolArguments(tc.function.name, args);
            if (!toolScan.safe) {
              console.warn(`[FeatherShield] Blocked tool "${tc.function.name}" for user ${user.id}: ${toolScan.threats.join("; ")}`);
              toolResults.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "Argumentos bloqueados pela política de segurança.", threats: toolScan.threats }) });
              continue;
            }

            const result = await handleToolCall(tc.function.name, args, user.id, activeAgents, supabaseUrl, authHeader, supabase, tenantId);
            toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
          }

          const finalResponse = await fetchAI({
            model: chatModel,
            messages: [...aiMessages, choice.message, ...toolResults],
            stream: true,
            max_tokens: 1200,
            temperature: 0.25,
          }, {
            complexity: "auto",
          });

          if (finalResponse.ok) {
            const toolMgmtTokens = (toolData.usage?.total_tokens || 300) + 380;
            supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_tool_exec", tokens_used: toolMgmtTokens, model: chatModel }).then(() => {});
            if (activeAgents[0]?.id) {
              supabase.from("execution_logs").insert({
                user_id: user.id,
                agent_id: activeAgents[0].id,
                action: "tool_execution",
                status: "success",
                execution_time_ms: Date.now() - startTime,
                details: { type: "omnix_tool_exec", tool_calls: toolCalls.map((tc: any) => tc.function.name) },
              }).then(() => {});
            }
            return new Response(finalResponse.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
          }
        }

        if (choice?.message?.content) {
          const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: choice.message.content } }] })}\n\ndata: [DONE]\n\n`;
          const directTokens = toolData.usage?.total_tokens || 220;
          supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_chat", tokens_used: directTokens, model: chatModel }).then(() => {});
          if (activeAgents[0]?.id) {
            supabase.from("execution_logs").insert({
              user_id: user.id,
              agent_id: activeAgents[0].id,
              action: "chat",
              status: "success",
              execution_time_ms: Date.now() - startTime,
              details: { type: "omnix_chat_direct" },
            }).then(() => {});
          }
          return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
        }
      }
    }

    // Resposta direta por streaming (rápida para conversa natural)
    const response = await fetchAI({
      model: chatModel,
      messages: aiMessages,
      stream: true,
      temperature: 0.25,
      max_tokens: 1200,
    }, {
      complexity: "auto",
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Estimate tokens conservatively (avoid over-charging)
    const inputTokens = (messages || []).reduce((sum: number, m: any) => sum + Math.ceil((m.content?.length || 0) / 4), 0);
    const omnixEstimatedTokens = inputTokens + 400;

    supabase.from("token_usage").insert({ user_id: user.id, action_type: "omnix_chat", tokens_used: omnixEstimatedTokens, model: chatModel }).then(() => {});
    if (activeAgents[0]?.id) {
      supabase.from("execution_logs").insert({
        user_id: user.id,
        agent_id: activeAgents[0].id,
        action: "chat",
        status: "success",
        execution_time_ms: Date.now() - startTime,
        details: { type: "omnix_chat_stream", model: chatModel },
      }).then(() => {});
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("omnix-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
