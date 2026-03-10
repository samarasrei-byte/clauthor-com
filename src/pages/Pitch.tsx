import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Bot, Clock, Shield, Globe, Headphones, Receipt, Code, Scale, Brain, UserCheck, TrendingUp, Zap, Lock, Users, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WA_NUMBER = "5511985214895";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Gostaria%20de%20conversar%20sobre%20investimento%20na%20CLAUTHOR`;

/* ── Animated counter on viewport entry ── */
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

/* ── Glass card ── */
const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <motion.div
    className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 ${hover ? "hover:border-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-500" : ""} ${className}`}
    whileHover={hover ? { y: -4, rotateX: 2, rotateY: -2 } : undefined}
    style={{ transformStyle: "preserve-3d" }}
  >
    {children}
  </motion.div>
);

/* ── Section wrapper with fade-in ── */
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

/* ── Progress bar ── */
const AnimatedBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-foreground/70">{label}</span>
        <span className="text-foreground font-mono">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
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

/* ── Investor Agent Chat (auto-plays conversation) ── */
const investorConversation = [
  { role: "investor" as const, text: "Por que eu deveria investir na CLAUTHOR agora?" },
  { role: "agent" as const, text: "Porque estamos no ponto de inflexão. 83 agentes já operacionais, infraestrutura pronta e um mercado de US$ 1.8T até 2030. Você entra antes da escala explodir." },
  { role: "investor" as const, text: "Mas o mercado de IA está saturado. Qual o diferencial?" },
  { role: "agent" as const, text: "Ninguém faz o que fazemos: substituir departamentos inteiros com squads de IA coordenados. Não vendemos chatbot — vendemos operação completa. Atendimento, financeiro, compliance, tudo rodando 24/7." },
  { role: "investor" as const, text: "Como vocês monetizam?" },
  { role: "agent" as const, text: "SaaS B2B com ticket médio de R$ 997/mês por squad. Com 1.000 clientes, são quase R$ 12M/ano de receita recorrente. LTV alto, churn baixo." },
  { role: "investor" as const, text: "E o risco?" },
  { role: "agent" as const, text: "O risco de não investir é maior. A automação B2B não é tendência — é inevitável. Quem entra agora no pré-seed a R$ 2M de valuation, captura o maior upside possível." },
  { role: "investor" as const, text: "Como entro?" },
  { role: "agent" as const, text: "Fale diretamente com o Founder pelo WhatsApp. A rodada é limitada — 10% de equity para R$ 200K. Cada dia conta." },
];

