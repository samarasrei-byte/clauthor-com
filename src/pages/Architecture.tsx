import { useState, useEffect, useCallback, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Cpu, Zap, Layers, Terminal, Eye, Database, Workflow, Bot, Server, Network, ArrowRight, ChevronDown, Code2, CheckCircle2, Play, Pause, MessageSquare, Clock, BookOpen, Search, Globe, Shield, BarChart3, Users, Lightbulb, MousePointerClick, Activity, Radio, Bell, Image, Kanban, Target, LineChart, Settings, Smartphone, TrendingUp, ChevronRight, Rocket, DollarSign, Hash, Link2, Mic, Send, AlertTriangle, FileText, Calendar, Package, Briefcase, Phone, Download, TrendingDown, ArrowUpRight, Palette, Star, ExternalLink } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { departments, deptDetails, totalAgents, totalClauthorCost, totalCltCost, totalSavingsPercent } from "@/data/departmentData";
import { CLAUTHOR_ORG_CHART, CLAUTHOR_AGENT_COUNT } from "@/data/clauthorOrgChart";

const ORG_DEPTS = CLAUTHOR_ORG_CHART.length;
const ORG_SQUADS = CLAUTHOR_ORG_CHART.reduce((s, d) => s + d.squads.length, 0);
const ORG_AGENTS = CLAUTHOR_AGENT_COUNT;

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
  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-3 block">{children}</span>
);

const Divider = () => (
  <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>
);

// ═══════════════════════════════════════
// ═══ NAV PILLS ═══
// ═══════════════════════════════════════
const NAV_SECTIONS = [
  { id: "hero", label: "Visão Geral" },
  { id: "overview", label: "Arquitetura" },
  { id: "orchestration", label: "Orquestração" },
  { id: "departments", label: "Departamentos" },
  { id: "squads", label: "Squads" },
  { id: "agents", label: "Agentes" },
  { id: "simulation", label: "Simulação" },
  { id: "command-center", label: "Command Center" },
  { id: "platform", label: "Plataforma" },
  { id: "integrations", label: "Integrações" },
  { id: "infrastructure", label: "Infraestrutura" },
];

