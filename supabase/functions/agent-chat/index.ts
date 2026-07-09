import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI, classifyTaskComplexity, selectModel, type QualityMode } from "../_shared/ai-gateway.ts";
import { checkRateLimit, securityHeaders, rateLimitResponse } from "../_shared/security.ts";
import { withRetry, alertFailure, createExecutionTracker } from "../_shared/resilience.ts";
import { buildAgentContract, inferAgentArea, getAreaLimits, getTierSLA, getDepartmentScope, getAreaTone, type AgentContract } from "../_shared/agent-contract.ts";
import { enforcePolicy, validateTenant, type PolicyContext } from "../_shared/policy-engine.ts";
import { autonomousExecute } from "../_shared/tool-executor.ts";
import { executeIntegration, getDecryptedCredentials, type IntegrationResponse } from "../_shared/integration-router.ts";
import { getLegalPrompt } from "../_shared/legal-prompts.ts";
import { resolveDepartmentPromptForAgent } from "../_shared/department-prompts.ts";
import { incrementAgentUsage, resolvePriceTier, type AgentUsageResult } from "../_shared/metered-billing.ts";

import { decryptValueForExecution } from "./crypto.ts";
import { corsHeaders, handleCors, jsonResponse, errorResponse, streamResponse } from "../_shared/cors.ts";

// ── Episodic memory (long-term) helpers ───────────────────────────────────
const EPISODIC_EMBED_MODEL = "openai/text-embedding-3-small";

async function embedEpisodic(text: string): Promise<number[] | null> {
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return null;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EPISODIC_EMBED_MODEL, input: text.slice(0, 8000) }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch { return null; }
}

async function recallEpisodicMemories(
  adminClient: any, tenantId: string, agentId: string, query: string, topK = 5
): Promise<string> {
  try {
    if (!query || query.length < 3) return "";
    const embedding = await embedEpisodic(query);
    if (!embedding) return "";
    const { data, error } = await adminClient.rpc("recall_episodic_memories", {
      _tenant_id: tenantId,
      _agent_id: agentId,
      _query_embedding: embedding,
      _subject_entity: null,
      _limit: topK,
    });
    if (error || !data || data.length === 0) return "";
    // Fire-and-forget reinforcement
    const ids = data.map((m: any) => m.id);
    adminClient.from("agent_memories_episodic")
      .update({ last_accessed_at: new Date().toISOString() })
      .in("id", ids)
      .then(() => {})
      .catch(() => {});
    const lines = data.map((m: any) =>
      `- [${m.event_type}${m.outcome ? "/" + m.outcome : ""}] ${m.content.slice(0, 280)}`
    );
    return "\n\n## MEMÓRIA DE LONGO PRAZO (interações passadas relevantes):\n" + lines.join("\n");
  } catch (e) {
    console.warn("[episodic recall] error:", e);
    return "";
  }
}

async function writeEpisodicMemory(
  adminClient: any, tenantId: string, agentId: string, userId: string,
  userMessage: string, assistantMessage: string, hadTools: boolean
): Promise<void> {
  try {
    const content = `Usuário: ${userMessage.slice(0, 1000)}\nAgente: ${assistantMessage.slice(0, 1500)}`;
    const embedding = await embedEpisodic(content);
    let importance = 0.4;
    if (hadTools) importance += 0.25;
    if (content.length > 800) importance += 0.1;
    if (content.length > 2000) importance += 0.1;
    importance = Math.min(1, importance);
    await adminClient.from("agent_memories_episodic").insert({
      tenant_id: tenantId,
      agent_id: agentId,
      user_id: userId,
      event_type: hadTools ? "tool_call" : "conversation",
      content,
      embedding,
      embedding_model: EPISODIC_EMBED_MODEL,
      importance,
      outcome: "neutral",
    });
  } catch (e) {
    console.warn("[episodic write] error:", e);
  }
}



// SAFETY_LAYER, OPERATIONAL_SECURITY_PROTOCOL: static system-prompt blocks (see ./prompts.ts)
// PLAN_LIMITS + helpers + validateInput: pure runtime limits (see ./limits.ts)
import { SAFETY_LAYER, OPERATIONAL_SECURITY_PROTOCOL } from "./prompts.ts";
import {
  getPlanLimits,
  applyHistoryWindow,
  truncateOlderMessages,
  validateInput,
} from "./limits.ts";

// AGENT_TOOLS: JSON tool-call schemas (see ./tools.ts)
// TOOL_INTEGRATION_MAP + helpers: external routing (see ./integration-map.ts)
import { AGENT_TOOLS } from "./tools.ts";
import { tryExternalIntegration } from "./integration-map.ts";

// === COMPANY BOARD CONTEXT LOADER ===
async function loadCompanyBoard(adminClient: any, userId: string): Promise<string> {
  const { data, error } = await adminClient
    .from("company_board")
    .select("title, content, category, metadata")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) {
    return "\n## DADOS DA EMPRESA: Nenhum dado cadastrado no Company Board. Use APENAS informações fornecidas pelo usuário na conversa.\n";
  }

  const grouped: Record<string, string[]> = {};
  for (const item of data) {
    const cat = item.category || "geral";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`- **${item.title}**: ${item.content}${item.metadata ? ` (${JSON.stringify(item.metadata)})` : ""}`);
  }

  let context = "\n## DADOS REAIS DA EMPRESA (Company Board - USE ESTES DADOS, NÃO INVENTE):\n";
  for (const [cat, items] of Object.entries(grouped)) {
    context += `### ${cat.toUpperCase()}\n${items.join("\n")}\n`;
  }
  context += "\n⚠️ OBRIGATÓRIO: Baseie TODAS as análises, relatórios e respostas financeiras EXCLUSIVAMENTE nos dados acima. Se um dado não estiver aqui, diga que não está disponível.\n";
  return context;
}

