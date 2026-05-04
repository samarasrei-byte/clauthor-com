import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Sparkles, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ROIDashboardProps {
  agents: any[];
  totalExecutions: number;
  totalTokensUsed: number;
  estimatedSavings: number;
}

/** Compare this week vs last week to get real trend % */
function computeWeeklyTrend(logs: { created_at: string }[]): number {
  const now = Date.now();
  const oneWeek = 7 * 86_400_000;
  const thisWeek = logs.filter(l => now - new Date(l.created_at).getTime() < oneWeek).length;
  const lastWeek = logs.filter(l => {
    const age = now - new Date(l.created_at).getTime();
    return age >= oneWeek && age < oneWeek * 2;
  }).length;
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
}

const ROIDashboard = ({ agents, totalExecutions, totalTokensUsed, estimatedSavings }: ROIDashboardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch real execution logs for trend computation
  const { data: execLogs = [] } = useQuery({
    queryKey: ["roi-exec-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("created_at, status, execution_time_ms")
        .eq("user_id", user!.id)
        .gte("created_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const metrics = useMemo(() => {
    const hoursWorked = Math.round(totalExecutions * 0.35);
    const humanEquivalentCost = hoursWorked * 45;
    const agentCost = agents.length * 345;
    const netSavings = Math.max(humanEquivalentCost - agentCost, 0);
    const roi = agentCost > 0 ? Math.round((netSavings / agentCost) * 100) : 0;

    // Real trends from execution data
    const execTrend = computeWeeklyTrend(execLogs);
    const successLogs = execLogs.filter(l => l.status === "success");
    const savingsTrend = computeWeeklyTrend(successLogs);

    // Efficiency trend: compare avg execution time this week vs last
    const now = Date.now();
    const oneWeek = 7 * 86_400_000;
    const thisWeekLogs = execLogs.filter(l => now - new Date(l.created_at).getTime() < oneWeek && l.execution_time_ms);
    const lastWeekLogs = execLogs.filter(l => {
      const age = now - new Date(l.created_at).getTime();
      return age >= oneWeek && age < oneWeek * 2 && l.execution_time_ms;
    });
    const avgThis = thisWeekLogs.length > 0 ? thisWeekLogs.reduce((a, l) => a + (l.execution_time_ms || 0), 0) / thisWeekLogs.length : 0;
    const avgLast = lastWeekLogs.length > 0 ? lastWeekLogs.reduce((a, l) => a + (l.execution_time_ms || 0), 0) / lastWeekLogs.length : 0;
    // Faster = positive trend (inverted since lower ms is better)
    const efficiencyTrend = avgLast > 0 ? Math.round(((avgLast - avgThis) / avgLast) * 100) : 0;

    return { hoursWorked, humanEquivalentCost, agentCost, netSavings, roi, execTrend, savingsTrend, efficiencyTrend };
  }, [agents, totalExecutions, execLogs]);

  const formatTrend = (val: number) => {
    if (val === 0) return { text: "-", icon: Minus, color: "text-muted-foreground" };
    if (val > 0) return { text: `+${val}%`, icon: ArrowUpRight, color: "text-emerald-400" };
    return { text: `${val}%`, icon: ArrowDownRight, color: "text-destructive" };
  };

  const hoursTrend = formatTrend(metrics.execTrend);
  const savTrend = formatTrend(metrics.savingsTrend);
  const roiTrend = formatTrend(metrics.efficiencyTrend);

  const cards = [
    {
      icon: Clock,
      label: t("roi.hours_saved", { defaultValue: "Horas Economizadas" }),
      value: `${metrics.hoursWorked}h`,
      sub: t("roi.hours_sub", { defaultValue: "vs. equipe humana" }),
      trend: hoursTrend,
      color: "text-blue-400",
      bg: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: DollarSign,
      label: t("roi.savings", { defaultValue: "Economia Total" }),
      value: `R$ ${metrics.netSavings.toLocaleString("pt-BR")}`,
      sub: t("roi.savings_sub", { defaultValue: "este mês" }),
      trend: savTrend,
      color: "text-emerald-400",
      bg: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      icon: TrendingUp,
      label: t("roi.roi", { defaultValue: "ROI" }),
      value: `${metrics.roi}%`,
      sub: t("roi.roi_sub", { defaultValue: "retorno sobre investimento" }),
      trend: roiTrend,
      color: "text-primary",
      bg: "from-primary/10 to-primary/5",
    },
    {
      icon: Users,
      label: t("roi.equivalent", { defaultValue: "Equiv. Humano" }),
      value: `${Math.max(1, Math.round(agents.length * 0.8))}`,
      sub: t("roi.equivalent_sub", { defaultValue: "funcionários substituídos" }),
      trend: null,
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
          const TrendIcon = card.trend?.icon;
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
                {card.trend && TrendIcon && (
                  <span className={cn("text-[9px] font-medium flex items-center gap-0.5", card.trend.color)}>
                    <TrendIcon className="h-2.5 w-2.5" /> {card.trend.text}
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
