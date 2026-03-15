import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Search, Users, Bot, Eye,
  Loader2, Flame, Star, TrendingUp, Zap, ChevronRight,
  ChevronDown
} from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import ROICalculator from "@/components/library/ROICalculator";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import AgentLivePreview from "@/components/library/AgentLivePreview";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import AgentMiniChat from "@/components/library/AgentMiniChat";
import DepartmentMiniChat from "@/components/pricing/DepartmentMiniChat";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";
import { getPriceDisplay, getPrice, getRegion, formatPrice } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  agentKeys, featuredKeys, agentSlugs, agentIcons, agentTiers,
  agentPriceTiers, agentTags, agentIntegrations, agentSocialProof,
  agentCapabilities, tierColors, tiers
} from "@/data/libraryAgentData";
import { getSimplifiedAgentKeys } from "@/data/agentConsolidation";
import { getAgentName } from "@/data/agentLibraryBridge";
import { deptDetails } from "@/data/departmentData";
import { Skeleton } from "@/components/ui/skeleton";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [hiringSlug, setHiringSlug] = useState<string | null>(null);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [isFiltering, setIsFiltering] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryData | null>(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "pt";
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-rotate featured agent every 6s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatured((prev) => (prev + 1) % featuredKeys.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Reset visible count on filter/search change with brief skeleton
  useEffect(() => {
    setIsFiltering(true);
    setVisibleCount(INITIAL_VISIBLE);
    const t = setTimeout(() => setIsFiltering(false), 150);
    return () => clearTimeout(t);
  }, [filter, searchQuery]);

  const simplifiedKeys = useMemo(() => getSimplifiedAgentKeys(agentKeys), []);
  const filteredAgents = useMemo(() => simplifiedKeys.filter((k) => {
    if ((featuredKeys as readonly string[]).includes(k)) return false;
    if (filter !== "all" && agentTiers[k] !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = t(`library_page.agents.${k}_title`, { defaultValue: getAgentName(k) }).toLowerCase();
      const desc = t(`library_page.agents.${k}_desc`, { defaultValue: getAgentName(k) }).toLowerCase();
      const tags = agentTags[k].join(" ").toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !tags.includes(q)) return false;
    }
    return true;
  }), [filter, searchQuery, t]);

  const visibleAgents = filteredAgents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAgents.length;

  const handleHire = useCallback(async (key: string) => {
    const slug = agentSlugs[key];
    if (!user) {
      navigate("/auth", {
        state: {
          signup: true,
          hireIntent: {
            type: "agent" as const,
            label: t(`library_page.agents.${key}_title`),
            slugs: [slug],
          },
        },
      });
      return;
    }

    // Logged in → show checkout summary dialog instead of going directly to PayPal
    const agentName = t(`library_page.agents.${key}_title`);
    const priceTier = agentPriceTiers[key];
    const region = getRegion(lang);
    const price = getPrice(lang, priceTier);

    if (!price || price <= 0) {
      toast.error("Preço inválido para este agente.");
      return;
    }

    setCheckoutData({
      label: agentName,
      slugs: [slug],
      isDepartment: false,
      price,
      currency: region.currency,
      lang,
    });
  }, [user, navigate, t, lang]);

  const handleConfirmCheckout = useCallback(async () => {
    if (!checkoutData) return;
    const { label, slugs, price, currency } = checkoutData;
    const slug = slugs[0];
    const region = getRegion(lang);

    setHiringSlug(slug);

    try {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", {
        body: {
          action: "create_subscription",
          agent_slug: slug,
          agent_name: label,
          amount: price,
          currency,
          return_url: `${window.location.origin}/dashboard?subscription=success`,
          cancel_url: `${window.location.origin}/library?subscription=cancelled`,
        },
      });

      if (error) throw error;
      if (!data?.success || !data?.approve_url) {
        throw new Error(data?.error || "Falha ao criar assinatura PayPal");
      }

      // Find the key from slug
      const key = Object.entries(agentSlugs).find(([, s]) => s === slug)?.[0] || slug;

      sessionStorage.setItem("paypal_subscription", JSON.stringify({
        subscription_id: data.subscription_id,
        agent_slug: slug,
        agent_key: key,
        agent_name: label,
        price,
        currency,
        tier: agentTiers[key] || "basic",
        price_tier: agentPriceTiers[key] || "entry",
      }));

      window.location.href = data.approve_url;
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error(err.message || "Erro ao criar assinatura. Tente novamente.");
      setHiringSlug(null);
    }
  }, [checkoutData, lang]);

  const featuredAgent = featuredKeys[activeFeatured];
  const FeaturedIcon = agentIcons[featuredAgent];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* ============ AI CONCIERGE — Smart Agent Finder ============ */}
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
        onHire={(key) => handleHire(key)}
        onPreview={(key) => setPreviewAgent({
          name: t(`library_page.agents.${key}_title`),
          desc: t(`library_page.agents.${key}_desc`),
        })}
        hiringSlug={hiringSlug}
      />

      {/* ============ HERO SECTION — Featured Agents ============ */}
      <section className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-center justify-center mb-4">
            <Badge variant="outline" className="border-primary/20 text-primary/90 px-4 py-1.5 text-sm">
              <Flame className="h-3.5 w-3.5 mr-1.5" />
              {t("library_page.badge_count", { count: agentKeys.length })}
            </Badge>
          </div>

          {/* Featured agent — cinematic card */}
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={featuredAgent}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-3xl overflow-hidden"
                onMouseEnter={() => {
                  // Pause auto-rotate on hover handled by clearing interval isn't needed
                  // since we use a simple interval; hover pausing is a nice-to-have
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-primary-glow/10" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary-glow/8 rounded-full blur-[80px]" />
                <div className="absolute inset-0 scan-line pointer-events-none" />
                
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
                  {/* Left — Icon & Identity */}
                  <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-4">
                    <motion.div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center border border-primary/20 animate-pulse-glow">
                      <FeaturedIcon className="h-12 w-12 md:h-14 md:w-14 text-primary" />
                    </motion.div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="w-6 h-6 rounded-full bg-gradient-to-br from-muted to-card border-2 border-background" />
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{agentSocialProof[featuredAgent].companies}+ empresas</p>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="h-2.5 w-2.5 fill-primary text-primary" />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{agentSocialProof[featuredAgent].rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right — Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <Badge variant="outline" className={`${tierColors[agentTiers[featuredAgent]]} font-semibold`}>
                        {t(`tiers.${agentTiers[featuredAgent]}`)}
                      </Badge>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20">
                        {t(`library_page.agents.${featuredAgent}_highlight`)}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                      {t(`library_page.agents.${featuredAgent}_title`)}
                    </h2>
                    <p className="text-muted-foreground mb-5 leading-relaxed max-w-lg">
                      {t(`library_page.agents.${featuredAgent}_desc`)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
                      {agentCapabilities[featuredAgent].map((cap, capIdx) => (
                        <span key={cap} className="text-xs px-3 py-1.5 rounded-lg bg-card/80 border border-border text-foreground font-medium flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            capIdx % 3 === 0 ? 'bg-emerald-400' : capIdx % 3 === 1 ? 'bg-accent-blue' : 'bg-primary/70'
                          }`} />
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 mb-6 justify-center md:justify-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-400">{agentSocialProof[featuredAgent].savings}/mês</p>
                          <p className="text-[10px] text-muted-foreground">economia média</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{t(`library_page.agents.${featuredAgent}_replaces`)}</p>
                          <p className="text-[10px] text-muted-foreground">{t("library_page.replaces_label")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                      <div>
                        <p className="font-display text-3xl font-bold gradient-text">
                          {getPriceDisplay(lang, agentPriceTiers[featuredAgent])}
                        </p>
                        <span className="text-xs text-muted-foreground">{t("library.per_month")}</span>
                      </div>
                      <Button
                        className="rounded-xl h-12 font-semibold glass-btn-primary text-primary-foreground gap-2"
                        disabled={hiringSlug === agentSlugs[featuredAgent]}
                        onClick={() => handleHire(featuredAgent)}
                      >
                        {hiringSlug === agentSlugs[featuredAgent] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {t("library_page.hire_btn")}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Featured selector pills */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {featuredKeys.map((key, i) => {
                const Icon = agentIcons[key];
                const isActive = i === activeFeatured;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFeatured(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-primary/15 border border-primary/30 text-foreground neon-glow"
                        : "bg-card/50 border border-border text-muted-foreground hover:text-foreground hover:border-primary/15"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    <span className="text-xs font-medium hidden sm:inline">
                      {t(`library_page.agents.${key}_title`).split("—")[0].trim()}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FILTERS & SEARCH ============ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {tiers.map((tier) => (
              <Button
                key={tier}
                variant={filter === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(tier)}
                className={`rounded-xl text-xs ${
                  filter === tier ? "neon-glow" : "border-border hover:border-primary/20"
                }`}
              >
                {tier === "all" ? t("library_page.all") : t(`tiers.${tier}`)}
              </Button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-border h-10 rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* ============ AGENT GRID — Premium Marketplace Cards ============ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold tracking-tight">
            {filteredAgents.length} Agentes Disponíveis
          </h2>
          <div className="flex-1" />
          <Badge variant="outline" className="text-xs border-primary/20 text-primary/70">
            Contratação individual
          </Badge>
        </div>

        {isFiltering ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl ring-1 ring-border/50 p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleAgents.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-sm text-muted-foreground/50">Nenhum agente encontrado</p>
              </div>
            ) : visibleAgents.map((key, i) => {
              const tier = agentTiers[key];
              const Icon = agentIcons[key];
              const priceDisplay = getPriceDisplay(lang, agentPriceTiers[key]);
              const agentTitle = t(`library_page.agents.${key}_title`, { defaultValue: getAgentName(key) });
              const agentDesc = t(`library_page.agents.${key}_desc`, { defaultValue: `Agente especializado em ${getAgentName(key)}` });
              const social = agentSocialProof[key];
              const capabilities = agentCapabilities[key];
              const tags = agentTags[key] || [];
              const integrations = agentIntegrations[key] || [];
              const isHiring = hiringSlug === agentSlugs[key];

              const agentFaq = [
                { q: `O que o ${agentTitle.split("—")[0].trim()} faz?`, a: agentDesc },
              ];

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  layout
                >
                  <div className={`group relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:translate-y-[-2px] ${
                    tier === "enterprise" 
                      ? "ring-1 ring-primary/30 hover:ring-primary/50 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.15)] bg-gradient-to-br from-primary/[0.04] to-transparent" 
                      : "ring-1 ring-border/50 hover:ring-primary/25 bg-card/30 hover:bg-card/60"
                  }`}>
                    {tier === "enterprise" && (
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.06] rounded-full blur-[60px] pointer-events-none" />
                    )}

                    <div className="relative p-6 flex flex-col flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                          tier === "enterprise" 
                            ? "bg-primary/15 border border-primary/25 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]" 
                            : tier === "advanced"
                              ? "bg-cyan-500/10 border border-cyan-500/15"
                              : "bg-muted/50 border border-border group-hover:border-primary/20 group-hover:bg-primary/[0.05]"
                        }`}>
                          <Icon className={`h-6 w-6 transition-colors duration-500 ${
                            tier === "enterprise" ? "text-primary" 
                            : tier === "advanced" ? "text-cyan-400"
                            : "text-muted-foreground group-hover:text-primary/70"
                          }`} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base leading-tight mb-1">{agentTitle}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 ${tierColors[tier]}`}>
                              {t(`tiers.${tier}`)}
                            </Badge>
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-primary/50 text-primary/50" />
                              <span className="text-[11px] text-muted-foreground/60 font-medium">{social.rating}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground/40">{social.companies}+ empresas</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[13px] text-muted-foreground/70 leading-relaxed mb-4">{agentDesc}</p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {capabilities.map((cap, capIdx) => (
                          <span key={cap} className="text-[10px] px-2.5 py-1 rounded-md bg-muted/20 ring-1 ring-border/30 text-foreground/70 font-medium flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              capIdx % 3 === 0 ? 'bg-emerald-400' : capIdx % 3 === 1 ? 'bg-accent-blue' : 'bg-primary/70'
                            }`} />
                            {cap}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wider font-medium shrink-0">Integra:</span>
                        <div className="flex flex-wrap gap-1">
                          {integrations.slice(0, 4).map((intg) => (
                            <span key={intg} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/50">
                              {intg}
                            </span>
                          ))}
                          {integrations.length > 4 && (
                            <span className="text-[9px] text-muted-foreground/30">+{integrations.length - 4}</span>
                          )}
                        </div>
                      </div>

                      <AgentMiniChat agentKey={key} agentName={agentTitle} />

                      <details className="mt-3 group/faq rounded-lg ring-1 ring-border/20 overflow-hidden">
                        <summary className="px-3 py-2 text-[11px] font-medium cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between list-none">
                          <span>{agentFaq[0].q}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-open/faq:rotate-90" />
                        </summary>
                        <div className="px-3 pb-2.5 pt-0.5 text-[11px] text-muted-foreground/60 leading-relaxed">
                          {agentFaq[0].a}
                        </div>
                      </details>

                      <div className="flex-1" />

                      <div className="pt-4 mt-4">
                        <div className="h-px w-full bg-border/30 mb-4" />
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="font-bold text-xl tracking-tight">{priceDisplay}</p>
                              <span className="text-xs text-muted-foreground/40">{t("library.per_month")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400 font-medium">Economia de {social.savings}/mês</span>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Link to={`/agente/${agentSlugs[key]}`} className="flex-1 sm:flex-initial">
                              <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto px-4 rounded-xl border-border/50 hover:border-primary/30 text-xs gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                Detalhes
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              className="h-10 flex-1 sm:flex-initial px-5 rounded-xl text-xs font-bold uppercase tracking-wider gap-1.5"
                              disabled={isHiring}
                              onClick={() => handleHire(key)}
                            >
                              {isHiring ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="h-3.5 w-3.5" />
                                  {priceDisplay}/{t("library.per_month")}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isFiltering && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
              className="rounded-xl gap-2 border-primary/20 hover:border-primary/40"
            >
              <ChevronDown className="h-4 w-4" />
              Mostrar mais ({filteredAgents.length - visibleCount} restantes)
            </Button>
          </div>
        )}
      </section>

      {/* ============ VISUAL SEPARATOR ============ */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-6 text-[10px] tracking-[0.3em] uppercase text-primary/50 font-semibold flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Times de IA · Departamentos
            <Users className="h-3.5 w-3.5" />
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

      {/* ============ DEPARTMENTS — Rich Experience Cards ============ */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-bold tracking-tight">
            Times de IA · Departamentos
          </h2>
          <div className="flex-1 h-px bg-border/30" />
          <Badge variant="outline" className="text-xs border-primary/20 text-primary/70">
            4 agentes orquestrados cada
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(["comercial", "tecnologia", "marketing", "suporte", "financeiro", "criacao", "rh"] as const).map((deptId, i) => {
            const regionData = getRegion(lang);
            const deptPrice = (regionData.departments as Record<string, number>)[deptId] ?? 0;
            const deptClt = (regionData.departmentClt as Record<string, number>)[deptId] ?? 0;
            const savingsPercent = deptClt > 0 ? Math.round((1 - deptPrice / deptClt) * 100) : 0;
            const deptName = t(`squads.dept_${deptId}`);
            const deptDesc = t(`squads.dept_${deptId}_desc`);

            const dept = deptDetails[deptId];
            if (!dept) return null;
            const DeptIcon = dept.icon;

            return (
              <motion.div
                key={deptId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="group relative h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-border/50 hover:ring-primary/30 bg-card/30 hover:bg-card/60 transition-all duration-500 hover:translate-y-[-2px]">
                  <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

                  <div className="relative p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]">
                        <DeptIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight mb-1">{deptName}</h3>
                        <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{deptDesc}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">
                        -{savingsPercent}% vs CLT
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-2 block">Agentes do time</span>
                      <div className="grid grid-cols-2 gap-2">
                        {dept.agents.map((agent, j) => (
                          <div key={agent} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/20 ring-1 ring-border/30">
                            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Bot className="h-3 w-3 text-primary/60" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium block leading-tight truncate">{agent}</span>
                              <span className="text-[9px] text-muted-foreground/40">Substitui: {dept.replaces[j]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DepartmentMiniChat departmentId={deptId} autoPlay compact />

                    <div className="mt-4 space-y-1">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-1.5 block">Dúvidas frequentes</span>
                      {dept.faq.map((item, idx) => (
                        <details key={idx} className="group/faq rounded-lg ring-1 ring-border/20 overflow-hidden">
                          <summary className="px-3 py-2 text-[11px] font-medium cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between list-none">
                            <span>{item.q}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-open/faq:rotate-90" />
                          </summary>
                          <div className="px-3 pb-2.5 pt-0.5 text-[11px] text-muted-foreground/60 leading-relaxed">
                            {item.a}
                          </div>
                        </details>
                      ))}
                    </div>

                    <div className="flex-1" />

                    <div className="pt-4 mt-4">
                      <div className="h-px w-full bg-border/30 mb-4" />
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <p className="font-bold text-xl tracking-tight">{formatPrice(deptPrice, lang)}</p>
                            <span className="text-xs text-muted-foreground/40">/mês</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-medium">vs {formatPrice(deptClt, lang)}/mês CLT</span>
                          </div>
                        </div>
                        <Link to="/pricing">
                          <Button size="sm" className="h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-wider gap-1.5">
                            <Flame className="h-3.5 w-3.5" />
                            Contratar Time
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Agent Live Preview Modal */}
      <AgentLivePreview
        agentName={previewAgent?.name || ""}
        agentDesc={previewAgent?.desc || ""}
        isOpen={!!previewAgent}
        onClose={() => setPreviewAgent(null)}
      />

      {/* Checkout Summary Dialog for logged-in users */}
      <CheckoutSummaryDialog
        data={checkoutData}
        onConfirm={handleConfirmCheckout}
        onCancel={() => { setCheckoutData(null); setHiringSlug(null); }}
      />
    </div>
  );
};

export default LibraryPage;
