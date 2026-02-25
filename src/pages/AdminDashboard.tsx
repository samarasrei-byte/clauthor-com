import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Bot, DollarSign, TrendingUp, ShoppingBag,
  CheckCircle, XCircle, Clock, BarChart3, Shield,
  Activity, Coins, ListOrdered, Mail, Phone,
  Building, Zap, LayoutDashboard, CreditCard, Store,
  ShieldCheck, Wallet, Rocket, Sparkles, Crown, Settings, Key
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import MiniSparkline from "@/components/dashboard/MiniSparkline";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import AdminCommandCenter from "@/components/dashboard/AdminCommandCenter";
import PaymentsPanel from "@/components/dashboard/PaymentsPanel";
import AdminWarRoom from "@/components/dashboard/AdminWarRoom";
import AdminAgentSettings from "@/components/dashboard/AdminAgentSettings";
import AdminInsightsPanel from "@/components/dashboard/AdminInsightsPanel";
import OmnixCommandCenter from "@/pages/OmnixCommandCenter";
import PlatformCredentialsPanel from "@/components/dashboard/PlatformCredentialsPanel";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: usersCount = 0 } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allAgents = [] } = useQuery({
    queryKey: ["admin-all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingAgents = [] } = useQuery({
    queryKey: ["admin-pending-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_agents").select("*").eq("is_approved", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, agent:agents(name)").eq("status", "active").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: waitlist = [] } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: executionLogs = [] } = useQuery({
    queryKey: ["admin-execution-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execution_logs").select("*, agent:agents(name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["admin-token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("token_usage").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: allCredits = [] } = useQuery({
    queryKey: ["admin-all-credits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_credits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = allSubscriptions.reduce((acc, s) => acc + (s.monthly_price || 0), 0);
  const activeAgents = allAgents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + (t.tokens_used || 0), 0);
  const totalExecutions = executionLogs.length;
  const successLogs = executionLogs.filter((l: any) => l.status === "success").length;
  const successRate = totalExecutions > 0 ? Math.round((successLogs / totalExecutions) * 100) : 0;
  const waitingCount = waitlist.filter((w) => w.status === "waiting").length;

  const sidebarItems = [
    { id: "omnix", label: "THOR", icon: Sparkles, badge: "AI" },
    { id: "overview", label: "Command Center", icon: LayoutDashboard },
    { id: "insights", label: "IA Preditiva", icon: Sparkles },
    { id: "war-room", label: "War Room", icon: Crown },
    { id: "agent-settings", label: "Config. Agentes", icon: Settings },
    { id: "platform-creds", label: "Credenciais Central", icon: Key },
    { id: "payments", label: "Pagamentos", icon: Wallet },
    { id: "users", label: "Usuários", icon: Users, badge: usersCount || undefined },
    { id: "agents", label: "Agentes", icon: Bot, badge: allAgents.length || undefined },
    { id: "revenue", label: "Receita", icon: BarChart3 },
    { id: "waitlist", label: "Waitlist", icon: ListOrdered, badge: waitingCount || undefined },
    { id: "logs", label: "Logs", icon: Activity, badge: totalExecutions || undefined },
    { id: "marketplace", label: "Marketplace", icon: Store, badge: pendingAgents.length || undefined },
    { id: "subscriptions", label: "Assinaturas", icon: CreditCard },
  ];

  const revenueData = [
    { name: "Jan", receita: Math.round(totalRevenue * 0.4 / 100) },
    { name: "Fev", receita: Math.round(totalRevenue * 0.5 / 100) },
    { name: "Mar", receita: Math.round(totalRevenue * 0.65 / 100) },
    { name: "Abr", receita: Math.round(totalRevenue * 0.8 / 100) },
    { name: "Mai", receita: Math.round(totalRevenue * 0.9 / 100) },
    { name: "Jun", receita: Math.round(totalRevenue / 100) },
  ];

  const planDistribution = [
    { name: "Free", value: allCredits.filter(c => c.plan_type === "free").length, color: "hsl(var(--muted-foreground))" },
    { name: "Starter", value: allCredits.filter(c => c.plan_type === "starter").length || 0, color: "hsl(var(--primary))" },
    { name: "Pro", value: allCredits.filter(c => c.plan_type === "pro").length || 0, color: "#22d3ee" },
    { name: "Enterprise", value: allCredits.filter(c => c.plan_type === "enterprise").length || 0, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  const approveAgent = async (id: string) => {
    const { error } = await supabase.from("marketplace_agents").update({ is_approved: true }).eq("id", id);
    if (!error) { toast.success("Agente aprovado!"); queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] }); }
  };

  const rejectAgent = async (id: string) => {
    const { error } = await supabase.from("marketplace_agents").delete().eq("id", id);
    if (!error) { toast.success("Agente rejeitado."); queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] }); }
  };

  const kpiCards = [
    { icon: Users, label: "Total Usuários", value: usersCount, spark: [1, 3, 5, 8, 12, usersCount], color: "text-cyan-400" },
    { icon: Bot, label: "Agentes Ativos", value: activeAgents, spark: [0, 1, 2, 3, 4, activeAgents], color: "text-primary" },
    { icon: DollarSign, label: "MRR", value: totalRevenue / 100, prefix: "R$ ", spark: [0, 100, 300, 500, 700, totalRevenue / 100], color: "text-cyan-400" },
    { icon: ShoppingBag, label: "Pendentes", value: pendingAgents.length, spark: [0, 1, 2, 1, 3, pendingAgents.length], color: "text-primary/80" },
    { icon: Coins, label: "Tokens Consumidos", value: totalTokensUsed, spark: [0, 1000, 3000, 5000, 8000, totalTokensUsed], color: "text-cyan-400" },
    { icon: Zap, label: "Execuções", value: totalExecutions, spark: [0, 10, 30, 50, 70, totalExecutions], color: "text-primary" },
    { icon: CheckCircle, label: "Taxa Sucesso", value: successRate, suffix: "%", spark: [90, 92, 94, 96, 97, successRate], color: "text-emerald-500" },
    { icon: ListOrdered, label: "Na Waitlist", value: waitingCount, spark: [0, 2, 5, 8, 10, waitingCount], color: "text-primary/80" },
  ];

  const formatTokens = (n: number) => n > 1000000 ? `${(n / 1000000).toFixed(1)}M` : n > 1000 ? `${(n / 1000).toFixed(0)}k` : n.toString();

  return (
    <div className="flex h-full">
      {/* Sidebar — fixed, full height */}
      <div className="hidden lg:block">
        <DashboardSidebar items={sidebarItems} activeItem={activeTab} onItemChange={setActiveTab} />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <Shield className="h-6 w-6 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
              </div>
              <h1 className="font-display text-2xl font-bold">PROMETHEUS</h1>
              <Badge variant="outline" className="border-primary/20 text-primary text-[10px] font-mono">ADMIN MASTER</Badge>
              <TokenUpgradeDialog trigger={
                <Button size="sm" variant="outline" className="gap-1.5 border-primary/20 text-primary ml-auto text-xs">
                  <Coins className="h-3.5 w-3.5" /> Tokens
                </Button>
              } />
            </div>
            <p className="text-xs text-muted-foreground">Command Center — Controle total da plataforma</p>
          </motion.div>

          {/* Mobile tabs */}
          <div className="flex gap-2 overflow-x-auto lg:hidden pb-2">
            {sidebarItems.map((item) => (
              <Button key={item.id} variant={activeTab === item.id ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(item.id)} className="shrink-0 gap-1.5 text-xs">
                <item.icon className="h-3.5 w-3.5" /> {item.label}
              </Button>
            ))}
          </div>

          {/* ═══ OMNIX ═══ */}
          {activeTab === "omnix" && (
            <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-border/10">
              <OmnixCommandCenter />
            </div>
          )}

          {/* ═══ AI INSIGHTS ═══ */}
          {activeTab === "insights" && (
            <AdminInsightsPanel
              allProfiles={allProfiles}
              allAgents={allAgents}
              allCredits={allCredits}
              executionLogs={executionLogs}
              totalRevenue={totalRevenue}
              totalExecutions={totalExecutions}
            />
          )}

          {/* ═══ WAR ROOM — ALL AGENTS UNIFIED ═══ */}
          {activeTab === "war-room" && <AdminWarRoom />}

          {/* ═══ AGENT SETTINGS — ADMIN ═══ */}
          {activeTab === "agent-settings" && <AdminAgentSettings />}

          {/* ═══ PLATFORM CREDENTIALS ═══ */}
          {activeTab === "platform-creds" && <PlatformCredentialsPanel />}

          {/* ═══ COMMAND CENTER (OVERVIEW) ═══ */}
          {activeTab === "overview" && (
            <AdminCommandCenter
              usersCount={usersCount}
              activeAgents={activeAgents}
              totalRevenue={totalRevenue}
              pendingCount={pendingAgents.length}
              totalTokensUsed={totalTokensUsed}
              totalExecutions={totalExecutions}
              successRate={successRate}
              waitingCount={waitingCount}
              allAgents={allAgents}
              allCredits={allCredits}
              allProfiles={allProfiles}
              executionLogs={executionLogs}
              revenueData={revenueData}
              onTabChange={setActiveTab}
            />
          )}

          {/* ═══ PAYMENTS ═══ */}
          {activeTab === "payments" && (
            <PaymentsPanel
              totalRevenue={totalRevenue}
              subscriptionCount={allSubscriptions.length}
            />
          )}

          {/* ═══ USERS ═══ */}
          {activeTab === "users" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2"><Users className="h-5 w-5 text-cyan-400" /> Todos os Usuários ({allProfiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Plano</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Créditos</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Cadastro</th>
                    </tr></thead>
                    <tbody>
                      {allProfiles.map((profile: any) => {
                        const userCredit = allCredits.find((c: any) => c.user_id === profile.user_id);
                        return (
                          <tr key={profile.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                            <td className="p-3 font-medium">{profile.full_name || "—"}</td>
                            <td className="p-3 text-muted-foreground">{profile.company_name || "—"}</td>
                            <td className="p-3"><Badge variant="secondary" className="text-[10px]">{userCredit?.plan_type || "free"}</Badge></td>
                            <td className="p-3">{userCredit ? (<div className="flex items-center gap-2"><Progress value={Math.round((userCredit.used_credits / userCredit.total_credits) * 100)} className="h-1.5 w-16" /><span className="text-xs text-muted-foreground">{Math.round((userCredit.used_credits / userCredit.total_credits) * 100)}%</span></div>) : "—"}</td>
                            <td className="p-3 text-muted-foreground text-xs">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ AGENTS ═══ */}
          {activeTab === "agents" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader><CardTitle className="font-display text-lg">Todos os Agentes ({allAgents.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tier</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Preço</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Execuções</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Criado</th>
                    </tr></thead>
                    <tbody>
                      {allAgents.map((agent: any) => (
                        <tr key={agent.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3 font-medium">{agent.name}</td>
                          <td className="p-3"><Badge variant="secondary">{agent.tier}</Badge></td>
                          <td className="p-3">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}</td>
                          <td className="p-3">{agent.total_executions}</td>
                          <td className="p-3"><Badge variant="secondary" className={agent.status === "active" ? "bg-primary/20 text-primary" : ""}>{agent.status}</Badge></td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(agent.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ REVENUE ═══ */}
          {activeTab === "revenue" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-background/40 backdrop-blur-xl border border-white/[0.08]">
                <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Evolução da Receita</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                        <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
                <CardHeader><CardTitle className="font-display text-lg">Resumo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">MRR</p>
                    <p className="font-display text-2xl font-bold gradient-text">R$ {(totalRevenue / 100).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">ARR</p>
                    <p className="font-display text-2xl font-bold">R$ {((totalRevenue * 12) / 100).toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Assinaturas Ativas</p>
                    <p className="font-display text-2xl font-bold">{allSubscriptions.length}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
                    <p className="font-display text-2xl font-bold">R$ {allSubscriptions.length > 0 ? ((totalRevenue / allSubscriptions.length) / 100).toLocaleString("pt-BR") : "0"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ WAITLIST ═══ */}
          {activeTab === "waitlist" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2"><ListOrdered className="h-5 w-5 text-cyan-400" /> Waitlist ({waitlist.length})</CardTitle>
                <Badge variant="outline" className="border-cyan-500/20 text-cyan-400">{waitingCount} aguardando</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">WhatsApp</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                    </tr></thead>
                    <tbody>
                      {waitlist.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3"><span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{entry.position}</span></td>
                          <td className="p-3 font-medium">{entry.name || "—"}</td>
                          <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {entry.email}</span></td>
                          <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entry.whatsapp}</span></td>
                          <td className="p-3 text-muted-foreground"><span className="flex items-center gap-1"><Building className="h-3 w-3" /> {entry.company || "—"}</span></td>
                          <td className="p-3"><Badge variant="secondary" className={entry.status === "waiting" ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/20 text-primary"}>{entry.status === "waiting" ? "Aguardando" : entry.status}</Badge></td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(entry.created_at).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ LOGS ═══ */}
          {activeTab === "logs" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Logs de Execução ({executionLogs.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background/90 backdrop-blur">
                      <tr className="border-b border-white/[0.08]">
                        <th className="text-left p-3 text-muted-foreground font-medium">Agente</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Ação</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Tempo</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executionLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3 font-medium">{log.agent?.name || "—"}</td>
                          <td className="p-3 text-muted-foreground">{log.action}</td>
                          <td className="p-3"><Badge variant="secondary" className={log.status === "success" ? "bg-cyan-500/10 text-cyan-400" : log.status === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary/80"}>{log.status}</Badge></td>
                          <td className="p-3 text-muted-foreground">{log.execution_time_ms ? `${log.execution_time_ms}ms` : "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ MARKETPLACE ═══ */}
          {activeTab === "marketplace" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader><CardTitle className="font-display text-lg">Agentes no Marketplace</CardTitle></CardHeader>
              <CardContent>
                {pendingAgents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">O marketplace será populado quando usuários publicarem seus agentes.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingAgents.map((agent: any) => (
                      <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/30">
                        <div>
                          <p className="font-medium">{agent.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{agent.short_description || "Sem descrição"} • {agent.tier} • R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveAgent(agent.id)} className="gap-1"><CheckCircle className="h-4 w-4" /> Aprovar</Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectAgent(agent.id)} className="gap-1"><XCircle className="h-4 w-4" /> Rejeitar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ SUBSCRIPTIONS ═══ */}
          {activeTab === "subscriptions" && (
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader><CardTitle className="font-display text-lg">Assinaturas Ativas ({allSubscriptions.length})</CardTitle></CardHeader>
              <CardContent>
                {allSubscriptions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma assinatura ativa.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/[0.08]">
                        <th className="text-left p-3 text-muted-foreground font-medium">Agente</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Período</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      </tr></thead>
                      <tbody>
                        {allSubscriptions.map((sub: any) => (
                          <tr key={sub.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                            <td className="p-3 font-medium">{(sub as any).agent?.name || (sub.agent_id ? sub.agent_id.slice(0, 8) : "—")}</td>
                            <td className="p-3">R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês</td>
                            <td className="p-3 text-muted-foreground text-xs">{sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString("pt-BR") : "—"} → {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}</td>
                            <td className="p-3"><Badge variant="secondary" className="bg-primary/20 text-primary">{sub.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
