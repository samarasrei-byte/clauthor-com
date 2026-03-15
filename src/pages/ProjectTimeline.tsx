import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Users, Clock, Zap, CheckCircle2, AlertTriangle,
  Rocket, Code2, Shield, ChevronDown, ChevronUp, ArrowLeft,
  Sparkles, Target, Cpu, Bot, DollarSign, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Timeline Data ───
interface TimelineStep {
  id: number;
  phase: string;
  title: string;
  date: string;
  status: "done" | "current" | "pending";
  description: string;
  details?: string[];
  icon: React.ReactNode;
  metric?: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 1,
    phase: "FASE 01",
    title: "Arquitetura & Fundação",
    date: "Semana 1-2 · Janeiro 2026",
    status: "done",
    description: "Design system, estrutura de banco de dados multi-tenant, autenticação, sistema de roles e permissões.",
    details: [
      "✅ 32 tabelas no banco com RLS policies",
      "✅ Sistema multi-tenant com isolamento de dados",
      "✅ Autenticação com verificação de email",
      "✅ Design system dark/light com tokens semânticos",
    ],
    icon: <Shield className="h-5 w-5" />,
    metric: "32 tabelas",
  },
  {
    id: 2,
    phase: "FASE 02",
    title: "Motor de Agentes IA",
    date: "Semana 3-4 · Janeiro 2026",
    status: "done",
    description: "Criação do sistema de agentes com tiers, templates, orquestração A2A e memória conversacional.",
    details: [
      "✅ 200 agentes especializados catalogados",
      "✅ 37 squads inteligentes configurados",
      "✅ 7 departamentos estruturados",
      "✅ Sistema Agent-to-Agent (A2A) com delegação recursiva",
      "✅ Memória persistente por agente e por squad",
    ],
    icon: <Bot className="h-5 w-5" />,
    metric: "200 agentes",
  },
  {
    id: 3,
    phase: "FASE 03",
    title: "Dashboard & Command Center",
    date: "Semana 5-6 · Fevereiro 2026",
    status: "done",
    description: "Dashboard completo com KPIs, timeline ao vivo, feed de atividades, sistema de notificações e onboarding imersivo.",
    details: [
      "✅ KPIs em tempo real com Supabase Realtime",
      "✅ Thor Live Guide — onboarding com IA guia",
      "✅ Neural Waveform Visualizer (SVG radial)",
      "✅ Smart Activity Feed com filtros",
      "✅ Sistema de créditos e tokens com alertas automáticos",
    ],
    icon: <Target className="h-5 w-5" />,
    metric: "15+ componentes",
  },
  {
    id: 4,
    phase: "FASE 04",
    title: "Integrações & Edge Functions",
    date: "Semana 7-8 · Fevereiro 2026",
    status: "done",
    description: "30+ edge functions serverless, integrações com PayPal, ElevenLabs, WhatsApp, OpenClaw e sistema de credenciais.",
    details: [
      "✅ 30+ Edge Functions (Deno/TypeScript)",
      "✅ PayPal Subscriptions API integrado",
      "✅ ElevenLabs TTS — voz neural para Thor",
      "✅ WhatsApp Business API webhook",
      "✅ Credential Manager com criptografia",
      "✅ Firecrawl para web scraping",
    ],
    icon: <Zap className="h-5 w-5" />,
    metric: "30+ functions",
  },
  {
    id: 5,
    phase: "FASE 05",
    title: "UX Premium & i18n",
    date: "Semana 9-10 · Março 2026",
    status: "done",
    description: "Polimento de UX, internacionalização em 13 idiomas, sistema de voz, glassmorphism e micro-animações.",
    details: [
      "✅ 13 idiomas suportados (i18n completo)",
      "✅ Glassmorphism + Neural UI no Thor",
      "✅ Framer Motion em 50+ componentes",
      "✅ Voice Activity Detection (WebRTC)",
      "✅ Audio Spectrum Visualizer",
      "✅ Responsive — mobile-first",
    ],
    icon: <Sparkles className="h-5 w-5" />,
    metric: "13 idiomas",
  },
  {
    id: 6,
    phase: "FASE 06",
    title: "Marketplace & Monetização",
    date: "Semana 10-11 · Março 2026",
    status: "done",
    description: "Marketplace de agentes, sistema de precificação por tier, cupons, histórico de pagamentos e planos de créditos.",
    details: [
      "✅ Marketplace com sistema de aprovação",
      "✅ 5 tiers de preço (R$497 → R$4.997)",
      "✅ Sistema de cupons com redemptions",
      "✅ Checkout com PayPal Subscriptions",
      "✅ Histórico de pagamentos completo",
    ],
    icon: <DollarSign className="h-5 w-5" />,
    metric: "5 tiers",
  },
  {
    id: 7,
    phase: "FASE 07",
    title: "Claude Code & ElevenLabs",
    date: "Março 2026",
    status: "current",
    description: "Integração com Claude Code para raciocínio estratégico e ElevenLabs para voz neural do Thor — as duas peças finais para o MVP ficar 100%.",
    details: [
      "⚡ Claude Code — cérebro de planejamento e orquestração",
      "⚡ ElevenLabs — voz neural multilíngue para o Thor",
      "⚡ Últimas integrações antes do lançamento",
    ],
    icon: <Cpu className="h-5 w-5" />,
    metric: "Falta pouco",
  },
  {
    id: 8,
    phase: "FASE 08",
    title: "Claude Platform — Cérebro de Planejamento",
    date: "Março 2026",
    status: "pending",
    description: "Integrar a Claude Platform (platform.claude.com) como cérebro estratégico para orquestração de alto nível, separando inteligência (Claude) de execução (Gemini/GPT). Responsável: Gabriel.",
    details: [
      "🔮 Dual-model: Claude para planejamento, Gemini para execução",
      "🔮 Raciocínio estratégico em cadeia para tarefas complexas",
      "🔮 Auto-avaliação e feedback loop",
      "🔮 Integração com platform.claude.com/dashboard",
      "👤 Responsável: Gabriel — Auditoria, análise e gestão admin",
    ],
    icon: <Brain className="h-5 w-5" />,
    metric: "Próximo",
  },
  {
    id: 9,
    phase: "FASE 09",
    title: "Lançamento MVP 🚀",
    date: "17 de Março de 2026 — Terça-feira",
    status: "pending",
    description: "Deploy oficial do MVP completo com agentes autônomos reais. Lançamento marcado para terça-feira, 17 de março.",
    details: [
      "🚀 200 agentes operacionais com IA real",
      "🚀 Orquestração autônoma 24/7",
      "🚀 Custo estimado: ~R$290/mês para infraestrutura",
      "🚀 Margem bruta projetada: 96-99%",
      "👤 Guilherme — Desenvolvimento, lançamento, software, UX/UI, prospecção de leads",
      "👤 Gabriel — Auditoria, análise da plataforma, gestão do admin",
    ],
    icon: <Rocket className="h-5 w-5" />,
    metric: "17/03",
  },
];

