import { motion } from "framer-motion";
import { Bot, Zap, CheckCircle, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  activeAgents: number;
  totalExecutions: number;
  successRate: number;
  monthlyGrowth: number;
}

const DashboardStats = ({ activeAgents, totalExecutions, successRate, monthlyGrowth }: DashboardStatsProps) => {
  const stats = [
    { 
      icon: Bot, 
      label: "Agentes Ativos", 
      value: activeAgents.toString(), 
      trend: `+${monthlyGrowth} este mês`,
      color: "text-primary"
    },
    { 
      icon: Zap, 
      label: "Execuções Totais", 
      value: totalExecutions.toLocaleString("pt-BR"), 
      trend: "+12%",
      color: "text-blue-400"
    },
    { 
      icon: CheckCircle, 
      label: "Taxa de Sucesso", 
      value: `${successRate}%`, 
      trend: "+0.5%",
      color: "text-emerald-400"
    },
    { 
      icon: TrendingUp, 
      label: "Economia Mensal", 
      value: "R$ 4.5k", 
      trend: "vs funcionário",
      color: "text-purple-400"
    },
  ];

  return (
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
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center`}>
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
  );
};

export default DashboardStats;
