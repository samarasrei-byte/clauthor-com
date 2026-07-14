import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Network, Workflow, Plus, Search, Cpu, Activity,
  Clock, Coins, Gauge, Circle, MessageSquare, CheckCircle2, Loader2,
  ChevronRight, X, Bot, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* ────────────────────────────────────────────────────────────────
 * AI Workspace — colaboração multi-agente em tempo real (mock).
 * Integrado ao Painel do Cliente. Sem novas dependências.
 * ──────────────────────────────────────────────────────────────── */

type AgentStatus = "working" | "thinking" | "chatting" | "offline";

interface WorkspaceAgent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  status: AgentStatus;
  color: string;
  tokens: number;
  memory: number;
  lastActivity: string;
}

interface ChatEntry {
  id: string;
  agentId: string;
  content: string;
  ts: number;
  streaming?: boolean;
}

interface TimelineEntry {
  id: string;
  agentId: string;
  message: string;
  ts: number;
}

interface Task {
  id: string;
  title: string;
  agentId: string;
  status: "backlog" | "doing" | "review" | "done";
}

const DEFAULT_AGENTS: WorkspaceAgent[] = [
  { id: "strat",    name: "Estratégia",   emoji: "🧠", role: "Especialista em negócios",    model: "gpt-5.5",         status: "thinking", color: "from-violet-500 to-fuchsia-500", tokens: 12480, memory: 78, lastActivity: "há 12s" },
  { id: "copy",     name: "Copywriter",   emoji: "✍️", role: "Especialista em escrita",     model: "claude-opus",     status: "working",  color: "from-rose-500 to-orange-500",    tokens: 8420,  memory: 64, lastActivity: "há 3s"  },
  { id: "dev",      name: "Desenvolvedor",emoji: "💻", role: "Especialista em código",      model: "gpt-5.5",         status: "chatting", color: "from-sky-500 to-cyan-500",       tokens: 15200, memory: 82, lastActivity: "há 1s"  },
  { id: "analyst",  name: "Analista",     emoji: "📊", role: "Especialista em dados",       model: "gemini-3-pro",    status: "working",  color: "from-emerald-500 to-teal-500",   tokens: 9100,  memory: 55, lastActivity: "há 8s"  },
  { id: "designer", name: "Designer",     emoji: "🎨", role: "Especialista em UX/UI",       model: "claude-sonnet",   status: "thinking", color: "from-pink-500 to-purple-500",    tokens: 6300,  memory: 42, lastActivity: "há 22s" },
  { id: "research", name: "Pesquisador",  emoji: "🔎", role: "Especialista em pesquisa",    model: "gemini-3-flash",  status: "offline",  color: "from-amber-500 to-yellow-500",   tokens: 4780,  memory: 38, lastActivity: "há 3min"},
];

const STATUS_META: Record<AgentStatus, { label: string; dot: string; ring: string }> = {
  working:  { label: "Trabalhando", dot: "bg-emerald-500", ring: "ring-emerald-500/40" },
  thinking: { label: "Pensando",    dot: "bg-amber-500",   ring: "ring-amber-500/40"   },
  chatting: { label: "Conversando", dot: "bg-sky-500",     ring: "ring-sky-500/40"     },
  offline:  { label: "Offline",     dot: "bg-muted-foreground/40", ring: "ring-border" },
};

const INITIAL_CHAT: ChatEntry[] = [
  { id: "c1", agentId: "analyst",  content: "Encontrei uma oportunidade no funil de aquisição.", ts: Date.now() - 60000 },
  { id: "c2", agentId: "research", content: "Vou validar os dados com base no ICP atual.",       ts: Date.now() - 48000 },
  { id: "c3", agentId: "dev",      content: "Já posso iniciar a estrutura da landing.",          ts: Date.now() - 36000 },
  { id: "c4", agentId: "designer", content: "Estou criando o wireframe em componentes.",         ts: Date.now() - 24000 },
  { id: "c5", agentId: "copy",     content: "Preparando as headlines e prova social.",           ts: Date.now() - 12000 },
  { id: "c6", agentId: "strat",    content: "Vamos dividir a entrega em três sprints curtos.",   ts: Date.now() - 3000  },
];

const INITIAL_TIMELINE: TimelineEntry[] = [
  { id: "t1", agentId: "research", message: "Pesquisador iniciou análise de mercado",   ts: Date.now() - 180000 },
  { id: "t2", agentId: "analyst",  message: "Analista mapeou 3 concorrentes diretos",   ts: Date.now() - 120000 },
  { id: "t3", agentId: "designer", message: "Designer entregou wireframe v1",           ts: Date.now() - 90000  },
  { id: "t4", agentId: "copy",     message: "Copy fechou headline principal",           ts: Date.now() - 45000  },
  { id: "t5", agentId: "dev",      message: "Desenvolvedor iniciou implementação",      ts: Date.now() - 12000  },
];

