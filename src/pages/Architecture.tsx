import { motion } from "framer-motion";
import { 
  Brain, Cpu, Zap, ArrowDown, GitBranch, Layers, Terminal, 
  FolderCode, TestTube, FileCode, Eye, Database, Workflow,
  Bot, Server, HardDrive, Network, Shield, Boxes, ArrowRight,
  ChevronDown, Code2, Cog, FileSearch, PenTool, CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";

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

const FlowArrow = () => (
  <div className="flex justify-center py-3">
    <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-primary/10 relative">
      <ChevronDown className="h-3 w-3 text-primary/50 absolute -bottom-1.5 -left-[5px]" strokeWidth={1.5} />
    </div>
  </div>
);

const FlowNode = ({ icon: Icon, label, sublabel, accent = false }: { icon: any; label: string; sublabel?: string; accent?: boolean }) => (
  <motion.div
    variants={fadeUp}
    className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-sm ${
      accent 
        ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.08)]" 
        : "border-border/40 bg-card/40"
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-primary/10" : "bg-muted/60"}`}>
      <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
    </div>
    <div>
      <p className={`text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
  </motion.div>
);

const Architecture = () => {
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
            <SectionTag>System Architecture</SectionTag>
          </motion.div>
          <motion.h1
            variants={fadeUp} custom={1}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-foreground">AI Operating</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-primary">
              System
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp} custom={2}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Uma arquitetura onde 88 agentes de IA operam como departamentos de uma empresa —
            com orquestração, raciocínio e execução em camadas distintas.
          </motion.p>

          {/* Mini flow */}
          <motion.div variants={fadeUp} custom={3} className="inline-flex flex-col items-center gap-1">
            {[
              { icon: Eye, label: "Usuário" },
              { icon: Zap, label: "Thor", accent: true },
              { icon: Brain, label: "Cérebro" },
              { icon: Cpu, label: "Execução" },
              { icon: Bot, label: "88 Agentes" },
            ].map((n, i) => (
              <div key={n.label}>
                {i > 0 && <FlowArrow />}
                <FlowNode {...n} />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 2. CONCEITO PRINCIPAL === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}>
            <SectionTag>Core Concept</SectionTag>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Uma empresa digital autônoma
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            O sistema replica a estrutura de uma empresa real — com orquestração, inteligência e execução — criando um sistema infinitamente escalável.
          </motion.p>

          <motion.div variants={fadeUp} className="grid sm:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: "Orquestração", desc: "Thor distribui e coordena" },
              { icon: Brain, title: "Inteligência", desc: "Claude Code raciocina e planeja" },
              { icon: Cpu, title: "Execução", desc: "OpenClaw executa as tarefas" },
              { icon: Bot, title: "Workers", desc: "88 agentes especializados" },
            ].map((c) => (
              <Card key={c.title} className="p-5 border-border/30 bg-card/40">
                <c.icon className="h-5 w-5 text-primary mb-3" strokeWidth={1.5} />
                <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 3. OPENCLAW VS CLAUDE CODE === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}>
            <SectionTag>Two Layers, One System</SectionTag>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-12">
            Claude Code vs OpenClaw
          </motion.h2>

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
                    <p className="text-[11px] font-mono text-primary/60 uppercase tracking-wider">Intelligence Layer</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Modelo inteligente responsável pelo raciocínio, planejamento e arquitetura de soluções complexas.
                </p>
                <ul className="space-y-2.5">
                  {["Raciocínio e análise", "Arquitetura de sistemas", "Leitura de repos grandes", "Geração de código", "Code review"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-border/20">
                  <p className="font-mono text-xs text-primary/70 font-semibold">Claude Code = Cérebro</p>
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
                    <p className="text-[11px] font-mono text-accent-emerald/60 uppercase tracking-wider">Execution Layer</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Framework de execução de agentes. Runtime que transforma planos em ações concretas.
                </p>
                <ul className="space-y-2.5">
                  {["Execução de tarefas", "Manipulação de arquivos", "Rodar comandos", "Workflows de agentes", "Automação de dev"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="w-1 h-1 rounded-full bg-accent-emerald" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-5 border-t border-border/20">
                  <p className="font-mono text-xs text-accent-emerald/70 font-semibold">OpenClaw = Execução</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 4. CONCEITO CENTRAL === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>Central Concept</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-12">
            Pensar e Executar
          </motion.h2>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <Card className="p-8 border-primary/20 bg-primary/[0.03] text-center w-full sm:w-64">
              <Brain className="h-10 w-10 text-primary mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-display text-xl font-bold mb-2">Claude Code</h3>
              <p className="font-mono text-xs text-primary/60 uppercase tracking-widest">Pensa</p>
            </Card>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-12 h-px bg-border/50" />
              <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <div className="w-12 h-px bg-border/50" />
            </div>
            <div className="sm:hidden">
              <FlowArrow />
            </div>

            <Card className="p-8 border-accent-emerald/20 bg-accent-emerald/[0.03] text-center w-full sm:w-64">
              <Cpu className="h-10 w-10 text-accent-emerald mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-display text-xl font-bold mb-2">OpenClaw</h3>
              <p className="font-mono text-xs text-accent-emerald/60 uppercase tracking-widest">Executa</p>
            </Card>
          </motion.div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 5. EVOLUÇÃO DA ARQUITETURA === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Architecture Evolution</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-4">
            De simples para escalável
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            A adição de Claude Code e OpenClaw transforma a arquitetura plana em um sistema de múltiplas camadas.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Before */}
            <motion.div variants={fadeUp}>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">Antes</p>
              <Card className="p-6 border-border/30 bg-card/30">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="Usuário" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Orquestrador" accent />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="88 Agentes" />
                </div>
              </Card>
            </motion.div>

            {/* After */}
            <motion.div variants={fadeUp}>
              <p className="font-mono text-xs text-primary/60 uppercase tracking-widest mb-4">Depois · Evolução</p>
              <Card className="p-6 border-primary/20 bg-primary/[0.02]">
                <div className="flex flex-col items-center gap-1">
                  <FlowNode icon={Eye} label="Usuário" />
                  <FlowArrow />
                  <FlowNode icon={Zap} label="Thor" sublabel="Orchestrator" accent />
                  <FlowArrow />
                  <FlowNode icon={Brain} label="Claude Code" sublabel="Planning Brain" accent />
                  <FlowArrow />
                  <FlowNode icon={Cpu} label="OpenClaw" sublabel="Execution Engine" />
                  <FlowArrow />
                  <FlowNode icon={Bot} label="Agents" />
                  <FlowArrow />
                  <FlowNode icon={Server} label="Tools / Filesystem / APIs" />
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 6. FLUXO REAL === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>Execution Flow</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Fluxo real de execução
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            Exemplo: Usuário pede <span className="text-foreground font-medium">"Criar um novo módulo no software"</span>
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                title: "Thor recebe",
                icon: Zap,
                color: "primary",
                items: ["task: criar módulo", "prioridade: alta", "contexto: análise"]
              },
              {
                step: "02",
                title: "Claude Code planeja",
                icon: Brain,
                color: "primary",
                items: ["Analisar repo", "Criar estrutura", "Implementar lógica", "Criar testes", "Atualizar docs"]
              },
              {
                step: "03",
                title: "OpenClaw executa",
                icon: Cpu,
                color: "accent-emerald",
                items: ["Abrir arquivos", "Editar código", "Criar pastas", "Rodar testes", "Executar comandos"]
              },
              {
                step: "04",
                title: "Claude revisa",
                icon: CheckCircle2,
                color: "primary",
                items: ["Lint check", "Code review", "Melhorias", "Aprovação final"]
              }
            ].map((s) => (
              <motion.div key={s.step} variants={fadeUp}>
                <Card className="p-5 h-full border-border/30 bg-card/40 relative overflow-hidden">
                  <span className="absolute top-3 right-4 font-mono text-[40px] font-bold text-muted/20 leading-none select-none">
                    {s.step}
                  </span>
                  <s.icon className={`h-5 w-5 text-${s.color} mb-3`} strokeWidth={1.5} />
                  <h3 className="font-semibold text-sm mb-3">{s.title}</h3>
                  <ul className="space-y-1.5">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className={`w-1 h-1 rounded-full bg-${s.color} mt-1.5 shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 7. ARQUITETURA COMPLETA === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>Complete Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-12">
            Arquitetura completa
          </motion.h2>

          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1">
            <FlowNode icon={Eye} label="User" />
            <FlowArrow />
            <FlowNode icon={Zap} label="Thor Orchestrator" accent />
            <FlowArrow />
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <FlowNode icon={Brain} label="Planning Brain" sublabel="Claude Code" accent />
              <FlowNode icon={Database} label="Memory Layer" sublabel="Vector / DB" />
            </div>
            <FlowArrow />
            <FlowNode icon={Workflow} label="Task Queue" />
            <FlowArrow />
            <FlowNode icon={Cpu} label="OpenClaw Engine" />
            <FlowArrow />
            <div className="flex gap-3">
              <FlowNode icon={Bot} label="Agent 1" />
              <FlowNode icon={Bot} label="Agent 2" />
              <FlowNode icon={Bot} label="Agent 3" />
            </div>
          </motion.div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 8. ONDE OPENCLAW AJUDA === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>OpenClaw Benefits</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Onde OpenClaw brilha
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl text-base leading-relaxed mb-12">
            Um runtime de agentes projetado para execução paralela e escalável.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: GitBranch, title: "Multi-agent workflows", desc: "Orquestre dezenas de agentes trabalhando em paralelo em tarefas complexas." },
              { icon: Code2, title: "Automação de dev", desc: "Crie, edite e teste código automaticamente com agentes especializados." },
              { icon: Layers, title: "Execução paralela", desc: "Múltiplas tarefas executadas simultaneamente sem bloqueio." },
              { icon: HardDrive, title: "Controle de filesystem", desc: "Manipulação completa de arquivos, pastas e repositórios." },
            ].map((c) => (
              <motion.div key={c.title} variants={fadeUp}>
                <Card className="p-6 h-full border-border/30 bg-card/40 hover:border-primary/20 transition-colors duration-300">
                  <c.icon className="h-5 w-5 text-primary mb-4" strokeWidth={1.5} />
                  <h3 className="font-semibold text-sm mb-2">{c.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 9. DEPARTAMENTOS === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          <motion.div variants={fadeUp}><SectionTag>AI Department Structure</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-12">
            Estrutura em camadas
          </motion.h2>

          <div className="space-y-4">
            {[
              { layer: "Layer 1", title: "Orquestração", subtitle: "Thor", icon: Zap, accent: true },
              { layer: "Layer 2", title: "Inteligência", subtitle: "Claude Code", icon: Brain, accent: true },
              { layer: "Layer 3", title: "Execução", subtitle: "OpenClaw", icon: Cpu, accent: false },
              { layer: "Layer 4", title: "Workers", subtitle: "Dev · Automation · Data Agents", icon: Bot, accent: false },
            ].map((l, i) => (
              <motion.div key={l.layer} variants={fadeUp} custom={i}>
                <Card className={`p-5 sm:p-6 flex items-center gap-5 ${l.accent ? "border-primary/20 bg-primary/[0.02]" : "border-border/30 bg-card/40"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${l.accent ? "bg-primary/10" : "bg-muted/60"}`}>
                    <l.icon className={`h-5 w-5 ${l.accent ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{l.layer}</p>
                    <h3 className="font-semibold text-sm">{l.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">{l.subtitle}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 10. ARQUITETURA FINAL === */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.06 } } }} className="text-center">
          <motion.div variants={fadeUp}><SectionTag>Final Architecture</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-12">
            Fluxo final
          </motion.h2>

          <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-1">
            {[
              { icon: Eye, label: "User", sub: "" },
              { icon: Zap, label: "Thor", sub: "", accent: true },
              { icon: Brain, label: "Claude Code", sub: "planning / reasoning", accent: true },
              { icon: Cpu, label: "OpenClaw", sub: "agent runtime" },
              { icon: Bot, label: "88 Agents", sub: "" },
              { icon: Server, label: "Tools · Filesystem · APIs · DB", sub: "" },
            ].map((n, i) => (
              <div key={n.label}>
                {i > 0 && <FlowArrow />}
                <FlowNode icon={n.icon} label={n.label} sublabel={n.sub || undefined} accent={n.accent} />
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <div className="max-w-6xl mx-auto px-6"><div className="h-px bg-border/30" /></div>

      {/* === 11. INSIGHT FINAL === */}
      <Section className="pb-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="text-center max-w-3xl mx-auto">
          <motion.div variants={fadeUp}><SectionTag>Key Insight</SectionTag></motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-3xl sm:text-4xl font-bold mb-6">
            Duas camadas. Um sistema.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-base leading-relaxed mb-10">
            OpenClaw não substitui Claude Code. Eles são camadas diferentes de um mesmo sistema.
            Usar os dois juntos é o que permite escalar de 1 para 88 agentes — e além.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-primary/20 bg-primary/[0.03]">
              <Brain className="h-5 w-5 text-primary" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">Claude Code</p>
                <p className="font-mono text-[10px] text-primary/60 uppercase tracking-widest">= Inteligência</p>
              </div>
            </div>

            <span className="text-muted-foreground font-mono text-xs">+</span>

            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-accent-emerald/20 bg-accent-emerald/[0.03]">
              <Cpu className="h-5 w-5 text-accent-emerald" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">OpenClaw</p>
                <p className="font-mono text-[10px] text-accent-emerald/60 uppercase tracking-widest">= Execução</p>
              </div>
            </div>

            <span className="text-muted-foreground font-mono text-xs">=</span>

            <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
              <Network className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
              <div className="text-left">
                <p className="font-semibold text-sm">Escala</p>
                <p className="font-mono text-[10px] text-accent-amber/60 uppercase tracking-widest">= 88+ Agents</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Section>
    </div>
  );
};

export default Architecture;
