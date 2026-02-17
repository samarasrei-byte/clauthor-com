import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, Activity, CreditCard,
  Sparkles, Plus, ArrowRight, Clock, Zap, CheckCircle, DollarSign,
  TrendingUp, Coins, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import MiniSparkline from "@/components/dashboard/MiniSparkline";
import QuickActions from "@/components/dashboard/QuickActions";
import AgentChat from "@/components/dashboard/AgentChat";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";

const ClientDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { data: tokenUsage = [] } = useTokenUsage();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, agent:agents(*)")
        .eq("user_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return data.map((sub: any) => ({
        id: sub.id,
        agent_name: sub.agent?.name || "Agente",
        monthly_price: sub.monthly_price,
        status: sub.status,
        current_period_end: sub.current_period_end,
      }));
    },
    enabled: !!user,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["execution-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map((log: any) => ({
        id: log.id,
        agent_name: log.agent?.name || "Agente",
        action: log.action,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        created_at: log.created_at,
      }));
    },
    enabled: !!user,
  });

  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + t.tokens_used, 0);
  const estimatedSavings = activeAgents * 7560;

  const sidebarItems = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "agents", label: "Meus Agentes", icon: Bot, badge: agents.length || undefined },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", icon: Activity, badge: recentLogs.length || undefined },
    { id: "billing", label: "Assinatura", icon: CreditCard },
  ];

  const mockChartData = [
    { name: "Jan", execucoes: 400, sucesso: 380 },
    { name: "Fev", execucoes: 600, sucesso: 580 },
    { name: "Mar", execucoes: 800, sucesso: 770 },
    { name: "Abr", execucoes: 1200, sucesso: 1150 },
    { name: "Mai", execucoes: 1500, sucesso: 1460 },
    { name: "Jun", execucoes: 1800, sucesso: 1750 },
  ];

  const kpiCards = [
    { icon: Bot, label: "Agentes Ativos", value: activeAgents, suffix: "", spark: [1, 2, 2, 3, 3, activeAgents], color: "text-primary" },
    { icon: Zap, label: "Execuções", value: totalExecutions, suffix: "", spark: [100, 200, 350, 500, 800, totalExecutions || 0], color: "text-cyan-400" },
    { icon: CheckCircle, label: "Taxa Sucesso", value: 98.5, suffix: "%", spark: [95, 96, 97, 97.5, 98, 98.5], color: "text-emerald-500" },
    { icon: DollarSign, label: "Economia/mês", value: estimatedSavings, prefix: "R$ ", suffix: "", spark: [2000, 4000, 5000, 6000, 7000, estimatedSavings || 0], color: "text-cyan-400" },
    { icon: Coins, label: "Tokens Usados", value: totalTokensUsed, suffix: "", spark: [0, 100, 300, 500, 800, totalTokensUsed || 0], color: "text-primary" },
    { icon: Target, label: "Uso do Plano", value: usagePercentage, suffix: "%", spark: [10, 20, 30, 40, 50, usagePercentage], color: usagePercentage > 80 ? "text-destructive" : "text-cyan-400" },
  ];

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
    enterprise: "bg-primary/15 text-primary",
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "error") return <Activity className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar — fixed, full height */}
      <div className="hidden lg:block">
        <DashboardSidebar
          items={sidebarItems}
          activeItem={activeSection}
          onItemChange={setActiveSection}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="font-display text-2xl font-bold">Painel de Controle</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <QuickActions />
          </motion.div>

          {/* Mobile tabs */}
          <div className="flex gap-2 overflow-x-auto lg:hidden pb-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveSection(item.id)}
                className="shrink-0 gap-1.5"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiCards.map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl p-5 glass-hover group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                      </div>
                      <MiniSparkline data={kpi.spark} color={kpi.color.includes("primary") ? "hsl(var(--primary))" : kpi.color.includes("cyan") ? "#22d3ee" : "#10b981"} />
                    </div>
                    <p className="font-display text-2xl font-bold">
                      <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Token Usage */}
              {credits && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Consumo de Tokens</span>
                      <Badge variant="secondary" className="text-[10px]">{credits.plan_type}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {credits.used_credits.toLocaleString("pt-BR")} / {credits.total_credits.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2.5" />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{remainingCredits.toLocaleString("pt-BR")} restantes</span>
                    <span className="text-xs text-muted-foreground">
                      Reset em {credits.credits_reset_at ? new Date(credits.credits_reset_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <TokenUpgradeDialog trigger={
                      <Button size="sm" variant="outline" className="w-full gap-1.5 border-primary/20 text-primary text-xs">
                        <Coins className="h-3 w-3" /> Comprar mais tokens
                      </Button>
                    } />
                  </div>
                </motion.div>
              )}

              {/* Contracted + Agents + Chat */}
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left: Contracted + My Agents */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Contracted Agents */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <h2 className="font-display font-semibold text-sm">Agentes Contratados</h2>
                          <p className="text-[10px] text-muted-foreground">{subscriptions.length} ativo{subscriptions.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <Link to="/library">
                        <Button size="sm" variant="outline" className="gap-1 border-white/10 text-xs">Contratar</Button>
                      </Link>
                    </div>
                    <div className="p-4">
                      {subscriptions.length === 0 ? (
                        <div className="text-center py-8">
                          <Bot className="h-8 w-8 text-primary/40 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Nenhum agente contratado</p>
                          <Link to="/library"><Button size="sm" className="mt-3 glow text-xs">Ver Agentes</Button></Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {subscriptions.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium">{sub.agent_name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* My Agents */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="font-display font-semibold text-sm">Meus Agentes</h2>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/agents"><Button variant="ghost" size="sm" className="text-xs">Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
                        <Link to="/create-agent"><Button size="sm" className="gap-1 text-xs"><Plus className="h-3 w-3" /> Novo</Button></Link>
                      </div>
                    </div>
                    <div className="p-4">
                      {agents.length === 0 ? (
                        <div className="text-center py-8">
                          <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
                          <p className="text-sm font-medium">Crie seu primeiro agente</p>
                          <p className="text-xs text-muted-foreground mt-1">Explore a biblioteca e ative um funcionário de IA</p>
                          <Link to="/library"><Button className="mt-3 glow text-xs">Explorar Templates</Button></Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {agents.slice(0, 5).map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group cursor-pointer" onClick={() => agent.status === "active" && setSelectedAgent({ id: agent.id, name: agent.name })}>
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                                <div>
                                  <p className="text-sm font-medium">{agent.name}</p>
                                  <div className="flex gap-1.5 mt-1">
                                    <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
                                    <Badge variant="secondary" className={`text-[9px] ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{agent.status}</Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}<span className="text-[10px] text-muted-foreground">/mês</span></p>
                                <p className="text-[10px] text-muted-foreground">{agent.total_executions} exec</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Right: Chat */}
                <div className="lg:col-span-2">
                  <AgentChat agentId={selectedAgent?.id} agentName={selectedAgent?.name || "Assistente IA"} />
                </div>
              </div>
            </div>
          )}

          {/* ═══ AGENTS ═══ */}
          {activeSection === "agents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Meus Agentes ({agents.length})</h2>
                <Link to="/create-agent"><Button className="glow gap-1.5"><Plus className="h-4 w-4" /> Novo Agente</Button></Link>
              </div>
              {agents.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-bold mb-2">Nenhum agente criado</h3>
                  <p className="text-muted-foreground text-sm mb-6">Comece criando seu primeiro agente de IA</p>
                  <Link to="/library"><Button className="glow">Explorar Biblioteca</Button></Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {agents.map((agent, i) => (
                    <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5 glass-hover cursor-pointer" onClick={() => agent.status === "active" && setSelectedAgent({ id: agent.id, name: agent.name })}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-display font-semibold">{agent.name}</p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}`}>{agent.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Preço</p>
                          <p className="font-display font-bold text-sm">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Execuções</p>
                          <p className="font-display font-bold text-sm">{agent.total_executions}</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className={`font-bold text-sm ${agent.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {agent.status === "active" ? "●" : "○"} {agent.status}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Analytics</h2>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-display font-semibold">Execuções vs Sucesso</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-primary" /><span className="text-xs text-muted-foreground">Execuções</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-emerald-500" /><span className="text-xs text-muted-foreground">Sucesso</span></div>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockChartData}>
                      <defs>
                        <linearGradient id="cExec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cSucc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                      <Area type="monotone" dataKey="execucoes" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#cExec)" />
                      <Area type="monotone" dataKey="sucesso" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#cSucc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Este mês</p>
                    <p className="font-display text-xl font-bold">1,800</p>
                    <p className="text-xs text-emerald-500">+20%</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Taxa Média</p>
                    <p className="font-display text-xl font-bold">97.2%</p>
                    <p className="text-xs text-muted-foreground">de sucesso</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
                    <p className="font-display text-xl font-bold">1.2s</p>
                    <p className="text-xs text-muted-foreground">por execução</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {activeSection === "logs" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Logs de Execução ({recentLogs.length})</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                {recentLogs.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">Nenhum log encontrado</div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium">{log.agent_name}</p>
                            <p className="text-xs text-muted-foreground">{log.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={`text-[10px] ${log.status === "success" ? "bg-emerald-500/10 text-emerald-500" : log.status === "error" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"}`}>
                            {log.status}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ BILLING ═══ */}
          {activeSection === "billing" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">Assinatura & Créditos</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Credits */}
                <div className="glass-card rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <Coins className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold">Créditos</h3>
                    <Badge variant="secondary">{credits?.plan_type || "free"}</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{credits?.used_credits?.toLocaleString("pt-BR") || 0} usados</span>
                      <span>{credits?.total_credits?.toLocaleString("pt-BR") || 0} total</span>
                    </div>
                    <Progress value={usagePercentage} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">{100 - usagePercentage}% restante</p>
                  </div>
                  <TokenUpgradeDialog trigger={<Button className="w-full glow">Upgrade de Tokens <ArrowRight className="h-4 w-4 ml-2" /></Button>} />
                </div>

                {/* Subscriptions */}
                <div className="glass-card rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold">Assinaturas Ativas</h3>
                  </div>
                  {subscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma assinatura ativa</p>
                  ) : (
                    <div className="space-y-2">
                      {subscriptions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-sm">{sub.agent_name}</span>
                          </div>
                          <span className="text-sm font-medium">R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-white/5 flex justify-between">
                        <span className="text-sm font-medium">Total mensal</span>
                        <span className="font-display font-bold gradient-text">R$ {(subscriptions.reduce((a, s) => a + s.monthly_price, 0) / 100).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
