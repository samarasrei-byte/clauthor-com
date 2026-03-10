import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Target, Coins, Cpu, Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import AudioSpectrum from "./AudioSpectrum";
import type { OmnixMessage } from "@/hooks/useOmnix";
import { useTranslation } from "react-i18next";

interface OmnixDashboardProps {
  messages: OmnixMessage[];
  isSpeaking: boolean;
  compact?: boolean;
}

const OmnixDashboard = ({ messages, isSpeaking, compact }: OmnixDashboardProps) => {
  const { user } = useAuth();
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { t } = useTranslation();

  const { data: agents = [] } = useQuery({
    queryKey: ["omnix-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["omnix-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("execution_logs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["omnix-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agent_tasks").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const activeAgents = agents.filter(a => a.status === "active").length;
  const totalExecs = agents.reduce((s, a) => s + (a.total_executions || 0), 0);
  const successLogs = logs.filter(l => l.status === "success").length;
  const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 100;
  const avgTime = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / logs.length) : 0;
  const openTasks = tasks.filter(task => task.status === "open").length;

  const lastKpis = [...messages].reverse().find(m => m.kpis)?.kpis || null;

  const kpiLabels = {
    agents: t("omnix.agents", { defaultValue: "Agentes" }),
    executions: t("omnix.executions", { defaultValue: "Execuções" }),
    success: t("omnix.success", { defaultValue: "Sucesso" }),
    time: t("omnix.time", { defaultValue: "Tempo" }),
    credits: t("omnix.credits", { defaultValue: "Créditos" }),
    tasks: t("omnix.tasks", { defaultValue: "Tarefas" }),
  };

  const kpiCards = [
    { label: kpiLabels.agents, value: activeAgents, icon: Bot, color: "text-primary" },
    { label: kpiLabels.executions, value: totalExecs, icon: Zap, color: "text-primary/70" },
    { label: kpiLabels.success, value: `${successRate}%`, icon: CheckCircle, color: "text-accent-foreground" },
    { label: kpiLabels.time, value: `${avgTime}ms`, icon: Clock, color: "text-muted-foreground" },
    { label: kpiLabels.credits, value: remainingCredits, icon: Coins, color: "text-primary/80" },
    { label: kpiLabels.tasks, value: openTasks, icon: Target, color: "text-destructive/70" },
  ];

  // Compact mode: just KPIs in a horizontal bar
  if (compact) {
    return (
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-1 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-widest">THOR ONLINE</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {kpiCards.map((kpi, i) => (
            <div key={kpi.label} className="flex items-center gap-1.5 shrink-0 bg-card/30 border border-border/15 rounded-lg px-2.5 py-1.5">
              <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
              <span className="text-[10px] text-muted-foreground/70">{kpi.label}</span>
              <span className="font-display font-bold text-xs">
                {typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} duration={1} /> : kpi.value}
              </span>
            </div>
          ))}

          {/* AI Insights inline */}
          {lastKpis && lastKpis.slice(0, 3).map((kpi: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5 shrink-0 bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground/60">{kpi.label}</span>
              <span className="font-display font-bold text-xs">{kpi.value}</span>
              {kpi.trend === "up" && <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />}
            </div>
          ))}

          {/* Alerts inline */}
          {usagePercentage > 80 && (
            <div className="flex items-center gap-1.5 shrink-0 bg-destructive/5 border border-destructive/10 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-[10px] text-destructive/70">{kpiLabels.credits} {usagePercentage}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full dashboard (fallback, not used in new layout but kept for compatibility)
  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const dayLogs = logs.filter(l => l.created_at?.startsWith(key));
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      total: dayLogs.length,
      success: dayLogs.filter(l => l.status === "success").length,
      error: dayLogs.filter(l => l.status === "error").length,
    };
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">System Dashboard</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400/70">ALL SYSTEMS ONLINE</span>
        </div>
      </div>

      <AnimatePresence>
        {isSpeaking && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-primary/5 border border-primary/10 rounded-xl p-3">
            <AudioSpectrum active={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} className="bg-card/30 border border-border/20 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
              <span className="text-[10px] text-muted-foreground/70">{kpi.label}</span>
            </div>
            <p className="font-display font-bold text-lg">
              {typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} duration={1.2} /> : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {lastKpis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Insights</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lastKpis.map((kpi: any, i: number) => (
              <div key={i} className="bg-background/30 rounded-lg p-2">
                <p className="text-[9px] text-muted-foreground/60">{kpi.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm">{kpi.value}</span>
                  {kpi.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                  {kpi.trend === "down" && <TrendingUp className="h-3 w-3 text-destructive rotate-180" />}
                  {kpi.delta && <span className={`text-[9px] ${kpi.trend === "up" ? "text-emerald-400" : "text-destructive"}`}>{kpi.delta}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="bg-card/30 border border-border/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">{t("omnix.exec_7days", { defaultValue: "Execuções — 7 dias" })}</span>
        </div>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7days}>
              <defs>
                <linearGradient id="thorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.2)", borderRadius: "8px", fontSize: "10px" }} />
              <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="url(#thorGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="error" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OmnixDashboard;
