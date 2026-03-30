import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Clock, Users, Sparkles, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ROIDashboardProps {
  agents: any[];
  totalExecutions: number;
  totalTokensUsed: number;
  estimatedSavings: number;
}

const ROIDashboard = ({ agents, totalExecutions, totalTokensUsed, estimatedSavings }: ROIDashboardProps) => {
  const { t } = useTranslation();

  const metrics = useMemo(() => {
    const hoursWorked = Math.round(totalExecutions * 0.35);
    const humanEquivalentCost = hoursWorked * 45; // R$45/h average
    const agentCost = agents.length * 345; // R$345/dept average
    const netSavings = Math.max(humanEquivalentCost - agentCost, 0);
    const roi = agentCost > 0 ? Math.round((netSavings / agentCost) * 100) : 0;

    return { hoursWorked, humanEquivalentCost, agentCost, netSavings, roi };
  }, [agents, totalExecutions]);

  const cards = [
    {
      icon: Clock,
      label: t("roi.hours_saved", { defaultValue: "Horas Economizadas" }),
      value: `${metrics.hoursWorked}h`,
      sub: t("roi.hours_sub", { defaultValue: "vs. equipe humana" }),
      trend: "+12%",
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: DollarSign,
      label: t("roi.savings", { defaultValue: "Economia Total" }),
      value: `R$ ${metrics.netSavings.toLocaleString("pt-BR")}`,
      sub: t("roi.savings_sub", { defaultValue: "este mês" }),
      trend: "+18%",
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      icon: TrendingUp,
      label: t("roi.roi", { defaultValue: "ROI" }),
      value: `${metrics.roi}%`,
      sub: t("roi.roi_sub", { defaultValue: "retorno sobre investimento" }),
      trend: "+5%",
      color: "text-primary",
      bg: "from-primary/10 to-primary/5",
    },
    {
      icon: Users,
      label: t("roi.equivalent", { defaultValue: "Equiv. Humano" }),
      value: `${Math.max(1, Math.round(agents.length * 0.8))}`,
      sub: t("roi.equivalent_sub", { defaultValue: "funcionários substituídos" }),
      trend: "",
      color: "text-amber-400",
      bg: "from-amber-500/10 to-amber-500/5",
    },
  ];

  if (agents.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold">
            {t("roi.title", { defaultValue: "ROI em Tempo Real" })}
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
          {t("roi.live", { defaultValue: "● Ao vivo" })}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "rounded-xl border border-border/20 bg-gradient-to-br p-4 space-y-2",
                card.bg
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn("h-4 w-4", card.color)} />
                {card.trend && (
                  <span className="text-[9px] font-medium text-emerald-400 flex items-center gap-0.5">
                    <ArrowUpRight className="h-2.5 w-2.5" /> {card.trend}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xl font-bold font-display">{card.value}</div>
                <div className="text-[10px] text-muted-foreground">{card.label}</div>
              </div>
              <div className="text-[9px] text-muted-foreground/60">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison bar */}
      <div className="rounded-lg border border-border/10 bg-card/30 p-3">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-muted-foreground">
            {t("roi.comparison", { defaultValue: "Custo Humano vs IA" })}
          </span>
          <span className="font-bold text-emerald-400">
            {metrics.roi}% {t("roi.cheaper", { defaultValue: "mais barato" })}
          </span>
        </div>
        <div className="flex gap-1.5 h-3">
          <div
            className="bg-destructive/40 rounded-full transition-all"
            style={{ width: `${Math.min(100, (metrics.humanEquivalentCost / Math.max(1, metrics.humanEquivalentCost)) * 100)}%` }}
          />
          <div
            className="bg-emerald-500/60 rounded-full transition-all"
            style={{ width: `${Math.min(100, (metrics.agentCost / Math.max(1, metrics.humanEquivalentCost)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>👤 R$ {metrics.humanEquivalentCost.toLocaleString("pt-BR")}</span>
          <span>🤖 R$ {metrics.agentCost.toLocaleString("pt-BR")}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ROIDashboard;
