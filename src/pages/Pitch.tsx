import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Bot, Clock, Shield, Globe, Headphones, Receipt, Code, Scale, Brain, UserCheck, TrendingUp, Zap, Lock, Users, ArrowRight, MessageCircle, CheckCircle2, Target, Building2, Megaphone, DollarSign, Cpu, BarChart3, Layers, Rocket, Star, Award, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const formatted = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("pt-BR");
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
};

/* ── Glass card ── */
const GlassCard = ({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <motion.div
    className={`rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 ${hover ? "hover:border-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)] transition-all duration-500" : ""} ${className}`}
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

/* ── Investor Agent Chat (auto-plays conversation) ── */
const investorConversation = [
  { role: "investor" as const, text: "Por que eu deveria investir na CLAUTHOR agora?" },
  { role: "agent" as const, text: "Porque estamos no ponto de inflexão. 83 agentes totalmente operacionais, infraestrutura pronta, e um mercado de US$ 1,8 trilhão até 2030. Você entra antes da escala explodir." },
  { role: "investor" as const, text: "Mas o mercado de IA está saturado. Qual o diferencial?" },
  { role: "agent" as const, text: "Ninguém faz o que nós fazemos: substituir departamentos inteiros com squads coordenados de IA. Não vendemos chatbots — vendemos operações completas. Suporte, financeiro, compliance, tudo rodando 24/7." },
  { role: "investor" as const, text: "Como monetizam?" },
  { role: "agent" as const, text: "SaaS B2B com ticket médio de US$ 199/mês por squad. Com 1.000 clientes, são quase US$ 2,4M/ano em receita recorrente. LTV alto, churn baixo." },
  { role: "investor" as const, text: "Mas US$ 500K de valuation não é baixo demais?" },
  { role: "agent" as const, text: "Na verdade, é o ponto ideal para o investidor. Estamos em estágio pre-seed com produto funcional — 83 agentes, 15 departamentos, 4.100+ leads na whitelist. Plataformas similares com apenas um MVP captaram a US$ 2-5M. Entrar a US$ 500K significa capturar o maior upside possível." },
  { role: "investor" as const, text: "Quais são os riscos?" },
  { role: "agent" as const, text: "O risco de NÃO investir é maior. Automação B2B não é tendência — é inevitável. Entrar agora no pre-seed a US$ 500K captura o maior potencial de retorno." },
  { role: "investor" as const, text: "Como eu entro?" },
  { role: "agent" as const, text: "Fale diretamente com o Fundador pelo WhatsApp. A rodada é limitada — 10% de equity por US$ 50K. Cada dia conta." },
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
        setTimeout(show, 2200 + Math.random() * 800);
      }
    };
    setTimeout(show, 800);
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
          <p className="text-[10px] text-primary font-mono uppercase tracking-wider">ONLINE</p>
        </div>
      </div>
      <div className="px-4 py-5 space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
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

/* ── Valuation Defense Card ── */
const ValuationDefense = () => {
  const defenses = [
    {
      icon: Cpu,
      title: "Produto Funcional (não é MVP)",
      desc: "83 agentes autônomos operacionais em 15 departamentos. Plataforma completa com orquestração multi-agente, memória persistente e motor de autonomia Nível 3.",
    },
    {
      icon: Users,
      title: "Tração Massiva",
      desc: "2.000.000+ leads qualificados no banco de dados, com 4.100+ profissionais na whitelist ativa antes do lançamento público. Prova social real de demanda explosiva de mercado.",
    },
    {
      icon: Layers,
      title: "Infraestrutura Enterprise-Grade",
      desc: "Criptografia AES-256-GCM, auditoria completa, LGPD compliance, rate limiting, edge functions serverless. Infraestrutura que escala de 1 a 100K+ usuários.",
    },
    {
      icon: Globe,
      title: "Internacionalização Nativa",
      desc: "13 idiomas suportados nativamente com detecção automática. Pronto para expansão global desde o dia 1.",
    },
    {
      icon: Shield,
      title: "Moats Técnicos",
      desc: "Motor de autonomia proprietário com 3 níveis de risco, orquestração A2A (Agent-to-Agent), e sistema de memória em 4 camadas. Difícil de replicar.",
    },
    {
      icon: TrendingUp,
      title: "Comparativos de Mercado",
      desc: "Startups com apenas um MVP (sem produto funcional) captam a US$ 2-5M de valuation. A CLAUTHOR tem produto completo, tração e infraestrutura — a US$ 500K é uma barganha.",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {defenses.map((d, i) => (
        <motion.div
          key={d.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.1 }}
        >
          <GlassCard className="h-full">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
              <d.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-2">{d.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
};

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
      {/* ═══ 1. HERO ═══ */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(var(--accent-violet)/0.1),transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          {/* Animated particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30"
              style={{ left: `${15 + i * 18}%`, top: `${20 + i * 12}%` }}
              animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            />
          ))}
        </motion.div>

        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" style={{ y: textY }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 mb-6">
              <Lock className="h-3 w-3 mr-2" />
              Pre-Seed · Documento Confidencial
            </Badge>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.08] tracking-tight mb-6">
            Estamos construindo a infraestrutura que{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">substitui departamentos</span>{" "}
            por IA.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            CLAUTHOR é uma plataforma de agentes inteligentes que executa operações completas para empresas, 24 horas por dia, 7 dias por semana.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
            {[
              { icon: Bot, label: "83 agentes operacionais" },
              { icon: Clock, label: "Setup em 5 minutos" },
              { icon: Shield, label: "Segurança Enterprise" },
              { icon: Globe, label: "13 idiomas nativos" },
            ].map((ind) => (
              <GlassCard key={ind.label} className="flex items-center gap-2.5 !p-3 md:!px-5 md:!py-3.5">
                <ind.icon className="w-4 h-4 text-primary" />
                <span className="text-xs md:text-sm font-medium text-foreground/80 whitespace-nowrap">{ind.label}</span>
              </GlassCard>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleTalk} className="text-base px-8 gap-2">
              Falar com o Fundador <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      </div>

      {/* ═══ 2. O PROBLEMA ═══ */}
      <Section>
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Target className="h-4 w-4" />
            O Problema
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">Empresas são inerentemente ineficientes.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Departamentos são caros, lentos e difíceis de escalar. Turnover, erro humano, falta de integração e custos fixos elevados corroem a margem de qualquer negócio.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard hover={false} className="text-center !py-10">
              <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2"><CountUp end={70} suffix="%" /></p>
              <p className="text-sm text-muted-foreground">das tarefas operacionais podem ser automatizadas com IA</p>
            </GlassCard>
            <GlassCard hover={false} className="text-center !py-10">
              <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2">R$ <CountUp end={180} suffix="K" /></p>
              <p className="text-sm text-muted-foreground">custo médio anual por funcionário CLT no Brasil</p>
            </GlassCard>
            <GlassCard hover={false} className="text-center !py-10">
              <p className="text-5xl md:text-6xl font-display font-bold text-primary mb-2"><CountUp end={45} suffix="%" /></p>
              <p className="text-sm text-muted-foreground">de turnover médio em áreas operacionais</p>
            </GlassCard>
          </div>
        </div>
      </Section>

      {/* ═══ 3. A SOLUÇÃO ═══ */}
      <Section className="bg-muted/20">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Brain className="h-4 w-4" />
            A Solução
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Infraestrutura multi-agente coordenada.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">A CLAUTHOR substitui departamentos inteiros por squads de IA especializados.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Headphones, title: "Suporte Omnichannel" },
              { icon: Receipt, title: "Financeiro e Faturamento" },
              { icon: Code, title: "Desenvolvimento Autônomo" },
              { icon: Scale, title: "Compliance e Jurídico" },
              { icon: Brain, title: "Orquestração Inteligente" },
              { icon: UserCheck, title: "Concierge Estratégico" },
              { icon: Megaphone, title: "Marketing e Growth" },
              { icon: DollarSign, title: "Vendas e Prospecção" },
              { icon: Building2, title: "RH e Operações" },
            ].map((s) => (
              <GlassCard key={s.title} className="flex flex-col items-center gap-3 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
                <span className="text-sm font-medium text-foreground">{s.title}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 4. MERCADO ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <TrendingUp className="h-4 w-4" />
            O Mercado
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">A maior mudança operacional da história corporativa.</h2>
          <p className="text-muted-foreground text-lg mb-14 max-w-2xl mx-auto">
            O mercado de IA para automação empresarial cresce exponencialmente. Quem entra agora captura o maior retorno.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { value: 1.8, suffix: "T", prefix: "US$ ", label: "Mercado global de IA até 2030", decimals: 1 },
              { value: 35, suffix: "%+", prefix: "", label: "Crescimento anual do setor", decimals: 0 },
              { value: 850, suffix: "+", prefix: "", label: "Empresas buscando automação B2B", decimals: 0 },
            ].map((m) => (
              <GlassCard key={m.label} hover={false} className="text-center !py-10">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary mb-2"><CountUp end={m.value} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} /></p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Market comparison bars */}
          <div className="max-w-lg mx-auto space-y-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Participação por vertical</h3>
            <AnimatedBar label="SaaS B2B / Automação" pct={42} color="bg-primary" />
            <AnimatedBar label="Atendimento ao cliente" pct={28} color="bg-primary/70" />
            <AnimatedBar label="Vendas e CRM inteligente" pct={18} color="bg-primary/50" />
            <AnimatedBar label="Compliance e governança" pct={12} color="bg-primary/30" />
          </div>
        </div>
      </Section>

      {/* ═══ 5. CHAT DO AGENTE INVESTIDOR ═══ */}
      <Section className="bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <MessageCircle className="h-4 w-4" />
            Demonstração ao Vivo
          </Badge>
          <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">Por que investir na CLAUTHOR?</h2>
          <p className="text-muted-foreground text-sm mb-10">Veja como nosso agente responde as perguntas mais comuns de investidores.</p>
          <InvestorChat />
          <div className="mt-8">
            <Button onClick={handleTalk} className="text-sm gap-2">
              Tire suas dúvidas no WhatsApp <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Section>

      {/* ═══ 6. MODELO DE NEGÓCIO ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <BarChart3 className="h-4 w-4" />
              Modelo de Negócio
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Receita recorrente e previsível.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Ticket médio</p>
                <p className="text-2xl font-display font-bold text-foreground">US$ 199<span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-sm text-muted-foreground mb-1">Modelo</p>
                <p className="text-lg font-display font-semibold text-foreground">SaaS B2B por assinatura</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Receita previsível, LTV alto e expansão natural via upsell de agentes adicionais e departamentos premium.</p>
              </GlassCard>
              <div className="space-y-3">
                {["Receita recorrente mensal (MRR)", "Baixo churn (produto é a operação)", "Upsell natural por departamento", "Pricing por squad = expansão orgânica"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Cenário · 1.000 clientes</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">US$ <CountUp end={199} suffix="K" /><span className="text-base font-normal text-muted-foreground">/mês</span></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Receita anual projetada</p>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">US$ <CountUp end={2.39} suffix="M" decimals={2} /></p>
              </GlassCard>
              <GlassCard hover={false} className="text-center !py-6 border-primary/20 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Valuation potencial (5x receita)</p>
                <p className="text-2xl font-display font-bold gradient-text">≈ US$ <CountUp end={12} suffix="M" /></p>
              </GlassCard>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 7. VALUATION & DEFESA ═══ */}
      <Section className="bg-muted/20" id="valuation">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Award className="h-4 w-4" />
              Valuation Atual
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
              Por que US$ 500K é o valor justo
              <br />
              <span className="gradient-text">neste momento.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              A maioria das startups capta no pre-seed com apenas um deck e uma ideia. A CLAUTHOR já tem produto funcional com 83 agentes, tração real de 4.100+ leads, e infraestrutura enterprise-grade. Veja por que US$ 500K é, na verdade, uma oportunidade única para o investidor.
            </p>
          </div>

          {/* Comparison table */}
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
                  "Valuation: US$ 1-3M",
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
                  "83 agentes autônomos funcionais",
                  "4.100+ leads na whitelist",
                  "15 departamentos completos",
                  "Valuation: US$ 500K (barganha)",
                  "Infraestrutura enterprise-grade",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          <ValuationDefense />

          {/* ROI for investor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm text-center"
          >
            <h3 className="font-display text-xl font-bold mb-6 text-foreground">Cenário de retorno para o investidor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Investimento", value: "US$ 50K", sub: "10% equity" },
                { label: "Valuation Seed (6-12 meses)", value: "US$ 3-5M", sub: "6-10x" },
                { label: "Valuation Série A", value: "US$ 15-30M", sub: "30-60x" },
                { label: "Potencial saída (5 anos)", value: "US$ 50M+", sub: "100x+" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                  <p className="font-display text-xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-primary font-mono mt-1">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══ 8. RODADA ATUAL ═══ */}
      <Section>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary text-xs font-mono uppercase tracking-[0.2em] px-4 py-2 gap-2">
              <Rocket className="h-4 w-4" />
              Rodada Aberta
            </Badge>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Pre-Seed Aberto</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              { label: "Captando", value: "US$ 50.000" },
              { label: "Equity oferecido", value: "10%" },
              { label: "Valuation implícito", value: "US$ 500.000" },
            ].map((item) => (
              <GlassCard key={item.label} hover={false} className="text-center !py-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{item.value}</p>
              </GlassCard>
            ))}
          </div>
          <div className="max-w-lg mx-auto space-y-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">Uso do Capital</h3>
            <AnimatedBar label="Crescimento (tráfego, influência, B2B)" pct={70} color="bg-primary" />
            <AnimatedBar label="Infraestrutura e DevOps" pct={20} color="bg-primary/60" />
            <AnimatedBar label="Reserva estratégica" pct={10} color="bg-primary/30" />
          </div>
        </div>
      </Section>

      {/* ═══ 9. POR QUE CLAUTHOR? — COMPARATIVO MATADOR ═══ */}
      <Section className="bg-muted/20" id="why-clauthor">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
              <Target className="h-4 w-4" />
              Por que a Clauthor?
            </Badge>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight">
              Não somos um chatbot.
              <br />
              <span className="gradient-text glow-text">Somos o departamento inteiro.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Existe uma diferença brutal entre usar uma IA para conversar e ter uma infraestrutura completa que executa, decide e escala autonomamente.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Claude */}
            <GlassCard className="relative overflow-hidden border-destructive/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Claude / ChatGPT</h3>
                  <span className="text-xs text-muted-foreground">$25/mês por usuário</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { ok: false, text: "Apenas chat — zero automação" },
                  { ok: false, text: "Sem pipeline de vendas" },
                  { ok: false, text: "Sem multi-agente ou delegação" },
                  { ok: false, text: "Sem integração com CRM/ERP" },
                  { ok: false, text: "Sem memória entre sessões" },
                  { ok: false, text: "Sem controle de acesso por área" },
                  { ok: false, text: "Sem relatórios ou analytics" },
                  { ok: true, text: "Boa qualidade de resposta" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 text-xs ${item.ok ? "text-green-500" : "text-destructive"}`}>
                      {item.ok ? "✓" : "✗"}
                    </span>
                    <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground italic">
                  "É como ter um estagiário genial que só responde quando você pergunta — mas nunca faz nada sozinho."
                </p>
              </div>
            </GlassCard>

            {/* OpenClaw */}
            <GlassCard className="relative overflow-hidden border-yellow-500/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">OpenClaw / DIY</h3>
                  <span className="text-xs text-muted-foreground">$50+/mês + dev ($5k-15k setup)</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { ok: false, text: "Precisa de desenvolvedor" },
                  { ok: false, text: "Sem interface visual (UI)" },
                  { ok: false, text: "Sem CRM ou gestão de leads" },
                  { ok: false, text: "Sem segurança enterprise" },
                  { ok: false, text: "Sem suporte ou SLA" },
                  { ok: false, text: "Meses para implementar" },
                  { ok: true, text: "Custo de tokens baixo" },
                  { ok: true, text: "Controle total do código" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 text-xs ${item.ok ? "text-green-500" : "text-yellow-500"}`}>
                      {item.ok ? "✓" : "✗"}
                    </span>
                    <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground italic">
                  "É como comprar peças de carro e montar sozinho — funciona, mas leva meses e você precisa ser mecânico."
                </p>
              </div>
            </GlassCard>

            {/* Clauthor */}
            <GlassCard className="relative overflow-hidden border-primary/30 ring-1 ring-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.1)]">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 gap-1">
                  <Star className="w-3 h-3" /> Recomendado
                </Badge>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg gradient-text">CLAUTHOR</h3>
                  <span className="text-xs text-muted-foreground">A partir de R$347/mês por agente</span>
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "83 agentes especializados prontos",
                  "Orquestração Agent-to-Agent (A2A)",
                  "Policy Engine com 5 portões",
                  "CRM + Kanban + Analytics nativo",
                  "Segurança AES-256 + RLS + Anti-injection",
                  "Multi-tenant com isolamento total",
                  "13 idiomas nativos",
                  "Ativo em minutos, não meses",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-primary/20">
                <p className="text-xs text-primary/80 font-medium italic">
                  "É como contratar um departamento inteiro de elite que trabalha 24/7, nunca tira férias e custa menos que um estagiário."
                </p>
              </div>
            </GlassCard>
          </div>

          {/* ROI Killer Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "95.6%", label: "Economia vs CLT", sublabel: "SDR: R$6.750 → R$347" },
              { value: "24/7", label: "Disponibilidade", sublabel: "Zero folgas, zero férias" },
              { value: "83", label: "Agentes prontos", sublabel: "15 departamentos cobertos" },
              { value: "<5min", label: "Time to value", sublabel: "Ativo no mesmo dia" },
            ].map((stat) => (
              <GlassCard key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold gradient-text mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sublabel}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 10. VANTAGEM COMPETITIVA ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary px-4 py-2 gap-2">
            <Gem className="h-4 w-4" />
            Moats Competitivos
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-14 tracking-tight">Vantagem competitiva real.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Bot, text: "83 agentes operacionais" },
              { icon: Users, text: "4.100+ leads na whitelist" },
              { icon: TrendingUp, text: "Estrutura própria de aquisição" },
              { icon: Globe, text: "13 idiomas nativos" },
              { icon: Zap, text: "Escala infinita" },
              { icon: Lock, text: "Infraestrutura segura" },
            ].map((a) => (
              <GlassCard key={a.text} className="flex flex-col items-center gap-3 text-center">
                <a.icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{a.text}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 10. VISÃO ═══ */}
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

      {/* ═══ 11. FINAL CTA ═══ */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Estamos abrindo 10% da empresa para acelerar exponencialmente.</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              A rodada é limitada. Quem entra agora, captura o maior retorno.
            </p>
            <Button size="lg" onClick={handleTalk} className="text-lg px-10 py-6 h-auto gap-2">
              Falar com o Fundador <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="mt-8 text-xs text-muted-foreground/50">Documento confidencial. Distribuição restrita a potenciais investidores.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pitch;
