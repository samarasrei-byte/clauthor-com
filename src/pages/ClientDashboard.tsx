import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Bot, Plus, Zap, Clock, CreditCard, CheckCircle,
  Activity, ArrowRight, TrendingUp, Sparkles
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
    { icon: Bot, label: "Agentes Ativos", value: activeAgents.toString(), trend: "+2 este mês" },
    { icon: Zap, label: "Execuções Totais", value: totalExecutions.toLocaleString("pt-BR"), trend: "+12%" },
    { icon: CreditCard, label: "Gasto Mensal", value: `R$ ${(monthlySpend / 100).toLocaleString("pt-BR")}`, trend: "Fatura atual" },
    { icon: CheckCircle, label: "Taxa de Sucesso", value: "98.5%", trend: "+0.5%" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Meu Painel</h1>
          <p className="text-muted-foreground">Gerencie seus funcionários digitais</p>
        </div>
        <Link to="/create-agent">
          <Button className="glow group">
            <Plus className="h-4 w-4 mr-2" /> 
            Novo Agente
            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
            <div className="glass-card rounded-2xl p-5 glass-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-primary font-medium">{s.trend}</span>
              </div>
              <p className="font-display text-2xl font-bold mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
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
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-semibold">Meus Agentes</h2>
              </div>
              <Link to="/agents">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  Ver todos <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="p-4">
              {loadingAgents ? (
                <div className="py-8 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">Crie seu primeiro agente</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Explore a biblioteca e ative um funcionário digital
                  </p>
                  <Link to="/library">
                    <Button className="glow">
                      Explorar Templates
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.slice(0, 5).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className={`text-[10px] ${tierColors[agent.tier]}`}>
                              {tierLabels[agent.tier]}
                            </Badge>
                            <Badge variant="secondary" className={`text-[10px] ${statusColors[agent.status]}`}>
                              {statusLabels[agent.status]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}
                          <span className="text-muted-foreground text-xs">/mês</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.total_executions} exec
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="glass-card rounded-2xl overflow-hidden h-full">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-display font-semibold">Atividade Recente</h2>
              </div>
            </div>
            <div className="p-4">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma atividade ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 w-12">
                        {new Date(log.created_at).toLocaleTimeString("pt-BR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{log.agent?.name || "Agente"}</p>
                        <p className={`text-xs truncate ${log.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                          {log.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDashboard;
