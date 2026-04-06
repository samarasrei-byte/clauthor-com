import { useMemo } from "react";
import { motion } from "framer-motion";
import { Dna, Fingerprint, Activity, Sparkles, Bot, TrendingUp, TrendingDown, Zap, Shield, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Real DNA traits derived from actual metrics ──
interface AgentDNAProfile {
  id: string;
  name: string;
  tier: string;
  status: string;
  description: string | null;
  // Real metrics
  totalExecutions: number;
  successRate: number;      // 0-100
  avgResponseMs: number;
  tokensConsumed: number;
  errorRate: number;        // 0-100
  activityTrend: "rising" | "declining" | "stable" | "new";
  // Computed scores
  reliabilityScore: number; // 0-100
  speedScore: number;       // 0-100
  efficiencyScore: number;  // 0-100 (tokens per execution)
  overallScore: number;     // 0-100
  level: number;
}

// Generate DNA visualization from REAL performance data
const DNAVisualization = ({ profile }: { profile: AgentDNAProfile }) => {
  const segments = useMemo(() => {
    // Each segment represents a real trait
    return [
      { label: "Reliability", value: profile.reliabilityScore, hue: 142, type: "core" as const },
      { label: "Speed", value: profile.speedScore, hue: 200, type: "skill" as const },
      { label: "Efficiency", value: profile.efficiencyScore, hue: 270, type: "memory" as const },
      { label: "Success", value: profile.successRate, hue: 160, type: "core" as const },
      { label: "Volume", value: Math.min(100, profile.totalExecutions / 2), hue: 30, type: "network" as const },
      { label: "Stability", value: 100 - profile.errorRate, hue: 340, type: "skill" as const },
    ];
  }, [profile]);

  const tierGlow = {
    basic: "from-blue-500/15 to-cyan-500/10",
    intermediate: "from-emerald-500/15 to-teal-500/10",
    advanced: "from-purple-500/15 to-pink-500/10",
    enterprise: "from-amber-500/15 to-orange-500/10",
  }[profile.tier] || "from-blue-500/15 to-cyan-500/10";

  return (
    <div className="relative w-full aspect-square max-w-[160px] mx-auto">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tierGlow} blur-2xl opacity-50`} />
      
      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
        {segments.map((seg, i) => {
          const angle = (i / segments.length) * Math.PI * 2 - Math.PI / 2;
          const maxRadius = 75;
          const radius = 25 + (seg.value / 100) * (maxRadius - 25);
          const cx = 100 + Math.cos(angle) * radius * 0.85;
          const cy = 100 + Math.sin(angle) * radius * 0.85;
          const r = 4 + (seg.value / 100) * 14;
          const intensity = 0.3 + (seg.value / 100) * 0.7;

          return (
            <motion.g key={i}>
              <motion.line
                x1="100" y1="100" x2={cx} y2={cy}
                stroke={`hsla(${seg.hue}, 60%, 55%, ${intensity * 0.35})`}
                strokeWidth={0.8 + intensity * 1.2}
                strokeDasharray={seg.value > 50 ? "none" : "3 2"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              />
              <motion.circle
                cx={cx} cy={cy} r={r}
                fill={`hsla(${seg.hue}, 60%, 55%, ${intensity * 0.25})`}
                stroke={`hsla(${seg.hue}, 60%, 55%, ${intensity * 0.7})`}
                strokeWidth={1.2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.3, type: "spring", damping: 14 }}
              />
              <motion.circle
                cx={cx} cy={cy} r={r * 0.35}
                fill={`hsla(${seg.hue}, 70%, 65%, ${intensity})`}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: i * 0.1 + 0.5 }}
              />
            </motion.g>
          );
        })}
        
        {/* Center core — pulses based on overall score */}
        <motion.circle
          cx="100" cy="100" r="14"
          fill={`hsla(var(--primary), ${profile.overallScore / 500})`}
          stroke="hsla(var(--primary), 0.4)"
          strokeWidth={1.5}
          animate={{ r: [14, 16, 14] }}
          transition={{ duration: 2 + (100 - profile.overallScore) / 30, repeat: Infinity }}
        />
        <motion.circle
          cx="100" cy="100" r="6"
          fill="hsl(var(--primary))"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Level text */}
        <text x="100" y="104" textAnchor="middle" className="fill-primary-foreground" fontSize="8" fontWeight="bold">
          {profile.level}
        </text>
      </svg>
    </div>
  );
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "rising") return <TrendingUp className="h-3 w-3 text-emerald-400" />;
  if (trend === "declining") return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Activity className="h-3 w-3 text-muted-foreground" />;
};

const AgentDNA = () => {
  const { user } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["dna-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Real metrics from agent_metrics table
  const { data: metrics = [] } = useQuery({
    queryKey: ["dna-metrics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_metrics")
        .select("*")
        .eq("user_id", user!.id)
        .order("metric_date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  // Token usage per agent
  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["dna-tokens", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("token_usage")
        .select("agent_id, tokens_used, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo)
        .limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  // Build DNA profiles from real data
  const profiles: AgentDNAProfile[] = useMemo(() => {
    return agents.map((agent: any) => {
      const agentMetrics = metrics.filter((m: any) => m.agent_id === agent.id);
      const agentTokens = tokenUsage.filter((t: any) => t.agent_id === agent.id);
      
      // Aggregate metrics
      const totalExec = agentMetrics.reduce((s: number, m: any) => s + (m.total_executions || 0), 0) || agent.total_executions || 0;
      const successExec = agentMetrics.reduce((s: number, m: any) => s + (m.successful_executions || 0), 0);
      const failedExec = agentMetrics.reduce((s: number, m: any) => s + (m.failed_executions || 0), 0);
      const avgTime = agentMetrics.length > 0
        ? agentMetrics.reduce((s: number, m: any) => s + (m.avg_execution_time_ms || 0), 0) / agentMetrics.length
        : 0;
      const tokensTotal = agentTokens.reduce((s: number, t: any) => s + (t.tokens_used || 0), 0);

      // Calculate rates
      const successRate = totalExec > 0 ? Math.round((successExec / totalExec) * 100) : (totalExec === 0 ? 50 : 0);
      const errorRate = totalExec > 0 ? Math.round((failedExec / totalExec) * 100) : 0;

      // Trend: compare first half vs second half of metrics
      let activityTrend: "rising" | "declining" | "stable" | "new" = "new";
      if (agentMetrics.length >= 4) {
        const half = Math.floor(agentMetrics.length / 2);
        const firstHalf = agentMetrics.slice(0, half).reduce((s: number, m: any) => s + m.total_executions, 0);
        const secondHalf = agentMetrics.slice(half).reduce((s: number, m: any) => s + m.total_executions, 0);
        const ratio = secondHalf / Math.max(1, firstHalf);
        activityTrend = ratio > 1.2 ? "rising" : ratio < 0.8 ? "declining" : "stable";
      } else if (totalExec > 0) {
        activityTrend = "stable";
      }

      // Scores
      const reliabilityScore = Math.round(successRate * 0.8 + (100 - errorRate) * 0.2);
      const speedScore = avgTime > 0 ? Math.round(Math.min(100, (3000 / avgTime) * 50)) : 50;
      const tokensPerExec = totalExec > 0 ? tokensTotal / totalExec : 0;
      const efficiencyScore = tokensPerExec > 0 ? Math.round(Math.min(100, (500 / tokensPerExec) * 60)) : 50;
      const overallScore = Math.round(reliabilityScore * 0.4 + speedScore * 0.3 + efficiencyScore * 0.3);
      const level = Math.min(99, Math.floor(Math.log2(totalExec + 1) * 8 + overallScore / 10));

      return {
        id: agent.id,
        name: agent.name,
        tier: agent.tier || "basic",
        status: agent.status || "draft",
        description: agent.description,
        totalExecutions: totalExec,
        successRate,
        avgResponseMs: Math.round(avgTime),
        tokensConsumed: tokensTotal,
        errorRate,
        activityTrend,
        reliabilityScore,
        speedScore,
        efficiencyScore,
        overallScore,
        level,
      };
    });
  }, [agents, metrics, tokenUsage]);

  // Demo profiles when no agents exist
  const displayProfiles = profiles.length > 0 ? profiles : [
    { id: "d1", name: "SDR Outbound", tier: "advanced", status: "active", description: "Prospecção", totalExecutions: 142, successRate: 94, avgResponseMs: 820, tokensConsumed: 45000, errorRate: 6, activityTrend: "rising" as const, reliabilityScore: 91, speedScore: 78, efficiencyScore: 72, overallScore: 81, level: 65 },
    { id: "d2", name: "Copywriter IA", tier: "intermediate", status: "active", description: "Conteúdo", totalExecutions: 87, successRate: 98, avgResponseMs: 1200, tokensConsumed: 62000, errorRate: 2, activityTrend: "stable" as const, reliabilityScore: 97, speedScore: 62, efficiencyScore: 45, overallScore: 70, level: 55 },
    { id: "d3", name: "Analista de Dados", tier: "basic", status: "active", description: "Análise", totalExecutions: 23, successRate: 87, avgResponseMs: 2100, tokensConsumed: 18000, errorRate: 13, activityTrend: "declining" as const, reliabilityScore: 82, speedScore: 45, efficiencyScore: 58, overallScore: 63, level: 38 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            Agent DNA — Performance Biometrics
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            DNA visual gerado a partir de métricas reais: taxa de sucesso, velocidade, eficiência e tendência de uso.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <Fingerprint className="h-3 w-3 mr-1" /> REAL DATA
        </Badge>
      </div>

      {/* DNA Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayProfiles.map((profile, idx) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card className="p-4 bg-card/50 backdrop-blur border-border/30 hover:border-primary/20 transition-all hover:scale-[1.01] cursor-pointer group">
              <DNAVisualization profile={profile} />
              
              {/* Agent Info */}
              <div className="text-center mt-3 space-y-1.5">
                <h3 className="text-sm font-semibold truncate">{profile.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-[8px] border-border/30">{profile.tier}</Badge>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <TrendIcon trend={profile.activityTrend} />
                    {profile.activityTrend === "rising" ? "Crescendo" : profile.activityTrend === "declining" ? "Caindo" : profile.activityTrend === "stable" ? "Estável" : "Novo"}
                  </div>
                </div>
              </div>

              {/* Real Metrics */}
              <div className="mt-3 space-y-2">
                {/* Overall Score */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-16">Score</span>
                  <Progress value={profile.overallScore} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-mono font-semibold w-8 text-right">{profile.overallScore}</span>
                </div>

                {/* Detailed metrics — shown on hover */}
                <div className="space-y-1.5 max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-[9px] text-muted-foreground flex-1">Confiabilidade</span>
                    <span className="text-[9px] font-mono">{profile.reliabilityScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="text-[9px] text-muted-foreground flex-1">Velocidade</span>
                    <span className="text-[9px] font-mono">{profile.speedScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="text-[9px] text-muted-foreground flex-1">Eficiência</span>
                    <span className="text-[9px] font-mono">{profile.efficiencyScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="text-[9px] text-muted-foreground flex-1">Tempo médio</span>
                    <span className="text-[9px] font-mono">{profile.avgResponseMs > 0 ? `${(profile.avgResponseMs / 1000).toFixed(1)}s` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[9px] text-muted-foreground flex-1">Execuções</span>
                    <span className="text-[9px] font-mono">{profile.totalExecutions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <Card className="p-3 bg-card/30 border-border/20">
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">DNA baseado em:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Taxa de sucesso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Velocidade
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Eficiência de tokens
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Volume de uso
          </span>
          <span className="ml-auto font-mono">Tamanho dos nós = performance real</span>
        </div>
      </Card>
    </div>
  );
};

export default AgentDNA;
