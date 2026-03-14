import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, Zap, GitBranch, Layers, Terminal,
  Eye, Database, Workflow, Bot, Server, HardDrive,
  Network, ArrowRight, ChevronDown, Code2, CheckCircle2,
  Play, Pause, MessageSquare, Sparkles, Clock, FileCode,
  FolderOpen, TestTube, BookOpen, Search, Wrench, Globe,
  Shield, BarChart3, Users, Lightbulb, MousePointerClick,
  Activity, Radio, Bell, Image, Kanban, Building2,
  Target, Library, LineChart, Settings, Smartphone,
  TrendingUp, ChevronRight, Boxes, Gauge, CircuitBoard,
  MonitorSpeaker, Rocket
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Animations ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
  })
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-16 sm:py-24 px-4 sm:px-6 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

const SectionTag = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-3 block">
    {children}
  </span>
);

const Divider = () => (
  <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>
);

// ── Simulated Agent Data ──
const MOCK_AGENTS = [
  { name: "SDR Outbound", dept: "Vendas", status: "running", task: "Prospecting 47 leads", progress: 72, executions: 1847, latency: "120ms" },
  { name: "Content Writer", dept: "Marketing", status: "running", task: "Blog post: AI Trends 2026", progress: 45, executions: 923, latency: "340ms" },
  { name: "Data Analyst", dept: "Analytics", status: "idle", task: "Waiting for data", progress: 0, executions: 2341, latency: "90ms" },
  { name: "Support Agent", dept: "Suporte", status: "running", task: "Ticket #4521 resolution", progress: 88, executions: 5102, latency: "200ms" },
  { name: "Dev Agent", dept: "Tecnologia", status: "running", task: "Refactoring auth module", progress: 34, executions: 1204, latency: "450ms" },
  { name: "CFO Agent", dept: "Financeiro", status: "completed", task: "Monthly report generated", progress: 100, executions: 342, latency: "180ms" },
  { name: "HR Recruiter", dept: "RH", status: "idle", task: "Screening paused", progress: 0, executions: 567, latency: "150ms" },
  { name: "Growth Hacker", dept: "Marketing", status: "running", task: "A/B test campaign #12", progress: 61, executions: 1089, latency: "280ms" },
];

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  running: { dot: "bg-accent-emerald", text: "text-accent-emerald", label: "Rodando" },
  idle: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Idle" },
  completed: { dot: "bg-primary", text: "text-primary", label: "Concluído" },
};

// ── COMMAND CENTER TAB VIEW ──
type TabId = "agents" | "activity" | "scrum" | "metrics";

