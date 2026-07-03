import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Search, Users, Bot, Eye,
  Loader2, Flame, Star, TrendingUp, Zap, ChevronRight,
  ChevronDown, Layers, Building2, Shield
} from "lucide-react";
import ROICalculator from "@/components/library/ROICalculator";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import AgentLivePreview from "@/components/library/AgentLivePreview";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import PlatformStatsBanner from "@/components/PlatformStatsBanner";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";
import { getPriceDisplay, getPrice, getRegion, formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { createPayPalPlan, handleInlineApproval } from "@/lib/paypal-helpers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  agentKeys, agentSlugs, agentIcons, agentTiers,
  agentPriceTiers, agentTags, agentIntegrations, agentSocialProof,
  agentCapabilities, tierColors
} from "@/data/libraryAgentData";
import { getAgentName, getDefaultIcon } from "@/data/agentLibraryBridge";
import { WORKFORCE } from "@/data/workforceArchitecture";
import { CLAUTHOR_ORG_CHART, CLAUTHOR_AGENT_COUNT } from "@/data/clauthorOrgChart";
import { Skeleton } from "@/components/ui/skeleton";
import AgentCardExpanded from "@/components/library/AgentCardExpanded";
import { useTrialAgent } from "@/hooks/useTrialAgent";
import { useQuery } from "@tanstack/react-query";

