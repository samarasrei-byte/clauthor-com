import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Bot, Clock, Shield, Globe, Headphones, Receipt, Code, Scale, Brain, UserCheck, TrendingUp, Zap, Lock, Users, ArrowRight, MessageCircle, CheckCircle2, Target, Building2, Megaphone, DollarSign, Cpu, BarChart3, Layers, Rocket, Star, Award, Gem, ChevronRight, Network, Briefcase, Activity, ChevronDown, ExternalLink, Fingerprint, Timer, LineChart, Crown, Flame, Eye } from "lucide-react";
import { WORKFORCE, TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS } from "@/data/workforceArchitecture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WA_NUMBER = "5511985214895";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=I'd%20like%20to%20discuss%20investing%20in%20CLAUTHOR`;

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

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-US");
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
      className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 ${className}`}
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
  { id: "overview", label: "Overview" },
  { id: "problem", label: "The Problem" },
  { id: "solution", label: "The Solution" },
  { id: "traction", label: "Traction" },
  { id: "market", label: "Market" },
  { id: "business-model", label: "Business Model" },
  { id: "unit-economics", label: "Unit Economics" },
  { id: "architecture", label: "Architecture" },
  { id: "moats", label: "Moats" },
  { id: "valuation", label: "Valuation" },
  { id: "round", label: "Round" },
];

/* ── Investor Chat ── */
const investorConversation = [
  { role: "investor" as const, text: "Why should I invest in CLAUTHOR now?" },
  { role: "agent" as const, text: "Because you get in before scale. Two options: $100K for 10% or $200K for 20% \u2014 $1M valuation based on a real product. 200 autonomous AI agents, 53 squads, 15 departments \u2014 all operational. Startups with just a deck raise at $5-15M." },
  { role: "investor" as const, text: "How do you monetize?" },
  { role: "agent" as const, text: "B2B SaaS by subscription. Average ticket $197/mo per squad. Event-driven = 96%+ gross margin. With 1,000 clients, that's $2.4M/yr in MRR." },
  { role: "investor" as const, text: "What's the expected return?" },
  { role: "agent" as const, text: "Seed (6-12 months): valuation $3-5M = 7-12x. Series A: $15-30M = 37-75x. Potential Exit in 5 years: $100M+ = 250x+." },
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
          <p className="text-sm font-semibold text-foreground">Investor Relations Agent</p>
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
  security: Shield, engineering: Code, data_analytics: BarChart3, communications: Globe,
  talent: Users, innovation: Brain, it_infrastructure: Network, strategy: Target,
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
            <p className="text-xs text-muted-foreground">{dept.squads.length} squads · {totalAgents} agents</p>
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
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </motion.div>

        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center" style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 mb-8">
              <Lock className="h-3 w-3 mr-2" />
              Pre-Seed · Confidential Document
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            The infrastructure that{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">replaces entire departments</span>{" "}
            with autonomous AI agents.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {TOTAL_WORKFORCE_AGENTS} autonomous AI agents. {TOTAL_SQUADS} squads. {TOTAL_DEPARTMENTS} departments. 96%+ gross margin. 
            Operational product — not an MVP.
          </motion.p>

          {/* Key metrics strip */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-10 mb-12 max-w-3xl mx-auto">
            {[
              { value: "$1M", label: "Valuation" },
              { value: "$100K", label: "10% Equity" },
              { value: "$200K", label: "20% Equity" },
              { value: "96%+", label: "Gross Margin" },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{m.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleTalk} className="text-base px-8 gap-2">
              Talk to the Founder <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2" onClick={() => document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })}>
              View the Pitch <ChevronDown className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>

      {/* ═══ TABLE OF CONTENTS ═══ */}
      <Section id="overview">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.3em] mb-3">Document Index</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Navigate the Pitch</h2>
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
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">Everything that has been built.</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">A panoramic view of what makes CLAUTHOR an unrepeatable opportunity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Bot, title: `${TOTAL_WORKFORCE_AGENTS} Autonomous AI Agents`, desc: "Each agent is a specialist trained for a specific function \u2014 SDR, Copywriter, CFO, DevOps, Legal. All operational today." },
              { icon: Network, title: `${TOTAL_SQUADS} Intelligent Squads`, desc: "Agents organized into squads with defined missions. They delegate to each other via A2A (Agent-to-Agent) orchestration. Not a chatbot \u2014 it's operations." },
              { icon: Building2, title: `${TOTAL_DEPARTMENTS} Departments`, desc: "Marketing, Growth, Product, Sales, CS, Finance & Operations. Each department is an autonomous unit with its own KPIs." },
              { icon: Shield, title: "Enterprise-Grade Security", desc: "AES-256-GCM, audit trails, LGPD/GDPR compliance, Row Level Security, rate limiting. Infrastructure that scales from 1 to 100K+ users." },
              { icon: Globe, title: "13 Native Languages", desc: "Automatic language detection. Ready for global expansion from day 1. Multilingual interface and agents." },
              { icon: Brain, title: "Level 3 Autonomy Engine", desc: "Policy Engine with 5 security gates. 3 risk levels. Persistent memory in 4 layers. Extremely hard to replicate." },
              { icon: Zap, title: "Event-Driven Architecture", desc: "Agents sleep until a trigger wakes them. Zero computational waste. Real cost per agent: $2-3/month." },
              { icon: Layers, title: "Complete Platform", desc: "CRM, Kanban, Analytics, Meeting Room, Knowledge Base, Chat, Voice AI, Credential Hub \u2014 all integrated in a single platform." },
              { icon: Fingerprint, title: "Multi-Tenant Isolation", desc: "Each company has its own isolated environment. Data never crosses. Compliant with LGPD, GDPR, and SOC 2 readiness." },
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

      {/* ═══ THE PROBLEM ═══ */}
      <Section id="problem">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Target className="h-4 w-4" />
            The Problem
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Companies bleed money on operational inefficiency.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
            Departments are expensive, slow, and impossible to scale. Most of the budget goes to repetitive tasks that AI already solves better.
          </p>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { value: 70, suffix: "%", label: "of operational tasks are automatable" },
              { value: 85, prefix: "$", suffix: "K", label: "average annual cost per employee" },
              { value: 45, suffix: "%", label: "turnover in operational areas" },
              { value: 3, suffix: "h", label: "real productivity in an 8h workday" },
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

      {/* ═══ THE SOLUTION ═══ */}
      <Section className="bg-muted/20" id="solution">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Brain className="h-4 w-4" />
              The Solution
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              We don't sell chatbots.<br />
              <span className="gradient-text">We sell entire departments.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              CLAUTHOR replaces operational teams with coordinated AI squads that execute, monitor, and deliver results \u2014 24/7.
            </p>
          </div>

          {/* Before/After */}
          <div className="grid md:grid-cols-2 gap-8 mb-14">
            <GlassCard hover={false} className="border-destructive/20">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/50" /> Before (Traditional / Tools)
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {[
                  "5-15 employees per department ($500K+/year)",
                  "45% turnover \u2014 constant rehiring",
                  "8h/day, productive 3h, unavailable nights & weekends",
                  "Each tool is an isolated silo",
                  "Months to onboard each employee",
                  "Human errors cost revenue and reputation",
                ].map(t => (
                  <div key={t} className="flex items-start gap-2">
                    <span className="text-destructive/60 mt-0.5">{"\u2717"}</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03]">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" /> After (CLAUTHOR)
              </h3>
              <div className="space-y-3 text-sm text-foreground/80">
                {[
                  `${TOTAL_WORKFORCE_AGENTS} agents = ${TOTAL_DEPARTMENTS} complete departments`,
                  "Zero turnover \u2014 agents learn and never leave",
                  "24/7/365 \u2014 event-driven, no overtime",
                  "Everything integrated in a single platform",
                  "Complete setup in minutes, not months",
                  "Automatic consistency and compliance",
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Headphones, title: "Omnichannel Support" },
              { icon: Receipt, title: "Finance" },
              { icon: Code, title: "Autonomous Dev" },
              { icon: Scale, title: "Legal" },
              { icon: Megaphone, title: "Marketing" },
              { icon: DollarSign, title: "Sales" },
              { icon: Brain, title: "Orchestration" },
              { icon: UserCheck, title: "Concierge" },
              { icon: Building2, title: "HR & Ops" },
            ].map((s) => (
              <GlassCard key={s.title} className="flex flex-col items-center gap-2 text-center !p-4">
                <s.icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-foreground">{s.title}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ TRACTION ═══ */}
      <Section id="traction">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Activity className="h-4 w-4" />
            Real Traction
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">This is not an idea. It's a product.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Every number below is real, verifiable, and operational \u2014 built before any external investment.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: TOTAL_WORKFORCE_AGENTS, label: "Operational Agents", suffix: "" },
              { value: TOTAL_SQUADS, label: "Mission-Driven Squads", suffix: "" },
              { value: TOTAL_DEPARTMENTS, label: "Departments", suffix: "" },
              { value: 13, label: "Supported Languages", suffix: "" },
              { value: 96, label: "Gross Margin", suffix: "%+" },
              { value: 10, label: "Architecture Layers", suffix: "" },
              { value: 5, label: "Governance Gates", suffix: "" },
              { value: 5, label: "Security Gates", suffix: "" },
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

      {/* ═══ MARKET ═══ */}
      <Section className="bg-muted/20" id="market">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <TrendingUp className="h-4 w-4" />
            The Market
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">The biggest operational shift in corporate history.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            Those who enter now capture the entire exponential cycle.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {[
              { value: 1.8, suffix: "T", prefix: "$", label: "TAM \u2014 Enterprise AI by 2030", decimals: 1 },
              { value: 35, suffix: "%+", label: "CAGR of B2B automation sector" },
              { value: 130, suffix: "B", prefix: "$", label: "SAM \u2014 Operational automation SaaS" },
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
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Market share by vertical</h3>
            <AnimatedBar label="B2B SaaS / Operational Automation" pct={42} color="bg-primary" />
            <AnimatedBar label="Intelligent CX & Support" pct={28} color="bg-primary/70" />
            <AnimatedBar label="Autonomous Sales & CRM" pct={18} color="bg-primary/50" />
            <AnimatedBar label="Compliance & Governance" pct={12} color="bg-primary/30" />
          </div>
        </div>
      </Section>

      {/* ═══ BUSINESS MODEL ═══ */}
      <Section id="business-model">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <BarChart3 className="h-4 w-4" />
              Business Model
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Recurring, predictable, and scalable revenue.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Model</p>
                <p className="text-lg font-display font-semibold text-foreground">B2B SaaS by monthly subscription</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Predictable revenue (MRR), high LTV, low churn \u2014 the product IS the company's operations, not just a tool.</p>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Average ticket</p>
                <p className="text-2xl font-display font-bold text-foreground">$197<span className="text-base font-normal text-muted-foreground">/month per squad</span></p>
              </GlassCard>
              <div className="space-y-3">
                {[
                  "Monthly Recurring Revenue (MRR)",
                  "Ultra-low churn \u2014 product = operations",
                  "Natural upsell: +squads, +departments",
                  "Net Revenue Retention > 130% projected",
                  "Value-based pricing, not per-token",
                  "Free-trial \u2192 conversion \u2192 organic expansion",
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
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Scenario · 500 clients</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">$<CountUp end={98} suffix="K" /><span className="text-base font-normal text-muted-foreground">/month</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Scenario · 1,000 clients</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">$<CountUp end={197} suffix="K" /><span className="text-base font-normal text-muted-foreground">/month</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Projected ARR (1K clients)</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">$<CountUp end={2.36} suffix="M" decimals={2} /></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-6 border-primary/20 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Potential valuation (5x ARR)</p>
                <p className="text-2xl font-display font-bold gradient-text">{"\u2248"} $<CountUp end={12} suffix="M" /></p>
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
              96%+ margin because agents{" "}
              <span className="gradient-text">sleep when they're not working.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Event-driven architecture: agents only consume tokens when activated by a real trigger. 
              Unlike 24/7 chatbots that burn compute non-stop.
            </p>
          </div>

          {/* Execution model comparison */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <GlassCard hover={false} className="border-destructive/20 text-center">
              <p className="text-[10px] font-mono text-destructive/80 font-bold mb-2">HUMAN EMPLOYEE</p>
              <p className="text-xl font-display font-bold text-foreground">$4,500</p>
              <p className="text-xs text-muted-foreground mt-1">8h/day, productive ~3h. Fixed cost even when idle.</p>
            </GlassCard>
            <GlassCard hover={false} className="border-yellow-500/20 text-center">
              <p className="text-[10px] font-mono text-yellow-500/80 font-bold mb-2">24/7 CHATBOT</p>
              <p className="text-xl font-display font-bold text-foreground">$50-100</p>
              <p className="text-xs text-muted-foreground mt-1">Runs non-stop. Cost grows linearly.</p>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03] text-center">
              <p className="text-[10px] font-mono text-primary font-bold mb-2">CLAUTHOR AGENT</p>
              <p className="text-xl font-display font-bold text-primary">$2-3</p>
              <p className="text-xs text-muted-foreground mt-1">Event-driven. Only runs when triggered. Near-zero idle cost.</p>
            </GlassCard>
          </div>

          <div className="max-w-lg mx-auto space-y-5">
            <AnimatedBar label="Gross margin (event-driven)" pct={96} color="bg-primary" />
            <AnimatedBar label="Infrastructure cost" pct={4} color="bg-destructive/50" />
            <AnimatedBar label="LTV/CAC ratio (projected)" pct={85} color="bg-primary/70" />
          </div>
        </div>
      </Section>

      {/* ═══ ARCHITECTURE / WORKFORCE ═══ */}
      <Section id="architecture">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Network className="h-4 w-4" />
              Organizational Architecture
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              <CountUp end={TOTAL_WORKFORCE_AGENTS} /> agents. <CountUp end={TOTAL_SQUADS} /> squads. <CountUp end={TOTAL_DEPARTMENTS} /> departments.
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              An entire AI company organized hierarchically \u2014 like a real corporation, 
              but operating 24/7 and costing less than one junior employee.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: TOTAL_WORKFORCE_AGENTS, label: "Specialized Agents" },
              { value: TOTAL_SQUADS, label: "Mission-Driven Squads" },
              { value: TOTAL_DEPARTMENTS, label: "Departments" },
              { value: 0, label: "Continuous Execution", display: "Event-Driven" },
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
              Competitive Moats
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">
              Why it's hard to copy CLAUTHOR.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: Brain, title: "Proprietary Autonomy Engine", desc: "3 risk levels, Policy Engine with 5 gates, A2A orchestration. Each agent has personality, memory, and delegation capabilities." },
              { icon: Layers, title: "10-Layer Architecture", desc: "From infrastructure to interface: each layer is a moat. Replicating requires 12-18 months of dedicated senior engineering." },
              { icon: Network, title: "Data Network Effects", desc: "Every company using the platform generates data that improves all agents. More clients = smarter agents." },
              { icon: Timer, title: "Time-to-Market", desc: `${TOTAL_WORKFORCE_AGENTS} operational agents, ${TOTAL_DEPARTMENTS} departments, ${TOTAL_SQUADS} squads. Any competitor starting today needs 12+ months to get here.` },
              { icon: Shield, title: "Enterprise Security Stack", desc: "AES-256-GCM, RLS, audit trails, LGPD/GDPR, multi-tenant isolation. Enterprise standard from day 1 \u2014 not a retrofit." },
              { icon: Globe, title: "Native Globalization", desc: "13 languages with automatic detection. Not translation \u2014 each agent operates natively in the client's language." },
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

          {/* Competitive comparison */}
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight mb-2">Competitive Analysis \u2014 Data Science View</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Full transparency. Each player has real strengths. The question is: which one solves the end customer's problem?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CrewAI */}
            <GlassCard hover={false} className="border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">CrewAI</h3>
                  <span className="text-[10px] text-yellow-500/80 font-mono uppercase tracking-wider">Multi-Agent Framework</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Real strengths</p>
                <ul className="space-y-1.5 text-xs">
                  {["Open-source, active community", "Basic agent orchestration", "LangChain integration", "Good documentation"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Critical limitations</p>
                <ul className="space-y-1.5 text-xs">
                  {["No native UI \u2014 build everything yourself", "No Policy Engine or governance", "No CRM/Kanban/Analytics", "No multi-tenant or isolation", "Limited to simple workflows", "Each deploy is a custom project"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Verdict: Good framework for devs. But the client needs to be technical and build the entire stack.</p>
              </div>
            </GlassCard>

            {/* AutoGen */}
            <GlassCard hover={false} className="border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">AutoGen</h3>
                  <span className="text-[10px] text-purple-500/80 font-mono uppercase tracking-wider">Microsoft Framework</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Real strengths</p>
                <ul className="space-y-1.5 text-xs">
                  {["Backed by Microsoft", "Multi-agent conversation", "Model flexibility", "Good for prototyping"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Critical limitations</p>
                <ul className="space-y-1.5 text-xs">
                  {["Doesn't execute \u2014 plans and talks", "No native persistent memory", "No real hierarchical delegation", "No production workflows", "Steep learning curve", "No UI or dashboard"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Verdict: Good for research and POCs. But needs a lot of work to become a product.</p>
              </div>
            </GlassCard>

            {/* ChatGPT / Assistants */}
            <GlassCard hover={false} className="border-destructive/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">ChatGPT / Assistants</h3>
                  <span className="text-[10px] text-destructive/80 font-mono uppercase tracking-wider">Passive Tool</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Real strengths</p>
                <ul className="space-y-1.5 text-xs">
                  {["Global brand recognition", "GPTs Store with thousands of apps", "Multimodal (voice, image, video)", "Robust and well-documented API"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-destructive/70 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Critical limitations</p>
                <ul className="space-y-1.5 text-xs">
                  {["Doesn't execute tasks \u2014 only responds", "No A2A orchestration", "No CRM, pipeline, or Kanban", "No real multi-agent (GPTs are isolated)", "No native enterprise security", "Each conversation is an island"].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground italic">Verdict: Great personal assistant. But it doesn't replace an operational department.</p>
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
                  <span className="text-[10px] text-primary/80 font-mono uppercase tracking-wider">Orchestrated Autonomy</span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">What it combines</p>
                <ul className="space-y-1.5 text-xs">
                  {[
                    "Proprietary AI Planner for strategic planning",
                    "Proprietary Execution Engine for execution",
                    "A2A orchestration with 200+ autonomous AI agents",
                    "Policy Engine + 5 governance gates",
                    "Native CRM + Kanban + Analytics",
                    "Multi-tenant + AES-256 + LGPD/GDPR",
                    "Setup in 5 min \u2014 no dev required",
                    "13 native languages, not translated",
                  ].map(t => (
                    <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span className="text-foreground">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-[10px] text-primary/80 font-semibold italic">CLAUTHOR doesn't compete with tools \u2014 it orchestrates them. It's the layer that transforms brains and engines into autonomous departments.</p>
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
                  <h3 className="font-display font-bold text-foreground">Honest Self-Assessment \u2014 Risks & Gaps</h3>
                  <p className="text-[10px] text-muted-foreground">Transparency as a differentiator. Every sophisticated investor wants to know the risks.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{"\u26A0\uFE0F"} Identified risks</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><strong className="text-foreground">LLM provider dependency:</strong> Mitigated with model-agnostic architecture \u2014 circuit breaker + fallback between Gemini, GPT, and Claude.</li>
                    <li><strong className="text-foreground">Early-stage traction:</strong> Functional product with 200+ agents, but paid conversion still needs scale validation.</li>
                    <li><strong className="text-foreground">Big tech competition:</strong> Google, Microsoft, and OpenAI may launch orchestrators. Our moat is enterprise verticalization + speed-to-market.</li>
                    <li><strong className="text-foreground">Unit economics at scale:</strong> 96% margin today at low volume. At scale, token costs may compress margin to 80-85%.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">{"\u2705"} Mitigations in progress</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li><strong className="text-foreground">Multi-model routing:</strong> AI Gateway routes between 10+ models. No vendor lock-in. Runtime switch with zero downtime.</li>
                    <li><strong className="text-foreground">Revenue diversification:</strong> SaaS + Marketplace + Token Packs + White-label. 4 revenue sources from day 1.</li>
                    <li><strong className="text-foreground">Data defensibility:</strong> Each client generates execution data that trains the agents. Flywheel effect that big tech can't replicate.</li>
                    <li><strong className="text-foreground">Speed:</strong> Functional product in 3 months with a team of 1. Time-to-market is the hardest moat to copy.</li>
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
               $1M valuation.{" "}
              <span className="gradient-text">Based on a real product.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              Most startups raise at pre-seed with just a deck. CLAUTHOR already has a functional product, 
              real traction, and enterprise-grade infrastructure.
            </p>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <GlassCard hover={false} className="border-border/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                <h3 className="font-display font-semibold text-muted-foreground">Typical Startup (Pre-Seed)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Just a deck and prototype",
                  "0 clients / 0 traction",
                  "Small team with no product",
                  "Valuation: $5-15M",
                  "No infrastructure",
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
                <h3 className="font-display font-semibold text-primary">CLAUTHOR (Today)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  `${TOTAL_WORKFORCE_AGENTS} autonomous AI agents across ${TOTAL_DEPARTMENTS} departments`,
                  `${TOTAL_SQUADS} specialized operational squads`,
                  "Enterprise-grade infrastructure from day 1",
                  "Valuation: $1M (10% for $100K or 20% for $200K)",
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
            <h3 className="font-display text-xl font-bold mb-8 text-foreground">Return scenario for the investor</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: "Option 1", value: "$100K", sub: "10% equity" },
                { label: "Option 2", value: "$200K", sub: "20% equity" },
                { label: "Seed (6-12mo)", value: "$3-5M", sub: "7-12x return" },
                { label: "Series A", value: "$15-30M", sub: "37-75x return" },
                { label: "Exit (5 years)", value: "$100M+", sub: "250x+ return" },
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
          <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">An agent answering investor questions.</h2>
          <p className="text-muted-foreground text-sm mb-10">This is what our agents do \u2014 live, right now.</p>
          <InvestorChat />
        </div>
      </Section>

      {/* ═══ ROUND ═══ */}
      <Section id="round">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 gap-2">
            <Rocket className="h-4 w-4" />
            Open Round
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Pre-Seed Open</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-14">
            {[
              { label: "Option 1", value: "$100,000", sub: "10% equity" },
              { label: "Option 2", value: "$200,000", sub: "20% equity" },
              { label: "Valuation", value: "$1,000,000", sub: "Based on real product" },
              { label: "Max dilution", value: "20%", sub: "Founder retains control" },
            ].map((item) => (
              <GlassCard key={item.label} hover={false} className="text-center !py-10">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{item.value}</p>
                {item.sub && <p className="text-xs text-primary font-mono mt-1">{item.sub}</p>}
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5 mb-14">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Use of Capital</h3>
            <AnimatedBar label="Growth (traffic, influence, B2B)" pct={70} color="bg-primary" />
            <AnimatedBar label="Infrastructure & DevOps" pct={20} color="bg-primary/60" />
            <AnimatedBar label="Strategic reserve" pct={10} color="bg-primary/30" />
          </div>

          {/* Milestones */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Q1", milestone: "1,000 active users", icon: Users },
              { label: "Q2", milestone: "Revenue positive", icon: DollarSign },
              { label: "Q3", milestone: "Seed Round $3-5M", icon: Rocket },
              { label: "Q4", milestone: "International expansion", icon: Globe },
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

      {/* ═══ VISION ═══ */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight mb-8">
            CLAUTHOR is not a tool.
            <br />
            <span className="gradient-text glow-text">It's the operational layer of the new economy.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["First 1,000 clients", "Seed Round", "International expansion", "Global agent infrastructure"].map((step, i) => (
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
               $100K for 10% or $200K for 20%.<br />
              <span className="gradient-text">The window closes with scale.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              The round is limited. Those who enter now capture the highest return.
            </p>
            <Button size="lg" onClick={handleTalk} className="text-lg px-10 py-6 h-auto gap-2">
              Talk to the Founder <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="mt-8 text-xs text-muted-foreground/50">Confidential document · Distribution restricted to potential investors</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pitch;
