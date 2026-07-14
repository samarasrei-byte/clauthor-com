import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Network, Workflow, Plus, Search, Cpu, Activity,
  Clock, Coins, Gauge, Circle, MessageSquare, CheckCircle2,
  ChevronRight, X, Bot, Wand2, Radio, Send, RotateCcw, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAIWorkspaces, useWorkspaceMessages, useWorkspaceTasks,
  type TaskStatus, type AIWorkspaceTask,
} from "@/hooks/useAIWorkspaces";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


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

interface AIWorkspaceProps {
  onNavigate?: (section: string) => void;
}

const AIWorkspace = ({ onNavigate }: AIWorkspaceProps = {}) => {
  const [agents, setAgents] = useState<WorkspaceAgent[]>(DEFAULT_AGENTS);
  const [chatInput, setChatInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [graphQuery, setGraphQuery] = useState("");
  const [visualMode, setVisualMode] = useState<"minimal" | "holo">(() => {
    if (typeof window === "undefined") return "minimal";
    return (localStorage.getItem("ia-live-visual-mode") as "minimal" | "holo") || "minimal";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("ia-live-visual-mode", visualMode);
  }, [visualMode]);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatingWs, setCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [timeline, setTimeline] = useState<TimelineEntry[]>(INITIAL_TIMELINE);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // ── Realtime data ──
  const { workspaces, activeId, setActiveId, activeWorkspace, loading: wsLoading, createWorkspace } = useAIWorkspaces();
  const tenantId = activeWorkspace?.tenant_id ?? null;
  const { messages, sendMessage } = useWorkspaceMessages(activeId, tenantId);
  const { tasks, createTask, updateTaskStatus } = useWorkspaceTasks(activeId, tenantId);

  // ── Memory counts (real data) ──
  const { user } = useAuth();
  const { data: memoryCounts } = useQuery({
    queryKey: ["ia-live-memory-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const q = (table: string, col = "user_id") =>
        supabase.from(table as any).select("*", { count: "exact", head: true }).eq(col, uid);
      const [ws, msgs, files, agentsCount, prompts] = await Promise.all([
        q("ai_workspaces"),
        q("ai_workspace_messages"),
        q("files"),
        q("agents"),
        q("agent_prompt_versions", "created_by"),
      ]);
      return {
        projetos: ws.count ?? 0,
        conversas: msgs.count ?? 0,
        arquivos: files.count ?? 0,
        agentes: agentsCount.count ?? 0,
        regras: prompts.count ?? 0,
      };
    },
    staleTime: 60_000,
  });

  const agentByKey = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a])),
    [agents]
  );

  // Auto-scroll do chat
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Rotaciona status dos agentes só para dar vida na UI
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

  // Timeline reflete os últimos messages recebidos via Realtime
  useEffect(() => {
    const latest = messages.slice(-6).reverse();
    setTimeline(
      latest.map((m) => ({
        id: m.id,
        agentId: m.agent_key ?? "strat",
        message: m.content,
        ts: new Date(m.created_at).getTime(),
      }))
    );
  }, [messages]);

  // ── Handlers ──
  const handleSendChat = async () => {
    const txt = chatInput.trim();
    if (!txt || !activeId) return;
    setChatInput("");
    await sendMessage(txt);
  };

  // Cria tarefa rápida no Kanban unificado (agent_tasks). Para missões
  // estruturadas multi-step, o fluxo canônico é `Orquestração › Composer`.
  const handleDelegate = async () => {
    const t = taskInput.trim();
    if (!t || !activeId) return;
    setTaskInput("");
    await createTask({ title: t, status: "doing", priority: "high" });
    // Sinaliza no chat que a tarefa entrou no Kanban — sem simular chain fake.
    sendMessage(`📌 Nova tarefa no Kanban: "${t}"`, {
      key: "system", name: "Workspace", emoji: "⚡",
    });
  };

  const handleCreateWorkspace = async () => {
    const name = newWsName.trim();
    if (!name) return;
    const created = await createWorkspace(name);
    if (created) {
      setActiveId(created.id);
      setNewWsName("");
      setCreatingWs(false);
    }
  };

  const filteredGraphNodes = useMemo(() => {
    if (!graphQuery.trim()) return GRAPH_NODES;
    const q = graphQuery.toLowerCase();
    return GRAPH_NODES.filter((n) => n.label.toLowerCase().includes(q));
  }, [graphQuery]);

  const filteredIds = new Set(filteredGraphNodes.map((n) => n.id));

  // KPIs (agentes = visual; tarefas = reais)
  const activeAgents = agents.filter((a) => a.status !== "offline").length;
  const activeTasks = tasks.filter((t) => t.status !== "done").length;
  const totalTokens = agents.reduce((acc, a) => acc + a.tokens, 0);
  const estCost = (totalTokens / 1000) * 0.02;

  return (

    <div className="relative space-y-6 pb-8">
      {/* ─── Futuristic ambient backdrop ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-[640px] overflow-hidden rounded-[32px]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.18),transparent_55%)]" />
        {/* Neural grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 30%, black 40%, transparent 80%)",
          }}
        />
        {/* Scanline holográfico */}
        <motion.div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          initial={{ top: "-2%" }}
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-24 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/3 bottom-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl"
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col gap-4 rounded-xl border border-border/60 bg-background/50 p-4 backdrop-blur md:flex-row md:items-center md:justify-between md:p-5"
      >
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/5">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary"
              >
                <Radio className="mr-1 h-3 w-3 animate-pulse" />
                IA Live
              </Badge>
              <span className="text-foreground">
                {activeWorkspace?.name ?? "AI Workspace"}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeWorkspace
                ? "Conversas e tarefas sincronizadas em tempo real."
                : "Sua equipe de agentes trabalhando 24/7 — sincronizada via Realtime."}
            </p>
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          {/* Visual mode toggle */}
          <div className="flex items-center rounded-lg border border-border/60 bg-background/60 p-0.5 text-[10px] font-medium uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setVisualMode("minimal")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                visualMode === "minimal" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Minimal
            </button>
            <button
              type="button"
              onClick={() => setVisualMode("holo")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                visualMode === "holo" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Holo 3D
            </button>
          </div>

          {/* Seletor de Workspace */}
          <Select value={activeId ?? undefined} onValueChange={(v) => setActiveId(v)} disabled={wsLoading || workspaces.length === 0}>
            <SelectTrigger className="w-[220px] border-white/10 bg-background/60 backdrop-blur">
              <SelectValue placeholder={wsLoading ? "Carregando..." : "Selecionar workspace"} />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  <span className="mr-1.5">{w.emoji ?? "🧠"}</span>{w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setCreatingWs(true)}>
            <Plus className="h-4 w-4" /> Workspace
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30 hover:opacity-90"
            onClick={() => setCreatorOpen(true)}
          >
            <Plus className="h-4 w-4" /> Agente
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


      {/* ─── Delegação rápida (Kanban unificado) ─── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Wand2 className="h-4 w-4 text-primary" />
            Tarefa rápida — cai direto no Kanban
          </div>
          <p className="text-xs text-muted-foreground">
            Para missões multi-etapa estruturadas, use{" "}
            <span className="font-medium text-primary">Orquestração › Composer</span>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelegate()}
            placeholder='Ex: "Landing para curso de IA" · vira card no Kanban'
            className="flex-1"
          />
          <Button onClick={handleDelegate} className="gap-2">
            <Sparkles className="h-4 w-4" /> Criar
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
              Realtime
            </Badge>
          </div>
          <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Nenhuma mensagem ainda — delegue uma missão ou converse com a equipe.
                </div>
              )}
              {messages.map((msg) => {
                const localAgent = msg.agent_key ? agentByKey[msg.agent_key] : null;
                const emoji = msg.agent_emoji ?? localAgent?.emoji ?? (msg.author_kind === "user" ? "🧑" : "🤖");
                const name = msg.agent_name ?? localAgent?.name ?? (msg.author_kind === "user" ? "Você" : "Sistema");
                const color = localAgent?.color ?? "from-slate-500 to-slate-600";
                const ts = new Date(msg.created_at).getTime();
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm", color)}>
                        {emoji}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">{fmtTime(ts)}</span>
                      </div>
                      <div className="mt-0.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {/* Composer */}
          <div className="mt-2 flex gap-2 border-t pt-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendChat())}
              placeholder="Escreva para a equipe..."
              className="flex-1"
              disabled={!activeId}
            />
            <Button size="sm" onClick={handleSendChat} disabled={!activeId || !chatInput.trim()} className="gap-1">
              <Send className="h-3.5 w-3.5" />
            </Button>
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
          {visualMode === "holo" ? <BrainGraphHolo filteredIds={filteredIds} /> : <BrainGraph filteredIds={filteredIds} />}
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
            <KanbanColumn title="Backlog" tasks={tasks.filter(t => t.status === "backlog")} agentByKey={agentByKey} onMove={updateTaskStatus} tone="bg-muted/40" />
            <KanbanColumn title="Fazendo" tasks={tasks.filter(t => t.status === "doing")}   agentByKey={agentByKey} onMove={updateTaskStatus} tone="bg-sky-500/10" />
            <KanbanColumn title="Revisão" tasks={tasks.filter(t => t.status === "review")}  agentByKey={agentByKey} onMove={updateTaskStatus} tone="bg-amber-500/10" />
            <KanbanColumn title="Feito"   tasks={tasks.filter(t => t.status === "done")}    agentByKey={agentByKey} onMove={updateTaskStatus} tone="bg-emerald-500/10" />
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
            {visualMode === "holo" ? <WorkflowCanvasHolo /> : <WorkflowCanvas />}
            <p className="mt-3 text-xs text-muted-foreground">
              As conexões ficam animadas conforme os agentes executam. Cada nó é um especialista com contexto próprio.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {timeline.length} evento{timeline.length !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setTimeline(INITIAL_TIMELINE)}
                  aria-label="Recarregar timeline"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Recarregar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setTimeline([])}
                  disabled={timeline.length === 0}
                  aria-label="Limpar timeline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Limpar
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[320px] pr-2">
              {timeline.length === 0 ? (
                <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-6 w-6 opacity-40" />
                  Nenhum evento na timeline.
                </div>
              ) : (
                <div className="relative space-y-4 border-l border-border pl-4">
                  {timeline.map((e) => {
                    const a = agentByKey[e.agentId];
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        <span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full border border-primary bg-background" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {fmtTime(e.ts)}
                          {a && (
                            <button
                              type="button"
                              onClick={() => setGraphQuery(a.name)}
                              className="inline-flex"
                              title={`Filtrar grafo por ${a.name}`}
                            >
                              <Badge variant="outline" className="h-5 cursor-pointer px-1.5 text-[10px] transition-colors hover:border-primary/60 hover:bg-primary/10">
                                {a.emoji} {a.name}
                              </Badge>
                            </button>
                          )}
                        </div>
                        <div className="text-sm">{e.message}</div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MemoryCard title="Projetos"  count={memoryCounts?.projetos ?? 0}  desc="Workspaces ativos."             onClick={() => onNavigate?.("workspace")} />
              <MemoryCard title="Conversas" count={memoryCounts?.conversas ?? 0} desc="Mensagens sincronizadas."       onClick={() => onNavigate?.("chat")} />
              <MemoryCard title="Arquivos"  count={memoryCounts?.arquivos ?? 0}  desc="Documentos e mídia na Library." onClick={() => onNavigate?.("library")} />
              <MemoryCard title="Agentes"   count={memoryCounts?.agentes ?? 0}   desc="Especialistas contratados."     onClick={() => onNavigate?.("agents")} />
              <MemoryCard title="Regras"    count={memoryCounts?.regras ?? 0}    desc="Prompts base e guardrails."     onClick={() => onNavigate?.("agents")} />
              <MemoryCard title="Aprovações" count={tasks.filter(t => t.status === "review").length} desc="Itens aguardando revisão." onClick={() => onNavigate?.("approvals")} />
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

      {/* ─── Workspace Creator ─── */}
      <Dialog open={creatingWs} onOpenChange={setCreatingWs}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Novo Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="Ex: AI Workspace 3"
                onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Cada workspace tem seu próprio chat e Kanban isolados, sincronizados em tempo real.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreatingWs(false)} className="gap-1">
              <X className="h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={!newWsName.trim()} className="gap-1">
              <Plus className="h-4 w-4" /> Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


/* ────────────────── Subcomponents ────────────────── */

const StatCard = ({
  icon: Icon, label, value, hint,
}: { icon: any; label: string; value: string | number; hint?: string }) => (
  <Card className="relative border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <div className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{value}</div>
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
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-base">
            <span>{agent.emoji}</span>
            <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background", meta.dot)} />
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

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  backlog: "doing",
  doing: "review",
  review: "done",
  done: null,
};

const KanbanColumn = ({
  title, tasks, agentByKey, tone, onMove,
}: {
  title: string;
  tasks: AIWorkspaceTask[];
  agentByKey: Record<string, WorkspaceAgent>;
  tone: string;
  onMove: (id: string, next: TaskStatus) => void;
}) => (
  <div className={cn("rounded-lg p-2", tone)}>
    <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium">
      <span>{title}</span>
      <Badge variant="outline" className="h-4 px-1 text-[10px]">{tasks.length}</Badge>
    </div>
    <div className="space-y-1.5">
      {tasks.map((t) => {
        const a = t.agent_key ? agentByKey[t.agent_key] : undefined;
        const next = NEXT_STATUS[t.status];
        return (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-md border bg-card p-2 text-xs shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="line-clamp-2 font-medium">{t.title}</div>
            <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                {a ? <><span>{a.emoji}</span> {a.name}</> : (t.agent_name ?? "—")}
              </span>
              {next && (
                <button
                  type="button"
                  onClick={() => onMove(t.id, next)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-primary hover:underline"
                >
                  → {next}
                </button>
              )}
            </div>
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

/* ─── Minimal Brain Graph (clean neural style) ─── */
const BrainGraph = ({ filteredIds }: { filteredIds: Set<string> }) => (
  <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-border/60 bg-background/40">
    {/* subtle grid */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 80%)",
      }}
    />

    <svg viewBox="0 0 780 400" className="relative h-full w-full">
      {/* Edges */}
      {GRAPH_EDGES.map(([from, to], i) => {
        const a = GRAPH_NODES.find((n) => n.id === from)!;
        const b = GRAPH_NODES.find((n) => n.id === to)!;
        const active = filteredIds.has(from) && filteredIds.has(to);
        return (
          <line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="hsl(var(--primary))"
            strokeWidth={active ? 1 : 0.6}
            strokeOpacity={active ? 0.55 : 0.18}
          />
        );
      })}

      {/* Nodes */}
      {GRAPH_NODES.map((n) => {
        const active = filteredIds.has(n.id);
        return (
          <g key={n.id} style={{ color: n.color }}>
            <circle
              cx={n.x} cy={n.y} r={active ? 6 : 4}
              fill="hsl(var(--background))"
              stroke={n.color}
              strokeWidth={1.5}
              opacity={active ? 1 : 0.7}
            />
            <text
              x={n.x} y={n.y + 20}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>

    {/* subtle HUD corners */}
    <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-primary/40" />
    <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-primary/40" />
    <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-primary/40" />
    <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-primary/40" />
  </div>
);

/* ─── Minimal Workflow Canvas ─── */
const WorkflowCanvas = () => (
  <div className="relative h-[260px] w-full overflow-x-auto rounded-xl border border-border/60 bg-background/40">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.1]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(circle at 50% 50%, black 30%, transparent 85%)",
      }}
    />

    <svg viewBox="0 0 800 200" className="relative h-full w-full min-w-[760px]">
      {/* Edges */}
      {WORKFLOW_EDGES.map(([from, to], i) => {
        const a = WORKFLOW_NODES.find((n) => n.id === from)!;
        const b = WORKFLOW_NODES.find((n) => n.id === to)!;
        return (
          <line
            key={i}
            x1={a.x + 50} y1={a.y} x2={b.x - 50} y2={b.y}
            stroke="hsl(var(--primary))"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        );
      })}

      {/* Nodes */}
      {WORKFLOW_NODES.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x - 52} y={n.y - 18} width={104} height={36} rx={8}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
          <circle cx={n.x - 40} cy={n.y} r={2.5} fill="hsl(var(--primary))" opacity={0.7} />
          <text x={n.x + 4} y={n.y + 4} textAnchor="middle"
            className="fill-foreground text-[10px] font-medium uppercase tracking-wide">
            {n.label}
          </text>
        </g>
      ))}
    </svg>

    <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-primary/40" />
    <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-primary/40" />
    <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-primary/40" />
    <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-primary/40" />
  </div>
);

/* ─── Holographic Brain Graph (3D) ─── */
const BrainGraphHolo = ({ filteredIds }: { filteredIds: Set<string> }) => (
  <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.25),transparent_60%),radial-gradient(circle_at_20%_10%,hsl(280_90%_60%/0.15),transparent_55%),radial-gradient(circle_at_85%_15%,hsl(190_90%_55%/0.15),transparent_55%)]">
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)/0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(circle at 50% 50%, black 40%, transparent 85%)",
      }}
    />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/20 to-transparent blur-xl" />
    <svg viewBox="0 0 780 400" className="relative h-full w-full" style={{ transform: "perspective(900px) rotateX(18deg)" }}>
      <defs>
        <radialGradient id="brainNodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id="brainBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="brainEdge" x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(280 90% 65%)" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {GRAPH_EDGES.map(([from, to], i) => {
        const a = GRAPH_NODES.find((n) => n.id === from)!;
        const b = GRAPH_NODES.find((n) => n.id === to)!;
        const active = filteredIds.has(from) && filteredIds.has(to);
        return (
          <g key={i}>
            <motion.line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#brainEdge)"
              strokeWidth={active ? 1.6 : 0.9} strokeOpacity={active ? 0.9 : 0.35}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: i * 0.05 }} />
            <motion.circle r={2.4} fill="hsl(var(--primary))" filter="url(#brainBlur)"
              initial={{ opacity: 0 }}
              animate={{ cx: [a.x, b.x], cy: [a.y, b.y], opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }} />
          </g>
        );
      })}
      {GRAPH_NODES.map((n, i) => {
        const active = filteredIds.has(n.id);
        return (
          <motion.g key={n.id}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: active ? 1 : 0.5, scale: 1 }}
            transition={{ type: "spring", stiffness: 180, delay: i * 0.04 }}
            style={{ color: n.color }}>
            <motion.ellipse cx={n.x} cy={n.y} rx={active ? 34 : 24} ry={active ? 12 : 8}
              fill="none" stroke={n.color} strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="3 4"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }} />
            <circle cx={n.x} cy={n.y} r={active ? 26 : 18} fill="url(#brainNodeGlow)" opacity={active ? 0.85 : 0.4} />
            <motion.circle cx={n.x} cy={n.y} r={active ? 9 : 6} fill={n.color}
              animate={{ r: active ? [9, 11, 9] : [6, 7, 6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <circle cx={n.x - 2} cy={n.y - 2} r={2} fill="white" opacity={0.85} />
            <text x={n.x} y={n.y + 30} textAnchor="middle"
              className="fill-foreground text-[10px] font-semibold uppercase tracking-wider"
              style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)/0.5))" }}>
              {n.label}
            </text>
          </motion.g>
        );
      })}
    </svg>
    <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-primary/60" />
    <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-primary/60" />
    <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-primary/60" />
    <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-primary/60" />
  </div>
);

