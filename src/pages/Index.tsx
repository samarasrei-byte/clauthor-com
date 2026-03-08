import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const SmartOnboarding = lazy(() => import("@/components/onboarding/SmartOnboarding"));
const SmartAgentFinder = lazy(() => import("@/components/library/SmartAgentFinder"));
const LiveDemoAgent = lazy(() => import("@/components/landing/LiveDemoAgent"));
const InnovationRoadmap = lazy(() => import("@/components/landing/InnovationRoadmap"));
const SplineShowcase = lazy(() => import("@/components/landing/SplineShowcase"));
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, Bolt,
  Code, UsersRound, TrendingUp,
  LockKeyhole, Workflow,
  Headphones, BotMessageSquare, PenTool, ShoppingCart, Megaphone, LineChart,
  Star, Receipt, Globe, Briefcase, DollarSign, MessageSquare,
  Activity, Terminal, ChevronRight, Cpu, Crosshair,
  Building2, Clock, Rocket, BarChart3, Fingerprint, Sparkles, Layers3, Signal,
  Linkedin, Twitter, Github
} from "lucide-react";
import { useRef, useMemo, useState, useCallback } from "react";
import HelpTooltip from "@/components/HelpTooltip";
import { useTranslation } from "react-i18next";
import clauthorLogo from "@/assets/clauthor-logo.png";
import helixaPhoto from "@/assets/helixa-ai.png";
import thorPhoto from "@/assets/kaelis-ai.png";

/* ═══════════════════════════════════════════════════════
   TYPEWRITER HOOK
   ═══════════════════════════════════════════════════════ */
const useCyclingTypewriter = (words: string[], speed = 50, pauseDuration = 2500, initialDelay = 600) => {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "typing" | "pausing" | "deleting">("waiting");
  const [firstCycleDone, setFirstCycleDone] = useState(false);

  useEffect(() => {
    const word = words[wordIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "waiting") {
      timer = setTimeout(() => setPhase("typing"), initialDelay);
    } else if (phase === "typing") {
      if (displayed.length < word.length) {
        timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), speed);
      } else {
        if (!firstCycleDone) setFirstCycleDone(true);
        timer = setTimeout(() => setPhase("deleting"), pauseDuration);
      }
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), speed / 2);
      } else {
        setWordIndex((prev) => (prev + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, phase, wordIndex, words, speed, pauseDuration, initialDelay, firstCycleDone]);

  return { displayed, currentWord: words[wordIndex], firstCycleDone };
};

/* ═══════════════════════════════════════════════════════
   MOUSE TRACKER
   ═══════════════════════════════════════════════════════ */
const MouseReactiveField = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden" onMouseMove={handleMouseMove}>
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          left: useTransform(smoothX, [0, 1], ["-10%", "70%"]),
          top: useTransform(smoothY, [0, 1], ["-10%", "60%"]),
          background: "radial-gradient(circle, hsl(0 85% 55% / 0.08) 0%, transparent 70%)",
        }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          left: useTransform(smoothX, [0, 1], ["60%", "20%"]),
          top: useTransform(smoothY, [0, 1], ["50%", "10%"]),
          background: "radial-gradient(circle, hsl(0 85% 55% / 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(0 85% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(0 85% 55% / 0.3) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER — counts up on view
   ═══════════════════════════════════════════════════════ */
