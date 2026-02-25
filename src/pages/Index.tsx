import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Shield, Zap,
  Code, Users, TrendingUp,
  Lock, Network,
  Headphones, Bot, PenTool, ShoppingCart, Megaphone, LineChart,
  Star, Receipt, Globe, Briefcase, DollarSign, MessageSquare,
  Activity, Terminal, ChevronRight, Cpu, Target
} from "lucide-react";
import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import clauthorLogo from "@/assets/clauthor-logo.png";

/* ═══════════════════════════════════════════════════════
   TYPEWRITER HOOK — Text types itself like AI is writing
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
   MOUSE TRACKER — Particles follow cursor like AI watching
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
      {/* Main glow that follows cursor */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          left: useTransform(smoothX, [0, 1], ["-10%", "70%"]),
          top: useTransform(smoothY, [0, 1], ["-10%", "60%"]),
          background: "radial-gradient(circle, hsl(0 85% 55% / 0.08) 0%, transparent 70%)",
        }}
      />
      {/* Secondary subtle orb */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          left: useTransform(smoothX, [0, 1], ["60%", "20%"]),
          top: useTransform(smoothY, [0, 1], ["50%", "10%"]),
          background: "radial-gradient(circle, hsl(0 85% 55% / 0.04) 0%, transparent 70%)",
        }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(0 85% 55% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(0 85% 55% / 0.3) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   LIVE AGENT CARD — Agents as living entities
   ═══════════════════════════════════════════════════════ */
interface LiveAgentProps {
  name: string;
  role: string;
  icon: React.ElementType;
  status: string;
  actions: number;
  index: number;
}

const LiveAgentCard = ({ name, role, icon: Icon, status, actions, index }: LiveAgentProps) => {
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
      <Link to="/library" className="block group">
        <div className="relative p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-500 overflow-hidden">
          {/* Scan line on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-line pointer-events-none" />
          
          {/* Top row: status + actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {/* Heartbeat indicator */}
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500/80">{status}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <Activity className="h-3 w-3 text-primary/60" />
              <span className="font-mono text-[11px] text-muted-foreground">
                {currentActions.toLocaleString()} ações
              </span>
            </div>
          </div>

          {/* Agent identity */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
              <Icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base mb-1 group-hover:text-primary/90 transition-colors truncate">{name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{role}</p>
            </div>
          </div>

          {/* Bottom: subtle CTA */}
          <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
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
    developer: Code, sdr: Megaphone, hr: Users, security: Shield,
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
    { key: "customer_service", icon: Headphones, name: t("agents.customer_service"), role: t("agents.customer_service_desc"), status: "ONLINE", actions: 12847 },
    { key: "billing", icon: Receipt, name: t("agents.billing"), role: t("agents.billing_desc"), status: "ONLINE", actions: 9432 },
    { key: "developer", icon: Code, name: t("agents.developer"), role: t("agents.developer_desc"), status: "ONLINE", actions: 15291 },
  ];

  return (
    <div className="relative">
      {/* ═══ DEPTH LAYER — Background that shifts with scroll ═══ */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: bgOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-primary/[0.04]" />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════
          HERO — "Sovereign AI Terminal"
          Mouse-reactive, self-typing, no clutter
          ═══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Mouse-reactive field (desktop only) */}
        {!isMobile && <MouseReactiveField />}

        {/* Horizontal scan lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* System status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex items-center gap-3 mb-8 sm:mb-12"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Sistema ativo — 37 agentes operacionais
              </span>
            </div>
          </motion.div>

          {/* Self-typing headline */}
          <div className="mb-8 sm:mb-10">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.92] tracking-tight">
              <span className="text-foreground">{typedText}</span>
              {!typingDone && (
                <span className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle" style={{ animation: "blink-cursor 0.8s step-end infinite" }} />
              )}
            </h1>
          </div>

          {/* Subtitle — monospace terminal feel */}
          <AnimatePresence>
            {typingDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="font-mono text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed mb-10 sm:mb-12">
                  <span className="text-primary/60">$</span>{" "}
                  {t("home.subtitle")}
                  <span className="text-foreground/80 font-medium"> {t("home.subtitle_highlight")}</span>
                </p>

                {/* CTA — Industrial, no fluff */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/departamentos">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative h-14 px-8 sm:px-12 rounded-xl font-display font-bold text-sm sm:text-base uppercase tracking-wider text-primary-foreground overflow-hidden cursor-pointer w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-primary rounded-xl" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 40px hsl(0 85% 55% / 0.3), 0 0 80px hsl(0 85% 55% / 0.1)" }} />
                      <span className="relative z-10 flex items-center gap-3">
                        <Network className="h-4 w-4" />
                        Monte seu Time de IA
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </Link>

                  <Link to="/library">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group h-14 px-8 sm:px-12 rounded-xl font-mono text-sm uppercase tracking-wider border border-border hover:border-primary/30 bg-card/30 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-500 cursor-pointer w-full sm:w-auto"
                    >
                      <span className="flex items-center gap-3">
                        <Terminal className="h-4 w-4 text-primary/50" />
                        Explorar Agentes
                        <ChevronRight className="h-4 w-4 text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </span>
                    </motion.button>
                  </Link>
                </div>

                {/* Trust — minimal, monospace */}
                <div className="flex flex-wrap items-center gap-6 mt-10 sm:mt-14">
                  {[
                    { icon: Lock, label: "End-to-end encrypted" },
                    { icon: Shield, label: "SOC 2 compliant" },
                    { icon: Zap, label: "Setup 5min" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 opacity-40">
                      <item.icon className="h-3 w-3 text-primary/70" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE AGENTS — Entities with heartbeat
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="max-w-5xl mx-auto">
          {/* Section header — terminal style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60">Agentes Ativos</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-center">
              {t("home.agents_title")} <span className="gradient-text">{t("home.agents_title_hl")}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <LiveAgentCard key={agent.key} {...agent} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link to="/library">
              <Button variant="outline" className="rounded-xl border-border hover:border-primary/20 group font-mono text-xs uppercase tracking-wider px-8 h-11">
                Ver todos os 37+ agentes
                <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CONCIERGE IA — Integrated as "the interface"
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60">Concierge IA</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>

            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-6 sm:p-10 relative overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20 rounded-br-2xl" />

              <div className="text-center mb-8">
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                  Descreva seu problema. <span className="gradient-text">A IA resolve.</span>
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  Nosso concierge analisa seu cenário e recomenda o agente ou time ideal.
                </p>
              </div>

              <SmartAgentFinder
                agentMeta={finderMeta}
                onHire={() => navigate("/library")}
                onPreview={() => {}}
                hiringSlug={null}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS — 3 steps, terminal aesthetic
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60">Protocolo</span>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center">
              {t("home.how_title")} <span className="gradient-text">3 passos</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: "01", icon: Target, title: t("home.how_step1"), desc: t("home.how_step1_desc") },
              { step: "02", icon: Users, title: t("home.how_step2"), desc: t("home.how_step2_desc") },
              { step: "03", icon: Zap, title: t("home.how_step3"), desc: t("home.how_step3_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex items-start gap-6 group p-5 rounded-xl border border-transparent hover:border-border hover:bg-card/30 transition-all duration-500"
              >
                <div className="shrink-0 flex flex-col items-center">
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-primary/15 group-hover:text-primary/30 transition-colors">{item.step}</span>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-lg mb-2 group-hover:text-primary/90 transition-colors">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SINGLE TESTIMONIAL — Strong, data-driven
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-10 sm:p-14 relative overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/10 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/10 rounded-br-2xl" />

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 mb-8">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-xs font-semibold text-primary">-72% custos operacionais</span>
                </div>

                <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium italic mb-10 max-w-2xl mx-auto">
                  "Reduzimos 72% dos custos operacionais em 3 meses. Os agentes trabalham 24/7 sem falhar. A integração levou 15 minutos."
                </p>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/10 flex items-center justify-center font-mono text-xs font-bold text-primary">
                    RM
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Rafael Mendes</p>
                    <p className="font-mono text-[11px] text-muted-foreground">CEO — TechNova</p>
                  </div>
                </div>

                <div className="flex gap-1 justify-center mt-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary/80 text-primary/80" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA FINAL — Consistent with hero identity
          ═══════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 px-4 relative">
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-10 sm:p-16 md:p-20 relative overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-6">
                  // ready to deploy
                </div>
                <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold mb-6">
                  {t("home.cta_ready")} <span className="gradient-text">{t("home.cta_ready_hl")}</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-10 max-w-md mx-auto">{t("home.cta_desc")}</p>
                <Link to="/departamentos">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-14 px-10 sm:px-14 rounded-xl font-display font-bold text-sm uppercase tracking-wider text-primary-foreground overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-primary rounded-xl" />
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "0 0 40px hsl(0 85% 55% / 0.3), 0 0 80px hsl(0 85% 55% / 0.1)" }} />
                    <span className="relative z-10 flex items-center gap-3">
                      <Network className="h-4 w-4" />
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
          FOOTER — Clean, functional, no dead links
          ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-3">
              <img src={clauthorLogo} alt="CLAUTHOR" className="w-8 h-8 object-contain mix-blend-lighten" />
              <span className="font-display font-bold text-base tracking-wider">CLAUTHOR</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              <Link to="/library" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Agentes</Link>
              <Link to="/departamentos" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Times</Link>
              <Link to="/pricing" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</Link>
              <Link to="/how-it-works" className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">{t("nav.how_it_works")}</Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                { icon: Lock, label: "SSL 256-bit" },
                { icon: Shield, label: "SOC 2" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border">
                  <badge.icon className="h-3 w-3 text-primary/50" />
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
