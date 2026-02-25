import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ExecutionHealth {
  totalExecutions: number;
  successRate: number;
  errorRate: number;
  avgExecutionTimeMs: number;
  recentErrors: Array<{
    id: string;
    action: string;
    details: any;
    created_at: string;
  }>;
  failureAlerts: Array<{
    id: string;
    title: string;
    message: string;
    created_at: string;
    metadata: any;
  }>;
  isHealthy: boolean;
  healthScore: number; // 0-100
}

export function useExecutionHealth() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["execution-health", user?.id],
    queryFn: async (): Promise<ExecutionHealth> => {
      if (!user) throw new Error("Not authenticated");

      const [logsRes, alertsRes] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("id, status, action, execution_time_ms, details, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("notifications")
          .select("id, title, message, created_at, metadata")
          .eq("user_id", user.id)
          .eq("type", "agent_failure")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const logs = logsRes.data || [];
      const alerts = alertsRes.data || [];

      const successCount = logs.filter(l => l.status === "success").length;
      const errorCount = logs.filter(l => l.status === "error").length;
      const total = logs.length;

      const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;
      const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0;

      const timeLogs = logs.filter(l => l.execution_time_ms != null);
      const avgTime = timeLogs.length > 0
        ? Math.round(timeLogs.reduce((a, l) => a + (l.execution_time_ms || 0), 0) / timeLogs.length)
        : 0;

      const recentErrors = logs
        .filter(l => l.status === "error")
        .slice(0, 5);

      // Health score: 100 = perfect, 0 = all errors
      const healthScore = Math.max(0, Math.min(100,
        successRate - (alerts.length * 5) - (errorRate > 20 ? 20 : 0)
      ));

      return {
        totalExecutions: total,
        successRate,
        errorRate,
        avgExecutionTimeMs: avgTime,
        recentErrors,
        failureAlerts: alerts,
        isHealthy: healthScore >= 70,
        healthScore,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Monitor every 30s
  });
}
