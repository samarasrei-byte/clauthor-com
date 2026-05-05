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
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  role: "user" | "assistant" | "thinking";
  content?: string;
  timestamp: number;
  // Estruturado (assistant)
  routing?: RoutingDecision;
  results?: SubAgentResult[];
  confianca?: "Alta" | "Média" | "Baixa";
  alerta?: string;
  securityBlocked?: boolean;
  totalMs?: number;
  // Streaming visual
  thinkingAgents?: string[];
  completedAgents?: string[];
};

// ───────────────────────────────────────────────
// Catálogo visual dos subagentes
// ───────────────────────────────────────────────
const AGENT_META: Record<
  AgentName,
  { label: string; icon: any; color: string; ring: string; bg: string }
> = {
  AGENTE_SEGURANCA: {
    label: "Segurança & LGPD",
    icon: ShieldCheck,
    color: "text-rose-500 dark:text-rose-400",
    ring: "ring-rose-500/30",
    bg: "bg-rose-500/10",
  },
  AGENTE_PROCESSUAL: {
    label: "Processual",
    icon: Scale,
    color: "text-blue-500 dark:text-blue-400",
    ring: "ring-blue-500/30",
    bg: "bg-blue-500/10",
  },
  AGENTE_PRAZOS: {
    label: "Prazos",
    icon: Clock,
    color: "text-amber-500 dark:text-amber-400",
    ring: "ring-amber-500/30",
    bg: "bg-amber-500/10",
  },
  AGENTE_REDATOR: {
    label: "Redator",
    icon: PenLine,
    color: "text-violet-500 dark:text-violet-400",
    ring: "ring-violet-500/30",
    bg: "bg-violet-500/10",
  },
  AGENTE_ESTRATEGICO: {
    label: "Estratégico",
    icon: Brain,
    color: "text-emerald-500 dark:text-emerald-400",
    ring: "ring-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  AGENTE_FINANCEIRO: {
    label: "Financeiro",
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

// ───────────────────────────────────────────────
// Sugestões iniciais (empty state)
// ───────────────────────────────────────────────
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
// Parser do raw da edge function
// ───────────────────────────────────────────────
function buildAssistantTurn(raw: any, ms: number): Partial<Turn> {
  const routing: RoutingDecision = raw?.routing ?? {
    analise: "",
    agentes: [],
    tarefa_por_agente: {},
  };
  const results: SubAgentResult[] = raw?.results ?? [];

  // Confiança heurística
  let confianca: "Alta" | "Média" | "Baixa" = "Alta";
  if (raw?.security_blocked) confianca = "Alta";
  else if (results.some((r) => r.error)) confianca = "Média";
  else if (results.length === 0) confianca = "Baixa";

  return {
    routing,
    results,
    confianca,
    securityBlocked: !!raw?.security_blocked,
    alerta: raw?.security_blocked
      ? "Operação bloqueada pelo Agente de Segurança."
      : routing.alerta || "",
    totalMs: ms,
    completedAgents: results.map((r) => r.agent),
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  useEffect(() => {
    document.title = "Assistente MCP — Painel Jurídico";
  }, []);

  async function sendMessage(text: string) {
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
      thinkingAgents: [],
    };

    setTurns((prev) => [...prev, userTurn, thinkingTurn]);
    setInput("");
    setLoading(true);

    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke(
        "mcp-orquestrador",
        {
          body: { message: trimmed, userId: user?.id },
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

      // Substitui o thinking pelo assistant
      setTurns((prev) => {
        const filtered = prev.filter((t) => t.id !== thinkingTurn.id);
        return [...filtered, assistantTurn];
      });
    } catch (e: any) {
      const msg = e?.message || "Falha ao consultar o orquestrador.";
      toast.error(msg);
      setTurns((prev) => prev.filter((t) => t.id !== thinkingTurn.id));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = turns.length === 0;

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
              <h1 className="text-sm font-semibold tracking-tight">
                Assistente MCP
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Orquestrador jurídico · 6 agentes especializados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {isEmpty ? (
            <EmptyState onPick={(p) => sendMessage(p)} />
          ) : (
            <div className="space-y-6">
              {turns.map((t) => (
                <TurnView key={t.id} turn={t} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/40 bg-background/60 backdrop-blur-xl">
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
              <span>Validação de Segurança & LGPD obrigatória em cada resposta</span>
            </div>
            <span>Enter para enviar · Shift+Enter para quebrar linha</span>
          </div>
        </div>
      </div>
    </div>
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
          Descreva qualquer situação jurídica. O orquestrador classifica,
          valida segurança e aciona os especialistas certos.
        </p>
      </div>

      {/* Squad visualization */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ALL_AGENTS.map((a) => {
          const meta = AGENT_META[a];
          const Icon = meta.icon;
          return (
            <div
              key={a}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border/40 hover:border-border bg-card/50 hover:bg-card transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <Icon className={`w-4 h-4 ${meta.color}`} />
              </div>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sample prompts */}
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
                    <p className="text-sm font-medium leading-tight">
                      {p.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.body}
                    </p>
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
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {turn.content}
          </p>
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
// Thinking panel — animação de roteamento
// ───────────────────────────────────────────────
function ThinkingPanel() {
  const [phase, setPhase] = useState(0);
  // 0: classificando · 1: validando segurança · 2: acionando especialistas

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const phases = [
    { label: "Classificando intenção", icon: Brain },
    { label: "Validando segurança e LGPD", icon: ShieldCheck },
    { label: "Acionando agentes especializados", icon: Workflow },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 border-border/40 bg-card/30 backdrop-blur">
        <div className="space-y-2.5">
          {phases.map((p, i) => {
            const Icon = p.icon;
            const active = i === phase;
            const done = i < phase;
            return (
              <div
                key={p.label}
                className={`flex items-center gap-3 transition-opacity ${
                  i > phase ? "opacity-30" : "opacity-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    done
                      ? "bg-emerald-500/15 text-emerald-500"
                      : active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-xs ${
                    active ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Assistant turn — resposta consolidada
// ───────────────────────────────────────────────
function AssistantTurn({ turn }: { turn: Turn }) {
  const { routing, results, confianca, alerta, securityBlocked, totalMs } = turn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Análise + meta */}
      {routing?.analise && (
        <Card className="p-4 border-border/40 bg-card/40 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Análise
                </span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {totalMs && <span>{(totalMs / 1000).toFixed(1)}s</span>}
                  <ConfidenceBadge level={confianca || "Média"} />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {routing.analise}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bloqueio de segurança */}
      {securityBlocked && (
        <Card className="p-4 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                Operação Bloqueada
              </p>
              <p className="text-sm text-foreground/90">
                O Agente de Segurança identificou risco crítico. Revise os
                detalhes abaixo antes de prosseguir.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pipeline visual de agentes */}
      {results && results.length > 0 && (
        <AgentPipeline results={results} />
      )}

      {/* Outputs por agente */}
      {results?.map((r, i) => (
        <AgentResultCard key={`${r.agent}-${i}`} result={r} />
      ))}

      {/* Alerta */}
      {alerta && !securityBlocked && (
        <Card className="p-3 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {alerta}
            </p>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

// ───────────────────────────────────────────────
// Confidence badge
// ───────────────────────────────────────────────
function ConfidenceBadge({ level }: { level: "Alta" | "Média" | "Baixa" }) {
  const cfg = {
    Alta: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
    Média: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5",
    Baixa: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5",
  }[level];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider ${cfg}`}
    >
      <span className="w-1 h-1 rounded-full bg-current" /> {level}
    </span>
  );
}

// ───────────────────────────────────────────────
// Pipeline visual dos agentes que rodaram
// ───────────────────────────────────────────────
function AgentPipeline({ results }: { results: SubAgentResult[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {results.map((r, i) => {
        const meta = AGENT_META[r.agent as AgentName];
        if (!meta) return null;
        const Icon = meta.icon;
        const ok = !r.error;
        return (
          <div key={`${r.agent}-${i}`} className="flex items-center gap-1.5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium ${
                ok
                  ? `${meta.bg} ${meta.color} border-transparent`
                  : "bg-muted text-muted-foreground border-border/50"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{meta.label}</span>
              <span className="text-[9px] opacity-60">
                {(r.ms / 1000).toFixed(1)}s
              </span>
            </motion.div>
            {i < results.length - 1 && (
              <ChevronDown className="w-3 h-3 text-muted-foreground/40 -rotate-90" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────
// Output de um subagente (collapsible)
// ───────────────────────────────────────────────
function AgentResultCard({ result }: { result: SubAgentResult }) {
  const meta = AGENT_META[result.agent as AgentName];
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!meta) return null;
  const Icon = meta.icon;

  async function copy() {
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    toast.success(`${meta.label}: copiado`);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-border/40">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <div
              className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-4 h-4 ${meta.color}`} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {meta.label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {result.error
                  ? "Erro na execução"
                  : `${(result.ms / 1000).toFixed(1)}s · ${result.output.length} caracteres`}
              </p>
            </div>
            {!result.error && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copy();
                }}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Copiar"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 border-t border-border/30">
            {result.error ? (
              <p className="text-xs text-rose-500 mt-3">
                {result.error}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none mt-3 text-sm leading-relaxed [&>p]:my-2 [&>ul]:my-2 [&>ol]:my-2 [&_strong]:font-semibold [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                <ReactMarkdown>{result.output}</ReactMarkdown>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
