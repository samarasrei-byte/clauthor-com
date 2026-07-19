import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Bot, Zap, Clock, CheckCircle2, XCircle, Coins, Activity, AlertTriangle, PlayCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MiniSparkline from "@/components/dashboard/MiniSparkline";
import { useAgentHealth } from "@/hooks/useAgentHealth";


const STATUS_COLORS: Record<string, string> = {
  success: "text-emerald-400 bg-emerald-500/10",
  error: "text-destructive bg-destructive/10",
  failed: "text-destructive bg-destructive/10",
  pending: "text-amber-400 bg-amber-500/10",
  running: "text-blue-400 bg-blue-500/10",
};

const AgentMetricsDetail = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: health } = useAgentHealth();

  const agentQ = useQuery({
    queryKey: ["agent-detail", agentId],
    enabled: !!agentId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, description, tier, status, objective, total_executions, created_at")
        .eq("id", agentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const logsQ = useQuery({
    queryKey: ["agent-logs-detail", agentId],
    enabled: !!agentId && !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("execution_logs")
        .select("id, action, status, execution_time_ms, details, created_at")
        .eq("agent_id", agentId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const tokensQ = useQuery({
    queryKey: ["agent-tokens-detail", agentId],
    enabled: !!agentId && !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("token_usage")
        .select("tokens_used, created_at")
        .eq("agent_id", agentId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const logs = logsQ.data ?? [];
  const tokens = tokensQ.data ?? [];
  const agent = agentQ.data;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const errors = logs.filter((l) => l.status === "error" || l.status === "failed").length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    const timed = logs.filter((l) => l.execution_time_ms != null);
    const avgMs =
      timed.length > 0
        ? Math.round(timed.reduce((s, l) => s + (l.execution_time_ms || 0), 0) / timed.length)
        : 0;
    const p95 =
      timed.length > 0
        ? [...timed]
            .map((l) => l.execution_time_ms!)
            .sort((a, b) => a - b)[Math.floor(timed.length * 0.95) - 1] ?? 0
        : 0;
    const totalTokens = tokens.reduce((s, t) => s + (t.tokens_used || 0), 0);
    return { total, success, errors, successRate, avgMs, p95, totalTokens };
  }, [logs, tokens]);

  const chartData = useMemo(() => {
    const days: Record<string, { day: string; exec: number; success: number; errors: number; tokens: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, "dd/MM");
      days[key] = { day: key, exec: 0, success: 0, errors: 0, tokens: 0 };
    }
    for (const l of logs) {
      const key = format(new Date(l.created_at), "dd/MM");
      if (!days[key]) continue;
      days[key].exec += 1;
      if (l.status === "success") days[key].success += 1;
      else days[key].errors += 1;
    }
    for (const t of tokens) {
      const key = format(new Date(t.created_at), "dd/MM");
      if (!days[key]) continue;
      days[key].tokens += t.tokens_used || 0;
    }
    return Object.values(days);
  }, [logs, tokens]);

  const sparkline = chartData.map((d) => d.exec);
  const agentAlerts = health?.alerts.filter((a) => a.agentId === agentId) ?? [];

  return (
    <>
      <SEO
        title={`${agent?.name ?? "Agente"} · Métricas`}
        description="Desempenho detalhado do agente: execuções, tokens, latência, sucesso/falha e logs."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold leading-tight">
                  {agent?.name ?? "Agente"}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <Badge variant="outline" className="text-[9px] border-border/40 uppercase">
                    {agent?.tier ?? "-"}
                  </Badge>
                  <Badge className="text-[9px] bg-primary/10 text-primary border-0 uppercase">
                    {agent?.status ?? "-"}
                  </Badge>
                  {agent?.created_at && (
                    <span>
                      criado {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {agent?.objective && (
              <p className="text-xs text-muted-foreground mt-2 max-w-3xl">{agent.objective}</p>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/app/agente/${agentId}`}>
              <PlayCircle className="h-3.5 w-3.5" /> Abrir workspace
            </Link>
          </Button>
        </div>

        {/* Alerts for this agent */}
        {agentAlerts.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-100">
                {agentAlerts.length} alerta{agentAlerts.length > 1 ? "s" : ""} ativos para este agente
              </p>
              <ul className="mt-1 space-y-0.5">
                {agentAlerts.map((a) => (
                  <li key={a.kind} className="text-[11px] text-muted-foreground">
                    · {a.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard
            icon={Zap}
            label="Execuções (30d)"
            value={stats.total}
            spark={sparkline}
            accent="text-cyan-400"
            sparkColor="#22d3ee"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Taxa de sucesso"
            value={`${stats.successRate}%`}
            accent={stats.successRate >= 90 ? "text-emerald-400" : stats.successRate >= 70 ? "text-amber-400" : "text-destructive"}
            progress={stats.successRate}
          />
          <KpiCard
            icon={XCircle}
            label="Falhas"
            value={stats.errors}
            accent={stats.errors > 0 ? "text-destructive" : "text-muted-foreground"}
            sub={stats.total > 0 ? `${Math.round((stats.errors / stats.total) * 100)}% do total` : "—"}
          />
          <KpiCard
            icon={Clock}
            label="Latência média"
            value={stats.avgMs > 0 ? `${stats.avgMs}ms` : "—"}
            accent="text-violet-400"
            sub={stats.p95 > 0 ? `p95 · ${stats.p95}ms` : undefined}
          />
          <KpiCard
            icon={Coins}
            label="Tokens (30d)"
            value={stats.totalTokens.toLocaleString("pt-BR")}
            accent="text-primary"
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 rounded-2xl p-4 border border-border/40 bg-card/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium">Execuções — últimos 14 dias</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="agent-exec-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    fontSize: 11,
                  }}
                />
                <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="url(#agent-exec-grad)" strokeWidth={2} />
                <Area type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 rounded-2xl p-4 border border-border/40 bg-card/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Consumo de tokens</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Logs */}
        <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Últimos logs</span>
              <Badge variant="outline" className="text-[9px] border-border/40">
                {logs.length}
              </Badge>
            </div>
            <Link to="/dashboard/traces" className="text-[10px] text-primary hover:underline">
              Ver todos os traces →
            </Link>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhuma execução registrada nos últimos 30 dias.
            </div>
          ) : (
            <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
              {logs.slice(0, 50).map((log) => {
                const cls = STATUS_COLORS[log.status] ?? "text-muted-foreground bg-muted/50";
                return (
                  <li key={log.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-mono ${cls}`}>{log.status}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                        {log.execution_time_ms != null && <> · {log.execution_time_ms}ms</>}
                      </p>
                    </div>
                    {log.details && typeof log.details === "object" && (log.details as any).error && (
                      <span className="text-[10px] text-destructive truncate max-w-xs">
                        {String((log.details as any).error).slice(0, 80)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  spark,
  sparkColor,
  accent = "text-primary",
  progress,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
  accent?: string;
  progress?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 border border-border/40 bg-card/60"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        {spark && spark.length >= 2 && <MiniSparkline data={spark} color={sparkColor || "hsl(var(--primary))"} width={60} height={24} />}
      </div>
      <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      {progress != null && <Progress value={progress} className="h-1 mt-2" />}
    </motion.div>
  );
}

export default AgentMetricsDetail;
