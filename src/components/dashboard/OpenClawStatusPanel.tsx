import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot, CheckCircle, XCircle, Clock, Activity, Zap,
  TrendingUp, Shield, Wifi, WifiOff, AlertTriangle,
  BarChart3, Timer, ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import MiniSparkline from "./MiniSparkline";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; dot: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: CheckCircle, dot: "bg-emerald-500" },
  registered: { label: "Registrado", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20", icon: Wifi, dot: "bg-cyan-500" },
  pending: { label: "Pendente", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Clock, dot: "bg-amber-500" },
  error: { label: "Erro", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: XCircle, dot: "bg-red-500" },
};

const OpenClawStatusPanel = () => {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["admin-openclaw-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openclaw_registrations")
        .select("*, agents(id, name, tier, status, total_executions)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["admin-openclaw-exec-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*")
        .eq("action", "openclaw_execution")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Aggregate metrics
  const activeCount = registrations.filter((r: any) => r.status === "active").length;
  const registeredCount = registrations.filter((r: any) => r.status === "registered").length;
  const pendingCount = registrations.filter((r: any) => r.status === "pending").length;
  const errorCount = registrations.filter((r: any) => r.status === "error").length;
  const totalRegistered = registrations.length;

  const totalExecs = registrations.reduce((acc: number, r: any) => acc + (r.agents?.total_executions || 0), 0);
  const successLogs = recentLogs.filter((l: any) => l.status === "success").length;
  const successRate = recentLogs.length > 0 ? Math.round((successLogs / recentLogs.length) * 100) : 100;
  const avgTime = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((acc: number, l: any) => acc + (l.execution_time_ms || 0), 0) / recentLogs.length)
    : 0;

  const kpis = [
    { icon: Bot, label: "Agentes Registrados", value: totalRegistered, color: "text-primary", spark: [0, 5, 12, 20, 30, totalRegistered] },
    { icon: CheckCircle, label: "Ativos no Motor", value: activeCount + registeredCount, color: "text-emerald-400", spark: [0, 3, 8, 15, 20, activeCount + registeredCount] },
    { icon: Zap, label: "Execuções OpenClaw", value: totalExecs, color: "text-cyan-400", spark: [0, 50, 200, 500, 800, totalExecs] },
    { icon: TrendingUp, label: "Taxa de Sucesso", value: successRate, suffix: "%", color: "text-emerald-400", spark: [90, 92, 95, 96, 98, successRate] },
    { icon: Timer, label: "Tempo Médio", value: avgTime, suffix: "ms", color: "text-amber-400", spark: [500, 400, 350, 300, 250, avgTime] },
    { icon: AlertTriangle, label: "Em Erro", value: errorCount, color: "text-red-400", spark: [0, 1, 0, 2, 1, errorCount] },
  ];

  // Deduplicate: keep latest registration per agent
  const latestByAgent = new Map<string, any>();
  registrations.forEach((r: any) => {
    if (!latestByAgent.has(r.agent_id) || new Date(r.created_at) > new Date(latestByAgent.get(r.agent_id).created_at)) {
      latestByAgent.set(r.agent_id, r);
    }
  });
  const uniqueRegistrations = Array.from(latestByAgent.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            Motor OpenClaw
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              CONECTADO
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">Status de todos os agentes registrados no motor de execução</p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-background/40 backdrop-blur-xl border border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <MiniSparkline data={kpi.spark} color="hsl(var(--primary))" />
                </div>
                <div className="font-display text-xl font-bold">
                  <AnimatedCounter value={kpi.value} />{kpi.suffix || ""}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = key === "active"
            ? activeCount
            : key === "registered" ? registeredCount
            : key === "pending" ? pendingCount
            : errorCount;
          const pct = totalRegistered > 0 ? Math.round((count / totalRegistered) * 100) : 0;
          return (
            <Card key={key} className="bg-background/40 backdrop-blur-xl border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{cfg.label}</span>
                </div>
                <div className="font-display text-2xl font-bold mb-1">{count}</div>
                <Progress value={pct} className="h-1" />
                <span className="text-[10px] text-muted-foreground mt-1 block">{pct}% do total</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Table */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Agentes no Motor ({uniqueRegistrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : uniqueRegistrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <WifiOff className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum agente registrado no OpenClaw ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Agente</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Tier</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Status OpenClaw</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">OpenClaw ID</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Execuções</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Último Webhook</th>
                    <th className="text-left p-3 text-muted-foreground font-medium text-xs">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueRegistrations.map((reg: any, i: number) => {
                    const cfg = statusConfig[reg.status] || statusConfig.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.tr
                        key={reg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border/30 hover:bg-accent/10 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary/60" />
                            <span className="font-medium">{reg.agents?.name || "-"}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">{reg.agents?.tier || "-"}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={`${cfg.color} border text-[10px] gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {reg.openclaw_agent_id ? reg.openclaw_agent_id.slice(0, 12) + "…" : "-"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {reg.agents?.total_executions?.toLocaleString("en-US") || "0"}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {reg.last_webhook_at
                            ? new Date(reg.last_webhook_at).toLocaleString("en-US", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                            : "-"}
                        </td>
                        <td className="p-3">
                          {reg.error_message ? (
                            <span className="text-red-400 text-xs truncate max-w-[200px] block" title={reg.error_message}>
                              {reg.error_message.slice(0, 40)}…
                            </span>
                          ) : (
                            <span className="text-emerald-400/50 text-xs">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenClawStatusPanel;
