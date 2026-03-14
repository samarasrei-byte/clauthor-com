import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, Zap, GitBranch, Layers, Terminal,
  Eye, Database, Workflow, Bot, Server, HardDrive,
  Network, ArrowRight, ChevronDown, Code2, CheckCircle2,
  Play, Pause, MessageSquare, Sparkles, Clock, FileCode,
  FolderOpen, TestTube, BookOpen, Search, Wrench, Globe,
  Shield, BarChart3, Users, Lightbulb, MousePointerClick
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  })
};

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`py-20 sm:py-28 px-4 sm:px-6 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionTag = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-4 block">
    {children}
  </span>
);

const Divider = () => (
  <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>
);

const FlowArrow = () => (
  <div className="flex justify-center py-2">
    <div className="w-px h-6 bg-gradient-to-b from-primary/40 to-primary/10 relative">
      <ChevronDown className="h-3 w-3 text-primary/50 absolute -bottom-1.5 -left-[5px]" strokeWidth={1.5} />
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, label, sublabel, accent = false, pulse = false, onClick }: {
  icon: any; label: string; sublabel?: string; accent?: boolean; pulse?: boolean; onClick?: () => void;
}) => (
  <motion.div
    variants={fadeUp}
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      onClick ? "cursor-pointer hover:scale-[1.02]" : ""
    } ${
      accent
        ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
        : "border-border/40 bg-card/40"
    } ${pulse ? "animate-pulse-glow" : ""}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-primary/10" : "bg-muted/60"}`}>
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
    {onClick && <MousePointerClick className="h-3 w-3 text-muted-foreground/40 ml-auto" strokeWidth={1.5} />}
  </motion.div>
);