// === AGENT-TO-AGENT DELEGATION ===
async function delegateToAgent(
  args: any,
  adminClient: any,
  userId: string,
  tenantId: string,
  sourceAgentId: string,
  depth: number = 0
): Promise<{ success: boolean; result: any }> {
  const MAX_DEPTH = 3;
  if (depth >= MAX_DEPTH) {
    return { success: false, result: { error: "Limite máximo de delegação atingido (3 níveis)." } };
  }

  const timestamp = new Date().toISOString();

  const { data: agents, error: agentsError } = await adminClient
    .from("agents")
    .select("id, name, instructions, objective, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (agentsError || !agents || agents.length === 0) {
    return { success: false, result: { error: "No active agents found for delegation." } };
  }

  const targetName = args.target_agent_name.toLowerCase();
  const targetAgent = agents.find((a: any) =>
    a.name.toLowerCase().includes(targetName) || targetName.includes(a.name.toLowerCase())
  ) || agents.find((a: any) => {
    const words = targetName.split(/\s+/);
    return words.some((w: string) => a.name.toLowerCase().includes(w) && w.length > 2);
  });

  if (!targetAgent) {
    const availableNames = agents.map((a: any) => a.name).join(", ");
    return { success: false, result: { error: `Agent "${args.target_agent_name}" not found. Available: ${availableNames}` } };
  }

  if (targetAgent.id === sourceAgentId) {
    return { success: false, result: { error: "An agent cannot delegate to itself." } };
  }

  console.log(`[A2A] Delegating to ${targetAgent.name} (depth ${depth})`);

  try {
    await adminClient.from("execution_logs").insert({
      user_id: userId, agent_id: sourceAgentId,
      action: `delegation:${targetAgent.name}`, status: "success",
      details: { type: "agent_to_agent", target_agent: targetAgent.id, task: args.task_description, depth, timestamp },
      execution_time_ms: 0,
    });
  } catch {}

  // Load company board for delegated agent too
  const companyContext = await loadCompanyBoard(adminClient, userId);

  const delegatedPrompt = `${targetAgent.instructions || "You are a professional assistant."}
${companyContext}
## DELEGATION CONTEXT:
Task: ${args.task_description}
Additional context: ${args.context || "None"}
Priority: ${args.priority || "normal"}

Execute the task and return the result clearly. Respond in English.`;

  const delegatedResponse = await fetchAI({
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: delegatedPrompt },
      { role: "user", content: args.task_description },
    ],
    tools: AGENT_TOOLS,
    max_tokens: 1024,
    stream: false,
  });

  if (!delegatedResponse.ok) {
    return { success: false, result: { error: `Falha ao executar agente delegado: HTTP ${delegatedResponse.status}` } };
  }

  const delegatedData = await delegatedResponse.json();
  const delegatedChoice = delegatedData.choices?.[0];
  let delegatedMessage = delegatedChoice?.message?.content || "";
  const delegatedToolCalls = delegatedChoice?.message?.tool_calls;
  const subToolResults: any[] = [];

  if (delegatedToolCalls && delegatedToolCalls.length > 0) {
    for (const tc of delegatedToolCalls) {
      const fnName = tc.function?.name;
      let fnArgs: any = {};
      try { fnArgs = JSON.parse(tc.function?.arguments || "{}"); } catch { fnArgs = {}; }

      if (fnName === "delegate_to_agent") {
        const subResult = await delegateToAgent(fnArgs, adminClient, userId, tenantId, targetAgent.id, depth + 1);
        subToolResults.push({ tool_call_id: tc.id, tool_name: fnName, args: fnArgs, ...subResult });
      } else {
        const result = await executeTool(fnName, fnArgs, adminClient, userId, tenantId, targetAgent.id);
        subToolResults.push({ tool_call_id: tc.id, tool_name: fnName, args: fnArgs, ...result });
      }
    }

    const toolMessages = delegatedToolCalls.map((tc: any, i: number) => ({
      role: "tool", tool_call_id: tc.id, content: JSON.stringify(subToolResults[i]?.result || {}),
    }));

    const finalResponse = await fetchAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: delegatedPrompt },
        { role: "user", content: args.task_description },
        delegatedChoice.message,
        ...toolMessages,
      ],
      max_tokens: 1024,
      stream: false,
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      delegatedMessage = finalData.choices?.[0]?.message?.content || delegatedMessage;
    }
  }

  try {
    await adminClient.from("agent_memory").insert({
      tenant_id: tenantId, user_id: userId, agent_id: targetAgent.id,
      memory_type: "delegation",
      content: { source_agent: sourceAgentId, task: args.task_description, response: delegatedMessage?.slice(0, 500), timestamp },
    });
  } catch {}

  return {
    success: true,
    result: {
      target_agent: targetAgent.name, task: args.task_description,
      response: delegatedMessage, depth, completed_at: new Date().toISOString(),
    },
  };
}

// TOOL_INTEGRATION_MAP + mapToolArgsToIntegrationParams + tryExternalIntegration
// live in ./integration-map.ts — imported at the top of this file.

