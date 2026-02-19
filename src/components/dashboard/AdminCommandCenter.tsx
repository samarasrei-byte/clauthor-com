import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Bot, DollarSign, TrendingUp, Coins, Zap,
  CheckCircle, ListOrdered, Globe, Cpu, Signal,
  ArrowUpRight, ArrowDownRight, Clock, Eye
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AnimatedCounter from "./AnimatedCounter";
import MiniSparkline from "./MiniSparkline";

interface AdminCommandCenterProps {
  usersCount: number;
  activeAgents: number;
  totalRevenue: number;
  pendingCount: number;
  totalTokensUsed: number;
  totalExecutions: number;
  successRate: number;
  waitingCount: number;
  allAgents: any[];
  allCredits: any[];
  allProfiles: any[];
  executionLogs: any[];
  revenueData: any[];
  onTabChange: (tab: string) => void;
}

const AdminCommandCenter = ({
  usersCount, activeAgents, totalRevenue, pendingCount,
  totalTokensUsed, totalExecutions, successRate, waitingCount,
  allAgents, allCredits, allProfiles, executionLogs, revenueData,
  onTabChange
}: AdminCommandCenterProps) => {

  const planDistribution = [
    { name: "Free", value: allCredits.filter(c => c.plan_type === "free").length, color: "#6b7280" },
    { name: "Starter", value: allCredits.filter(c => c.plan_type === "starter").length || 1, color: "hsl(0, 72%, 58%)" },
    { name: "Pro", value: allCredits.filter(c => c.plan_type === "pro").length || 1, color: "#22d3ee" },
    { name: "Enterprise", value: allCredits.filter(c => c.plan_type === "enterprise").length || 1, color: "#f59e0b" },
  ];

  const kpiCards = [
    { icon: Users, label: "Usuários Ativos", value: usersCount, spark: [1, 3, 5, 8, 12, usersCount], trend: "+12%", trendUp: true, gradient: "from-cyan-500/20 to-blue-500/10", iconColor: "text-cyan-400", borderColor: "border-cyan-500/20" },
    { icon: Bot, label: "Agentes Ativos", value: activeAgents, spark: [0, 1, 2, 3, 4, activeAgents], trend: "+8%", trendUp: true, gradient: "from-primary/20 to-rose-500/10", iconColor: "text-primary", borderColor: "border-primary/20" },
    { icon: DollarSign, label: "MRR", value: totalRevenue / 100, prefix: "R$ ", spark: [0, 100, 300, 500, 700, totalRevenue / 100], trend: "+23%", trendUp: true, gradient: "from-emerald-500/20 to-green-500/10", iconColor: "text-emerald-400", borderColor: "border-emerald-500/20" },
    { icon: Coins, label: "Tokens Consumidos", value: totalTokensUsed, spark: [0, 1000, 3000, 5000, 8000, totalTokensUsed], trend: "+45%", trendUp: true, gradient: "from-amber-500/20 to-orange-500/10", iconColor: "text-amber-400", borderColor: "border-amber-500/20" },
    { icon: Zap, label: "Execuções", value: totalExecutions, spark: [0, 10, 30, 50, 70, totalExecutions], trend: "+18%", trendUp: true, gradient: "from-violet-500/20 to-purple-500/10", iconColor: "text-violet-400", borderColor: "border-violet-500/20" },
    { icon: CheckCircle, label: "Taxa de Sucesso", value: successRate, suffix: "%", spark: [90, 92, 94, 96, 97, successRate], trend: "+2%", trendUp: true, gradient: "from-emerald-500/20 to-teal-500/10", iconColor: "text-emerald-400", borderColor: "border-emerald-500/20" },
    { icon: ListOrdered, label: "Na Waitlist", value: waitingCount, spark: [0, 2, 5, 8, 10, waitingCount], trend: "+5", trendUp: true, gradient: "from-blue-500/20 to-indigo-500/10", iconColor: "text-blue-400", borderColor: "border-blue-500/20" },
    { icon: Eye, label: "Pendentes", value: pendingCount, spark: [0, 1, 2, 1, 3, pendingCount], trend: "0", trendUp: false, gradient: "from-rose-500/20 to-red-500/10", iconColor: "text-rose-400", borderColor: "border-rose-500/20" },
  ];

  const recentLogs = executionLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Live Status Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-gradient-to-r from-primary/5 via-transparent to-cyan-500/5 rounded-2xl p-3 px-5 border border-white/[0.06]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="text-xs font-medium text-emerald-400">SISTEMA OPERACIONAL</span>
          <span className="text-[10px] text-muted-foreground">• Uptime 99.9%</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Edge Functions: OK</span>
          <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> API: 42ms</span>
          <span className="flex items-center gap-1"><Signal className="h-3 w-3" /> DB: Healthy</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </motion.div>

      {/* KPI Grid — Premium Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border ${kpi.borderColor} bg-gradient-to-br ${kpi.gradient} p-4 group hover:scale-[1.02] transition-all duration-300 cursor-default`}
          >
            {/* Subtle background glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-2xl" />
            
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center border border-white/[0.06]`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span className={`text-[10px] font-medium ${kpi.trendUp ? "text-emerald-400" : "text-muted-foreground"}`}>{kpi.trend}</span>
              </div>
            </div>

            <p className="font-display text-2xl font-bold tracking-tight">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              <MiniSparkline 
                data={kpi.spark} 
                color={kpi.iconColor.includes("cyan") ? "#22d3ee" : kpi.iconColor.includes("emerald") ? "#10b981" : kpi.iconColor.includes("amber") ? "#f59e0b" : kpi.iconColor.includes("violet") ? "#8b5cf6" : kpi.iconColor.includes("blue") ? "#3b82f6" : kpi.iconColor.includes("rose") ? "#f43f5e" : "hsl(0, 72%, 58%)"} 
                width={56} height={20} 
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart — Large */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> Receita Mensal
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400">+23% vs mês anterior</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(0, 0%, 8%)", 
                        border: "1px solid rgba(255,255,255,0.08)", 
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
                      }} 
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                    />
                    <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevAdmin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {planDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 8%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="text-muted-foreground">{plan.name}</span>
                    <span className="ml-auto font-medium">{plan.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row — Activity Feed + Top Agents + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real-time Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" /> Atividade Recente
                </CardTitle>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sem atividade recente</p>
              ) : recentLogs.map((log: any, i: number) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <div className={`w-1.5 h-8 rounded-full ${log.status === "success" ? "bg-emerald-500" : log.status === "error" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{log.agent?.name || log.action}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] shrink-0 ${log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : log.status === "error" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {log.status}
                  </Badge>
                </motion.div>
              ))}
              <button onClick={() => onTabChange("logs")} className="w-full text-[10px] text-muted-foreground hover:text-foreground text-center pt-1 transition-colors">
                Ver todos os logs →
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Agents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Top Agentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allAgents.sort((a: any, b: any) => b.total_executions - a.total_executions).slice(0, 5).map((agent: any, i: number) => (
                <div key={agent.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/20">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.total_executions} execuções</p>
                  </div>
                  <Badge variant="secondary" className={`text-[9px] ${agent.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted"}`}>
                    {agent.tier}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-background/30 backdrop-blur-2xl border border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" /> Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "MRR", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, sub: "Receita mensal recorrente", color: "border-l-emerald-500" },
                { label: "ARR", value: `R$ ${((totalRevenue * 12) / 100).toLocaleString("pt-BR")}`, sub: "Receita anual projetada", color: "border-l-cyan-500" },
                { label: "ARPU", value: `R$ ${usersCount > 0 ? ((totalRevenue / usersCount) / 100).toFixed(2) : "0"}`, sub: "Receita média por usuário", color: "border-l-amber-500" },
                { label: "LTV Est.", value: `R$ ${usersCount > 0 ? (((totalRevenue / usersCount) * 12) / 100).toFixed(0) : "0"}`, sub: "Lifetime value estimado (12m)", color: "border-l-violet-500" },
              ].map((stat) => (
                <div key={stat.label} className={`border-l-2 ${stat.color} pl-3 py-1.5`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                    <span className="font-display text-sm font-bold">{stat.value}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60">{stat.sub}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminCommandCenter;
