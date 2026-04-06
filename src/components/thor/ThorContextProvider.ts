/**
 * ThorContextProvider.ts — Fetches real-time dashboard data to inject into Thor's context
 * Makes Thor aware of the user's current state: agents, credits, tasks, activity
 */

import { supabase } from "@/integrations/supabase/client";

export interface ThorDashboardContext {
  activeAgents: number;
  totalAgents: number;
  agentNames: string[];
  remainingCredits: number;
  totalCredits: number;
  usagePercent: number;
  planType: string;
  pendingTasks: number;
  overdueTasks: number;
  recentExecutions: number;
  lastExecutionAction: string | null;
  lastExecutionStatus: string | null;
  squadsCount: number;
  unreadNotifications: number;
  hasCompanyData: boolean;
  topAgentByExecutions: string | null;
}

let cachedContext: ThorDashboardContext | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30_000; // 30s cache

/**
 * Fetches dashboard context for authenticated users.
 * Results are cached for 30s to avoid excessive queries.
 */
export async function fetchThorDashboardContext(userId: string): Promise<ThorDashboardContext | null> {
  const now = Date.now();
  if (cachedContext && now - lastFetchTime < CACHE_TTL) {
    return cachedContext;
  }

  try {
    // Parallel fetch all data
    const [agentsRes, creditsRes, tasksRes, logsRes, tenantRes, notifRes, boardRes] = await Promise.all([
      supabase.from("agents").select("id, name, status, total_executions").eq("user_id", userId),
      supabase.from("user_credits").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("agent_tasks").select("id, status, due_date").eq("user_id", userId).in("status", ["open", "in_progress"]).limit(100),
      supabase.from("execution_logs").select("action, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("tenant_members").select("tenant_id").eq("user_id", userId).limit(1).maybeSingle(),
      supabase.from("notifications").select("id").eq("user_id", userId).eq("is_read", false).limit(50),
      supabase.from("company_board").select("id").eq("user_id", userId).limit(1),
    ]);

    const agents = agentsRes.data || [];
    const credits = creditsRes.data;
    const tasks = tasksRes.data || [];
    const logs = logsRes.data || [];
    const notifications = notifRes.data || [];
    const board = boardRes.data || [];

    const activeAgents = agents.filter(a => a.status === "active").length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;
    const topAgent = agents.length > 0
      ? agents.reduce((max, a) => (a.total_executions || 0) > (max.total_executions || 0) ? a : max, agents[0])
      : null;

    // Fetch squads count if tenant exists
    let squadsCount = 0;
    if (tenantRes.data?.tenant_id) {
      const { count } = await supabase
        .from("squads")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantRes.data.tenant_id);
      squadsCount = count || 0;
    }

    const ctx: ThorDashboardContext = {
      activeAgents,
      totalAgents: agents.length,
      agentNames: agents.map(a => a.name).slice(0, 10),
      remainingCredits: credits ? credits.total_credits - credits.used_credits : 10000,
      totalCredits: credits?.total_credits || 10000,
      usagePercent: credits ? Math.round((credits.used_credits / credits.total_credits) * 100) : 0,
      planType: credits?.plan_type || "free",
      pendingTasks: tasks.length,
      overdueTasks,
      recentExecutions: logs.length,
      lastExecutionAction: logs[0]?.action || null,
      lastExecutionStatus: logs[0]?.status || null,
      squadsCount,
      unreadNotifications: notifications.length,
      hasCompanyData: board.length > 0,
      topAgentByExecutions: topAgent?.name || null,
    };

    cachedContext = ctx;
    lastFetchTime = now;
    return ctx;
  } catch (err) {
    console.warn("[ThorContext] Failed to fetch dashboard context:", err);
    return null;
  }
}

/**
 * Formats the dashboard context into a concise text block for Thor's system prompt
 */
export function formatContextForPrompt(ctx: ThorDashboardContext): string {
  const lines: string[] = [
    `## ESTADO DO DASHBOARD DO USUÁRIO (dados reais)`,
    `- Plano: ${ctx.planType}`,
    `- Créditos: ${ctx.remainingCredits.toLocaleString()} restantes de ${ctx.totalCredits.toLocaleString()} (${ctx.usagePercent}% usado)`,
    `- Agentes contratados: ${ctx.totalAgents} (${ctx.activeAgents} ativos)`,
  ];

  if (ctx.agentNames.length > 0) {
    lines.push(`- Nomes: ${ctx.agentNames.join(", ")}`);
  }

  if (ctx.pendingTasks > 0) {
    lines.push(`- Tarefas pendentes: ${ctx.pendingTasks}${ctx.overdueTasks > 0 ? ` (${ctx.overdueTasks} atrasadas!)` : ""}`);
  }

  if (ctx.recentExecutions > 0) {
    lines.push(`- Execuções recentes: ${ctx.recentExecutions}`);
    if (ctx.lastExecutionAction) {
      lines.push(`- Última ação: ${ctx.lastExecutionAction} (${ctx.lastExecutionStatus})`);
    }
  } else {
    lines.push(`- Nenhuma execução recente — usuário pode precisar de orientação`);
  }

  if (ctx.squadsCount > 0) {
    lines.push(`- Squads: ${ctx.squadsCount}`);
  }

  if (ctx.unreadNotifications > 0) {
    lines.push(`- Notificações não lidas: ${ctx.unreadNotifications}`);
  }

  if (!ctx.hasCompanyData) {
    lines.push(`- ⚠️ Dados da empresa NÃO configurados — sugira que configure`);
  }

  if (ctx.topAgentByExecutions) {
    lines.push(`- Agente mais ativo: ${ctx.topAgentByExecutions}`);
  }

  // Actionable hints for Thor
  lines.push("");
  lines.push("## INSTRUÇÕES BASEADAS NO CONTEXTO");

  if (ctx.totalAgents === 0) {
    lines.push("- Usuário NÃO tem agentes → priorize guiá-lo para contratar o primeiro agente");
  } else if (ctx.recentExecutions === 0) {
    lines.push("- Usuário tem agentes mas NENHUMA execução → sugira enviar a primeira tarefa");
  }

  if (ctx.usagePercent > 80) {
    lines.push("- Créditos BAIXOS → mencione upgrade de plano se relevante");
  }

  if (ctx.overdueTasks > 0) {
    lines.push(`- ${ctx.overdueTasks} tarefa(s) atrasada(s) → alerte o usuário proativamente`);
  }

  if (!ctx.hasCompanyData) {
    lines.push("- Sem dados da empresa → sugira configurar para personalizar agentes");
  }

  return lines.join("\n");
}

/** Invalidate cached context (call after significant user actions) */
export function invalidateThorContext() {
  cachedContext = null;
  lastFetchTime = 0;
}
