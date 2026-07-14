import { useMemo, useState } from "react";
import { Radio, Clock, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecentRuns, useExecutionRun, type StepType } from "@/hooks/useExecutionRun";
import { ReplayTimeline } from "@/components/replay/ReplayTimeline";

const STEP_FILTERS: { id: StepType | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "thought", label: "Pensamentos" },
  { id: "tool_call", label: "Ferramentas" },
  { id: "tool_result", label: "Resultados" },
  { id: "decision", label: "Decisões" },
  { id: "delegation", label: "Delegações" },
  { id: "final_output", label: "Saídas" },
  { id: "error", label: "Erros" },
];

const statusStyles: Record<string, string> = {
  running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};

function statusIcon(status: string) {
  if (status === "running") return <Radio className="h-3 w-3 animate-pulse" />;
  if (status === "failed") return <AlertTriangle className="h-3 w-3" />;
  if (status === "completed") return <CheckCircle2 className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

export default function LiveExecutionPanel() {
  const { data: runs = [], isLoading } = useRecentRuns(12);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [stepFilter, setStepFilter] = useState<StepType | "all">("all");

  // Auto-select first running run, else first run
  const activeRunId = useMemo(() => {
    if (selectedRunId) return selectedRunId;
    const running = runs.find((r: any) => r.status === "running");
    return running?.id ?? runs[0]?.id ?? null;
  }, [runs, selectedRunId]);

  const { run, steps, totals } = useExecutionRun(activeRunId);

  const filteredSteps = useMemo(
    () => (stepFilter === "all" ? steps : steps.filter((s) => s.step_type === stepFilter)),
    [steps, stepFilter],
  );

  const isLive = run?.status === "running";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Runs list */}
      <aside className="glass-card rounded-2xl p-3 space-y-2 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between px-1 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Execuções recentes
          </h3>
          <Badge variant="secondary" className="text-[10px]">{runs.length}</Badge>
        </div>
        {isLoading && (
          <div className="text-xs text-muted-foreground p-4 text-center">Carregando…</div>
        )}
        {!isLoading && runs.length === 0 && (
          <div className="text-xs text-muted-foreground p-6 text-center">
            Nenhuma execução ainda. Quando um agente rodar, ela aparece aqui em tempo real.
          </div>
        )}
        {runs.map((r: any) => {
          const active = r.id === activeRunId;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRunId(r.id)}
              className={cn(
                "w-full text-left rounded-xl p-2.5 border transition-all",
                active
                  ? "bg-primary/10 border-primary/30"
                  : "bg-background/40 border-white/[0.06] hover:border-white/[0.12] hover:bg-background/60",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-medium truncate flex-1">
                  {r.summary || r.run_type || "Execução"}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] gap-1 border", statusStyles[r.status] ?? statusStyles.pending)}
                >
                  {statusIcon(r.status)} {r.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                {r.total_ms ? <span>{(r.total_ms / 1000).toFixed(1)}s</span> : null}
              </div>
            </button>
          );
        })}
      </aside>

      {/* Timeline */}
      <section className="glass-card rounded-2xl p-4 min-h-[400px]">
        {!activeRunId ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-16">
            <Radio className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Selecione uma execução para acompanhar em tempo real.</p>
          </div>
        ) : (
          <>
            <header className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-white/[0.06] flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-lg tracking-[-0.02em] truncate">
                    {run?.summary || run?.run_type || "Execução"}
                  </h3>
                  {isLive && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ao vivo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span>{steps.length} passos</span>
                  <span>·</span>
                  <span>{totals.tool_calls} ferramentas</span>
                  {totals.errors > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-destructive">{totals.errors} erro(s)</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{(totals.duration_ms / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </header>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              {STEP_FILTERS.map((f) => {
                const count = f.id === "all" ? steps.length : steps.filter((s) => s.step_type === f.id).length;
                if (f.id !== "all" && count === 0) return null;
                const active = stepFilter === f.id;
                return (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={active ? "default" : "ghost"}
                    className="h-7 text-[11px] px-2.5"
                    onClick={() => setStepFilter(f.id)}
                  >
                    {f.label}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </Button>
                );
              })}
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-1">
              <ReplayTimeline steps={filteredSteps} isLive={isLive} runId={activeRunId} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
