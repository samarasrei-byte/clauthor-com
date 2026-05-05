import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  ShieldCheck,
  Scale,
  Clock,
  PenLine,
  Brain,
  DollarSign,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Workflow,
  Lock,
  ShieldAlert,
  Settings2,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

// ───────────────────────────────────────────────
// Tipagens
// ───────────────────────────────────────────────
type AgentName =
  | "AGENTE_SEGURANCA"
  | "AGENTE_PROCESSUAL"
  | "AGENTE_PRAZOS"
  | "AGENTE_REDATOR"
  | "AGENTE_ESTRATEGICO"
  | "AGENTE_FINANCEIRO";

type SubAgentResult = {
  agent: AgentName | string;
  output: string;
  ms: number;
  error?: string;
};

type RoutingDecision = {
  analise: string;
  agentes: string[];
  tarefa_por_agente: Record<string, string>;
  alerta?: string;
};

type Turn = {
  id: string;
  role: "user" | "assistant" | "thinking" | "approval";
  content?: string;
  timestamp: number;
  routing?: RoutingDecision;
  results?: SubAgentResult[];
  confianca?: "Alta" | "Média" | "Baixa";
  alerta?: string;
  securityBlocked?: boolean;
  securityLevel?: string;
  totalMs?: number;
  executionId?: string;
  plannedAgents?: string[];
  // approval state
  approvalResolved?: "approved" | "denied";
};

// ───────────────────────────────────────────────
// Catálogo visual
// ───────────────────────────────────────────────
const AGENT_META: Record<
  AgentName,
  { label: string; short: string; desc: string; icon: any; color: string; ring: string; bg: string }
> = {
  AGENTE_SEGURANCA: {
    label: "Segurança & LGPD",
    short: "Segurança",
    desc: "LGPD, sigilo OAB, dados sensíveis. Sempre ativo.",
    icon: ShieldCheck,
    color: "text-rose-500 dark:text-rose-400",
    ring: "ring-rose-500/30",
    bg: "bg-rose-500/10",
  },
  AGENTE_PROCESSUAL: {
    label: "Processual",
    short: "Processual",
    desc: "Classificação documental, fase processual, próximos passos.",
    icon: Scale,
    color: "text-blue-500 dark:text-blue-400",
    ring: "ring-blue-500/30",
    bg: "bg-blue-500/10",
  },
  AGENTE_PRAZOS: {
    label: "Prazos",
    short: "Prazos",
    desc: "Cálculo de prazos com feriados forenses (CPC art. 219).",
    icon: Clock,
    color: "text-amber-500 dark:text-amber-400",
    ring: "ring-amber-500/30",
    bg: "bg-amber-500/10",
  },
  AGENTE_REDATOR: {
    label: "Redator",
    short: "Redator",
    desc: "Minutas, peças, contratos, opiniões.",
    icon: PenLine,
    color: "text-violet-500 dark:text-violet-400",
    ring: "ring-violet-500/30",
    bg: "bg-violet-500/10",
  },
  AGENTE_ESTRATEGICO: {
    label: "Estratégico",
    short: "Estratégico",
    desc: "Teses, probabilidade de êxito, contra-argumentos.",
    icon: Brain,
    color: "text-emerald-500 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  AGENTE_FINANCEIRO: {
    label: "Financeiro",
    short: "Financeiro",
    desc: "Honorários, custas, comunicação financeira.",
    icon: DollarSign,
    color: "text-teal-500 dark:text-teal-400",
    ring: "ring-teal-500/30",
    bg: "bg-teal-500/10",
  },
};

const ALL_AGENTS: AgentName[] = [
  "AGENTE_SEGURANCA",
  "AGENTE_PROCESSUAL",
  "AGENTE_PRAZOS",
  "AGENTE_REDATOR",
  "AGENTE_ESTRATEGICO",
  "AGENTE_FINANCEIRO",
];

