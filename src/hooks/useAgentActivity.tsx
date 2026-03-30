import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ActivityLog {
  id: string;
  agent_id: string;
  action_type: string;
  action_description: string;
  model_used: string;
  created_at: string;
}

interface AgentActivityMetrics {
  todayCount: number;
  weekCount: number;
  monthCount: number;
  lastAction: ActivityLog | null;
  recentActions: ActivityLog[];
}

const ROI_PER_TASK: Record<string, number> = {
  sdr: 15,
  outbound: 15,
  vendas: 15,
  sales: 15,
  support: 8,
  suporte: 8,
  hr: 12,
  rh: 12,
  content: 10,
  conteudo: 10,
  marketing: 10,
  data: 20,
  dados: 20,
  analytics: 20,
  finance: 25,
  financeiro: 25,
  cfo: 25,
  legal: 30,
  security: 18,
  seguranca: 18,
};

export function estimateROI(agentName: string, taskCount: number): number {
  const nameLower = agentName.toLowerCase();
  for (const [key, value] of Object.entries(ROI_PER_TASK)) {
    if (nameLower.includes(key)) return taskCount * value;
  }
  return taskCount * 10; // default R$10 per task
}

export function useAgentActivity(agentId: string | undefined) {
  const { user } = useAuth();

  return useQuery<AgentActivityMetrics>({
    queryKey: ["agent-activity", agentId, user?.id],
    queryFn: async () => {
      if (!agentId || !user?.id) {
        return { todayCount: 0, weekCount: 0, monthCount: 0, lastAction: null, recentActions: [] };
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch last 30 days of activity in one query (covers all metrics)
      const { data, error } = await supabase
        .from("agent_activity_log" as any)
        .select("id, agent_id, action_type, action_description, model_used, created_at")
        .eq("agent_id", agentId)
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error || !data) {
        return { todayCount: 0, weekCount: 0, monthCount: 0, lastAction: null, recentActions: [] };
      }

      const logs = data as unknown as ActivityLog[];

      const todayCount = logs.filter(l => l.created_at >= startOfDay).length;
      const weekCount = logs.filter(l => l.created_at >= startOfWeek).length;

      return {
        todayCount,
        weekCount,
        monthCount: logs.length,
        lastAction: logs[0] || null,
        recentActions: logs.slice(0, 10),
      };
    },
    enabled: !!agentId && !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export async function logAgentActivity(params: {
  agentId: string;
  tenantId: string;
  actionType: string;
  actionDescription: string;
  modelUsed?: string;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.functions.invoke("log-agent-activity", {
      body: {
        agent_id: params.agentId,
        tenant_id: params.tenantId,
        action_type: params.actionType,
        action_description: params.actionDescription,
        model_used: params.modelUsed || "unknown",
      },
    });
  } catch (err) {
    console.error("Failed to log agent activity:", err);
  }
}