const CommandCenterTabs = () => {
  const [activeTab, setActiveTab] = useState<TabId>("agents");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "agents", label: "Agents", icon: Bot },
    { id: "activity", label: "Live Activity", icon: Activity },
    { id: "scrum", label: "Scrum Board", icon: Kanban },
    { id: "metrics", label: "Metrics", icon: BarChart3 },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/20 mb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-6 min-h-[420px]">
        <AnimatePresence mode="wait">
          {activeTab === "agents" && (
            <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AgentGridView tick={tick} />
            </motion.div>
          )}
          {activeTab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveActivityView tick={tick} />
            </motion.div>
          )}
          {activeTab === "scrum" && (
            <motion.div key="scrum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScrumBoardView />
            </motion.div>
          )}
          {activeTab === "metrics" && (
            <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MetricsView tick={tick} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Agent Grid View ──
const AgentGridView = ({ tick }: { tick: number }) => {
  const agents = useMemo(() => MOCK_AGENTS.map(a => ({
    ...a,
    progress: a.status === "running" ? Math.min(99, a.progress + (tick % 5)) : a.progress,
  })), [tick]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {agents.map((agent, i) => {
        const st = STATUS_STYLES[agent.status];
        return (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-2 h-2 rounded-full", st.dot, agent.status === "running" && "animate-pulse")} />
                <span className="text-xs font-semibold truncate">{agent.name}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] mb-2">{agent.dept}</Badge>
              <p className="text-[10px] text-muted-foreground truncate mb-2">{agent.task}</p>
              {agent.status === "running" && (
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
              <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
                <span>{agent.executions.toLocaleString()} exec</span>
                <span>{agent.latency}</span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Live Activity Feed ──
const ACTIVITY_LOG = [
  { time: "14:32:01", agent: "SDR Outbound", action: "Lead qualificado: TechCorp Inc.", type: "success" },
  { time: "14:31:45", agent: "Thor", action: "Tarefa delegada → Content Writer", type: "info" },
  { time: "14:31:22", agent: "Dev Agent", action: "PR #847 criado: auth refactor", type: "success" },
  { time: "14:31:08", agent: "Support Agent", action: "Ticket #4521 resolvido em 2m 14s", type: "success" },
  { time: "14:30:55", agent: "Growth Hacker", action: "Variante B winning (+23% CTR)", type: "warning" },
  { time: "14:30:41", agent: "Claude Code", action: "Code review concluído: 0 issues", type: "success" },
  { time: "14:30:28", agent: "CFO Agent", action: "Relatório mensal exportado → PDF", type: "info" },
  { time: "14:30:12", agent: "OpenClaw", action: "3 agents em paralelo: exec OK", type: "success" },
  { time: "14:29:58", agent: "Data Analyst", action: "Dataset carregado: 124K rows", type: "info" },
  { time: "14:29:33", agent: "SDR Outbound", action: "Email automático enviado → 12 leads", type: "success" },
];

const TYPE_COLORS: Record<string, string> = {
  success: "text-accent-emerald",
  info: "text-accent-blue",
  warning: "text-accent-amber",
};

const LiveActivityView = ({ tick }: { tick: number }) => {
  const visibleCount = Math.min(ACTIVITY_LOG.length, 4 + (tick % 7));
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
        <span className="font-mono text-[10px] text-accent-emerald uppercase tracking-widest">Live Feed</span>
      </div>
      <div className="space-y-1 font-mono text-xs">
        {ACTIVITY_LOG.slice(0, visibleCount).map((log, i) => (
          <motion.div
            key={i}
            initial={i === 0 ? { opacity: 0, x: -12 } : {}}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0"
          >
            <span className="text-muted-foreground/50 shrink-0 w-16">{log.time}</span>
            <span className="text-foreground font-semibold shrink-0 w-28 truncate">{log.agent}</span>
            <span className={cn("flex-1", TYPE_COLORS[log.type] || "text-muted-foreground")}>{log.action}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Scrum Board ──
const SCRUM_COLUMNS = [
  { title: "Backlog", items: [
    { agent: "HR Recruiter", task: "Screen 20 candidates" },
    { agent: "Legal Agent", task: "Review NDA template" },
  ]},
  { title: "In Progress", items: [
    { agent: "Dev Agent", task: "Auth module refactor" },
    { agent: "SDR Outbound", task: "Prospect 47 leads" },
    { agent: "Content Writer", task: "Blog: AI Trends" },
  ]},
  { title: "Review", items: [
    { agent: "Growth Hacker", task: "A/B test results" },
  ]},
  { title: "Done", items: [
    { agent: "CFO Agent", task: "Monthly report" },
    { agent: "Support Agent", task: "Ticket #4521" },
  ]},
];

const COLUMN_COLORS = ["text-muted-foreground", "text-accent-amber", "text-accent-blue", "text-accent-emerald"];

const ScrumBoardView = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {SCRUM_COLUMNS.map((col, ci) => (
      <div key={col.title}>
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("font-semibold text-xs", COLUMN_COLORS[ci])}>{col.title}</span>
          <Badge variant="secondary" className="text-[9px] h-4">{col.items.length}</Badge>
        </div>
        <div className="space-y-2">
          {col.items.map(item => (
            <Card key={item.task} className="p-3 border-border/20 bg-card/30">
              <p className="text-[10px] font-semibold mb-1">{item.agent}</p>
              <p className="text-[10px] text-muted-foreground">{item.task}</p>
            </Card>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Metrics Dashboard ──
const MetricsView = ({ tick }: { tick: number }) => {
  const metrics = [
    { label: "Execuções/hora", value: 180 + (tick % 20), icon: Zap, trend: "+12%" },
    { label: "Taxa de Sucesso", value: "98.7%", icon: CheckCircle2, trend: "+0.3%" },
    { label: "Tempo Médio", value: "1.4s", icon: Clock, trend: "-18%" },
    { label: "Agentes Ativos", value: 6, icon: Bot, trend: "88 total" },
  ];

  const barData = [
    { label: "Vendas", value: 84 },
    { label: "Marketing", value: 72 },
    { label: "Suporte", value: 95 },
    { label: "Dev", value: 67 },
    { label: "Finance", value: 45 },
    { label: "RH", value: 38 },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(m => (
          <Card key={m.label} className="p-4 border-border/20 bg-card/30">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="h-3.5 w-3.5 text-primary/60" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
            <p className="text-xl font-bold font-display">{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</p>
            <span className="text-[10px] text-accent-emerald">{m.trend}</span>
          </Card>
        ))}
      </div>

      <Card className="p-4 border-border/20 bg-card/30">
        <p className="text-xs font-semibold mb-4">Execuções por Departamento</p>
        <div className="space-y-2.5">
          {barData.map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">{d.label}</span>
              <div className="flex-1 bg-muted/20 rounded-full h-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${d.value}%` }}
                  transition={{ duration: 1, delay: 0.1 }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-8">{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── Live Terminal Simulation ──
const simulationSteps = [
  {
    agent: "Thor", icon: Zap, color: "text-primary", bgColor: "bg-primary/10",
    messages: [
      "📥 Tarefa recebida: \"Criar módulo de pagamentos\"",
      "🔍 Analisando contexto do sistema...",
      "📋 Classificando: prioridade alta, dept: fintech",
      "🧠 Encaminhando para Claude Code planejar...",
    ]
  },
  {
    agent: "Claude Code", icon: Brain, color: "text-primary", bgColor: "bg-primary/10",
    messages: [
      "📖 Lendo repositório... 847 arquivos",
      "🏗️ Plano criado: 5 etapas",
      "   1. Criar src/modules/payments/",
      "   2. Implementar PaymentService.ts",
      "   3. Criar PaymentController.ts",
      "   4. Testes unitários",
      "   5. Atualizar docs",
      "✅ Plano validado → OpenClaw",
    ]
  },
  {
    agent: "OpenClaw", icon: Cpu, color: "text-accent-emerald", bgColor: "bg-accent-emerald/10",
    messages: [
      "⚡ Execução paralela iniciada...",
      "📁 mkdir src/modules/payments/ ✓",
      "📝 PaymentService.ts · 127 linhas ✓",
      "📝 PaymentController.ts · 89 linhas ✓",
      "🧪 Testes: 12/12 passando ✓",
      "📚 Docs atualizados ✓",
    ]
  },
  {
    agent: "Claude Code", icon: CheckCircle2, color: "text-primary", bgColor: "bg-primary/10",
    messages: [
      "🔍 Code review...",
      "✅ Lint: 0 erros | Types: OK | Coverage: 94%",
      "🎉 Módulo criado com sucesso!",
    ]
  },
];

const LiveSimulation = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<{ step: number; msg: number }[]>([]);

  const advance = useCallback(() => {
    setVisibleMessages(prev => [...prev, { step: currentStep, msg: currentMessage }]);
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
    const timer = setTimeout(advance, 500);
    return () => clearTimeout(timer);
  }, [isPlaying, advance]);

  const start = () => {
    setCurrentStep(0);
    setCurrentMessage(0);
    setVisibleMessages([]);
    setTimeout(() => setIsPlaying(true), 100);
  };

  return (
    <Card className="border-border/20 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/10">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">clauthor-simulation.sh</span>
        <div className="ml-auto flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
              <span className="font-mono text-[10px] text-accent-emerald">live</span>
            </div>
          )}
          <Button
            onClick={isPlaying ? () => setIsPlaying(false) : start}
            size="sm"
            variant="ghost"
            className="h-6 px-2 gap-1.5 text-[10px]"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Pause" : visibleMessages.length > 0 ? "Replay" : "Run"}
          </Button>
        </div>
      </div>

      <div className="p-4 max-h-[350px] overflow-y-auto font-mono text-xs space-y-1 min-h-[200px]">
        {visibleMessages.length === 0 && (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground/30">
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-[11px]">Clique Run para ver a IA em ação</p>
            </div>
          </div>
        )}
        {simulationSteps.map((step, si) => {
          const stepMessages = visibleMessages.filter(v => v.step === si);
          if (stepMessages.length === 0) return null;
          return (
            <div key={si} className="mb-3">
              <div className="flex items-center gap-2 mb-1.5 mt-2 first:mt-0">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", step.bgColor)}>
                  <step.icon className={cn("h-3 w-3", step.color)} strokeWidth={1.5} />
                </div>
                <span className={cn("font-semibold text-[11px]", step.color)}>{step.agent}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>
              {stepMessages.map((v, mi) => (
                <motion.div
                  key={`${si}-${mi}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-muted-foreground pl-7 py-0.5"
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
  );
};

// ── Workflow Builder Preview ──
const WorkflowPreview = () => {
  const steps = [
    { label: "Trigger", sub: "Cron: 08:00 daily", icon: Clock, color: "bg-accent-amber/10 text-accent-amber" },
    { label: "Análise de Tráfego", sub: "Data Analyst Agent", icon: LineChart, color: "bg-accent-blue/10 text-accent-blue" },
    { label: "Gerar Relatório", sub: "CFO Agent", icon: FileCode, color: "bg-primary/10 text-primary" },
    { label: "Criar Criativos", sub: "Content Writer", icon: Image, color: "bg-accent-violet/10 text-accent-violet" },
    { label: "Notificar", sub: "WhatsApp + Email", icon: Bell, color: "bg-accent-emerald/10 text-accent-emerald" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/20 bg-card/40 min-w-[160px]"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", step.color.split(" ")[0])}>
              <step.icon className={cn("h-4 w-4", step.color.split(" ")[1])} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-semibold">{step.label}</p>
              <p className="text-[9px] text-muted-foreground">{step.sub}</p>
            </div>
          </motion.div>
          {i < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 mx-1 shrink-0 hidden sm:block" strokeWidth={1.5} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── 3D Office Grid (CSS-based visual) ──
const OfficeVisualization = () => {
  const desks = [
    { name: "Thor", role: "CEO", status: "active", color: "bg-primary" },
    { name: "Claude", role: "CTO", status: "active", color: "bg-primary" },
    { name: "SDR Bot", role: "Vendas", status: "active", color: "bg-accent-emerald" },
    { name: "Writer", role: "Marketing", status: "active", color: "bg-accent-blue" },
    { name: "Analyst", role: "Analytics", status: "idle", color: "bg-muted-foreground" },
    { name: "Support", role: "Suporte", status: "active", color: "bg-accent-amber" },
    { name: "Dev", role: "Tech", status: "active", color: "bg-accent-violet" },
    { name: "CFO", role: "Finance", status: "idle", color: "bg-muted-foreground" },
    { name: "HR", role: "RH", status: "idle", color: "bg-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto perspective-[800px]">
      {desks.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, rotateX: 15, y: 20 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className={cn(
            "relative p-3 rounded-xl border text-center transition-all",
            d.status === "active"
              ? "border-primary/20 bg-primary/[0.03] shadow-[0_0_15px_hsl(var(--primary)/0.05)]"
              : "border-border/20 bg-card/20 opacity-50"
          )}
        >
          <div className={cn("w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center", d.color + "/20")}>
            <Bot className={cn("h-3.5 w-3.5", d.color === "bg-primary" ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-semibold">{d.name}</p>
          <p className="text-[8px] text-muted-foreground">{d.role}</p>
          {d.status === "active" && (
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ── Architecture Layers ──
const FlowArrow = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-5 bg-gradient-to-b from-primary/40 to-primary/10 relative">
      <ChevronDown className="h-3 w-3 text-primary/50 absolute -bottom-1.5 -left-[5px]" strokeWidth={1.5} />
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, label, sublabel, accent = false, onClick }: {
  icon: any; label: string; sublabel?: string; accent?: boolean; onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm transition-all",
      onClick && "cursor-pointer hover:scale-[1.02]",
      accent
        ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
        : "border-border/40 bg-card/40"
    )}
  >
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent ? "bg-primary/10" : "bg-muted/60")}>
      <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
    </div>
    <div>
      <p className={cn("text-sm font-semibold", accent ? "text-primary" : "text-foreground")}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
    {onClick && <MousePointerClick className="h-3 w-3 text-muted-foreground/40 ml-auto" strokeWidth={1.5} />}
  </div>
);

// ── Architecture Detail Popover ──
const architectureDetails: Record<string, { title: string; desc: string; stats: string[] }> = {
  "Thor": {
    title: "Thor · Orquestrador",
    desc: "CEO digital. Recebe todas as requisições, classifica e distribui para a camada certa.",
    stats: ["Latência: 120ms", "Uptime: 99.97%", "2,400 tasks/dia"]
  },
  "Claude Code": {
    title: "Claude Code · Cérebro",
    desc: "Modelo de IA que lê repos inteiros, planeja arquitetura e faz code review. CTO incansável.",
    stats: ["Context: 200K tokens", "Acurácia: 94.2%", "Claude 3.5 Sonnet"]
  },
  "OpenClaw": {
    title: "OpenClaw · Motor",
    desc: "Runtime que transforma planos em ações: cria arquivos, roda comandos, executa testes.",
    stats: ["12 agents paralelos", "Full filesystem", "~180 exec/hora"]
  },
  "88 Agents": {
    title: "88 Agentes Especializados",
    desc: "Cada agente é expert no seu departamento. Trabalham 24/7 sem parar.",
    stats: ["15 departamentos", "24/7 operação", "Escala infinita"]
  },
};

const ClickableArchNode = ({ icon, label, sublabel, accent }: {
  icon: any; label: string; sublabel?: string; accent?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const detail = architectureDetails[label];

  return (
    <div className="relative">
      <FlowNode icon={icon} label={label} sublabel={sublabel} accent={accent} onClick={detail ? () => setOpen(!open) : undefined} />
      <AnimatePresence>
        {open && detail && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-full top-0 ml-4 z-20 w-64 hidden lg:block"
            >
              <Card className="p-4 border-primary/20 bg-card/95 backdrop-blur-xl shadow-xl">
                <h4 className="font-semibold text-sm mb-1.5">{detail.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{detail.desc}</p>
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden mt-2"
            >
              <Card className="p-3 border-primary/20 bg-card/90 backdrop-blur-xl">
                <h4 className="font-semibold text-xs mb-1">{detail.title}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{detail.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {detail.stats.map(s => (
                    <span key={s} className="text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── FEATURE CARDS ──
const FEATURES = [
  { icon: Bot, title: "Agent Command Center", desc: "Visualize todos os agentes ativos com status, tarefa atual, progresso e métricas em tempo real." },
  { icon: Settings, title: "Agent Creator", desc: "Crie agentes customizados: tipo, tarefas, cron schedule e integrações em poucos cliques." },
  { icon: Workflow, title: "Task Automation", desc: "Defina rotinas automáticas: análise de tráfego, relatórios semanais, criativos diários." },
  { icon: Activity, title: "Real-time Activity", desc: "Logs visuais ao vivo de qual agente está rodando, a tarefa e o tempo de execução." },
  { icon: Smartphone, title: "WhatsApp Notifications", desc: "Alertas, relatórios e insights enviados automaticamente para WhatsApp." },
  { icon: Image, title: "Creative Scraper", desc: "Agente que varre a internet procurando criativos com análise de performance." },
  { icon: Kanban, title: "AI Scrum Board", desc: "Backlog, In Progress, Testing, Completed — cada agente como uma tarefa visual." },
  { icon: Building2, title: "3D Office", desc: "Escritório virtual onde cada agente aparece como avatar com status em tempo real." },
  { icon: Target, title: "Action Plans", desc: "Planos estratégicos com tarefas divididas entre agentes para campanhas e lançamentos." },
  { icon: Library, title: "Knowledge Library", desc: "Tudo gerado pelos agentes é salvo: relatórios, códigos, análises e estratégias." },
  { icon: LineChart, title: "Data Dashboards", desc: "Métricas de tráfego, ROI, conversões, criativos e campanhas em dashboards interativos." },
  { icon: CircuitBoard, title: "System Architecture", desc: "Thor + Claude Code + OpenClaw + 88 agentes em camadas de orquestração e execução." },
];

// ═════════════════════════════════════════════
// ══ MAIN PAGE ══
// ═════════════════════════════════════════════

const Architecture = () => {
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══════════ 1. HERO ═══════════ */}
      <Section className="pt-28 sm:pt-36 pb-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-[150px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-violet/[0.02] blur-[100px]" />
        </div>
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="text-center relative z-10"
        >
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="text-[10px] px-3 py-1 mb-6 font-mono uppercase tracking-widest">
              <Radio className="h-3 w-3 mr-1.5 text-primary" strokeWidth={1.5} />
              AI Command Center
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp} custom={1}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-foreground">O QG da sua</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">
              empresa de IA
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp} custom={2}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4"
          >
            88 agentes trabalhando 24/7. Orquestrados por Thor. Pensados por Claude Code. Executados por OpenClaw.
          </motion.p>
          <motion.p
            variants={fadeUp} custom={3}
            className="text-sm text-muted-foreground/50 max-w-xl mx-auto mb-10"
          >
            Gerencie, monitore e escale sua rede de IA em tempo real — como um software de comando militar.
          </motion.p>

          {/* Stats */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {[
              { value: "88", label: "Agentes IA", icon: Bot },
              { value: "15", label: "Departamentos", icon: Users },
              { value: "24/7", label: "Operação", icon: Clock },
              { value: "<200ms", label: "Latência", icon: Zap },
              { value: "98.7%", label: "Success Rate", icon: CheckCircle2 },
            ].map(s => (
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

      {/* ═══════════ 2. INTERACTIVE COMMAND CENTER ═══════════ */}
      <Section id="command-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Interactive Preview</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Command Center · Live
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Explore o painel de controle. Troque as abas para ver agentes, atividade ao vivo, scrum board e métricas.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Card className="border-border/20 bg-card/20 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 bg-muted/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-emerald/60" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground ml-2">clauthor.com/command-center</span>
              </div>
              <CommandCenterTabs />
            </Card>
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 3. TASK AUTOMATION WORKFLOW ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Task Automation</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Automatize tudo
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-10">
            Defina workflows visuais que rodam automaticamente. Exemplo: análise de tráfego diária às 08:00 com relatório e notificação via WhatsApp.
          </motion.p>
          <motion.div variants={fadeUp} className="overflow-x-auto pb-4">
            <WorkflowPreview />
          </motion.div>
          <motion.div variants={fadeUp} className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              { title: "Análise diária", desc: "Tráfego, conversões e anomalias todo dia às 08:00", schedule: "0 8 * * *" },
              { title: "Relatório semanal", desc: "PDF completo com ROI, métricas e insights", schedule: "0 9 * * 1" },
              { title: "Criativos diários", desc: "3 novos criativos gerados e testados", schedule: "0 10 * * *" },
            ].map(r => (
              <Card key={r.title} className="p-4 border-border/20 bg-card/30">
                <h4 className="text-sm font-semibold mb-1">{r.title}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{r.desc}</p>
                <span className="font-mono text-[9px] text-primary/60 bg-primary/5 px-2 py-0.5 rounded">{r.schedule}</span>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 4. LIVE SIMULATION ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Live Execution</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Veja a IA trabalhando
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Simulação real: <span className="text-foreground font-medium">"Criar módulo de pagamentos"</span>.
            Clique Run para assistir Thor → Claude Code → OpenClaw em ação.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-3xl">
            <LiveSimulation />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 5. 3D OFFICE ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Virtual Office</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Escritório virtual dos agentes
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-10">
            Visualize seus agentes como um time trabalhando. Pontos verdes = ativo agora.
          </motion.p>
          <motion.div variants={fadeUp}>
            <OfficeVisualization />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 6. TWO PILLARS ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Two Pillars</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Um pensa. O outro faz.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-10">
            Claude Code e OpenClaw são camadas complementares. Juntos, permitem escalar qualquer operação.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-5">
            <motion.div variants={fadeUp}>
              <Card className="p-6 border-primary/20 bg-primary/[0.02] h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">Claude Code</h3>
                    <p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">Inteligência</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {["Lê repos de 847+ arquivos", "Planeja arquitetura", "Gera código", "Code review", "Detecta vulnerabilidades"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-foreground/80">
                      <div className="w-1 h-1 rounded-full bg-primary/50" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                  <div><p className="font-mono text-[9px] text-muted-foreground">Context</p><p className="font-semibold text-sm">200K</p></div>
                  <div><p className="font-mono text-[9px] text-muted-foreground">Accuracy</p><p className="font-semibold text-sm">94.2%</p></div>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="p-6 border-accent-emerald/20 bg-accent-emerald/[0.02] h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">OpenClaw</h3>
                    <p className="text-[10px] font-mono text-accent-emerald/60 uppercase tracking-wider">Execução</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {["Cria/edita arquivos", "Roda comandos no terminal", "Executa testes", "Workflows paralelos", "Integra APIs externas"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-foreground/80">
                      <div className="w-1 h-1 rounded-full bg-accent-emerald/50" />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                  <div><p className="font-mono text-[9px] text-muted-foreground">Parallel</p><p className="font-semibold text-sm">12</p></div>
                  <div><p className="font-mono text-[9px] text-muted-foreground">Exec/hr</p><p className="font-semibold text-sm">~180</p></div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 7. INTERACTIVE ARCHITECTURE ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>System Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Arquitetura completa
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto text-sm mb-8">
            Clique em cada camada para detalhes técnicos e métricas.
          </motion.p>
          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1 relative">
            <ClickableArchNode icon={Eye} label="User" sublabel="Requisição" />
            <FlowArrow />
            <ClickableArchNode icon={Zap} label="Thor" sublabel="Orquestrador" accent />
            <FlowArrow />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <ClickableArchNode icon={Brain} label="Claude Code" sublabel="Planning Brain" accent />
              <FlowNode icon={Database} label="Memory" sublabel="Vector / DB" />
            </div>
            <FlowArrow />
            <FlowNode icon={Workflow} label="Task Queue" sublabel="Fila de execução" />
            <FlowArrow />
            <ClickableArchNode icon={Cpu} label="OpenClaw" sublabel="Execution Engine" />
            <FlowArrow />
            <ClickableArchNode icon={Bot} label="88 Agents" sublabel="Workers" />
            <FlowArrow />
            <FlowNode icon={Server} label="Tools · FS · APIs · DB" />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 8. 4 LAYERS ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>System Layers</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            4 camadas, 1 sistema
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm mb-8">
            Cada camada tem responsabilidade clara. Nenhuma substitui a outra.
          </motion.p>

          <div className="space-y-3">
            {[
              { layer: "Layer 1", title: "Orquestração", subtitle: "Thor", icon: Zap, accent: true, desc: "Recebe, classifica e distribui todas as tarefas" },
              { layer: "Layer 2", title: "Inteligência", subtitle: "Claude Code", icon: Brain, accent: true, desc: "Planeja, raciocina e revisa código" },
              { layer: "Layer 3", title: "Execução", subtitle: "OpenClaw", icon: Cpu, accent: false, desc: "Executa ações reais no filesystem e terminal" },
              { layer: "Layer 4", title: "Workers", subtitle: "88 Agents", icon: Bot, accent: false, desc: "Agentes especializados por departamento" },
            ].map((l, i) => (
              <motion.div key={l.layer} variants={fadeUp} custom={i}>
                <Card className={cn("p-5 flex items-center gap-4", l.accent ? "border-primary/20 bg-primary/[0.02]" : "border-border/20 bg-card/30")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", l.accent ? "bg-primary/10" : "bg-muted/40")}>
                    <l.icon className={cn("h-5 w-5", l.accent ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l.layer}</span>
                      <span className="font-mono text-[10px] text-primary/40">{l.subtitle}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{l.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{l.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 9. ALL 12 FEATURES ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Full Feature Set</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            12 módulos integrados
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm mb-8">
            Tudo que você precisa para operar uma empresa inteira com agentes de IA.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="p-5 border-border/20 bg-card/30 hover:border-primary/20 transition-all group h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <f.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 10. EVOLUTION ═══════════ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Evolution</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            De simples para escalável
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm mb-10">
            Antes Thor falava direto com agentes. Agora tem um cérebro para pensar e um motor para executar.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={fadeUp}>
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Antes · Flat</p>
              <Card className="p-5 border-border/20 bg-card/20">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="User" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Fazia tudo" accent />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="88 Agents" />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border/20">Sem planejamento. Sem revisão. Sem paralelismo.</p>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <p className="font-mono text-[10px] text-primary/60 uppercase tracking-widest mb-3">Depois · Layered</p>
              <Card className="p-5 border-primary/20 bg-primary/[0.02]">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="User" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Orquestra" accent />
                  <FlowArrow />
                  <FlowNode icon={Brain} label="Claude Code" sublabel="Planeja" accent />
                  <FlowArrow />
                  <FlowNode icon={Cpu} label="OpenClaw" sublabel="Executa" />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="88 Agents" />
                </div>
                <p className="text-[10px] text-primary/60 text-center mt-3 pt-3 border-t border-border/20">Planejamento + Execução paralela + Code review.</p>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══════════ 11. FINAL INSIGHT ═══════════ */}
      <Section className="pb-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>The Bottom Line</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-5">
            Um pensa. O outro faz.
            <br />
            <span className="text-primary">Juntos, escalam tudo.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-sm leading-relaxed mb-10">
            Claude Code e OpenClaw não competem — se complementam. Cérebro e corpo. Os dois juntos é o que permite escalar 88 agentes operando como uma empresa inteira.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">Claude Code</p>
                <p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">Inteligência</p>
              </div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">+</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">OpenClaw</p>
                <p className="font-mono text-[9px] text-accent-emerald/60 uppercase tracking-widest">Execução</p>
              </div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">=</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Rocket className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">88 Agents</p>
                <p className="font-mono text-[9px] text-accent-amber/60 uppercase tracking-widest">Escala infinita</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12">
            <p className="text-[10px] text-muted-foreground/30 font-mono">
              clauthor.com · AI Command Center · {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
