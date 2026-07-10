import { motion } from "framer-motion";
import { Clock, Coins, Wrench, AlertTriangle, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutionRun } from "@/hooks/useExecutionRun";

interface ReplayHeaderProps {
  run: ExecutionRun;
  totals: {
    tokens_in: number;
    tokens_out: number;
    cost_credits: number;
    duration_ms: number;
    tool_calls: number;
    errors: number;
  };
}

function formatMs(ms: number): string {
  if (!ms || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

const STATUS_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  running: { icon: Loader2, label: "Executando", tone: "text-primary bg-primary/10 border-primary/30 animate-pulse" },
  completed: { icon: CheckCircle2, label: "Concluída", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  failed: { icon: XCircle, label: "Falhou", tone: "text-destructive bg-destructive/10 border-destructive/30" },
  cancelled: { icon: XCircle, label: "Cancelada", tone: "text-muted-foreground bg-muted/40 border-border" },
};

export const ReplayHeader = ({ run, totals }: ReplayHeaderProps) => {
  const style = STATUS_STYLE[run.status] ?? STATUS_STYLE.running;
  const StatusIcon = style.icon;
  const agents = run.triggered_agents ?? run.selected_agents ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border", style.tone)}>
              <StatusIcon className={cn("h-3 w-3", run.status === "running" && "animate-spin")} />
              {style.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              {run.run_type}
            </span>
          </div>
          <h2 className="text-[15px] font-semibold text-foreground leading-tight">
            {run.summary || run.message || "Execução do agente"}
          </h2>
          {run.summary && run.message && (
            <p className="mt-1 text-[12px] text-muted-foreground/80 line-clamp-2">{run.message}</p>
          )}
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/30">
        <MetricCell icon={Clock} label="Duração" value={formatMs(run.total_ms ?? totals.duration_ms)} />
        <MetricCell icon={Wrench} label="Ferramentas" value={String(totals.tool_calls)} />
        <MetricCell icon={Coins} label="Custo" value={`${totals.cost_credits.toFixed(2)}c`} />
        <MetricCell
          icon={AlertTriangle}
          label="Erros"
          value={String(totals.errors)}
          tone={totals.errors > 0 ? "text-destructive" : undefined}
        />
        <MetricCell icon={Users} label="Agentes" value={String(agents.length)} />
      </div>

      {agents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {agents.slice(0, 6).map((a) => (
            <span
              key={a}
              className="text-[10px] font-mono text-muted-foreground bg-muted/40 border border-border/30 px-1.5 py-0.5 rounded"
            >
              {a}
            </span>
          ))}
          {agents.length > 6 && (
            <span className="text-[10px] text-muted-foreground/60">+{agents.length - 6}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

interface MetricCellProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: string;
}

const MetricCell = ({ icon: Icon, label, value, tone }: MetricCellProps) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground/60", tone)} />
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 leading-tight">{label}</div>
      <div className={cn("text-[12px] font-semibold tabular-nums text-foreground/90 truncate", tone)}>{value}</div>
    </div>
  </div>
);
