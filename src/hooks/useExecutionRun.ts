import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StepType =
  | "thought"
  | "tool_call"
  | "tool_result"
  | "decision"
  | "delegation"
  | "final_output"
  | "error"
  | "system";

export interface ExecutionStep {
  id: string;
  run_id: string;
  tenant_id: string;
  step_index: number;
  step_type: StepType;
  agent_slug: string | null;
  title: string;
  content: Record<string, unknown>;
  tool_name: string | null;
  sources: Array<{ type?: string; url?: string; title?: string; snippet?: string }> | null;
  tokens_in: number;
  tokens_out: number;
  cost_credits: number;
  duration_ms: number;
  created_at: string;
}

export interface ExecutionRun {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  run_type: string;
  message: string | null;
  selected_agents: string[] | null;
  triggered_agents: string[] | null;
  results: Record<string, unknown> | null;
  status: string;
  approval_status: string | null;
  summary: string | null;
  total_ms: number | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches a single run + all its steps in ascending step_index order.
 * Subscribes to Realtime while the run is `running` and unsubscribes on `completed`/`failed`.
 */
export function useExecutionRun(runId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["execution-run", runId],
    enabled: !!runId,
    staleTime: 15_000,
    queryFn: async () => {
      if (!runId) throw new Error("runId required");
      const [runRes, stepsRes] = await Promise.all([
        supabase
          .from("mcp_executions")
          .select("*")
          .eq("id", runId)
          .maybeSingle(),
        supabase
          .from("execution_steps" as never)
          .select("*")
          .eq("run_id", runId)
          .order("step_index", { ascending: true }),
      ]);
      if (runRes.error) throw runRes.error;
      if (!runRes.data) throw new Error("Run not found");
      return {
        run: runRes.data as unknown as ExecutionRun,
        steps: ((stepsRes.data ?? []) as unknown as ExecutionStep[]),
      };
    },
  });

  const isRunning = query.data?.run.status === "running";

  useEffect(() => {
    if (!runId || !isRunning) return;
    const channel = supabase
      .channel(`execution-run-${runId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "execution_steps",
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          const newStep = payload.new as unknown as ExecutionStep;
          qc.setQueryData<{ run: ExecutionRun; steps: ExecutionStep[] } | undefined>(
            ["execution-run", runId],
            (prev) => {
              if (!prev) return prev;
              if (prev.steps.some((s) => s.id === newStep.id)) return prev;
              return {
                ...prev,
                steps: [...prev.steps, newStep].sort((a, b) => a.step_index - b.step_index),
              };
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mcp_executions",
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const nextRun = payload.new as unknown as ExecutionRun;
          qc.setQueryData<{ run: ExecutionRun; steps: ExecutionStep[] } | undefined>(
            ["execution-run", runId],
            (prev) => (prev ? { ...prev, run: nextRun } : prev),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId, isRunning, qc]);

  const totals = useMemo(() => {
    const steps = query.data?.steps ?? [];
    return {
      tokens_in: steps.reduce((sum, s) => sum + (s.tokens_in ?? 0), 0),
      tokens_out: steps.reduce((sum, s) => sum + (s.tokens_out ?? 0), 0),
      cost_credits: steps.reduce((sum, s) => sum + Number(s.cost_credits ?? 0), 0),
      duration_ms: steps.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0),
      tool_calls: steps.filter((s) => s.step_type === "tool_call").length,
      errors: steps.filter((s) => s.step_type === "error").length,
    };
  }, [query.data?.steps]);

  return {
    run: query.data?.run,
    steps: query.data?.steps ?? [],
    totals,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/** List recent runs for the current user's tenant (for the dashboard card). */
export function useRecentRuns(limit = 5) {
  return useQuery({
    queryKey: ["execution-runs", "recent", limit],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_executions")
        .select("id, run_type, status, summary, total_ms, created_at, triggered_agents")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
