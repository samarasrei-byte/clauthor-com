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
  MonitorSpeaker, Rocket, Package, Truck, GraduationCap,
  Palette, Video, Megaphone, Briefcase, Star, ShoppingCart,
  Phone, Crosshair, PenTool, Award, Handshake,
  Gavel, ShieldCheck, Scale, ClipboardCheck, Cog,
  Factory, Receipt, Store, X, ExternalLink, DollarSign,
  FileText, Hash, Calendar, UserPlus, Repeat,
  Lock, Headphones, Mic, Fingerprint, Webhook, Link2,
  HeartHandshake, Crown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { departments, deptDetails, totalAgents, totalPrometheusCost, totalCltCost, totalSavingsPercent } from "@/data/departmentData";

// ── Animations ──
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
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

// ═══════════════════════════════════════
// ═══ NAV PILLS (quick jump) ═══
// ═══════════════════════════════════════
const NAV_SECTIONS = [
  { id: "hero", label: "Overview" },
  { id: "command-center", label: "Command Center" },
  { id: "departments", label: "Departamentos" },
  { id: "platform", label: "Plataforma" },
  { id: "simulation", label: "Simulação" },
  { id: "architecture", label: "Arquitetura" },
  { id: "integrations", label: "Integrações" },
];

// ═══════════════════════════════════════
// ═══ COMMAND CENTER TABS ═══
// ═══════════════════════════════════════
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
      <div className="flex gap-1 border-b border-border/20 mb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all",
              activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-6 min-h-[420px]">
        <AnimatePresence mode="wait">
          {activeTab === "agents" && <motion.div key="agents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AgentGridView tick={tick} /></motion.div>}
          {activeTab === "activity" && <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LiveActivityView tick={tick} /></motion.div>}
          {activeTab === "scrum" && <motion.div key="scrum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ScrumBoardView /></motion.div>}
          {activeTab === "metrics" && <motion.div key="metrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MetricsView tick={tick} /></motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

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
          <motion.div key={agent.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-2 h-2 rounded-full", st.dot, agent.status === "running" && "animate-pulse")} />
                <span className="text-xs font-semibold truncate">{agent.name}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] mb-2">{agent.dept}</Badge>
              <p className="text-[10px] text-muted-foreground truncate mb-2">{agent.task}</p>
              {agent.status === "running" && (
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" initial={{ width: 0 }} animate={{ width: `${agent.progress}%` }} transition={{ duration: 0.5 }} />
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

const TYPE_COLORS: Record<string, string> = { success: "text-accent-emerald", info: "text-accent-blue", warning: "text-accent-amber" };

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
          <motion.div key={i} initial={i === 0 ? { opacity: 0, x: -12 } : {}} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
            <span className="text-muted-foreground/50 shrink-0 w-16">{log.time}</span>
            <span className="text-foreground font-semibold shrink-0 w-28 truncate">{log.agent}</span>
            <span className={cn("flex-1", TYPE_COLORS[log.type] || "text-muted-foreground")}>{log.action}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SCRUM_COLUMNS = [
  { title: "Backlog", items: [{ agent: "HR Recruiter", task: "Screen 20 candidates" }, { agent: "Legal Agent", task: "Review NDA template" }] },
  { title: "In Progress", items: [{ agent: "Dev Agent", task: "Auth module refactor" }, { agent: "SDR Outbound", task: "Prospect 47 leads" }, { agent: "Content Writer", task: "Blog: AI Trends" }] },
  { title: "Review", items: [{ agent: "Growth Hacker", task: "A/B test results" }] },
  { title: "Done", items: [{ agent: "CFO Agent", task: "Monthly report" }, { agent: "Support Agent", task: "Ticket #4521" }] },
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

const MetricsView = ({ tick }: { tick: number }) => {
  const metrics = [
    { label: "Execuções/hora", value: 180 + (tick % 20), icon: Zap, trend: "+12%" },
    { label: "Taxa de Sucesso", value: "98.7%", icon: CheckCircle2, trend: "+0.3%" },
    { label: "Tempo Médio", value: "1.4s", icon: Clock, trend: "-18%" },
    { label: "Agentes Ativos", value: 6, icon: Bot, trend: `${totalAgents} total` },
  ];
  const barData = [
    { label: "Vendas", value: 84 }, { label: "Marketing", value: 72 }, { label: "Suporte", value: 95 },
    { label: "Dev", value: 67 }, { label: "Finance", value: 45 }, { label: "RH", value: 38 },
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
                <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary" initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 1, delay: 0.1 }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-8">{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ LIVE TERMINAL SIMULATION ═══
// ═══════════════════════════════════════
const simulationSteps = [
  { agent: "Thor", icon: Zap, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📥 Tarefa recebida: \"Criar módulo de pagamentos\"",
    "🔍 Analisando contexto do sistema...",
    "📋 Classificando: prioridade alta, dept: fintech",
    "🧠 Encaminhando para Claude Code planejar...",
  ]},
  { agent: "Claude Code", icon: Brain, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📖 Lendo repositório... 847 arquivos",
    "🏗️ Plano criado: 5 etapas",
    "   1. Criar src/modules/payments/",
    "   2. Implementar PaymentService.ts",
    "   3. Criar PaymentController.ts",
    "   4. Testes unitários",
    "   5. Atualizar docs",
    "✅ Plano validado → OpenClaw",
  ]},
  { agent: "OpenClaw", icon: Cpu, color: "text-accent-emerald", bgColor: "bg-accent-emerald/10", messages: [
    "⚡ Execução paralela iniciada...",
    "📁 mkdir src/modules/payments/ ✓",
    "📝 PaymentService.ts · 127 linhas ✓",
    "📝 PaymentController.ts · 89 linhas ✓",
    "🧪 Testes: 12/12 passando ✓",
    "📚 Docs atualizados ✓",
  ]},
  { agent: "Claude Code", icon: CheckCircle2, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "🔍 Code review...",
    "✅ Lint: 0 erros | Types: OK | Coverage: 94%",
    "🎉 Módulo criado com sucesso!",
  ]},
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
          <Button onClick={isPlaying ? () => setIsPlaying(false) : start} size="sm" variant="ghost" className="h-6 px-2 gap-1.5 text-[10px]">
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
                <motion.div key={`${si}-${mi}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-muted-foreground pl-7 py-0.5">
                  {step.messages[v.msg]}
                </motion.div>
              ))}
            </div>
          );
        })}
        {isPlaying && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-primary/60 ml-7" />}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════
// ═══ DEPARTMENT EXPLORER ═══
// ═══════════════════════════════════════
const DepartmentExplorer = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {departments.map((dept, i) => {
        const isOpen = expanded === dept.id;
        const detail = deptDetails[dept.id];
        const Icon = dept.icon;

        return (
          <motion.div key={dept.id} variants={fadeUp} custom={i}>
            <Card
              className={cn(
                "border-border/20 bg-card/30 overflow-hidden transition-all cursor-pointer group",
                isOpen ? `${dept.borderActive} bg-card/50` : "hover:border-primary/10"
              )}
              onClick={() => setExpanded(isOpen ? null : dept.id)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", dept.iconBg)}>
                    <Icon className={cn("h-4 w-4", dept.color)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold capitalize">{dept.id.replace(/_/g, " ")}</h3>
                      {dept.popular && <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-0">Popular</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{dept.agents.length} agentes · {dept.tokens} tokens</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} strokeWidth={1.5} />
                </div>

                {/* Cost comparison mini */}
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="text-muted-foreground/60">CLT: <span className="line-through">R${dept.cltCost.toLocaleString()}</span></span>
                  <span className="text-accent-emerald font-semibold">IA: R${dept.prometheusCost.toLocaleString()}/mês</span>
                  <Badge variant="secondary" className="text-[8px] h-4 text-accent-emerald bg-accent-emerald/10 border-0">-{dept.discount}%</Badge>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                      {/* Agent list */}
                      <div>
                        <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Agentes</p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {dept.agents.map(a => (
                            <div key={a.key} className="flex items-center gap-2 text-[11px]">
                              <a.icon className={cn("h-3 w-3 shrink-0", dept.color)} strokeWidth={1.5} />
                              <span className="text-foreground/80">{a.role}</span>
                              <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">{a.tokens}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Replaces */}
                      {detail && (
                        <div>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Substitui</p>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.replaces.map(r => (
                              <span key={r} className="text-[9px] text-destructive/60 bg-destructive/5 px-2 py-0.5 rounded-full line-through">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FAQ */}
                      {detail && detail.faq.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">FAQ</p>
                          <div className="space-y-2">
                            {detail.faq.slice(0, 2).map(f => (
                              <div key={f.q}>
                                <p className="text-[10px] font-semibold text-foreground/80">{f.q}</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{f.a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ PLATFORM FEATURES SHOWCASE ═══
// ═══════════════════════════════════════
const PLATFORM_FEATURES = [
  {
    icon: Bot, title: "Agent Command Center", tag: "Core",
    desc: "Visualize todos os agentes ativos com status, tarefa atual, progresso e métricas em tempo real.",
    details: ["Dashboard com cards de agentes", "Status ao vivo (running, idle, completed)", "Métricas de execução e latência", "Filtros por departamento e status"],
  },
  {
    icon: MessageSquare, title: "THOR · Orquestrador", tag: "Brain",
    desc: "IA conversacional que entende suas necessidades e orquestra todos os agentes automaticamente.",
    details: ["Chat inteligente com contexto", "Delegação automática de tarefas", "Memória de longo prazo", "Sugestões proativas"],
  },
  {
    icon: Settings, title: "Agent Creator", tag: "Builder",
    desc: "Crie agentes customizados com nome, tipo, tarefas, cron schedule e integrações em poucos cliques.",
    details: ["4 tipos: marketing, analytics, automation, research", "Configuração de cron schedule", "Seleção de integrações", "Templates prontos de agentes"],
  },
  {
    icon: Workflow, title: "Task Automation", tag: "Automation",
    desc: "Defina rotinas automáticas: análise de tráfego, relatórios semanais, criativos diários.",
    details: ["Workflow visual builder", "Triggers por cron/evento", "Cadeia de agentes em sequência", "Notificações WhatsApp automáticas"],
  },
  {
    icon: Activity, title: "Real-time Activity", tag: "Monitoring",
    desc: "Logs visuais ao vivo de qual agente está rodando, a tarefa e o tempo de execução.",
    details: ["Feed de atividade em tempo real", "Filtros por agente e tipo", "Alertas de erro automáticos", "Histórico completo exportável"],
  },
  {
    icon: Smartphone, title: "WhatsApp Notifications", tag: "Alerts",
    desc: "Alertas, relatórios e insights enviados automaticamente para WhatsApp.",
    details: ["Destinatários configuráveis", "Templates de mensagem", "Envio de relatórios em PDF", "Alertas por nível de prioridade"],
  },
  {
    icon: Shield, title: "Segurança Avançada", tag: "Security",
    desc: "Criptografia AES-256, RLS, auditoria, controle de acesso por role e credenciais isoladas.",
    details: ["Credenciais criptografadas por agente", "Audit logs de acesso", "Row Level Security (RLS)", "Controle de acesso por tenant"],
  },
  {
    icon: Kanban, title: "AI Scrum Board", tag: "Management",
    desc: "Backlog, In Progress, Testing, Completed — cada agente como uma tarefa visual.",
    details: ["Kanban drag-and-drop", "Prioridades e deadlines", "Histórico de execução", "Métricas de throughput"],
  },
  {
    icon: DollarSign, title: "Pagamentos e Tokens", tag: "Billing",
    desc: "Sistema de créditos, planos, cupons e histórico de pagamentos integrado.",
    details: ["Planos: Free, Pro, Business, Enterprise", "Sistema de tokens (créditos)", "Cupons de desconto", "Integração PayPal"],
  },
  {
    icon: BookOpen, title: "Knowledge Base", tag: "Knowledge",
    desc: "Base de conhecimento com busca vetorial que alimenta todos os agentes.",
    details: ["Upload de documentos", "Busca full-text em português", "RAG (Retrieval Augmented Generation)", "Categorização automática"],
  },
  {
    icon: LineChart, title: "Data Dashboards", tag: "Analytics",
    desc: "Métricas de tráfego, ROI, conversões, criativos e campanhas em dashboards interativos.",
    details: ["Gráficos interativos em tempo real", "KPIs por departamento", "Exportação de relatórios", "Alertas de anomalia"],
  },
  {
    icon: Users, title: "Multi-tenant", tag: "Enterprise",
    desc: "Isolamento de dados por empresa, roles de acesso e gestão de equipes.",
    details: ["Workspaces isolados", "Roles: owner, admin, member", "Convite de membros", "Limites por plano"],
  },
];

const PlatformFeatureCard = ({ feature, index }: { feature: typeof PLATFORM_FEATURES[0]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = feature.icon;

  return (
    <motion.div variants={fadeUp} custom={index}>
      <Card
        className={cn(
          "border-border/20 bg-card/30 overflow-hidden transition-all cursor-pointer group h-full",
          isOpen ? "border-primary/20 bg-card/50" : "hover:border-primary/10"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <Badge variant="secondary" className="text-[8px] h-4">{feature.tag}</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
            <MousePointerClick className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-1" strokeWidth={1.5} />
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/20 space-y-1.5">
                  {feature.details.map(d => (
                    <div key={d} className="flex items-center gap-2 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 text-accent-emerald shrink-0" strokeWidth={1.5} />
                      <span className="text-foreground/70">{d}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// ═══ INTEGRATIONS MAP ═══
// ═══════════════════════════════════════
const INTEGRATIONS = [
  { name: "WhatsApp", icon: Phone, status: "active", desc: "Atendimento e vendas 24/7" },
  { name: "Meta Ads", icon: Target, status: "active", desc: "Gestão de campanhas Meta" },
  { name: "Google Ads", icon: Globe, status: "active", desc: "Search & display campaigns" },
  { name: "LinkedIn", icon: Hash, status: "active", desc: "Prospecção B2B automatizada" },
  { name: "SendGrid", icon: MessageSquare, status: "active", desc: "Email marketing e transacional" },
  { name: "PayPal", icon: DollarSign, status: "active", desc: "Processamento de pagamentos" },
  { name: "HubSpot", icon: Briefcase, status: "coming", desc: "CRM e automação de marketing" },
  { name: "Salesforce", icon: Database, status: "coming", desc: "CRM enterprise" },
  { name: "Slack", icon: MessageSquare, status: "coming", desc: "Notificações e chat" },
  { name: "Zapier", icon: Zap, status: "coming", desc: "Automação cross-platform" },
  { name: "GitHub", icon: Code2, status: "active", desc: "Repos e CI/CD" },
  { name: "ElevenLabs", icon: Mic, status: "active", desc: "Voz AI para agentes" },
];

// ═══════════════════════════════════════
// ═══ ARCHITECTURE FLOW ═══
// ═══════════════════════════════════════
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
      accent ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]" : "border-border/40 bg-card/40"
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

const architectureDetails: Record<string, { title: string; desc: string; stats: string[] }> = {
  "Thor": { title: "Thor · Orquestrador", desc: "CEO digital. Recebe todas as requisições, classifica e distribui para a camada certa.", stats: ["Latência: 120ms", "Uptime: 99.97%", "2,400 tasks/dia"] },
  "Claude Code": { title: "Claude Code · Cérebro", desc: "Modelo de IA que lê repos inteiros, planeja arquitetura e faz code review.", stats: ["Context: 200K tokens", "Acurácia: 94.2%", "Claude 3.5 Sonnet"] },
  "OpenClaw": { title: "OpenClaw · Motor", desc: "Runtime que transforma planos em ações: cria arquivos, roda comandos, executa testes.", stats: ["12 agents paralelos", "Full filesystem", "~180 exec/hora"] },
  [`${totalAgents} Agents`]: { title: `${totalAgents} Agentes Especializados`, desc: "Cada agente é expert no seu departamento. Trabalham 24/7.", stats: ["15 departamentos", "24/7 operação", "Escala infinita"] },
};

const ClickableArchNode = ({ icon, label, sublabel, accent }: { icon: any; label: string; sublabel?: string; accent?: boolean }) => {
  const [open, setOpen] = useState(false);
  const detail = architectureDetails[label];

  return (
    <div className="relative">
      <FlowNode icon={icon} label={label} sublabel={sublabel} accent={accent} onClick={detail ? () => setOpen(!open) : undefined} />
      <AnimatePresence>
        {open && detail && (
          <>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-full top-0 ml-4 z-20 w-64 hidden lg:block">
              <Card className="p-4 border-primary/20 bg-card/95 backdrop-blur-xl shadow-xl">
                <h4 className="font-semibold text-sm mb-1.5">{detail.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{detail.desc}</p>
                <div className="space-y-1">
                  {detail.stats.map(s => (
                    <div key={s} className="flex items-center gap-2 text-[10px] font-mono text-primary/70">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />{s}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="lg:hidden overflow-hidden mt-2">
              <Card className="p-3 border-primary/20 bg-card/90 backdrop-blur-xl">
                <h4 className="font-semibold text-xs mb-1">{detail.title}</h4>
                <p className="text-[10px] text-muted-foreground mb-2">{detail.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {detail.stats.map(s => <span key={s} className="text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════
// ═══ MAIN PAGE ═══
// ═══════════════════════════════════════
const Architecture = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ STICKY NAV ═══ */}
      <div className="sticky top-16 z-30 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {NAV_SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/30 whitespace-nowrap transition-all"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ═══ 1. HERO ═══ */}
      <Section id="hero" className="pt-20 sm:pt-28 pb-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-[150px]" />
        </div>
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="text-center relative z-10">
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="text-[10px] px-3 py-1 mb-6 font-mono uppercase tracking-widest">
              <Radio className="h-3 w-3 mr-1.5 text-primary" strokeWidth={1.5} />
              Product Overview · Investor Deck
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6">
            <span className="text-foreground">Tudo que a</span><br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">plataforma oferece</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            {totalAgents} agentes em 15 departamentos. Orquestração inteligente. Execução autônoma. Tudo em um lugar.
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-sm text-muted-foreground/50 max-w-xl mx-auto mb-10">
            Clique em cada seção para explorar os detalhes. Essa é a visão completa do que entregamos.
          </motion.p>

          {/* Hero stats */}
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { value: String(totalAgents), label: "Agentes IA", icon: Bot },
              { value: "15", label: "Departamentos", icon: Users },
              { value: `${totalSavingsPercent}%`, label: "Economia vs CLT", icon: TrendingUp },
              { value: "24/7", label: "Operação", icon: Clock },
              { value: "12", label: "Integrações", icon: Link2 },
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

      {/* ═══ 2. COMMAND CENTER LIVE ═══ */}
      <Section id="command-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Interactive Preview</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Command Center · Live</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Explore o painel de controle. Troque as abas para ver agentes, atividade ao vivo, scrum board e métricas.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Card className="border-border/20 bg-card/20 overflow-hidden">
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

      {/* ═══ 3. ALL DEPARTMENTS ═══ */}
      <Section id="departments">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>15 Departamentos · {totalAgents} Agentes</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Empresa inteira em IA
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-3">
            Cada departamento tem agentes especializados. Clique para ver os agentes, quem substitui e as FAQs.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/20 border border-border/20">
              <DollarSign className="h-3.5 w-3.5 text-accent-emerald" strokeWidth={1.5} />
              <span className="text-xs">
                <span className="text-muted-foreground line-through">R${totalCltCost.toLocaleString()}</span>
                <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground/40" />
                <span className="text-accent-emerald font-bold">R${totalPrometheusCost.toLocaleString()}/mês</span>
              </span>
            </div>
            <Badge variant="secondary" className="text-accent-emerald bg-accent-emerald/10 border-0">
              Economia de {totalSavingsPercent}%
            </Badge>
          </motion.div>
          <DepartmentExplorer />
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ 4. PLATFORM FEATURES ═══ */}
      <Section id="platform">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Full Feature Set · 12 Módulos</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Funcionalidades da plataforma
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Clique em cada card para ver os detalhes técnicos de cada módulo.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORM_FEATURES.map((f, i) => (
              <PlatformFeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ 5. LIVE SIMULATION ═══ */}
      <Section id="simulation">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Live Execution</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Veja a IA trabalhando</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Simulação real: <span className="text-foreground font-medium">"Criar módulo de pagamentos"</span>. Clique Run para assistir Thor → Claude Code → OpenClaw em ação.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-3xl">
            <LiveSimulation />
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ 6. SYSTEM ARCHITECTURE ═══ */}
      <Section id="architecture">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>System Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Arquitetura completa</motion.h2>
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
            <ClickableArchNode icon={Bot} label={`${totalAgents} Agents`} sublabel="Workers" />
            <FlowArrow />
            <FlowNode icon={Server} label="Tools · FS · APIs · DB" />
          </motion.div>
        </motion.div>

        {/* 4 Layers */}
        <div className="mt-16 space-y-3">
          <SectionTag>System Layers</SectionTag>
          <h3 className="font-display text-2xl font-bold mb-6">4 camadas, 1 sistema</h3>
          {[
            { layer: "Layer 1", title: "Orquestração", subtitle: "Thor", icon: Zap, accent: true, desc: "Recebe, classifica e distribui todas as tarefas" },
            { layer: "Layer 2", title: "Inteligência", subtitle: "Claude Code", icon: Brain, accent: true, desc: "Planeja, raciocina e revisa código" },
            { layer: "Layer 3", title: "Execução", subtitle: "OpenClaw", icon: Cpu, accent: false, desc: "Executa ações reais no filesystem e terminal" },
            { layer: "Layer 4", title: "Workers", subtitle: `${totalAgents} Agents`, icon: Bot, accent: false, desc: "Agentes especializados por departamento" },
          ].map((l, i) => (
            <motion.div key={l.layer} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
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

        {/* Two Pillars */}
        <div className="mt-16">
          <SectionTag>Two Pillars</SectionTag>
          <h3 className="font-display text-2xl font-bold mb-6">Um pensa. O outro faz.</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-6 border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">Claude Code</h4><p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">Inteligência</p></div>
              </div>
              <ul className="space-y-2">
                {["Lê repos de 847+ arquivos", "Planeja arquitetura", "Gera código", "Code review", "Detecta vulnerabilidades"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-primary/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Context</p><p className="font-semibold text-sm">200K</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Accuracy</p><p className="font-semibold text-sm">94.2%</p></div>
              </div>
            </Card>
            <Card className="p-6 border-accent-emerald/20 bg-accent-emerald/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">OpenClaw</h4><p className="text-[10px] font-mono text-accent-emerald/60 uppercase tracking-wider">Execução</p></div>
              </div>
              <ul className="space-y-2">
                {["Cria/edita arquivos", "Roda comandos no terminal", "Executa testes", "Workflows paralelos", "Integra APIs externas"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-accent-emerald/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Parallel</p><p className="font-semibold text-sm">12</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Exec/hr</p><p className="font-semibold text-sm">~180</p></div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ═══ 7. INTEGRATIONS ═══ */}
      <Section id="integrations">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Ecosystem</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Integrações</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Plataformas que os agentes já conectam nativamente.
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {INTEGRATIONS.map((intg, i) => (
              <motion.div key={intg.name} variants={fadeUp} custom={i}>
                <Card className={cn(
                  "p-4 border-border/20 bg-card/30 transition-all",
                  intg.status === "active" ? "hover:border-primary/20" : "opacity-50"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <intg.icon className={cn("h-4 w-4", intg.status === "active" ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                    <span className="text-xs font-semibold">{intg.name}</span>
                    {intg.status === "active" ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald ml-auto" />
                    ) : (
                      <Badge variant="secondary" className="text-[8px] h-4 ml-auto">Soon</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{intg.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ FINAL ═══ */}
      <Section className="pb-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>The Bottom Line</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-5">
            Uma empresa inteira.<br /><span className="text-primary">Operada por IA.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-sm leading-relaxed mb-10">
            {totalAgents} agentes. 15 departamentos. 12 módulos. Orquestração inteligente. Tudo funcionando 24/7 com economia de {totalSavingsPercent}% vs contratação tradicional.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">Claude Code</p><p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">Inteligência</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">+</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">OpenClaw</p><p className="font-mono text-[9px] text-accent-emerald/60 uppercase tracking-widest">Execução</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">=</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Rocket className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">{totalAgents} Agents</p><p className="font-mono text-[9px] text-accent-amber/60 uppercase tracking-widest">Escala infinita</p></div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-12">
            <p className="text-[10px] text-muted-foreground/30 font-mono">clauthor.com · AI Command Center · {new Date().getFullYear()}</p>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
