import { motion } from "framer-motion";
import {
  Bot, Zap, DollarSign, CheckCircle, Coins, Cpu,
  Activity, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AnimatedCounter from "./AnimatedCounter";
import MiniSparkline from "./MiniSparkline";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ConsolidatedMetricsProps {
  activeAgents: number;
  totalExecutions: number;
  totalTokensUsed: number;
  usagePercentage: number;
  estimatedSavings: number;
  credits: any;
  remainingCredits: number;
  recentLogs: any[];
  successRate: number;
}

const ConsolidatedMetrics = ({
  activeAgents,
  totalExecutions,
  totalTokensUsed,
  usagePercentage,
  estimatedSavings,
  credits,
  remainingCredits,
  recentLogs,
  successRate,
}: ConsolidatedMetricsProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : (i18n.language || "en");
  const currencyPrefix = "$ ";

  // Build chart data
  const executionChartData = (() => {
    const days: { name: string; exec: number; success: number }[] = [];
    const dayKeys = [
      t("dashboard.sun"), t("dashboard.mon"), t("dashboard.tue"),
      t("dashboard.wed"), t("dashboard.thu"), t("dashboard.fri"), t("dashboard.sat"),
    ];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = dayKeys[d.getDay()];
      const logsInDay = recentLogs.filter((l: any) => {
        const ld = new Date(l.created_at);
        return ld.toDateString() === d.toDateString();
      });
      days.push({
        name: dayName,
        exec: logsInDay.length,
        success: logsInDay.filter((l: any) => l.status === "success").length,
      });
    }
    return days;
  })();

  const heroKpis = [
    {
      icon: Bot,
      label: t("dashboard.active_agents"),
      value: activeAgents,
      spark: [1, 2, 2, 3, 3, activeAgents],
      color: "text-primary",
      sparkColor: "hsl(var(--primary))",
    },
    {
      icon: Zap,
      label: t("dashboard.executions"),
      value: totalExecutions,
      spark: [100, 200, 350, 500, 800, totalExecutions || 0],
      color: "text-cyan-400",
      sparkColor: "#22d3ee",
      // Inline health indicator
      badge: `${successRate}%`,
      badgeColor: successRate >= 90 ? "text-emerald-400 bg-emerald-500/10" : successRate >= 70 ? "text-amber-400 bg-amber-500/10" : "text-destructive bg-destructive/10",
    },
    {
      icon: DollarSign,
      label: t("dashboard.savings_month"),
      value: estimatedSavings,
      prefix: currencyPrefix,
      suffix: "*",
      spark: [2000, 4000, 5000, 6000, 7000, estimatedSavings || 0],
      color: "text-emerald-400",
      sparkColor: "#10b981",
      tooltip: t("dashboard.savings_tooltip", { defaultValue: "Estimativa baseada na média de economia por agente ativo" }),
    },
  ];

  return (
    <div className="space-y-4">
      {/* System Status - compact inline */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03]"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">
          {t("dashboard.agents_active_count", { count: activeAgents })} · {t("dashboard.success_pct", { pct: successRate })}
        </span>
        <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[9px]">ONLINE</Badge>
      </motion.div>

      {/* Hero KPIs — 3 cards with embedded health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {heroKpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl p-4 border border-border/40 bg-card/60 group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
              </div>
              <div className="flex items-center gap-2">
                {(kpi as any).badge && (
                  <Badge className={`text-[9px] border-0 ${(kpi as any).badgeColor}`}>
                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                    {(kpi as any).badge}
                  </Badge>
                )}
                <MiniSparkline data={kpi.spark} color={kpi.sparkColor} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} />
              {(kpi as any).suffix && <span className="text-xs text-muted-foreground ml-0.5">{(kpi as any).suffix}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {kpi.label}
              {(kpi as any).tooltip && (
                <span className="ml-1 opacity-60" title={(kpi as any).tooltip}>ⓘ</span>
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Token + Chart in a single row */}
      <div className="grid lg:grid-cols-5 gap-3">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 rounded-2xl p-4 border border-border/40 bg-card/60"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-xs font-medium">{t("dashboard.weekly_executions")}</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={executionChartData}>
              <defs>
                <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
              <Area type="monotone" dataKey="exec" stroke="#22d3ee" fill="url(#execGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token Usage */}
        {credits && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-2xl p-4 border border-border/40 bg-card/60 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{t("dashboard.token_consumption")}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-3">
                <p className="font-display text-2xl font-bold">
                  {remainingCredits.toLocaleString(locale)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {"credits remaining"}
                </p>
              </div>

              <Progress value={usagePercentage} className="h-2 mb-2" />

              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{credits.used_credits.toLocaleString(locale)} {"used"}</span>
                <span>{credits.total_credits.toLocaleString(locale)} total</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-[9px] uppercase">{credits.plan_type}</Badge>
                <span className="text-[9px] text-muted-foreground">
                  {t("dashboard.reset_label")}: {credits.credits_reset_at ? new Date(credits.credits_reset_at).toLocaleDateString(locale, { day: "2-digit", month: "short" }) : "—"}
                </span>
              </div>
            </div>

            <TokenUpgradeDialog trigger={
              <Button size="sm" variant="outline" className="w-full mt-3 gap-1.5 border-primary/20 text-primary text-[10px]">
                <Coins className="h-3 w-3" /> {t("dashboard.token_upgrade")}
              </Button>
            } />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConsolidatedMetrics;
