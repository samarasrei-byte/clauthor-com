/**
 * ThorConciergeChat — chat LLM real (streaming) para o hero da home e /thor.
 *
 * Substitui o funil scripted anterior. Conversa livre, estilo ChatGPT, com o
 * Thor agindo como consultor. Ao detectar a linha `RECOMENDACAO: <dept>` no
 * final da resposta, mostra um CTA para o departamento recomendado.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Loader2, Send, Diamond } from "lucide-react";
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
 *   RECOMENDACAO: comercial          (legado — vira departamento)
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
    "Oi, sou o Thor. Me conta qual é a sua maior dor hoje — e, se quiser, o tamanho da empresa ou o orçamento que tem em mente. Com isso eu já monto a solução com melhor custo-benefício.",
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
              /* chunk parcial — ignora */
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

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-border/40 bg-background overflow-hidden",
        className,
      )}
    >
      {/* Header — minimal Apple-like */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/40">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
          <Diamond className="h-3 w-3" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground leading-tight tracking-tight">Thor</p>
          <p className="text-[11px] text-muted-foreground/80 leading-tight mt-0.5">
            {isStreaming ? "digitando…" : "online"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={cn("overflow-y-auto px-5 py-6 space-y-4", minHeight, "max-h-[520px]")}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" ? (
              <div className="max-w-[92%] text-[14.5px] leading-[1.55] text-foreground">
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_p]:text-foreground">
                  <ReactMarkdown>{m.content || (isStreaming ? "…" : "")}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="max-w-[80%] rounded-[18px] bg-primary px-3.5 py-2 text-[14.5px] leading-[1.45] text-primary-foreground">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            )}
          </div>
        ))}

        {/* Recommendation CTA — minimal card */}
        {recommendation && !isStreaming && (
          <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-4">
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground font-medium mb-1.5">
              Recomendação
            </p>
            {recommendation.kind === "departamento" && recommendedPkg ? (
              <>
                <p className="text-[15px] font-semibold text-foreground mb-0.5 tracking-tight">
                  Departamento {recommendedPkg.name}
                </p>
                <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">{recommendedPkg.painPoint}</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px]">
                    <span className="text-foreground font-semibold">{formatBRL(recommendedPkg.priceMonthly)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <Button size="sm" onClick={goToRecommended} className="gap-1.5 rounded-full h-8 px-3.5">
                    Ver departamento
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : recommendation.kind === "squad" ? (
              <>
                <p className="text-[15px] font-semibold text-foreground mb-0.5 tracking-tight">Monte seu Squad</p>
                <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
                  2 a 5 especialistas que colaboram. Custo em tempo real, ideal quando a dor cruza mais de uma função.
                </p>
                <div className="flex justify-end">
                  <Button size="sm" onClick={goToRecommended} className="gap-1.5 rounded-full h-8 px-3.5">
                    Montar Squad
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-foreground mb-0.5 tracking-tight">Começar com 1 agente</p>
                <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">
                  Prova de conceito ou tarefa muito específica. A partir de R$ 197/mês.
                </p>
                <div className="flex justify-end">
                  <Button size="sm" onClick={goToRecommended} className="gap-1.5 rounded-full h-8 px-3.5">
                    Ver marketplace
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className="text-[12px] px-3 py-1.5 rounded-full border border-border/50 bg-transparent text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer — Apple-like pill */}
      <form onSubmit={handleSubmit} className="border-t border-border/40 px-3 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-muted/30 px-3 py-2 focus-within:border-border transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem"
            rows={1}
            maxLength={2000}
            disabled={isStreaming}
            className="min-h-[28px] max-h-32 resize-none border-0 bg-transparent p-0 text-[14.5px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="h-7 w-7 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground/40 transition-colors"
            aria-label="Enviar"
          >
            {isStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </Button>
        </div>
      </form>
    </div>
  );
}
