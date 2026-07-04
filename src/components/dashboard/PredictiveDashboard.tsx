import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Clock, CreditCard, Users, Brain, ArrowUpRight, ShieldAlert, Activity, BarChart3, Target } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

interface Prediction {
  id: string;
  icon: any;
  title: string;
  description: string;
  timeframe: string;
  confidence: number;
  severity: "info" | "warning" | "critical" | "positive";
  action?: string;
  metric?: { label: string; value: string; trend: "up" | "down" | "flat" };
}

const severityColors = {
  info: "border-blue-500/20 bg-blue-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  critical: "border-red-500/20 bg-red-500/5",
  positive: "border-emerald-500/20 bg-emerald-500/5",
};

const severityBadge = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

// ── Statistical helpers ──

/** Simple linear regression: returns { slope, intercept, r2 } */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² (coefficient of determination)
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2: Math.max(0, r2) };
}

/** Group items by day and count */
function groupByDay(items: { created_at: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const day = item.created_at.split("T")[0];
    map.set(day, (map.get(day) || 0) + 1);
  }
  return map;
}

/** Get day-of-week distribution (0=Sun, 6=Sat) */
function dayOfWeekDistribution(items: { created_at: string }[]): number[] {
  const dist = [0, 0, 0, 0, 0, 0, 0];
  for (const item of items) {
    const dow = new Date(item.created_at).getDay();
    dist[dow]++;
  }
  return dist;
}

