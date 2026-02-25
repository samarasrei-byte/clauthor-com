import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingDown, TrendingUp, AlertTriangle, Zap,
  Users, Bot, DollarSign, Target, Sparkles, Eye,
  ArrowRight, Shield, Activity, Loader2, RefreshCcw,
  Flame, Snowflake, Clock, BarChart3, Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// === TYPES ===
interface UserRisk {
  userId: string;
  name: string;
  company: string;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  reasons: string[];
  creditUsage: number;
  daysSinceLastAction: number;
  agentCount: number;
}

interface Insight {
  id: string;
  type: "warning" | "opportunity" | "trend" | "action";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  icon: React.ElementType;
  color: string;
}

interface TenantHealth {
  tenantId: string;
  tenantName: string;
  planType: string;
  memberCount: number;
  agentCount: number;
  activeAgents: number;
  totalExecutions: number;
  creditUsage: number;
  healthScore: number;
  risk: "healthy" | "at_risk" | "churning";
}

// === CHURN PREDICTION HEURISTICS ===
function computeChurnRisk(
  profile: any,
  credits: any,
  agents: any[],
  logs: any[]
): UserRisk {
  const reasons: string[] = [];
  let score = 0;

  // 1. Credit usage
  const creditPct = credits ? Math.round((credits.used_credits / credits.total_credits) * 100) : 0;
  if (creditPct < 5) { score += 30; reasons.push("Quase nenhum crédito usado"); }
  else if (creditPct < 20) { score += 15; reasons.push("Baixo consumo de créditos"); }

  // 2. Agent count
  const userAgents = agents.filter(a => a.user_id === profile.user_id);
  if (userAgents.length === 0) { score += 25; reasons.push("Nenhum agente criado"); }
  else if (userAgents.filter(a => a.status === "active").length === 0) { score += 20; reasons.push("Todos os agentes inativos"); }

  // 3. Activity recency
  const userLogs = logs.filter(l => l.user_id === profile.user_id);
  const lastLog = userLogs[0];
  const daysSince = lastLog
    ? Math.floor((Date.now() - new Date(lastLog.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  if (daysSince > 30) { score += 25; reasons.push(`${daysSince}+ dias sem atividade`); }
  else if (daysSince > 14) { score += 15; reasons.push(`${daysSince} dias sem atividade`); }
  else if (daysSince > 7) { score += 5; reasons.push(`${daysSince} dias desde última ação`); }

  // 4. Plan type
  if (credits?.plan_type === "free") { score += 5; reasons.push("Plano gratuito"); }

  // Clamp
  score = Math.min(score, 100);

  const riskLevel: UserRisk["riskLevel"] =
    score >= 70 ? "critical" : score >= 50 ? "high" : score >= 30 ? "medium" : "low";

  return {
    userId: profile.user_id,
    name: profile.full_name || "Sem nome",
    company: profile.company_name || "—",
    riskScore: score,
    riskLevel,
    reasons,
    creditUsage: creditPct,
    daysSinceLastAction: daysSince,
    agentCount: userAgents.length,
  };
}

// === INSIGHTS GENERATOR ===
function generateInsights(
  users: UserRisk[],
  allAgents: any[],
  totalRevenue: number,
  totalExecutions: number,
  allCredits: any[]
): Insight[] {
  const insights: Insight[] = [];

  // Churn risk
  const atRisk = users.filter(u => u.riskLevel === "critical" || u.riskLevel === "high");
  if (atRisk.length > 0) {
    insights.push({
      id: "churn-risk",
      type: "warning",
      title: `${atRisk.length} usuário${atRisk.length > 1 ? "s" : ""} em risco de churn`,
      description: `${atRisk.map(u => u.name).slice(0, 3).join(", ")}${atRisk.length > 3 ? ` e mais ${atRisk.length - 3}` : ""} apresentam sinais de abandono. Considere ação proativa.`,
      impact: "high",
      icon: AlertTriangle,
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    });
  }

  // Inactive users
  const inactive = users.filter(u => u.daysSinceLastAction > 14);
  if (inactive.length > 0) {
    insights.push({
      id: "inactive",
      type: "action",
      title: `${inactive.length} usuário${inactive.length > 1 ? "s" : ""} inativo${inactive.length > 1 ? "s" : ""} há 14+ dias`,
      description: "Envie uma campanha de reativação ou acione o Concierge automaticamente.",
      impact: "medium",
      icon: Snowflake,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    });
  }

  // Free plan opportunity
  const freeUsers = allCredits.filter(c => c.plan_type === "free");
  const freeWithUsage = freeUsers.filter(c => c.used_credits > c.total_credits * 0.5);
  if (freeWithUsage.length > 0) {
    insights.push({
      id: "upgrade-opp",
      type: "opportunity",
      title: `${freeWithUsage.length} usuário${freeWithUsage.length > 1 ? "s" : ""} prontos para upgrade`,
      description: "Usuários no plano gratuito que já usaram 50%+ dos créditos. Alta probabilidade de conversão.",
      impact: "high",
      icon: TrendingUp,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    });
  }

  // Top agent trend
  const topAgent = [...allAgents].sort((a, b) => b.total_executions - a.total_executions)[0];
  if (topAgent && topAgent.total_executions > 10) {
    insights.push({
      id: "top-agent",
      type: "trend",
      title: `"${topAgent.name}" é o agente mais popular`,
      description: `Com ${topAgent.total_executions} execuções, este agente lidera a plataforma. Considere destacá-lo no marketplace.`,
      impact: "low",
      icon: Flame,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    });
  }

  // Revenue insight
  if (totalRevenue === 0) {
    insights.push({
      id: "no-revenue",
      type: "action",
      title: "Receita zerada — ative o monetização",
      description: "Nenhuma assinatura ativa ainda. Considere oferecer planos trial para converter usuários da waitlist.",
      impact: "high",
      icon: DollarSign,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    });
  }

  // Agent utilization
  const dormantAgents = allAgents.filter(a => a.total_executions === 0 && a.status === "active");
  if (dormantAgents.length > 3) {
    insights.push({
      id: "dormant-agents",
      type: "warning",
      title: `${dormantAgents.length} agentes ativos sem execução`,
      description: "Agentes criados mas nunca usados. Possível problema de onboarding.",
      impact: "medium",
      icon: Bot,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    });
  }

  return insights;
}

// === COMPONENT ===
interface AdminInsightsPanelProps {
  allProfiles: any[];
  allAgents: any[];
  allCredits: any[];
  executionLogs: any[];
  totalRevenue: number;
  totalExecutions: number;
}

const AdminInsightsPanel = ({
  allProfiles, allAgents, allCredits, executionLogs,
  totalRevenue, totalExecutions
}: AdminInsightsPanelProps) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Compute churn risks
  const userRisks = useMemo(() => {
    return allProfiles.map(p => {
      const credits = allCredits.find(c => c.user_id === p.user_id);
      return computeChurnRisk(p, credits, allAgents, executionLogs);
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [allProfiles, allCredits, allAgents, executionLogs]);

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights(userRisks, allAgents, totalRevenue, totalExecutions, allCredits);
  }, [userRisks, allAgents, totalRevenue, totalExecutions, allCredits]);

  // Tenant health
  const { data: tenantHealth = [] } = useQuery({
    queryKey: ["admin-tenant-health"],
    queryFn: async () => {
      const { data: tenants } = await supabase.from("tenants").select("*");
      if (!tenants) return [];

      const health: TenantHealth[] = [];
      for (const t of tenants) {
        const { data: members } = await supabase.from("tenant_members").select("user_id").eq("tenant_id", t.id);
        const memberIds = (members || []).map((m: any) => m.user_id);
        const tAgents = allAgents.filter(a => memberIds.includes(a.user_id));
        const tCredits = allCredits.filter(c => memberIds.includes(c.user_id));
        const totalCredits = tCredits.reduce((sum, c) => sum + c.total_credits, 0);
        const usedCredits = tCredits.reduce((sum, c) => sum + c.used_credits, 0);
        const creditPct = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;
        const tExecs = tAgents.reduce((sum, a) => sum + a.total_executions, 0);
        const activeCount = tAgents.filter(a => a.status === "active").length;

        // Health score
        let healthScore = 100;
        if (tAgents.length === 0) healthScore -= 30;
        if (activeCount === 0 && tAgents.length > 0) healthScore -= 20;
        if (creditPct < 5) healthScore -= 25;
        if (tExecs === 0) healthScore -= 15;
        healthScore = Math.max(healthScore, 0);

        health.push({
          tenantId: t.id,
          tenantName: t.name,
          planType: t.plan_type,
          memberCount: memberIds.length,
          agentCount: tAgents.length,
          activeAgents: activeCount,
          totalExecutions: tExecs,
          creditUsage: creditPct,
          healthScore,
          risk: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "at_risk" : "churning",
        });
      }
      return health.sort((a, b) => a.healthScore - b.healthScore);
    },
  });

  // AI deep analysis
  const requestAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); return; }

      const context = `
Dados da plataforma CLAUTHOR:
- ${allProfiles.length} usuários cadastrados
- ${allAgents.length} agentes criados (${allAgents.filter(a => a.status === "active").length} ativos)
- MRR: R$ ${(totalRevenue / 100).toFixed(2)}
- ${totalExecutions} execuções totais
- ${userRisks.filter(u => u.riskLevel === "critical").length} usuários em risco crítico de churn
- ${userRisks.filter(u => u.riskLevel === "high").length} em risco alto
- ${allCredits.filter(c => c.plan_type === "free").length} no plano gratuito
- Top riscos: ${userRisks.slice(0, 3).map(u => `${u.name} (score ${u.riskScore}: ${u.reasons.join(", ")})`).join("; ")}
- Tenants saudáveis: ${tenantHealth.filter(t => t.risk === "healthy").length}
- Tenants em risco: ${tenantHealth.filter(t => t.risk !== "healthy").length}
`;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            messages: [
              { role: "user", content: `Analise estes dados e forneça: 1) Diagnóstico executivo em 3 linhas, 2) Top 3 ações imediatas, 3) Previsão de crescimento, 4) Riscos críticos. Seja direto e use bullet points.\n\n${context}` }
            ],
          }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("AI error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, ni);
          buf = buf.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { result += c; setAiAnalysis(result); }
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na análise de IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  const riskColors = {
    low: "text-emerald-400 bg-emerald-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    high: "text-orange-400 bg-orange-500/10",
    critical: "text-red-400 bg-red-500/10",
  };

  const healthColors = {
    healthy: "text-emerald-400 bg-emerald-500/10",
    at_risk: "text-amber-400 bg-amber-500/10",
    churning: "text-red-400 bg-red-500/10",
  };

  const healthLabels = {
    healthy: "Saudável",
    at_risk: "Em Risco",
    churning: "Churn Iminente",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">IA Preditiva</h2>
            <p className="text-xs text-muted-foreground">Insights automáticos • Churn prediction • Comportamento</p>
          </div>
        </div>
        <Button onClick={requestAIAnalysis} disabled={loadingAI} className="gap-1.5" size="sm">
          {loadingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loadingAI ? "Analisando..." : "Análise Profunda"}
        </Button>
      </motion.div>

      {/* AI Analysis */}
      <AnimatePresence>
        {aiAnalysis && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xs flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-primary" /> Análise de IA em Tempo Real
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setAiAnalysis(null)} className="h-6 text-[10px]">
                    <RefreshCcw className="h-3 w-3 mr-1" /> Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="prose prose-sm prose-invert max-w-none text-xs">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border p-4 ${insight.color}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-background/40 flex items-center justify-center shrink-0">
                <insight.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-semibold">{insight.title}</h4>
                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 border-0">
                    {insight.impact === "high" ? "⚡ Alto" : insight.impact === "medium" ? "📊 Médio" : "ℹ️ Baixo"}
                  </Badge>
                </div>
                <p className="text-[10px] opacity-80">{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Nenhum insight disponível. Dados insuficientes.
          </div>
        )}
      </div>

      {/* Churn Prediction + Tenant Health side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Churn Prediction */}
        <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" /> Previsão de Churn
              </CardTitle>
              <Badge variant="outline" className="text-[9px] border-red-500/20 text-red-400">
                {userRisks.filter(u => u.riskLevel === "critical" || u.riskLevel === "high").length} em risco
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5 max-h-[350px] overflow-y-auto">
            {userRisks.slice(0, 10).map((user, i) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center border border-border shrink-0">
                  <span className="text-[10px] font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium truncate">{user.name}</span>
                    <Badge className={`text-[8px] px-1.5 py-0 border-0 ${riskColors[user.riskLevel]}`}>
                      {user.riskScore}% risco
                    </Badge>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {user.reasons.slice(0, 2).join(" • ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-muted-foreground">{user.agentCount} agentes</p>
                  <p className="text-[9px] text-muted-foreground">{user.creditUsage}% créditos</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Multi-Tenant Health */}
        <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xs flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-cyan-400" /> Saúde Multi-Tenant
              </CardTitle>
              <Badge variant="outline" className="text-[9px] border-cyan-500/20 text-cyan-400">
                {tenantHealth.length} tenants
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5 max-h-[350px] overflow-y-auto">
            {tenantHealth.map((tenant, i) => (
              <motion.div
                key={tenant.tenantId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium truncate max-w-[150px]">{tenant.tenantName}</span>
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0">{tenant.planType}</Badge>
                  </div>
                  <Badge className={`text-[8px] px-1.5 py-0 border-0 ${healthColors[tenant.risk]}`}>
                    {healthLabels[tenant.risk]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Progress value={tenant.healthScore} className="h-1 flex-1" />
                  <span className="text-[9px] font-mono text-muted-foreground">{tenant.healthScore}%</span>
                </div>
                <div className="flex gap-3 text-[9px] text-muted-foreground">
                  <span>{tenant.memberCount} membros</span>
                  <span>{tenant.activeAgents}/{tenant.agentCount} agentes</span>
                  <span>{tenant.totalExecutions} exec</span>
                  <span>{tenant.creditUsage}% créditos</span>
                </div>
              </motion.div>
            ))}
            {tenantHealth.length === 0 && (
              <p className="text-center text-[10px] text-muted-foreground py-4">Carregando tenants...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Summary */}
      <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06]">
        <CardHeader className="py-3 px-4">
          <CardTitle className="font-display text-xs flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-violet-400" /> Resumo Comportamental
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Usuários Ativos (7d)", value: userRisks.filter(u => u.daysSinceLastAction <= 7).length, total: userRisks.length, color: "text-emerald-400", icon: Activity },
              { label: "Em Risco de Churn", value: userRisks.filter(u => u.riskLevel === "critical" || u.riskLevel === "high").length, total: userRisks.length, color: "text-red-400", icon: TrendingDown },
              { label: "Prontos p/ Upgrade", value: allCredits.filter(c => c.plan_type === "free" && c.used_credits > c.total_credits * 0.5).length, total: allCredits.filter(c => c.plan_type === "free").length, color: "text-amber-400", icon: TrendingUp },
              { label: "Agentes Dormentes", value: allAgents.filter(a => a.total_executions === 0).length, total: allAgents.length, color: "text-blue-400", icon: Snowflake },
              { label: "Taxa de Ativação", value: userRisks.filter(u => u.agentCount > 0).length, total: userRisks.length, color: "text-violet-400", icon: Target },
            ].map((metric) => (
              <div key={metric.label} className="p-3 rounded-xl bg-accent/20 text-center">
                <metric.icon className={`h-4 w-4 mx-auto mb-1.5 ${metric.color}`} />
                <p className="font-display text-lg font-bold">{metric.value}</p>
                <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                {metric.total > 0 && (
                  <p className="text-[8px] text-muted-foreground mt-0.5">
                    {Math.round((metric.value / metric.total) * 100)}% de {metric.total}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsightsPanel;