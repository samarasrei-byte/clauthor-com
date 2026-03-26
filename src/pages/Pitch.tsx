import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Bot, Shield, Globe, Headphones, Receipt, Code, Scale, Brain, UserCheck, TrendingUp, Zap, Lock, Users, ArrowRight, MessageCircle, CheckCircle2, Target, Building2, Megaphone, DollarSign, Cpu, BarChart3, Layers, Rocket, Star, Award, Gem, ChevronRight, Network, Briefcase, Activity, ChevronDown, Fingerprint, Timer, LineChart, Crown } from "lucide-react";
import { WORKFORCE, TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS } from "@/data/workforceArchitecture";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import translations, { type PitchLang } from "@/data/pitchTranslations";

const WA_NUMBER = "5511985214895";

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
      setVal((1 - Math.pow(1 - p, 3)) * end);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);
  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-US");
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
};

/* ── Section ── */
const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section ref={ref} id={id} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }} className={`relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 ${className}`}>
      {children}
    </motion.section>
  );
};

/* ── Glass card ── */
const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <motion.div className={`rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 ${hover ? "hover:border-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-500" : ""} ${className}`} whileHover={hover ? { y: -4 } : undefined}>
    {children}
  </motion.div>
);

/* ── Animated bar ── */
const AnimatedBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between text-sm"><span className="text-foreground/70">{label}</span><span className="text-foreground font-mono">{pct}%</span></div>
      <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={inView ? { width: `${pct}%` } : {}} transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>
    </div>
  );
};

/* ── Language Toggle ── */
const LangToggle = ({ lang, setLang }: { lang: PitchLang; setLang: (l: PitchLang) => void }) => (
  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 right-4 z-50 flex rounded-full border border-border/50 bg-card/80 backdrop-blur-xl p-1 shadow-lg">
    {(["en", "pt"] as const).map(l => (
      <button key={l} onClick={() => setLang(l)} className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
        {l === "en" ? "EN" : "PT"}
      </button>
    ))}
  </motion.div>
);

/* ── Investor Chat ── */
const InvestorChat = ({ lang }: { lang: PitchLang }) => {
  const l = translations[lang];
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(0);
  }, [lang]);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const show = () => { i++; setVisibleCount(i); if (i < l.demoConversation.length) setTimeout(show, 2000 + Math.random() * 600); };
    setTimeout(show, 600);
  }, [inView, lang]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [visibleCount]);

  return (
    <div ref={ref} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center"><Bot className="w-4 h-4 text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">{l.demoAgentName}</p><p className="text-[10px] text-primary font-mono uppercase tracking-wider">LIVE</p></div>
      </div>
      <div className="px-4 py-5 space-y-3 max-h-[380px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {l.demoConversation.slice(0, visibleCount).map((msg, i) => (
            <motion.div key={`${lang}-${i}`} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35 }} className={`flex ${msg.role === "investor" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "investor" ? "bg-primary/15 text-foreground/90 rounded-br-md" : "bg-muted/50 border border-border/30 text-foreground/80 rounded-bl-md"}`}>{msg.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleCount < l.demoConversation.length && visibleCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 px-2">
            {[0, 1, 2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: `${j * 0.2}s` }} />)}
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

/* ── Workforce Dept Card ── */
const deptIcons: Record<string, React.ElementType> = {
  marketing: Megaphone, growth: TrendingUp, product: Cpu, sales: Briefcase,
  customer_success: Headphones, finance: DollarSign, operations: Layers,
  security: Shield, engineering: Code, data_analytics: BarChart3, communications: Globe,
  talent: Users, innovation: Brain, it_infrastructure: Network, strategy: Target,
};

