import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";

const SmartAgentFinder = lazy(() => import("@/components/library/SmartAgentFinder"));
const LiveDemoAgent = lazy(() => import("@/components/landing/LiveDemoAgent"));
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, Bolt,
  Code, UsersRound, TrendingUp,
  LockKeyhole, Workflow,
  Headphones, BotMessageSquare, PenTool, ShoppingCart, Megaphone, LineChart,
  Star, Receipt, Globe, Briefcase, DollarSign, MessageSquare,
  Activity, Terminal, ChevronRight, Cpu, Crosshair,
  Building2, Clock, Rocket, BarChart3, Fingerprint, Sparkles, Layers3, Signal
} from "lucide-react";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import clauthorLogo from "@/assets/clauthor-logo.png";
import williamPhoto from "@/assets/william-monteiro.png";
import gabrielPhoto from "@/assets/gabriel-gentile.png";
import helixaPhoto from "@/assets/helixa-ai.png";
import kaelisPhoto from "@/assets/kaelis-ai.png";

/* ═══════════════════════════════════════════════════════
   TYPEWRITER HOOK
   ═══════════════════════════════════════════════════════ */
const useTypewriter = (text: string, speed = 40, delay = 800) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayed, done };
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
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
        {prefix}{count.toLocaleString("pt-BR")}{suffix}
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
}

