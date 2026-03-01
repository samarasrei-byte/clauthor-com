import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ChevronRight, Shield, Database, Link2, Sparkles, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SLUG_TO_DEPT } from "@/data/departmentMap";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Department → required integrations mapping
const DEPT_INTEGRATIONS: Record<string, string[]> = {
  prospeccao: ["email", "linkedin"],
  marketing: ["meta_ads", "google", "instagram"],
  comercial: ["hubspot", "whatsapp", "email"],
  suporte: ["whatsapp", "email"],
  financeiro: [],
  rh: ["linkedin", "email"],
  criacao: [],
  juridico: [],
  tecnologia: ["slack", "email"],
  comunicacao: ["instagram", "meta_ads", "email"],
  ecommerce_growth: ["whatsapp", "meta_ads"],
  operacoes: [],
  compras: ["email"],
  logistica: ["email"],
  qualidade: [],
};

const INTEGRATION_LABELS: Record<string, string> = {
  email: "E-mail (SMTP/SendGrid)",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp Business",
  meta_ads: "Meta Ads",
  google: "Google Ads/Analytics",
  instagram: "Instagram Business",
  hubspot: "HubSpot CRM",
  apollo: "Apollo.io",
  slack: "Slack",
};

interface AgentSetupChecklistProps {
  agents: any[];
  nameToSlug: Record<string, string>;
  onOpenThor: () => void;
}

const AgentSetupChecklist = ({ agents, nameToSlug, onOpenThor }: AgentSetupChecklistProps) => {
  const { user } = useAuth();

  // Fetch all credentials for the user's agents
  const { data: credentials = [] } = useQuery({
    queryKey: ["agent-credentials-checklist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_credentials")
        .select("agent_id, integration_name, credential_key")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Fetch board items count
  const { data: boardCount = 0 } = useQuery({
    queryKey: ["board-count-checklist", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_board")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Build per-agent checklist data
  const agentChecklists = useMemo(() => {
    return agents.map(agent => {
      const slug = nameToSlug[agent.name];
      const deptId = slug ? SLUG_TO_DEPT[slug] : null;
      const requiredIntegrations = deptId ? (DEPT_INTEGRATIONS[deptId] || []) : [];

      // Check which integrations are configured
      const agentCreds = credentials.filter(c => c.agent_id === agent.id);
      const configuredIntegrations = [...new Set(agentCreds.map(c => c.integration_name))];

      const checks = [
        {
          id: "active",
          label: "Agente ativado",
          done: agent.status === "active",
          icon: Bot,
        },
        {
          id: "board",
          label: "Board da Empresa preenchido",
          done: boardCount >= 3,
          icon: Database,
        },
        ...requiredIntegrations.map(int => ({
          id: `int-${int}`,
          label: INTEGRATION_LABELS[int] || int,
          done: configuredIntegrations.includes(int),
          icon: Link2,
        })),
      ];

      const doneCount = checks.filter(c => c.done).length;
      const totalCount = checks.length;
      const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;
      const isComplete = pct === 100;
      const isPureAI = requiredIntegrations.length === 0;

      return { agent, slug, deptId, checks, doneCount, totalCount, pct, isComplete, isPureAI };
    });
  }, [agents, nameToSlug, credentials, boardCount]);

  // Filter to only show agents with incomplete setup (or all if <= 4 agents)
  const visibleChecklists = agents.length <= 4
    ? agentChecklists
    : agentChecklists.filter(c => !c.isComplete).slice(0, 6);

  if (agents.length === 0) return null;

  const overallPct = agentChecklists.length > 0
    ? Math.round(agentChecklists.reduce((s, c) => s + c.pct, 0) / agentChecklists.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Setup dos Agentes</h3>
            <p className="text-[11px] text-muted-foreground">
              {overallPct === 100
                ? "✅ Todos os agentes configurados!"
                : `${overallPct}% completo — ${agentChecklists.filter(c => !c.isComplete).length} agente(s) pendente(s)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-primary">{overallPct}%</span>
          <Progress value={overallPct} className="w-20 h-2" />
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {visibleChecklists.map(({ agent, checks, pct, isComplete, isPureAI }, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
              isComplete
                ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                : "border-border/20 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                <span className="font-display font-semibold text-xs truncate max-w-[140px]">{agent.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isPureAI && (
                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Puro IA
                  </Badge>
                )}
                <span className={`text-[10px] font-mono font-bold ${isComplete ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {pct}%
                </span>
              </div>
            </div>

            <Progress value={pct} className="h-1.5" />

            <div className="space-y-1">
              {checks.map(check => (
                <div key={check.id} className="flex items-center gap-2 text-[11px]">
                  {check.done ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={check.done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            {!isComplete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-[10px] text-primary hover:text-primary hover:bg-primary/5 gap-1"
                onClick={onOpenThor}
              >
                Configurar com THOR <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Show more if some are hidden */}
      {agentChecklists.filter(c => !c.isComplete).length > visibleChecklists.length && (
        <p className="text-[10px] text-muted-foreground text-center">
          +{agentChecklists.filter(c => !c.isComplete).length - visibleChecklists.length} agentes pendentes
        </p>
      )}
    </motion.div>
  );
};

export default AgentSetupChecklist;