const SAMPLE_PROMPTS = [
  {
    title: "Calcular prazo + redigir contestação",
    body: "Recebi uma intimação hoje para apresentar contestação em 15 dias úteis em ação de cobrança contra cliente PJ. Calcule o prazo e me dê um esboço da peça.",
    icon: Clock,
  },
  {
    title: "Analisar risco de contrato",
    body: "Vou enviar um contrato de prestação de serviços de TI para revisão. Quais cláusulas devo checar primeiro e que riscos costumam aparecer?",
    icon: ShieldCheck,
  },
  {
    title: "Estratégia para ação trabalhista",
    body: "Reclamada quer fazer acordo em audiência inicial em ação de horas extras. Qual a melhor estratégia e probabilidade de êxito mantendo a defesa?",
    icon: Brain,
  },
  {
    title: "Honorários para caso recorrente",
    body: "Cliente PJ quer contratar consultoria jurídica preventiva mensal. Sugira modelo de honorários e como apresentar a proposta.",
    icon: DollarSign,
  },
];

// ───────────────────────────────────────────────
// Parser
// ───────────────────────────────────────────────
function buildAssistantTurn(raw: any, ms: number): Partial<Turn> {
  const routing: RoutingDecision = raw?.routing ?? {
    analise: "",
    agentes: [],
    tarefa_por_agente: {},
  };
  const results: SubAgentResult[] = raw?.results ?? [];
  let confianca: "Alta" | "Média" | "Baixa" = "Alta";
  if (raw?.security_blocked) confianca = "Alta";
  else if (results.some((r) => r.error)) confianca = "Média";
  else if (results.length === 0) confianca = "Baixa";

  return {
    routing,
    results,
    confianca,
    securityBlocked: !!raw?.security_blocked,
    securityLevel: raw?.security_level,
    executionId: raw?.execution_id,
    plannedAgents: raw?.planned_agents,
    alerta: raw?.security_blocked
      ? "Operação bloqueada pelo Agente de Segurança."
      : routing.alerta || "",
    totalMs: ms,
  };
}

