import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Bot, DollarSign, TrendingUp, ShoppingBag,
  CheckCircle, XCircle, Clock, BarChart3, Settings,
  Eye, Trash2, Shield
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetch all agents
  const { data: allAgents = [] } = useQuery({
    queryKey: ["admin-all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*, profile:profiles(full_name)")
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
        .select("*, publisher:profiles(full_name)")
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
        .select("*, profile:profiles(full_name), agent:agents(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = allSubscriptions.reduce((acc, s) => acc + (s.monthly_price || 0), 0);
  const activeAgents = allAgents.filter((a) => a.status === "active").length;

  const stats = [
    { icon: Users, label: "Total de Usuários", value: usersCount.toString(), color: "text-amber-400" },
    { icon: Bot, label: "Agentes Ativos", value: activeAgents.toString(), color: "text-primary" },
    { icon: DollarSign, label: "Receita Mensal", value: `R$ ${(totalRevenue / 100).toLocaleString("pt-BR")}`, color: "text-green-400" },
    { icon: ShoppingBag, label: "Pendentes Aprovação", value: pendingAgents.length.toString(), color: "text-yellow-400" },
  ];

  const approveAgent = async (id: string) => {
    await supabase
      .from("marketplace_agents")
      .update({ is_approved: true })
      .eq("id", id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
        </div>
        <p className="text-muted-foreground">Gerencie a plataforma ApexBot</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08] hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Agents */}
            <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Agentes Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allAgents.slice(0, 5).map((agent: any) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        por {agent.profile?.full_name || "Usuário"}
                      </p>
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
                  <Clock className="h-5 w-5 text-yellow-400" />
                  Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum agente pendente
                  </p>
                ) : (
                  pendingAgents.slice(0, 5).map((agent: any) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{agent.title}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => approveAgent(agent.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Todos os Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Proprietário</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Tier</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Preço</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAgents.map((agent: any) => (
                      <tr key={agent.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                        <td className="p-3 font-medium">{agent.name}</td>
                        <td className="p-3 text-muted-foreground">{agent.profile?.full_name || "-"}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{agent.tier}</Badge>
                        </td>
                        <td className="p-3">R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}</td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={agent.status === "active" ? "bg-primary/20 text-primary" : ""}
                          >
                            {agent.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Agentes no Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                O marketplace será populado quando usuários publicarem seus agentes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader>
              <CardTitle className="font-display text-lg">Assinaturas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {allSubscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma assinatura ativa ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08]">
                        <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Agente</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSubscriptions.map((sub: any) => (
                        <tr key={sub.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                          <td className="p-3">{sub.profile?.full_name || "-"}</td>
                          <td className="p-3">{sub.agent?.name || "-"}</td>
                          <td className="p-3">R$ {(sub.monthly_price / 100).toLocaleString("pt-BR")}/mês</td>
                          <td className="p-3">
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              {sub.status}
                            </Badge>
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
