import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Activity, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionHealth } from "@/hooks/useExecutionHealth";
import { Badge } from "@/components/ui/badge";

interface Props {
  onGoToWarRoom: () => void;
}

const ExecutionHealthBanner = ({ onGoToWarRoom }: Props) => {
  const { data: health, isLoading } = useExecutionHealth();

  if (isLoading || !health || health.totalExecutions === 0) return null;

  // Only show when there's something worth alerting
  const hasAlerts = health.failureAlerts.length > 0;
  const hasRecentErrors = health.recentErrors.length > 0;
  const isUnhealthy = !health.isHealthy;

  if (!hasAlerts && !hasRecentErrors && !isUnhealthy) return null;

  const severity = health.healthScore < 50 ? "critical" : health.healthScore < 70 ? "warning" : "info";

  const config = {
    critical: {
      icon: XCircle,
      bg: "bg-destructive/5 border-destructive/20",
      iconColor: "text-destructive",
      title: "Operação com falhas críticas",
      desc: `${health.errorRate}% taxa de erro · ${health.failureAlerts.length} alertas pendentes`,
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-500/5 border-amber-500/20",
      iconColor: "text-amber-400",
      title: "Atenção: erros detectados",
      desc: `${health.recentErrors.length} erros recentes · Score ${health.healthScore}/100`,
    },
    info: {
      icon: Activity,
      bg: "bg-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-400",
      title: "Monitoramento ativo",
      desc: `${health.successRate}% sucesso · ${health.avgExecutionTimeMs}ms médio`,
    },
  }[severity];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          "rounded-xl border p-3 flex items-center gap-3",
          config.bg
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
          <Icon className={cn("h-4 w-4", config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{config.title}</span>
            <Badge variant="outline" className="text-[8px] h-4 border-border/20">
              Score {health.healthScore}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{config.desc}</p>
        </div>
        <button
          onClick={onGoToWarRoom}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          War Room <ArrowRight className="h-3 w-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExecutionHealthBanner;
