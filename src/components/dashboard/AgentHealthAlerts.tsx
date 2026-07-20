import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, PauseCircle, XCircle, ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAgentHealth, type AgentAlert, type AgentAlertKind } from "@/hooks/useAgentHealth";

const KIND_ICON: Record<AgentAlertKind, any> = {
  consecutive_failures: XCircle,
  high_error_rate: AlertTriangle,
  cost_spike: TrendingUp,
  queue_backlog: Activity,
  stalled: PauseCircle,
};

const SEVERITY_CLASS = {
  critical: {
    ring: "border-destructive/25 bg-destructive/5",
    icon: "text-destructive",
    pill: "bg-destructive/10 text-destructive",
  },
  warning: {
    ring: "border-warning/25 bg-warning/5",
    icon: "text-warning",
    pill: "bg-warning/10 text-warning",
  },
  info: {
    ring: "border-info/20 bg-info/5",
    icon: "text-info",
    pill: "bg-info/10 text-info",
  },
} as const;

const AgentHealthAlerts = () => {
  const { data, isLoading } = useAgentHealth();
  const navigate = useNavigate();

  if (isLoading || !data || data.alerts.length === 0) return null;

  const top = data.alerts.slice(0, 4);
  const rest = data.alerts.length - top.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Alertas de saúde dos agentes"
      className="rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Alertas de saúde dos agentes</h3>
            <p className="text-[10px] text-muted-foreground">
              {data.alerts.length} anomalia{data.alerts.length > 1 ? "s" : ""} detectada
              {data.alerts.length > 1 ? "s" : ""} · última varredura agora
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] border-border/40">
          Monitoramento contínuo
        </Badge>
      </header>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {top.map((alert) => (
            <AlertRow
              key={`${alert.agentId}-${alert.kind}`}
              alert={alert}
              onOpen={() => navigate(`/agents/${alert.agentId}/metrics`)}
            />
          ))}
        </AnimatePresence>
      </ul>

      {rest > 0 && (
        <button
          onClick={() => navigate("/dashboard/traces")}
          className="mt-3 w-full text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          + {rest} outros alertas · abrir War Room
        </button>
      )}
    </motion.section>
  );
};

function AlertRow({ alert, onOpen }: { alert: AgentAlert; onOpen: () => void }) {
  const Icon = KIND_ICON[alert.kind] ?? AlertTriangle;
  const cls = SEVERITY_CLASS[alert.severity];
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      className={cn("rounded-xl border p-3 flex items-center gap-3", cls.ring)}
    >
      <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
        <Icon className={cn("h-4 w-4", cls.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold truncate">{alert.title}</span>
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded", cls.pill)}>{alert.metric}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
      </div>
      <button
        onClick={onOpen}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
      >
        Analisar <ArrowRight className="h-3 w-3" />
      </button>
    </motion.li>
  );
}

export default AgentHealthAlerts;
