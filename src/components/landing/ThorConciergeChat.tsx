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
  /** Departamento recomendado extraído da resposta (se houver). */
  deptId?: string;
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
    "Oi, sou o Thor. Antes de te mostrar preço, deixa eu entender seu cenário — qual sua maior dor hoje, e quantas pessoas tem na sua empresa?",
};

const SUGGESTIONS = [
  "Empresa de 5 pessoas, preciso gerar leads",
  "Média empresa, atendimento sobrecarregado",
  "Quero automatizar jurídico",
  "Testar 1 agente antes de contratar time",
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

  const recommendedDept = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].deptId) return messages[i].deptId;
    }
    return undefined;
  }, [messages]);

  const recommendedPkg = useMemo(
    () => (recommendedDept ? DEPARTMENT_PACKAGES.find((d) => d.id === recommendedDept) : undefined),
    [recommendedDept],
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
                const { visible, deptId } = splitRecommendation(full);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: visible, deptId } : m,
                  ),
                );
              }
            } catch {
              /* chunk parcial — ignora */
            }
          }
        }

        // Finaliza extração
        const { visible, deptId } = splitRecommendation(full);
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: visible || full, deptId } : m)),
        );
        if (deptId) {
          trackKpi("thor_guide_section_play", { source, section: `chat_recommended_${deptId}` });
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
    if (!recommendedDept) return;
    trackKpi("thor_guide_section_play", { source, section: `chat_cta_${recommendedDept}` });
    navigate(`/departamentos/${recommendedDept}`);
  }, [navigate, recommendedDept, source]);

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden",
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-background/40">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
          <Diamond className="h-4 w-4" strokeWidth={2} />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
              isStreaming ? "bg-primary animate-pulse" : "bg-emerald-500",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">Thor · consultor Clauthor</p>
          <p className="text-[11px] text-muted-foreground">
            {isStreaming ? "digitando..." : "online · resposta em segundos"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={cn("overflow-y-auto px-5 py-6 space-y-5", minHeight, "max-h-[520px]")}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground text-background",
              )}
            >
              {m.role === "user" ? "V" : "T"}
            </div>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background/70 text-foreground border border-border/50",
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5">
                  <ReactMarkdown>{m.content || (isStreaming ? "…" : "")}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Recommendation CTA */}
        {recommendedPkg && !isStreaming && (
          <div className="mt-2 ml-10 rounded-2xl border border-primary/30 bg-primary/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-primary font-semibold mb-1">
              Recomendação do Thor
            </p>
            <p className="text-base font-semibold text-foreground mb-1">
              Departamento {recommendedPkg.name}
            </p>
            <p className="text-sm text-muted-foreground mb-3">{recommendedPkg.painPoint}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-foreground font-bold">{formatBRL(recommendedPkg.priceMonthly)}</span>
                <span className="text-muted-foreground">/mês · {recommendedPkg.agentSlugs.length} agentes</span>
              </div>
              <Button size="sm" onClick={goToRecommended} className="gap-1.5">
                Ver departamento
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions (só antes da primeira msg do usuário) */}
      {messages.length === 1 && (
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-background/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/[0.04] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className="border-t border-border/60 bg-background/40 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva sua dor ou faça uma pergunta ao Thor..."
            rows={1}
            maxLength={2000}
            disabled={isStreaming}
            className="min-h-[44px] max-h-32 resize-none bg-background/60 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="h-11 w-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.55)] disabled:shadow-none transition-all"
            aria-label="Enviar"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 px-1 text-[10.5px] text-muted-foreground/70">
          O Thor pode cometer erros. Confirme informações importantes antes de decidir.
        </p>
      </form>
    </div>
  );
}
