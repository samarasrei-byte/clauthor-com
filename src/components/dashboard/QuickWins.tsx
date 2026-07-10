import { useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users, Target, ChevronRight, Zap } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { useTranslation } from "react-i18next";

interface QuickWin {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  priority: "high" | "medium" | "low";
  targetSection: string;
}

interface QuickWinsProps {
  activeAgents: number;
  totalExecutions: number;
  recentLogs: Array<{ action: string; status: string; agent_name: string; created_at: string }>;
  hasCompanyData: boolean;
  remainingCredits: number;
  onNavigate: (section: string) => void;
}

const QuickWins = ({ activeAgents, totalExecutions, recentLogs, hasCompanyData, remainingCredits, onNavigate }: QuickWinsProps) => {
  const { t } = useTranslation();

  const wins = useMemo(() => {
    const items: QuickWin[] = [];

    // No company data → teach agents
    if (!hasCompanyData) {
      items.push({
        id: "teach",
        icon: Target,
        title: t("dashboard.qw_teach_title", { defaultValue: "Ensine seus agentes sobre seu negócio" }),
        description: t("dashboard.qw_teach_desc", { defaultValue: "Agentes com contexto da empresa são 3x mais precisos. Leva 2 min." }),
        action: t("dashboard.qw_teach_action", { defaultValue: "Configurar empresa" }),
        priority: "high",
        targetSection: "empresa",
      });
    }

    // No agents → hire first
    if (activeAgents === 0) {
      items.push({
        id: "hire",
        icon: Users,
        title: t("dashboard.qw_hire_title", { defaultValue: "Contrate seu primeiro agente" }),
        description: t("dashboard.qw_hire_desc", { defaultValue: "Escolha entre dezenas de agentes especializados. Setup em 5 minutos." }),
        action: t("dashboard.qw_hire_action", { defaultValue: "Ver agentes" }),
        priority: "high",
        targetSection: "library",
      });
    }

    // Has agents but low executions → send first command
    if (activeAgents > 0 && totalExecutions < 5) {
      items.push({
        id: "command",
        icon: MessageSquare,
        title: t("dashboard.qw_command_title", { defaultValue: "Envie seu primeiro comando ao Thor" }),
        description: t("dashboard.qw_command_desc", { defaultValue: "Peça uma análise, relatório ou delegue uma tarefa. Thor orquestra tudo." }),
        action: t("dashboard.qw_command_action", { defaultValue: "Falar com Thor" }),
        priority: "medium",
        targetSection: "omnix",
      });
    }

    // Has executions with errors → investigate
    const errorLogs = recentLogs.filter(l => l.status === "error" || l.status === "failed");
    if (errorLogs.length > 2) {
      items.push({
        id: "errors",
        icon: Zap,
        title: t("dashboard.qw_errors_title", { defaultValue: `${errorLogs.length} execuções com erro detectadas` }),
        description: t("dashboard.qw_errors_desc", { defaultValue: "Verifique os logs para identificar e corrigir problemas." }),
        action: t("dashboard.qw_errors_action", { defaultValue: "Ver logs" }),
        priority: "high",
        targetSection: "insights",
      });
    }

    return items.slice(0, 3); // Max 3 quick wins
  }, [activeAgents, totalExecutions, recentLogs, hasCompanyData, remainingCredits, t]);

  if (wins.length === 0) return null;

  const priorityColors = {
    high: "border-primary/20 bg-primary/[0.03]",
    medium: "border-border/30 bg-card/30",
    low: "border-border/20 bg-card/20",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary/60 font-bold">
          {t("dashboard.quick_wins_title", { defaultValue: "QUICK WINS" })}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {wins.map((win, i) => (
          <motion.button
            key={win.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onNavigate(win.targetSection)}
            className={`text-left p-4 rounded-xl border ${priorityColors[win.priority]} hover:border-primary/30 transition-all duration-300 group`}
          >
            <div className="flex items-center gap-2 mb-2">
              <win.icon className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-xs font-semibold truncate">{win.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{win.description}</p>
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium group-hover:gap-2 transition-all">
              {win.action}
              <ChevronRight className="h-3 w-3" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickWins;
