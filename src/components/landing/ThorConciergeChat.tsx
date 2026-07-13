/**
 * ThorConciergeChat · chat LLM real (streaming) para o hero da home e /thor.
 *
 * Substitui o funil scripted anterior. Conversa livre, estilo ChatGPT, com o
 * Thor agindo como consultor. Ao detectar a linha `RECOMENDACAO: <dept>` no
 * final da resposta, mostra um CTA para o departamento recomendado.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowRight, ArrowUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trackKpi } from "@/lib/kpiTracker";
import { DEPARTMENT_PACKAGES, formatBRL } from "@/data/departmentPackages";

/* -------------------------------------------------------------------------- */
/*  Tipos                                                                     */
/* -------------------------------------------------------------------------- */

type Role = "user" | "assistant";
type KpiSource = "landing" | "thor_guide" | "departamentos_page";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Recomendação extraída da resposta (se houver). */
  reco?: Recommendation;
}

interface ThorConciergeChatProps {
  source?: KpiSource;
  minHeight?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/home-thor-chat`;
const PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const VALID_DEPTS = new Set(["comercial", "atendimento", "marketing", "juridico", "financeiro", "rh"]);

type RecoKind = "departamento" | "squad" | "agente";

interface Recommendation {
  kind: RecoKind;
  deptId?: string;
}

/**
 * Extrai "RECOMENDACAO: <tipo>[:<dept>]" da resposta.
 * Formatos aceitos:
 *   RECOMENDACAO: departamento:comercial
 *   RECOMENDACAO: squad
 *   RECOMENDACAO: agente
 *   RECOMENDACAO: comercial          (legado · vira departamento)
 */
function splitRecommendation(text: string): { visible: string; reco?: Recommendation } {
  const match = text.match(/RECOMENDACAO\s*:\s*([a-zA-Z_]+)(?:\s*:\s*([a-zA-Z_]+))?\s*$/im);
  if (!match) return { visible: text };
  const visible = text.replace(match[0], "").trimEnd();
  const a = match[1].toLowerCase().trim();
  const b = match[2]?.toLowerCase().trim();

  if (a === "departamento" && b && VALID_DEPTS.has(b)) return { visible, reco: { kind: "departamento", deptId: b } };
  if (a === "squad") return { visible, reco: { kind: "squad" } };
  if (a === "agente") return { visible, reco: { kind: "agente" } };
  // legado: id direto de departamento
  if (VALID_DEPTS.has(a)) return { visible, reco: { kind: "departamento", deptId: a } };
  return { visible };
}

const INTRO: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Oi, sou o Thor. Me conta qual é a sua maior dor hoje · e, se quiser, o tamanho da empresa ou o orçamento que tem em mente. Com isso eu já monto a solução com melhor custo-benefício.",
};

const SUGGESTIONS = [
  "Preciso escalar comercial, budget ~R$ 1.500/mês",
  "Atendimento sobrecarregado, empresa de 20 pessoas",
  "Quero automatizar jurídico",
  "Só quero testar 1 agente antes",
];

/* -------------------------------------------------------------------------- */
/*  Componente                                                                */
/* -------------------------------------------------------------------------- */

export default function ThorConciergeChat({
  source = "landing",
  minHeight = "min-h-[420px]",
  className,
}: ThorConciergeChatProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll para a última mensagem enquanto streama.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Foco inicial e após stream terminar.
  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  // Cancela stream ao desmontar.
  useEffect(() => () => abortRef.current?.abort(), []);

  const recommendation = useMemo<Recommendation | undefined>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].reco) return messages[i].reco;
    }
    return undefined;
  }, [messages]);

  const recommendedPkg = useMemo(
    () =>
      recommendation?.kind === "departamento" && recommendation.deptId
        ? DEPARTMENT_PACKAGES.find((d) => d.id === recommendation.deptId)
        : undefined,
    [recommendation],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || isStreaming) return;

      const userMsg: ChatMessage = { id: uid(), role: "user", content: clean };
      const assistantId = uid();
      const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" };

      // Snapshot antes do setState para enviar ao servidor.
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);
      trackKpi("thor_guide_section_play", { source, section: "chat_message_sent" });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          if (res.status === 429) {
            toast.error("Muitas mensagens em pouco tempo. Aguarde alguns segundos.");
          } else if (res.status === 402) {
            toast.error("Créditos esgotados. Fale com o time.");
          } else {
            toast.error("Não consegui responder agora. Tenta de novo em instantes.");
          }
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                full += delta;
                const { visible, reco } = splitRecommendation(full);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: visible, reco } : m,
                  ),
                );
              }
            } catch {
              /* chunk parcial · ignora */
            }
          }
        }

        // Finaliza extração
        const { visible, reco } = splitRecommendation(full);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: visible || full, reco } : m)),
        );
        if (reco) {
          const tag = reco.kind === "departamento" ? `departamento_${reco.deptId}` : reco.kind;
          trackKpi("thor_guide_section_play", { source, section: `chat_recommended_${tag}` });
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("[ThorConciergeChat] stream error", err);
          toast.error("Falha na conexão. Tenta de novo.");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, messages, source],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const goToRecommended = useCallback(() => {
    if (!recommendation) return;
    if (recommendation.kind === "departamento" && recommendation.deptId) {
      trackKpi("thor_guide_section_play", { source, section: `chat_cta_departamento_${recommendation.deptId}` });
      navigate(`/departamentos/${recommendation.deptId}`);
      return;
    }
    if (recommendation.kind === "squad") {
      trackKpi("thor_guide_section_play", { source, section: "chat_cta_squad" });
      navigate("/team-builder");
      return;
    }
    if (recommendation.kind === "agente") {
      trackKpi("thor_guide_section_play", { source, section: "chat_cta_agente" });
      navigate("/marketplace");
    }
  }, [navigate, recommendation, source]);

  const chatBodyFont = { fontFamily: "'Instrument Sans', 'Inter', sans-serif" };

  return (
    <div
      className={cn(
        "relative w-full flex flex-col rounded-2xl border border-border/40 bg-background overflow-hidden",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        className,
      )}
    >
      {/* Header · Airy editorial */}
      <header className="px-8 py-5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("h-2 w-2 rounded-full transition-colors", isStreaming ? "bg-primary animate-pulse" : "bg-primary")} />
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            Converse com o Thor
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-10", minHeight, "max-h-[560px]")}
      >
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex flex-col gap-2 max-w-[92%]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                Thor
              </span>
              <div
                className="text-[15px] leading-[1.65] text-foreground"
                style={chatBodyFont}
              >
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_p]:text-foreground [&_p]:leading-[1.65]">
                  <ReactMarkdown>{m.content || (isStreaming ? "…" : "")}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-end gap-2">
              <div
                className="max-w-[80%] bg-muted/50 border border-border/20 px-5 py-3 rounded-2xl text-[15px] leading-[1.5] text-foreground"
                style={chatBodyFont}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ),
        )}

        {/* Recommendation · editorial card matching passo 3 do onboarding */}
        {recommendation && !isStreaming && (
          <article className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-6 space-y-5">
            <div className="space-y-1">
              <p className="type-eyebrow text-primary">Com base no que você me disse</p>
              <h3 className="font-serif italic text-2xl md:text-[26px] leading-tight tracking-tight text-foreground">
                {recommendation.kind === "departamento" && recommendedPkg
                  ? `Departamento de ${recommendedPkg.name}.`
                  : recommendation.kind === "squad"
                  ? "Uma squad enxuta faz mais sentido."
                  : "Comece com um agente especialista."}
              </h3>
            </div>

            <p className="type-body text-foreground/75 leading-relaxed">
              {recommendation.kind === "departamento" && recommendedPkg
                ? recommendedPkg.painPoint
                : recommendation.kind === "squad"
                ? "2 a 5 especialistas colaborando · custo em tempo real, ideal quando a dor cruza mais de uma função."
                : "Prova de conceito ou tarefa muito específica · a partir de R$ 197/mês."}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              {recommendation.kind === "departamento" && recommendedPkg ? (
                <div className="type-body">
                  <span className="text-foreground font-medium">{formatBRL(recommendedPkg.priceMonthly)}</span>
                  <span className="text-muted-foreground">/mês · time completo</span>
                </div>
              ) : <span />}
              <Button
                size="sm"
                onClick={goToRecommended}
                className="gap-1.5 h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {recommendation.kind === "departamento"
                  ? "Ativar departamento"
                  : recommendation.kind === "squad"
                  ? "Montar squad"
                  : "Ver marketplace"}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
          </article>
        )}
      </div>

      {/* Footer · chips + composer */}
      <footer className="px-8 pb-7 pt-2">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={isStreaming}
                className="px-4 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte qualquer coisa ao Thor..."
            rows={1}
            maxLength={2000}
            disabled={isStreaming}
            style={chatBodyFont}
            className="w-full min-h-[52px] max-h-32 resize-none bg-muted/30 border border-border/50 rounded-xl px-5 py-4 pr-14 text-[15px] leading-[1.4] shadow-none placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/10 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground/40 shadow-sm transition-colors"
            aria-label="Enviar"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
          </Button>
        </form>

        <p className="mt-4 text-[10px] text-center text-muted-foreground/40 font-medium tracking-[0.18em] uppercase">
          Thor · Clauthor AI
        </p>
      </footer>
    </div>
  );
}
