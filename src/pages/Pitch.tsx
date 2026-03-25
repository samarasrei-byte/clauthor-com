import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Bot, Clock, Shield, Globe, Headphones, Receipt, Code, Scale, Brain, UserCheck, TrendingUp, Zap, Lock, Users, ArrowRight, MessageCircle, CheckCircle2, Target, Building2, Megaphone, DollarSign, Cpu, BarChart3, Layers, Rocket, Star, Award, Gem, ChevronRight, Network, Briefcase, Activity, ChevronDown, ExternalLink, Fingerprint, Timer, LineChart, Crown, Flame, Eye } from "lucide-react";
import { WORKFORCE, TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS } from "@/data/workforceArchitecture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WA_NUMBER = "5511985214895";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Gostaria%20de%20conversar%20sobre%20investimento%20na%20CLAUTHOR`;

/* ── Animated counter ── */
const CountUp = ({ end, prefix = "", suffix = "", decimals = 0, duration = 2 }: { end: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * end);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("pt-BR");
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
};

/* ── Section wrapper ── */
const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative py-24 md:py-32 px-6 ${className}`}
    >
      {children}
    </motion.section>
  );
};

/* ── Glass card ── */
const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <motion.div
    className={`rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 ${hover ? "hover:border-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-500" : ""} ${className}`}
    whileHover={hover ? { y: -4 } : undefined}
  >
    {children}
  </motion.div>
);

/* ── Animated bar ── */
const AnimatedBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/70">{label}</span>
        <span className="text-foreground font-mono">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

/* ── Table of Contents ── */
const tocItems = [
  { id: "overview", label: "Visão Geral" },
  { id: "problem", label: "O Problema" },
  { id: "solution", label: "A Solução" },
  { id: "traction", label: "Tração" },
  { id: "market", label: "Mercado" },
  { id: "business-model", label: "Modelo de Negócio" },
  { id: "unit-economics", label: "Unit Economics" },
  { id: "architecture", label: "Arquitetura" },
  { id: "moats", label: "Moats" },
  { id: "valuation", label: "Valuation" },
  { id: "round", label: "Rodada" },
];

/* ── Investor Chat ── */
const investorConversation = [
  { role: "investor" as const, text: "Por que eu deveria investir na CLAUTHOR agora?" },
  { role: "agent" as const, text: "Porque você entra antes da escala com 20% de equity a R$ 1M de valuation. Produto funcional com 200 agentes de IA autônomos, 37 squads, 15 departamentos — tudo operacional. Startups com apenas um deck captam a R$ 5-15M." },
  { role: "investor" as const, text: "Como monetizam?" },
  { role: "agent" as const, text: "SaaS B2B por assinatura. Ticket médio R$ 997/mês por squad. Event-driven = margem bruta de 96%+. Com 1.000 clientes, são R$ 12M/ano em MRR." },
  { role: "investor" as const, text: "Qual o retorno esperado?" },
  { role: "agent" as const, text: "Seed (6-12 meses): valuation R$ 15-25M = 7-12x. Series A: R$ 75-150M = 37-75x. Potencial Exit em 5 anos: R$ 500M+ = 250x+. A rodada é limitada — 20% por R$ 200K." },
];

const InvestorChat = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const show = () => {
      i++;
      setVisibleCount(i);
      if (i < investorConversation.length) setTimeout(show, 2000 + Math.random() * 600);
    };
    setTimeout(show, 600);
  }, [inView]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  return (
    <div ref={ref} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Agente de Relações com Investidores</p>
          <p className="text-[10px] text-primary font-mono uppercase tracking-wider">LIVE</p>
        </div>
      </div>
      <div className="px-4 py-5 space-y-3 max-h-[380px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {investorConversation.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              className={`flex ${msg.role === "investor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "investor"
                    ? "bg-primary/15 text-foreground/90 rounded-br-md"
                    : "bg-muted/50 border border-border/30 text-foreground/80 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleCount < investorConversation.length && visibleCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 px-2">
            {[0, 1, 2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: `${j * 0.2}s` }} />)}
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

/* ── Workforce Department Card ── */
const deptIcons: Record<string, React.ElementType> = {
  marketing: Megaphone, growth: TrendingUp, product: Cpu, sales: Briefcase,
  customer_success: Headphones, finance: DollarSign, operations: Layers,
};

const WorkforceDeptCard = ({ dept, index }: { dept: typeof WORKFORCE[0]; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const totalAgents = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);
  const Icon = deptIcons[dept.id] || Building2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden"
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-5 hover:bg-muted/5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-bold text-foreground">{dept.name}</h3>
            <p className="text-xs text-muted-foreground">{dept.squads.length} squads · {totalAgents} agentes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary hidden sm:flex">{totalAgents} agents</Badge>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border/30 px-5 pb-5">
          <div className="grid gap-3 pt-4">
            {dept.squads.map((squad) => (
              <div key={squad.id} className="p-4 rounded-xl bg-muted/20 border border-border/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">{squad.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-mono">{squad.agents.length} agents</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{squad.mission}</p>
                <div className="flex flex-wrap gap-1.5">
                  {squad.agents.map((agent) => (
                    <span key={agent.slug} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary/80">{agent.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════ */
/* ═══ PITCH PAGE ═══ */
/* ══════════════════════════════════════════════════════════ */

const Pitch = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const handleTalk = useCallback(() => {
    window.open(WA_LINK, "_blank");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* ═══ HERO ═══ */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(var(--accent-violet)/0.08),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </motion.div>

        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 mb-8">
              <Lock className="h-3 w-3 mr-2" />
              Pre-Seed · Documento Confidencial
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight mb-6">
            A infraestrutura que{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">substitui departamentos inteiros</span>{" "}
            por agentes de IA autônomos.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            200 agentes de inteligência artificial autônomos. 37 squads. 15 departamentos. Margem bruta de 96%+. 
            Produto operacional — não é MVP.
          </motion.p>

          {/* Key metrics strip */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12">
            {[
              { value: "R$ 1M", label: "Valuation" },
              { value: "R$ 200K", label: "Captação" },
              { value: "20%", label: "Equity" },
              { value: "96%+", label: "Margem Bruta" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{m.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleTalk} className="text-base px-8 gap-2">
              Falar com o Fundador <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2" onClick={() => document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })}>
              Ver o Pitch <ChevronDown className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>

      {/* ═══ TABLE OF CONTENTS ═══ */}
      <Section id="overview">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.3em] mb-3">Índice do Documento</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Navegue pelo Pitch</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tocItems.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
                className="p-3 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <span className="text-[10px] text-primary/60 font-mono">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{item.label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ EXECUTIVE SUMMARY ═══ */}
      <Section className="bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Crown className="h-4 w-4" />
              Executive Summary
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">Tudo o que já foi construído.</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">Uma visão panorâmica do que torna a CLAUTHOR uma oportunidade irrepetível.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Bot, title: `${TOTAL_WORKFORCE_AGENTS} Agentes de IA Autônomos`, desc: "Cada agente é um especialista treinado para uma função específica — SDR, Copywriter, CFO, DevOps, Jurídico. Todos funcionam hoje." },
              { icon: Network, title: `${TOTAL_SQUADS} Squads Inteligentes`, desc: "Agentes organizados em squads com missão definida. Delegam entre si via orquestração A2A (Agent-to-Agent). Não é chatbot — é operação." },
              { icon: Building2, title: `${TOTAL_DEPARTMENTS} Departamentos`, desc: "Marketing, Growth, Product, Sales, CS, Finance e Operations. Cada departamento é uma unidade autônoma com KPIs próprios." },
              { icon: Shield, title: "Enterprise-Grade Security", desc: "AES-256-GCM, audit trails, LGPD compliance, Row Level Security, rate limiting. Infraestrutura que escala de 1 a 100K+ usuários." },
              { icon: Globe, title: "13 Idiomas Nativos", desc: "Detecção automática de idioma. Pronto para expansão global desde o dia 1. Interface e agentes multilíngues." },
              { icon: Brain, title: "Motor de Autonomia Nível 3", desc: "Policy Engine com 5 portões de segurança. 3 níveis de risco. Memória persistente em 4 camadas. Difícil de replicar." },
              { icon: Zap, title: "Event-Driven Architecture", desc: "Agentes dormem até que um gatilho os acorde. Zero desperdício computacional. Custo real por agente: R$ 8-15/mês." },
              { icon: Layers, title: "Plataforma Completa", desc: "CRM, Kanban, Analytics, Meeting Room, Knowledge Base, Chat, Voice AI, Credential Hub — tudo integrado numa única plataforma." },
              { icon: Fingerprint, title: "Multi-Tenant Isolation", desc: "Cada empresa tem seu ambiente isolado. Dados nunca se cruzam. Compliant com LGPD, GDPR e SOC 2 readiness." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <GlassCard className="h-full">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ O PROBLEMA ═══ */}
      <Section id="problem">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Target className="h-4 w-4" />
            O Problema
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Empresas sangram dinheiro com ineficiência operacional.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
            Departamentos são caros, lentos e impossíveis de escalar. A maior parte do orçamento vai para tarefas repetitivas que IA já resolve melhor.
          </p>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { value: 70, suffix: "%", label: "das tarefas operacionais são automatizáveis" },
              { value: 180, prefix: "R$ ", suffix: "K", label: "custo médio anual por funcionário CLT" },
              { value: 45, suffix: "%", label: "turnover em áreas operacionais" },
              { value: 3, suffix: "h", label: "produtividade real em 8h de CLT" },
            ].map((m) => (
              <GlassCard key={m.label} hover={false} className="text-center !py-8">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
                  <CountUp end={m.value} prefix={m.prefix || ""} suffix={m.suffix} />
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ A SOLUÇÃO ═══ */}
      <Section className="bg-muted/20" id="solution">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Brain className="h-4 w-4" />
              A Solução
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              Não vendemos chatbots.<br />
              <span className="gradient-text">Vendemos departamentos inteiros.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              A CLAUTHOR substitui equipes operacionais por squads de IA coordenados que executam, monitoram e entregam resultados — 24/7.
            </p>
          </div>

          {/* Before/After */}
          <div className="grid md:grid-cols-2 gap-8 mb-14">
            <GlassCard hover={false} className="border-destructive/20">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/50" /> Antes (CLT / Ferramentas)
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {[
                  "5-15 funcionários por departamento (R$ 500K+/ano)",
                  "Turnover de 45% — recontratação constante",
                  "8h/dia, produtivo 3h, indisponível à noite e fds",
                  "Cada ferramenta é um silo isolado",
                  "Meses para onboarding de cada funcionário",
                  "Erros humanos custam receita e reputação",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-destructive/60 mt-0.5">✗</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03]">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" /> Depois (CLAUTHOR)
              </h3>
              <div className="space-y-3 text-sm text-foreground/80">
                {[
                  `${TOTAL_WORKFORCE_AGENTS} agentes = ${TOTAL_DEPARTMENTS} departamentos completos`,
                  "Zero turnover — agentes aprendem e nunca saem",
                  "24/7/365 — event-driven, sem hora extra",
                  "Tudo integrado numa plataforma única",
                  "Setup completo em minutos, não meses",
                  "Consistência e compliance automáticos",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Capabilities grid */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
            {[
              { icon: Headphones, title: "Suporte Omnichannel" },
              { icon: Receipt, title: "Financeiro" },
              { icon: Code, title: "Dev Autônomo" },
              { icon: Scale, title: "Jurídico" },
              { icon: Megaphone, title: "Marketing" },
              { icon: DollarSign, title: "Vendas" },
              { icon: Brain, title: "Orquestração" },
              { icon: UserCheck, title: "Concierge" },
              { icon: Building2, title: "RH & Ops" },
            ].map((s) => (
              <GlassCard key={s.title} className="flex flex-col items-center gap-2 text-center !p-4">
                <s.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{s.title}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ TRAÇÃO ═══ */}
      <Section id="traction">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Activity className="h-4 w-4" />
            Tração Real
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Isso não é uma ideia. É um produto.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Cada número abaixo é real, verificável e operacional — construído antes de qualquer investimento externo.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: TOTAL_WORKFORCE_AGENTS, label: "Agentes Operacionais", suffix: "" },
              { value: TOTAL_SQUADS, label: "Squads com Missão", suffix: "" },
              { value: TOTAL_DEPARTMENTS, label: "Departamentos", suffix: "" },
              { value: 13, label: "Idiomas Suportados", suffix: "" },
              { value: 96, label: "Margem Bruta", suffix: "%+" },
              { value: 10, label: "Camadas de Arquitetura", suffix: "" },
              { value: 5, label: "Portões de Governança", suffix: "" },
              { value: 5, label: "Portões de Segurança", suffix: "" },
            ].map((s) => (
              <GlassCard key={s.label} hover={false} className="text-center !py-8">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ MERCADO ═══ */}
      <Section className="bg-muted/20" id="market">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <TrendingUp className="h-4 w-4" />
            O Mercado
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">A maior mudança operacional da história corporativa.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Quem entra agora captura o ciclo exponencial inteiro.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              { value: 9.5, suffix: "T", prefix: "R$ ", label: "TAM — IA empresarial até 2030", decimals: 1 },
              { value: 35, suffix: "%+", label: "CAGR do setor de automação B2B" },
              { value: 670, suffix: "B", prefix: "R$ ", label: "SAM — SaaS de automação operacional" },
            ].map((m) => (
              <GlassCard key={m.label} hover={false} className="text-center !py-10">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
                  <CountUp end={m.value} prefix={m.prefix || ""} suffix={m.suffix} decimals={m.decimals || 0} />
                </p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Participação por vertical</h3>
            <AnimatedBar label="SaaS B2B / Automação Operacional" pct={42} color="bg-primary" />
            <AnimatedBar label="Atendimento e CX Inteligente" pct={28} color="bg-primary/70" />
            <AnimatedBar label="Vendas e CRM Autônomo" pct={18} color="bg-primary/50" />
            <AnimatedBar label="Compliance e Governança" pct={12} color="bg-primary/30" />
          </div>
        </div>
      </Section>

      {/* ═══ MODELO DE NEGÓCIO ═══ */}
      <Section id="business-model">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <BarChart3 className="h-4 w-4" />
              Modelo de Negócio
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Receita recorrente, previsível e escalável.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Modelo</p>
                <p className="text-lg font-display font-semibold text-foreground">SaaS B2B por assinatura mensal</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Receita previsível (MRR), LTV alto, churn baixo — o produto é a operação da empresa, não uma ferramenta.</p>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Ticket médio</p>
                <p className="text-2xl font-display font-bold text-foreground">R$ 997<span className="text-base font-normal text-muted-foreground">/mês por squad</span></p>
              </GlassCard>
              <div className="space-y-3">
                {[
                  "Receita recorrente mensal (MRR)",
                  "Churn ultra baixo — produto = operação",
                  "Upsell natural: +squads, +departamentos",
                  "Net Revenue Retention > 130% projetado",
                  "Pricing por valor, não por token",
                  "Free-trial → conversão → expansão orgânica",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Cenário · 500 clientes</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">R$ <CountUp end={498} suffix="K" /><span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Cenário · 1.000 clientes</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">R$ <CountUp end={997} suffix="K" /><span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">ARR projetado (1K clientes)</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">R$ <CountUp end={11.96} suffix="M" decimals={2} /></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-6 border-primary/20 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Valuation potencial (5x ARR)</p>
                <p className="text-2xl font-display font-bold gradient-text">≈ R$ <CountUp end={60} suffix="M" /></p>
              </GlassCard>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ UNIT ECONOMICS ═══ */}
      <Section className="bg-muted/20" id="unit-economics">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <LineChart className="h-4 w-4" />
              Unit Economics
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Margem de 96%+ porque agentes{" "}
              <span className="gradient-text">dormem quando não estão trabalhando.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Event-driven architecture: agentes só consomem tokens quando ativados por um gatilho real. 
              Diferente de chatbots 24/7 que queimam compute sem parar.
            </p>
          </div>

          {/* Execution model comparison */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <GlassCard hover={false} className="border-destructive/20 text-center">
              <p className="text-[10px] font-mono text-destructive/80 font-bold mb-2">CLT HUMANO</p>
              <p className="text-xl font-display font-bold text-foreground">R$ 7.900</p>
              <p className="text-xs text-muted-foreground mt-1">8h/dia, produtivo ~3h. Custo fixo mesmo parado.</p>
            </GlassCard>
            <GlassCard hover={false} className="border-yellow-500/20 text-center">
              <p className="text-[10px] font-mono text-yellow-500/80 font-bold mb-2">CHATBOT 24/7</p>
              <p className="text-xl font-display font-bold text-foreground">R$ 200-500</p>
              <p className="text-xs text-muted-foreground mt-1">Roda sem parar. Custo cresce linearmente.</p>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03] text-center">
              <p className="text-[10px] font-mono text-primary font-bold mb-2">CLAUTHOR (EVENT-DRIVEN)</p>
              <p className="text-xl font-display font-bold text-primary">R$ 8-15</p>
              <p className="text-xs text-muted-foreground mt-1">Dorme. Acorda no evento. Entrega. Volta a dormir.</p>
            </GlassCard>
          </div>

          {/* Margin table */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Custo Real por Agente</h4>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: "Tokens/interação", value: "~2.000" },
                  { label: "Interações reais/dia", value: "20-80" },
                  { label: "Tokens/mês por agente", value: "~1.2-4.8M" },
                  { label: "Custo Gemini Flash", value: "R$ 3-12/mês" },
                  { label: "Custo GPT-5 (premium)", value: "R$ 15-50/mês" },
                  { label: "Custo MÁXIMO extremo", value: "R$ 60/mês" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Margem por Tier</h4>
              <div className="space-y-2.5 text-sm">
                {[
                  { tier: "Starter (R$ 497)", cost: "R$ 8-15", margin: "96-97%" },
                  { tier: "Entry (R$ 997)", cost: "R$ 12-25", margin: "97%" },
                  { tier: "Mid (R$ 1.697)", cost: "R$ 20-40", margin: "97-98%" },
                  { tier: "High (R$ 2.497)", cost: "R$ 30-50", margin: "98%" },
                  { tier: "Premium (R$ 4.997)", cost: "R$ 40-60", margin: "98-99%" },
                ].map((item) => (
                  <div key={item.tier} className="flex justify-between items-center p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <span className="text-muted-foreground">{item.tier}</span>
                      <span className="text-[10px] text-muted-foreground/50 ml-2">custo: {item.cost}</span>
                    </div>
                    <span className="font-mono font-bold text-green-500">{item.margin}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom insight */}
          <GlassCard hover={false} className="border-primary/20 bg-primary/5 text-center">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>A margem de 96%+ não é acidente — é engenharia.</strong> Event-driven = custo proporcional ao uso real. 
              Tokens são commodity; o valor está na orquestração, memória, segurança e automação que a CLAUTHOR entrega.
            </p>
          </GlassCard>
        </div>
      </Section>

      {/* ═══ ARCHITECTURE ═══ */}
      <Section id="architecture">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Network className="h-4 w-4" />
              Arquitetura Organizacional
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              <CountUp end={TOTAL_WORKFORCE_AGENTS} /> agentes. <CountUp end={TOTAL_SQUADS} /> squads. <CountUp end={TOTAL_DEPARTMENTS} /> departamentos.
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              Uma empresa inteira de IA organizada hierarquicamente — como uma corporação real, 
              mas que opera 24/7 e custa menos que 1 estagiário CLT.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: TOTAL_WORKFORCE_AGENTS, label: "Agentes Especializados" },
              { value: TOTAL_SQUADS, label: "Squads com Missão" },
              { value: TOTAL_DEPARTMENTS, label: "Departamentos" },
              { value: 0, label: "Execução Contínua", display: "Event-Driven" },
            ].map((s) => (
              <GlassCard key={s.label} hover={false} className="text-center !py-6">
                <p className="text-3xl font-display font-bold text-primary mb-1">
                  {s.display || <CountUp end={s.value} />}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="space-y-4">
            {WORKFORCE.map((dept, di) => (
              <WorkforceDeptCard key={dept.id} dept={dept} index={di} />
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ MOATS ═══ */}
      <Section className="bg-muted/20" id="moats">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Gem className="h-4 w-4" />
              Moats Competitivos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">
              Por que é difícil copiar a CLAUTHOR.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Brain, title: "Motor de Autonomia Proprietário", desc: "3 níveis de risco, Policy Engine com 5 portões, orquestração A2A. Cada agente tem personalidade, memória e capacidade de delegação." },
              { icon: Layers, title: "10 Camadas de Arquitetura", desc: "De infraestrutura a interface: cada camada é um moat. Replicar exige 12-18 meses de engenharia senior dedicada." },
              { icon: Network, title: "Efeito de Rede em Dados", desc: "Cada empresa que usa a plataforma gera dados que melhoram todos os agentes. Mais clientes = agentes mais inteligentes." },
              { icon: Timer, title: "Time-to-Market", desc: "200 agentes operacionais, 15 departamentos, 37 squads. Qualquer concorrente que comece hoje precisa de 12+ meses para chegar aqui." },
              { icon: Shield, title: "Enterprise Security Stack", desc: "AES-256-GCM, RLS, audit trails, LGPD, multi-tenant isolation. Padrão enterprise desde o dia 1 — não um retrofit." },
              { icon: Globe, title: "Globalização Nativa", desc: "13 idiomas com detecção automática. Não é tradução — cada agente opera nativamente no idioma do cliente." },
            ].map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <GlassCard className="h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                      <m.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground">{m.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Competitive comparison — honest data-science view */}
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight mb-2">Análise Competitiva — Visão de Cientista de Dados</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Transparência total. Cada player tem forças reais. A questão é: qual resolve o problema do cliente final?</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* OpenClaw */}
            <GlassCard hover={false} className="border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">OpenClaw</h3>
                  <span className="text-[10px] text-yellow-500/80 font-mono uppercase tracking-wider">Motor de Execução</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Forças reais</p>
                <ul className="space-y-1.5 text-xs">
                  {["Open-source, auditável", "Execução de ferramentas sólida", "Comunidade ativa", "Customização total do motor"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Limitações críticas</p>
                <ul className="space-y-1.5 text-xs">
                  {["Zero orquestração multi-agente nativa", "Sem UI — precisa de dev senior ($8K+/mês)", "Sem Policy Engine ou governança", "Sem CRM/Kanban/Analytics", "Sem multi-tenant ou isolamento", "Cada deploy é um projeto custom"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">✗</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Veredicto: Excelente motor bruto. Mas é um motor — não um carro. O cliente precisa construir tudo ao redor.</p>
              </div>
            </GlassCard>

            {/* Claude Code */}
            <GlassCard hover={false} className="border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Claude Code</h3>
                  <span className="text-[10px] text-purple-500/80 font-mono uppercase tracking-wider">Cérebro de Planejamento</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Forças reais</p>
                <ul className="space-y-1.5 text-xs">
                  {["Raciocínio de nível PhD", "Contexto de 200K tokens", "Melhor code generation do mercado", "Excelente para arquitetura"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Limitações críticas</p>
                <ul className="space-y-1.5 text-xs">
                  {["Não executa — planeja e sugere", "Cada conversa é efêmera (sem memória)", "Sem delegação entre agentes", "Sem workflows ou automações", "Custo por token alto para produção", "Dependência de um único provider"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">✗</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Veredicto: O melhor cérebro do mercado. Mas cérebro sem corpo não executa tarefas empresariais.</p>
              </div>
            </GlassCard>

            {/* ChatGPT / Assistentes */}
            <GlassCard hover={false} className="border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">ChatGPT / Assistentes</h3>
                  <span className="text-[10px] text-destructive/80 font-mono uppercase tracking-wider">Ferramenta Passiva</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Forças reais</p>
                <ul className="space-y-1.5 text-xs">
                  {["Brand recognition global", "GPTs Store com milhares de apps", "Multimodal (voz, imagem, vídeo)", "API robusta e bem documentada"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-destructive/70 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Limitações críticas</p>
                <ul className="space-y-1.5 text-xs">
                  {["Não executa tarefas — só responde", "Sem orquestração A2A", "Sem CRM, pipeline ou Kanban", "Sem multi-agente real (GPTs são isolados)", "Sem segurança enterprise nativa", "Cada conversa é uma ilha"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">✗</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Veredicto: Ótimo assistente pessoal. Mas não substitui um departamento operacional.</p>
              </div>
            </GlassCard>

            {/* CLAUTHOR */}
            <GlassCard hover={false} className="border-primary/30 ring-1 ring-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 gap-1"><Star className="w-3 h-3" /> Enterprise</Badge>
              </div>
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold gradient-text">CLAUTHOR</h3>
                  <span className="text-[10px] text-primary/80 font-mono uppercase tracking-wider">Autonomia Orquestrada</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">O que combina</p>
                <ul className="space-y-1.5 text-xs">
                  {[
                    "Usa Claude como cérebro de planejamento",
                    "Usa OpenClaw como motor de execução",
                    "Orquestração A2A com 200+ agentes de IA autônomos",
                    "Policy Engine + 5 portões de governança",
                    "CRM + Kanban + Analytics nativos",
                    "Multi-tenant + AES-256 + LGPD",
                    "Setup em 5 min — sem dev necessário",
                    "13 idiomas nativos, não traduzidos",
                  ].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span className="text-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-[10px] text-primary/80 font-semibold italic">A CLAUTHOR não compete com ferramentas — ela as orquestra. É a camada que transforma cérebros e motores em departamentos autônomos.</p>
              </div>
            </GlassCard>
          </div>

          {/* Honest self-assessment */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10">
            <GlassCard hover={false} className="border-primary/10 bg-muted/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Auto-avaliação honesta — Riscos & Gaps</h3>
                  <p className="text-[10px] text-muted-foreground">Transparência como diferencial. Todo investidor sofisticado quer saber os riscos.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">⚠️ Riscos identificados</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><strong className="text-foreground">Dependência de LLM providers:</strong> Mitigado com arquitetura agnóstica — circuit breaker + fallback entre Gemini, GPT e Claude.</li>
                    <li><strong className="text-foreground">Tração early-stage:</strong> Produto funcional com 200+ agentes, mas conversão para pagantes ainda precisa ser validada em escala.</li>
                    <li><strong className="text-foreground">Competição de big tech:</strong> Google, Microsoft e OpenAI podem lançar orquestradores. Nosso moat é a verticalização enterprise + speed-to-market.</li>
                    <li><strong className="text-foreground">Unit economics em escala:</strong> Margem de 96% hoje com volume baixo. Com escala, custos de token podem pressionar margem para 80-85%.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">✅ Mitigações em execução</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><strong className="text-foreground">Multi-model routing:</strong> AI Gateway roteia entre 10+ modelos. Sem vendor lock-in. Switch em runtime sem downtime.</li>
                    <li><strong className="text-foreground">Revenue diversification:</strong> SaaS + Marketplace + Token Packs + White-label. 4 fontes de receita desde o dia 1.</li>
                    <li><strong className="text-foreground">Defensibilidade por dados:</strong> Cada cliente gera dados de execução que treinam os agentes. Efeito flywheel que big tech não replica.</li>
                    <li><strong className="text-foreground">Velocidade:</strong> Produto funcional em 3 meses com equipe de 1. Time-to-market é o moat mais difícil de copiar.</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </Section>

      {/* ═══ VALUATION ═══ */}
      <Section id="valuation">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Award className="h-4 w-4" />
              Valuation
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
               R$ 1M de valuation.{" "}
              <span className="gradient-text">Baseado em produto real.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              A maioria das startups capta no pre-seed com apenas um deck. A CLAUTHOR já tem produto funcional, 
              tração real e infraestrutura enterprise-grade.
            </p>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <GlassCard hover={false} className="border-border/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                <h3 className="font-display font-semibold text-muted-foreground">Startup Típica (Pre-Seed)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Apenas deck e protótipo",
                  "0 clientes / 0 tração",
                  "Equipe pequena sem produto",
                  "Valuation: R$ 5-15M",
                  "Sem infraestrutura",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <h3 className="font-display font-semibold text-primary">CLAUTHOR (Hoje)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  `${TOTAL_WORKFORCE_AGENTS} agentes de IA autônomos em ${TOTAL_DEPARTMENTS} departamentos`,
                  `${TOTAL_SQUADS} squads especializados operacionais`,
                  "Infraestrutura enterprise-grade desde o dia 1",
                  "Valuation: R$ 1M (20% por R$ 200K)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* ROI for investor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm text-center"
          >
            <h3 className="font-display text-xl font-bold mb-8 text-foreground">Cenário de retorno para o investidor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Investimento", value: "R$ 200K", sub: "20% equity" },
                { label: "Seed (6-12m)", value: "R$ 15-25M", sub: "7-12x retorno" },
                { label: "Series A", value: "R$ 75-150M", sub: "37-75x retorno" },
                { label: "Exit (5 anos)", value: "R$ 500M+", sub: "250x+ retorno" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="font-display text-xl md:text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-primary font-mono mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ INVESTOR CHAT DEMO ═══ */}
      <Section className="bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <MessageCircle className="h-4 w-4" />
            Live Demo
          </Badge>
          <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">Um agente respondendo dúvidas de investidores.</h2>
          <p className="text-muted-foreground text-sm mb-10">Isso é o que nossos agentes fazem — ao vivo, agora.</p>
          <InvestorChat />
        </div>
      </Section>

      {/* ═══ RODADA ═══ */}
      <Section id="round">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 gap-2">
            <Rocket className="h-4 w-4" />
            Rodada Aberta
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Pre-Seed Aberto</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              { label: "Captando", value: "R$ 200.000" },
              { label: "Equity oferecido", value: "20%" },
              { label: "Valuation", value: "R$ 1.000.000" },
            ].map((item) => (
              <GlassCard key={item.label} hover={false} className="text-center !py-10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{item.value}</p>
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5 mb-14">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Uso do Capital</h3>
            <AnimatedBar label="Crescimento (tráfego, influência, B2B)" pct={70} color="bg-primary" />
            <AnimatedBar label="Infraestrutura e DevOps" pct={20} color="bg-primary/60" />
            <AnimatedBar label="Reserva estratégica" pct={10} color="bg-primary/30" />
          </div>

          {/* Milestones */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Q1", milestone: "1.000 usuários ativos", icon: Users },
              { label: "Q2", milestone: "Revenue positivo", icon: DollarSign },
              { label: "Q3", milestone: "Rodada Seed US$ 1-3M", icon: Rocket },
              { label: "Q4", milestone: "Expansão internacional", icon: Globe },
            ].map(m => (
              <GlassCard key={m.label} hover={false} className="text-center">
                <m.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-primary font-mono font-bold mb-1">{m.label}</p>
                <p className="text-sm text-foreground">{m.milestone}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ VISÃO ═══ */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight mb-8">
            CLAUTHOR não é uma ferramenta.
            <br />
            <span className="gradient-text glow-text">É a camada operacional da nova economia.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Primeiros 1.000 clientes", "Rodada Seed", "Expansão internacional", "Infraestrutura global de agentes"].map((step, i) => (
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-4 py-2 rounded-full border border-border/50 bg-card/30 text-xs text-muted-foreground"
              >
                {step}
              </motion.span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              20% de equity por US$ 50K.<br />
              <span className="gradient-text">A janela fecha com a escala.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              A rodada é limitada. Quem entra agora, captura o maior retorno.
            </p>
            <Button size="lg" onClick={handleTalk} className="text-lg px-10 py-6 h-auto gap-2">
              Falar com o Fundador <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="mt-8 text-xs text-muted-foreground/50">Documento confidencial · Distribuição restrita a potenciais investidores</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pitch;