// === REAL TOOL EXECUTION ===
async function executeTool(
  toolName: string, args: any,
  adminClient: any, userId: string, tenantId: string, agentId: string,
  policyContext?: PolicyContext, usedCredits?: number, totalCredits?: number
): Promise<{ success: boolean; result: any }> {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  // === POLICY ENGINE: Enforce before execution ===
  if (policyContext && usedCredits !== undefined && totalCredits !== undefined) {
    const policyResult = await enforcePolicy(adminClient, policyContext, toolName, usedCredits, totalCredits);
    if (!policyResult.allowed) {
      console.warn(`[PolicyEngine] BLOCKED tool=${toolName} reason=${policyResult.reason}`);
      await logExecution(adminClient, userId, agentId, toolName, args, startTime, "blocked");
      return {
        success: false,
        result: {
          error: policyResult.reason,
          suggest_upgrade: policyResult.suggestUpgrade || false,
          required_tier: policyResult.requiredTier,
          required_plan: policyResult.requiredPlan,
          blocked_by: "policy_engine",
        },
      };
    }
  }

  // === INTEGRATION ROUTER: Try external API first ===
  try {
    const extResult = await tryExternalIntegration(toolName, args, adminClient, userId, agentId);
    if (extResult && extResult.success) {
      console.log(`[IntegrationBridge] ${toolName} executed via external API`);
      await logExecution(adminClient, userId, agentId, `${toolName}:external`, args, startTime, "success");

      // Also persist locally for tools that save to DB (create_task, schedule_meeting)
      // The external result enriches the response
      return {
        success: true,
        result: {
          ...extResult.data,
          executed_via: "external_integration",
          note: `Ação executada via integração externa.`,
        },
      };
    }
    // If extResult exists but failed, log and fall through to local execution
    if (extResult && !extResult.success) {
      console.warn(`[IntegrationBridge] ${toolName} external failed: ${extResult.error}, falling back to local`);
    }
  } catch (e) {
    console.warn(`[IntegrationBridge] ${toolName} bridge error, falling back:`, e instanceof Error ? e.message : e);
  }

  // Audit credential access for tools that require credentials
  const credentialTools = ["send_email", "search_leads", "schedule_meeting"];
  if (credentialTools.includes(toolName)) {
    try {
      await adminClient.from("credential_audit_logs").insert({
        user_id: userId,
        agent_id: agentId,
        integration_name: toolName,
        credential_key: "tool_execution",
        action: "tool_access",
        metadata: { tool: toolName, args_keys: Object.keys(args), timestamp },
      });
    } catch {} // Non-blocking audit
  }

  try {
    // Retry tool execution once on transient failures
    return await withRetry(async () => {
    switch (toolName) {
      case "send_email": {
        // === REAL EMAIL BRIDGE via credential-manager ===
        let emailSent = false;
        let sendError = "";
        let providerUsed = "";
        const messageId = crypto.randomUUID().slice(0, 8);

        try {
          // 1. Fetch decrypted credentials (hybrid: client > platform fallback)
          const { data: clientCreds } = await adminClient
            .from("agent_credentials")
            .select("integration_name, credential_key, credential_value")
            .eq("agent_id", agentId)
            .eq("user_id", userId);

          const { data: platformCreds } = await adminClient
            .from("platform_credentials")
            .select("integration_name, credential_key, credential_value")
            .eq("is_active", true);

          // Build merged credentials map (platform defaults, client overrides)
          const credMap: Record<string, Record<string, string>> = {};
          for (const cred of platformCreds || []) {
            try {
              const val = cred.credential_value.startsWith("senc:v1:")
                ? await decryptValueForExecution(cred.credential_value)
                : cred.credential_value;
              if (!credMap[cred.integration_name]) credMap[cred.integration_name] = {};
              credMap[cred.integration_name][cred.credential_key] = val;
            } catch {}
          }
          for (const cred of clientCreds || []) {
            try {
              const val = cred.credential_value.startsWith("senc:v1:")
                ? await decryptValueForExecution(cred.credential_value)
                : cred.credential_value;
              if (!credMap[cred.integration_name]) credMap[cred.integration_name] = {};
              credMap[cred.integration_name][cred.credential_key] = val;
            } catch {}
          }

          // 2. Try providers in priority order: SendGrid → Resend → Mailgun → SMTP
          const fromEmail = credMap["sendgrid"]?.["from_email"] || credMap["resend"]?.["from_email"]
            || credMap["email"]?.["from_email"] || credMap["smtp"]?.["from_email"] || "noreply@clauthor.com";
          const fromName = credMap["sendgrid"]?.["from_name"] || credMap["resend"]?.["from_name"]
            || credMap["email"]?.["from_name"] || credMap["smtp"]?.["from_name"] || "Clauthor AI";

          // --- SENDGRID ---
          const sgKey = credMap["sendgrid"]?.["api_key"] || credMap["sendgrid"]?.["SENDGRID_API_KEY"] || credMap["sendgrid"]?.["sendgrid_api_key"];
          if (!emailSent && sgKey) {
            const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: { "Authorization": `Bearer ${sgKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: args.to }] }],
                from: { email: fromEmail, name: fromName },
                subject: args.subject,
                content: [{ type: "text/plain", value: args.body }, { type: "text/html", value: args.body.replace(/\n/g, "<br/>") }],
              }),
            });
            if (r.ok || r.status === 202) { emailSent = true; providerUsed = "SendGrid"; }
            else { sendError = `SendGrid ${r.status}: ${(await r.text()).slice(0, 200)}`; }
          }

          // --- RESEND ---
          const resendKey = credMap["resend"]?.["api_key"] || credMap["resend"]?.["RESEND_API_KEY"];
          if (!emailSent && resendKey) {
            const r = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [args.to],
                subject: args.subject,
                text: args.body,
                html: args.body.replace(/\n/g, "<br/>"),
              }),
            });
            if (r.ok) { emailSent = true; providerUsed = "Resend"; }
            else { sendError = `Resend ${r.status}: ${(await r.text()).slice(0, 200)}`; }
          }

          // --- MAILGUN ---
          const mgKey = credMap["mailgun"]?.["api_key"] || credMap["mailgun"]?.["MAILGUN_API_KEY"];
          const mgDomain = credMap["mailgun"]?.["domain"] || credMap["mailgun"]?.["MAILGUN_DOMAIN"];
          if (!emailSent && mgKey && mgDomain) {
            const form = new URLSearchParams();
            form.set("from", `${fromName} <${fromEmail}>`);
            form.set("to", args.to);
            form.set("subject", args.subject);
            form.set("text", args.body);
            form.set("html", args.body.replace(/\n/g, "<br/>"));
            const r = await fetch(`https://api.mailgun.net/v3/${mgDomain}/messages`, {
              method: "POST",
              headers: { "Authorization": `Basic ${btoa(`api:${mgKey}`)}` },
              body: form,
            });
            if (r.ok) { emailSent = true; providerUsed = "Mailgun"; }
            else { sendError = `Mailgun ${r.status}: ${(await r.text()).slice(0, 200)}`; }
          }

          // --- GENERIC EMAIL (fallback key detection) ---
          const genericKey = credMap["email"]?.["api_key"] || credMap["smtp"]?.["api_key"];
          if (!emailSent && genericKey) {
            // Try as Resend-compatible API
            const r = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Authorization": `Bearer ${genericKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [args.to],
                subject: args.subject,
                text: args.body,
              }),
            });
            if (r.ok) { emailSent = true; providerUsed = "Email API"; }
            else { sendError = `Email API ${r.status}: ${(await r.text()).slice(0, 200)}`; }
          }

          if (!emailSent && !sendError) {
            sendError = "Nenhuma credencial de email configurada (SendGrid, Resend, ou Mailgun).";
          }
        } catch (e) {
          sendError = e instanceof Error ? e.message : "Erro desconhecido ao enviar email";
          console.error("[SendEmail] Bridge error:", e);
        }

        // 3. Always create notification as audit trail
        await adminClient.from("notifications").insert({
          user_id: userId,
          title: emailSent ? `✅ Email enviado para ${args.to}` : `📧 Email para ${args.to}`,
          message: `Assunto: ${args.subject}\n\n${args.body}`,
          type: emailSent ? "email_sent" : "email_queued",
          metadata: {
            to: args.to, subject: args.subject, priority: args.priority || "normal",
            agent_id: agentId, message_id: messageId,
            sent: emailSent, provider: providerUsed || undefined, error: sendError || undefined,
          },
        });

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        return {
          success: emailSent,
          result: {
            status: emailSent ? "sent" : "no_provider",
            message_id: messageId,
            to: args.to, subject: args.subject, priority: args.priority || "normal",
            sent_at: emailSent ? timestamp : undefined,
            queued_at: !emailSent ? timestamp : undefined,
            note: emailSent
              ? `Email enviado com sucesso via ${providerUsed}.`
              : `Email registrado como notificação. ${sendError}`,
            provider: providerUsed || undefined,
          },
        };
      }

      case "create_task": {
        const { data: task, error } = await adminClient.from("agent_tasks").insert({
          user_id: userId, agent_id: agentId, tenant_id: tenantId,
          title: args.title,
          description: args.description || "",
          priority: args.priority || "medium",
          category: args.category || "other",
          due_date: args.due_date || null,
          assigned_to: args.assigned_to || null,
        }).select("id, title, priority, status, due_date, category, created_at").single();

        if (error) throw error;

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        return {
          success: true,
          result: {
            task_id: task.id,
            title: task.title, priority: task.priority, status: task.status,
            due_date: task.due_date, category: task.category,
            created_at: task.created_at,
            persisted: true,
          },
        };
      }

      case "generate_report": {
        const { data: report, error } = await adminClient.from("agent_reports").insert({
          user_id: userId, agent_id: agentId, tenant_id: tenantId,
          title: args.title,
          report_type: args.report_type,
          period: args.period || "",
          sections: args.sections || [],
        }).select("id, title, report_type, period, created_at").single();

        if (error) throw error;

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        return {
          success: true,
          result: {
            report_id: report.id,
            title: report.title, type: report.report_type, period: report.period,
            sections: args.sections,
            generated_at: report.created_at,
            persisted: true,
          },
        };
      }

      case "search_leads": {
        // Search leads from company_board data
        const { data: boardData } = await adminClient.from("company_board")
          .select("title, content, category, metadata")
          .eq("user_id", userId)
          .or(`category.eq.leads,category.eq.clientes,category.eq.vendas,title.ilike.%${args.query}%,content.ilike.%${args.query}%`)
          .limit(args.max_results || 10);

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        const leads = (boardData || []).map((item: any) => ({
          name: item.title,
          details: item.content,
          category: item.category,
          metadata: item.metadata,
        }));

        return {
          success: true,
          result: {
            query: args.query,
            filters: { industry: args.industry, location: args.location, company_size: args.company_size },
            total_found: leads.length,
            leads,
            source: "company_board",
            searched_at: timestamp,
            note: leads.length === 0
              ? "Nenhum lead encontrado no Company Board. Cadastre dados de prospects no board para resultados reais."
              : undefined,
          },
        };
      }

      case "schedule_meeting": {
        const { data: meeting, error } = await adminClient.from("agent_meetings").insert({
          user_id: userId, agent_id: agentId, tenant_id: tenantId,
          title: args.title,
          meeting_date: args.date,
          meeting_time: args.time,
          duration_minutes: args.duration_minutes || 30,
          meeting_type: args.meeting_type || "video_call",
          participants: args.participants || [],
          notes: args.notes || "",
        }).select("id, title, meeting_date, meeting_time, duration_minutes, meeting_type, status, created_at").single();

        if (error) throw error;

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        return {
          success: true,
          result: {
            meeting_id: meeting.id,
            title: meeting.title,
            date: meeting.meeting_date, time: meeting.meeting_time,
            duration: `${meeting.duration_minutes} minutos`,
            type: meeting.meeting_type,
            participants: args.participants || [],
            scheduled_at: meeting.created_at,
            persisted: true,
          },
        };
      }

      case "analyze_data": {
        // Pull real data from company_board for analysis
        const { data: boardData } = await adminClient.from("company_board")
          .select("title, content, category, metadata, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(30);

        // Pull recent execution stats
        const { data: execStats } = await adminClient.from("execution_logs")
          .select("action, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        // Pull task stats
        const { data: taskStats } = await adminClient.from("agent_tasks")
          .select("status, priority, category")
          .eq("user_id", userId);

        await logExecution(adminClient, userId, agentId, toolName, args, startTime);

        return {
          success: true,
          result: {
            analysis_type: args.analysis_type,
            source: args.data_source,
            period: args.period,
            question: args.question,
            company_data: (boardData || []).map((d: any) => ({
              title: d.title, content: d.content, category: d.category, metadata: d.metadata,
            })),
            execution_summary: {
              total_executions: (execStats || []).length,
              success_rate: execStats ? Math.round(execStats.filter((e: any) => e.status === "success").length / Math.max(execStats.length, 1) * 100) : 0,
            },
            task_summary: {
              total: (taskStats || []).length,
              open: (taskStats || []).filter((t: any) => t.status === "open").length,
              done: (taskStats || []).filter((t: any) => t.status === "done").length,
            },
            analyzed_at: timestamp,
            source_note: "Dados reais do Company Board e logs de execução.",
          },
        };
      }

      default:
        return { success: false, result: { error: `Tool ${toolName} not implemented` } };
    }
    }, { maxRetries: 1, baseDelayMs: 500 });
  } catch (err) {
    console.error(`Tool ${toolName} error:`, err);
    await logExecution(adminClient, userId, agentId, toolName, args, startTime, "error");
    // Alert user about failure
    await alertFailure(adminClient, userId, agentId, toolName, err instanceof Error ? err.message : "unknown", { args });
    return { success: false, result: { error: `Erro ao executar ${toolName}: ${err instanceof Error ? err.message : "unknown"}` } };
  }
}