// ─── Stats ───
const PROJECT_STATS = [
  { label: "Agentes Criados", value: "200", icon: <Bot className="h-5 w-5" /> },
  { label: "Squads Inteligentes", value: "37", icon: <Users className="h-5 w-5" /> },
  { label: "Edge Functions", value: "30+", icon: <Code2 className="h-5 w-5" /> },
  { label: "Horas de Trabalho", value: "900+", icon: <Clock className="h-5 w-5" /> },
];

// ─── Step Card ───
const TimelineCard = ({ step, index }: { step: TimelineStep; index: number }) => {
  const [isOpen, setIsOpen] = useState(step.status === "current");

  const statusColor = {
    done: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    current: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    pending: "text-muted-foreground border-border/20 bg-muted/10",
  };

  const statusLabel = {
    done: "Concluído",
    current: "Em Progresso",
    pending: "Próximo",
  };

  const dotColor = {
    done: "bg-emerald-500 shadow-[0_0_12px_hsl(142_71%_45%/0.5)]",
    current: "bg-amber-500 shadow-[0_0_12px_hsl(38_92%_50%/0.5)] animate-pulse",
    pending: "bg-muted-foreground/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="relative pl-10 md:pl-16 pb-8 last:pb-0"
    >
      {/* Timeline line */}
      {index < TIMELINE_STEPS.length - 1 && (
        <div className={cn(
          "absolute left-[18px] md:left-[30px] top-8 bottom-0 w-px",
          step.status === "done" ? "bg-emerald-500/30" : "bg-border/20"
        )} />
      )}

      {/* Timeline dot */}
      <div className={cn(
        "absolute left-3 md:left-6 top-2 w-3.5 h-3.5 rounded-full border-2 border-background z-10",
        dotColor[step.status]
      )} />

      {/* Card */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group cursor-pointer rounded-2xl border p-5 transition-all duration-300",
          "hover:shadow-[0_8px_40px_hsl(0_0%_0%/0.3)]",
          step.status === "current"
            ? "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent"
            : step.status === "done"
            ? "border-emerald-500/10 bg-card/60 hover:border-emerald-500/20"
            : "border-border/10 bg-card/30 opacity-70 hover:opacity-100"
        )}
        style={{
          backdropFilter: "blur(20px) saturate(1.2)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
              statusColor[step.status]
            )}>
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  {step.phase}
                </span>
                <span className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full font-medium",
                  statusColor[step.status]
                )}>
                  {statusLabel[step.status]}
                </span>
              </div>
              <h3 className="text-sm font-semibold mt-1">{step.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {step.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step.metric && (
              <span className="text-[10px] font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded-lg hidden sm:block">
                {step.metric}
              </span>
            )}
            {step.details && (
              isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <p className="text-[12px] text-muted-foreground/80 mt-2 leading-relaxed">
          {step.description}
        </p>

        {/* Expandable details */}
        <AnimatePresence>
          {isOpen && step.details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/10 space-y-1.5">
                {step.details.map((detail, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-[11px] text-foreground/70 leading-relaxed"
                  >
                    {detail}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Main Page ───
const ProjectTimeline = () => {
  const completedSteps = TIMELINE_STEPS.filter(s => s.status === "done").length;
  const totalSteps = TIMELINE_STEPS.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />

        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-8">
          {/* Back nav */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao Dashboard
          </Link>

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                ● EM CONSTRUÇÃO
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Projeto CoAutor
              <span className="block text-primary">— Timeline de Desenvolvimento</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
              Acompanhe em tempo real cada etapa da construção da plataforma de IA corporativa mais ambiciosa do Brasil. 200 agentes. 37 squads. 12h por dia. 2 meses e meio de trabalho intenso.
            </p>
          </motion.div>

          {/* Progress ring + stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8"
          >
            {/* Circular progress */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted)/0.15)" strokeWidth="6" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPct / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{progressPct}%</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">
                <span className="text-2xl font-bold text-primary">{completedSteps}</span>
                <span className="text-muted-foreground"> / {totalSteps} etapas</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {totalSteps - completedSteps} etapas restantes para o MVP
              </p>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
          >
            {PROJECT_STATS.map((stat, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/10 bg-card/40 backdrop-blur-lg p-3 text-center"
              >
                <div className="flex justify-center text-primary/60 mb-1.5">{stat.icon}</div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Horizontal step pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide"
          >
            {TIMELINE_STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap border shrink-0 transition-all",
                  step.status === "done"
                    ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5"
                    : step.status === "current"
                    ? "border-amber-500/20 text-amber-400 bg-amber-500/5"
                    : "border-border/10 text-muted-foreground bg-muted/5"
                )}
              >
                {step.status === "done" && <CheckCircle2 className="h-3 w-3" />}
                {step.status === "current" && <AlertTriangle className="h-3 w-3" />}
                {step.title}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Timeline cards */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {TIMELINE_STEPS.map((step, i) => (
          <TimelineCard key={step.id} step={step} index={i} />
        ))}

        {/* Cost callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-10 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Custo do MVP — Surpreendentemente Baixo</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                Toda a infraestrutura para rodar 200 agentes de IA com orquestração autônoma 24/7 custa em torno de <span className="text-primary font-bold">R$ 290/mês</span>. Isso inclui banco de dados, edge functions, AI gateway, storage e autenticação.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Margem bruta: 96-99%
                </span>
                <span className="text-[9px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Modelo event-driven
                </span>
                <span className="text-[9px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Zero servidor dedicado
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Work dedication callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-4 rounded-2xl border border-border/10 bg-card/40 p-6"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">Dedicação — 12h/dia por 2 meses e meio</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Este projeto foi construído com dedicação integral — 12 horas por dia, 7 dias por semana, durante mais de 2 meses e meio. Totalizando mais de 900 horas de desenvolvimento puro, incluindo arquitetura, backend, frontend, UX, integrações e testes.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Team callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Equipe — Responsabilidades</h3>
              <div className="space-y-2">
                <div className="text-[12px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">Guilherme</span> — Desenvolvimento completo, lançamento, software, design UX/UI, prospecção de leads. Responsável por toda a construção técnica e visual da plataforma.
                </div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">
                  <span className="text-foreground font-semibold">Gabriel</span> — Auditoria e análise da plataforma, gestão do painel admin, integração com Claude Platform.
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  🚀 Lançamento: Terça-feira, 17 de Março de 2026
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
