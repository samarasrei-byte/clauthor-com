import { motion } from "framer-motion";
import { Bot, Zap, CheckCircle, TrendingUp, Coins, Clock, Target, DollarSign } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useTokenUsage } from "@/hooks/useCredits";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface DashboardStatsProps {
  activeAgents: number;
  totalExecutions: number;
  successRate: number;
  monthlyGrowth: number;
}

const DashboardStats = ({ activeAgents, totalExecutions, successRate, monthlyGrowth }: DashboardStatsProps) => {
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { data: tokenUsage = [] } = useTokenUsage();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;
  const currencyCode = locale.startsWith("pt") ? "BRL" : "USD";
  const formatNum = (n: number) => n.toLocaleString(locale);

  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + t.tokens_used, 0);
  const estimatedSavings = activeAgents * 7560;

  const successLogs = totalExecutions > 0 ? Math.round(successRate) : 0;
  const execTrend = totalExecutions > 100 ? `+${Math.min(99, Math.round(totalExecutions * 0.12))}` : totalExecutions > 0 ? `+${totalExecutions}` : "0";

  const stats = [
    { 
      icon: Bot, 
      label: t("dashboard.active_agents_label"), 
      value: activeAgents.toString(), 
      trend: monthlyGrowth > 0 ? `+${monthlyGrowth} ${t("dashboard.this_period")}` : activeAgents > 0 ? t("dashboard.stable") : t("dashboard.none"),
      color: "text-primary"
    },
    { 
      icon: Zap, 
      label: t("dashboard.total_executions_label"), 
      value: formatNum(totalExecutions), 
      trend: execTrend,
      color: "text-cyan-400"
    },
    { 
      icon: CheckCircle, 
      label: t("dashboard.success_rate_label"), 
      value: totalExecutions > 0 ? `${successRate}%` : "—", 
      trend: totalExecutions > 0 ? `${totalExecutions} ${t("dashboard.executions_label")}` : t("dashboard.no_data"),
      color: "text-primary/80"
    },
    { 
      icon: DollarSign, 
      label: t("dashboard.estimated_savings_label"), 
      value: activeAgents > 0 ? new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode, minimumFractionDigits: 0 }).format(estimatedSavings) : "—", 
      trend: activeAgents > 0 ? t("dashboard.vs_clt_month") : t("dashboard.hire_agents"),
      color: "text-cyan-400"
    },
    { 
      icon: Coins, 
      label: t("dashboard.tokens_consumed_label"), 
      value: totalTokensUsed > 1000000 
        ? `${(totalTokensUsed / 1000000).toFixed(1)}M` 
        : totalTokensUsed > 1000 
        ? `${(totalTokensUsed / 1000).toFixed(0)}k` 
        : totalTokensUsed.toString(),
      trend: `${formatNum(remainingCredits)} ${t("dashboard.tokens_remaining")}`,
      color: "text-primary"
    },
    { 
      icon: Target, 
      label: t("dashboard.plan_usage_label"), 
      value: `${usagePercentage}%`, 
      trend: credits?.plan_type || "free",
      color: usagePercentage > 80 ? "text-destructive" : "text-cyan-400"
    },
    { 
      icon: Clock, 
      label: t("dashboard.hours_saved_label"), 
      value: activeAgents > 0 ? `${Math.round(totalExecutions * 0.03)}h` : "—",
      trend: activeAgents > 0 ? t("dashboard.this_period") : t("dashboard.no_data"),
      color: "text-primary/80"
    },
    { 
      icon: TrendingUp, 
      label: t("dashboard.roi_label"), 
      value: activeAgents > 0 ? `${Math.round(((estimatedSavings - (activeAgents * 3997)) / Math.max(activeAgents * 3997, 1)) * 100)}%` : "—",
      trend: activeAgents > 0 ? t("dashboard.return_month") : t("dashboard.hire_agents"),
      color: "text-cyan-400"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="glass-card rounded-2xl p-5 glass-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="text-xs text-primary font-medium">{s.trend}</span>
              </div>
              <p className="font-display text-2xl font-bold mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Token Usage Bar */}
      {credits && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t("dashboard.token_consumption_label")}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatNum(credits.used_credits)} / {formatNum(credits.total_credits)}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2.5" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatNum(remainingCredits)} tokens {t("dashboard.tokens_remaining")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("dashboard.reset_label")} {credits.credits_reset_at ? new Date(credits.credits_reset_at).toLocaleDateString(locale, { day: "2-digit", month: "short" }) : "—"}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardStats;