// ═══════════════════════════════════════
// ═══ ARCHITECTURE FLOW ═══
// ═══════════════════════════════════════
const FlowArrow = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-6 bg-gradient-to-b from-primary/40 to-primary/10 relative">
      <ChevronDown className="h-3 w-3 text-primary/50 absolute -bottom-1.5 -left-[5px]" strokeWidth={1.5} />
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, label, sublabel, accent = false, glow = false, onClick }: {
  icon: any; label: string; sublabel?: string; accent?: boolean; glow?: boolean; onClick?: () => void;
}) => (
  <div onClick={onClick}
    className={cn("flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-sm transition-all w-full max-w-sm mx-auto",
      onClick && "cursor-pointer hover:scale-[1.02]",
      glow ? "border-primary/40 bg-primary/[0.08] shadow-[0_0_30px_hsl(var(--primary)/0.12)]" :
      accent ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]" : "border-border/40 bg-card/40")}>
    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
      glow ? "bg-primary/20" : accent ? "bg-primary/10" : "bg-muted/60")}>
      <Icon className={cn("h-4.5 w-4.5", accent || glow ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
    </div>
    <div>
      <p className={cn("text-sm font-semibold", accent || glow ? "text-primary" : "text-foreground")}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
    {onClick && <MousePointerClick className="h-3 w-3 text-muted-foreground/40 ml-auto" strokeWidth={1.5} />}
  </div>
);

const architectureDetails: Record<string, { title: string; desc: string; stats: string[] }> = {
  "AI Command Center": { title: "AI Command Center", desc: "Painel central onde o CEO humano monitora e gerencia toda a operação de IA. Interface de controle e visibilidade total.", stats: ["Dashboard em tempo real", "KPIs por departamento", "Alertas inteligentes"] },
  "Thor": { title: "Thor · Orquestrador", desc: "CEO Digital. Recebe todas as demandas, classifica prioridade e distribui para o departamento correto.", stats: ["Latência: 120ms", "Uptime: 99.97%", "2.400 tarefas/dia"] },
  "Departamentos": { title: `${ORG_DEPTS} Departamentos`, desc: "Organização empresarial completa. Cada departamento tem squads especializados com agentes dedicados.", stats: [`${ORG_DEPTS} departamentos`, `${ORG_SQUADS} squads`, `${ORG_AGENTS} agentes`] },
  "Squads": { title: `${ORG_SQUADS} Squads Inteligentes`, desc: "Equipes temáticas dentro de cada departamento. Coordenam agentes especializados para resultados específicos.", stats: ["Coordenação automática", "Roteamento inteligente", "Escalabilidade infinita"] },
  [`${totalAgents} Agentes`]: { title: `${ORG_AGENTS} Agentes Especializados`, desc: "Cada agente é um especialista em sua área. Trabalha 24/7, acionado por eventos.", stats: [`${ORG_DEPTS} departamentos`, "Operação 24/7", "Escala infinita"] },
  "Execution Engine": { title: "Execution Engine · Motor Proprietário", desc: "Runtime proprietário que transforma planos em ações reais: cria arquivos, executa comandos, roda testes.", stats: ["12 agentes em paralelo", "Acesso completo ao filesystem", "~180 exec/hora"] },
  "AI Gateway": { title: "AI Gateway · Roteador Inteligente", desc: "Roteamento dinâmico entre modelos. Tarefas simples → VPS local, tarefas complexas → modelos premium.", stats: ["Fallback automático", "Circuit breaker", "Multi-modelo"] },
  "AI Planner": { title: "AI Planner · Planejamento Estratégico", desc: "Módulo de inteligência para planejamento estratégico, code review e raciocínio complexo.", stats: ["Context: 200K tokens", "Precisão: 94.2%", "Multi-modelo"] },
  "Tools / Integrações": { title: "Ferramentas & APIs Externas", desc: "WhatsApp, Meta Ads, Google Ads, PayPal, GitHub, ElevenLabs e mais. Conexão nativa.", stats: ["12+ integrações", "APIs REST/GraphQL", "Webhooks em tempo real"] },
};

const ClickableArchNode = ({ icon, label, sublabel, accent, glow }: { icon: any; label: string; sublabel?: string; accent?: boolean; glow?: boolean }) => {
  const [open, setOpen] = useState(false);
  const detail = architectureDetails[label];
  return (
    <div className="relative w-full max-w-sm mx-auto">
      <FlowNode icon={icon} label={label} sublabel={sublabel} accent={accent} glow={glow} onClick={detail ? () => setOpen(!open) : undefined} />
      <AnimatePresence>
        {open && detail && (
          <>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-full top-0 ml-4 z-20 w-72 hidden lg:block">
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
// ═══ LAYER BADGES ═══
// ═══════════════════════════════════════
const LAYER_DEFS = [
  { layer: "Camada 1", title: "Interface", subtitle: "Command Center", icon: Eye, desc: "Painel de controle do CEO humano. Visibilidade total da operação." },
  { layer: "Camada 2", title: "Orquestração", subtitle: "Thor", icon: Zap, accent: true, desc: "Recebe, classifica e distribui todas as tarefas para os departamentos." },
  { layer: "Camada 3", title: "Organização", subtitle: "Departamentos → Squads → Agentes", icon: Users, desc: "Estrutura empresarial com departamentos, squads e agentes especializados." },
  { layer: "Camada 4", title: "Execução", subtitle: "Execution Engine", icon: Cpu, desc: "Motor proprietário que executa ações reais: filesystem, terminal, APIs externas." },
  { layer: "Camada 5", title: "Inteligência", subtitle: "AI Gateway → Multi-Modelo", icon: Brain, accent: true, desc: "Roteamento inteligente entre modelos de IA para raciocínio e planejamento." },
  { layer: "Camada 6", title: "Ferramentas", subtitle: "APIs & Integrações", icon: Link2, desc: "Conexões nativas com WhatsApp, Meta Ads, PayPal, GitHub e mais." },
];

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
            <Card className={cn("overflow-hidden transition-all cursor-pointer group",
              isOpen ? `${dept.borderActive} bg-card/50` : "border-border/20 bg-card/30 hover:border-border/40")}
              onClick={() => setExpanded(isOpen ? null : dept.id)}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", dept.iconBg)}>
                    <Icon className={cn("h-4 w-4", dept.color)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold capitalize">{dept.id}</h3>
                      {dept.popular && <Badge className="text-[8px] h-4 bg-accent-amber/10 text-accent-amber border-0">Popular</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{dept.agents.length} agentes · {dept.tokens} tokens</p>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform", isOpen && "rotate-180")} strokeWidth={1.5} />
                </div>

                {/* Agent pills */}
                <div className="flex flex-wrap gap-1.5">
                  {dept.agents.slice(0, isOpen ? undefined : 3).map(a => (
                    <Badge key={a.key} variant="secondary" className="text-[9px] h-5 font-normal">{a.role}</Badge>
                  ))}
                  {!isOpen && dept.agents.length > 3 && (
                    <Badge variant="secondary" className="text-[9px] h-5 font-normal">+{dept.agents.length - 3}</Badge>
                  )}
                </div>

                {/* Cost comparison */}
                <div className="mt-3 pt-3 border-t border-border/20 flex items-center gap-4 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">CLT: </span>
                    <span className="line-through text-destructive/60">R${dept.cltCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CLAUTHOR: </span>
                    <span className="text-accent-emerald font-semibold">R${dept.clauthorCost.toLocaleString()}</span>
                  </div>
                  <Badge className="text-[8px] h-4 bg-accent-emerald/10 text-accent-emerald border-0 ml-auto">-{dept.discount}%</Badge>
                </div>
              </div>

              <AnimatePresence>
                {isOpen && detail && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
                      {detail.replaces.length > 0 && (
                        <div>
                          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Substitui</p>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.replaces.map(r => (
                              <span key={r} className="text-[9px] text-destructive/60 bg-destructive/5 px-2 py-0.5 rounded-full line-through">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.faq.length > 0 && (
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
// ═══ SQUAD MAP ═══
// ═══════════════════════════════════════
const SQUAD_EXAMPLES = [
  { dept: "Marketing", color: "text-primary", squads: ["Content Squad", "Ads Squad", "SEO Squad", "Campaign Optimization", "Analytics Squad", "Community Squad"] },
  { dept: "Comercial", color: "text-cyan-400", squads: ["SDR Outbound", "SDR Inbound", "Closers", "Canal WhatsApp", "CRM Management"] },
  { dept: "Tecnologia", color: "text-blue-400", squads: ["Dev Full-Stack", "DevOps / SRE", "Security", "Data Engineering", "QA & Testing"] },
  { dept: "Financeiro", color: "text-amber-400", squads: ["CFO Virtual", "BI & Analytics", "Fiscal & Compliance", "Contabilidade", "Crédito & Recuperação"] },
  { dept: "Suporte", color: "text-emerald-400", squads: ["Atendimento N1/N2", "Call Center IA", "Onboarding", "Knowledge Base", "Omnichannel 24/7"] },
  { dept: "Prospecção", color: "text-orange-400", squads: ["SDR LinkedIn B2B", "SDR Instagram", "Social Selling", "Eventos & Parcerias", "Pré-Qualificação"] },
  { dept: "Operações", color: "text-indigo-400", squads: ["Orquestração A2A", "Concierge Executivo", "CEO Estratégico", "Pesquisa & Análise"] },
];

// ═══════════════════════════════════════
// ═══ AGENT SHOWCASE ═══
// ═══════════════════════════════════════
const SHOWCASE_AGENTS = [
  { name: "Content Strategist", dept: "Marketing", emoji: "✍️", task: "Criação de conteúdo multicanal", status: "working" },
  { name: "SEO Analyst", dept: "Marketing", emoji: "🔍", task: "Pesquisa de keywords e otimização", status: "working" },
  { name: "Ads Optimizer", dept: "Growth", emoji: "📢", task: "Otimização de campanhas Meta/Google", status: "working" },
  { name: "Data Analyst", dept: "Analytics", emoji: "📊", task: "Pipeline de dados e dashboards", status: "working" },
  { name: "Funnel Analyst", dept: "Growth", emoji: "🎯", task: "Análise de funil de conversão", status: "idle" },
  { name: "SDR Outbound", dept: "Vendas", emoji: "🚀", task: "Prospecção de 47 leads B2B", status: "working" },
  { name: "Support Agent", dept: "Suporte", emoji: "🎧", task: "Ticket #4521 - resolução em 2min", status: "working" },
  { name: "CFO Virtual", dept: "Financeiro", emoji: "💰", task: "Relatório mensal de fluxo de caixa", status: "working" },
  { name: "Dev Full-Stack", dept: "Tecnologia", emoji: "👨‍💻", task: "Refactor do módulo de autenticação", status: "working" },
  { name: "Growth Hacker", dept: "Growth", emoji: "📈", task: "A/B test campanha #12", status: "working" },
  { name: "Legal Analyst", dept: "Jurídico", emoji: "⚖️", task: "Review de contrato NDA", status: "idle" },
  { name: "HR Recruiter", dept: "RH", emoji: "👥", task: "Screening de 20 candidatos", status: "idle" },
];

// ═══════════════════════════════════════
// ═══ ORCHESTRATION RESPONSIBILITIES ═══
// ═══════════════════════════════════════
const THOR_RESPONSIBILITIES = [
  { icon: Workflow, title: "Distribuição de Tarefas", desc: "Classifica e roteia cada demanda para o departamento e squad correto automaticamente." },
  { icon: Users, title: "Coordenação de Squads", desc: "Gerencia a colaboração entre squads, garantindo que dependências sejam resolvidas." },
  { icon: Zap, title: "Acionamento de Agentes", desc: "Agentes não rodam continuamente - são acionados por eventos sob demanda." },
  { icon: Bell, title: "Gestão de Eventos", desc: "Monitora triggers (métricas, tickets, relatórios) e aciona workflows automaticamente." },
  { icon: AlertTriangle, title: "Priorização Inteligente", desc: "Avalia urgência, impacto e recursos disponíveis para definir ordem de execução." },
];

// ═══════════════════════════════════════
// ═══ LIVE TERMINAL SIMULATION ═══
// ═══════════════════════════════════════
const simulationSteps = [
  { agent: "Thor", icon: Zap, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📥 Tarefa recebida: \"Criar módulo de pagamentos\"",
    "🔍 Analisando contexto do sistema...",
    "📋 Classificação: alta prioridade, dept: fintech",
    "🧠 Roteando para AI Planner...",
  ]},
  { agent: "AI Planner", icon: Brain, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "📖 Lendo repositório... 847 arquivos",
    "🏗️ Plano criado: 5 etapas",
    "   1. Criar src/modules/payments/",
    "   2. Implementar PaymentService.ts",
    "   3. Criar PaymentController.ts",
    "   4. Testes unitários",
    "   5. Atualizar documentação",
    "✅ Plano validado → Execution Engine",
  ]},
  { agent: "Execution Engine", icon: Cpu, color: "text-accent-emerald", bgColor: "bg-accent-emerald/10", messages: [
    "⚡ Execução paralela iniciada...",
    "📁 mkdir src/modules/payments/ ✓",
    "📝 PaymentService.ts · 127 linhas ✓",
    "📝 PaymentController.ts · 89 linhas ✓",
    "🧪 Testes: 12/12 passando ✓",
    "📚 Docs atualizados ✓",
  ]},
  { agent: "AI Planner", icon: CheckCircle2, color: "text-primary", bgColor: "bg-primary/10", messages: [
    "🔍 Code review...",
    "✅ Lint: 0 erros | Types: OK | Cobertura: 94%",
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
    setCurrentStep(0); setCurrentMessage(0); setVisibleMessages([]);
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
              <span className="font-mono text-[10px] text-accent-emerald">ao vivo</span>
            </div>
          )}
          <Button onClick={isPlaying ? () => setIsPlaying(false) : start} size="sm" variant="ghost" className="h-6 px-2 gap-1.5 text-[10px]">
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlaying ? "Pausar" : visibleMessages.length > 0 ? "Replay" : "Executar"}
          </Button>
        </div>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto font-mono text-xs space-y-1 min-h-[200px]">
        {visibleMessages.length === 0 && (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground/30">
            <div className="text-center">
              <Terminal className="h-8 w-8 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-[11px]">Clique Executar para assistir a IA em ação</p>
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
// ═══ COMMAND CENTER TABS ═══
// ═══════════════════════════════════════
const MOCK_AGENTS = [
  { name: "SDR Outbound", dept: "Vendas", status: "running", task: "Prospecting 47 leads", progress: 72, executions: 1847, latency: "120ms" },
  { name: "Content Writer", dept: "Marketing", status: "running", task: "Blog: AI Trends 2026", progress: 45, executions: 923, latency: "340ms" },
  { name: "Data Analyst", dept: "Analytics", status: "idle", task: "Aguardando dados", progress: 0, executions: 2341, latency: "90ms" },
  { name: "Support Agent", dept: "Suporte", status: "running", task: "Ticket #4521", progress: 88, executions: 5102, latency: "200ms" },
  { name: "Dev Agent", dept: "Tecnologia", status: "running", task: "Refactoring auth", progress: 34, executions: 1204, latency: "450ms" },
  { name: "CFO Agent", dept: "Financeiro", status: "completed", task: "Relatório gerado", progress: 100, executions: 342, latency: "180ms" },
  { name: "HR Recruiter", dept: "RH", status: "idle", task: "Screening pausado", progress: 0, executions: 567, latency: "150ms" },
  { name: "Growth Hacker", dept: "Marketing", status: "running", task: "A/B test #12", progress: 61, executions: 1089, latency: "280ms" },
];

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  running: { dot: "bg-accent-emerald", text: "text-accent-emerald", label: "Executando" },
  idle: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Idle" },
  completed: { dot: "bg-primary", text: "text-primary", label: "Concluído" },
};

const CommandCenterPreview = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 2000); return () => clearInterval(t); }, []);

  const agents = useMemo(() => MOCK_AGENTS.map(a => ({
    ...a, progress: a.status === "running" ? Math.min(99, a.progress + (tick % 5)) : a.progress,
  })), [tick]);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {agents.map((agent, i) => {
        const st = STATUS_STYLES[agent.status];
        return (
          <motion.div key={agent.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 border-border/20 bg-card/30 hover:border-primary/20 transition-all">
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

// ═══════════════════════════════════════
// ═══ PLATFORM FEATURES ═══
// ═══════════════════════════════════════
const PLATFORM_FEATURES = [
  { icon: Bot, title: "Agent Command Center", tag: "Core", desc: "Monitoramento em tempo real de todos os agentes com status, tarefas e métricas.", details: ["Cards de status dos agentes", "Progresso em tempo real", "Métricas de execução", "Filtros por departamento"] },
  { icon: MessageSquare, title: "THOR · Orquestrador", tag: "Brain", desc: "IA conversacional que orquestra todos os agentes automaticamente.", details: ["Chat com contexto", "Delegação automática", "Memória de longo prazo", "Sugestões proativas"] },
  { icon: Settings, title: "Criador de Agentes", tag: "Builder", desc: "Crie agentes customizados com nome, tipo, tarefas, cron e integrações.", details: ["4 tipos: marketing, analytics, automação, pesquisa", "Configuração de cron", "Seleção de integrações", "Templates prontos"] },
  { icon: Workflow, title: "Automação de Tarefas", tag: "Automação", desc: "Defina rotinas automatizadas: análise de tráfego, relatórios semanais, criativos diários.", details: ["Workflow visual", "Triggers cron/evento", "Sequências de agentes", "Notificações WhatsApp"] },
  { icon: Activity, title: "Atividade em Tempo Real", tag: "Monitoramento", desc: "Logs visuais ao vivo de qual agente está rodando, a tarefa e o tempo.", details: ["Feed de atividade em tempo real", "Filtros por agente e tipo", "Alertas automáticos de erro", "Histórico exportável"] },
  { icon: Shield, title: "Segurança Avançada", tag: "Segurança", desc: "Criptografia AES-256, RLS, audit logs, controle de acesso por papel.", details: ["Credenciais criptografadas por agente", "Logs de auditoria", "Row Level Security (RLS)", "Controle de acesso por tenant"] },
  { icon: Kanban, title: "AI Scrum Board", tag: "Gestão", desc: "Backlog, Em Progresso, Teste, Concluído - cada agente como tarefa visual.", details: ["Kanban drag-and-drop", "Prioridades e prazos", "Histórico de execução", "Métricas de throughput"] },
  { icon: BookOpen, title: "Base de Conhecimento", tag: "Conhecimento", desc: "Base de conhecimento com busca vetorial que alimenta todos os agentes.", details: ["Upload de documentos", "Busca full-text", "Integração RAG", "Categorização automática"] },
  { icon: LineChart, title: "Dashboards de Dados", tag: "Analytics", desc: "Tráfego, ROI, conversões, criativos e campanhas em dashboards interativos.", details: ["Gráficos interativos em tempo real", "KPIs por departamento", "Exportação de relatórios", "Alertas de anomalia"] },
];

const PlatformFeatureCard = ({ feature, index }: { feature: typeof PLATFORM_FEATURES[0]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = feature.icon;
  return (
    <motion.div variants={fadeUp} custom={index}>
      <Card className={cn("border-border/20 bg-card/30 overflow-hidden transition-all cursor-pointer group h-full", isOpen ? "border-primary/20 bg-card/50" : "hover:border-primary/10")}
        onClick={() => setIsOpen(!isOpen)}>
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
// ═══ INTEGRATIONS ═══
// ═══════════════════════════════════════
const INTEGRATIONS = [
  { name: "WhatsApp", icon: Phone, status: "active", desc: "Suporte & vendas 24/7" },
  { name: "Meta Ads", icon: Target, status: "active", desc: "Gestão de campanhas Meta" },
  { name: "Google Ads", icon: Globe, status: "active", desc: "Campanhas search & display" },
  { name: "LinkedIn", icon: Hash, status: "active", desc: "Prospecção B2B automatizada" },
  { name: "PayPal", icon: DollarSign, status: "active", desc: "Processamento de pagamentos" },
  { name: "GitHub", icon: Code2, status: "active", desc: "Repos & CI/CD" },
  { name: "ElevenLabs", icon: Mic, status: "active", desc: "Voz IA para agentes" },
  { name: "AI Planner", icon: Brain, status: "active", desc: "Planejamento & code review" },
  { name: "HubSpot", icon: Briefcase, status: "coming", desc: "CRM & automação de marketing" },
  { name: "Salesforce", icon: Database, status: "coming", desc: "CRM enterprise" },
  { name: "Slack", icon: MessageSquare, status: "coming", desc: "Notificações & chat" },
  { name: "Zapier", icon: Zap, status: "coming", desc: "Automação cross-platform" },
];

// ═══════════════════════════════════════
// ═══ MAIN PAGE ═══
// ═══════════════════════════════════════
const Architecture = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO title="Platform Architecture — Clauthor AI Stack" description="Deep dive into Clauthor's autonomous AI architecture: orchestration, RAG, memory, integrations and command center." path="/architecture" />

      <div className="max-w-6xl mx-auto px-4 pt-6">
      </div>


      {/* ═══ STICKY NAV ═══ */}
      <div className="sticky top-16 z-30 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {NAV_SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/30 whitespace-nowrap transition-all">
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <Section id="hero" className="pt-20 sm:pt-28 pb-12 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.03] blur-[150px]" />
        </div>
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="text-center relative z-10">
          <motion.div variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="text-[10px] px-3 py-1 mb-6 font-mono uppercase tracking-widest">
              <Radio className="h-3 w-3 mr-1.5 text-primary" strokeWidth={1.5} />
              AI Company Command Center
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6">
            <span className="text-foreground">Sua empresa</span><br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">operada por agentes de IA</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4">
            {totalAgents} agentes em 15 departamentos. Orquestração inteligente. Execução autônoma. Tudo em um só lugar.
          </motion.p>
          <motion.p variants={fadeUp} custom={3} className="text-sm text-muted-foreground/50 max-w-xl mx-auto mb-10">
            Clique em cada seção para explorar os detalhes técnicos da arquitetura.
          </motion.p>
          <motion.div variants={fadeUp} custom={4} className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { value: String(totalAgents), label: "Agentes IA", icon: Bot },
              { value: "15", label: "Departamentos", icon: Users },
              { value: `${totalSavingsPercent}%`, label: "Economia", icon: TrendingUp },
              { value: "24/7", label: "Operação", icon: Clock },
              { value: "12+", label: "Integrações", icon: Link2 },
              { value: "98.7%", label: "Taxa de Sucesso", icon: CheckCircle2 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <s.icon className="h-4 w-4 text-primary/50 mx-auto mb-1.5" strokeWidth={1.5} />
                <p className="font-display text-2xl sm:text-3xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ SECTION 1 - SYSTEM OVERVIEW ═══ */}
      <Section id="overview">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>Seção 1 · Visão Geral do Sistema</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Arquitetura Completa</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto text-sm mb-10">
            Clique em cada camada para ver detalhes técnicos e métricas de performance.
          </motion.p>

          {/* Full Architecture Flow */}
          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1 relative">
            <ClickableArchNode icon={Eye} label="User" sublabel="Requisição" />
            <FlowArrow />
            <ClickableArchNode icon={Radio} label="AI Command Center" sublabel="Painel de Controle" glow />
            <FlowArrow />
            <ClickableArchNode icon={Zap} label="Thor" sublabel="Orquestrador Central" accent />
            <FlowArrow />
            <ClickableArchNode icon={Users} label="Departamentos" sublabel={`${ORG_DEPTS} departamentos`} />
            <FlowArrow />
            <ClickableArchNode icon={Network} label="Squads" sublabel={`${ORG_SQUADS} squads inteligentes`} />
            <FlowArrow />
            <ClickableArchNode icon={Bot} label={`${totalAgents} Agentes`} sublabel="Workers especializados" />
            <FlowArrow />
            <ClickableArchNode icon={Cpu} label="Execution Engine" sublabel="Motor Proprietário" />
            <FlowArrow />
            <ClickableArchNode icon={Workflow} label="AI Gateway" sublabel="Roteador Multi-Modelo" />
            <FlowArrow />
            <ClickableArchNode icon={Brain} label="AI Planner" sublabel="Planejamento Estratégico" accent />
            <FlowArrow />
            <ClickableArchNode icon={Link2} label="Tools / Integrações" sublabel="WhatsApp, Meta, PayPal..." />
          </motion.div>
        </motion.div>

        {/* Layer Cards */}
        <div className="mt-16 space-y-3">
          <SectionTag>Camadas do Sistema</SectionTag>
          <h3 className="font-display text-2xl font-bold mb-6">6 camadas, 1 sistema</h3>
          {LAYER_DEFS.map((l, i) => (
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
      </Section>

      <Divider />

      {/* ═══ SECTION 2 - ORCHESTRATION LAYER ═══ */}
      <Section id="orchestration">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Seção 2 · Camada de Orquestração</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Thor · Orquestrador Central</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Thor é o CEO Digital da plataforma. Recebe todas as demandas, classifica, prioriza e distribui para o departamento e squad corretos. Agentes <span className="text-foreground font-medium">não rodam continuamente</span> - são acionados apenas quando necessário.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {THOR_RESPONSIBILITIES.map((r, i) => (
              <motion.div key={r.title} variants={fadeUp} custom={i}>
                <Card className="p-5 border-border/20 bg-card/30 hover:border-primary/15 transition-all h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold">{r.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Two Pillars */}
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-6 border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">AI Planner</h4><p className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">Inteligência</p></div>
              </div>
              <ul className="space-y-2">
                {["Lê repositórios com 847+ arquivos", "Planeja arquitetura", "Gera código", "Code review", "Detecta vulnerabilidades"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-primary/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Contexto</p><p className="font-semibold text-sm">200K</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Precisão</p><p className="font-semibold text-sm">94.2%</p></div>
              </div>
            </Card>
            <Card className="p-6 border-accent-emerald/20 bg-accent-emerald/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
                </div>
                <div><h4 className="font-display text-lg font-bold">Execution Engine</h4><p className="text-[10px] font-mono text-accent-emerald/60 uppercase tracking-wider">Execução</p></div>
              </div>
              <ul className="space-y-2">
                {["Cria/edita arquivos", "Executa comandos no terminal", "Roda testes", "Workflows em paralelo", "Integra APIs externas"].map(t => (
                  <li key={t} className="flex items-center gap-2 text-xs text-foreground/80"><div className="w-1 h-1 rounded-full bg-accent-emerald/50" />{t}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border/20 flex gap-6">
                <div><p className="font-mono text-[9px] text-muted-foreground">Paralelo</p><p className="font-semibold text-sm">12</p></div>
                <div><p className="font-mono text-[9px] text-muted-foreground">Exec/hr</p><p className="font-semibold text-sm">~180</p></div>
              </div>
            </Card>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ SECTION 3 - DEPARTMENTS ═══ */}
      <Section id="departments">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Seção 3 · Departamentos</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Organização Empresarial</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            O sistema organiza os agentes como uma empresa real. Cada departamento contém squads especializados com agentes dedicados.
          </motion.p>
          <DepartmentExplorer />
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ SECTION 4 - SQUADS ═══ */}
      <Section id="squads">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Seção 4 · Squads</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">{ORG_SQUADS} Squads Inteligentes</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Cada departamento contém squads responsáveis por resultados específicos. Os squads coordenam grupos de agentes especializados.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SQUAD_EXAMPLES.map((dept, i) => (
              <motion.div key={dept.dept} variants={fadeUp} custom={i}>
                <Card className="p-5 border-border/20 bg-card/30 h-full">
                  <h3 className={cn("text-sm font-bold mb-3", dept.color)}>{dept.dept}</h3>
                  <div className="space-y-2">
                    {dept.squads.map(sq => (
                      <div key={sq} className="flex items-center gap-2 text-[11px] text-foreground/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30 shrink-0" />
                        {sq}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ SECTION 5 - AGENTS ═══ */}
      <Section id="agents">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Seção 5 · Agentes</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">{totalAgents} Agentes Especializados</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Cada agente é um especialista em sua área. Trabalham 24/7, acionados por eventos, distribuídos entre departamentos e squads.
          </motion.p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {SHOWCASE_AGENTS.map((agent, i) => (
              <motion.div key={agent.name} initial={{ opacity: 0, rotateX: 15, y: 20 }} whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className={cn("p-3 text-center border-border/20 transition-all hover:scale-105",
                  agent.status === "working" ? "bg-primary/[0.03] border-primary/10" : "bg-card/20")}>
                  <div className="text-2xl mb-1.5">{agent.emoji}</div>
                  <p className="text-[10px] font-semibold truncate">{agent.name}</p>
                  <Badge variant="secondary" className="text-[8px] h-4 mt-1 mb-1">{agent.dept}</Badge>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === "working" ? "bg-accent-emerald animate-pulse" : "bg-muted-foreground/40")} />
                    <span className="text-[8px] text-muted-foreground truncate">{agent.task}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Agent count by dept */}
          <div className="mt-10">
            <Card className="p-5 border-border/20 bg-card/30">
              <p className="text-xs font-semibold mb-4">Distribuição de Agentes por Departamento</p>
              <div className="space-y-2.5">
                {departments.slice(0, 8).map(dept => {
                  const pct = Math.round((dept.agents.length / totalAgents) * 100 * (totalAgents / departments.reduce((a, d) => a + d.agents.length, 0)));
                  return (
                    <div key={dept.id} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0 capitalize">{dept.id}</span>
                      <div className="flex-1 bg-muted/20 rounded-full h-2">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary" initial={{ width: 0 }} whileInView={{ width: `${Math.min(pct, 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-10">{dept.agents.length} agt</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ LIVE SIMULATION ═══ */}
      <Section id="simulation">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Execução ao Vivo</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Veja a IA trabalhando</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Simulação real: <span className="text-foreground font-medium">"Criar módulo de pagamentos"</span>. Clique Executar para assistir Thor → AI Planner → Execution Engine em ação.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-3xl"><LiveSimulation /></motion.div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ COMMAND CENTER ═══ */}
      <Section id="command-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Command Center · Preview</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Painel de Controle</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Monitoramento em tempo real de todos os agentes com status, tarefas e métricas de execução.
          </motion.p>
          <CommandCenterPreview />
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ PLATFORM FEATURES ═══ */}
      <Section id="platform">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Recursos da Plataforma · {PLATFORM_FEATURES.length} Módulos</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Funcionalidades</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Clique em cada card para ver detalhes técnicos.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORM_FEATURES.map((f, i) => <PlatformFeatureCard key={f.title} feature={f} index={i} />)}
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ INTEGRATIONS ═══ */}
      <Section id="integrations">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Ecossistema</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Integrações</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-8">
            Plataformas que os agentes conectam nativamente.
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {INTEGRATIONS.map((intg, i) => (
              <motion.div key={intg.name} variants={fadeUp} custom={i}>
                <Card className={cn("p-4 border-border/20 bg-card/30 transition-all", intg.status === "active" ? "hover:border-primary/20" : "opacity-50")}>
                  <div className="flex items-center gap-2 mb-2">
                    <intg.icon className={cn("h-4 w-4", intg.status === "active" ? "text-primary" : "text-muted-foreground")} strokeWidth={1.5} />
                    <span className="text-xs font-semibold">{intg.name}</span>
                    {intg.status === "active" ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald ml-auto" />
                    ) : (
                      <Badge variant="secondary" className="text-[8px] h-4 ml-auto">Em breve</Badge>
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

      {/* ═══ INFRASTRUCTURE SETUP ═══ */}
      <Section id="infrastructure">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Infraestrutura · Setup Guide</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-3">Configuração da Infraestrutura</motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-sm leading-relaxed mb-10">
            Guia passo a passo para configurar o pipeline completo: DNS, SSL, VPS e templates dos agentes.
          </motion.p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* DNS + SSL Setup */}
            <motion.div variants={fadeUp} className="space-y-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" strokeWidth={1.5} />
                Conexão VPS & Execution Engine
              </h3>

              {/* Step 1 */}
              <Card className="border-primary/20 bg-card/30 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Passo 1</Badge>
                    <h4 className="text-sm font-semibold">Configure o DNS no Cloudflare</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">No painel do Cloudflare, crie o registro A apontando para o VPS:</p>
                  <Card className="bg-muted/10 border-border/20 p-3 font-mono text-[11px] space-y-1.5">
                    <div className="flex items-center gap-2"><span className="text-muted-foreground w-14">Type:</span><span className="text-foreground font-semibold">A</span></div>
                    <div className="flex items-center gap-2"><span className="text-muted-foreground w-14">Name:</span><span className="text-foreground font-semibold">api</span></div>
                    <div className="flex items-center gap-2"><span className="text-muted-foreground w-14">IP:</span><span className="text-primary font-semibold">IP_DO_VPS</span></div>
                    <div className="flex items-center gap-2"><span className="text-muted-foreground w-14">Proxy:</span><span className="text-accent-amber font-semibold">ON ☁️</span></div>
                  </Card>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-accent-emerald">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
                    <span>Resultado: <code className="bg-muted/20 px-1.5 py-0.5 rounded text-foreground">api.clauthor.com</code></span>
                  </div>
                </div>
              </Card>

              {/* Step 2 */}
              <Card className="border-accent-emerald/20 bg-card/30 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-accent-emerald/10 text-accent-emerald border-0 text-[10px]">Passo 2</Badge>
                    <h4 className="text-sm font-semibold">Instale SSL no VPS</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">No Ubuntu, instale o Certbot e gere o certificado Let's Encrypt:</p>
                  <Card className="bg-muted/10 border-border/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 bg-muted/10">
                      <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-destructive/60" /><div className="w-2 h-2 rounded-full bg-accent-amber/60" /><div className="w-2 h-2 rounded-full bg-accent-emerald/60" /></div>
                      <span className="font-mono text-[9px] text-muted-foreground">terminal</span>
                    </div>
                    <div className="p-3 font-mono text-[10px] space-y-1 text-muted-foreground">
                      <p><span className="text-accent-emerald">$</span> sudo apt update</p>
                      <p><span className="text-accent-emerald">$</span> sudo apt install certbot python3-certbot-nginx</p>
                      <p><span className="text-accent-emerald">$</span> sudo certbot --nginx -d api.clauthor.com</p>
                    </div>
                  </Card>
                  <p className="text-[10px] text-muted-foreground mt-2">Gera certificado válido com Let's Encrypt automaticamente.</p>
                </div>
              </Card>

              {/* Step 3 */}
              <Card className="border-accent-amber/20 bg-card/30 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-accent-amber/10 text-accent-amber border-0 text-[10px]">Passo 3</Badge>
                    <h4 className="text-sm font-semibold">Ajuste SSL no Cloudflare</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">No painel SSL/TLS do Cloudflare, configure o modo:</p>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent-amber/5 border border-accent-amber/20">
                    <Shield className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-bold">Full (strict)</p>
                      <p className="text-[10px] text-muted-foreground">Cloudflare ↔ VPS: criptografia ponta a ponta</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Architecture Diagram */}
              <Card className="border-border/30 bg-card/20 p-5">
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-4">Arquitetura de Rede</p>
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="User" sublabel="Requisição HTTPS" />
                  <FlowArrow />
                  <FlowNode icon={Shield} label="Cloudflare" sublabel="SSL Termination + CDN" accent />
                  <FlowArrow />
                  <FlowNode icon={Globe} label="api.clauthor.com" sublabel="DNS A Record" />
                  <FlowArrow />
                  <FlowNode icon={Server} label="VPS" sublabel="Let's Encrypt SSL" />
                  <FlowArrow />
                  <FlowNode icon={Cpu} label="Execution Engine" sublabel="Motor Proprietário" glow />
                </div>
              </Card>
            </motion.div>

            {/* Agent Templates Status */}
            <motion.div variants={fadeUp} className="space-y-4">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" strokeWidth={1.5} />
                Templates dos 200 Agentes
              </h3>

              <Card className="border-primary/20 bg-card/30 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold">Status dos Templates</h4>
                  <Badge className="bg-accent-emerald/10 text-accent-emerald border-0 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    253 Populados
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Todos os templates foram inseridos na tabela <code className="bg-muted/20 px-1 py-0.5 rounded text-[10px]">agent_templates</code> com system prompts e instruções.
                </p>
                <div className="w-full bg-muted/20 rounded-full h-2 mb-4">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-emerald/60 to-accent-emerald w-full" />
                </div>
              </Card>

              {/* Table Schema */}
              <Card className="border-border/20 bg-card/30 overflow-hidden">
                <div className="p-5">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    Estrutura: agent_templates
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { field: "id", type: "uuid", desc: "Identificador único" },
                      { field: "name", type: "text", desc: "Nome do agente" },
                      { field: "slug", type: "text", desc: "Identificador único (URL-safe)" },
                      { field: "system_prompt", type: "text", desc: "Prompt de sistema com disciplina de área" },
                      { field: "instructions", type: "text", desc: "Instruções específicas do papel" },
                      { field: "tier", type: "enum", desc: "basic | intermediate | advanced | enterprise" },
                      { field: "tags", type: "text[]", desc: "Categorias e departamento" },
                      { field: "default_integrations", type: "jsonb", desc: "Ferramentas e APIs disponíveis" },
                      { field: "default_actions", type: "jsonb", desc: "Ações padrão do agente" },
                      { field: "is_active", type: "boolean", desc: "Status de ativação" },
                    ].map(row => (
                      <div key={row.field} className="flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-md hover:bg-muted/10 transition-colors">
                        <code className="font-mono text-primary/80 w-36 shrink-0">{row.field}</code>
                        <Badge variant="secondary" className="text-[8px] h-4 w-14 justify-center shrink-0">{row.type}</Badge>
                        <span className="text-muted-foreground">{row.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Example Agent */}
              <Card className="border-border/20 bg-card/30 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 bg-muted/10">
                  <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-destructive/60" /><div className="w-2 h-2 rounded-full bg-accent-amber/60" /><div className="w-2 h-2 rounded-full bg-accent-emerald/60" /></div>
                  <span className="font-mono text-[9px] text-muted-foreground">exemplo de registro</span>
                </div>
                <div className="p-4 font-mono text-[10px] space-y-1.5">
                  <div><span className="text-muted-foreground">name:</span> <span className="text-primary">"SEO Analyst"</span></div>
                  <div><span className="text-muted-foreground">slug:</span> <span className="text-foreground">"seo_analyst"</span></div>
                  <div><span className="text-muted-foreground">department:</span> <span className="text-foreground">"Marketing"</span></div>
                  <div><span className="text-muted-foreground">squad:</span> <span className="text-foreground">"SEO Squad"</span></div>
                  <div><span className="text-muted-foreground">role:</span> <span className="text-foreground">"keyword analysis"</span></div>
                  <div><span className="text-muted-foreground">tools:</span> <span className="text-accent-emerald">["google_search_api", "analytics_api"]</span></div>
                  <div><span className="text-muted-foreground">triggers:</span> <span className="text-accent-amber">["ranking_drop", "new_content"]</span></div>
                  <div><span className="text-muted-foreground">status:</span> <span className="text-accent-emerald">active ✓</span></div>
                </div>
              </Card>

              {/* Checklist */}
              <Card className="border-border/20 bg-card/30 p-5">
                <h4 className="text-sm font-semibold mb-3">Checklist de Deploy</h4>
                <div className="space-y-2">
                  {[
                    { label: "DNS Cloudflare configurado (api.clauthor.com)", done: false },
                    { label: "SSL Let's Encrypt instalado no VPS", done: false },
                    { label: "Cloudflare SSL → Full (strict)", done: false },
                    { label: "Templates dos 200 agentes populados", done: true },
                    { label: "AI Gateway configurado (LOVABLE_API_KEY)", done: true },
                    { label: "Edge Functions deployadas", done: true },
                    { label: "RLS policies ativas", done: true },
                    { label: "Sistema multi-tenant operacional", done: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-[11px]">
                      <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0", item.done ? "text-accent-emerald" : "text-muted-foreground/30")} strokeWidth={1.5} />
                      <span className={item.done ? "text-foreground/80" : "text-muted-foreground"}>{item.label}</span>
                      {!item.done && <Badge variant="secondary" className="text-[8px] h-4 ml-auto">Pendente</Badge>}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <Divider />

      {/* ═══ FINAL ═══ */}
      <Section className="pb-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>O Resultado</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-5">
            Uma empresa inteira.<br /><span className="text-primary">Operada por IA.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-sm leading-relaxed mb-10">
            {totalAgents} agentes. 15 departamentos. 37 squads. Orquestração inteligente. Tudo rodando 24/7 com {totalSavingsPercent}% de economia vs contratação tradicional.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">AI Planner</p><p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">Inteligência</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">+</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">Execution Engine</p><p className="font-mono text-[9px] text-accent-emerald/60 uppercase tracking-widest">Execução</p></div>
            </div>
            <span className="text-muted-foreground font-mono text-lg">=</span>
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Rocket className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left"><p className="font-semibold text-sm">{totalAgents} Agentes</p><p className="font-mono text-[9px] text-accent-amber/60 uppercase tracking-widest">Escala infinita</p></div>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-12">
            <p className="text-[10px] text-muted-foreground/30 font-mono">clauthor.com · AI Company Command Center · {new Date().getFullYear()}</p>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
