import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Bot, Plus, Zap, Clock, DollarSign, CheckCircle,
  Activity, BarChart3, CreditCard, Settings, ArrowRight
} from "lucide-react";

const tierLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  enterprise: "Enterprise",
};

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  intermediate: "bg-blue-500/20 text-blue-400",
  advanced: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-primary/20 text-primary",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  paused: "bg-yellow-500/20 text-yellow-400",
  archived: "bg-destructive/20 text-destructive",
};

const ClientDashboard = () => {
  const { user } = useAuth();

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
      return data;
    },
    enabled: !!user,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["recent-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const monthlySpend = subscriptions.reduce((acc, s) => acc + (s.monthly_price || 0), 0);

  const stats = [
    { icon: Bot, label: "Agentes Ativos", value: activeAgents.toString(), color: "text-primary" },
    { icon: Zap, label: "Execuções Totais", value: totalExecutions.toLocaleString("pt-BR"), color: "text-primary" },
    { icon: CreditCard, label: "Gasto Mensal", value: `R$ ${(monthlySpend / 100).toLocaleString("pt-BR")}`, color: "text-primary" },
    { icon: CheckCircle, label: "Taxa de Sucesso", value: "98.5%", color: "text-primary" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Meu Painel</h1>
          <p className="text-muted-foreground">Gerencie seus funcionários digitais</p>
        </div>
        <Link to="/create-agent">
          <Button className="neon-glow">
            <Plus className="h-4 w-4 mr-2" /> Novo Agente
          </Button>
        </Link>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Agents */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Meus Agentes
              </CardTitle>
              <Link to="/agents">
                <Button variant="ghost" size="sm">
                  Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAgents ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : agents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Você ainda não tem agentes</p>
                  <Link to="/library">
                    <Button size="sm" className="neon-glow">
                      Explorar Templates
                    </Button>
                  </Link>
                </div>
              ) : (
                agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className={tierColors[agent.tier]}>
                            {tierLabels[agent.tier]}
                          </Badge>
                          <Badge variant="secondary" className={statusColors[agent.status]}>
                            {statusLabels[agent.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}/mês
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agent.total_executions} execuções
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade ainda
                </p>
              ) : (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString("pt-BR", { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{log.agent?.name || "Agente"}</p>
                      <p className={`text-xs ${log.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                        {log.action}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDashboard;