const DOW_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const PredictiveDashboard = () => {
  const { user } = useAuth();
  const { credits, remainingCredits, usagePercentage } = useCredits();

  const { data: agents = [] } = useQuery({
    queryKey: ["pred-agents", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch last 30 days of execution logs for trend analysis
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["pred-logs-30d", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("execution_logs")
        .select("action, status, created_at, execution_time_ms, agent_id")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true })
        .limit(1000);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch token usage for consumption trend
  const { data: tokenHistory = [] } = useQuery({
    queryKey: ["pred-tokens-30d", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from("token_usage")
        .select("tokens_used, created_at, agent_id")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true })
        .limit(1000);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch agent metrics for performance analysis
  const { data: agentMetrics = [] } = useQuery({
    queryKey: ["pred-metrics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_metrics")
        .select("*")
        .eq("user_id", user!.id)
        .order("metric_date", { ascending: true })
        .limit(500);
      return data || [];
    },
    enabled: !!user,
  });

  const predictions: Prediction[] = useMemo(() => {
    const preds: Prediction[] = [];
    const activeAgents = agents.filter((a: any) => a.status === "active").length;
    const totalCredits = credits?.total_credits || 10000;
    const usedCredits = credits?.used_credits || 0;
    const now = Date.now();

    // ═══ 1. CREDIT EXHAUSTION - Linear regression on daily token consumption ═══
    if (tokenHistory.length >= 3) {
      const dailyTokens = groupByDay(tokenHistory);
      const entries = Array.from(dailyTokens.entries()).sort();
      
      if (entries.length >= 3) {
        const points = entries.map(([date, count], i) => ({ x: i, y: count }));
        const reg = linearRegression(points);
        
        // Project daily rate using regression (more accurate than simple average)
        const projectedDailyRate = Math.max(0, reg.slope * points.length + reg.intercept);
        const avgDailyRate = entries.reduce((sum, [, v]) => sum + v, 0) / entries.length;
        const bestRate = reg.r2 > 0.3 ? projectedDailyRate : avgDailyRate;
        
        if (bestRate > 0) {
          const daysLeft = Math.max(0, Math.floor((totalCredits - usedCredits) / bestRate));
          const trendDirection = reg.slope > 0 ? "acelerando" : reg.slope < -5 ? "desacelerando" : "estável";
          const confidenceBase = Math.min(95, 60 + Math.round(reg.r2 * 30) + Math.min(entries.length, 10));

          if (daysLeft <= 7 || usagePercentage > 70) {
            preds.push({
              id: "credits-regression",
              icon: CreditCard,
              title: daysLeft <= 3 ? "⚠️ Créditos esgotam em breve" : `Esgotamento previsto: ${daysLeft} dias`,
              description: `Consumo médio: ${Math.round(bestRate).toLocaleString()} tokens/dia (${trendDirection}). R² = ${(reg.r2 * 100).toFixed(0)}% de confiança no modelo. ${
                reg.slope > 10 ? "Tendência de aumento detectada - considere upgrade." : ""
              }`,
              timeframe: daysLeft <= 3 ? "Crítico" : `~${daysLeft} dias`,
              confidence: confidenceBase,
              severity: daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "info",
              action: daysLeft <= 7 ? "Fazer upgrade de plano" : "Monitorar consumo",
              metric: {
                label: "Consumo/dia",
                value: `${Math.round(bestRate).toLocaleString()}`,
                trend: reg.slope > 5 ? "up" : reg.slope < -5 ? "down" : "flat",
              },
            });
          }
        }
      }
    }

    // ═══ 2. DAY-OF-WEEK PEAK DETECTION - Real pattern from logs ═══
    if (recentLogs.length >= 15) {
      const dowDist = dayOfWeekDistribution(recentLogs);
      const totalExecs = dowDist.reduce((a, b) => a + b, 0);
      const avgPerDay = totalExecs / 7;
      
      // Find peak day
      const peakIdx = dowDist.indexOf(Math.max(...dowDist));
      const peakValue = dowDist[peakIdx];
      const peakPct = totalExecs > 0 ? Math.round((peakValue / totalExecs) * 100) : 0;
      
      // Find low day
      const nonZeroDays = dowDist.map((v, i) => ({ v, i })).filter(d => d.v > 0);
      const lowDay = nonZeroDays.length > 0 ? nonZeroDays.reduce((min, d) => d.v < min.v ? d : min) : null;
      
      if (peakValue > avgPerDay * 1.3 && peakPct > 20) {
        preds.push({
          id: "peak-day-real",
          icon: Clock,
          title: `Pico de atividade: ${DOW_NAMES[peakIdx]}`,
          description: `${DOW_NAMES[peakIdx]} concentra ${peakPct}% das execuções (${peakValue} de ${totalExecs}). ${
            lowDay ? `Menor atividade: ${DOW_NAMES[lowDay.i]}. ` : ""
          }Considere pré-agendar tarefas críticas.`,
          timeframe: `Próxima ${DOW_NAMES[peakIdx]}`,
          confidence: Math.min(92, 60 + Math.round((peakPct - 14) * 1.5)),
          severity: "info",
          metric: {
            label: DOW_NAMES[peakIdx],
            value: `${peakPct}%`,
            trend: "up",
          },
        });
      }
    }

    // ═══ 3. ERROR RATE TREND - Detect if errors are increasing ═══
    if (recentLogs.length >= 10) {
      const halfPoint = Math.floor(recentLogs.length / 2);
      const firstHalf = recentLogs.slice(0, halfPoint);
      const secondHalf = recentLogs.slice(halfPoint);
      
      const firstErrors = firstHalf.filter((l: any) => l.status === "error").length;
      const secondErrors = secondHalf.filter((l: any) => l.status === "error").length;
      const firstRate = firstHalf.length > 0 ? firstErrors / firstHalf.length : 0;
      const secondRate = secondHalf.length > 0 ? secondErrors / secondHalf.length : 0;
      const overallRate = recentLogs.filter((l: any) => l.status === "error").length / recentLogs.length;
      
      const errorTrend = secondRate - firstRate;
      
      if (overallRate > 0.1 || errorTrend > 0.1) {
        const isWorsening = errorTrend > 0.05;
        preds.push({
          id: "error-trend",
          icon: ShieldAlert,
          title: isWorsening ? "Taxa de erro em crescimento" : "Taxa de erro acima do normal",
          description: `${Math.round(overallRate * 100)}% de falhas (${recentLogs.filter((l: any) => l.status === "error").length}/${recentLogs.length}). ${
            isWorsening 
              ? `Tendência: ${Math.round(firstRate * 100)}% → ${Math.round(secondRate * 100)}% (piorando).` 
              : `Tendência estável em ${Math.round(overallRate * 100)}%.`
          } Verifique credenciais e configurações.`,
          timeframe: "Últimos 30 dias",
          confidence: Math.min(93, 70 + Math.round(overallRate * 50)),
          severity: isWorsening || overallRate > 0.2 ? "critical" : "warning",
          action: "Verificar credenciais e logs de erro",
          metric: {
            label: "Taxa de erro",
            value: `${Math.round(overallRate * 100)}%`,
            trend: isWorsening ? "up" : "flat",
          },
        });
      }
    }

    // ═══ 4. AGENT EFFICIENCY SCORE - Based on real metrics ═══
    if (agentMetrics.length > 0 && agents.length > 0) {
      // Calculate per-agent efficiency
      const agentScores = agents.map((agent: any) => {
        const metrics = agentMetrics.filter((m: any) => m.agent_id === agent.id);
        if (metrics.length === 0) return { name: agent.name, score: 0, executions: 0 };
        
        const totalExec = metrics.reduce((s: number, m: any) => s + (m.total_executions || 0), 0);
        const successExec = metrics.reduce((s: number, m: any) => s + (m.successful_executions || 0), 0);
        const successRate = totalExec > 0 ? successExec / totalExec : 0;
        const avgTime = metrics.reduce((s: number, m: any) => s + (m.avg_execution_time_ms || 0), 0) / metrics.length;
        
        // Efficiency = success rate * speed factor (normalized)
        const speedFactor = avgTime > 0 ? Math.min(1, 2000 / avgTime) : 0.5;
        const score = Math.round(successRate * 70 + speedFactor * 30);
        
        return { name: agent.name, score, executions: totalExec };
      }).filter(a => a.executions > 0);

      if (agentScores.length > 0) {
        const best = agentScores.reduce((a, b) => a.score > b.score ? a : b);
        const worst = agentScores.reduce((a, b) => a.score < b.score ? a : b);
        
        if (agentScores.length >= 2 && worst.score < 60) {
          preds.push({
            id: "agent-efficiency",
            icon: Activity,
            title: `${worst.name}: eficiência baixa`,
            description: `Score: ${worst.score}/100 (vs ${best.name}: ${best.score}/100). Considere ajustar instruções, quality_mode ou revisar integrações deste agente.`,
            timeframe: "Ação recomendada",
            confidence: 82,
            severity: worst.score < 40 ? "critical" : "warning",
            action: "Otimizar configuração do agente",
            metric: {
              label: "Eficiência",
              value: `${worst.score}/100`,
              trend: "down",
            },
          });
        }
      }
    }

    // ═══ 5. INACTIVE AGENTS - Real data ═══
    const inactiveAgents = agents.filter((a: any) => a.total_executions === 0 && a.status === "active");
    if (inactiveAgents.length > 0) {
      const names = inactiveAgents.map((a: any) => a.name).slice(0, 3);
      preds.push({
        id: "inactive",
        icon: Users,
        title: `${inactiveAgents.length} agente(s) sem uso`,
        description: `${names.join(", ")}${inactiveAgents.length > 3 ? ` e +${inactiveAgents.length - 3}` : ""} estão ativos mas nunca executaram tarefas. Isso representa custo sem retorno.`,
        timeframe: "Agora",
        confidence: 99,
        severity: "warning",
        action: "Ativar ou remover agentes ociosos",
        metric: {
          label: "Ociosos",
          value: `${inactiveAgents.length}`,
          trend: "flat",
        },
      });
    }

    // ═══ 6. EXECUTION VOLUME TREND - Linear regression ═══
    if (recentLogs.length >= 10) {
      const dailyExecs = groupByDay(recentLogs);
      const entries = Array.from(dailyExecs.entries()).sort();
      
      if (entries.length >= 5) {
        const points = entries.map(([, count], i) => ({ x: i, y: count }));
        const reg = linearRegression(points);
        
        if (reg.r2 > 0.2) {
          const isGrowing = reg.slope > 0.5;
          const isDeclining = reg.slope < -0.5;
          
          if (isGrowing) {
            preds.push({
              id: "volume-growth",
              icon: TrendingUp,
              title: "Volume de execuções crescendo",
              description: `+${Math.round(reg.slope * 7)} execuções/semana (R² = ${(reg.r2 * 100).toFixed(0)}%). Seus agentes estão ganhando tração. Se mantiver, pode precisar de upgrade em breve.`,
              timeframe: "Tendência 30 dias",
              confidence: Math.min(90, 60 + Math.round(reg.r2 * 30)),
              severity: "positive",
              metric: {
                label: "Crescimento",
                value: `+${Math.round(reg.slope * 7)}/sem`,
                trend: "up",
              },
            });
          } else if (isDeclining) {
            preds.push({
              id: "volume-decline",
              icon: TrendingDown,
              title: "Queda na atividade dos agentes",
              description: `${Math.round(Math.abs(reg.slope) * 7)} execuções/semana a menos (R² = ${(reg.r2 * 100).toFixed(0)}%). Verifique se há problemas ou se os agentes precisam de novas tarefas.`,
              timeframe: "Tendência 30 dias",
              confidence: Math.min(88, 55 + Math.round(reg.r2 * 30)),
              severity: "warning",
              action: "Investigar causa da queda",
              metric: {
                label: "Declínio",
                value: `-${Math.round(Math.abs(reg.slope) * 7)}/sem`,
                trend: "down",
              },
            });
          }
        }
      }
    }

    // ═══ 7. GROWTH OPPORTUNITY - Based on real usage patterns ═══
    if (activeAgents > 0 && activeAgents < 8 && recentLogs.length > 5) {
      const avgExecsPerAgent = recentLogs.length / Math.max(1, activeAgents);
      const hasHighUtilization = avgExecsPerAgent > 5;
      
      if (hasHighUtilization) {
        preds.push({
          id: "growth-opportunity",
          icon: Target,
          title: "Alta utilização - hora de escalar",
          description: `${Math.round(avgExecsPerAgent)} execuções/agente nos últimos 30 dias. Seus agentes estão bem utilizados. Adicionar mais pode multiplicar resultados.`,
          timeframe: "Recomendação",
          confidence: 75,
          severity: "positive",
          action: "Explorar novos agentes na biblioteca",
          metric: {
            label: "Uso/agente",
            value: `${Math.round(avgExecsPerAgent)}`,
            trend: "up",
          },
        });
      }
    }

    // ═══ 8. ROI ESTIMATION - Based on actual execution data ═══
    if (agents.length > 0) {
      const totalExecs = agents.reduce((s: number, a: any) => s + (a.total_executions || 0), 0);
      // Conservative estimate: each execution saves 15min of human time at R$50/h
      const savedHours = (totalExecs * 15) / 60;
      const savedMoney = Math.round(savedHours * 50);
      
      if (savedMoney > 0) {
        preds.push({
          id: "roi-real",
          icon: Sparkles,
          title: "ROI estimado do seu time de IA",
          description: `${totalExecs.toLocaleString()} execuções = ~${Math.round(savedHours)}h economizadas. Equivalente a R$ ${savedMoney.toLocaleString()} em mão de obra (R$ 50/h, 15min/tarefa).`,
          timeframe: "Acumulado",
          confidence: 70,
          severity: "positive",
          metric: {
            label: "Economia",
            value: `R$ ${savedMoney.toLocaleString()}`,
            trend: "up",
          },
        });
      }
    }

    return preds.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, positive: 3 };
      return order[a.severity] - order[b.severity];
    });
  }, [agents, recentLogs, tokenHistory, agentMetrics, credits, usagePercentage, remainingCredits]);

  // Calculate overall health score
  const healthScore = useMemo(() => {
    if (predictions.length === 0) return 85;
    
    let score = 100;
    for (const p of predictions) {
      if (p.severity === "critical") score -= 20;
      else if (p.severity === "warning") score -= 10;
      else if (p.severity === "positive") score += 3;
    }
    return Math.max(10, Math.min(100, score));
  }, [predictions]);

  const scoreColor = healthScore >= 80 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-red-400";
  const scoreBg = healthScore >= 80 ? "from-emerald-500/20 to-emerald-500/5" : healthScore >= 50 ? "from-amber-500/20 to-amber-500/5" : "from-red-500/20 to-red-500/5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Predictive Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Análise estatística real dos seus dados. Regressão linear, tendências e detecção de anomalias.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          <BarChart3 className="h-3 w-3 mr-1" /> STATISTICAL AI
        </Badge>
      </div>

      {/* Health Score */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border/30">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${scoreBg} border border-border/20 flex items-center justify-center`}>
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {healthScore}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Health Score</div>
            <div className="text-[10px] text-muted-foreground">
              {predictions.length} previsões baseadas em {recentLogs.length} execuções e {tokenHistory.length} registros de consumo
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(["critical", "warning", "info", "positive"] as const).map(sev => {
                const count = predictions.filter(p => p.severity === sev).length;
                if (count === 0) return null;
                return (
                  <Badge key={sev} variant="outline" className={`text-[9px] ${severityBadge[sev]}`}>
                    {count} {sev === "critical" ? "crítico" : sev === "warning" ? "alerta" : sev === "positive" ? "positivo" : "info"}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Predictions */}
      {predictions.length === 0 ? (
        <Card className="p-8 text-center bg-card/30 border-border/20">
          <Brain className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Dados insuficientes para previsões. Use seus agentes por alguns dias para gerar análises.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predictions.map((pred, idx) => {
            const Icon = pred.icon;
            return (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className={`p-4 ${severityColors[pred.severity]} border transition-all hover:scale-[1.01]`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${severityBadge[pred.severity]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold truncate">{pred.title}</h3>
                        <Badge variant="outline" className="text-[8px] shrink-0 border-border/30">
                          {pred.timeframe}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                        {pred.description}
                      </p>

                      {/* Metric chip */}
                      {pred.metric && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/60 border border-border/20">
                            {pred.metric.trend === "up" && <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />}
                            {pred.metric.trend === "down" && <TrendingDown className="h-2.5 w-2.5 text-red-400" />}
                            {pred.metric.trend === "flat" && <Activity className="h-2.5 w-2.5 text-muted-foreground" />}
                            <span className="text-[9px] font-medium">{pred.metric.label}: {pred.metric.value}</span>
                          </div>
                        </div>
                      )}

                      {/* Confidence */}
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={pred.confidence} className="h-1 flex-1" />
                        <span className="text-[9px] font-mono text-muted-foreground">{pred.confidence}%</span>
                      </div>

                      {pred.action && (
                        <button className="text-[10px] text-primary hover:underline mt-1.5 flex items-center gap-1">
                          {pred.action} <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PredictiveDashboard;
