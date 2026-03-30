import { motion } from "framer-motion";
import { Bot, Plus, ArrowRight, Sparkles, MessageSquare, TrendingUp, Clock, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAgentActivity, estimateROI } from "@/hooks/useAgentActivity";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const tierColors: Record<string, string> = {
  basic: "bg-emerald-500/15 text-emerald-400",
  intermediate: "bg-cyan-500/15 text-cyan-400",
  advanced: "bg-emerald-500/15 text-emerald-400",
  enterprise: "bg-primary/15 text-primary",
};

function AgentCardMetrics({ agent, onSelectAgent }: { agent: Agent; onSelectAgent?: (id: string, name: string) => void }) {
  const { data: metrics } = useAgentActivity(agent.id);
  const { t } = useTranslation();

  const hasActivity = metrics && metrics.monthCount > 0;
  const roi = hasActivity ? estimateROI(agent.name, metrics.monthCount) : 0;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("common.just_now", { defaultValue: "agora" });
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (!hasActivity) {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-muted/5 border border-dashed border-muted/20">
        <p className="text-[11px] text-muted-foreground">
          {t("agents.no_activity", { defaultValue: "Seu agente ainda não começou a trabalhar." })}
        </p>
        {agent.status === "active" && onSelectAgent && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectAgent(agent.id, agent.name); }}
            className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            {t("agents.first_command", { defaultValue: "Dê o primeiro comando →" })}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Zap className="w-3 h-3 text-primary" />
          {t("agents.today", { defaultValue: "Hoje" })}: <span className="text-foreground font-medium">{metrics.todayCount}</span>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          {t("agents.week", { defaultValue: "Semana" })}: <span className="text-foreground font-medium">{metrics.weekCount}</span>
        </span>
      </div>
      {metrics.lastAction && (
        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {metrics.lastAction.action_description.slice(0, 40)}
          {metrics.lastAction.action_description.length > 40 ? "…" : ""}
          {" · "}
          {timeAgo(metrics.lastAction.created_at)}
        </p>
      )}
      {roi > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 cursor-help">
                💰 {t("agents.estimated_savings", { defaultValue: "Economia estimada" })}: R$ {roi.toLocaleString("pt-BR")}
                <Info className="w-3 h-3 text-muted-foreground" />
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">
                {t("agents.roi_tooltip", { defaultValue: "Estimativa baseada no valor médio de cada tarefa automatizada pelo agente neste mês." })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

const AgentsList = ({ agents, isLoading, onSelectAgent }: AgentsListProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const tierLabels: Record<string, string> = {
    basic: "Starter",
    intermediate: t("agents.intermediate", { defaultValue: "Intermediário" }),
    advanced: t("agents.advanced", { defaultValue: "Avançado" }),
    enterprise: "Enterprise",
  };

  const statusLabels: Record<string, string> = {
    draft: t("agents.draft", { defaultValue: "Rascunho" }),
    active: t("agents.active", { defaultValue: "Ativo" }),
    paused: t("agents.paused", { defaultValue: "Pausado" }),
    archived: t("agents.archived", { defaultValue: "Arquivado" }),
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-emerald-500/20 text-emerald-500",
    paused: "bg-yellow-500/20 text-yellow-400",
    archived: "bg-destructive/20 text-destructive",
  };

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
          <h2 className="font-display font-semibold">{t("agents.my_agents", { defaultValue: "Meus Agentes" })}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/agents">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              {t("agents.view_all", { defaultValue: "Ver todos" })} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link to="/create-agent">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              {t("agents.new_short", { defaultValue: "Novo" })}
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("common.loading", { defaultValue: "Carregando..." })}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display font-semibold mb-2">{t("agents.create_first", { defaultValue: "Crie seu primeiro agente" })}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t("agents.explore_activate", { defaultValue: "Explore a biblioteca e ative um funcionário de IA" })}
            </p>
            <Link to="/library">
              <Button className="glow">
                {t("agents.explore_templates", { defaultValue: "Explorar Templates" })}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.slice(0, 5).map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center justify-between">
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
                        {new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(agent.monthly_price / 100)}
                        <span className="text-muted-foreground text-xs">/{t("dashboard.month_short", { defaultValue: "mês" })}</span>
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
                <AgentCardMetrics agent={agent} onSelectAgent={onSelectAgent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentsList;
