import { motion } from "framer-motion";
import {
  Bot, Zap, CheckCircle, DollarSign, Coins, Target,
  TrendingUp, ArrowUpRight, Sparkles, Clock, Activity,
  Shield, Cpu, BarChart3, Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import AnimatedCounter from "./AnimatedCounter";
import MiniSparkline from "./MiniSparkline";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import GettingStartedGuide from "./GettingStartedGuide";
import AgentSummaryCards from "./AgentSummaryCards";
import { useTranslation } from "react-i18next";

interface ClientCommandCenterProps {
  activeAgents: number;
  totalExecutions: number;
  totalTokensUsed: number;
  usagePercentage: number;
  estimatedSavings: number;
  credits: any;
  remainingCredits: number;
  agents: any[];
  subscriptions: any[];
  recentLogs: any[];
  tokenUsage: any[];
}

const ClientCommandCenter = ({
  activeAgents,
  totalExecutions,
  totalTokensUsed,
  usagePercentage,
  estimatedSavings,
  credits,
  remainingCredits,
  agents,
  subscriptions,
  recentLogs,
  tokenUsage,
}: ClientCommandCenterProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const successLogs = recentLogs.filter((l: any) => l.status === "success").length;
  const successRate = recentLogs.length > 0 ? Math.round((successLogs / recentLogs.length) * 100) : 100;

  const currencyPrefix = locale.startsWith("pt") ? "R$ " : "$ ";

  const kpiCards = [
    { icon: Bot, label: t("dashboard.active_agents"), value: activeAgents, spark: [1, 2, 2, 3, 3, activeAgents], color: "text-primary" },
    { icon: Zap, label: t("dashboard.executions"), value: totalExecutions, spark: [100, 200, 350, 500, 800, totalExecutions || 0], color: "text-cyan-400" },
    { icon: CheckCircle, label: t("dashboard.success_rate_short"), value: successRate, suffix: "%", spark: [95, 96, 97, 97.5, 98, successRate], color: "text-emerald-500" },
    { icon: DollarSign, label: t("dashboard.savings_month"), value: estimatedSavings, prefix: currencyPrefix, spark: [2000, 4000, 5000, 6000, 7000, estimatedSavings || 0], color: "text-cyan-400" },
    { icon: Coins, label: t("dashboard.tokens_used"), value: totalTokensUsed, spark: [0, 100, 300, 500, 800, totalTokensUsed || 0], color: "text-primary" },
    { icon: Target, label: t("dashboard.plan_usage"), value: usagePercentage, suffix: "%", spark: [10, 20, 30, 40, 50, usagePercentage], color: usagePercentage > 80 ? "text-destructive" : "text-cyan-400" },
    { icon: Shield, label: t("dashboard.uptime_label"), value: 99.9, suffix: "%", spark: [99.5, 99.7, 99.8, 99.9, 99.9, 99.9], color: "text-emerald-500" },
    { icon: Flame, label: t("dashboard.subscriptions"), value: subscriptions.length, spark: [0, 1, 1, 2, 2, subscriptions.length], color: "text-primary" },
  ];

  const executionChartData = [
    { name: t("dashboard.mon"), exec: 12, success: 11 },
    { name: t("dashboard.tue"), exec: 18, success: 17 },
    { name: t("dashboard.wed"), exec: 25, success: 24 },
    { name: t("dashboard.thu"), exec: 22, success: 21 },
    { name: t("dashboard.fri"), exec: 30, success: 29 },
    { name: t("dashboard.sat"), exec: 15, success: 15 },
    { name: t("dashboard.sun"), exec: 8, success: 8 },
  ];

  const tierDistribution = [
    { name: "Basic", value: agents.filter(a => a.tier === "basic").length, color: "hsl(var(--muted-foreground))" },
    { name: "Intermediate", value: agents.filter(a => a.tier === "intermediate").length, color: "#22d3ee" },
    { name: "Advanced", value: agents.filter(a => a.tier === "advanced").length, color: "#10b981" },
    { name: "Enterprise", value: agents.filter(a => a.tier === "enterprise").length, color: "hsl(var(--primary))" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Getting Started Guide */}
      <GettingStartedGuide
        hasAgents={activeAgents > 0}
        hasSentMessage={recentLogs.length > 0}
        hasConfiguredAgent={agents.some((a: any) => a.integrations || a.channels)}
      />

      {/* Agent Summary Cards */}
      <AgentSummaryCards agents={agents} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 border border-emerald-500/10 bg-gradient-to-r from-emerald-500/[0.03] to-transparent"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">{t("dashboard.all_systems")}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t("dashboard.agents_active_count", { count: activeAgents })} • {t("dashboard.success_pct", { pct: successRate })} • {t("dashboard.uptime_label")} 99.9%
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">HEALTHY</Badge>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card rounded-2xl p-4 glass-hover group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <MiniSparkline data={kpi.spark} color={kpi.color.includes("primary") ? "hsl(var(--primary))" : kpi.color.includes("cyan") ? "#22d3ee" : "#10b981"} />
            </div>
            <p className="font-display text-xl font-bold">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Token Usage Premium */}
      {credits && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t("dashboard.token_consumption")}</span>
              <Badge variant="secondary" className="text-[10px] uppercase">{credits.plan_type}</Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {credits.used_credits.toLocaleString(locale)} / {credits.total_credits.toLocaleString(locale)}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2.5" />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">{remainingCredits.toLocaleString(locale)} {locale.startsWith("pt") ? "restantes" : "remaining"}</span>
            <span className="text-[10px] text-muted-foreground">
              {t("dashboard.reset_label")}: {credits.credits_reset_at ? new Date(credits.credits_reset_at).toLocaleDateString(locale, { day: "2-digit", month: "short" }) : "—"}
            </span>
          </div>
          <TokenUpgradeDialog trigger={
            <Button size="sm" variant="outline" className="w-full mt-3 gap-1.5 border-primary/20 text-primary text-xs">
              <Coins className="h-3 w-3" /> {t("dashboard.token_upgrade")}
            </Button>
          } />
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Executions Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 glass-card rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium">{t("dashboard.weekly_executions")}</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">{t("dashboard.days_label")}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={executionChartData}>
              <defs>
                <linearGradient id="clientExecGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="exec" stroke="#22d3ee" fill="url(#clientExecGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tier Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("dashboard.my_agents_chart")}</span>
          </div>
          {tierDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={tierDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                    {tierDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {tierDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[140px] text-center">
              <Sparkles className="h-8 w-8 text-primary/30 mb-2" />
              <p className="text-xs text-muted-foreground">{t("dashboard.no_agents_created")}</p>
              <Link to="/library"><Button size="sm" className="mt-2 text-xs">{t("dashboard.explore")}</Button></Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("dashboard.recent_activity_label")}</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">{t("dashboard.last_10")}</Badge>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{t("dashboard.no_executions")}</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-emerald-500" : "bg-destructive"}`} />
                <span className="text-xs font-medium flex-1 truncate">{log.agent_name}</span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{log.action}</span>
                {log.execution_time_ms && (
                  <span className="text-[10px] text-muted-foreground font-mono">{log.execution_time_ms}ms</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClientCommandCenter;
