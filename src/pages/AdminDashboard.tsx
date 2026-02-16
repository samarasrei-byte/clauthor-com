import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, Bot, DollarSign, TrendingUp, ShoppingBag,
  CheckCircle, XCircle, Clock, BarChart3, Shield,
  Eye, Activity, Coins, ListOrdered, Mail, Phone,
  Building, AlertTriangle, Zap
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch all users count
  const { data: usersCount = 0 } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch all profiles
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all agents
  const { data: allAgents = [] } = useQuery({
    queryKey: ["admin-all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch marketplace agents pending approval
  const { data: pendingAgents = [] } = useQuery({
    queryKey: ["admin-pending-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_agents")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch subscriptions
  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch waitlist
  const { data: waitlist = [] } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch execution logs
  const { data: executionLogs = [] } = useQuery({
    queryKey: ["admin-execution-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch token usage
  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["admin-token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("token_usage")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch user credits
  const { data: allCredits = [] } = useQuery({
    queryKey: ["admin-all-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .order("created_at", { ascending: false });
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

  const stats = [
    { icon: Users, label: "Total Usuários", value: usersCount.toString(), color: "text-cyan-400" },
    { icon: Bot, label: "Agentes Ativos", value: activeAgents.toString(), color: "text-primary" },
    { icon: DollarSign, label: "Receita Mensal", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, color: "text-cyan-400" },
    { icon: ShoppingBag, label: "Pendentes", value: pendingAgents.length.toString(), color: "text-primary/80" },
    { icon: Coins, label: "Tokens Consumidos", value: totalTokensUsed > 1000000 ? `${(totalTokensUsed / 1000000).toFixed(1)}M` : `${(totalTokensUsed / 1000).toFixed(0)}k`, color: "text-cyan-400" },
    { icon: Zap, label: "Execuções", value: totalExecutions.toString(), color: "text-primary" },
    { icon: CheckCircle, label: "Taxa Sucesso", value: `${successRate}%`, color: "text-cyan-400" },
    { icon: ListOrdered, label: "Na Waitlist", value: waitingCount.toString(), color: "text-primary/80" },
  ];

  // Revenue mock chart data (based on subscriptions)
  const revenueData = [
    { name: "Jan", receita: Math.round(totalRevenue * 0.4 / 100) },
    { name: "Fev", receita: Math.round(totalRevenue * 0.5 / 100) },
    { name: "Mar", receita: Math.round(totalRevenue * 0.65 / 100) },
    { name: "Abr", receita: Math.round(totalRevenue * 0.8 / 100) },
    { name: "Mai", receita: Math.round(totalRevenue * 0.9 / 100) },
    { name: "Jun", receita: Math.round(totalRevenue / 100) },
  ];

  // Plan distribution
  const planDistribution = [
    { name: "Free", value: allCredits.filter(c => c.plan_type === "free").length, color: "hsl(var(--muted-foreground))" },
    { name: "Starter", value: allCredits.filter(c => c.plan_type === "starter").length || 0, color: "hsl(var(--primary))" },
    { name: "Pro", value: allCredits.filter(c => c.plan_type === "pro").length || 0, color: "#22d3ee" },
    { name: "Enterprise", value: allCredits.filter(c => c.plan_type === "enterprise").length || 0, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  const approveAgent = async (id: string) => {
    const { error } = await supabase
      .from("marketplace_agents")
      .update({ is_approved: true })
      .eq("id", id);
    if (!error) {
      toast.success("Agente aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] });
    }
  };

  const rejectAgent = async (id: string) => {
    const { error } = await supabase
      .from("marketplace_agents")
      .delete()
      .eq("id", id);
    if (!error) {
      toast.success("Agente rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
          <Badge variant="outline" className="border-primary/20 text-primary">Master</Badge>
        </div>
        <p className="text-muted-foreground">Controle total da plataforma ApexBot</p>
      </motion.div>

      {/* Stats Grid - 8 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08] hover:border-primary/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="font-display text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background/40 backdrop-blur-xl border border-white/[0.08] flex-wrap h-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                      <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Agents */}
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Agentes Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allAgents.slice(0, 6).map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.tier} • R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês</p>
                    </div>
                    <Badge variant="secondary" className={agent.status === "active" ? "bg-primary/20 text-primary" : ""}>
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary/80" />
                  Aguardando Aprovação ({pendingAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingAgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum agente pendente</p>
                ) : (
                  pendingAgents.slice(0, 5).map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium">{agent.title}</p>
                        <p className="text-[10px] text-muted-foreground">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => approveAgent(agent.id)}>
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => rejectAgent(agent.id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Waitlist Summary */}
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-cyan-400" />
                  Waitlist ({waitlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {waitlist.slice(0, 5).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        #{entry.position}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.name || entry.email}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.company || "—"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={entry.status === "waiting" ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/20 text-primary"}>
                      {entry.status === "waiting" ? "Aguardando" : entry.status}
                    </Badge>
                  </div>
                ))}
                {waitlist.length > 5 && (
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setActiveTab("waitlist")}>
                    Ver todos ({waitlist.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-400" />
                Todos os Usuários ({allProfiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Plano</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Créditos</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map((profile: any) => {
                      const userCredit = allCredits.find((c: any) => c.user_id === profile.user_id);
                      return (
                        <tr key={profile.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3 font-medium">{profile.full_name || "—"}</td>
                          <td className="p-3 text-muted-foreground">{profile.company_name || "—"}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="text-[10px]">
                              {userCredit?.plan_type || "free"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {userCredit ? (
                              <div className="flex items-center gap-2">
                                <Progress value={Math.round((userCredit.used_credits / userCredit.total_credits) * 100)} className="h-1.5 w-16" />
                                <span className="text-xs text-muted-foreground">
                                  {Math.round((userCredit.used_credits / userCredit.total_credits) * 100)}%
                                </span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Todos os Agentes ({allAgents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tier</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Preço</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Execuções</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAgents.map((agent: any) => (
                      <tr key={agent.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                        <td className="p-3 font-medium">{agent.name}</td>
                        <td className="p-3"><Badge variant="secondary">{agent.tier}</Badge></td>
                        <td className="p-3">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}</td>
                        <td className="p-3">{agent.total_executions}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className={agent.status === "active" ? "bg-primary/20 text-primary" : ""}>
                            {agent.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(agent.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Evolução da Receita
                </CardTitle>
              </CardHeader>
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
              <CardHeader>
                <CardTitle className="font-display text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">MRR (Receita Recorrente)</p>
                  <p className="font-display text-2xl font-bold gradient-text">R$ {(totalRevenue / 100).toLocaleString("pt-BR")}</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">ARR (Anualizada)</p>
                  <p className="font-display text-2xl font-bold">R$ {((totalRevenue * 12) / 100).toLocaleString("pt-BR")}</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Assinaturas Ativas</p>
                  <p className="font-display text-2xl font-bold">{allSubscriptions.length}</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
                  <p className="font-display text-2xl font-bold">
                    R$ {allSubscriptions.length > 0 ? ((totalRevenue / allSubscriptions.length) / 100).toLocaleString("pt-BR") : "0"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Waitlist Tab */}
        <TabsContent value="waitlist">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-cyan-400" />
                Waitlist Completa ({waitlist.length})
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-cyan-500/20 text-cyan-400">
                  {waitingCount} aguardando
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">WhatsApp</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Empresa</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                        <td className="p-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {entry.position}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{entry.name || "—"}</td>
                        <td className="p-3 text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {entry.email}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entry.whatsapp}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {entry.company || "—"}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={entry.status === "waiting" ? "bg-cyan-500/10 text-cyan-400" : "bg-primary/20 text-primary"}>
                            {entry.status === "waiting" ? "Aguardando" : entry.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Logs de Execução ({executionLogs.length})
              </CardTitle>
            </CardHeader>
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
                        <td className="p-3">
                          <Badge variant="secondary" className={
                            log.status === "success" ? "bg-cyan-500/10 text-cyan-400" :
                            log.status === "error" ? "bg-destructive/10 text-destructive" :
                            "bg-primary/10 text-primary/80"
                          }>
                            {log.status === "success" ? "Sucesso" : log.status === "error" ? "Erro" : log.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{log.execution_time_ms ? `${log.execution_time_ms}ms` : "—"}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Agentes no Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAgents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  O marketplace será populado quando usuários publicarem seus agentes.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingAgents.map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/30">
                      <div>
                        <p className="font-medium">{agent.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {agent.short_description || "Sem descrição"} • {agent.tier} • R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês
                        </p>
                        {agent.tags && agent.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {agent.tags.slice(0, 4).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveAgent(agent.id)} className="gap-1">
                          <CheckCircle className="h-4 w-4" /> Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectAgent(agent.id)} className="gap-1">
                          <XCircle className="h-4 w-4" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Assinaturas Ativas ({allSubscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allSubscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma assinatura ativa ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="text-left p-3 text-muted-foreground font-medium">Agente</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Período</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSubscriptions.map((sub: any) => (
                        <tr key={sub.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3 font-medium">{sub.agent_id ? sub.agent_id.slice(0, 8) : "—"}</td>
                          <td className="p-3">R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString("pt-BR") : "—"}
                            {" → "}
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant="secondary" className="bg-primary/20 text-primary">{sub.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