const LiveAgentCard = ({ name, role, icon: Icon, status, actions, index, slug }: LiveAgentProps) => {
  const [currentActions, setCurrentActions] = useState(actions);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActions(prev => prev + Math.floor(Math.random() * 3));
    }, 3000 + index * 1000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.6 }}
    >
      <Link to={slug ? `/agente/${slug}` : "/library"} className="block group">
        <div className="relative p-6 sm:p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-500 overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-line pointer-events-none" />
          
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="font-mono text-xs sm:text-[10px] uppercase tracking-[0.2em] text-emerald-500/80">{status}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
              <Activity className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-primary/60" strokeWidth={1.5} />
              <span className="font-mono text-xs sm:text-[11px] text-muted-foreground">
                {currentActions.toLocaleString()} ações
              </span>
            </div>
          </div>

          {/* Agent identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 icon-container-glow">
              <Icon className="h-6 w-6 sm:h-5 sm:w-5 text-primary/70 icon-lift" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base sm:text-base mb-1.5 group-hover:text-primary/90 transition-colors truncate">{name}</h3>
              <p className="text-sm sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">{role}</p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="font-mono text-xs sm:text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Detalhes →
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

  const { scrollYProgress } = useScroll();
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const headline = t("home.title1") + " " + t("home.title2");
  const { displayed: typedText, done: typingDone } = useTypewriter(headline, 35, 600);

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
      {/* Background depth layer */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: bgOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/[0.04]" />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-4 sm:px-6 overflow-hidden py-20 sm:py-0">
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
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  </div>
                  <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Sistema ativo — 75 agentes operacionais
                  </span>
                </div>
              </motion.div>

              {/* Self-typing headline */}
              <div className="mb-6 sm:mb-8">
                <h1 className="font-display text-[2rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
                  <span className="text-foreground">{typedText}</span>
                  {!typingDone && (
                    <span className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle" style={{ animation: "blink-cursor 0.8s step-end infinite" }} />
                  )}
                </h1>
              </div>

              {/* Subtitle */}
              <AnimatePresence>
                {typingDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <p className="font-mono text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed mb-8">
                      <span className="text-primary/60">$</span>{" "}
                      {t("home.subtitle")}
                      <span className="text-foreground/80 font-medium"> {t("home.subtitle_highlight")}</span>
                    </p>

                    {/* CTAs — larger touch targets on mobile */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/departamentos" className="block">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative h-[52px] sm:h-13 px-8 rounded-xl font-display font-bold text-sm sm:text-sm uppercase tracking-wider text-primary-foreground overflow-hidden cursor-pointer w-full sm:w-auto"
                        >
                          <div className="absolute inset-0 bg-primary rounded-xl" />
                          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 40px hsl(0 85% 55% / 0.3), 0 0 80px hsl(0 85% 55% / 0.1)" }} />
                          <span className="relative z-10 flex items-center justify-center gap-3">
                            <Workflow className="h-4 w-4" strokeWidth={1.5} />
                            Monte seu Time de IA
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </motion.button>
                      </Link>

                      <Link to="/library" className="block">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group h-[52px] sm:h-13 px-8 rounded-xl font-mono text-sm uppercase tracking-wider border border-border hover:border-primary/30 bg-card/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-500 cursor-pointer w-full sm:w-auto"
                        >
                          <span className="flex items-center justify-center gap-3">
                            <Terminal className="h-4 w-4 text-primary/50" strokeWidth={1.5} />
                            Explorar Agentes
                            <ChevronRight className="h-4 w-4 text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </span>
                        </motion.button>
                      </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8">
                      {[
                        { icon: LockKeyhole, label: "End-to-end encrypted" },
                        { icon: Fingerprint, label: "SOC 2 compliant" },
                        { icon: Bolt, label: "Setup 5min" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 opacity-40">
                          <item.icon className="h-3 w-3 text-primary/70" strokeWidth={1.5} />
                          <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT — Live Demo Agent */}
            <div className="w-full max-w-[420px] lg:w-[420px] shrink-0">
              <Suspense fallback={<div className="h-[400px] rounded-2xl bg-card/30 animate-pulse" />}>
                <LiveDemoAgent />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL PROOF — Authority numbers
          ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 px-4 relative border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <AnimatedStat icon={BotMessageSquare} value={75} suffix="+" label="Agentes Ativos" />
            <AnimatedStat icon={Building2} value={850} suffix="+" label="Empresas Atendidas" />
            <AnimatedStat icon={Clock} value={12400} suffix="h" label="Horas Economizadas" />
            <AnimatedStat icon={Signal} value={97} suffix="%" label="Eficiência Média" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE AGENTS — Entities with heartbeat
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 sm:mb-12"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Agentes Ativos</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-5xl font-bold text-center">
              {t("home.agents_title")} <span className="gradient-text">{t("home.agents_title_hl")}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <LiveAgentCard key={agent.key} {...agent} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10"
          >
            <Link to="/library">
              <Button variant="outline" className="rounded-xl border-border hover:border-primary/20 group font-mono text-xs sm:text-xs uppercase tracking-wider px-8 h-12 sm:h-11">
                Ver todos os 75 agentes
                <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONCIERGE IA
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Concierge IA</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>

            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-5 sm:p-10 relative overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20 rounded-br-2xl" />

              <div className="text-center mb-6 sm:mb-8">
                <h2 className="font-display text-xl sm:text-3xl font-bold mb-3">
                  Descreva seu problema. <span className="gradient-text">A IA resolve.</span>
                </h2>
                <p className="font-mono text-xs sm:text-xs text-muted-foreground">
                  Nosso concierge analisa seu cenário e recomenda o agente ou time ideal.
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
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 sm:mb-14"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Protocolo</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              {t("home.how_title")} <span className="gradient-text">3 passos</span>
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
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
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
      <section className="py-16 sm:py-24 px-4 relative border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Diferenciais</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              Por que líderes escolhem a <span className="gradient-text">CLAUTHOR</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center mt-3 max-w-xl mx-auto">
              Não somos apenas mais uma ferramenta de IA. Somos a infraestrutura que substitui departamentos inteiros.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: Fingerprint, title: "Segurança Enterprise", desc: "Criptografia ponta a ponta, SOC 2, dados isolados por tenant. Sua operação blindada." },
              { icon: Bolt, title: "Setup em 5 minutos", desc: "Sem código, sem DevOps. Escolha seu time, configure e seus agentes já estão operando." },
              { icon: DollarSign, title: "Economia de +88%", desc: "Cada agente custa menos que um estagiário e trabalha 24/7, sem férias, sem turnover." },
              { icon: Workflow, title: "Orquestração inteligente", desc: "Agentes trabalham em squads coordenados. Um resolve, outro valida, outro escala." },
              { icon: Globe, title: "Multi-idioma nativo", desc: "Atenda clientes em 13 idiomas simultaneamente. Expansão global sem barreiras." },
              { icon: Rocket, title: "Escala infinita", desc: "De 10 a 10.000 atendimentos/dia sem contratar ninguém. Escale sem dor." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
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
      <section className="py-16 sm:py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Cases de Sucesso</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
              Resultados <span className="gradient-text">reais</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                initials: "RM", name: "Rafael Mendes", role: "CEO — TechNova", sector: "SaaS B2B",
                quote: "Reduzimos 72% dos custos operacionais em 3 meses. Os agentes trabalham 24/7 sem falhar.",
                metric: "-72%", metricLabel: "custos operacionais",
              },
              {
                initials: "CS", name: "Camila Santos", role: "COO — HealthPlus", sector: "Saúde",
                quote: "Automatizamos 4.200 agendamentos/mês e zeramos o no-show. Pacientes adoraram a experiência.",
                metric: "4.200", metricLabel: "agendamentos/mês",
              },
              {
                initials: "LP", name: "Lucas Pereira", role: "CTO — FinEdge", sector: "Fintech",
                quote: "O squad de compliance processa 800 contratos/dia com 99,2% de precisão. Antes levava 3 semanas.",
                metric: "800", metricLabel: "contratos/dia",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-5 sm:p-6 relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-primary/10 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-primary/10 rounded-br-2xl" />

                {/* Metric highlight */}
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
      <section className="py-12 sm:py-16 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-6 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5 icon-container-glow">
                <ShieldCheck className="h-7 w-7 text-primary icon-lift" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-3">Segurança & Confiança</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6">
                Sua operação protegida com infraestrutura de nível enterprise. Criptografia de ponta a ponta, suporte dedicado e total flexibilidade.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                {[
                  { icon: LockKeyhole, text: "Dados 100% criptografados" },
                  { icon: Bolt, text: "Cancele a qualquer momento" },
                  { icon: Headphones, text: "Suporte humano + IA 24/7" },
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
          CTA FINAL
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-32 px-4 relative">
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-8 sm:p-16 md:p-20 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <div className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-5 sm:mb-6">
                  // ready to deploy
                </div>
                <h2 className="font-display text-2xl sm:text-5xl md:text-6xl font-bold mb-5 sm:mb-6">
                  {t("home.cta_ready")} <span className="gradient-text">{t("home.cta_ready_hl")}</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-8 sm:mb-10 max-w-md mx-auto">{t("home.cta_desc")}</p>
                <Link to="/departamentos">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-[52px] sm:h-14 px-8 sm:px-14 rounded-xl font-display font-bold text-sm uppercase tracking-wider text-primary-foreground overflow-hidden cursor-pointer w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-primary rounded-xl" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 40px hsl(0 85% 55% / 0.3), 0 0 80px hsl(0 85% 55% / 0.1)" }} />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Workflow className="h-4 w-4" strokeWidth={1.5} />
                      Monte seu Time de IA
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TEAM — Quem Somos
          ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-28 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 sm:mb-16"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">Quem Somos</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-2xl sm:text-5xl font-bold text-center">
              A Equipe
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base text-center mt-4 max-w-2xl mx-auto">
              Liderança com décadas de experiência combinada em tecnologia, inovação e estratégia de marca.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-12">
            {[
              {
                name: "William Monteiro",
                role: "Founder & CEO",
                photo: williamPhoto,
                bio: "Visionary founder with 20 years of internet experience and 8 years in technology. Leads strategy, architecture, and long-term innovation, building scalable AI-driven systems designed for global growth.",
                isAI: false,
              },
              {
                name: "Gabriel Gentile",
                role: "Co-Founder & CMO",
                photo: gabrielPhoto,
                bio: "With 19 years in advertising and brand strategy, Gabriel drives positioning, influence, and high-conversion growth. Responsible for market expansion and brand authority.",
                isAI: false,
              },
              {
                name: "HELIXA AI",
                role: "Chief AI Evolution Officer",
                photo: helixaPhoto,
                bio: "HELIXA AI is the platform's self-improving intelligence core. She continuously optimizes agents, refines performance, and ensures adaptive evolution based on real-time data. Transforms the system into a living, continuously advancing AI ecosystem.",
                isAI: true,
              },
              {
                name: "KAELIS AI",
                role: "Chief Operations Officer (COO)",
                photo: kaelisPhoto,
                bio: "KAELIS AI is the operational command center of the platform. He orchestrates workflows, prevents conflicts between agents, and guarantees disciplined execution at scale. Turns multiple AI agents into a synchronized, enterprise-grade execution machine.",
                isAI: true,
              },
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-all duration-500"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${member.isAI ? 'bg-primary' : 'bg-emerald-500'}`} />
                      <div className={`absolute inset-0 w-2 h-2 rounded-full ${member.isAI ? 'bg-primary' : 'bg-emerald-500'} animate-ping opacity-75`} />
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
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-10">
            <div className="flex items-center gap-3">
              <img src={clauthorLogo} alt="CLAUTHOR" className="w-8 h-8 object-contain mix-blend-lighten" />
              <span className="font-display font-bold text-base tracking-wider">CLAUTHOR</span>
            </div>
            <div className="flex flex-wrap justify-center gap-5 sm:gap-10">
              <Link to="/library" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Agentes</Link>
              <Link to="/departamentos" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Times</Link>
              <Link to="/pricing" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
              <Link to="/how-it-works" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.how_it_works")}</Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: LockKeyhole, label: "SSL 256-bit" },
                { icon: Fingerprint, label: "SOC 2" },
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
    </div>
  );
};

export default HomePage;