const WorkforceDeptCard = ({ dept, index, lang }: { dept: typeof WORKFORCE[0]; index: number; lang: PitchLang }) => {
  const l = translations[lang];
  const [expanded, setExpanded] = useState(false);
  const totalAgents = dept.squads.reduce((s, sq) => s + sq.agents.length, 0);
  const Icon = deptIcons[dept.id] || Building2;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-5 hover:bg-muted/5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
          <div className="text-left">
            <h3 className="font-display font-bold text-foreground">{dept.name}</h3>
            <p className="text-xs text-muted-foreground">{dept.squads.length} {l.squadsLabel} · {totalAgents} {l.agentsLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary hidden sm:flex">{totalAgents} {l.agentsLabel}</Badge>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-border/30 px-5 pb-5">
          <div className="grid gap-3 pt-4">
            {dept.squads.map((squad) => (
              <div key={squad.id} className="p-4 rounded-xl bg-muted/20 border border-border/20">
                <div className="flex items-center justify-between mb-2"><h4 className="text-sm font-semibold text-foreground">{squad.name}</h4><span className="text-[10px] text-muted-foreground font-mono">{squad.agents.length} {l.agentsLabel}</span></div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{squad.mission}</p>
                <div className="flex flex-wrap gap-1.5">
                  {squad.agents.map((agent) => (<span key={agent.slug} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary/80">{agent.name}</span>))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const tocIds = ["overview", "problem", "solution", "traction", "market", "business-model", "unit-economics", "architecture", "moats", "valuation", "round"];

const summaryIcons = [Bot, Network, Building2, Shield, Globe, Brain, Zap, Layers, Fingerprint];
const capIcons = [Headphones, Receipt, Code, Scale, Megaphone, DollarSign, Brain, UserCheck, Building2];
const moatIcons = [Brain, Layers, Network, Timer, Shield, Globe];

/* ══════════════════════════════════════════════════════════ */

const Pitch = () => {
  const [lang, setLang] = useState<PitchLang>("en");
  const l = translations[lang];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const waLink = `https://wa.me/${WA_NUMBER}?text=${l.waText}`;
  const handleTalk = useCallback(() => { window.open(waLink, "_blank"); }, [waLink]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <LangToggle lang={lang} setLang={setLang} />

      {/* HERO */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.12),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(var(--accent-violet)/0.08),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </motion.div>
        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center" style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 mb-8"><Lock className="h-3 w-3 mr-2" />{l.confidential}</Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            {l.heroTitle1}<span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">{l.heroHighlight}</span>{l.heroTitle2}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {l.heroSub(TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS)}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-10 mb-12 max-w-3xl mx-auto">
            {[{ value: l.valuation, label: l.valuationLabel }, { value: l.equity10, label: l.equity10Label }, { value: l.equity20, label: l.equity20Label }, { value: l.grossMargin, label: l.grossMarginLabel }].map((m) => (
              <div key={m.label} className="text-center"><p className="text-2xl md:text-3xl font-display font-bold text-foreground">{m.value}</p><p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{m.label}</p></div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleTalk} className="text-base px-8 gap-2">{l.talkFounder} <ArrowRight className="w-4 h-4" /></Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2" onClick={() => document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })}>{l.viewPitch} <ChevronDown className="w-4 h-4" /></Button>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>

      {/* TOC */}
      <Section id="overview">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10"><p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.3em] mb-3">{l.docIndex}</p><h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">{l.navPitch}</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {l.tocLabels.map((label, i) => (
              <motion.button key={tocIds[i]} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} onClick={() => document.getElementById(tocIds[i])?.scrollIntoView({ behavior: "smooth" })} className="p-3 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                <span className="text-[10px] text-primary/60 font-mono">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{label}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </Section>

      {/* EXECUTIVE SUMMARY */}
      <Section className="bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Crown className="h-4 w-4" />{l.execSummary}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">{l.execTitle}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{l.execSub}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {l.summaryCards.map((card, i) => {
              const Icon = summaryIcons[i];
              const nums = [TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS];
              const title = card.title(nums[i] ?? 0);
              return (
                <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <GlassCard className="h-full">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-primary" /></div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* PROBLEM */}
      <Section id="problem">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Target className="h-4 w-4" />{l.problemBadge}</Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">{l.problemTitle}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-14 leading-relaxed">{l.problemSub}</p>
          <div className="grid md:grid-cols-4 gap-5">
            {l.problemStats.map((m) => (
              <GlassCard key={m.label} hover={false} className="text-center !py-8">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2"><CountUp end={m.value} prefix={m.prefix || ""} suffix={m.suffix} /></p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* SOLUTION */}
      <Section className="bg-muted/20" id="solution">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Brain className="h-4 w-4" />{l.solutionBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">{l.solutionTitle1}<br /><span className="gradient-text">{l.solutionTitle2}</span></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{l.solutionSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-14">
            <GlassCard hover={false} className="border-destructive/20">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-destructive/50" />{l.beforeTitle}</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                {l.beforeItems.map(t => (<div key={t} className="flex items-start gap-2"><span className="text-destructive/60 mt-0.5">{"\u2717"}</span><span>{t}</span></div>))}
              </div>
            </GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03]">
              <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary" />{l.afterTitle}</h3>
              <div className="space-y-3 text-sm text-foreground/80">
                {l.afterItems(TOTAL_WORKFORCE_AGENTS, TOTAL_DEPARTMENTS).map(t => (<div key={t} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>{t}</span></div>))}
              </div>
            </GlassCard>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {l.capabilities.map((title, i) => { const I = capIcons[i]; return (
              <GlassCard key={title} className="flex flex-col items-center gap-2 text-center !p-4"><I className="w-5 h-5 text-primary" /><span className="text-xs font-medium text-foreground">{title}</span></GlassCard>
            ); })}
          </div>
        </div>
      </Section>

      {/* TRACTION */}
      <Section id="traction">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Activity className="h-4 w-4" />{l.tractionBadge}</Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">{l.tractionTitle}</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">{l.tractionSub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS, 13, 96, 10, 5, 5].map((v, i) => (
              <GlassCard key={l.tractionLabels[i]} hover={false} className="text-center !py-8">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary mb-1"><CountUp end={v} suffix={i === 4 ? "%+" : ""} /></p>
                <p className="text-xs text-muted-foreground">{l.tractionLabels[i]}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* MARKET */}
      <Section className="bg-muted/20" id="market">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><TrendingUp className="h-4 w-4" />{l.marketBadge}</Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">{l.marketTitle}</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">{l.marketSub}</p>
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {l.marketStats.map((m) => (
              <GlassCard key={m.label} hover={false} className="text-center !py-10">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2"><CountUp end={m.value} prefix={m.prefix || ""} suffix={m.suffix} decimals={m.decimals || 0} /></p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">{l.marketShareTitle}</h3>
            {[42, 28, 18, 12].map((pct, i) => <AnimatedBar key={l.marketBars[i]} label={l.marketBars[i]} pct={pct} color={i === 0 ? "bg-primary" : i === 1 ? "bg-primary/70" : i === 2 ? "bg-primary/50" : "bg-primary/30"} />)}
          </div>
        </div>
      </Section>

      {/* BUSINESS MODEL */}
      <Section id="business-model">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><BarChart3 className="h-4 w-4" />{l.bizBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">{l.bizTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-5">
              <GlassCard hover={false}><p className="text-sm text-muted-foreground mb-1">{l.model}</p><p className="text-lg font-display font-semibold text-foreground">{l.bizModel}</p><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.bizModelDesc}</p></GlassCard>
              <GlassCard hover={false}><p className="text-sm text-muted-foreground mb-1">{l.bizTicketLabel}</p><p className="text-2xl font-display font-bold text-foreground">{l.bizTicket}<span className="text-base font-normal text-muted-foreground">{l.bizTicketSuffix}</span></p></GlassCard>
              <div className="space-y-3">
                {l.bizFeatures.map((item) => (<div key={item} className="flex items-center gap-2.5 text-sm text-foreground/80"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{item}</div>))}
              </div>
            </div>
            <div className="space-y-4">
              <GlassCard hover={false} className="text-center !py-8"><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{l.bizScenario500}</p><p className="text-3xl md:text-4xl font-display font-bold text-primary">{l.bizScenario500Val.prefix}<CountUp end={l.bizScenario500Val.end} suffix={l.bizScenario500Val.suffix} /><span className="text-base font-normal text-muted-foreground">{l.perMonth}</span></p></GlassCard>
              <GlassCard hover={false} className="text-center !py-8"><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{l.bizScenario1k}</p><p className="text-3xl md:text-4xl font-display font-bold text-primary">{l.bizScenario1kVal.prefix}<CountUp end={l.bizScenario1kVal.end} suffix={l.bizScenario1kVal.suffix} /><span className="text-base font-normal text-muted-foreground">{l.perMonth}</span></p></GlassCard>
              <GlassCard hover={false} className="text-center !py-8"><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{l.bizArrLabel}</p><p className="text-3xl md:text-4xl font-display font-bold text-foreground">{l.bizArrVal.prefix}<CountUp end={l.bizArrVal.end} suffix={l.bizArrVal.suffix} decimals={l.bizArrVal.decimals} /></p></GlassCard>
              <GlassCard hover={false} className="text-center !py-6 border-primary/20 bg-primary/5"><p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{l.bizValuationLabel}</p><p className="text-2xl font-display font-bold gradient-text">{"\u2248"} {l.bizValuationVal}</p></GlassCard>
            </div>
          </div>
        </div>
      </Section>

      {/* UNIT ECONOMICS */}
      <Section className="bg-muted/20" id="unit-economics">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><LineChart className="h-4 w-4" />{l.unitBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">{l.unitTitle1}<span className="gradient-text">{l.unitHighlight}</span></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{l.unitSub}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <GlassCard hover={false} className="border-destructive/20 text-center"><p className="text-[10px] font-mono text-destructive/80 font-bold mb-2">{l.unitHuman}</p><p className="text-xl font-display font-bold text-foreground">{l.unitHumanPrice}</p><p className="text-xs text-muted-foreground mt-1">{l.unitHumanDesc}</p></GlassCard>
            <GlassCard hover={false} className="border-yellow-500/20 text-center"><p className="text-[10px] font-mono text-yellow-500/80 font-bold mb-2">{l.unitChatbot}</p><p className="text-xl font-display font-bold text-foreground">{l.unitChatbotPrice}</p><p className="text-xs text-muted-foreground mt-1">{l.unitChatbotDesc}</p></GlassCard>
            <GlassCard hover={false} className="border-primary/30 bg-primary/[0.03] text-center"><p className="text-[10px] font-mono text-primary font-bold mb-2">{l.unitClauthor}</p><p className="text-xl font-display font-bold text-primary">{l.unitClauthorPrice}</p><p className="text-xs text-muted-foreground mt-1">{l.unitClauthorDesc}</p></GlassCard>
          </div>
          <div className="max-w-lg mx-auto space-y-5">
            {[96, 4, 85].map((pct, i) => <AnimatedBar key={l.unitBars[i]} label={l.unitBars[i]} pct={pct} color={i === 1 ? "bg-destructive/50" : "bg-primary" + (i === 2 ? "/70" : "")} />)}
          </div>
        </div>
      </Section>

      {/* ARCHITECTURE */}
      <Section id="architecture">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Network className="h-4 w-4" />{l.archBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight"><CountUp end={TOTAL_WORKFORCE_AGENTS} /> {l.agentsLabel}. <CountUp end={TOTAL_SQUADS} /> {l.squadsLabel}. <CountUp end={TOTAL_DEPARTMENTS} /> {l.archLabels[2].toLowerCase()}.</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">{l.archSub(TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[TOTAL_WORKFORCE_AGENTS, TOTAL_SQUADS, TOTAL_DEPARTMENTS, 0].map((v, i) => (
              <GlassCard key={l.archLabels[i]} hover={false} className="text-center !py-6">
                <p className="text-3xl font-display font-bold text-primary mb-1">{i === 3 ? l.archEventDriven : <CountUp end={v} />}</p>
                <p className="text-xs text-muted-foreground">{l.archLabels[i]}</p>
              </GlassCard>
            ))}
          </div>
          <div className="space-y-4">{WORKFORCE.map((dept, di) => <WorkforceDeptCard key={dept.id} dept={dept} index={di} lang={lang} />)}</div>
        </div>
      </Section>

      {/* MOATS */}
      <Section className="bg-muted/20" id="moats">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Gem className="h-4 w-4" />{l.moatBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">{l.moatTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {l.moatCards.map((m, i) => {
              const Icon = moatIcons[i];
              const desc = typeof m.desc === "function" ? m.desc(TOTAL_WORKFORCE_AGENTS, TOTAL_DEPARTMENTS, TOTAL_SQUADS) : m.desc;
              return (
                <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <GlassCard className="h-full">
                    <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div><h3 className="font-display font-semibold text-foreground">{m.title}</h3></div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          {/* Competitive */}
          <div className="text-center mb-8"><h3 className="text-xl md:text-2xl font-display font-bold tracking-tight mb-2">{l.compTitle}</h3><p className="text-sm text-muted-foreground max-w-2xl mx-auto">{l.compSub}</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* CrewAI */}
            <GlassCard hover={false} className="border-yellow-500/20">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Code className="w-5 h-5 text-yellow-500" /></div><div><h3 className="font-bold text-foreground">CrewAI</h3><span className="text-[10px] text-yellow-500/80 font-mono uppercase tracking-wider">{l.multiAgentFw}</span></div></div>
              <div className="mb-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l.realStrengths}</p><ul className="space-y-1.5 text-xs">{l.crewAiStrengths.map(t => <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div><p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">{l.criticalLimitations}</p><ul className="space-y-1.5 text-xs">{l.crewAiWeaknesses.map(t => <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div className="mt-3 pt-3 border-t border-border/30"><p className="text-[10px] text-muted-foreground italic">{l.crewAiVerdict}</p></div>
            </GlassCard>
            {/* AutoGen */}
            <GlassCard hover={false} className="border-purple-500/20">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Brain className="w-5 h-5 text-purple-500" /></div><div><h3 className="font-bold text-foreground">AutoGen</h3><span className="text-[10px] text-purple-500/80 font-mono uppercase tracking-wider">{l.msFw}</span></div></div>
              <div className="mb-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l.realStrengths}</p><ul className="space-y-1.5 text-xs">{l.autoGenStrengths.map(t => <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-500 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div><p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">{l.criticalLimitations}</p><ul className="space-y-1.5 text-xs">{l.autoGenWeaknesses.map(t => <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div className="mt-3 pt-3 border-t border-border/30"><p className="text-[10px] text-muted-foreground italic">{l.autoGenVerdict}</p></div>
            </GlassCard>
            {/* ChatGPT */}
            <GlassCard hover={false} className="border-destructive/20">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-destructive" /></div><div><h3 className="font-bold text-foreground">ChatGPT / Assistants</h3><span className="text-[10px] text-destructive/80 font-mono uppercase tracking-wider">{l.passiveTool}</span></div></div>
              <div className="mb-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l.realStrengths}</p><ul className="space-y-1.5 text-xs">{l.chatGptStrengths.map(t => <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-destructive/70 mt-0.5 shrink-0" /><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div><p className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">{l.criticalLimitations}</p><ul className="space-y-1.5 text-xs">{l.chatGptWeaknesses.map(t => <li key={t} className="flex items-start gap-1.5"><span className="text-destructive mt-0.5 text-[10px]">{"\u2717"}</span><span className="text-muted-foreground">{t}</span></li>)}</ul></div>
              <div className="mt-3 pt-3 border-t border-border/30"><p className="text-[10px] text-muted-foreground italic">{l.chatGptVerdict}</p></div>
            </GlassCard>
            {/* CLAUTHOR */}
            <GlassCard hover={false} className="border-primary/30 ring-1 ring-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
              <div className="absolute -top-3 right-4"><Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 gap-1"><Star className="w-3 h-3" /> Enterprise</Badge></div>
              <div className="flex items-center gap-3 mb-4 mt-2"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Layers className="w-5 h-5 text-primary" /></div><div><h3 className="font-bold gradient-text">CLAUTHOR</h3><span className="text-[10px] text-primary/80 font-mono uppercase tracking-wider">{l.orchAutonomy}</span></div></div>
              <div className="mb-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l.clauthorCombines}</p><ul className="space-y-1.5 text-xs">{l.clauthorFeatures.map(t => <li key={t} className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span className="text-foreground">{t}</span></li>)}</ul></div>
              <div className="mt-3 pt-3 border-t border-primary/10"><p className="text-[10px] text-primary/80 font-semibold italic">{l.clauthorVerdict}</p></div>
            </GlassCard>
          </div>

          {/* Self-assessment */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10">
            <GlassCard hover={false} className="border-primary/10 bg-muted/30">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-primary" /></div><div><h3 className="font-display font-bold text-foreground">{l.selfAssessTitle}</h3><p className="text-[10px] text-muted-foreground">{l.selfAssessSub}</p></div></div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div><p className="text-xs font-semibold text-foreground mb-2">{l.risksTitle}</p><ul className="space-y-2 text-xs text-muted-foreground">{l.risks.map(r => <li key={r.bold}><strong className="text-foreground">{r.bold}</strong>{r.text}</li>)}</ul></div>
                <div><p className="text-xs font-semibold text-foreground mb-2">{l.mitigationsTitle}</p><ul className="space-y-2 text-xs text-muted-foreground">{l.mitigations.map(r => <li key={r.bold}><strong className="text-foreground">{r.bold}</strong>{r.text}</li>)}</ul></div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </Section>

      {/* VALUATION */}
      <Section id="valuation">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><Award className="h-4 w-4" />{l.valBadge}</Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">{l.valTitle1}<span className="gradient-text">{l.valHighlight}</span></h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">{l.valSub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <GlassCard hover={false} className="border-border/30"><div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 rounded-full bg-muted-foreground/40" /><h3 className="font-display font-semibold text-muted-foreground">{l.typicalStartup}</h3></div><ul className="space-y-3">{l.typicalItems.map(item => <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />{item}</li>)}</ul></GlassCard>
            <GlassCard hover={false} className="border-primary/20 bg-primary/5"><div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 rounded-full bg-primary" /><h3 className="font-display font-semibold text-primary">{l.clauthorToday}</h3></div><ul className="space-y-3">{l.clauthorItems(TOTAL_WORKFORCE_AGENTS, TOTAL_DEPARTMENTS, TOTAL_SQUADS).map(item => <li key={item} className="flex items-start gap-2 text-sm text-foreground/90"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />{item}</li>)}</ul></GlassCard>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-8 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm text-center">
            <h3 className="font-display text-xl font-bold mb-8 text-foreground">{l.roiTitle}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {l.roiItems.map(item => (<div key={item.label}><p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{item.label}</p><p className="font-display text-xl md:text-2xl font-bold text-foreground">{item.value}</p><p className="text-xs text-primary font-mono mt-1">{item.sub}</p></div>))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* DEMO */}
      <Section className="bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2"><MessageCircle className="h-4 w-4" />{l.demoBadge}</Badge>
          <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">{l.demoTitle}</h2>
          <p className="text-muted-foreground text-sm mb-10">{l.demoSub}</p>
          <InvestorChat lang={lang} />
        </div>
      </Section>

      {/* ROUND */}
      <Section id="round">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 gap-2"><Rocket className="h-4 w-4" />{l.roundBadge}</Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">{l.roundTitle}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-14">
            {l.roundCards.map(item => (<GlassCard key={item.label} hover={false} className="text-center !py-10"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p><p className="text-2xl md:text-3xl font-display font-bold text-foreground">{item.value}</p>{item.sub && <p className="text-xs text-primary font-mono mt-1">{item.sub}</p>}</GlassCard>))}
          </div>
          <div className="max-w-lg mx-auto space-y-5 mb-14">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">{l.capitalUse}</h3>
            {[70, 20, 10].map((pct, i) => <AnimatedBar key={l.capitalBars[i]} label={l.capitalBars[i]} pct={pct} color={i === 0 ? "bg-primary" : i === 1 ? "bg-primary/60" : "bg-primary/30"} />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {l.milestones.map((m, i) => { const icons = [Users, DollarSign, Rocket, Globe]; const I = icons[i]; return (
              <GlassCard key={m.label} hover={false} className="text-center"><I className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-xs text-primary font-mono font-bold mb-1">{m.label}</p><p className="text-sm text-foreground">{m.milestone}</p></GlassCard>
            ); })}
          </div>
        </div>
      </Section>

      {/* VISION */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight mb-8">{l.visionTitle1}<br /><span className="gradient-text glow-text">{l.visionTitle2}</span></h2>
          <div className="flex flex-wrap justify-center gap-3">
            {l.visionSteps.map((step, i) => (<motion.span key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="px-4 py-2 rounded-full border border-border/50 bg-card/30 text-xs text-muted-foreground">{step}</motion.span>))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">{l.ctaTitle1}<br /><span className="gradient-text">{l.ctaTitle2}</span></h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">{l.ctaSub}</p>
            <Button size="lg" onClick={handleTalk} className="text-lg px-10 py-6 h-auto gap-2">{l.talkFounder} <ArrowRight className="w-5 h-5" /></Button>
            <p className="mt-8 text-xs text-muted-foreground/50">{l.ctaConfidential}</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pitch;