// ───────────────────────────────────────────────
// Componente principal
// ───────────────────────────────────────────────
export default function MCPAssistente() {
  const { user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Seletor de subagentes
  const [selectedAgents, setSelectedAgents] = useState<Set<AgentName>>(
    new Set(ALL_AGENTS), // default: todos (router vai escolher)
  );
  // Modal aprovação
  const [pendingApproval, setPendingApproval] = useState<{
    executionId: string;
    plannedAgents: string[];
    securityOutput: string;
    originalMessage: string;
    turnId: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  useEffect(() => {
    document.title = "Assistente MCP — Painel Jurídico";
  }, []);

  function toggleAgent(a: AgentName) {
    if (a === "AGENTE_SEGURANCA") return; // sempre ativo
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  async function sendMessage(text: string, opts?: { resumeApprovedId?: string }) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userTurn: Turn = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const thinkingTurn: Turn = {
      id: crypto.randomUUID(),
      role: "thinking",
      timestamp: Date.now(),
    };
    setTurns((prev) => [...prev, userTurn, thinkingTurn]);
    setInput("");
    setLoading(true);
    const start = Date.now();

    try {
      // Seleção do usuário (se diferente de "todos", manda explicitamente)
      const selectedArr = Array.from(selectedAgents);
      const useExplicitSelection =
        selectedArr.length < ALL_AGENTS.length && selectedArr.length > 0;

      const { data, error } = await supabase.functions.invoke(
        "mcp-orquestrador",
        {
          body: {
            message: trimmed,
            userId: user?.id,
            selected_agents: useExplicitSelection ? selectedArr : undefined,
            approved_execution_id: opts?.resumeApprovedId,
          },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const ms = Date.now() - start;
      const parsed = buildAssistantTurn(data?.raw, ms);

      const assistantTurn: Turn = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data?.response ?? "",
        timestamp: Date.now(),
        ...parsed,
      };

      setTurns((prev) => {
        const filtered = prev.filter((t) => t.id !== thinkingTurn.id);
        return [...filtered, assistantTurn];
      });

      // Se requer aprovação, abre modal
      if (data?.raw?.requires_approval && data?.raw?.execution_id) {
        const securityResult = (data.raw.results ?? []).find(
          (r: any) => r.agent === "AGENTE_SEGURANCA",
        );
        setPendingApproval({
          executionId: data.raw.execution_id,
          plannedAgents: data.raw.planned_agents ?? [],
          securityOutput: securityResult?.output ?? "",
          originalMessage: trimmed,
          turnId: assistantTurn.id,
        });
      }
    } catch (e: any) {
      const msg = e?.message || "Falha ao consultar o orquestrador.";
      toast.error(msg);
      setTurns((prev) => prev.filter((t) => t.id !== thinkingTurn.id));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function approveAndContinue(notes: string) {
    if (!pendingApproval || !user?.id) return;
    const exec = pendingApproval;
    setPendingApproval(null);

    // Marca approval no DB
    try {
      await supabase
        .from("mcp_executions")
        .update({
          approval_status: "approved",
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", exec.executionId);
    } catch (e) {
      console.error("approve update:", e);
    }

    // Marca turn original como aprovado (UI)
    setTurns((prev) =>
      prev.map((t) =>
        t.id === exec.turnId ? { ...t, approvalResolved: "approved" } : t,
      ),
    );

    toast.success("Aprovação registrada. Reexecutando com os demais agentes…");
    await sendMessage(exec.originalMessage, { resumeApprovedId: exec.executionId });
  }

  async function denyApproval(notes: string) {
    if (!pendingApproval || !user?.id) return;
    const exec = pendingApproval;
    setPendingApproval(null);

    try {
      await supabase
        .from("mcp_executions")
        .update({
          approval_status: "denied",
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          status: "denied",
        })
        .eq("id", exec.executionId);
    } catch (e) {
      console.error("deny update:", e);
    }

    setTurns((prev) =>
      prev.map((t) =>
        t.id === exec.turnId ? { ...t, approvalResolved: "denied" } : t,
      ),
    );
    toast.info("Operação negada. Nada além do parecer de segurança foi executado.");
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = turns.length === 0;
  const selectedCount = selectedAgents.size;

  return (
    <div className="flex flex-col bg-background" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Workflow className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold tracking-tight">Assistente MCP</h1>
              <p className="text-[11px] text-muted-foreground">
                Orquestrador jurídico · {selectedCount}/6 agentes selecionados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SubagentSelector
              selected={selectedAgents}
              toggle={toggleAgent}
              onSelectAll={() => setSelectedAgents(new Set(ALL_AGENTS))}
              onClear={() => setSelectedAgents(new Set(["AGENTE_SEGURANCA"]))}
            />
            <Badge
              variant="outline"
              className="gap-1.5 text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Operacional
            </Badge>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div ref={scrollRef} className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {isEmpty ? (
            <EmptyState onPick={(p) => sendMessage(p)} />
          ) : (
            <div className="space-y-6">
              {turns.map((t) => (
                <TurnView key={t.id} turn={t} />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Descreva o caso, prazo, peça ou estratégia jurídica…"
              disabled={loading}
              rows={1}
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent text-sm pr-14 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-2 h-9 w-9 rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>
                Segurança sempre ativa · Bloqueios CRÍTICOS exigem aprovação humana
              </span>
            </div>
            <span>Enter envia · Shift+Enter quebra linha</span>
          </div>
        </div>
      </div>

      {/* Modal de aprovação humana */}
      <ApprovalDialog
        open={!!pendingApproval}
        onClose={() => setPendingApproval(null)}
        data={pendingApproval}
        onApprove={approveAndContinue}
        onDeny={denyApproval}
      />
    </div>
  );
}

// ───────────────────────────────────────────────
// Seletor de subagentes (popover)
// ───────────────────────────────────────────────
function SubagentSelector({
  selected,
  toggle,
  onSelectAll,
  onClear,
}: {
  selected: Set<AgentName>;
  toggle: (a: AgentName) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]">
          <Settings2 className="w-3 h-3" />
          Subagentes
          <Badge variant="secondary" className="h-4 px-1.5 text-[9px] tabular-nums">
            {selected.size}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-2">
        <div className="px-2 py-1.5 mb-1 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Selecione os agentes
          </p>
          <div className="flex gap-1">
            <button
              onClick={onSelectAll}
              className="text-[10px] text-primary hover:underline"
            >
              Todos
            </button>
            <span className="text-[10px] text-muted-foreground">·</span>
            <button
              onClick={onClear}
              className="text-[10px] text-muted-foreground hover:underline"
            >
              Mínimo
            </button>
          </div>
        </div>
        <div className="space-y-0.5">
          {ALL_AGENTS.map((a) => {
            const meta = AGENT_META[a];
            const Icon = meta.icon;
            const isLocked = a === "AGENTE_SEGURANCA";
            const isOn = selected.has(a);
            return (
              <label
                key={a}
                className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors ${
                  isLocked
                    ? "bg-muted/30 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
              >
                <Checkbox
                  checked={isOn}
                  disabled={isLocked}
                  onCheckedChange={() => toggle(a)}
                  className="mt-0.5"
                />
                <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium leading-tight">{meta.label}</p>
                    {isLocked && (
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                    {meta.desc}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        <p className="mt-2 px-2 py-1.5 text-[10px] text-muted-foreground border-t border-border/40">
          Segurança & LGPD é sempre executada primeiro e não pode ser desativada.
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ───────────────────────────────────────────────
// Empty state
// ───────────────────────────────────────────────
function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 py-6"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium tracking-wide uppercase text-primary">
            Master Control Program
          </span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Como posso ajudar seu escritório hoje?
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Descreva qualquer situação jurídica. O orquestrador classifica, valida segurança e aciona os especialistas certos.
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ALL_AGENTS.map((a) => {
          const meta = AGENT_META[a];
          const Icon = meta.icon;
          return (
            <div
              key={a}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border/40 hover:border-border bg-card/50 hover:bg-card transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </div>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                {meta.short}
              </span>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">
          Comece com um exemplo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAMPLE_PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.title}
                onClick={() => onPick(p.body)}
                className="text-left p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Turn renderer
// ───────────────────────────────────────────────
function TurnView({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 shadow-sm">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        </div>
      </motion.div>
    );
  }

  if (turn.role === "thinking") {
    return <ThinkingPanel />;
  }

  return <AssistantTurn turn={turn} />;
}

// ───────────────────────────────────────────────
// Thinking
// ───────────────────────────────────────────────
function ThinkingPanel() {
  const phases = [
    { label: "Classificando intenção", icon: Brain, color: "text-violet-500" },
    { label: "Validando segurança", icon: ShieldCheck, color: "text-rose-500" },
    { label: "Acionando especialistas", icon: Workflow, color: "text-primary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <Card className="px-4 py-3 max-w-[80%] border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Orquestrando…
          </span>
        </div>
        <div className="space-y-1.5">
          {phases.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity }}
                className="flex items-center gap-2 text-[11px]"
              >
                <Icon className={`w-3 h-3 ${p.color}`} />
                <span className="text-muted-foreground">{p.label}</span>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Assistant turn (resposta consolidada)
// ───────────────────────────────────────────────
function AssistantTurn({ turn }: { turn: Turn }) {
  const blocked = !!turn.securityBlocked;
  const confColor =
    turn.confianca === "Alta"
      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
      : turn.confianca === "Média"
      ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
      : "border-muted text-muted-foreground bg-muted/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Análise + meta */}
      {turn.routing?.analise && (
        <Card className="p-4 border-border/50 bg-card">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Análise do orquestrador
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {turn.confianca && (
                <Badge variant="outline" className={`text-[10px] ${confColor}`}>
                  Confiança: {turn.confianca}
                </Badge>
              )}
              {turn.totalMs && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {(turn.totalMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed">{turn.routing.analise}</p>
        </Card>
      )}

      {/* Approval-resolved chip */}
      {turn.approvalResolved && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${
            turn.approvalResolved === "approved"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
              : "border-muted text-muted-foreground bg-muted/30"
          }`}
        >
          {turn.approvalResolved === "approved" ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          {turn.approvalResolved === "approved"
            ? "Aprovação humana registrada · execução continuada"
            : "Aprovação negada · execução interrompida"}
        </div>
      )}

      {/* Bloqueio de segurança */}
      {blocked && !turn.approvalResolved && (
        <Card className="p-4 border-rose-500/40 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Operação bloqueada — aprovação humana necessária
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nível de segurança classificado como{" "}
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {turn.securityLevel || "CRÍTICO"}
                </span>
                . O modal de revisão está aberto.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pipeline de agentes */}
      {turn.results && turn.results.length > 0 && (
        <Card className="p-4 border-border/50 bg-card">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Pipeline de execução · {turn.results.length} agente(s)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {turn.results.map((r, i) => {
              const meta = AGENT_META[r.agent as AgentName];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={`${r.agent}-${i}`} className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${meta.bg} ring-1 ${meta.ring}`}
                  >
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span className={`text-[10px] font-medium ${meta.color}`}>
                      {meta.short}
                    </span>
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {(r.ms / 1000).toFixed(1)}s
                    </span>
                    {r.error && <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />}
                  </div>
                  {i < turn.results!.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Cards individuais por agente */}
      {turn.results && turn.results.length > 0 && (
        <div className="space-y-2">
          {turn.results.map((r) => {
            const meta = AGENT_META[r.agent as AgentName];
            if (!meta) return null;
            return <AgentResultCard key={r.agent + r.ms} result={r} meta={meta} />;
          })}
        </div>
      )}

      {/* Alerta */}
      {turn.alerta && turn.alerta !== "Nenhum" && !blocked && (
        <Card className="p-3 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              {turn.alerta}
            </p>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Card por agente
// ───────────────────────────────────────────────
function AgentResultCard({
  result,
  meta,
}: {
  result: SubAgentResult;
  meta: typeof AGENT_META[AgentName];
}) {
  const [open, setOpen] = useState(true);
  const Icon = meta.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/50 bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium leading-tight">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {(result.ms / 1000).toFixed(2)}s
                  {result.error && " · com erro"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 border-t border-border/40">
            {result.error ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ {result.error}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none mt-2 text-sm leading-relaxed prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                <ReactMarkdown>{result.output}</ReactMarkdown>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ───────────────────────────────────────────────
// Modal aprovação humana
// ───────────────────────────────────────────────
function ApprovalDialog({
  open,
  onClose,
  data,
  onApprove,
  onDeny,
}: {
  open: boolean;
  onClose: () => void;
  data: {
    executionId: string;
    plannedAgents: string[];
    securityOutput: string;
    originalMessage: string;
  } | null;
  onApprove: (notes: string) => void;
  onDeny: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) setNotes("");
  }, [open]);

  if (!data) return null;

  const remaining = data.plannedAgents.filter((a) => a !== "AGENTE_SEGURANCA");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <Badge
              variant="outline"
              className="border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/5 text-[10px]"
            >
              RISCO CRÍTICO
            </Badge>
          </div>
          <DialogTitle className="text-base">
            Aprovação humana obrigatória
          </DialogTitle>
          <DialogDescription className="text-xs">
            O Agente de Segurança identificou risco crítico (LGPD, sigilo OAB ou
            dado sensível). Nada além do parecer de segurança foi executado. Confirme manualmente
            antes que os demais agentes processem a solicitação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Parecer de segurança */}
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider font-medium text-rose-600 dark:text-rose-400 mb-1.5">
              Parecer do AGENTE_SEGURANCA
            </p>
            <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap max-h-48 overflow-auto">
              {data.securityOutput}
            </p>
          </div>

          {/* Agentes restantes */}
          {remaining.length > 0 && (
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
                Agentes que serão executados se você aprovar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {remaining.map((a) => {
                  const meta = AGENT_META[a as AgentName];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={a}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${meta.bg} ring-1 ${meta.ring}`}
                    >
                      <Icon className={`w-3 h-3 ${meta.color}`} />
                      <span className={`text-[10px] font-medium ${meta.color}`}>
                        {meta.short}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5 block">
              Justificativa (opcional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: cliente já consentiu por escrito, dado anonimizado, autorização do sócio responsável…"
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onDeny(notes)} className="gap-1.5">
            <X className="w-3.5 h-3.5" />
            Negar
          </Button>
          <Button onClick={() => onApprove(notes)} className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovar e continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