async function logExecution(adminClient: any, userId: string, agentId: string, toolName: string, args: any, startTime: number, status = "success") {
  try {
    await adminClient.from("execution_logs").insert({
      user_id: userId, agent_id: agentId,
      action: `tool:${toolName}`, status,
      details: { tool: toolName, args, timestamp: new Date().toISOString() },
      execution_time_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error("Error logging execution:", err);
  }
}

// === MULTI-TENANT VALIDATION ===
async function validateTenantAccess(adminClient: any, userId: string, agentId: string | null): Promise<{ valid: boolean; tenantId: string | null; error?: string }> {
  const { data: membership, error: memberError } = await adminClient
    .from("tenant_members").select("tenant_id, role").eq("user_id", userId).limit(1).single();

  if (memberError || !membership) {
    return { valid: false, tenantId: null, error: "Usuário não pertence a nenhum tenant." };
  }

  if (agentId) {
    const { data: agent, error: agentError } = await adminClient
      .from("agents").select("id, user_id").eq("id", agentId).single();

    if (agentError || !agent) return { valid: false, tenantId: membership.tenant_id, error: "Agente não encontrado." };
    if (agent.user_id !== userId) {
      console.error(`SECURITY: User ${userId} tried to access agent ${agentId} owned by ${agent.user_id}`);
      return { valid: false, tenantId: membership.tenant_id, error: "Acesso negado." };
    }
  }

  return { valid: true, tenantId: membership.tenant_id };
}

async function saveMemory(adminClient: any, tenantId: string, userId: string, agentId: string, userMessage: string, assistantMessage: string) {
  try {
    await adminClient.from("agent_memory").insert({
      tenant_id: tenantId, user_id: userId, agent_id: agentId,
      memory_type: "conversation",
      content: { user: userMessage, assistant: assistantMessage, timestamp: new Date().toISOString() },
    });
  } catch (err) { console.error("Error saving memory:", err); }
}

async function appendAudit(
  adminClient: any, tenantId: string, agentId: string | null, agentName: string,
  userId: string, userMsg: string, assistantMsg: string, tokens: number
) {
  try {
    await adminClient.rpc("append_audit_entry", {
      _tenant_id: tenantId,
      _agent_id: agentId,
      _agent_name: agentName,
      _action_type: "chat_completion",
      _input: { prompt: userMsg.slice(0, 2000) },
      _output: { response: assistantMsg.slice(0, 2000), tokens },
      _status: "success",
      _cost: tokens,
      _user_id: userId,
    });
  } catch (err) { console.error("Audit append failed:", err); }
}

async function loadRecentMemory(adminClient: any, tenantId: string, userId: string, agentId: string, limit: number = 5): Promise<string> {
  // Load all memory types: conversation, semantic, procedural, delegation
  const { data, error } = await adminClient
    .from("agent_memory").select("content, memory_type")
    .eq("tenant_id", tenantId).eq("user_id", userId).eq("agent_id", agentId)
    .order("created_at", { ascending: false }).limit(limit + 10);

  if (error || !data || data.length === 0) return "";

  const conversations = data.filter((m: any) => m.memory_type === "conversation").slice(0, limit);
  const semantic = data.filter((m: any) => m.memory_type === "semantic");
  const procedural = data.filter((m: any) => m.memory_type === "procedural");
  const delegations = data.filter((m: any) => m.memory_type === "delegation").slice(0, 3);

  let memoryBlock = "\n## MEMÓRIA DO AGENTE:\n";

  if (semantic.length > 0) {
    memoryBlock += "### Conhecimento Consolidado:\n" +
      semantic.map((m: any) => `- ${m.content.fact || m.content.summary || JSON.stringify(m.content).slice(0, 200)}`).join("\n") + "\n";
  }

  if (procedural.length > 0) {
    memoryBlock += "### Procedimentos Aprendidos:\n" +
      procedural.map((m: any) => `- ${m.content.procedure || m.content.learning || JSON.stringify(m.content).slice(0, 200)}`).join("\n") + "\n";
  }

  if (conversations.length > 0) {
    const convMemories = conversations.reverse().map((m: any) =>
      `[Conversa] Usuário: ${m.content.user?.slice(0, 150)} | Agente: ${m.content.assistant?.slice(0, 150)}`
    ).join("\n");
    memoryBlock += `### Conversas Recentes:\n${convMemories}\n`;
  }

  if (delegations.length > 0) {
    memoryBlock += "### Delegações Recentes:\n" +
      delegations.map((m: any) => `- Delegou para ${m.content.target_agent || "?"}: ${(m.content.task || "").slice(0, 100)}`).join("\n") + "\n";
  }

  return memoryBlock;
}

import { TOOL_USE_INSTRUCTION } from "./prompts.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`agent-chat:${clientIP}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    const { messages, agentId, agentSlug, actionType = "chat", stream: wantStream = false } = await req.json();

    const validation = validateInput(messages);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    const tenantCheck = await validateTenantAccess(adminClient, userId, agentId);
    if (!tenantCheck.valid) {
      return new Response(JSON.stringify({ error: tenantCheck.error }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tenantId = tenantCheck.tenantId!;

    // Check credits
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits").select("*").eq("user_id", userId).single();

    if (creditsError || !credits) {
      return new Response(JSON.stringify({ error: "Credits not found." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remainingCredits = credits.total_credits - credits.used_credits;
    if (remainingCredits <= 0) {
      return new Response(JSON.stringify({ error: "Créditos esgotados.", remaining_credits: 0 }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planLimits = getPlanLimits(credits.plan_type);
    const usageRatio = credits.used_credits / credits.total_credits;
    const creditWarning = usageRatio >= planLimits.creditWarningThreshold;

    let optimizedMessages = applyHistoryWindow(messages, planLimits.maxHistoryMessages);
    optimizedMessages = truncateOlderMessages(optimizedMessages, 500);

    // Build system prompt with Company Board data
    let agentPrompt = "You are a helpful and professional AI assistant. Respond in English.";
    let agentTier = "basic";
    let agentArea = "general";
    let agentName = "AI Agent";
    let contractPrompt = "";
    let agentQualityMode: QualityMode = "balanced";

    if (agentId) {
      const { data: agent } = await adminClient
        .from("agents").select("name, instructions, objective, tier, quality_mode").eq("id", agentId).single();

      if (agent) {
        agentTier = agent.tier || "basic";
        agentName = agent.name || "AI Agent";
        agentQualityMode = (agent.quality_mode as QualityMode) || "balanced";
        agentArea = inferAgentArea(agent.name, agent.objective, agent.instructions);
        const sla = getTierSLA(agentTier);
        const limits = getAreaLimits(agentArea);

        const contract: AgentContract = {
          agentId,
          agentName: agent.name,
          tenantId,
          userId,
          tier: agentTier,
          planType: credits.plan_type,
          area: agentArea,
          objective: agent.objective || "Help the user",
          limits,
          sla,
        };

        contractPrompt = buildAgentContract(contract);

        if (agent.instructions) {
          agentPrompt = `You are the agent "${agent.name}". 
Objective: ${agent.objective || "Help the user"}
Instructions: ${agent.instructions}`;
        }
      }
    }

    // ─── LEGAL OVERRIDE: if request carries a legal slug, force OAB-compliant prompt ───
    const legalPrompt = getLegalPrompt(agentSlug);
    if (legalPrompt) {
      agentPrompt = legalPrompt;
      agentArea = "legal";
      if (!agentName || agentName === "AI Agent") {
        agentName = `Squad Jurídica · ${agentSlug}`;
      }
    }

    // ─── DEPARTMENT PERSONA: prepend the canonical department system prompt ───
    // when the incoming agentSlug matches (directly or via alias) one of the 24
    // Clauthor department prompts. This gives every agent-chat call a stable,
    // production-grade persona without touching the per-agent `instructions`.
    const departmentPrompt = resolveDepartmentPromptForAgent(agentSlug);
    if (departmentPrompt && !legalPrompt) {
      agentPrompt = `## PERSONA E ESCOPO DE DEPARTAMENTO (${departmentPrompt.department.toUpperCase()} · ${departmentPrompt.name})
${departmentPrompt.system}

Formato de saída obrigatório: ${departmentPrompt.outputFormat}

## CONFIGURAÇÃO DO AGENTE (sobreposta pelo tenant)
${agentPrompt}`;
    }

    // ─── METERED BILLING: increment monthly usage and enforce hard cap ───
    // Runs BEFORE the AI call so we never spend model credits when the tenant
    // has blown past the 120% hard cap. Any RPC failure returns null and we
    // fail-open (do not block the user on an infra issue).
    let usageResult: AgentUsageResult | null = null;
    if (tenantId && agentSlug) {
      // Look up the catalog tier for this slug (basic/pro/advanced/premium),
      // then map to the pricing tier used by agent_tier_quotas.
      let catalogTier: string | null = null;
      try {
        const { data: catalogRow } = await adminClient
          .from("agents_catalog")
          .select("tier")
          .eq("slug", agentSlug)
          .maybeSingle();
        catalogTier = catalogRow?.tier ?? null;
      } catch (e) {
        console.warn("[metered-billing] catalog lookup failed:", e);
      }
      const priceTier = resolvePriceTier(agentSlug, catalogTier);
      usageResult = await incrementAgentUsage(adminClient, {
        tenantId,
        agentSlug,
        tier: priceTier,
        actions: 1,
      });
      if (usageResult?.status === "hard_cap") {
        return new Response(
          JSON.stringify({
            error: "quota_hard_cap_reached",
            message: `Limite de ${Math.round(usageResult.usage_pct)}% da cota mensal atingido para o agente. Contate o administrador para liberar mais ações ou aguarde o próximo ciclo.`,
            usage: usageResult,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }


    // Build policy context for tool enforcement
    const policyContext: PolicyContext = {
      userId,
      tenantId,
      agentId: agentId || "general",
      agentTier,
      planType: credits.plan_type,
      agentArea,
    };

    // Load Company Board + memory + RAG knowledge in parallel
    const lastUserMsg = optimizedMessages.filter((m: any) => m.role === "user").pop()?.content || "";
    const [companyContext, memoryContext, ragContext, episodicContext] = await Promise.all([
      loadCompanyBoard(adminClient, userId),
      agentId ? loadRecentMemory(adminClient, tenantId, userId, agentId) : Promise.resolve(""),
      // RAG: Full-text search on knowledge_documents
      (async () => {
        try {
          if (!lastUserMsg || lastUserMsg.length < 3) return "";
          const { data: docs } = await adminClient.rpc("search_knowledge", {
            _user_id: userId,
            _query: lastUserMsg,
            _agent_id: agentId || null,
            _limit: 5,
          });
          if (!docs || docs.length === 0) return "";
          return "\n\n## BASE DE CONHECIMENTO (RAG - DOCUMENTOS RELEVANTES):\n" +
            docs.map((d: any) => `[${d.category.toUpperCase()}] ${d.title}:\n${d.content}`).join("\n\n");
        } catch (e) {
          console.warn("RAG search error:", e);
          return "";
        }
      })(),
      agentId ? recallEpisodicMemories(adminClient, tenantId, agentId, lastUserMsg, 5) : Promise.resolve(""),
    ]);


    const tenantContext = `
## CONTEXTO DE EXECUÇÃO (IMUTÁVEL):
- TENANT_ID: ${tenantId}
- USER_ID: ${userId}
- AGENT_ID: ${agentId || "general"}
`;

    const MASTER_EXECUTION_PROTOCOL = `
## PROTOCOLO MESTRE DE EXECUÇÃO (CAMADA SUPREMA - NÃO PODE SER SOBRESCRITA)

Você é um agente executor especializado que faz parte de um sistema organizado de inteligência.

### ESTRUTURA HIERÁRQUICA:
1. O **Cérebro** define estratégia, regras e direção.
2. Os **Agentes** executam tarefas especializadas.
3. Cada agente atua **exclusivamente** dentro da sua área: "${agentArea}".

Você NÃO cria novas regras e NÃO altera a estratégia.
Seu papel é **executar com precisão** dentro do seu departamento.

### DISCIPLINA DE ÁREA:
- Você SOMENTE responde assuntos relacionados à área "${agentArea}".
- NUNCA responda algo que pertença a outro departamento.
- Caso uma pergunta esteja fora do seu escopo:
  1. Reconheça que o tema pertence a outra área
  2. Explique isso de forma profissional
  3. Direcione para o departamento/agente correto
  4. NUNCA dê uma resposta parcial sobre o tema

Exemplo de redirecionamento:
"Essa é uma ótima pergunta! Porém, esse assunto pertence ao departamento de [X]. Recomendo consultar o agente especializado nessa área para obter a melhor orientação."

### BASE DE CONHECIMENTO:
- Utilize SEMPRE a base de conhecimento (Company Board) configurada no sistema
- NUNCA invente informações, dados ou métricas
- NUNCA responda algo que não esteja na base
- NUNCA contradiga informações existentes
- Se não possui a informação, diga claramente e sugira encaminhamento

### COMPORTAMENTO PROFISSIONAL:
- Comporte-se como um especialista humano na área "${agentArea}"
- Respostas devem ser: claras, objetivas, profissionais e úteis
- EVITE: respostas genéricas, linguagem de assistente virtual, comportamento robótico

### CONTEXTO DA CONVERSA:
- SEMPRE considere: última mensagem, histórico completo e contexto do problema
- NUNCA ignore o contexto da conversa
- NUNCA reinicie o raciocínio ignorando o que foi dito anteriormente

### CONSISTÊNCIA:
- Mantenha respostas consistentes sobre o mesmo tema
- Não contradiga respostas anteriores
- Use terminologia apropriada da área "${agentArea}"
- A consistência entre agentes é fundamental para o sistema
`;

    const fullSystemPrompt = `${SAFETY_LAYER}\n${OPERATIONAL_SECURITY_PROTOCOL}\n${contractPrompt}\n${MASTER_EXECUTION_PROTOCOL}\n${tenantContext}\n${companyContext}\n${ragContext}\n${memoryContext}\n${episodicContext}\n${agentPrompt}\n${TOOL_USE_INSTRUCTION}\n\nResponda sempre em português do Brasil de forma profissional e concisa.`;

    // Smart model routing based on task complexity + agent quality mode
    const lastUserContent = optimizedMessages.filter((m: any) => m.role === "user").pop()?.content || "";
    const taskComplexity = classifyTaskComplexity(lastUserContent);
    const selectedModel = selectModel(taskComplexity, agentQualityMode);
    console.log(`[SmartRouter] complexity=${taskComplexity} quality=${agentQualityMode} model=${selectedModel}`);

    // === SINGLE CALL with tools - no more double call ===
    const firstResponse = await fetchAI({
      model: selectedModel,
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...optimizedMessages,
      ],
      tools: AGENT_TOOLS,
      max_tokens: planLimits.maxResponseTokens,
      stream: false,
    }, { qualityMode: agentQualityMode });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (firstResponse.status === 402) return new Response(JSON.stringify({ error: "AI service payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, errorText);
      throw new Error(`AI gateway error: ${firstResponse.status}`);
    }

    const aiResponse = await firstResponse.json();
    const firstChoice = aiResponse.choices?.[0];
    const toolCalls = firstChoice?.message?.tool_calls;
    const toolResults: any[] = [];

    // If there are tool calls, execute them through autonomy engine
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const fnName = toolCall.function?.name;
        let fnArgs: any = {};
        try { fnArgs = JSON.parse(toolCall.function?.arguments || "{}"); } catch { fnArgs = {}; }
        console.log(`[Autonomy] Tool requested: ${fnName}`, fnArgs);

        if (fnName === "delegate_to_agent") {
          // Delegation goes through autonomy engine
          const autonomyResult = await autonomousExecute(
            fnName, fnArgs, adminClient, userId, tenantId, agentId || "general", agentName,
            () => delegateToAgent(fnArgs, adminClient, userId, tenantId, agentId || "general", 0)
          );
          toolResults.push({ tool_call_id: toolCall.id, tool_name: fnName, args: fnArgs, ...autonomyResult });
        } else {
          // All tools go through autonomy engine for risk classification
          const autonomyResult = await autonomousExecute(
            fnName, fnArgs, adminClient, userId, tenantId, agentId || "general", agentName,
            () => executeTool(fnName, fnArgs, adminClient, userId, tenantId, agentId || "general", policyContext, credits.used_credits, credits.total_credits)
          );
          toolResults.push({ tool_call_id: toolCall.id, tool_name: fnName, args: fnArgs, ...autonomyResult });
        }
      }

      const toolMessages = toolCalls.map((tc: any, i: number) => ({
        role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResults[i]?.result || {}),
      }));

      const secondMessages = [
        { role: "system", content: fullSystemPrompt },
        ...optimizedMessages,
        firstChoice.message,
        ...toolMessages,
      ];

      if (wantStream) {
         return streamResponse(secondMessages, planLimits, toolResults, creditWarning, optimizedMessages, fullSystemPrompt, credits, supabase, adminClient, tenantId, userId, agentId, actionType, toolCalls, selectedModel);
       } else {
         const secondResponse = await fetchAI({ model: selectedModel, messages: secondMessages, max_tokens: planLimits.maxResponseTokens, stream: false }, { qualityMode: agentQualityMode });
        let assistantMessage = firstChoice?.message?.content || "";
        if (secondResponse.ok) {
          const secondData = await secondResponse.json();
          assistantMessage = secondData.choices?.[0]?.message?.content || assistantMessage;
        }

        const totalTokens = aiResponse.usage?.total_tokens || Math.ceil(fullSystemPrompt.length / 4);
        await supabase.from("user_credits").update({ used_credits: credits.used_credits + totalTokens }).eq("user_id", userId);
         await supabase.from("token_usage").insert({ user_id: userId, agent_id: agentId || null, tokens_used: totalTokens, action_type: `tool:${toolCalls.map((t: any) => t.function?.name).join(",")}`, model: selectedModel });

        if (agentId) {
          const lastUserMsg = optimizedMessages.filter((m: any) => m.role === "user").pop();
          if (lastUserMsg) {
            await saveMemory(adminClient, tenantId, userId, agentId, lastUserMsg.content, assistantMessage);
            appendAudit(adminClient, tenantId, agentId, agentName, userId, lastUserMsg.content, assistantMessage, totalTokens).catch(() => {});
          }
        }

        return new Response(JSON.stringify({ message: assistantMessage, tokens_used: totalTokens, remaining_credits: remainingCredits - totalTokens, credit_warning: creditWarning, tool_results: toolResults }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // === NO TOOL CALLS - use the response we already have (no double call!) ===
    const assistantMessage = firstChoice?.message?.content || "";
    const totalTokens = aiResponse.usage?.total_tokens || 100;

    if (wantStream) {
      // We already have the complete response, emit it as SSE
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          const metaEvent = `data: ${JSON.stringify({ type: "meta", credit_warning: creditWarning })}\n\n`;
          await writer.write(encoder.encode(metaEvent));

          // Emit content as a single SSE chunk
          const chunk = { choices: [{ delta: { content: assistantMessage }, index: 0, finish_reason: "stop" }] };
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          await writer.write(encoder.encode("data: [DONE]\n\n"));

          await supabase.from("user_credits").update({ used_credits: credits.used_credits + totalTokens }).eq("user_id", userId);
           await supabase.from("token_usage").insert({ user_id: userId, agent_id: agentId || null, tokens_used: totalTokens, action_type: actionType, model: selectedModel });

          if (agentId) {
            const lastUserMsg = optimizedMessages.filter((m: any) => m.role === "user").pop();
            if (lastUserMsg) {
              await saveMemory(adminClient, tenantId, userId, agentId, lastUserMsg.content, assistantMessage);
              writeEpisodicMemory(adminClient, tenantId, agentId, userId, lastUserMsg.content, assistantMessage, false).catch(() => {});
              appendAudit(adminClient, tenantId, agentId, agentName, userId, lastUserMsg.content, assistantMessage, totalTokens).catch(() => {});
            }
          }
        } catch (e) { console.error("Stream pipe error:", e); }
        finally { await writer.close(); }
      })();

      return new Response(readable, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
    }

    await supabase.from("user_credits").update({ used_credits: credits.used_credits + totalTokens }).eq("user_id", userId);
    await supabase.from("token_usage").insert({ user_id: userId, agent_id: agentId || null, tokens_used: totalTokens, action_type: actionType, model: selectedModel });

    if (agentId) {
      const lastUserMsg = optimizedMessages.filter((m: any) => m.role === "user").pop();
      if (lastUserMsg) {
        await saveMemory(adminClient, tenantId, userId, agentId, lastUserMsg.content, assistantMessage);
        writeEpisodicMemory(adminClient, tenantId, agentId, userId, lastUserMsg.content, assistantMessage, false).catch(() => {});
        appendAudit(adminClient, tenantId, agentId, agentName, userId, lastUserMsg.content, assistantMessage, totalTokens).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ message: assistantMessage, tokens_used: totalTokens, remaining_credits: remainingCredits - totalTokens, credit_warning: creditWarning }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("agent-chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Helper for streaming after tool execution
async function streamResponse(
  messages: any[], planLimits: any, toolResults: any[], creditWarning: boolean,
  optimizedMessages: any[], fullSystemPrompt: string, credits: any,
  supabase: any, adminClient: any, tenantId: string, userId: string,
  agentId: string | null, actionType: string, toolCalls: any[], selectedModel: string = "google/gemini-3-flash-preview"
) {
  const streamResp = await fetchAI({ model: selectedModel, messages, max_tokens: planLimits.maxResponseTokens, stream: true });
  if (!streamResp.ok || !streamResp.body) throw new Error("Streaming failed after tool execution");

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "meta", tool_results: toolResults, credit_warning: creditWarning })}\n\n`));

      const reader = streamResp.body!.getReader();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
        const chunk = new TextDecoder().decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) fullText += c;
          } catch {}
        }
      }

      const inputTokens = optimizedMessages.reduce((a: number, m: any) => a + Math.ceil((m.content?.length || 0) / 4), 0);
      const outputTokens = Math.ceil(fullText.length / 4);
      const totalTokens = inputTokens + outputTokens + Math.ceil(fullSystemPrompt.length / 4);

      await supabase.from("user_credits").update({ used_credits: credits.used_credits + totalTokens }).eq("user_id", userId);
      await supabase.from("token_usage").insert({ user_id: userId, agent_id: agentId || null, tokens_used: totalTokens, action_type: `tool:${toolCalls.map((t: any) => t.function?.name).join(",")}`, model: selectedModel });

      if (agentId) {
        const lastUserMsg = optimizedMessages.filter((m: any) => m.role === "user").pop();
        if (lastUserMsg) {
          await saveMemory(adminClient, tenantId, userId, agentId, lastUserMsg.content, fullText);
          writeEpisodicMemory(adminClient, tenantId, agentId, userId, lastUserMsg.content, fullText, true).catch(() => {});
        }
      }
    } catch (e) { console.error("Stream pipe error:", e); }
    finally { await writer.close(); }
  })();

  return new Response(readable, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}
