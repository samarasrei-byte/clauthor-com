import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Bot, BarChart3, Star, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackRow {
  id: string;
  agent_id: string | null;
  rating: string;
  feedback_text: string | null;
  created_at: string;
  message_content: string;
  response_content: string;
}

interface AgentInfo {
  id: string;
  name: string;
}

const AIQualityDashboard = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [execLogs, setExecLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, period]);

  const loadData = async () => {
    setLoading(true);
    const userId = user!.id;

    let fbQuery = supabase.from("chat_feedback").select("*").eq("user_id", userId).order("created_at", { ascending: false });

    if (period === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      fbQuery = fbQuery.gte("created_at", d.toISOString());
    } else if (period === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      fbQuery = fbQuery.gte("created_at", d.toISOString());
    }

    // Also fetch execution_logs for auto-quality scoring
    let logsQuery = supabase.from("execution_logs").select("agent_id, status, execution_time_ms, created_at").eq("user_id", userId);
    if (period === "7d") {
      const d = new Date(); d.setDate(d.getDate() - 7);
      logsQuery = logsQuery.gte("created_at", d.toISOString());
    } else if (period === "30d") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      logsQuery = logsQuery.gte("created_at", d.toISOString());
    }

    const [{ data: fb }, { data: ag }, { data: logs }] = await Promise.all([
      fbQuery.limit(500),
      supabase.from("agents").select("id, name").eq("user_id", userId),
      logsQuery.limit(500),
    ]);

    setFeedback((fb as FeedbackRow[]) || []);
    setAgents(ag || []);
    setExecLogs(logs || []);
    setLoading(false);
  };

  const agentMap = useMemo(() => {
    const m: Record<string, string> = {};
    agents.forEach(a => { m[a.id] = a.name; });
    return m;
  }, [agents]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const positive = feedback.filter(f => f.rating === "positive").length;
    const negative = feedback.filter(f => f.rating === "negative").length;
    const rate = total > 0 ? Math.round((positive / total) * 100) : 0;

    // Per agent breakdown
    const byAgent: Record<string, { positive: number; negative: number; total: number; texts: string[] }> = {};
    feedback.forEach(f => {
      const key = f.agent_id || "general";
      if (!byAgent[key]) byAgent[key] = { positive: 0, negative: 0, total: 0, texts: [] };
      byAgent[key].total++;
      if (f.rating === "positive") byAgent[key].positive++;
      else byAgent[key].negative++;
      if (f.feedback_text) byAgent[key].texts.push(f.feedback_text);
    });

    const agentStats = Object.entries(byAgent).map(([id, s]) => ({
      id,
      name: id === "general" ? "Concierge / Geral" : (agentMap[id] || "Agente"),
      ...s,
      rate: s.total > 0 ? Math.round((s.positive / s.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Trend — compare last 7 days vs previous 7
    const now = Date.now();
    const last7 = feedback.filter(f => now - new Date(f.created_at).getTime() < 7 * 86400000);
    const prev7 = feedback.filter(f => {
      const age = now - new Date(f.created_at).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    });
    const last7Rate = last7.length > 0 ? Math.round((last7.filter(f => f.rating === "positive").length / last7.length) * 100) : 0;
    const prev7Rate = prev7.length > 0 ? Math.round((prev7.filter(f => f.rating === "positive").length / prev7.length) * 100) : 0;
    const trend = last7Rate - prev7Rate;

    return { total, positive, negative, rate, agentStats, trend, last7Rate };
  }, [feedback, agentMap]);

  const recentNegative = useMemo(() => {
    return feedback
      .filter(f => f.rating === "negative" && f.feedback_text)
      .slice(0, 5);
  }, [feedback]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Qualidade dos Agentes</h2>
          <p className="text-sm text-muted-foreground">Métricas de satisfação baseadas no feedback dos usuários</p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as const).map(p => (
            <Badge
              key={p}
              variant={period === p ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "Tudo"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 text-center">
          <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Feedbacks</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-4 text-center">
          <ThumbsUp className="h-5 w-5 text-accent-emerald mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent-emerald">{stats.rate}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Satisfação</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 text-center">
          <ThumbsDown className="h-5 w-5 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold text-destructive">{stats.negative}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Negativos</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-4 text-center">
          {stats.trend >= 0 ? (
            <TrendingUp className="h-5 w-5 text-accent-emerald mx-auto mb-2" />
          ) : (
            <TrendingDown className="h-5 w-5 text-destructive mx-auto mb-2" />
          )}
          <p className={`text-2xl font-bold ${stats.trend >= 0 ? "text-accent-emerald" : "text-destructive"}`}>
            {stats.trend >= 0 ? "+" : ""}{stats.trend}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tendência 7d</p>
        </motion.div>
      </div>

      {/* Per-Agent Breakdown */}
      {stats.agentStats.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Satisfação por Agente
          </h3>
          <div className="space-y-3">
            {stats.agentStats.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-32 truncate">
                  <p className="text-xs font-semibold truncate">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">{agent.total} feedbacks</p>
                </div>
                <div className="flex-1">
                  <Progress value={agent.rate} className="h-2" />
                </div>
                <div className="flex items-center gap-2 w-24 justify-end">
                  <span className={`text-xs font-bold ${agent.rate >= 70 ? "text-accent-emerald" : agent.rate >= 40 ? "text-yellow-500" : "text-destructive"}`}>
                    {agent.rate}%
                  </span>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-[9px] gap-0.5 px-1">
                      <ThumbsUp className="h-2 w-2" /> {agent.positive}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] gap-0.5 px-1">
                      <ThumbsDown className="h-2 w-2" /> {agent.negative}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Negative Feedback */}
      {recentNegative.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-destructive" /> Feedbacks Negativos Recentes
          </h3>
          <div className="space-y-2">
            {recentNegative.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card/50 rounded-xl p-3 border border-border/20 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[9px]">
                    {f.agent_id ? (agentMap[f.agent_id] || "Agente") : "Geral"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  <span className="text-foreground font-medium">Pergunta:</span> {f.message_content}
                </p>
                {f.feedback_text && (
                  <p className="text-xs text-destructive/80 italic">"{f.feedback_text}"</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Star className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold mb-2">Nenhum feedback ainda</h3>
          <p className="text-sm text-muted-foreground">
            Os usuários podem avaliar as respostas dos agentes com 👍👎 — os dados aparecerão aqui automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIQualityDashboard;
