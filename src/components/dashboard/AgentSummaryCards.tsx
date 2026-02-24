import { motion } from "framer-motion";
import { Bot, MessageSquare, Zap, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Agent {
  id: string;
  name: string;
  description?: string | null;
  tier: string;
  status: string;
  total_executions: number;
  updated_at: string;
}

interface AgentSummaryCardsProps {
  agents: Agent[];
  onChatWith?: (agentId: string) => void;
}

const tierColors: Record<string, string> = {
  basic: "bg-muted text-muted-foreground",
  starter: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  advanced: "bg-primary/10 text-primary border-primary/20",
  enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const AgentSummaryCards = ({ agents, onChatWith }: AgentSummaryCardsProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const activeAgents = agents.filter(a => a.status === "active");

  if (activeAgents.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {t("dashboard.your_agents", { defaultValue: "Seus Agentes" })}
        </span>
        <Badge variant="secondary" className="text-[10px]">{activeAgents.length}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 glass-hover group border border-white/[0.04]"
          >
            <div className="flex items-start justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 text-primary" />
              </div>
              <Badge className={`text-[9px] border ${tierColors[agent.tier] || tierColors.basic}`}>
                {agent.tier.toUpperCase()}
              </Badge>
            </div>

            <h4 className="text-sm font-semibold mb-1 truncate">{agent.name}</h4>
            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3 min-h-[28px]">
              {agent.description || t("dashboard.agent_no_desc", { defaultValue: "Agente especializado" })}
            </p>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {agent.total_executions} {t("dashboard.exec_short", { defaultValue: "exec." })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(agent.updated_at).toLocaleDateString(locale, { day: "2-digit", month: "short" })}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs gap-1.5 border-primary/15 text-primary hover:bg-primary/5"
              onClick={() => onChatWith?.(agent.id)}
            >
              <MessageSquare className="h-3 w-3" />
              {t("dashboard.chat_with", { defaultValue: "Conversar" })}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AgentSummaryCards;
