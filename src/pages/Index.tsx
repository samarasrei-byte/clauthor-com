import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, DollarSign, Zap, ArrowRight,
  Shield, BarChart3, Sparkles,
  Code, Users, Search, TrendingUp,
  ChevronRight, Lock,
  Target, Network,
  Headphones, Bot, PenTool, ShoppingCart, Megaphone, LineChart,
  Quote, Star, Receipt, Globe, Briefcase
} from "lucide-react";
import { useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import clauthorLogo from "@/assets/clauthor-logo.png";

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);

  // Only 3 top agents for clarity
  const topAgents = [
    { key: "customer_service", icon: Headphones, price: "R$ 1.899" },
    { key: "billing", icon: Receipt, price: "R$ 1.979" },
    { key: "developer", icon: Code, price: "R$ 2.447" },
  ];

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

  const handleFinderHire = (key: string) => {
    navigate("/library");
  };

  return (
    <div className="relative">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent rounded-full blur-[120px]" />
        {!isMobile && (
          <motion.div
            animate={{ y: [-20, 20, -20], opacity: [0.03, 0.07, 0.03] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary/[0.05] blur-[100px]"
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          HERO — Clean, single CTA, no cognitive overload
          ═══════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 pt-8 sm:pt-16 pb-8 overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="space-y-8">

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <Badge variant="outline" className="px-5 py-2.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary gap-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                {t("home.badge")}
              </Badge>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
              <span className="block mb-2 text-foreground">{t("home.title1")}</span>
              <span className="block gradient-text">{t("home.title2")}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              {t("home.subtitle")}
              <span className="text-foreground/90 font-semibold"> {t("home.subtitle_highlight")}</span>
            </motion.p>

            {/* Single CTA — no decision paralysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }} className="flex justify-center pt-4 px-2 sm:px-0">
              <Link to="/auth" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative w-full sm:w-auto h-14 sm:h-16 px-10 sm:px-16 rounded-2xl font-display font-bold text-base sm:text-lg text-white overflow-hidden cursor-pointer"
                >
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-violet-600/60 via-purple-400/80 to-violet-600/60 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-500 to-violet-600 bg-[length:300%_100%] animate-gradient-shift rounded-2xl" />
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-500" />
                  <span className="relative z-10 flex items-center gap-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                    <Zap className="h-5 w-5" />
                    <span className="tracking-wide">Começar Grátis</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Minimal trust line — not stats, just credibility */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="flex flex-wrap items-center justify-center gap-6 pt-6 text-muted-foreground">
              {[
                { icon: Shield, label: "37+ agentes disponíveis" },
                { icon: Lock, label: t("home.trust_encrypted") },
                { icon: Zap, label: "Setup em 5 minutos" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 opacity-60">
                  <item.icon className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs tracking-wide">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="w-7 h-12 rounded-full border border-border flex items-start justify-center p-2">
            <div className="w-1 h-2.5 bg-primary/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONCIERGE IA — Single discovery tool (kept)
          ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-4 py-2 backdrop-blur-sm">
                <Bot className="h-4 w-4 mr-2" />
                Concierge IA
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                Não sabe por onde começar? <span className="gradient-text">Pergunte à IA</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Descreva seu problema e nosso concierge recomenda o agente ou departamento ideal.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <SmartAgentFinder
                  agentMeta={finderMeta}
                  onHire={handleFinderHire}
                  onPreview={() => {}}
                  hiringSlug={null}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TOP 3 AGENTS — Reduced from 6
          ═══════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("home.agents_badge")}
            </Badge>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
              {t("home.agents_title")} <span className="gradient-text">{t("home.agents_title_hl")}</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">{t("home.agents_desc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {topAgents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div key={agent.key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                  <Link to="/library" className="block h-full">
                    <div className="glass-card rounded-2xl p-8 glass-hover h-full group cursor-pointer relative overflow-hidden">
                      <div className="absolute top-4 right-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/15">
                          <TrendingUp className="h-3 w-3" />
                          {t("home.popular")}
                        </span>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                        <Icon className="h-7 w-7 text-primary/70" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-3 group-hover:text-primary/90 transition-colors">{t(`agents.${agent.key}`)}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm mb-6">{t(`agents.${agent.key}_desc`)}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <span className="text-xl font-display font-bold gradient-text">{agent.price}</span>
                        <span className="text-xs text-muted-foreground">{t("home.per_month")}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
            <Link to="/library">
              <Button variant="outline" size="lg" className="rounded-xl border-border hover:border-primary/20 group text-base px-10 h-12">
                Ver todos os 37+ agentes
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS — 3 steps (was 5)
          ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              {t("home.how_title")} <span className="gradient-text">3 passos</span>
            </h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
            <div className="space-y-10">
              {[
                { icon: Target, title: t("home.how_step1"), desc: t("home.how_step1_desc") },
                { icon: Users, title: t("home.how_step2"), desc: t("home.how_step2_desc") },
                { icon: BarChart3, title: t("home.how_step3"), desc: t("home.how_step3_desc") },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex items-start gap-5 sm:gap-6 group"
                >
                  <div className="relative z-10 shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary/70 group-hover:text-primary transition-colors" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="pt-1 sm:pt-3">
                    <h4 className="font-display font-semibold text-base sm:text-lg mb-1 group-hover:text-primary/90 transition-colors">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SINGLE STRONG TESTIMONIAL
          ═══════════════════════════════════════════════ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass-card rounded-2xl p-10 sm:p-14 relative overflow-hidden text-center">
              <Quote className="h-10 w-10 text-primary/10 mx-auto mb-6" />
              <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium italic mb-8 max-w-2xl mx-auto">
                "Reduzimos 72% dos custos operacionais em 3 meses. Os agentes trabalham 24/7 sem falhar. A integração levou 15 minutos."
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center text-sm font-bold text-primary border border-primary/10">
                  RM
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Rafael Mendes</p>
                  <p className="text-xs text-muted-foreground">CEO, TechNova</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">-72% custos operacionais</span>
              </div>
              <div className="flex gap-1 justify-center mt-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary/80 text-primary/80" />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CTA FINAL — Same as hero for consistency
          ═══════════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] via-primary/[0.02] to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="glass-card rounded-2xl sm:rounded-[2rem] p-8 sm:p-14 md:p-20 gradient-border relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="h-8 w-8 text-primary/70" />
                </div>
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
                  {t("home.cta_ready")} <span className="gradient-text">{t("home.cta_ready_hl")}</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-lg mb-8 max-w-lg mx-auto">{t("home.cta_desc")}</p>
                <Link to="/auth">
                  <Button size="lg" className="glow font-semibold text-base px-12 h-14 rounded-xl group">
                    <Zap className="h-5 w-5 mr-2" />
                    Começar Grátis
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER — Real links, no dead ends
          ═══════════════════════════════════════════════ */}
      <footer className="border-t border-border py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={clauthorLogo} alt="CLAUTHOR" className="w-9 h-9 object-contain mix-blend-lighten" />
              <span className="font-display font-bold text-lg tracking-wider">CLAUTHOR</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-10 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground/80 transition-colors">{t("nav.pricing")}</Link>
              <Link to="/how-it-works" className="hover:text-foreground/80 transition-colors">{t("nav.how_it_works")}</Link>
              <Link to="/library" className="hover:text-foreground/80 transition-colors">Agentes</Link>
              <Link to="/departamentos" className="hover:text-foreground/80 transition-colors">Times de IA</Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-8 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t("home.footer_security_label")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Shield, label: "SSL 256-bit" },
                { icon: Lock, label: t("home.trust_compliant") },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <badge.icon className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[11px] font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-6">
            <p className="text-xs text-muted-foreground">{t("home.footer_copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
