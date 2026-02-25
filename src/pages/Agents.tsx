import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Plus, MoreHorizontal, Activity, Zap, Settings, Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

const statusColor: Record<string, string> = {
  active: "bg-primary/20 text-primary",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-yellow-500/20 text-yellow-400",
  archived: "bg-destructive/20 text-destructive",
};

const tierLabels: Record<string, string> = {
  basic: "Starter",
  intermediate: "Intermediário",
  advanced: "Avançado",
  enterprise: "Enterprise",
};

const AgentsPage = () => {
  const { user } = useAuth();

  const { data: agents = [], isLoading } = useQuery({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Meus Agentes</h1>
          <p className="text-muted-foreground">Gerencie seus funcionários de IA</p>
        </div>
        <Link to="/create-agent">
          <Button className="neon-glow">
            <Plus className="h-4 w-4 mr-2" /> Novo Agente
          </Button>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">Nenhum agente ainda</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Explore a biblioteca e contrate seu primeiro funcionário de IA
          </p>
          <Link to="/library">
            <Button className="glow">Explorar Biblioteca</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass border-border hover:neon-border transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className={statusColor[a.status] || "bg-muted text-muted-foreground"}>
                      {statusLabels[a.status] || a.status}
                    </Badge>
                  </div>
                  <h3 className="font-display font-semibold mb-1">{a.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{tierLabels[a.tier] || a.tier}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {a.total_executions} exec.</span>
                    <span className="text-xs">
                      R$ {(a.monthly_price / 100).toLocaleString("pt-BR")}/mês
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Settings className="h-3 w-3 mr-1" /> Configurar
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
