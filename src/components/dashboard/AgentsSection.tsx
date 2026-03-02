import { motion } from "framer-motion";
import { Bot, Plus, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import AgentSetupChecklist from "./AgentSetupChecklist";

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

const AgentsSection = ({
  agents, isLoading, nameToSlug, tierColors, formatCurrency,
  onOpenLibrary, onOpenThor, onOpenChat,
}: AgentsSectionProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

      {agents.length > 0 && (
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
          {agents.map((agent, i) => (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5 glass-hover">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => { if (agent.status === "active") onOpenChat({ id: agent.id, name: agent.name }); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold">{agent.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 text-[10px] gap-1 ${agent.status === "active" ? "border-emerald-500/30 text-emerald-500" : "border-muted"}`}
                  onClick={async () => {
                    const newStatus = agent.status === "active" ? "paused" : "active";
                    const { error } = await supabase.from("agents").update({ status: newStatus as any }).eq("id", agent.id);
                    if (error) { toast.error(t("dashboard.status_error", { defaultValue: "Erro ao atualizar status." })); return; }
                    toast.success(`${agent.name} ${newStatus === "active" ? t("dashboard.activated", { defaultValue: "ativado" }) : t("dashboard.paused", { defaultValue: "pausado" })}!`);
                    queryClient.invalidateQueries({ queryKey: ["my-agents"] });
                  }}
                >
                  {agent.status === "active" ? <><Pause className="h-3 w-3" /> {t("dashboard.pause", { defaultValue: "Pausar" })}</> : <><Play className="h-3 w-3" /> {t("dashboard.activate", { defaultValue: "Ativar" })}</>}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">{t("dashboard.price")}</p>
                  <p className="font-display font-bold text-sm">{formatCurrency(agent.monthly_price)}</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">{t("dashboard.executions")}</p>
                  <p className="font-display font-bold text-sm">{agent.total_executions}</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">{t("dashboard.status")}</p>
                  <p className={`font-bold text-sm ${agent.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {agent.status === "active" ? "●" : "○"} {agent.status}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsSection;