// Department colors
const DEPT_COLORS: Record<string, { gradient: string; border: string; text: string; bg: string }> = {
  marketing: { gradient: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/30", text: "text-rose-400", bg: "bg-rose-500/10" },
  growth: { gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  product: { gradient: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/10" },
  sales: { gradient: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500/10" },
  customer_success: { gradient: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/10" },
  finance: { gradient: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/30", text: "text-cyan-400", bg: "bg-cyan-500/10" },
  operations: { gradient: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/30", text: "text-orange-400", bg: "bg-orange-500/10" },
  security: { gradient: "from-red-500/20 to-red-500/5", border: "border-red-500/30", text: "text-red-400", bg: "bg-red-500/10" },
  engineering: { gradient: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/30", text: "text-cyan-400", bg: "bg-cyan-500/10" },
  data_analytics: { gradient: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/30", text: "text-indigo-400", bg: "bg-indigo-500/10" },
  communications: { gradient: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/30", text: "text-pink-400", bg: "bg-pink-500/10" },
  talent: { gradient: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500/10" },
  innovation: { gradient: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500/10" },
  it_infrastructure: { gradient: "from-slate-500/20 to-slate-500/5", border: "border-slate-500/30", text: "text-slate-400", bg: "bg-slate-500/10" },
  strategy: { gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  legal: { gradient: "from-slate-500/20 to-slate-500/5", border: "border-slate-500/30", text: "text-slate-400", bg: "bg-slate-500/10" },
};

const DEFAULT_DEPT_COLOR = { gradient: "from-primary/20 to-primary/5", border: "border-primary/30", text: "text-primary", bg: "bg-primary/10" };

const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [hiringSlug, setHiringSlug] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryData | null>(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { startTrial, loading: trialLoading } = useTrialAgent();

  // One-shot trial eligibility check (cached). true = user has never used trial.
  const { data: trialEligible = false } = useQuery({
    queryKey: ["trial-eligibility", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .like("stripe_subscription_id", "TRIAL-%")
        .limit(1)
        .maybeSingle();
      return !data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  // Total agent count
  const totalAgents = useMemo(() => WORKFORCE.reduce((sum, dept) => 
    sum + dept.squads.reduce((s, sq) => s + sq.agents.length, 0), 0
  ), []);

  // Filter departments and agents by search
  const filteredWorkforce = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORKFORCE;

    return WORKFORCE.map(dept => ({
      ...dept,
      squads: dept.squads.map(sq => ({
        ...sq,
        agents: sq.agents.filter(a => 
          a.name.toLowerCase().includes(q) ||
          a.responsibilities.some(r => r.toLowerCase().includes(q)) ||
          sq.name.toLowerCase().includes(q) ||
          dept.name.toLowerCase().includes(q)
        )
      })).filter(sq => sq.agents.length > 0)
    })).filter(dept => dept.squads.length > 0);
  }, [searchQuery]);

  // Count visible agents
  const visibleAgentCount = useMemo(() => filteredWorkforce.reduce((sum, dept) => 
    sum + dept.squads.reduce((s, sq) => s + sq.agents.length, 0), 0
  ), [filteredWorkforce]);

  const handleHire = useCallback(async (slug: string, agentName: string) => {
    if (!user) {
      navigate("/auth", {
        state: {
          signup: true,
          hireIntent: { type: "agent" as const, label: agentName, slugs: [slug] },
        },
      });
      return;
    }

    // Admin bypass - direct access to agent workspace
    if (isAdmin) {
      navigate(`/app/agente/${slug}`);
      return;
    }

    // Paid checkout flow (fallback / after trial used)
    const priceTier = agentPriceTiers[slug] || "entry";
    const region = getRegion(lang);
    const price = getPrice(lang, priceTier);

    if (!price || price <= 0) {
      toast.error("Preço inválido para este agente.");
      return;
    }

    const checkoutInfo: CheckoutSummaryData = {
      label: agentName,
      slugs: [slug],
      isDepartment: false,
      price,
      currency: region.currency,
      lang,
    };
    setCheckoutData(checkoutInfo);

    // Create PayPal plan for inline checkout
    createPayPalPlan(slug, agentName, price, region.currency).then((planId) => {
      setCheckoutData((prev) => prev ? { ...prev, planId } : prev);
    });
  }, [user, navigate, lang, isAdmin]);

  const handleStartTrial = useCallback(async (slug: string, agentName: string) => {
    if (!user) {
      navigate("/auth", {
        state: {
          signup: true,
          hireIntent: { type: "agent" as const, label: agentName, slugs: [slug] },
        },
      });
      return;
    }
    const result = await startTrial(slug, agentName);
    if (result) {
      navigate(`/app/agente/${slug}`);
    }
  }, [user, navigate, startTrial]);

  const handleApproveCheckout = useCallback((subscriptionId: string) => {
    if (!checkoutData) return;
    const slug = checkoutData.slugs[0];
    handleInlineApproval(subscriptionId, checkoutData, {
      tier: agentTiers[slug] || "basic",
      price_tier: agentPriceTiers[slug] || "entry",
    });
  }, [checkoutData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <SEO title="Agent Library — 200+ AI Employees | Clauthor" description="Browse Clauthor's library of autonomous AI agents for sales, marketing, legal, finance, support and more." path="/library" />

      <PlatformStatsBanner />


      {/* ============ HERO ============ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <Badge variant="outline" className="border-primary/20 text-primary/90 px-4 py-1.5 text-sm">
            <Flame className="h-3.5 w-3.5 mr-1.5" />
            {CLAUTHOR_AGENT_COUNT} Agentes Autônomos · {CLAUTHOR_ORG_CHART.length} Departamentos · {CLAUTHOR_ORG_CHART.reduce((s, d) => s + d.squads.length, 0)} Squads
          </Badge>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Força de Trabalho <span className="gradient-text">Digital Completa</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada departamento possui squads especializados com agentes autônomos prontos para operar.
            Contrate individualmente ou monte seu time completo.
          </p>
        </div>
      </motion.section>

      {/* ============ AI CONCIERGE ============ */}
      <SmartAgentFinder
        agentMeta={Object.fromEntries(
          agentKeys.map((k) => [k, {
            icon: agentIcons[k],
            tier: agentTiers[k],
            socialProof: agentSocialProof[k],
            capabilities: agentCapabilities[k] || [],
            slug: agentSlugs[k],
          }])
        )}
        onHire={(key) => handleHire(key, t(`library_page.agents.${key}_title`, { defaultValue: getAgentName(key) }))}
        onPreview={(key) => setPreviewAgent({
          name: t(`library_page.agents.${key}_title`, { defaultValue: getAgentName(key) }),
          desc: t(`library_page.agents.${key}_desc`, { defaultValue: getAgentName(key) }),
        })}
        hiringSlug={hiringSlug}
      />

      {/* ============ SEARCH & DEPARTMENT NAV ============ */}
      <section className="space-y-4">
        <div className="relative w-full max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agentes, squads ou departamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 glass border-border h-12 rounded-2xl text-sm"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {visibleAgentCount} resultados
            </span>
          )}
        </div>

        {/* Department navigation chips */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setActiveDept(null)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              !activeDept
                ? "bg-primary/15 border border-primary/30 text-foreground"
                : "bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/15"
            }`}
          >
            Todos ({totalAgents})
          </button>
          {WORKFORCE.map(dept => {
            const agentCount = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);
            const colors = DEPT_COLORS[dept.id] || DEFAULT_DEPT_COLOR;
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDept(activeDept === dept.id ? null : dept.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                  activeDept === dept.id
                    ? `${colors.bg} ${colors.border} border text-foreground`
                    : "bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/15"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeDept === dept.id ? colors.text.replace('text-', 'bg-') : 'bg-muted-foreground/30'}`} />
                {dept.name}
                <span className="text-[10px] opacity-60">({agentCount})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============ DEPARTMENTS → SQUADS → AGENTS ============ */}
      {filteredWorkforce
        .filter(dept => !activeDept || dept.id === activeDept)
        .map((dept, deptIdx) => {
          const colors = DEPT_COLORS[dept.id] || DEFAULT_DEPT_COLOR;
          const agentCount = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);

          return (
            <motion.section
              key={dept.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: deptIdx * 0.05 }}
              className="space-y-6"
            >
              {/* Department Header */}
              <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${colors.gradient} p-6 md:p-8 border ${colors.border}`}>
                <div className="absolute top-0 right-0 w-60 h-60 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Building2 className={`h-7 w-7 ${colors.text}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight">{dept.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {dept.squads.length} squads · {agentCount} agentes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`${colors.border} ${colors.text} text-xs`}>
                      Departamento Completo
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Squads */}
              {dept.squads.map((squad, sqIdx) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: sqIdx * 0.03 }}
                  className="space-y-4"
                >
                  {/* Squad Header */}
                  <div className="flex items-center gap-3 pl-2">
                    <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Layers className={`h-4 w-4 ${colors.text}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm tracking-tight">{squad.name}</h3>
                      <p className="text-[11px] text-muted-foreground/60 truncate">{squad.mission}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground/50 shrink-0">
                      {squad.agents.length} agentes
                    </Badge>
                  </div>

                  {/* Agent Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                    {squad.agents.map((agent) => {
                      const Icon = agentIcons[agent.slug] || getDefaultIcon(agent.slug);
                      const tier = agentTiers[agent.slug] || "intermediate";
                      const priceTier = agentPriceTiers[agent.slug] || "entry";
                      const social = agentSocialProof[agent.slug] || { companies: 100, rating: 4.7, savings: "R$ 15k" };
                      const capabilities = agentCapabilities[agent.slug] || agent.responsibilities.slice(0, 3);
                      const isHiring = hiringSlug === agent.slug;

                      return (
                        <AgentCardExpanded
                          key={agent.slug}
                          slug={agent.slug}
                          name={agent.name}
                          icon={Icon}
                          tier={tier}
                          priceTier={priceTier}
                          capabilities={capabilities}
                          triggers={agent.triggers}
                          social={social}
                          colors={colors}
                          lang={lang}
                          isAdmin={isAdmin}
                          isHiring={isHiring}
                          onHire={() => handleHire(agent.slug, agent.name)}
                          onPreview={() => setPreviewAgent({ name: agent.name, desc: agent.responsibilities[0] || "" })}
                          onNavigate={() => navigate(`/agente/${agent.slug}`)}
                          tierColor={tierColors[tier] || ""}
                        />
                      );
                    })}
                  </div>

                  {/* Squad outcomes */}
                  <div className="flex flex-wrap gap-2 pl-2">
                    {squad.outcomes.map((outcome, oIdx) => (
                      <span key={oIdx} className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-500/5 ring-1 ring-emerald-500/15 text-emerald-400 font-medium flex items-center gap-1.5">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {outcome}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.section>
          );
        })}

      {/* No results */}
      {filteredWorkforce.length === 0 && (
        <div className="py-20 text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground/50">Nenhum agente encontrado para "{searchQuery}"</p>
        </div>
      )}

      {/* ============ SEPARATOR ============ */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-6 text-[10px] tracking-[0.3em] uppercase text-primary/50 font-semibold flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Ferramentas
            <Shield className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* ============ ROI Calculator ============ */}
      <ROICalculator />

      {/* ============ Squad Consultant ============ */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="glass-card rounded-2xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <SquadConsultant />
          </div>
        </div>
      </motion.div>

      {/* Agent Live Preview Modal */}
      <AgentLivePreview
        agentName={previewAgent?.name || ""}
        agentDesc={previewAgent?.desc || ""}
        isOpen={!!previewAgent}
        onClose={() => setPreviewAgent(null)}
      />

      {/* Checkout Summary Dialog */}
      <CheckoutSummaryDialog
        data={checkoutData}
        onApprove={handleApproveCheckout}
        onCancel={() => { setCheckoutData(null); setHiringSlug(null); }}
      />
    </div>
  );
};

export default LibraryPage;
