import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import { motion } from "framer-motion";
import {
  Bot, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Target, Shield, Activity, Coins
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import TokenAlertsTable from "@/components/dashboard/TokenAlertsTable";
import type { MonixMessage } from "@/hooks/useMonix";
import { useTranslation } from "react-i18next";

interface MonixDashboardProps {
  messages: MonixMessage[];
}

const MonixDashboard = ({ messages }: MonixDashboardProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { data: tokenUsage = [] } = useTokenUsage();

  const { data: agents = [] } = useQuery({
    queryKey: ["monix-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["monix-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("execution_logs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["monix-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agent_tasks").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const activeAgents = agents.filter(a => a.status === "active").length;
  const totalExecs = agents.reduce((s, a) => s + (a.total_executions || 0), 0);
  const successLogs = logs.filter(l => l.status === "success").length;
  const errorLogs = logs.filter(l => l.status === "error").length;
  const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 100;
  const avgTime = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / logs.length) : 0;
  const openTasks = tasks.filter(tk => tk.status === "open").length;

  const lastKpis = [...messages].reverse().find(m => m.kpis)?.kpis || null;

  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const dayLogs = logs.filter(l => l.created_at?.startsWith(key));
    return {
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      total: dayLogs.length,
      success: dayLogs.filter(l => l.status === "success").length,
      error: dayLogs.filter(l => l.status === "error").length,
    };
  });

  const kpiCards = [
    { label: t("cmd.active_agents"), value: activeAgents, icon: Bot, color: "text-primary" },
    { label: t("cmd.executions"), value: totalExecs, icon: Zap, color: "text-primary/70" },
    { label: t("cmd.success_rate"), value: `${successRate}%`, icon: CheckCircle, color: "text-accent-foreground" },
    { label: t("cmd.avg_time"), value: `${avgTime}ms`, icon: Clock, color: "text-muted-foreground" },
    { label: t("cmd.remaining_credits"), value: remainingCredits, icon: Coins, color: "text-primary/80" },
    { label: t("cmd.open_tasks"), value: openTasks, icon: Target, color: "text-destructive/70" },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card/40 border border-border/30 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
              <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="font-display font-bold text-lg">
              {typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} duration={1.2} /> : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Dynamic KPIs from AI */}
      {lastKpis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">{t("cmd.ai_insights")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lastKpis.map((kpi: any, i: number) => (
              <div key={i} className="bg-background/40 rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm">{kpi.value}</span>
                  {kpi.trend === "up" && <TrendingUp className="h-3 w-3 text-primary" />}
                  {kpi.trend === "down" && <TrendingUp className="h-3 w-3 text-destructive rotate-180" />}
                  {kpi.delta && <span className={`text-[10px] ${kpi.trend === "up" ? "text-primary" : "text-destructive"}`}>{kpi.delta}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Execution chart */}
      <div className="bg-card/40 border border-border/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{t("cmd.exec_7days")}</span>
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7days}>
              <defs>
                <linearGradient id="monixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="url(#monixGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="error" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agents status */}
      <div className="bg-card/40 border border-border/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">{t("cmd.agent_status_title")}</span>
        </div>
        <div className="space-y-2">
          {agents.slice(0, 6).map(agent => (
            <div key={agent.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                <span className="text-xs truncate max-w-[120px]">{agent.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{agent.total_executions} {t("cmd.exec_unit")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(errorLogs > 0 || usagePercentage > 80) && (
        <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold text-destructive">{t("cmd.alerts")}</span>
          </div>
          <div className="space-y-1.5">
            {errorLogs > 0 && <p className="text-[11px] text-muted-foreground">⚠️ {t("cmd.error_count", { count: errorLogs })}</p>}
            {usagePercentage > 80 && <p className="text-[11px] text-muted-foreground">⚠️ {t("cmd.credits_usage", { pct: usagePercentage })}</p>}
          </div>
        </div>
      )}

      {/* Footer status */}
      <div className="flex items-center justify-between py-2 px-1 text-[10px] text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          <span>{t("cmd.system_operational")}</span>
        </div>
        <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
};

export default MonixDashboard;