const INITIAL_TASKS: Task[] = [
  { id: "k1", title: "Definir persona e ICP",           agentId: "strat",    status: "done" },
  { id: "k2", title: "Análise de concorrência",         agentId: "analyst",  status: "done" },
  { id: "k3", title: "Wireframe da landing",            agentId: "designer", status: "review" },
  { id: "k4", title: "Headline + hero copy",            agentId: "copy",     status: "doing" },
  { id: "k5", title: "Implementar seções da página",    agentId: "dev",      status: "doing" },
  { id: "k6", title: "Pesquisa de palavras-chave",      agentId: "research", status: "backlog" },
  { id: "k7", title: "Plano de anúncios",               agentId: "strat",    status: "backlog" },
];

const WORKFLOW_NODES = [
  { id: "user",     label: "Usuário",     x: 50,  y: 40 },
  { id: "strat",    label: "Planejamento", x: 180, y: 40 },
  { id: "research", label: "Pesquisa",    x: 310, y: 40 },
  { id: "copy",     label: "Copy",        x: 440, y: 40 },
  { id: "designer", label: "UX",          x: 310, y: 130 },
  { id: "dev",      label: "Código",      x: 440, y: 130 },
  { id: "analyst",  label: "Revisão",     x: 570, y: 85 },
  { id: "done",     label: "Entrega",     x: 700, y: 85 },
];

const WORKFLOW_EDGES: Array<[string, string]> = [
  ["user", "strat"], ["strat", "research"], ["research", "copy"],
  ["copy", "designer"], ["copy", "dev"], ["designer", "dev"],
  ["dev", "analyst"], ["analyst", "done"],
];

const GRAPH_NODES = [
  { id: "cliente",   label: "Cliente",    x: 80,  y: 220, color: "hsl(var(--primary))" },
  { id: "projeto",   label: "Projeto",    x: 220, y: 120, color: "#8b5cf6" },
  { id: "landing",   label: "Landing",    x: 380, y: 60,  color: "#ec4899" },
  { id: "copy",      label: "Copy",       x: 540, y: 100, color: "#f97316" },
  { id: "funil",     label: "Funil",      x: 220, y: 300, color: "#10b981" },
  { id: "ads",       label: "Anúncios",   x: 380, y: 340, color: "#0ea5e9" },
  { id: "metricas",  label: "Métricas",   x: 560, y: 260, color: "#eab308" },
  { id: "emails",    label: "Emails",     x: 700, y: 180, color: "#a855f7" },
  { id: "campanhas", label: "Campanhas",  x: 700, y: 320, color: "#ef4444" },
];

const GRAPH_EDGES: Array<[string, string]> = [
  ["cliente", "projeto"], ["projeto", "landing"], ["landing", "copy"],
  ["projeto", "funil"], ["funil", "ads"], ["ads", "metricas"],
  ["metricas", "emails"], ["metricas", "campanhas"], ["copy", "emails"],
];

/* ─── Helpers ─── */
const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

/* ═══════════════════════════════════════════════════════════════ */

