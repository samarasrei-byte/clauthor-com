/**
 * ThorConciergeChat — chat conversacional embeddable (estilo ChatGPT).
 *
 * Usado como hero da landing e na rota /thor.
 * O visitante nunca sai da página até clicar no CTA final.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackKpi } from "@/lib/kpiTracker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TurnKey = "empresa" | "dor" | "icp" | "done";

interface CompanyData {
  empresa: string;
  industry: string;
  description?: string;
}

interface Lead {
  name: string;
  role: string;
  signal: string;
}

interface ChatMessage {
  id: string;
  role: "thor" | "user";
  content: React.ReactNode;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const INTRO_MESSAGE: ChatMessage = {
  id: "intro",
  role: "thor",
  content: (
    <>
      <p className="font-medium text-foreground">
        Qual a sua dor hoje?
      </p>
      <p className="mt-1 text-muted-foreground">
        Vamos montar um departamento sob medida pra você. Me diga o site ou o nome
        da sua empresa aqui embaixo — deixa eu analisar seu caso.
      </p>
    </>
  ),
};

type KpiSource = "landing" | "thor_guide";

interface Props {
  className?: string;
  /** Altura mínima do feed. Padrão: `min-h-[360px]`. */
  minHeight?: string;
  source?: KpiSource;
}

export default function ThorConciergeChat({
  className,
  minHeight = "min-h-[360px]",
  source = "landing",
}: Props) {
  const navigate = useNavigate();
  const sessionIdRef = useRef<string>(uid());

  const [turn, setTurn] = useState<TurnKey>("empresa");
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [dor, setDor] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    trackKpi("thor_guide_section_play", {
      source,
      section: "thor_concierge_started",
    });
  }, [source]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const invoke = useCallback(
    async <T,>(action: string, payload: Record<string, unknown>): Promise<T> => {
      const { data, error } = await supabase.functions.invoke("thor-concierge", {
        body: { action, ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as T;
    },
    [],
  );

  const push = (msg: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);

  const placeholder = useMemo(() => {
    switch (turn) {
      case "empresa":
        return "seusite.com.br  ·  ou  ·  nome da empresa";
      case "dor":
        return "Ex.: meu comercial responde lead em 3 dias e converte 4%.";
      case "icp":
        return "Ex.: Diretor de SaaS B2B, 20-100 pessoas, ciclo longo.";
      default:
        return "";
    }
  }, [turn]);

  const submit = async () => {
    const value = input.trim();
    if (!value || loading || turn === "done") return;

    push({ role: "user", content: <span>{value}</span> });
    setInput("");

    if (turn === "empresa") {
      if (value.length < 2) return toast.error("Me diga o site ou o nome.");
      setLoading(true);
      try {
        const isUrl = /\./.test(value) && !value.includes(" ");
        const scan = await invoke<CompanyData>(
          "scan_company",
          isUrl ? { url: value } : { text: value },
        );
        setCompany(scan);
        push({
          role: "thor",
          content: (
            <>
              <p>
                Prazer, <span className="text-foreground font-medium">{scan.empresa}</span>.
                {scan.industry ? ` Segmento: ${scan.industry}.` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">
                <span className="text-foreground">Qual a dor que mais te tira o sono?</span>{" "}
                Vendas, atendimento, marketing, financeiro — em uma frase.
              </p>
            </>
          ),
        });
        trackKpi("thor_guide_section_play", {
          source,
          section: "thor_turn_company_done",
          has_site_summary: Boolean(scan.description),
        });
        setTurn("dor");
      } catch {
        setCompany({ empresa: value, industry: "Outro" });
        push({
          role: "thor",
          content: (
            <p>
              Anotado, <span className="text-foreground font-medium">{value}</span>. E qual dor mais te tira o sono hoje?
            </p>
          ),
        });
        setTurn("dor");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (turn === "dor") {
      if (value.length < 4) return toast.error("Descreva a dor em poucas palavras.");
      setDor(value);
      trackKpi("thor_guide_section_play", {
        source,
        section: "thor_turn_pain_done",
        pain: value.slice(0, 120),
      });
      push({
        role: "thor",
        content: (
          <p>
            Entendi. Última pergunta —{" "}
            <span className="text-foreground">quem é seu cliente ideal?</span> Setor, porte, cargo do decisor.
          </p>
        ),
      });
      setTurn("icp");
      return;
    }

    if (turn === "icp") {
      if (value.length < 4) return toast.error("Me diga quem é o cliente ideal.");
      setLoading(true);
      push({
        role: "thor",
        content: (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando seu caso…
          </span>
        ),
      });
      try {
        const { leads } = await invoke<{ leads: Lead[] }>("sample_leads", {
          icp: value,
          dor,
          industry: company?.industry,
          empresa: company?.empresa,
        });
        const { ctx_id, dept_id } = await invoke<{ ctx_id: string; dept_id: string }>(
          "finalize",
          {
            session_id: sessionIdRef.current,
            empresa: company?.empresa,
            industry: company?.industry,
            dor,
            icp: value,
            leads,
          },
        );
        trackKpi("first_wow_approved", {
          source,
          section: "thor_concierge_completed",
          department_id: dept_id,
        });
        push({
          role: "thor",
          content: (
            <div className="space-y-3">
              <p>
                Pronto. Recomendo o departamento{" "}
                <span className="text-foreground font-medium capitalize">
                  {dept_id.replace(/-/g, " ")}
                </span>{" "}
                com agentes já configurados pra sua operação.
              </p>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/experience?ctx=${encodeURIComponent(ctx_id)}`)}
              >
                Ver mesa redonda <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ),
        });
        setTurn("done");
      } catch (err) {
        console.error(err);
        push({
          role: "thor",
          content: <span className="text-destructive">Não consegui finalizar agora. Tente de novo.</span>,
        });
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-[0_20px_80px_-40px_hsl(var(--primary)/0.4)] overflow-hidden flex flex-col",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-medium">Thor</span>
          <span className="text-muted-foreground">· concierge de IA</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {turn === "done" ? "análise concluída" : "em conversa"}
        </span>
      </div>

      <div
        ref={feedRef}
        className={cn("flex-1 overflow-y-auto px-5 py-6 space-y-5", minHeight, "max-h-[520px]")}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed text-left"
                  : "max-w-[92%] text-[15px] leading-relaxed text-muted-foreground text-left"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border/40 bg-background/40">
        <div className="relative rounded-2xl border border-border bg-background focus-within:border-primary/60 transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={turn === "done" ? "Conversa encerrada." : placeholder}
            rows={1}
            disabled={loading || turn === "done"}
            className="min-h-[52px] max-h-40 resize-none border-0 bg-transparent px-4 py-3.5 pr-14 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={loading || turn === "done" || !input.trim()}
            className="absolute right-2 bottom-2 h-9 w-9 rounded-xl"
            aria-label="Enviar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60 text-center">
          Enter envia · Shift+Enter quebra linha
        </p>
      </div>
    </div>
  );
}