// ── Analogia interativa ──
const AnalogyCard = ({ emoji, title, analogy, technical, isOpen, onToggle }: {
  emoji: string; title: string; analogy: string; technical: string; isOpen: boolean; onToggle: () => void;
}) => (
  <Card
    className={`p-5 border-border/30 bg-card/40 cursor-pointer transition-all duration-300 hover:border-primary/20 ${isOpen ? "border-primary/20 bg-primary/[0.02]" : ""}`}
    onClick={onToggle}
  >
    <div className="flex items-start gap-3">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{analogy}</p>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/20">
                <p className="font-mono text-[10px] text-primary/60 uppercase tracking-wider mb-1">Tecnicamente</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{technical}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ChevronDown className={`h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} strokeWidth={1.5} />
    </div>
  </Card>
);

// ── Simulação de execução ──
const simulationSteps = [
  {
    agent: "Thor",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    messages: [
      "📥 Tarefa recebida: \"Criar módulo de pagamentos\"",
      "🔍 Analisando contexto do sistema...",
      "📋 Classificando: prioridade alta, departamento: fintech",
      "🧠 Encaminhando para Claude Code planejar...",
    ]
  },
  {
    agent: "Claude Code",
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10",
    messages: [
      "📖 Lendo repositório... 847 arquivos encontrados",
      "🏗️ Plano de execução criado:",
      "   1. Criar src/modules/payments/",
      "   2. Implementar PaymentService.ts",
      "   3. Criar PaymentController.ts",
      "   4. Adicionar testes unitários",
      "   5. Atualizar rotas e documentação",
      "✅ Plano validado. Enviando para OpenClaw executar.",
    ]
  },
  {
    agent: "OpenClaw",
    icon: Cpu,
    color: "text-accent-emerald",
    bgColor: "bg-accent-emerald/10",
    messages: [
      "⚡ Iniciando execução paralela...",
      "📁 mkdir src/modules/payments/ ✓",
      "📝 Criando PaymentService.ts... 127 linhas ✓",
      "📝 Criando PaymentController.ts... 89 linhas ✓",
      "📝 Criando payment.test.ts... 45 linhas ✓",
      "🧪 Executando testes... 12/12 passando ✓",
      "📚 Docs atualizados ✓",
    ]
  },
  {
    agent: "Claude Code",
    icon: CheckCircle2,
    color: "text-primary",
    bgColor: "bg-primary/10",
    messages: [
      "🔍 Revisando código gerado...",
      "✅ Lint: 0 erros, 0 warnings",
      "✅ Tipagem TypeScript: correto",
      "✅ Cobertura de testes: 94%",
      "🎉 Módulo de pagamentos criado com sucesso!",
    ]
  },
];

const LiveSimulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<{ step: number; msg: number }[]>([]);

  const advance = useCallback(() => {
    setVisibleMessages(prev => {
      const next = [...prev, { step: currentStep, msg: currentMessage }];
      return next;
    });

    const step = simulationSteps[currentStep];
    if (currentMessage < step.messages.length - 1) {
      setCurrentMessage(prev => prev + 1);
    } else if (currentStep < simulationSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setCurrentMessage(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, currentMessage]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(advance, 600);
    return () => clearTimeout(timer);
  }, [isPlaying, advance]);

  const reset = () => {
    setCurrentStep(0);
    setCurrentMessage(0);
    setVisibleMessages([]);
    setIsPlaying(false);
  };

  const start = () => {
    reset();
    setTimeout(() => setIsPlaying(true), 100);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          onClick={isPlaying ? () => setIsPlaying(false) : start}
          size="sm"
          variant={isPlaying ? "outline" : "default"}
          className="gap-2"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying ? "Pausar" : visibleMessages.length > 0 ? "Reiniciar" : "Rodar simulação"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {visibleMessages.length > 0
            ? `${visibleMessages.length} / ${simulationSteps.reduce((a, s) => a + s.messages.length, 0)} ações`
            : "Clique para ver a IA em ação"
          }
        </span>
      </div>

      <Card className="p-0 border-border/30 bg-card/30 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/20">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">clauthor-simulation.terminal</span>
          {isPlaying && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              <span className="font-mono text-[10px] text-accent-emerald">live</span>
            </div>
          )}
        </div>

        {/* Terminal body */}
        <div className="p-4 sm:p-5 max-h-[400px] overflow-y-auto font-mono text-xs space-y-1 min-h-[200px]">
          {visibleMessages.length === 0 && (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground/40">
              <div className="text-center">
                <Terminal className="h-8 w-8 mx-auto mb-3 opacity-30" strokeWidth={1} />
                <p className="text-[11px]">Clique "Rodar simulação" para começar</p>
              </div>
            </div>
          )}

          {simulationSteps.map((step, si) => {
            const stepMessages = visibleMessages.filter(v => v.step === si);
            if (stepMessages.length === 0) return null;

            return (
              <div key={si} className="mb-3">
                <div className="flex items-center gap-2 mb-1.5 mt-2 first:mt-0">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${step.bgColor}`}>
                    <step.icon className={`h-3 w-3 ${step.color}`} strokeWidth={1.5} />
                  </div>
                  <span className={`font-semibold text-[11px] ${step.color}`}>{step.agent}</span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>
                {stepMessages.map((v, mi) => (
                  <motion.div
                    key={`${si}-${mi}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-muted-foreground pl-7 py-0.5 leading-relaxed"
                  >
                    {step.messages[v.msg]}
                  </motion.div>
                ))}
              </div>
            );
          })}

          {isPlaying && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 h-4 bg-primary/60 ml-7"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

// ── Clickable architecture node detail ──
const architectureDetails: Record<string, { title: string; desc: string; stats: string[] }> = {
  "Thor": {
    title: "Thor · Orquestrador",
    desc: "Recebe todas as requisições, classifica por prioridade e departamento, e distribui para o agente ou camada certa. Pense nele como o CEO que delega tudo.",
    stats: ["Latência média: 120ms", "Uptime: 99.97%", "Tasks/dia: ~2,400"]
  },
  "Claude Code": {
    title: "Claude Code · Cérebro",
    desc: "O modelo de IA que pensa. Ele lê repositórios inteiros, planeja a arquitetura, gera código e faz code review. É como ter um CTO que nunca dorme.",
    stats: ["Context window: 200K tokens", "Acurácia: 94.2%", "Modelo: Claude 3.5 Sonnet"]
  },
  "OpenClaw": {
    title: "OpenClaw · Motor de Execução",
    desc: "O runtime que transforma planos em ações reais. Ele abre arquivos, roda comandos, cria pastas e executa testes. É o braço que faz acontecer.",
    stats: ["Agents paralelos: até 12", "Filesystem: full access", "Execuções/hora: ~180"]
  },
  "88 Agents": {
    title: "88 Agentes Especializados",
    desc: "Cada agente é treinado para um departamento: vendas, marketing, suporte, dev, RH, financeiro, etc. Eles trabalham 24/7 sem parar.",
    stats: ["15 departamentos", "24/7 operação", "Escalável infinitamente"]
  },
};

const ClickableArchitectureNode = ({ icon, label, sublabel, accent }: {
  icon: any; label: string; sublabel?: string; accent?: boolean;
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const detail = architectureDetails[label];

  return (
    <div className="relative">
      <FlowNode
        icon={icon}
        label={label}
        sublabel={sublabel}
        accent={accent}
        onClick={detail ? () => setShowDetail(!showDetail) : undefined}
      />
      <AnimatePresence>
        {showDetail && detail && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full top-0 ml-4 z-20 w-72 hidden lg:block"
          >
            <Card className="p-4 border-primary/20 bg-card/95 backdrop-blur-xl shadow-xl">
              <h4 className="font-semibold text-sm mb-2">{detail.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{detail.desc}</p>
              <div className="space-y-1">
                {detail.stats.map(s => (
                  <div key={s} className="flex items-center gap-2 text-[10px] font-mono text-primary/70">
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    {s}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile: show inline */}
      <AnimatePresence>
        {showDetail && detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden mt-2"
          >
            <Card className="p-4 border-primary/20 bg-card/90 backdrop-blur-xl">
              <h4 className="font-semibold text-xs mb-1.5">{detail.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{detail.desc}</p>
              <div className="flex flex-wrap gap-2">
                {detail.stats.map(s => (
                  <span key={s} className="text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main page ──
const Architecture = () => {
  const [openAnalogy, setOpenAnalogy] = useState<number | null>(null);
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* === 1. HERO === */}
      <Section className="pt-32 sm:pt-40 pb-16 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center relative z-10"
        >
          <motion.div variants={fadeUp} custom={0}>
            <SectionTag>System Architecture · Explained Simply</SectionTag>
          </motion.div>
          <motion.h1
            variants={fadeUp} custom={1}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-foreground">Como funciona o</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">
              AI Operating System
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp} custom={2}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4"
          >
            Imagine uma empresa com 88 funcionários que nunca dormem, nunca erram e trabalham em velocidade sobre-humana.
          </motion.p>
          <motion.p
            variants={fadeUp} custom={3}
            className="text-sm text-muted-foreground/60 max-w-xl mx-auto leading-relaxed mb-10"
          >
            Esta página explica — de forma simples e visual — como tudo funciona por trás.
            <br />
            <span className="text-primary/60">Clique nos elementos para explorar os detalhes.</span>
          </motion.p>

          {/* Animated stats */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-12">
            {[
              { value: "88", label: "Agentes IA", icon: Bot },
              { value: "15", label: "Departamentos", icon: Users },
              { value: "24/7", label: "Operação", icon: Clock },
              { value: "<200ms", label: "Latência", icon: Zap },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="h-4 w-4 text-primary/40 mx-auto mb-1.5" strokeWidth={1.5} />
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 2. ANALOGIAS — Explicando para leigo === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Explaining Like You're 5</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Pense assim...
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-10">
            Para entender a arquitetura, pense em analogias do mundo real.
            <span className="text-primary/60 ml-1">Clique em cada card para ver o detalhe técnico.</span>
          </motion.p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                emoji: "🏢",
                title: "Uma empresa inteira",
                analogy: "Imagine uma empresa com CEO, gerentes e funcionários. O CEO decide o que fazer, os gerentes planejam, os funcionários executam.",
                technical: "Thor = CEO (orquestrador), Claude Code = Gerente/CTO (planeja), OpenClaw = Funcionários (executam), 88 Agentes = departamentos especializados."
              },
              {
                emoji: "🧠",
                title: "Cérebro e corpo",
                analogy: "Seu cérebro decide 'quero pegar aquele copo'. Mas quem move o braço é o sistema nervoso e os músculos.",
                technical: "Claude Code = cérebro (decide o plano), OpenClaw = corpo (executa as ações físicas no sistema, como criar arquivos e rodar código)."
              },
              {
                emoji: "🎬",
                title: "Diretor e equipe de filmagem",
                analogy: "O diretor planeja cada cena. Mas quem posiciona câmeras, ilumina e filma é a equipe técnica.",
                technical: "Claude Code é o diretor (visão criativa e planejamento). OpenClaw é a equipe técnica (execução prática de cada tarefa)."
              },
              {
                emoji: "🏗️",
                title: "Arquiteto e construtora",
                analogy: "O arquiteto desenha a planta. A construtora coloca tijolo por tijolo. Sem um, o outro não funciona.",
                technical: "Claude Code desenha a arquitetura do código. OpenClaw constrói — criando arquivos, executando comandos e rodando testes automaticamente."
              },
            ].map((a, i) => (
              <motion.div key={a.title} variants={fadeUp}>
                <AnalogyCard
                  {...a}
                  isOpen={openAnalogy === i}
                  onToggle={() => setOpenAnalogy(openAnalogy === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 3. OPENCLAW VS CLAUDE CODE === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Two Layers, One System</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Os dois pilares do sistema
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            Um pensa. O outro faz. Juntos, eles criam um sistema completo.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Claude Code */}
            <motion.div variants={fadeUp}>
              <Card className="p-8 border-primary/20 bg-primary/[0.02] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Claude Code</h3>
                    <p className="text-[11px] font-mono text-primary/60 uppercase tracking-wider">O Cérebro</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Modelo de IA da Anthropic com capacidade de raciocínio avançado. Lê repositórios inteiros e planeja soluções complexas.
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: Search, text: "Lê e entende repos de 847+ arquivos" },
                    { icon: Lightbulb, text: "Planeja arquitetura de sistemas" },
                    { icon: Code2, text: "Gera código de alta qualidade" },
                    { icon: Eye, text: "Faz code review automático" },
                    { icon: Shield, text: "Identifica bugs e vulnerabilidades" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <item.icon className="h-3.5 w-3.5 text-primary/60 shrink-0" strokeWidth={1.5} />
                      {item.text}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-border/20">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Context</p>
                      <p className="font-semibold text-sm">200K tokens</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Acurácia</p>
                      <p className="font-semibold text-sm">94.2%</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Tipo</p>
                      <p className="font-semibold text-sm">Reasoning</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* OpenClaw */}
            <motion.div variants={fadeUp}>
              <Card className="p-8 border-accent-emerald/20 bg-accent-emerald/[0.02] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">OpenClaw</h3>
                    <p className="text-[11px] font-mono text-accent-emerald/60 uppercase tracking-wider">O Motor</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Runtime de execução de agentes em VPS dedicada. Transforma planos em ações reais no filesystem.
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: FolderOpen, text: "Cria, edita e organiza arquivos" },
                    { icon: Terminal, text: "Roda comandos no terminal" },
                    { icon: TestTube, text: "Executa testes automaticamente" },
                    { icon: Workflow, text: "Gerencia workflows paralelos" },
                    { icon: Globe, text: "Integra com APIs externas" },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <item.icon className="h-3.5 w-3.5 text-accent-emerald/60 shrink-0" strokeWidth={1.5} />
                      {item.text}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-border/20">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Paralelo</p>
                      <p className="font-semibold text-sm">12 agents</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Exec/hora</p>
                      <p className="font-semibold text-sm">~180</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground">Infra</p>
                      <p className="font-semibold text-sm">VPS</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 4. SIMULAÇÃO LIVE === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Live Simulation</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Veja o sistema em ação
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-10">
            Simulação real de como o sistema processa o pedido: <span className="text-foreground font-medium">"Criar um módulo de pagamentos"</span>.
            <br />
            <span className="text-primary/60">Clique em "Rodar simulação" para assistir.</span>
          </motion.p>

          <motion.div variants={fadeUp}>
            <LiveSimulation />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 5. ARQUITETURA INTERATIVA === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>Interactive Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Arquitetura completa
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed mb-10">
            Clique em cada camada para ver detalhes técnicos, métricas e explicações.
          </motion.p>

          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1 relative">
            <ClickableArchitectureNode icon={Eye} label="User" sublabel="Requisição" />
            <FlowArrow />
            <ClickableArchitectureNode icon={Zap} label="Thor" sublabel="Orquestrador" accent />
            <FlowArrow />
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <ClickableArchitectureNode icon={Brain} label="Claude Code" sublabel="Planning Brain" accent />
              <FlowNode icon={Database} label="Memory Layer" sublabel="Vector / DB" />
            </div>
            <FlowArrow />
            <FlowNode icon={Workflow} label="Task Queue" sublabel="Fila de execução" />
            <FlowArrow />
            <ClickableArchitectureNode icon={Cpu} label="OpenClaw" sublabel="Execution Engine" />
            <FlowArrow />
            <ClickableArchitectureNode icon={Bot} label="88 Agents" sublabel="Workers" />
            <FlowArrow />
            <FlowNode icon={Server} label="Tools · Filesystem · APIs · DB" />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 6. EVOLUÇÃO === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Before & After</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-4">
            De simples para escalável
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            Antes, Thor falava direto com os agentes. Agora, ele tem um cérebro para pensar e um motor para executar.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-10">
            <motion.div variants={fadeUp}>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">Antes · Flat</p>
              <Card className="p-6 border-border/30 bg-card/30">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="Usuário" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Fazia tudo" accent />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="88 Agentes" sublabel="Direto" />
                </div>
                <div className="mt-4 pt-4 border-t border-border/20 text-center">
                  <p className="text-[11px] text-muted-foreground">Sem planejamento. Sem revisão. Sem paralelismo.</p>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <p className="font-mono text-xs text-primary/60 uppercase tracking-widest mb-4">Depois · Layered</p>
              <Card className="p-6 border-primary/20 bg-primary/[0.02]">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="Usuário" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Orquestra" accent />
                  <FlowArrow />
                  <FlowNode icon={Brain} label="Claude Code" sublabel="Planeja + Revisa" accent />
                  <FlowArrow />
                  <FlowNode icon={Cpu} label="OpenClaw" sublabel="Executa em paralelo" />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="Agents + Tools" />
                </div>
                <div className="mt-4 pt-4 border-t border-border/20 text-center">
                  <p className="text-[11px] text-primary/60">Planejamento inteligente. Execução paralela. Code review.</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 7. BENEFÍCIOS OPENCLAW EXPANDÍVEIS === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Why OpenClaw</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            O que OpenClaw faz de especial?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-10">
            Clique em cada capacidade para ver exemplos reais de uso.
          </motion.p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: GitBranch, title: "Multi-agent workflows",
                desc: "Orquestre dezenas de agentes em paralelo.",
                detail: "Exemplo: 3 agentes criam código, 1 faz review, 1 escreve docs e 1 roda testes — tudo ao mesmo tempo. Tempo de um módulo completo: 4 minutos.",
              },
              {
                icon: Code2, title: "Automação de desenvolvimento",
                desc: "Crie e teste código automaticamente.",
                detail: "OpenClaw pode gerar um microserviço completo: estrutura de pastas, código, testes, Dockerfile e CI/CD pipeline. Tudo sem intervenção humana.",
              },
              {
                icon: Layers, title: "Execução paralela",
                desc: "Múltiplas tarefas sem bloqueio.",
                detail: "Enquanto um agente cria o frontend, outro implementa a API, e um terceiro configura o banco de dados. Zero espera entre etapas.",
              },
              {
                icon: HardDrive, title: "Controle total de filesystem",
                desc: "Manipulação completa de arquivos.",
                detail: "Lê, cria, edita, move e deleta arquivos. Navega repositórios complexos. Executa git operations. Tudo via VPS dedicada com acesso root.",
              },
            ].map((c, i) => (
              <motion.div key={c.title} variants={fadeUp}>
                <Card
                  className={`p-6 border-border/30 bg-card/40 cursor-pointer transition-all duration-300 hover:border-primary/20 ${expandedBenefit === i ? "border-primary/20 bg-primary/[0.02]" : ""}`}
                  onClick={() => setExpandedBenefit(expandedBenefit === i ? null : i)}
                >
                  <div className="flex items-start gap-3">
                    <c.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                      <AnimatePresence>
                        {expandedBenefit === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border/20">
                              <p className="text-xs text-foreground/80 leading-relaxed">{c.detail}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform duration-300 ${expandedBenefit === i ? "rotate-180" : ""}`} strokeWidth={1.5} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 8. CAMADAS === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>System Layers</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            4 camadas, 1 sistema
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-10">
            Cada camada tem uma responsabilidade clara. Nenhuma substitui a outra.
          </motion.p>

          <div className="space-y-3">
            {[
              { layer: "Layer 1", title: "Orquestração", subtitle: "Thor", icon: Zap, accent: true, desc: "Recebe, classifica e distribui todas as tarefas" },
              { layer: "Layer 2", title: "Inteligência", subtitle: "Claude Code", icon: Brain, accent: true, desc: "Planeja, raciocina e revisa código" },
              { layer: "Layer 3", title: "Execução", subtitle: "OpenClaw", icon: Cpu, accent: false, desc: "Executa ações reais no filesystem e terminal" },
              { layer: "Layer 4", title: "Workers", subtitle: "88 Agents", icon: Bot, accent: false, desc: "Agentes especializados por departamento" },
            ].map((l, i) => (
              <motion.div key={l.layer} variants={fadeUp} custom={i}>
                <Card className={`p-5 sm:p-6 flex items-center gap-5 ${l.accent ? "border-primary/20 bg-primary/[0.02]" : "border-border/30 bg-card/40"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${l.accent ? "bg-primary/10" : "bg-muted/60"}`}>
                    <l.icon className={`h-5 w-5 ${l.accent ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l.layer}</p>
                      <span className="font-mono text-[10px] text-primary/40">{l.subtitle}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{l.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{l.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* === 9. INSIGHT FINAL === */}
      <Section className="pb-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>The Bottom Line</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-6">
            Um pensa. O outro faz.
            <br />
            <span className="text-primary">Juntos, escalam tudo.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-base leading-relaxed mb-10">
            Claude Code e OpenClaw não competem — eles se complementam.
            É como cérebro e corpo: você precisa dos dois para funcionar.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">Claude Code</p>
                <p className="font-mono text-[10px] text-primary/60 uppercase tracking-widest">Inteligência</p>
              </div>
            </div>

            <span className="text-muted-foreground font-mono text-lg">+</span>

            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">OpenClaw</p>
                <p className="font-mono text-[10px] text-accent-emerald/60 uppercase tracking-widest">Execução</p>
              </div>
            </div>

            <span className="text-muted-foreground font-mono text-lg">=</span>

            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Sparkles className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">88 Agents</p>
                <p className="font-mono text-[10px] text-accent-amber/60 uppercase tracking-widest">Escala infinita</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12">
            <p className="text-xs text-muted-foreground/40 font-mono">
              clauthor.com · AI Operating System · {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
