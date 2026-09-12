import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Zap, Play, Pause, ArrowRight, Sparkles, BrainCircuit, HeartHandshake, Users } from "lucide-react";
import { Wand } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getAgentTarget } from "@/lib/agent-navigation";

const CREATIVE_SQUADS = [
  {
    name: "Mentor de Comunidade IA",
    category: "Comunidade · Educação",
    agents: 5,
    description: "Um time criativo para transformar conhecimento em jornadas, encontros e conversas que mantêm sua comunidade em movimento.",
    image: "/assets/squad-mentor-ia.png",
    icon: BrainCircuit,
    capabilities: ["Jornadas de aprendizagem", "Rituais de comunidade", "Sinais de engajamento"],
  },
  {
    name: "Pulso de Cultura IA",
    category: "Pessoas · Cultura",
    agents: 4,
    description: "Um radar sensível para ouvir o time, organizar temas recorrentes e apoiar líderes com próximos passos de cuidado.",
    image: "/assets/squad-psicolog-ia.png",
    icon: HeartHandshake,
    capabilities: ["Escuta estruturada", "Radar de clima", "Rituais de bem-estar"],
  },
] as const;

const AgentsPage = () => {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const statusLabels: Record<string, string> = { draft: t("agents.draft", { defaultValue: "Rascunho" }), active: t("agents.active", { defaultValue: "Ativo" }), paused: t("agents.paused", { defaultValue: "Pausado" }), archived: t("agents.archived", { defaultValue: "Arquivado" }) };
  const statusColor: Record<string, string> = { active: "bg-primary/20 text-primary", draft: "bg-muted text-muted-foreground", paused: "bg-muted text-muted-foreground/80", archived: "bg-destructive/20 text-destructive" };
  const tierLabels: Record<string, string> = { basic: "Starter", intermediate: t("agents.intermediate", { defaultValue: "Intermediário" }), advanced: t("agents.advanced", { defaultValue: "Avançado" }), enterprise: "Enterprise" };

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["my-agents", user?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { WORKFORCE: WF } = await import("@/data/workforceArchitecture");
        const allAgents: any[] = [];
        const seen = new Set<string>();
        WF.forEach((dept: any) => dept.squads.forEach((squad: any) => squad.agents.forEach((agent: any) => {
          const id = `admin-${dept.slug ?? dept.id ?? dept.name}-${squad.slug ?? squad.id ?? squad.name}-${agent.slug}`;
          if (seen.has(id)) return;
          seen.add(id);
          allAgents.push({ id, slug: agent.slug, name: agent.name, description: agent.responsibilities?.join(", ") || null, tier: "advanced", status: "active", total_executions: 0, monthly_price: 0, updated_at: new Date().toISOString(), created_at: new Date().toISOString(), user_id: user!.id });
        })));
        return allAgents;
      }
      const [ownResult, subResult] = await Promise.all([
        supabase.from("agents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*, agent:agents(*)").eq("user_id", user!.id).eq("status", "active"),
      ]);
      const ownAgents = ownResult.data || [];
      const ownIds = new Set(ownAgents.map((agent: any) => agent.id));
      const subscribedAgents = (subResult.data || []).filter((subscription: any) => subscription.agent && !ownIds.has(subscription.agent.id)).map((subscription: any) => subscription.agent);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SEO title="My Agents · Workforce Dashboard | Clauthor" description="Manage your active AI agents: run, pause, configure, monitor executions and outcomes in real time." path="/agents" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">{t("agents.my_agents", { defaultValue: "Meus Agentes" })}<HelpTooltip id="agents-intro" text={t("agents.help_tooltip", { defaultValue: "Aqui ficam seus agentes contratados. Veja o status, tier e total de execuções de cada um." })} position="bottom" size={16} /></h1><p className="text-muted-foreground">{t("agents.subtitle", { defaultValue: "Gerencie seus funcionários de IA" })}</p></div>
        <Link to="/create-agent" data-onboarding="agent-new"><Button className="neon-glow"><Plus className="h-4 w-4 mr-2" /> {t("agents.new_agent", { defaultValue: "Novo Agente" })}</Button></Link>
      </motion.div>

      <section aria-labelledby="creative-squads-title" className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card/70 to-background p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5"><div><div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-[0.16em] mb-2"><Sparkles className="h-3.5 w-3.5" /> Novos blueprints</div><h2 id="creative-squads-title" className="font-display text-2xl font-bold">Dois squads para criar novas conexões</h2><p className="text-sm text-muted-foreground mt-1">Escolha um ponto de partida e personalize a estrutura no construtor.</p></div><Badge variant="outline" className="w-fit border-primary/30 text-primary">Em criação</Badge></div>
        <div className="grid gap-4 md:grid-cols-2">
          {CREATIVE_SQUADS.map((squad, index) => { const Icon = squad.icon; return <motion.article key={squad.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="overflow-hidden rounded-xl border border-border/60 bg-card/80"><div className="flex gap-4 p-4"><img src={squad.image} alt="" className="h-20 w-20 rounded-lg object-cover border border-primary/20" /><div className="min-w-0"><div className="flex items-center gap-2 text-xs text-primary"><Icon className="h-3.5 w-3.5" />{squad.category}</div><h3 className="font-display font-semibold text-lg mt-1">{squad.name}</h3><p className="text-sm text-muted-foreground mt-1">{squad.description}</p></div></div><div className="border-t border-border/50 px-4 py-3 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {squad.agents} agentes</span>{squad.capabilities.map((capability) => <Badge key={capability} variant="secondary" className="text-[10px] font-normal">{capability}</Badge>)}<Button size="sm" className="ml-auto text-xs" onClick={() => navigate("/create-agent", { state: { squad: squad.name } })}>Criar com este blueprint <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div></motion.article>; })}
        </div>
      </section>

      {isLoading ? <div className="py-12 text-center text-muted-foreground">{t("common.loading", { defaultValue: "Carregando..." })}</div> : agents.length === 0 ? <div className="text-center py-16"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Wand className="h-8 w-8 text-primary" /></div><h3 className="font-display font-semibold text-lg mb-2">{t("agents.no_agents", { defaultValue: "Nenhum agente ainda" })}</h3><p className="text-sm text-muted-foreground mb-6">{t("agents.explore_cta", { defaultValue: "Explore a biblioteca e contrate seu primeiro funcionário de IA" })}</p><Link to="/library"><Button className="glow">{t("agents.explore_library", { defaultValue: "Explorar Biblioteca" })}</Button></Link></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-onboarding="agent-list">{agents.map((agent, index) => <motion.div key={agent.id} data-onboarding="agent-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><Card className="glass border-border hover:neon-border transition-all"><CardContent className="p-5"><div className="flex items-start justify-between mb-4"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div><Badge variant="secondary" className={statusColor[agent.status] || "bg-muted text-muted-foreground"}>{statusLabels[agent.status] || agent.status}</Badge></div><h3 className="font-display font-semibold mb-1">{agent.name}</h3><p className="text-xs text-muted-foreground mb-4">{tierLabels[agent.tier] || agent.tier}</p><div className="flex items-center gap-4 text-xs text-muted-foreground mb-4"><span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {agent.total_executions} exec.</span><span>{new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(agent.monthly_price / 100)}/{t("agents.month", { defaultValue: "mês" })}</span></div><div className="flex gap-2"><Button size="sm" className="flex-1 text-xs" onClick={() => navigate(getAgentTarget(agent.slug || agent.name?.toLowerCase().replace(/\s+/g, "_") || "agent", { isAdmin, user }))}><ArrowRight className="h-3 w-3 mr-1" /> {t("agents.open_workspace", { defaultValue: "Abrir Workspace" })}</Button>{!isAdmin && <Button size="sm" variant="outline" className={`text-xs ${agent.status === "active" ? "border-primary/30 text-primary" : ""}`} onClick={() => toggleStatus(agent)}>{agent.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}</Button>}</div></CardContent></Card></motion.div>)}</div>}
    </div>
  );
};

export default AgentsPage;