const AIWorkspace = () => {
  const [agents, setAgents] = useState<WorkspaceAgent[]>(DEFAULT_AGENTS);
  const [chat, setChat] = useState<ChatEntry[]>(INITIAL_CHAT);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(INITIAL_TIMELINE);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [taskInput, setTaskInput] = useState("");
  const [graphQuery, setGraphQuery] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const agentById = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a])),
    [agents]
  );

  /* Auto-scroll do chat */
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length, typing]);

  /* Simula agentes conversando periodicamente */
  useEffect(() => {
    const messages = [
      { agentId: "strat",    content: "Ajustando prioridades da sprint atual." },
      { agentId: "analyst",  content: "Métricas de conversão subiram 12% hoje." },
      { agentId: "copy",     content: "Revisando CTA principal com base nos dados." },
      { agentId: "dev",      content: "Deploy da nova versão em staging." },
      { agentId: "designer", content: "Atualizando paleta para tema escuro." },
      { agentId: "research", content: "Novo estudo de referência anexado à memória." },
    ];

    const interval = setInterval(() => {
      const pick = messages[Math.floor(Math.random() * messages.length)];
      setTyping(pick.agentId);
      setTimeout(() => {
        setChat((prev) => [
          ...prev.slice(-30),
          { id: `c-${Date.now()}`, agentId: pick.agentId, content: pick.content, ts: Date.now() },
        ]);
        setTimeline((prev) => [
          { id: `t-${Date.now()}`, agentId: pick.agentId, message: pick.content, ts: Date.now() },
          ...prev.slice(0, 12),
        ]);
        setTyping(null);
      }, 1400);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  /* Rotaciona status dos agentes para dar vida */
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          if (Math.random() > 0.5) return a;
          const options: AgentStatus[] = ["working", "thinking", "chatting"];
          const next = options[Math.floor(Math.random() * options.length)];
          return { ...a, status: next, tokens: a.tokens + Math.floor(Math.random() * 40) };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* Delegação: divide a tarefa em sub-tarefas automáticas */
  const handleDelegate = () => {
    const t = taskInput.trim();
    if (!t) return;
    const chain: Array<{ agentId: string; message: string }> = [
      { agentId: "strat",    message: `Recebi a missão: "${t}". Dividindo em etapas.` },
      { agentId: "research", message: "Buscando referências e insights de mercado." },
      { agentId: "copy",     message: "Rascunhando copy inicial da entrega." },
      { agentId: "designer", message: "Preparando layout base." },
      { agentId: "dev",      message: "Iniciando implementação técnica." },
      { agentId: "analyst",  message: "Definindo métricas de sucesso." },
    ];
    setTaskInput("");
    setTasks((prev) => [
      { id: `k-${Date.now()}`, title: t, agentId: "strat", status: "doing" },
      ...prev,
    ]);
    chain.forEach((step, idx) => {
      setTimeout(() => {
        setChat((prev) => [
          ...prev,
          { id: `c-${Date.now()}-${idx}`, agentId: step.agentId, content: step.message, ts: Date.now() },
        ]);
        setTimeline((prev) => [
          { id: `t-${Date.now()}-${idx}`, agentId: step.agentId, message: step.message, ts: Date.now() },
          ...prev.slice(0, 12),
        ]);
      }, idx * 900);
    });
  };

  const filteredGraphNodes = useMemo(() => {
    if (!graphQuery.trim()) return GRAPH_NODES;
    const q = graphQuery.toLowerCase();
    return GRAPH_NODES.filter((n) => n.label.toLowerCase().includes(q));
  }, [graphQuery]);

  const filteredIds = new Set(filteredGraphNodes.map((n) => n.id));

  /* KPIs */
  const activeAgents = agents.filter((a) => a.status !== "offline").length;
  const activeTasks = tasks.filter((t) => t.status !== "done").length;
  const totalTokens = agents.reduce((acc, a) => acc + a.tokens, 0);
  const estCost = (totalTokens / 1000) * 0.02;

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 to-purple-500/40 blur-xl" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              AI Workspace
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                <Sparkles className="mr-1 h-3 w-3" /> Live
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Sua equipe de agentes trabalhando 24/7 — conversando, delegando e construindo memória compartilhada.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setCreatorOpen(true)}>
            <Plus className="h-4 w-4" /> Novo Agente
          </Button>
        </div>
      </motion.header>

      {/* ─── Live Status Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3 md:grid-cols-6"
      >
        <StatCard icon={Bot}      label="Agentes ativos"  value={`${activeAgents}/${agents.length}`} />
        <StatCard icon={Activity} label="Tarefas ativas"  value={activeTasks} />
        <StatCard icon={Cpu}      label="Uso de IA"       value="87%" />
        <StatCard icon={Clock}    label="Tempo médio"     value="1.2s" />
        <StatCard icon={Coins}    label="Tokens"          value={(totalTokens / 1000).toFixed(1) + "k"} />
        <StatCard icon={Gauge}    label="Eficiência"      value="94%" hint={`~ $${estCost.toFixed(2)}`} />
      </motion.div>

      {/* ─── Delegação ─── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Wand2 className="h-4 w-4 text-primary" />
          Delegar missão — a equipe divide automaticamente
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelegate()}
            placeholder='Ex: "Criar uma landing page para vender um curso de IA"'
            className="flex-1"
          />
          <Button onClick={handleDelegate} className="gap-2">
            <Sparkles className="h-4 w-4" /> Delegar
          </Button>
        </div>
      </Card>

      {/* ─── Grid principal ─── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Agentes */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4 text-primary" /> Equipe de Agentes
            </h2>
            <Badge variant="secondary" className="text-xs">{agents.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {agents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </Card>

        {/* Conversa entre Agentes */}
        <Card className="flex h-[420px] flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-primary" /> Conversa entre Agentes
            </h2>
            <Badge variant="outline" className="text-xs">
              <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 inline-block" />
              tempo real
            </Badge>
          </div>
          <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {chat.map((msg) => {
                const a = agentById[msg.agentId];
                if (!a) return null;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm", a.color)}>
                        {a.emoji}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground">{fmtTime(msg.ts)}</span>
                      </div>
                      <div className="mt-0.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {typing && agentById[typing] && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs", agentById[typing].color)}>
                      {agentById[typing].emoji}
                    </AvatarFallback>
                  </Avatar>
                  <span>{agentById[typing].name} está digitando</span>
                  <TypingDots />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Brain Graph */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Network className="h-4 w-4 text-primary" /> Brain Graph
            </h2>
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={graphQuery}
                onChange={(e) => setGraphQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>
          <BrainGraph filteredIds={filteredIds} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {filteredGraphNodes.length} nós conectados na sua memória viva.
          </p>
        </Card>

        {/* Tarefas Kanban */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Tarefas em Tempo Real
            </h2>
            <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <KanbanColumn title="Backlog" tasks={tasks.filter(t => t.status === "backlog")} agents={agentById} tone="bg-muted/40" />
            <KanbanColumn title="Fazendo" tasks={tasks.filter(t => t.status === "doing")}   agents={agentById} tone="bg-sky-500/10" />
            <KanbanColumn title="Revisão" tasks={tasks.filter(t => t.status === "review")} agents={agentById} tone="bg-amber-500/10" />
            <KanbanColumn title="Feito"   tasks={tasks.filter(t => t.status === "done")}   agents={agentById} tone="bg-emerald-500/10" />
          </div>
        </Card>
      </div>

      {/* ─── Workflow + Timeline ─── */}
      <Tabs defaultValue="workflow" className="w-full">
        <TabsList>
          <TabsTrigger value="workflow" className="gap-2"><Workflow className="h-4 w-4" /> Workflow</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2"><Clock className="h-4 w-4" /> Timeline</TabsTrigger>
          <TabsTrigger value="memory"   className="gap-2"><Brain className="h-4 w-4" /> Memória</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <Card className="p-4">
            <WorkflowCanvas />
            <p className="mt-3 text-xs text-muted-foreground">
              As conexões ficam animadas conforme os agentes executam. Cada nó é um especialista com contexto próprio.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-4">
            <ScrollArea className="h-[320px] pr-2">
              <div className="relative space-y-4 border-l border-border pl-4">
                {timeline.map((e) => {
                  const a = agentById[e.agentId];
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative"
                    >
                      <span className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-primary shadow-md shadow-primary/40" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {fmtTime(e.ts)}
                        {a && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                            {a.emoji} {a.name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm">{e.message}</div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MemoryCard title="Projetos"   count={12} desc="Landing pages, campanhas, funis." />
              <MemoryCard title="Conversas"  count={148} desc="Threads recentes indexadas." />
              <MemoryCard title="Arquivos"   count={37} desc="Documentos, planilhas, mídia." />
              <MemoryCard title="Clientes"   count={5}  desc="Perfis e contexto de cada conta." />
              <MemoryCard title="Objetivos"  count={9}  desc="Metas ativas com progresso." />
              <MemoryCard title="Regras"     count={22} desc="Guardrails e prompts base." />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Agent Creator Dialog ─── */}
      <AgentCreatorDialog
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onCreate={(a) => setAgents((prev) => [...prev, a])}
      />
    </div>
  );
};

/* ────────────────── Subcomponents ────────────────── */

const StatCard = ({
  icon: Icon, label, value, hint,
}: { icon: any; label: string; value: string | number; hint?: string }) => (
  <Card className="p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className="mt-1 text-lg font-semibold">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
  </Card>
);

const AgentCard = ({ agent }: { agent: WorkspaceAgent }) => {
  const meta = STATUS_META[agent.status];
  return (
    <motion.div whileHover={{ y: -2 }} className="group">
      <Card className={cn(
        "relative overflow-hidden p-3 transition-shadow hover:shadow-md",
        "ring-1", meta.ring
      )}>
        <div className="flex items-start gap-3">
          <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg", agent.color)}>
            <span>{agent.emoji}</span>
            <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", meta.dot)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-medium">{agent.name}</div>
              <span className="text-[10px] text-muted-foreground">{agent.lastActivity}</span>
            </div>
            <div className="truncate text-xs text-muted-foreground">{agent.role}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <Badge variant="outline" className="h-4 px-1 text-[10px]">
                <Circle className={cn("mr-1 h-1.5 w-1.5 fill-current", meta.dot.replace("bg-", "text-"))} />
                {meta.label}
              </Badge>
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{agent.model}</Badge>
              <span className="text-[10px] text-muted-foreground">{agent.tokens.toLocaleString()} tok</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const TypingDots = () => (
  <span className="inline-flex gap-0.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1 w-1 rounded-full bg-current"
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </span>
);

const KanbanColumn = ({
  title, tasks, agents, tone,
}: {
  title: string;
  tasks: Task[];
  agents: Record<string, WorkspaceAgent>;
  tone: string;
}) => (
  <div className={cn("rounded-lg p-2", tone)}>
    <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium">
      <span>{title}</span>
      <Badge variant="outline" className="h-4 px-1 text-[10px]">{tasks.length}</Badge>
    </div>
    <div className="space-y-1.5">
      {tasks.map((t) => {
        const a = agents[t.agentId];
        return (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border bg-card p-2 text-xs shadow-sm"
          >
            <div className="line-clamp-2 font-medium">{t.title}</div>
            {a && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>{a.emoji}</span> {a.name}
              </div>
            )}
          </motion.div>
        );
      })}
      {tasks.length === 0 && (
        <div className="rounded-md border border-dashed p-2 text-center text-[10px] text-muted-foreground">
          vazio
        </div>
      )}
    </div>
  </div>
);

const BrainGraph = ({ filteredIds }: { filteredIds: Set<string> }) => (
  <div className="relative h-[280px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted/30 to-transparent">
    <svg viewBox="0 0 780 400" className="h-full w-full">
      {GRAPH_EDGES.map(([from, to], i) => {
        const a = GRAPH_NODES.find((n) => n.id === from)!;
        const b = GRAPH_NODES.find((n) => n.id === to)!;
        const active = filteredIds.has(from) && filteredIds.has(to);
        return (
          <motion.line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
            strokeWidth={active ? 1.5 : 1}
            strokeOpacity={active ? 0.8 : 0.4}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.05 }}
          />
        );
      })}
      {GRAPH_NODES.map((n) => {
        const active = filteredIds.has(n.id);
        return (
          <motion.g
            key={n.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: active ? 1 : 0.35, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <circle cx={n.x} cy={n.y} r={active ? 22 : 16} fill={n.color} fillOpacity={0.15} />
            <circle cx={n.x} cy={n.y} r={active ? 8 : 6}  fill={n.color} />
            <text
              x={n.x} y={n.y + 22}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              {n.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
  </div>
);

const WorkflowCanvas = () => (
  <div className="relative h-[220px] w-full overflow-x-auto rounded-lg bg-gradient-to-br from-muted/30 to-transparent">
    <svg viewBox="0 0 800 200" className="h-full w-full min-w-[720px]">
      {WORKFLOW_EDGES.map(([from, to], i) => {
        const a = WORKFLOW_NODES.find((n) => n.id === from)!;
        const b = WORKFLOW_NODES.find((n) => n.id === to)!;
        return (
          <g key={i}>
            <line x1={a.x + 50} y1={a.y} x2={b.x - 50} y2={b.y}
              stroke="hsl(var(--primary))" strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="4 4" />
            <motion.circle
              r={3} fill="hsl(var(--primary))"
              initial={{ opacity: 0 }}
              animate={{
                cx: [a.x + 50, b.x - 50],
                cy: [a.y, b.y],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          </g>
        );
      })}
      {WORKFLOW_NODES.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x - 50} y={n.y - 18} width={100} height={36} rx={10}
            className="fill-card stroke-border"
            strokeWidth={1}
          />
          <text x={n.x} y={n.y + 4} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

const MemoryCard = ({ title, count, desc }: { title: string; count: number; desc: string }) => (
  <motion.div whileHover={{ y: -2 }}>
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-primary">
        Explorar <ChevronRight className="h-3 w-3" />
      </div>
    </Card>
  </motion.div>
);

/* ─── Agent Creator ─── */
const AgentCreatorDialog = ({
  open, onOpenChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (a: WorkspaceAgent) => void;
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [model, setModel] = useState("gpt-5.5");
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !role.trim()) return;
    onCreate({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      emoji: "🤖",
      role: role.trim(),
      model,
      status: "thinking",
      color: "from-indigo-500 to-purple-500",
      tokens: 0,
      memory: 0,
      lastActivity: "agora",
    });
    setName(""); setRole(""); setPrompt("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Novo Agente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Growth Hacker" />
          </div>
          <div>
            <Label className="text-xs">Especialidade</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Aquisição paga" />
          </div>
          <div>
            <Label className="text-xs">Modelo</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Prompt base</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Você é um especialista em..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="gap-1">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !role.trim()} className="gap-1">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIWorkspace;
