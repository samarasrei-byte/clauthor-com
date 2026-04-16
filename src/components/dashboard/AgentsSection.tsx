import { motion } from "framer-motion";
import { Bot, Plus, Sparkles, Play, Pause, Zap, Eye, Handshake, Rocket, MessageSquare, Clock, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import AgentSetupChecklist from "./AgentSetupChecklist";
import AutonomyStatusBar, { type AutonomyLevel } from "./AutonomyStatusBar";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { useAgentActivity, estimateROI } from "@/hooks/useAgentActivity";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AgentsSectionProps {
  agents: any[];
  isLoading: boolean;
  nameToSlug: Record<string, string>;
  tierColors: Record<string, string>;
  formatCurrency: (value: number) => string;
  onOpenLibrary: () => void;
  onOpenThor: () => void;
  onOpenChat: (agent: { id: string; name: string }) => void;
}

// Map agent statuses to autonomy levels stored in knowledge_base
function getAutonomyLevel(agent: any): AutonomyLevel {
  const kb = agent.knowledge_base;
  if (Array.isArray(kb)) {
    const meta = kb.find((k: any) => k.autonomy_level);
    if (meta) return meta.autonomy_level as AutonomyLevel;
  }
  if (typeof kb === "object" && kb?.autonomy_level) return kb.autonomy_level as AutonomyLevel;
  return "assistant";
}

const AUTONOMY_ICONS: Record<AutonomyLevel, any> = {
  observer: Eye,
  assistant: Handshake,
  executor: Zap,
  autonomous: Rocket,
};

const AUTONOMY_COLORS: Record<AutonomyLevel, string> = {
  observer: "text-muted-foreground",
  assistant: "text-primary",
  executor: "text-accent-foreground",
  autonomous: "text-primary",
};

function AgentActivityMetricsInline({ agentId, agentName, onOpenChat, isActive }: { agentId: string; agentName: string; onOpenChat: () => void; isActive: boolean }) {
  const { data: metrics } = useAgentActivity(agentId);
  const { t } = useTranslation();
  const hasActivity = metrics && metrics.monthCount > 0;
  const roi = hasActivity ? estimateROI(agentName, metrics.monthCount) : 0;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (!hasActivity) {
    return (
      <div className="bg-muted/[0.04] rounded-lg px-3 py-2.5 border border-dashed border-muted/20">
        <p className="text-[11px] text-muted-foreground">
          {t("agents.no_activity", { defaultValue: "Seu agente ainda não começou a trabalhar." })}
        </p>
        {isActive && (
          <button onClick={onOpenChat} className="text-[11px] text-primary hover:underline mt-1 inline-flex items-center gap-1">
            {t("agents.first_command", { defaultValue: "Dê o primeiro comando →" })}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
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
          {metrics.lastAction.action_description.slice(0, 50)}
          {metrics.lastAction.action_description.length > 50 ? "…" : ""} · {timeAgo(metrics.lastAction.created_at)}
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
              <p className="text-xs">{t("agents.roi_tooltip", { defaultValue: "Estimativa baseada no valor médio de cada tarefa automatizada pelo agente neste mês." })}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

const AgentsSection = ({
  agents, isLoading, nameToSlug, tierColors, formatCurrency,
  onOpenLibrary, onOpenThor, onOpenChat,
}: AgentsSectionProps) => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // Fetch last activity per agent from execution_logs
  const { data: lastActivity = {} } = useQuery({
    queryKey: ["agent-last-activity", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("agent_id, created_at, action")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      
      const result: Record<string, { date: string; action: string }> = {};
      for (const log of data || []) {
        if (log.agent_id && !result[log.agent_id]) {
          result[log.agent_id] = { date: log.created_at, action: log.action };
        }
      }
      return result;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{t("dashboard.agents_tab")} ({agents.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenLibrary} className="gap-1.5">
            <Sparkles className="h-4 w-4" /> {t("dashboard.library", { defaultValue: "Biblioteca" })}
          </Button>
          <Link to="/create-agent">
            <Button className="glow gap-1.5">
              <Plus className="h-4 w-4" /> {t("dashboard.new_agent", { defaultValue: "Novo Agente" })}
            </Button>
          </Link>
        </div>
      </div>

      {agents.length > 0 && !isAdmin && (
        <AgentSetupChecklist agents={agents} nameToSlug={nameToSlug} onOpenThor={onOpenThor} />
      )}

      {agents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">{t("dashboard.no_agent_created")}</h3>
          <p className="text-muted-foreground text-sm mb-6">{t("dashboard.start_creating")}</p>
          <Button className="glow" onClick={onOpenLibrary}>{t("dashboard.explore_library")}</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {agents.map((agent, i) => {
            const autonomyLevel = getAutonomyLevel(agent);
            const AutonomyIcon = AUTONOMY_ICONS[autonomyLevel];
            const autonomyColor = AUTONOMY_COLORS[autonomyLevel];
            const isExpanded = expandedAgent === agent.id;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 glass-hover flex flex-col gap-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => {
                      if (agent.status === "active") onOpenChat({ id: agent.id, name: agent.name });
                    }}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      {agent.status === "active" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold truncate">{agent.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className={cn("text-[9px]", tierColors[agent.tier] || "")}>
                          {agent.tier}
                        </Badge>
                        <div className={cn(
                          "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border",
                          "text-primary bg-primary/10 border-primary/20"
                        )}>
                          <AutonomyIcon className={cn("h-3 w-3", autonomyColor)} />
                          {autonomyLevel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-7 text-[10px] gap-1 shrink-0",
                      agent.status === "active"
                        ? "border-primary/30 text-primary"
                        : "border-muted"
                    )}
                    onClick={async () => {
                      const newStatus = agent.status === "active" ? "paused" : "active";
                      const { error } = await supabase
                        .from("agents")
                        .update({ status: newStatus as any })
                        .eq("id", agent.id);
                      if (error) {
                        toast.error(t("dashboard.status_error", { defaultValue: "Erro ao atualizar status." }));
                        return;
                      }
                      toast.success(`${agent.name} ${newStatus === "active" ? t("dashboard.activated", { defaultValue: "activated" }) : t("dashboard.paused", { defaultValue: "paused" })}!`);
                      queryClient.invalidateQueries({ queryKey: ["my-agents"] });
                    }}
                  >
                     {agent.status === "active"
                      ? <><Pause className="h-3 w-3" /> {t("dashboard.pause_action", { defaultValue: "Pausar" })}</>
                      : <><Play className="h-3 w-3" /> {t("dashboard.activate_action", { defaultValue: "Ativar" })}</>}
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/[0.04] rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.price")}</p>
                    <p className="font-display font-bold text-sm">{formatCurrency(agent.monthly_price)}</p>
                  </div>
                  <div className="bg-muted/[0.04] rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.executions")}</p>
                    <p className="font-display font-bold text-sm">{agent.total_executions}</p>
                  </div>
                  <div className="bg-muted/[0.04] rounded-lg p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn(
                      "font-bold text-sm",
                      agent.status === "active" ? "text-primary" : "text-muted-foreground"
                    )}>
                      {agent.status === "active"
                        ? `● ${t("dashboard.active_status", { defaultValue: "Active" })}`
                        : `○ ${t("dashboard.paused_status", { defaultValue: "Paused" })}`}
                    </p>
                  </div>
                </div>

                {/* Activity Metrics from agent_activity_log */}
                <AgentActivityMetricsInline agentId={agent.id} agentName={agent.name} onOpenChat={() => onOpenChat({ id: agent.id, name: agent.name })} isActive={agent.status === "active"} />
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs h-8"
                    onClick={() => agent.status === "active" && onOpenChat({ id: agent.id, name: agent.name })}
                    disabled={agent.status !== "active"}
                  >
                     <MessageSquare className="h-3.5 w-3.5" />
                    {t("dashboard.chat_action", { defaultValue: "Conversar" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                   >
                    {t("dashboard.autonomy", { defaultValue: "Autonomia" })}
                  </Button>
                </div>

                {/* Expanded autonomy panel */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border/10 pt-4 space-y-4"
                  >
                    <AutonomyStatusBar
                      agentName={agent.name}
                      level={autonomyLevel}
                      readonly
                    />
                    <AgentActivityFeed agentId={agent.id} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentsSection;