const AnimatedStat = ({ value, suffix = "", prefix = "", label, icon: Icon }: {
  value: number; suffix?: string; prefix?: string; label: string; icon: React.ElementType;
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onViewportEnter={() => {
        if (hasAnimated) return;
        setHasAnimated(true);
        const duration = 1500;
        const steps = 40;
        const increment = value / steps;
        let current = 0;
        const interval = setInterval(() => {
          current += increment;
          if (current >= value) {
            setCount(value);
            clearInterval(interval);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);
      }}
      className="text-center p-4 sm:p-5"
    >
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center mx-auto mb-3 icon-container-glow">
        <Icon className="h-5 w-5 text-primary icon-lift" strokeWidth={1.5} />
      </div>
      <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="font-mono text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   LIVE AGENT CARD
   ═══════════════════════════════════════════════════════ */
interface LiveAgentProps {
  key?: string;
  slug?: string;
  name: string;
  role: string;
  icon: React.ElementType;
  status: string;
  actions: number;
  index: number;
  actionsLabel: string;
  detailsLabel: string;
}

const LiveAgentCard = ({ name, role, icon: Icon, status, actions, index, slug, actionsLabel, detailsLabel }: LiveAgentProps) => {
  const [currentActions, setCurrentActions] = useState(actions);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActions(prev => prev + Math.floor(Math.random() * 3));
    }, 3000 + index * 1000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.5 }}
    >
      <Link to={slug ? `/agente/${slug}` : "/library"} className="block group" aria-label={`${name} — ${role}`}>
        <div className="relative p-6 sm:p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-line pointer-events-none" />
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-accent-emerald" />
                <div className="absolute inset-0 w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-accent-emerald animate-ping opacity-75" />
              </div>
              <span className="font-mono text-xs sm:text-[10px] uppercase tracking-[0.2em] text-accent-emerald/80">{status}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
              <Activity className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-primary/60" strokeWidth={1.5} />
              <span className="font-mono text-xs sm:text-[11px] text-muted-foreground">
                {currentActions.toLocaleString()} {actionsLabel}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 icon-container-glow">
              <Icon className="h-6 w-6 sm:h-5 sm:w-5 text-primary/70 icon-lift" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base sm:text-base mb-1.5 group-hover:text-primary/90 transition-colors truncate">{name}</h3>
              <p className="text-sm sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">{role}</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="font-mono text-xs sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              {detailsLabel}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);

  const { scrollYProgress } = useScroll();
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const cyclingRoles = useMemo(() => [
    "AI Employees",
    "AI Sales Rep",
    "AI Support Agent",
    "AI Growth Hacker",
    "AI CFO Assistant",
    "AI Content Creator",
    "AI DevOps Engineer",
  ], [t]);
  const { displayed: typedText, firstCycleDone: typingDone } = useCyclingTypewriter(cyclingRoles, 45, 2200, 600);

  // SEO meta tags
  useEffect(() => {
    document.title = t("home.seo_title");
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", t("home.seo_description"));
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = t("home.seo_description");
      document.head.appendChild(meta);
    }
    // JSON-LD
    let script = document.getElementById("jsonld-org") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "jsonld-org";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CLAUTHOR",
      url: "https://clauthor-com.lovable.app",
      logo: "https://clauthor-com.lovable.app/favicon.png",
      description: t("home.seo_description"),
      sameAs: ["https://linkedin.com/company/clauthor", "https://twitter.com/clauthor"],
    });
    return () => {
      const el = document.getElementById("jsonld-org");
      if (el) el.remove();
    };
  }, [t]);

  const finderIcons: Record<string, React.ElementType> = {
    customer_service: Headphones, sales: DollarSign, billing: Receipt,
    developer: Code, sdr: Megaphone, hr: UsersRound, security: ShieldCheck,
    omnichannel: MessageSquare, content: PenTool, social_media: Globe,
    ecommerce: ShoppingCart, traffic_manager: LineChart, legal: Briefcase,
  };

  const finderMeta = useMemo(() => {
    const keys = Object.keys(finderIcons);
    return Object.fromEntries(keys.map(k => [k, {
      icon: finderIcons[k],
      tier: "advanced" as string,
      socialProof: { companies: 150, rating: 4.9, savings: "R$ 8.500" },
      capabilities: [],
      slug: k.replace(/_/g, "-"),
    }]));
  }, []);

  const agents = [
    { key: "customer_service", slug: "support_channel", icon: Headphones, name: t("agents.customer_service"), role: t("agents.customer_service_desc"), status: "ONLINE", actions: 12847 },
    { key: "billing", slug: "revenue", icon: Receipt, name: t("agents.billing"), role: t("agents.billing_desc"), status: "ONLINE", actions: 9432 },
    { key: "developer", slug: "coding", icon: Code, name: t("agents.developer"), role: t("agents.developer_desc"), status: "ONLINE", actions: 15291 },
  ];

  return (
    <div className="relative overflow-x-hidden">
      {/* Background depth layer — disabled on mobile for scroll performance */}
      {!isMobile && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ opacity: bgOpacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/[0.04]" />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[70vh] flex items-center px-4 sm:px-6 overflow-hidden pt-2 pb-10 sm:pt-4 sm:pb-14" aria-label="Hero">
        {!isMobile && <MouseReactiveField />}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* LEFT — Text content */}
            <div className="flex-1 min-w-0">
              {/* System status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="flex items-center gap-3 mb-6 sm:mb-8"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/30 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-accent-emerald animate-ping opacity-75" />
                  </div>
                  <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("home.system_status")}
                  </span>
                  <HelpTooltip id="home-intro" text={t("home.help_tooltip", { defaultValue: "Bem-vindo à CLAUTHOR! Explore agentes de IA por departamento, contrate individualmente ou monte um time completo." })} position="bottom" size={12} autoShow={false} />
                </div>
              </motion.div>

              {/* Self-typing headline */}
              <div className="mb-6 sm:mb-8">
                <h1 className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight min-h-[2.4rem] sm:min-h-[3.6rem] md:min-h-[4.5rem] lg:min-h-[5.25rem]">
                  <span className="text-foreground">{typedText}</span>
                  <span className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle" style={{ animation: "blink-cursor 0.8s step-end infinite" }} />
                </h1>
              </div>

              {/* Subtitle — shows after short delay, not after full typewriter cycle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                    <p className="font-mono text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed mb-8">
                      <span className="text-primary/60">$</span>{" "}
                      {t("home.subtitle")}
                      <span className="text-foreground/80 font-medium"> {t("home.subtitle_highlight")}</span>
                    </p>

                    {/* CTAs — Waitlist focused for launch */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/waitlist" className="block w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="Garantir meu lugar"
                            className="group relative h-14 sm:h-14 px-10 rounded-xl font-display font-bold text-sm uppercase tracking-wider text-primary-foreground overflow-hidden cursor-pointer w-full"
                          >
                            <div className="absolute inset-0 bg-primary rounded-xl" />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 40px hsl(0 85% 55% / 0.3), 0 0 80px hsl(0 85% 55% / 0.1)" }} />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              <Rocket className="h-4 w-4" strokeWidth={1.5} />
                              {t("home.cta_waitlist", { defaultValue: "GARANTIR MEU LUGAR" })}
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </motion.button>
                      </Link>

                      <Link to="/library" className="block">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          aria-label={t("home.cta_explore_agents")}
                          className="group h-11 sm:h-11 px-6 rounded-lg font-mono text-xs uppercase tracking-wider border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer w-full sm:w-auto"
                        >
                          <span className="flex items-center justify-center gap-2">
                            {t("home.cta_explore_agents")}
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                          </span>
                        </motion.button>
                      </Link>
                    </div>

                    {/* Trust badges — honest claims only */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-5 mt-8">
                      {[
                        { icon: LockKeyhole, label: t("home.trust_e2e", { defaultValue: "END-TO-END ENCRYPTED" }) },
                        { icon: ShieldCheck, label: t("home.trust_enterprise", { defaultValue: "ENTERPRISE-GRADE" }) },
                        { icon: Bolt, label: t("home.trust_setup", { defaultValue: "SETUP 5MIN" }) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border/30 bg-card/20">
                          <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/80 shrink-0" strokeWidth={1.5} />
                          <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.12em] text-muted-foreground/70">{item.label}</span>
                        </div>
                      ))}
                    </div>
              </motion.div>
            </div>

            {/* RIGHT — Live Demo Agent */}
            <div className="w-full max-w-[420px] lg:w-[420px] shrink-0">
              <Suspense fallback={
                <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3 rounded bg-muted/50 animate-pulse" />
                      <div className="w-16 h-2 rounded bg-emerald-500/20 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-[280px] sm:h-[320px] px-4 py-4 space-y-3">
                    <div className="flex items-center justify-center">
                      <span className="font-mono text-[10px] text-muted-foreground/50 px-3 py-1.5 rounded-full bg-muted/20 border border-border/30">Conectando agente...</span>
                    </div>
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-6 h-6 rounded-md bg-primary/10 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded bg-muted/30 animate-pulse w-full" />
                        <div className="h-3 rounded bg-muted/30 animate-pulse w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>
              }>
                <LiveDemoAgent />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          3D SHOWCASE — Spline immersive section
          ═══════════════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        <SplineShowcase variant="home" />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL PROOF — Authority numbers
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 relative border-y border-border/50" aria-label="Platform capabilities">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <AnimatedStat icon={BotMessageSquare} value={83} suffix="" label={t("home.stats_active_agents", { defaultValue: "AI AGENTS READY" })} />
            <AnimatedStat icon={Layers3} value={15} suffix="" label={t("home.stats_departments", { defaultValue: "DEPARTMENTS" })} />
            <AnimatedStat icon={Fingerprint} value={7} suffix="" label={t("home.stats_tools", { defaultValue: "BUILT-IN TOOLS" })} />
            <AnimatedStat icon={Signal} value={100} suffix="%" label={t("home.stats_uptime", { defaultValue: "PLATFORM UPTIME" })} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE AGENTS — Temporariamente oculto (guardado para lançamento)
          ═══════════════════════════════════════════════════════ */}
      {/* 
      <section className="py-16 sm:py-28 px-4 relative" aria-label="Live agents">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 sm:mb-12"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_active_agents")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-5xl font-bold text-center">
              {t("home.agents_title")} <span className="gradient-text">{t("home.agents_title_hl")}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <LiveAgentCard key={agent.key} {...agent} index={i} actionsLabel={t("home.actions_label")} detailsLabel={t("home.details_arrow")} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10"
          >
            <Link to="/library">
              <Button variant="outline" className="rounded-xl border-border hover:border-primary/20 group font-mono text-xs sm:text-xs uppercase tracking-wider px-8 h-12 sm:h-11" aria-label={t("home.view_all_80")}>
                {t("home.view_all_80")}
                <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
      */}

      {/* ═══════════════════════════════════════════════════════
          CONCIERGE IA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 relative" aria-label="AI Concierge">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_concierge")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>

            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-5 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20 rounded-br-2xl" />

              <div className="text-center mb-6 sm:mb-8">
                <h2 className="font-display text-xl sm:text-3xl font-bold mb-3">
                  {t("home.concierge_title")} <span className="gradient-text">{t("home.concierge_title_hl")}</span>
                </h2>
                <p className="font-mono text-xs sm:text-xs text-muted-foreground">
                  {t("home.concierge_desc")}
                </p>
              </div>

              <Suspense fallback={<div className="h-[200px] rounded-2xl bg-card/30 animate-pulse" />}>
                <SmartAgentFinder
                  agentMeta={finderMeta}
                  onHire={() => navigate("/library")}
                  onPreview={() => {}}
                  hiringSlug={null}
                />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — 3 steps
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 relative" aria-label="How it works">
        <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-10 sm:mb-14"
            >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_protocol")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              {t("home.how_title")} <span className="gradient-text">{t("home.how_steps_count")}</span>
            </h2>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            {[
              { step: "01", icon: Crosshair, title: t("home.how_step1"), desc: t("home.how_step1_desc") },
              { step: "02", icon: Layers3, title: t("home.how_step2"), desc: t("home.how_step2_desc") },
              { step: "03", icon: Bolt, title: t("home.how_step3"), desc: t("home.how_step3_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="flex items-start gap-4 sm:gap-6 group p-4 sm:p-5 rounded-xl border border-transparent hover:border-border hover:bg-card/30 transition-all duration-500"
              >
                <div className="shrink-0 flex flex-col items-center">
                  <span className="font-mono text-2xl sm:text-4xl font-bold text-primary/15 group-hover:text-primary/30 transition-colors">{item.step}</span>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base sm:text-lg mb-1.5 sm:mb-2 group-hover:text-primary/90 transition-colors">{item.title}</h4>
                  <p className="text-sm sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY CLAUTHOR — Key differentiators
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 relative border-y border-border/30" aria-label="Why CLAUTHOR">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_differentials")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              {t("home.why_title")} <span className="gradient-text">CLAUTHOR</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center mt-3 max-w-xl mx-auto">
              {t("home.why_subtitle")}
            </p>
          </motion.div>

          {/* HERO CARD — Savings (highlighted) */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-6 group p-6 sm:p-8 rounded-2xl border-2 border-primary/30 bg-primary/[0.04] backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute top-4 right-4">
              <span className="font-mono text-[9px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary tracking-wider">{t("home.diff_savings_badge", { defaultValue: "MAIOR IMPACTO" })}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 icon-container-glow">
                <DollarSign className="h-8 w-8 text-primary icon-lift" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-2">+88%</p>
                <h3 className="font-display font-bold text-lg sm:text-xl mb-2">{t("home.diff_savings")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("home.diff_savings_desc")}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Fingerprint, title: t("home.diff_security"), desc: t("home.diff_security_desc") },
              { icon: Bolt, title: t("home.diff_setup"), desc: t("home.diff_setup_desc") },
              { icon: Workflow, title: t("home.diff_orchestration"), desc: t("home.diff_orchestration_desc") },
              { icon: Globe, title: t("home.diff_multilang"), desc: t("home.diff_multilang_desc") },
              { icon: Rocket, title: t("home.diff_scale"), desc: t("home.diff_scale_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group p-5 sm:p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm hover:border-primary/20 hover:bg-card/50 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 icon-container-glow">
                  <item.icon className="h-5 w-5 text-primary/70 icon-lift" strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-bold text-base mb-2 group-hover:text-primary/90 transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS — Multiple cases
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 relative" aria-label="Testimonials">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_cases")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              {t("home.cases_title")} <span className="gradient-text">{t("home.cases_title_hl")}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                initials: "RM", name: t("home.case1_name"), role: t("home.case1_role"), sector: t("home.case1_sector"),
                quote: t("home.case1_quote"), metric: t("home.case1_metric"), metricLabel: t("home.case1_metric_label"),
              },
              {
                initials: "CS", name: t("home.case2_name"), role: t("home.case2_role"), sector: t("home.case2_sector"),
                quote: t("home.case2_quote"), metric: t("home.case2_metric"), metricLabel: t("home.case2_metric_label"),
              },
              {
                initials: "LP", name: t("home.case3_name"), role: t("home.case3_role"), sector: t("home.case3_sector"),
                quote: t("home.case3_quote"), metric: t("home.case3_metric"), metricLabel: t("home.case3_metric_label"),
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-5 sm:p-6 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/10 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/10 rounded-br-2xl" />

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 mb-4 w-fit">
                  <TrendingUp className="h-3 w-3 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-xs font-bold text-primary">{testimonial.metric}</span>
                  <span className="font-mono text-[10px] text-primary/60">{testimonial.metricLabel}</span>
                </div>

                <p className="text-sm sm:text-[15px] text-foreground/90 leading-relaxed font-medium italic mb-5 flex-1">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/10 flex items-center justify-center font-mono text-[11px] font-bold text-primary shrink-0">
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{testimonial.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground truncate">{testimonial.role}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-primary/80 text-primary/80" />
                      ))}
                    </div>
                    <p className="font-mono text-[9px] text-muted-foreground/50 text-right mt-0.5">{testimonial.sector}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TRUST — Security & Support
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 relative" aria-label="Trust">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-6 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5 icon-container-glow">
                <ShieldCheck className="h-7 w-7 text-primary icon-lift" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-3">{t("home.trust_section_title")}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6">
                {t("home.trust_section_desc")}
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                {[
                  { icon: LockKeyhole, text: t("home.trust_encrypted") },
                  { icon: Bolt, text: t("home.trust_cancel") },
                  { icon: Headphones, text: t("home.trust_support") },
                ].map((g) => (
                  <div key={g.text} className="flex items-center gap-2">
                    <g.icon className="h-3.5 w-3.5 text-primary/60" strokeWidth={1.5} />
                    <span className="font-mono text-xs text-muted-foreground">{g.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TEAM — Quem Somos
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-4 relative" aria-label="Team">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_team")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-5xl font-bold text-center">
              {t("home.team_title")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base text-center mt-4 max-w-2xl mx-auto">
              {t("home.team_subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-12 max-w-3xl mx-auto">
            {[
              {
                name: "THOR",
                role: t("home.thor_role"),
                photo: thorPhoto,
                bio: t("home.thor_bio"),
                isAI: true,
              },
              {
                name: "HELIXA AI",
                role: t("home.helixa_role"),
                photo: helixaPhoto,
                bio: t("home.helixa_bio"),
                isAI: true,
              },
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-all duration-500"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    width={400}
                    height={533}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${member.isAI ? 'bg-primary' : 'bg-accent-emerald'}`} />
                      <div className={`absolute inset-0 w-2 h-2 rounded-full ${member.isAI ? 'bg-primary' : 'bg-accent-emerald'} animate-ping opacity-75`} />
                    </div>
                    {member.isAI && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">AI</span>}
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">{member.role}</span>
                  </div>
                  <h3 className="font-display text-lg sm:text-2xl font-bold mb-2">{member.name}</h3>
                  <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRICING PREVIEW
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 relative border-y border-border/30" aria-label="Pricing">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary/60">{t("home.section_pricing")}</span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mt-3 mb-4">
              {t("home.pricing_from")} <span className="gradient-text">{t("home.pricing_amount")}</span> {t("home.pricing_per_agent")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-4">
              {t("home.pricing_desc")}
            </p>

            {/* Value comparison */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-3 sm:gap-6 mb-6">
              {[
                { label: t("home.pricing_val_human", { defaultValue: "Funcionário CLT" }), value: "R$ 4.500/mês", sub: t("home.pricing_val_human_sub", { defaultValue: "8h/dia, férias, encargos" }), muted: true },
                { label: t("home.pricing_val_agent", { defaultValue: "Agente CLAUTHOR" }), value: "R$ 147/mês", sub: t("home.pricing_val_agent_sub", { defaultValue: "24/7, sem encargos, escala infinita" }), muted: false },
              ].map((item) => (
                <div key={item.label} className={`px-3 sm:px-5 py-3 rounded-xl border text-center min-w-0 ${item.muted ? "border-border/30 bg-card/20 opacity-60" : "border-primary/20 bg-primary/5"}`}>
                  <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground mb-1 truncate">{item.label}</p>
                  <p className={`font-display text-base sm:text-lg font-bold ${item.muted ? "line-through text-muted-foreground" : "text-primary"}`}>{item.value}</p>
                  <p className="font-mono text-[8px] sm:text-[9px] text-muted-foreground/60 mt-0.5 truncate">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
              {[
                { label: t("home.pricing_tier_3"), discount: t("home.pricing_off_10") },
                { label: t("home.pricing_tier_5"), discount: t("home.pricing_off_20") },
                { label: t("home.pricing_tier_7"), discount: t("home.pricing_off_30") },
                { label: t("home.pricing_tier_10"), discount: t("home.pricing_off_35") },
              ].map(tier => (
                <div key={tier.label} className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border bg-card/30 text-center">
                  <p className="font-mono text-[10px] sm:text-xs text-muted-foreground truncate">{tier.label}</p>
                  <p className="font-display font-bold text-sm text-primary">{tier.discount}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/waitlist">
                <Button className="glow rounded-xl h-13 px-10 gap-2 font-display font-bold text-sm uppercase tracking-wider" aria-label="Entrar na waitlist">
                  <Rocket className="h-4 w-4" strokeWidth={1.5} />
                  {t("home.cta_waitlist", { defaultValue: "GARANTIR MEU LUGAR" })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="rounded-xl h-11 px-8 font-mono text-xs uppercase tracking-wider border-border/50" aria-label={t("home.cta_see_pricing")}>
                  {t("home.cta_see_pricing")}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WAITLIST BANNER — High-conversion interstitial
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 relative overflow-hidden" aria-label="Waitlist CTA">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-primary/[0.06] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 p-6 sm:p-10 rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-sm"
          >
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent-emerald animate-ping opacity-75" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-emerald">{t("home.waitlist_banner_live", { defaultValue: "LANÇAMENTO EM BREVE" })}</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2">
                {t("home.waitlist_banner_title", { defaultValue: "Não fique de fora do futuro." })}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("home.waitlist_banner_desc", { defaultValue: "Entre na fila agora e seja dos primeiros a ter acesso exclusivo à plataforma com desconto de lançamento." })}
              </p>
            </div>
            <Link to="/waitlist" className="shrink-0">
              <Button className="glow rounded-xl h-13 px-8 gap-2 font-display font-bold text-sm uppercase tracking-wider">
                <Rocket className="h-4 w-4" strokeWidth={1.5} />
                {t("home.cta_waitlist", { defaultValue: "GARANTIR MEU LUGAR" })}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          INNOVATION ROADMAP — COMING SOON
          ═══════════════════════════════════════════════════════ */}
      <Suspense fallback={null}>
        <InnovationRoadmap />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════
          EARLY ADOPTERS — Social proof without fake data
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 relative border-t border-border/50" aria-label="Early adopters">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-3">
              {t("home.early_adopters_badge", { defaultValue: "EARLY ADOPTERS" })}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              {t("home.early_adopters_title", { defaultValue: "Quem já está usando" })}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                quote: t("home.testimonial_1", { defaultValue: "Automatizamos 80% do atendimento ao cliente no primeiro mês. O agente resolve tickets sozinho e escala só quando precisa." }),
                author: "CEO",
                company: t("home.testimonial_1_company", { defaultValue: "E-commerce de Moda" }),
                metric: "80%",
                metricLabel: t("home.testimonial_1_metric", { defaultValue: "tickets automatizados" }),
              },
              {
                quote: t("home.testimonial_2", { defaultValue: "O agente financeiro concilia notas fiscais, cobra inadimplentes e gera relatórios. Economizamos um funcionário inteiro." }),
                author: "CFO",
                company: t("home.testimonial_2_company", { defaultValue: "Startup SaaS B2B" }),
                metric: "R$8k",
                metricLabel: t("home.testimonial_2_metric", { defaultValue: "economia mensal" }),
              },
              {
                quote: t("home.testimonial_3", { defaultValue: "Configurei o SDR em 10 minutos. Ele já prospecta via LinkedIn e WhatsApp, qualifica leads e agenda reuniões automaticamente." }),
                author: "Head of Growth",
                company: t("home.testimonial_3_company", { defaultValue: "Agência Digital" }),
                metric: "3x",
                metricLabel: t("home.testimonial_3_metric", { defaultValue: "mais leads qualificados" }),
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/15">
                    <span className="font-display text-lg font-bold text-primary">{item.metric}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.metricLabel}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{item.quote}"</p>
                <div className="pt-4 border-t border-border/50">
                  <p className="font-display text-xs font-bold">{item.author}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60">{item.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground/30 text-center mt-6 uppercase tracking-wider">
            {t("home.early_adopters_disclaimer", { defaultValue: "* Resultados de early adopters em fase beta. Nomes omitidos por acordo de confidencialidade." })}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRE-FOOTER CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 relative" aria-label="Final CTA">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="relative rounded-3xl border border-primary/20 bg-primary/[0.03] backdrop-blur-sm p-10 sm:p-16 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-6 icon-container-glow">
                  <Rocket className="h-8 w-8 text-primary icon-lift" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
                  {t("home.final_cta_title_v2", { defaultValue: "Vagas limitadas. Garanta a sua." })}
                </h2>
                <p className="text-sm sm:text-lg text-muted-foreground max-w-lg mx-auto mb-4 leading-relaxed">
                  {t("home.final_cta_desc_v2", { defaultValue: "Os primeiros a entrar ganham acesso antecipado, desconto exclusivo de lançamento e onboarding personalizado." })}
                </p>
                <div className="flex items-center justify-center gap-4 mb-8 font-mono text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary" /> 50% OFF lançamento</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Acesso prioritário</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/waitlist">
                    <Button className="glow rounded-xl h-14 px-12 gap-2 font-display font-bold text-sm uppercase tracking-wider" aria-label="Entrar na waitlist">
                      <Rocket className="h-4 w-4" strokeWidth={1.5} />
                      {t("home.cta_waitlist", { defaultValue: "GARANTIR MEU LUGAR" })}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-10 mb-8 sm:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src={clauthorLogo} alt="CLAUTHOR" className="w-8 h-8 object-contain mix-blend-lighten" width={32} height={32} />
                <span className="font-display font-bold text-base tracking-wider">CLAUTHOR</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                {t("home.footer_desc")}
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                <a href="https://linkedin.com/company/clauthor" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-lg border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors">
                  <Linkedin className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
                <a href="https://twitter.com/clauthor" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-8 h-8 rounded-lg border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors">
                  <Twitter className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
                <a href="https://github.com/clauthor" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-8 h-8 rounded-lg border border-border bg-card/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-colors">
                  <Github className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4">
              <div className="space-y-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_product")}</p>
                <Link to="/library" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_agents")}</Link>
                <Link to="/departamentos" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_departments")}</Link>
                <Link to="/pricing" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
                <Link to="/how-it-works" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("nav.how_it_works")}</Link>
              </div>
              <div className="space-y-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_community_label")}</p>
                <Link to="/community" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_community_link")}</Link>
                <Link to="/pitch" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_pitch")}</Link>
              </div>
              <div className="space-y-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">{t("home.footer_legal")}</p>
                <Link to="/termos" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_terms_label")}</Link>
                <Link to="/privacidade" className="block font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">{t("home.footer_privacy_label")}</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center gap-4">
              {[
                { icon: LockKeyhole, label: "SSL 256-bit" },
                { icon: ShieldCheck, label: "ENTERPRISE-GRADE" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border">
                  <badge.icon className="h-3 w-3 text-primary/50" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">{t("home.footer_copyright")}</p>
          </div>
        </div>
      </footer>
      {/* Smart Onboarding */}
      <Suspense fallback={null}>
        <SmartOnboarding isOpen={showSmartOnboarding} onClose={() => setShowSmartOnboarding(false)} />
      </Suspense>
    </div>
  );
};

export default HomePage;
