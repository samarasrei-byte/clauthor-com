import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutionRun } from "@/hooks/useExecutionRun";
import { ReplayHeader } from "./ReplayHeader";
import { ReplayTimeline } from "./ReplayTimeline";
import { trackKpi } from "@/lib/kpiTracker";
import { Link } from "react-router-dom";

interface ReplayDrawerProps {
  runId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: "approvals" | "activity" | "task" | "dashboard";
}

export const ReplayDrawer = ({ runId, open, onOpenChange, source = "dashboard" }: ReplayDrawerProps) => {
  const { run, steps, totals, isLoading, isError } = useExecutionRun(open ? runId : null);

  useEffect(() => {
    if (open && runId) {
      trackKpi("replay_opened", { source, run_id: runId });
    }
  }, [open, runId, source]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 bg-background/95 backdrop-blur-xl border-l border-border/40 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border/30 flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-[13px] font-semibold tracking-tight">
            Replay de Execução
          </SheetTitle>
          <div className="flex items-center gap-1">
            {runId && (
              <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-[11px]">
                <Link to={`/replay/${runId}`} onClick={() => onOpenChange(false)}>
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </Link>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          )}

          {isError && (
            <div className="text-center py-10 text-sm text-destructive">
              Não foi possível carregar esta execução.
            </div>
          )}

          {run && !isLoading && (
            <>
              <ReplayHeader run={run} totals={totals} />
              <ReplayTimeline
                steps={steps}
                isLive={run.status === "running"}
                runId={run.id}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