const InvestorChat = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inView) return;
    const total = investorConversation.length;
    let i = 0;
    const show = () => {
      i++;
      setVisibleCount(i);
      if (i < total) {
        setTimeout(show, 1800 + Math.random() * 800);
      }
    };
    setTimeout(show, 600);
  }, [inView]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  return (
    <div ref={ref} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Agente de Relações com Investidores</p>
          <p className="text-[10px] text-primary font-mono uppercase tracking-wider">ONLINE</p>
        </div>
      </div>
      {/* Messages */}
      <div className="px-4 py-5 space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
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
                    : "bg-white/[0.05] border border-white/[0.06] text-foreground/80 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleCount < investorConversation.length && visibleCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 px-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse [animation-delay:0.4s]" />
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

const Pitch = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const indicators = [
    { icon: Bot, label: "83 agentes operacionais" },
    { icon: Clock, label: "Setup em 5 minutos" },
    { icon: Shield, label: "SOC 2 compliant" },
    { icon: Globe, label: "Multi-idioma nativo" },
  ];

  const solutions = [
    { icon: Headphones, title: "Atendimento Omnichannel" },
    { icon: Receipt, title: "Financeiro & Cobrança" },
    { icon: Code, title: "Desenvolvedor Autônomo" },
    { icon: Scale, title: "Compliance" },
    { icon: Brain, title: "Orquestração Inteligente" },
    { icon: UserCheck, title: "Concierge Estratégico" },
  ];

  const advantages = [
    { icon: Bot, text: "83 agentes já operacionais" },
    { icon: Users, text: "Banco de 200 mil leads" },
    { icon: TrendingUp, text: "Estrutura própria de aquisição" },
    { icon: Globe, text: "Multi-idioma" },
    { icon: Zap, text: "Escala infinita" },
    { icon: Lock, text: "Infraestrutura segura" },
  ];

  const handleTalk = useCallback(() => {
    window.open(WA_LINK, "_blank");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* ═══ 1. HERO ═══ */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(var(--accent-violet)/0.1),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </motion.div>

        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ y: textY }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-6 font-mono">
            Pré-Seed · Documento Confidencial
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            Estamos construindo a infraestrutura que{" "}
            <span className="bg-gradient-to-r from-primary via-accent-violet to-accent-cyan bg-clip-text text-transparent">substitui departamentos</span>{" "}
            por IA.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            A CLAUTHOR é uma plataforma de agentes inteligentes que executa operações completas para empresas — 24/7.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
            {indicators.map((ind) => (
              <GlassCard key={ind.label} className="flex items-center gap-2.5 px-4 py-3 !p-3 md:!px-5 md:!py-3.5">
                <ind.icon className="w-4 h-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-foreground/80 whitespace-nowrap">{ind.label}</span>
              </GlassCard>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleTalk} className="text-base px-8">
              Falar com o Founder <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>

      {/* ═══ 2. O PROBLEMA ═══ */}
      <Section className="bg-white/[0.01]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Empresas são ineficientes por natureza.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Departamentos são caros, lentos e difíceis de escalar.<br />
            Turnover, erro humano, falta de integração e alto custo fixo.
          </p>
          <GlassCard hover={false} className="max-w-md mx-auto text-center !py-10">
            <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2"><CountUp end={70} suffix="%" /></p>
            <p className="text-sm text-muted-foreground">das tarefas operacionais podem ser automatizadas com IA.</p>
          </GlassCard>
        </div>
      </Section>

      {/* ═══ 3. A SOLUÇÃO ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Infraestrutura multiagente coordenada.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">A CLAUTHOR substitui departamentos por squads de IA especializados.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {solutions.map((s) => (
              <GlassCard key={s.title} className="flex flex-col items-center gap-3 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
                <span className="text-sm font-medium">{s.title}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ AGENT INVESTOR CHAT ═══ */}
      <Section className="bg-white/[0.01]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Por que investir na CLAUTHOR?</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-10">Veja como nosso agente responde às perguntas mais comuns de investidores.</p>
          <InvestorChat />
          <div className="mt-8">
            <Button onClick={handleTalk} className="text-sm">
              Tirar suas dúvidas no WhatsApp <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </div>
      </Section>

      {/* ═══ 4. MERCADO ═══ */}
      <Section>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">O maior shift operacional da história corporativa.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: 1.8, suffix: "T", prefix: "US$ ", label: "Mercado global de IA até 2030", decimals: 1 },
              { value: 35, suffix: "%+", prefix: "", label: "Crescimento anual do setor", decimals: 0 },
              { value: 850, suffix: "+", prefix: "", label: "Empresas buscando automação B2B", decimals: 0 },
            ].map((m) => (
              <GlassCard key={m.label} className="text-center !py-10">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2"><CountUp end={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} /></p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 5. MODELO DE NEGÓCIO ═══ */}
      <Section className="bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight text-center">Modelo de receita recorrente.</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Ticket médio</p>
                <p className="text-2xl font-display font-bold">R$ 997<span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <p className="text-muted-foreground text-sm leading-relaxed">SaaS B2B com assinatura mensal por squad. Receita previsível, LTV alto e expansão natural via upsell de agentes adicionais.</p>
            </div>
            <div className="space-y-4">
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Cenário · 1.000 clientes</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">R$ <CountUp end={997} suffix="K" /><span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Receita anual projetada</p>
                <p className="text-3xl md:text-4xl font-display font-bold">R$ <CountUp end={11.96} suffix="M" decimals={2} /></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-6">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Valuation potencial (5x)</p>
                <p className="text-2xl font-display font-bold text-accent-emerald">≈ R$ <CountUp end={60} suffix="M" /></p>
              </GlassCard>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 6. RODADA ATUAL ═══ */}
      <Section>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-widest mb-6">Rodada aberta</motion.div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Pré-Seed Aberto</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              { label: "Captação", value: "R$ 200.000" },
              { label: "Equity ofertado", value: "10%" },
              { label: "Valuation implícito", value: "R$ 2.000.000" },
            ].map((item) => (
              <GlassCard key={item.label} hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-2xl md:text-3xl font-display font-bold">{item.value}</p>
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Uso do Capital</h3>
            <AnimatedBar label="Growth (tráfego, influência, B2B)" pct={70} color="bg-primary" />
            <AnimatedBar label="Infraestrutura" pct={20} color="bg-accent-violet" />
            <AnimatedBar label="Reserva estratégica" pct={10} color="bg-accent-cyan" />
          </div>
        </div>
      </Section>

      {/* ═══ 7. VANTAGEM COMPETITIVA ═══ */}
      <Section className="bg-white/[0.01]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Vantagem competitiva real.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {advantages.map((a) => (
              <GlassCard key={a.text} className="flex flex-col items-center gap-3 text-center">
                <a.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{a.text}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 8. VISÃO ═══ */}
      <Section>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight mb-8">
            A CLAUTHOR não é uma ferramenta.<br />
            <span className="bg-gradient-to-r from-primary to-accent-violet bg-clip-text text-transparent">É a camada operacional da nova economia.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Primeiro 1.000 clientes", "Rodada Seed", "Expansão internacional", "Infraestrutura global de agentes"].map((step) => (
              <span key={step} className="px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-muted-foreground">{step}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 9. CTA FINAL ═══ */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-8 tracking-tight">Estamos abrindo 10% da empresa para acelerar exponencialmente.</h2>
          <Button size="lg" onClick={handleTalk} className="text-lg px-10 py-6 h-auto">
            Falar com o Founder <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="mt-8 text-xs text-muted-foreground/50">Documento confidencial. Distribuição restrita a potenciais investidores.</p>
        </div>
      </section>
    </div>
  );
};

export default Pitch;
