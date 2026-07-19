import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AgentAlertSeverity = "critical" | "warning" | "info";
export type AgentAlertKind =
  | "consecutive_failures"
  | "high_error_rate"
  | "cost_spike"
  | "queue_backlog"
  | "stalled";

export interface AgentAlert {
  agentId: string;
  agentName: string;
  kind: AgentAlertKind;
  severity: AgentAlertSeverity;
  title: string;
  message: string;
  metric: string;
  createdAt: string;
}

interface AgentStat {
  agentId: string;
  agentName: string;
  total: number;
  success: number;
  errors: number;
  errorRate: number;
  avgMs: number;
  lastAt: string | null;
}

interface AgentHealthResult {
  alerts: AgentAlert[];
  perAgent: AgentStat[];
  worstAgentId: string | null;
}

/**
 * Detects per-agent anomalies from execution_logs + token_usage.
 * - consecutive_failures: last 3+ runs failed
 * - high_error_rate: ≥30% error over last 20 runs
 * - cost_spike: tokens in last 24h > 3x avg previous 6 days
 * - stalled: agent active but no run in 72h despite historic activity
 */
export function useAgentHealth() {
  const { user } = useAuth();

  return useQuery<AgentHealthResult>({
    queryKey: ["agent-health", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [logsRes, agentsRes, tokensRes] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("id, agent_id, status, execution_time_ms, created_at, details")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("agents")
          .select("id, name, status")
          .eq("user_id", user.id),
        supabase
          .from("token_usage")
          .select("agent_id, tokens_used, created_at")
          .eq("user_id", user.id)
          .gte("created_at", since)
          .limit(2000),
      ]);

      const logs = logsRes.data ?? [];
      const agents = agentsRes.data ?? [];
      const tokens = tokensRes.data ?? [];
      const nameById = new Map(agents.map((a: any) => [a.id, a.name as string]));
      const statusById = new Map(agents.map((a: any) => [a.id, a.status as string]));

      // Group logs by agent
      const grouped = new Map<string, typeof logs>();
      for (const l of logs) {
        if (!l.agent_id) continue;
        const arr = grouped.get(l.agent_id) ?? [];
        arr.push(l);
        grouped.set(l.agent_id, arr);
      }

      const perAgent: AgentStat[] = [];
      const alerts: AgentAlert[] = [];
      const now = Date.now();

      for (const [agentId, entries] of grouped.entries()) {
        const name = nameById.get(agentId) ?? "Agente";
        const total = entries.length;
        const errors = entries.filter((e) => e.status === "error" || e.status === "failed").length;
        const success = entries.filter((e) => e.status === "success").length;
        const errorRate = total > 0 ? errors / total : 0;
        const timed = entries.filter((e) => e.execution_time_ms != null);
        const avgMs =
          timed.length > 0
            ? Math.round(timed.reduce((s, e) => s + (e.execution_time_ms || 0), 0) / timed.length)
            : 0;
        const lastAt = entries[0]?.created_at ?? null;

        perAgent.push({ agentId, agentName: name, total, success, errors, errorRate, avgMs, lastAt });

        // Consecutive failures — last 3
        const last3 = entries.slice(0, 3);
        if (last3.length === 3 && last3.every((e) => e.status !== "success")) {
          alerts.push({
            agentId,
            agentName: name,
            kind: "consecutive_failures",
            severity: "critical",
            title: `${name}: 3 falhas seguidas`,
            message: "Últimas 3 execuções falharam. Investigue credenciais ou o prompt.",
            metric: `${Math.round(errorRate * 100)}% de erro`,
            createdAt: lastAt ?? new Date().toISOString(),
          });
        } else if (total >= 10 && errorRate >= 0.3) {
          alerts.push({
            agentId,
            agentName: name,
            kind: "high_error_rate",
            severity: "warning",
            title: `${name}: taxa de erro alta`,
            message: `${errors} de ${total} execuções falharam nos últimos 7 dias.`,
            metric: `${Math.round(errorRate * 100)}% erro`,
            createdAt: lastAt ?? new Date().toISOString(),
          });
        }

        // Stalled
        if (lastAt && statusById.get(agentId) === "active") {
          const ageH = (now - new Date(lastAt).getTime()) / 36e5;
          if (total >= 5 && ageH > 72) {
            alerts.push({
              agentId,
              agentName: name,
              kind: "stalled",
              severity: "info",
              title: `${name}: parado há ${Math.round(ageH / 24)}d`,
              message: "Agente ativo mas sem execuções recentes. Verifique se precisa reativar o fluxo.",
              metric: `${Math.round(ageH)}h`,
              createdAt: lastAt,
            });
          }
        }
      }

      // Cost spike — tokens last 24h vs avg prev 6d
      const tokensByAgent = new Map<string, { last24: number; prev6d: number }>();
      for (const t of tokens) {
        if (!t.agent_id) continue;
        const ageH = (now - new Date(t.created_at).getTime()) / 36e5;
        const cur = tokensByAgent.get(t.agent_id) ?? { last24: 0, prev6d: 0 };
        if (ageH <= 24) cur.last24 += t.tokens_used || 0;
        else cur.prev6d += t.tokens_used || 0;
        tokensByAgent.set(t.agent_id, cur);
      }
      for (const [agentId, { last24, prev6d }] of tokensByAgent.entries()) {
        const dailyPrev = prev6d / 6;
        if (dailyPrev >= 500 && last24 >= dailyPrev * 3) {
          const name = nameById.get(agentId) ?? "Agente";
          alerts.push({
            agentId,
            agentName: name,
            kind: "cost_spike",
            severity: "warning",
            title: `${name}: custo anômalo`,
            message: `Consumo de tokens 3x acima da média (${last24.toLocaleString("pt-BR")} vs ${Math.round(dailyPrev).toLocaleString("pt-BR")}/dia).`,
            metric: `${last24.toLocaleString("pt-BR")} tk`,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const sortedAgents = perAgent.sort((a, b) => b.errorRate - a.errorRate);
      const worstAgentId = sortedAgents[0]?.errorRate > 0 ? sortedAgents[0].agentId : null;

      // Order alerts: critical → warning → info
      const order: Record<AgentAlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
      alerts.sort((a, b) => order[a.severity] - order[b.severity]);

      return { alerts, perAgent: sortedAgents, worstAgentId };
    },
  });
}
