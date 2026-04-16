import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Plus, Activity, Zap, Settings, Sparkles, Play, Pause, Trash2, MessageSquare, ArrowRight
} from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getAgentTarget } from "@/lib/agent-navigation";

const AgentsPage = () => {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const statusLabels: Record<string, string> = {
    draft: t("agents.draft", { defaultValue: "Rascunho" }),
    active: t("agents.active", { defaultValue: "Ativo" }),
    paused: t("agents.paused", { defaultValue: "Pausado" }),
    archived: t("agents.archived", { defaultValue: "Arquivado" }),
  };

  const statusColor: Record<string, string> = {
    active: "bg-primary/20 text-primary",
    draft: "bg-muted text-muted-foreground",
    paused: "bg-muted text-muted-foreground/80",
    archived: "bg-destructive/20 text-destructive",
  };

  const tierLabels: Record<string, string> = {
    basic: "Starter",
    intermediate: t("agents.intermediate", { defaultValue: "Intermediário" }),
    advanced: t("agents.advanced", { defaultValue: "Avançado" }),
    enterprise: "Enterprise",
  };

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["my-agents", user?.id, isAdmin],
    queryFn: async () => {
      // Admin gets all agents from WORKFORCE as virtual list
      if (isAdmin) {
        const { WORKFORCE: WF } = await import("@/data/workforceArchitecture");
        const allAgents: any[] = [];
        WF.forEach((dept) => {
          dept.squads.forEach((squad) => {
            squad.agents.forEach((agent) => {
              allAgents.push({
                id: `admin-${agent.slug}`,
                slug: agent.slug,
                name: agent.name,
                description: agent.responsibilities?.join(", ") || null,
                tier: "advanced",
                status: "active",
                total_executions: 0,
                monthly_price: 0,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                user_id: user!.id,
              });
            });
          });
        });
        return allAgents;
      }

      // Regular users: own agents + subscribed agents
      const [ownResult, subResult] = await Promise.all([
        supabase.from("agents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*, agent:agents(*)").eq("user_id", user!.id).eq("status", "active"),
      ]);

      const ownAgents = ownResult.data || [];
      const ownIds = new Set(ownAgents.map((a: any) => a.id));

      const subscribedAgents = (subResult.data || [])
        .filter((s: any) => s.agent && !ownIds.has(s.agent.id))
        .map((s: any) => s.agent);

      return [...ownAgents, ...subscribedAgents];
    },
    enabled: !!user,
  });

  const toggleStatus = async (agent: any) => {
    const newStatus = agent.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("agents").update({ status: newStatus as any }).eq("id", agent.id);
    if (error) { toast.error(t("agents.status_error", { defaultValue: "Erro ao atualizar status." })); return; }
    toast.success(`${agent.name} ${newStatus === "active" ? t("agents.activated", { defaultValue: "ativado" }) : t("agents.was_paused", { defaultValue: "pausado" })}!`);
    queryClient.invalidateQueries({ queryKey: ["my-agents"] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
            {t("agents.my_agents", { defaultValue: "Meus Agentes" })}
            <HelpTooltip id="agents-intro" text={t("agents.help_tooltip", { defaultValue: "Aqui ficam seus agentes contratados. Veja o status, tier e total de execuções de cada um." })} position="bottom" size={16} />
          </h1>
          <p className="text-muted-foreground">{t("agents.subtitle", { defaultValue: "Gerencie seus funcionários de IA" })}</p>
        </div>
        <Link to="/create-agent">
          <Button className="neon-glow">
            <Plus className="h-4 w-4 mr-2" /> {t("agents.new_agent", { defaultValue: "Novo Agente" })}
          </Button>
        </Link>
      </motion.div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading", { defaultValue: "Carregando..." })}</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">{t("agents.no_agents", { defaultValue: "Nenhum agente ainda" })}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t("agents.explore_cta", { defaultValue: "Explore a biblioteca e contrate seu primeiro funcionário de IA" })}
          </p>
          <Link to="/library">
            <Button className="glow">{t("agents.explore_library", { defaultValue: "Explorar Biblioteca" })}</Button>
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
                      {new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(a.monthly_price / 100)}/{t("agents.month", { defaultValue: "mês" })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => navigate(getAgentTarget(a.slug || nameToSlugFallback(a.name), { isAdmin, user }))}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" /> {t("agents.open_workspace", { defaultValue: "Abrir Workspace" })}
                    </Button>
                    {!isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs ${a.status === "active" ? "border-primary/30 text-primary" : ""}`}
                        onClick={() => toggleStatus(a)}
                      >
                        {a.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    )}
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
