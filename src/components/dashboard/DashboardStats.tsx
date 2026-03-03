import { motion } from "framer-motion";
import { Bot, Zap, CheckCircle, TrendingUp, Coins, Clock, Target, DollarSign } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useTokenUsage } from "@/hooks/useCredits";
import { Progress } from "@/components/ui/progress";

interface DashboardStatsProps {
  activeAgents: number;
  totalExecutions: number;
  successRate: number;
  monthlyGrowth: number;
}

const DashboardStats = ({ activeAgents, totalExecutions, successRate, monthlyGrowth }: DashboardStatsProps) => {
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { data: tokenUsage = [] } = useTokenUsage();

  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + t.tokens_used, 0);
  const estimatedSavings = activeAgents * 7560; // 3 CLT employees per agent × R$7,560/mo avg

  const successLogs = totalExecutions > 0 ? Math.round(successRate) : 0;
  const execTrend = totalExecutions > 100 ? `+${Math.min(99, Math.round(totalExecutions * 0.12))}` : totalExecutions > 0 ? `+${totalExecutions}` : "0";

  const stats = [
    { 
      icon: Bot, 
      label: "Agentes Ativos", 
      value: activeAgents.toString(), 
      trend: monthlyGrowth > 0 ? `+${monthlyGrowth} este mês` : activeAgents > 0 ? "estável" : "nenhum",
      color: "text-primary"
    },
    { 
      icon: Zap, 
      label: "Execuções Totais", 
      value: totalExecutions.toLocaleString("pt-BR"), 
      trend: execTrend,
      color: "text-cyan-400"
    },
    { 
      icon: CheckCircle, 
      label: "Taxa de Sucesso", 
      value: totalExecutions > 0 ? `${successRate}%` : "—", 
      trend: totalExecutions > 0 ? `${totalExecutions} execuções` : "sem dados",
      color: "text-primary/80"
    },
    { 
      icon: DollarSign, 
      label: "Economia Estimada", 
      value: activeAgents > 0 ? `R$ ${estimatedSavings.toLocaleString("pt-BR")}` : "—", 
      trend: activeAgents > 0 ? "vs CLT/mês" : "contrate agentes",
      color: "text-cyan-400"
    },
    { 
      icon: Coins, 
      label: "Tokens Consumidos", 
      value: totalTokensUsed > 1000000 
        ? `${(totalTokensUsed / 1000000).toFixed(1)}M` 
        : totalTokensUsed > 1000 
        ? `${(totalTokensUsed / 1000).toFixed(0)}k` 
        : totalTokensUsed.toString(),
      trend: `${remainingCredits.toLocaleString("pt-BR")} restantes`,
      color: "text-primary"
    },
    { 
      icon: Target, 
      label: "Uso do Plano", 
      value: `${usagePercentage}%`, 
      trend: credits?.plan_type || "free",
      color: usagePercentage > 80 ? "text-destructive" : "text-cyan-400"
    },
    { 
      icon: Clock, 
      label: "Horas Economizadas", 
      value: activeAgents > 0 ? `${Math.round(totalExecutions * 0.03)}h` : "—",
      trend: activeAgents > 0 ? "este período" : "sem dados",
      color: "text-primary/80"
    },
    { 
      icon: TrendingUp, 
      label: "ROI Estimado", 
      value: activeAgents > 0 ? `${Math.round(((estimatedSavings - (activeAgents * 3997)) / Math.max(activeAgents * 3997, 1)) * 100)}%` : "—",
      trend: activeAgents > 0 ? "retorno/mês" : "contrate agentes",
      color: "text-cyan-400"
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="glass-card rounded-2xl p-5 glass-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="text-xs text-primary font-medium">{s.trend}</span>
              </div>
              <p className="font-display text-2xl font-bold mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Token Usage Bar */}
      {credits && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Consumo de Tokens</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {credits.used_credits.toLocaleString("pt-BR")} / {credits.total_credits.toLocaleString("pt-BR")}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2.5" />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {remainingCredits.toLocaleString("pt-BR")} tokens restantes
            </span>
            <span className="text-xs text-muted-foreground">
              Reset em {credits.credits_reset_at ? new Date(credits.credits_reset_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardStats;
