import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ReplayStepCard } from "./ReplayStepCard";
import type { ExecutionStep, StepType } from "@/hooks/useExecutionRun";
import { trackKpi } from "@/lib/kpiTracker";

interface ReplayTimelineProps {
  steps: ExecutionStep[];
  isLive?: boolean;
  runId: string;
}

export const ReplayTimeline = ({ steps, isLive, runId }: ReplayTimelineProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const completedFiredRef = useRef(false);

  // Auto-scroll to newest step when live
  useEffect(() => {
    if (!isLive) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length, isLive]);

  // Fire "completed view" analytics once user has seen the full timeline (non-live only)
  useEffect(() => {
    if (isLive || completedFiredRef.current || steps.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !completedFiredRef.current) {
          completedFiredRef.current = true;
          trackKpi("replay_completed_view", { source: "replay", run_id: runId, steps_count: steps.length });
        }
      },
      { threshold: 0.5 },
    );
    if (endRef.current) observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [isLive, steps.length, runId]);

  if (steps.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {isLive ? "Aguardando primeiros passos…" : "Nenhum passo registrado nesta execução."}
      </div>
    );
  }

  const onExpand = (type: StepType) => {
    trackKpi("replay_step_expanded", { source: "replay", run_id: runId, step_type: type });
  };

  return (
    <div className="relative">
      {/* Vertical rail */}
      <span className="absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent" />
      <motion.div layout className="space-y-2">
        {steps.map((step) => (
          <ReplayStepCard key={step.id} step={step} onExpand={onExpand} />
        ))}
      </motion.div>
      <div ref={endRef} />
    </div>
  );
};
