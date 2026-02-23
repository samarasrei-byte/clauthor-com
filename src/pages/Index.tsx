import { motion, useScroll, useTransform } from "framer-motion";
import SmartAgentFinder from "@/components/library/SmartAgentFinder";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, Zap, ArrowRight,
  Shield, Clock, BarChart3, Sparkles,
  Code, Users, Mail, Briefcase, Search, TrendingUp,
  Play, ChevronRight, Cpu, Globe, Lock,
  Target, Layers, Eye, CheckCircle2, XCircle, Network,
  Headphones, Bot, PenTool, ShoppingCart, Megaphone, LineChart,
  Quote, Timer, Flame
} from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import clauthorLogo from "@/assets/clauthor-logo.png";

const agentIcons = [MessageSquare, DollarSign, Code, Users, Briefcase, Shield];

// Futuristic AI background with neural network effect
const FuturisticBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent rounded-full blur-[120px]" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-primary/[0.02] to-transparent rounded-full blur-[100px]" />
    <motion.div
      animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.03, 0.07, 0.03] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[15%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary/[0.05] blur-[100px]"
    />
    <motion.div
      animate={{ y: [15, -25, 15], x: [10, -15, 10], opacity: [0.02, 0.06, 0.02] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-primary/[0.04] blur-[80px]"
    />
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <motion.line x1="10%" y1="20%" x2="30%" y2="40%" stroke="hsl(266 100% 50%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0 }} />
      <motion.line x1="70%" y1="15%" x2="50%" y2="45%" stroke="hsl(266 100% 50%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.5, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
      <motion.line x1="80%" y1="60%" x2="60%" y2="30%" stroke="hsl(266 100% 50%)" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 0.4, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} />
      {[
        { cx: "10%", cy: "20%" }, { cx: "30%", cy: "40%" }, { cx: "70%", cy: "15%" },
        { cx: "50%", cy: "45%" }, { cx: "80%", cy: "60%" }, { cx: "60%", cy: "30%" },
      ].map((node, i) => (
        <motion.circle key={i} cx={node.cx} cy={node.cy} r="2" fill="hsl(266 100% 50%)"
          animate={{ opacity: [0.1, 0.6, 0.1], r: [1.5, 2.5, 1.5] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </svg>
  </div>
);

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hiringSlug, setHiringSlug] = useState<string | null>(null);

  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);

  const agentKeys = ["customer_service", "billing", "developer", "sdr", "hr", "security"];
  const agentHot = [true, true, true, true, false, false];
  const agentPrices = ["R$ 1.899", "R$ 1.979", "R$ 2.447", "R$ 2.297", "R$ 2.097", "R$ 2.399"];

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

  const featureData = [
    { icon: Zap, key: "autonomous", stat: "100%" },
    { icon: Shield, key: "security", stat: "256bit" },
    { icon: Clock, key: "uptime", stat: "∞" },
    { icon: BarChart3, key: "analytics", stat: "Live" },
  ];

  const testimonials = [
    {
      name: "Rafael Mendes",
      role: "CEO, TechNova",
      quote: "Reduzimos 72% dos custos operacionais em 3 meses. Os agentes trabalham 24/7 sem falhar.",
      avatar: "RM",
    },
    {
      name: "Ana Carolina Silva",
      role: "COO, GrowthLab",
      quote: "O departamento comercial inteiro foi substituído por 4 agentes. Conversão subiu 340%.",
      avatar: "AC",
    },
    {
      name: "Pedro Augusto",
      role: "CTO, DataPulse",
      quote: "A integração levou 15 minutos. Em 1 semana já tinha ROI positivo. Impressionante.",
      avatar: "PA",
    },
  ];

  return (
    <div className="relative">
      <FuturisticBackground />

      {/* URGENCY BANNER — Departamentos */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/10 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <Network className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary animate-pulse shrink-0" />
          <span className="text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Times de IA</span> — <span className="hidden sm:inline">7 departamentos completos, </span>
            <span className="text-primary font-bold">28 agentes</span> <span className="hidden sm:inline">prontos para operar</span>
          </span>
          <Link to="/departamentos">
            <Button size="sm" variant="outline" className="h-6 sm:h-7 text-[9px] sm:text-[10px] border-primary/30 text-primary hover:bg-primary/10 rounded-lg px-2 sm:px-3">
              Montar meu time <ArrowRight className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* HERO SECTION — with social proof */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-32 sm:pt-28 pb-8 overflow-hidden">
        <div className="absolute inset-0 scan-line pointer-events-none" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

        {/* Pulsing AI ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="w-[600px] h-[600px] rounded-full border border-primary/10" />
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.02, 0.06, 0.02] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute inset-0 w-[600px] h-[600px] rounded-full border border-primary/5" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="space-y-8">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <Badge variant="outline" className="px-5 py-2.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary gap-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                {t("home.badge")}
              </Badge>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight">
              <span className="block mb-2 text-foreground">{t("home.title1")}</span>
              <span className="block gradient-text">{t("home.title2")}</span>
              <span className="block text-xl sm:text-3xl md:text-4xl lg:text-5xl text-muted-foreground/70 font-normal mt-3 sm:mt-4">{t("home.title3")}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              {t("home.subtitle")}
              <span className="text-foreground/90 font-semibold"> {t("home.subtitle_highlight")}</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 px-2 sm:px-0">
              <Link to="/departamentos" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-16 rounded-2xl font-display font-bold text-base sm:text-lg text-white overflow-hidden cursor-pointer"
                >
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-violet-600/60 via-purple-400/80 to-violet-600/60 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-purple-500 to-violet-600 bg-[length:300%_100%] animate-gradient-shift rounded-2xl" />
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-500" />
                  <div className="absolute inset-x-4 bottom-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[200%] animate-[scan_3s_linear_infinite]" />
                  </div>
                  <span className="relative z-10 flex items-center gap-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                    <motion.span animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                      <Network className="h-6 w-6 drop-shadow-[0_0_12px_rgba(110,0,255,0.8)]" />
                    </motion.span>
                    <span className="tracking-wide">Monte seu Time de IA</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </motion.button>
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-16 rounded-2xl font-display font-bold text-base sm:text-lg overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-2xl rounded-2xl" />
                  <div className="absolute inset-0 rounded-2xl gradient-border" />
                  <div className="absolute inset-0 rounded-2xl border border-primary/15 group-hover:border-primary/40 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                  <span className="relative z-10 flex items-center gap-3 text-foreground/80 group-hover:text-foreground transition-colors">
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <ShoppingCart className="h-5 w-5 text-primary group-hover:drop-shadow-[0_0_8px_rgba(255,80,80,0.6)] transition-all" />
                    </motion.span>
                    <span className="tracking-wide">Explorar Agentes</span>
                    <ChevronRight className="h-5 w-5 text-primary/50 group-hover:translate-x-2 group-hover:text-primary transition-all duration-300" />
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {/* SOCIAL PROOF — Stats inline no hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-10 max-w-3xl mx-auto"
            >
              {[
                { value: 847, label: "Agentes ativos", suffix: "+", icon: Cpu },
                { value: 126, label: "Ações executadas", suffix: "k", icon: Zap },
                { value: 99.7, label: "Taxa de sucesso", suffix: "%", decimals: 1, icon: TrendingUp },
                { value: 312, label: "Empresas", suffix: "+", icon: Users },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <stat.icon className="h-3.5 w-3.5 text-primary/60" />
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.decimals || 0}
                      className="text-2xl sm:text-3xl font-display font-bold gradient-text"
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground tracking-wide">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="flex flex-wrap items-center justify-center gap-8 pt-4 text-muted-foreground text-sm">
              {[
                { icon: Lock, label: t("home.trust_encrypted") },
                { icon: Shield, label: t("home.trust_compliant") },
                { icon: Cpu, label: t("home.trust_ai") },
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

      {/* UNIFIED AI CONCIERGE — Single discovery tool */}
      <section className="py-24 px-4 relative">
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
                Descreva seu problema ou objetivo e nosso concierge recomenda o agente individual ou departamento completo ideal para você.
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <SmartAgentFinder
                  agentMeta={finderMeta}
                  onHire={handleFinderHire}
                  onPreview={() => {}}
                  hiringSlug={hiringSlug}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AGENTS SHOWCASE */}
      <section className="py-16 sm:py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("home.agents_badge")}
            </Badge>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              {t("home.agents_title")} <span className="gradient-text">{t("home.agents_title_hl")}</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">{t("home.agents_desc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentKeys.map((key, i) => {
              const Icon = agentIcons[i];
              return (
                <motion.div key={key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}>
                  <Link to="/library" className="block h-full">
                    <div className="glass-card rounded-2xl p-8 glass-hover h-full group cursor-pointer relative overflow-hidden">
                      {agentHot[i] && (
                        <div className="absolute top-4 right-4">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/15">
                            <TrendingUp className="h-3 w-3" />
                            {t("home.popular")}
                          </span>
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                        <Icon className="h-7 w-7 text-primary/70" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-3 group-hover:text-primary/90 transition-colors">{t(`agents.${key}`)}</h3>
                      <p className="text-muted-foreground leading-relaxed text-sm mb-6">{t(`agents.${key}_desc`)}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <span className="text-xl font-display font-bold gradient-text">{agentPrices[i]}</span>
                        <span className="text-xs text-muted-foreground">{t("home.per_month")}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-16 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/library">
              <Button variant="outline" size="lg" className="rounded-xl border-border hover:border-primary/20 group text-base px-10 h-12">
                {t("home.agents_view_all")}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/departamentos">
              <Button size="lg" className="rounded-xl glow text-base px-10 h-12 group">
                <Network className="h-4 w-4 mr-2" />
                Ver Times de IA Completos
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS — Compact */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              {t("home.how_title")} <span className="gradient-text">{t("home.how_title_hl")}</span> {t("home.how_title_rest")}
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { icon: Target, title: t("home.how_step1"), desc: t("home.how_step1_desc") },
              { icon: Users, title: t("home.how_step2"), desc: t("home.how_step2_desc") },
              { icon: BarChart3, title: t("home.how_step3"), desc: t("home.how_step3_desc") },
              { icon: Zap, title: t("home.how_step4"), desc: t("home.how_step4_desc") },
              { icon: Shield, title: t("home.how_step5"), desc: t("home.how_step5_desc") },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="glass-card rounded-xl p-6 text-center glass-hover group">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-5 w-5 text-primary/70" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Depoimentos
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Quem usa, <span className="gradient-text">não volta atrás</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
              >
                <div className="glass-card rounded-2xl p-8 glass-hover h-full relative overflow-hidden">
                  <Quote className="h-8 w-8 text-primary/10 absolute top-6 right-6" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center text-sm font-bold text-primary border border-primary/10">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm italic">"{t.quote}"</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary/80 text-primary/80" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 sm:py-40 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] via-primary/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="glass-card rounded-2xl sm:rounded-[2rem] p-6 sm:p-12 md:p-20 gradient-border relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-10">
                  <Sparkles className="h-8 w-8 text-primary/70" />
                </div>
                <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                  {t("home.cta_ready")} <span className="gradient-text">{t("home.cta_ready_hl")}</span>
                </h2>
                <p className="text-muted-foreground text-sm sm:text-lg mb-8 sm:mb-10 max-w-lg mx-auto">{t("home.cta_desc")}</p>
                <Link to="/departamentos">
                  <Button size="lg" className="glow font-semibold text-base px-12 h-14 rounded-xl group">
                    <Network className="h-5 w-5 mr-2" />
                    Montar meu Time de IA
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={clauthorLogo} alt="CLAUTHOR" className="w-9 h-9 object-contain mix-blend-lighten" />
              <span className="font-display font-bold text-lg tracking-wider">CLAUTHOR</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-10 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground/80 transition-colors">{t("home.footer_terms")}</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">{t("home.footer_privacy")}</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">{t("home.footer_contact")}</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">{t("home.footer_blog")}</a>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-8 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t("home.footer_security_label")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Shield, label: "SSL 256-bit", color: "text-primary/60" },
                { icon: Lock, label: t("home.trust_compliant"), color: "text-primary/60" },
                { icon: Shield, label: "SOC 2 Type II", color: "text-emerald-500/60" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                  <span className="text-[11px] font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Visa / Mastercard", "PIX", "Bitcoin", "Ethereum", "USDC"].map((method) => (
                <div key={method} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <span className="text-[11px] font-medium text-muted-foreground">{method}</span>
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
