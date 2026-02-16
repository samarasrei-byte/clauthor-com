import { motion } from "framer-motion";
import { Bot, Plus, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  tier: string;
  status: string;
  monthly_price: number;
  total_executions: number;
}

interface AgentsListProps {
  agents: Agent[];
  isLoading: boolean;
  onSelectAgent?: (agentId: string, agentName: string) => void;
}

const tierLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  enterprise: "Enterprise",
};

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  intermediate: "bg-amber-500/15 text-amber-400",
  advanced: "bg-emerald-500/15 text-emerald-400",
  enterprise: "bg-primary/15 text-primary",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/20 text-emerald-500",
  paused: "bg-yellow-500/20 text-yellow-400",
  archived: "bg-destructive/20 text-destructive",
};

const AgentsList = ({ agents, isLoading, onSelectAgent }: AgentsListProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold">Meus Agentes</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/create-agent">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
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
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
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
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      R$ {(agent.monthly_price / 100).toLocaleString("pt-BR")}
                      <span className="text-muted-foreground text-xs">/mês</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {agent.total_executions} exec
                    </p>
                  </div>
                  {agent.status === "active" && onSelectAgent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onSelectAgent(agent.id, agent.name)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentsList;