/* ─── Holographic Workflow Canvas (3D) ─── */
const WorkflowCanvasHolo = () => (
  <div className="relative h-[260px] w-full overflow-x-auto rounded-xl border border-primary/20 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.22),transparent_60%),radial-gradient(circle_at_10%_0%,hsl(190_90%_55%/0.15),transparent_60%)]">
    <div className="pointer-events-none absolute inset-0 opacity-50"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)/0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }} />
    <motion.div className="pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent"
      initial={{ left: "0%" }}
      animate={{ left: ["0%", "100%", "0%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
    <svg viewBox="0 0 800 200" className="relative h-full w-full min-w-[760px]" style={{ transform: "perspective(1000px) rotateX(10deg)" }}>
      <defs>
        <linearGradient id="wfPipeHolo" x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="50%" stopColor="hsl(190 90% 60%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(280 90% 65%)" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="wfCardHolo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="0.95" />
          <stop offset="100%" stopColor="hsl(var(--primary)/0.15)" stopOpacity="1" />
        </linearGradient>
        <filter id="wfGlowHolo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {WORKFLOW_EDGES.map(([from, to], i) => {
        const a = WORKFLOW_NODES.find((n) => n.id === from)!;
        const b = WORKFLOW_NODES.find((n) => n.id === to)!;
        return (
          <g key={i}>
            <line x1={a.x + 50} y1={a.y} x2={b.x - 50} y2={b.y} stroke="url(#wfPipeHolo)" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={a.x + 50} y1={a.y} x2={b.x - 50} y2={b.y} stroke="hsl(var(--primary))" strokeOpacity={0.9} strokeWidth={0.8} strokeDasharray="2 6" />
            <motion.circle r={4} fill="hsl(var(--primary))" filter="url(#wfGlowHolo)"
              initial={{ opacity: 0 }}
              animate={{ cx: [a.x + 50, b.x - 50], cy: [a.y, b.y], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: "linear" }} />
          </g>
        );
      })}
      {WORKFLOW_NODES.map((n, i) => (
        <motion.g key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <ellipse cx={n.x} cy={n.y + 24} rx={44} ry={4} fill="hsl(var(--primary))" opacity={0.15} />
          <rect x={n.x - 52} y={n.y - 20} width={104} height={40} rx={12}
            fill="url(#wfCardHolo)" stroke="hsl(var(--primary)/0.6)" strokeWidth={1} filter="url(#wfGlowHolo)" />
          <line x1={n.x - 44} y1={n.y - 14} x2={n.x + 44} y2={n.y - 14}
            stroke="hsl(var(--primary))" strokeOpacity={0.8} strokeWidth={1} />
          <motion.circle cx={n.x - 40} cy={n.y + 12} r={3} fill="hsl(190 95% 60%)"
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }} />
          <text x={n.x} y={n.y + 4} textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold uppercase tracking-wide">
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
    <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-primary/60" />
    <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-primary/60" />
    <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-primary/60" />
    <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-primary/60" />
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
