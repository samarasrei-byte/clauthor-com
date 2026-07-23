import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HunterActionJob = {
  id: string;
  user_id: string;
  lead_id: string | null;
  campaign_id: string | null;
  action: "like" | "comment" | "crm_push";
  provider: string;
  status: "queued" | "running" | "success" | "failed" | "skipped_duplicate";
  attempt: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  queued_at: string;
  started_at: string | null;
  finished_at: string | null;
  next_retry_at: string | null;
  created_at: string;
};

type Options = {
  jobIds?: string[]; // filter to specific jobs (wizard)
  limit?: number; // for global feed
  enabled?: boolean;
};

/** Live subscription to hunter_action_jobs owned by the current user. */
export function useHunterActionJobs({ jobIds, limit = 100, enabled = true }: Options = {}) {
  const [jobs, setJobs] = useState<HunterActionJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    let q = supabase
      .from("hunter_action_jobs" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (jobIds && jobIds.length > 0) {
      q = q.in("id", jobIds);
    }
    const { data, error } = await q;
    if (error) {
      console.error("hunter_action_jobs load error", error);
    }
    setJobs((data as unknown as HunterActionJob[]) ?? []);
    setLoading(false);
  }, [enabled, limit, jobIds?.join(",")]);

  useEffect(() => {
    if (!enabled) return;
    load();

    const channel = supabase
      .channel("hunter_action_jobs_" + Math.random().toString(36).slice(2, 8))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hunter_action_jobs" },
        (payload) => {
          setJobs((prev) => {
            const row = payload.new as HunterActionJob | undefined;
            const old = payload.old as HunterActionJob | undefined;
            if (payload.eventType === "DELETE" && old) {
              return prev.filter((j) => j.id !== old.id);
            }
            if (!row) return prev;
            if (jobIds && jobIds.length > 0 && !jobIds.includes(row.id)) return prev;
            const idx = prev.findIndex((j) => j.id === row.id);
            if (idx === -1) return [row, ...prev].slice(0, limit);
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, load, limit, jobIds?.join(",")]);

  const retryJob = useCallback(async (jobId: string) => {
    // Reset the job and let the worker pick it up.
    const { error } = await supabase
      .from("hunter_action_jobs" as never)
      .update({
        status: "queued",
        attempt: 1,
        error: null,
        next_retry_at: null,
        finished_at: null,
        started_at: null,
      })
      .eq("id", jobId);
    if (error) throw error;
    // Kick the worker
    await supabase.functions.invoke("hunter-action-worker", { body: { jobId } });
  }, []);

  return { jobs, loading, reload: load, retryJob };
}
