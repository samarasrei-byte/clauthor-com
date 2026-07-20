/**
 * FirstOutputFlow · o "aha moment" cronometrado (<90s).
 *
 * Fluxo:
 *   1. Usuário digita um pedido livre.
 *   2. Ao submeter, um cronômetro visível começa (ms → s).
 *   3. Backend (thor-first-output) classifica + gera o primeiro entregável
 *      numa passada. UI mostra "Roteando → Executando → Pronto".
 *   4. TTFO é gravado em `ttfo_events` e exibido em destaque.
 *
 * Design: minimalista, tokens semânticos, motion enxuto (framer-motion) só
 * onde importa (input → resultado, cronômetro).
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Send, Wand, Timer, CheckCircle2, ShieldCheck, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

interface FirstOutput {
  ttfo_ms: number;
  event_id: string | null;
  business_summary: string;
  detected_pain: string;
  need_type: "agent" | "squad" | "department";
  routed_department: string;
  recommendation_name: string;
  agent_persona: string;
  output_title: string;
  output_body: string;
  confidence: number;
  next_actions: string[];
}

type Phase = "idle" | "routing" | "executing" | "done" | "error";

const SUGGESTIONS = [
  "Prospectar 20 leads de e-commerce em SP",
  "Escrever 3 posts pro LinkedIn sobre nosso produto",
  "Analisar por que meu ticket médio caiu",
  "Criar um roteiro de cold email pra CTOs",
];

const FirstOutputFlow = () => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FirstOutput | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  // Cronômetro visível (RAF pra suavidade).
  useEffect(() => {
    if (phase !== "routing" && phase !== "executing") return;
    const tick = () => {
      if (startedAt.current == null) return;
      setElapsed(Date.now() - startedAt.current);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [phase]);

  const runFlow = async (input: string) => {
    if (!input.trim() || !user) return;
    setError(null);
    setResult(null);
    setPrompt(input);
    setPhase("routing");
    startedAt.current = Date.now();
    setElapsed(0);

    // Depois de 1s, "routing" → "executing" (UX perceptual; a chamada é única).
    const executingTimer = window.setTimeout(() => setPhase("executing"), 1000);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("thor-first-output", {
        body: { prompt: input, tenant_id: tenantId ?? null },
      });
      window.clearTimeout(executingTimer);
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as FirstOutput);
      setPhase("done");
    } catch (e: any) {
      window.clearTimeout(executingTimer);
      setError(e?.message ?? "Falha inesperada");
      setPhase("error");
      toast.error("Não consegui rodar agora. Tenta de novo.");
    }
  };

  const approveFirst = async () => {
    if (!result?.event_id) return;
    const ttfa_ms = startedAt.current ? Date.now() - startedAt.current : null;
    await supabase.from("ttfo_events").update({ ttfa_ms }).eq("id", result.event_id);
    toast.success("Aprovado. Registramos seu primeiro 'OK'.");
    navigate("/dashboard?tab=approvals");
  };

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setPrompt("");
    setElapsed(0);
    startedAt.current = null;
  };

  const seconds = (elapsed / 1000).toFixed(1);
  const isRunning = phase === "routing" || phase === "executing";

  return (
    <>
      <SEO
        title="Primeiro resultado em 90 segundos · Clauthor"
        description="Diga o que sua empresa precisa. THOR roteia, o agente executa e entrega o primeiro output real em menos de 90 segundos."
        path="/primeiro-resultado"
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="text-center mb-10 space-y-3">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <Wand className="h-3 w-3" /> Primeiro resultado em &lt; 90s
            </Badge>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Diga o que sua empresa precisa.
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              THOR analisa, roteia para o departamento certo e entrega o primeiro
              output real na tela. Você mede o tempo.
            </p>
          </div>

          {/* ── Estado: input ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <PromptCard
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={() => runFlow(prompt)}
                  disabled={!user}
                />
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => runFlow(s)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border/40 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {!user && (
                  <p className="text-center text-xs text-muted-foreground">
                    <button onClick={() => navigate("/auth")} className="underline">Entre</button> para rodar o fluxo.
                  </p>
                )}
              </motion.div>
            )}

            {/* ── Estado: rodando ───────────────────────────────── */}
            {isRunning && (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <ChronoCard seconds={seconds} phase={phase} />
                <PhaseSteps phase={phase} />
              </motion.div>
            )}

            {/* ── Estado: pronto ────────────────────────────────── */}
            {phase === "done" && result && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <ResultHeader result={result} />
                <ResultBody result={result} />
                <ResultActions result={result} onApprove={approveFirst} onReset={reset} />
              </motion.div>
            )}

            {/* ── Estado: erro ──────────────────────────────────── */}
            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3"
              >
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={reset} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Tentar de novo
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

// ─────────── Sub-components ───────────

const PromptCard = ({
  value, onChange, onSubmit, disabled,
}: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled: boolean }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-40 blur-lg group-focus-within:opacity-60 transition-opacity" />
    <div className="relative bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-2 shadow-xl">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Ex.: preciso reativar 120 leads parados no CRM..."
        rows={3}
        disabled={disabled}
        className="w-full bg-transparent border-none outline-none resize-none px-4 py-3 text-base placeholder:text-muted-foreground/50 disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <span className="text-[10px] text-muted-foreground">Enter para enviar · Shift+Enter quebra linha</span>
        <Button size="sm" onClick={onSubmit} disabled={disabled || !value.trim()} className="gap-1.5">
          Executar <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </div>
);

const ChronoCard = ({ seconds, phase }: { seconds: string; phase: Phase }) => (
  <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl p-8 text-center space-y-3">
    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
      <Timer className="h-3 w-3" />
      Cronômetro ao vivo
    </div>
    <motion.div
      key={seconds}
      initial={{ scale: 0.98 }}
      animate={{ scale: 1 }}
      className="font-display text-6xl md:text-7xl font-bold tabular-nums tracking-tight text-foreground"
    >
      {seconds}
      <span className="text-2xl text-muted-foreground ml-1">s</span>
    </motion.div>
    <p className="text-xs text-muted-foreground">
      {phase === "routing" ? "THOR está identificando qual departamento cuida disso…" : "Agente montado. Gerando o primeiro entregável…"}
    </p>
  </div>
);

const PhaseSteps = ({ phase }: { phase: Phase }) => {
  const steps = [
    { id: "routing", label: "Classificando o pedido" },
    { id: "executing", label: "Agente executando" },
    { id: "done", label: "Entregando na tela" },
  ] as const;
  const order = ["routing", "executing", "done"];
  const idx = order.indexOf(phase);

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const state: "done" | "active" | "pending" = i < idx ? "done" : i === idx ? "active" : "pending";
        return (
          <div
            key={s.id}
            className={cn(
              "rounded-lg border px-3 py-2.5 flex items-center gap-2 transition-colors",
              state === "done" && "border-primary/40 bg-primary/5 text-primary",
              state === "active" && "border-primary/60 bg-primary/10 text-primary",
              state === "pending" && "border-border/30 bg-muted/10 text-muted-foreground/60",
            )}
          >
            {state === "done" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> :
             state === "active" ? <Wand className="h-3.5 w-3.5 shrink-0 animate-pulse" /> :
             <div className="h-3.5 w-3.5 rounded-full border-2 border-current shrink-0 opacity-50" />}
            <span className="text-[11px] font-medium truncate">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const ResultHeader = ({ result }: { result: FirstOutput }) => {
  const seconds = (result.ttfo_ms / 1000).toFixed(1);
  const beat90 = result.ttfo_ms < 90_000;
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary/80 font-medium mb-1">Primeiro output</div>
          <div className="text-4xl font-display font-bold tabular-nums">{seconds}<span className="text-xl text-muted-foreground ml-1">s</span></div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {beat90 ? "Abaixo dos 90s · o padrão que buscamos" : "Acima dos 90s · vamos otimizar isso"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary bg-primary/5">
            <ShieldCheck className="h-3 w-3" /> {Math.round(result.confidence * 100)}% confiança
          </Badge>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {result.need_type === "agent" ? "Agente" : result.need_type === "squad" ? "Squad" : "Departamento"} · {result.routed_department}
          </span>
        </div>
      </div>
      <div className="pt-3 border-t border-border/20 text-[12px] text-muted-foreground space-y-1">
        <p><span className="text-foreground font-medium">Contexto:</span> {result.business_summary}</p>
        <p><span className="text-foreground font-medium">Dor detectada:</span> {result.detected_pain}</p>
        <p><span className="text-foreground font-medium">Executor:</span> {result.agent_persona} · {result.recommendation_name}</p>
      </div>
    </div>
  );
};

const ResultBody = ({ result }: { result: FirstOutput }) => (
  <div className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-3">
    <h2 className="text-xl font-semibold tracking-tight">{result.output_title}</h2>
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:text-foreground/90">
      <ReactMarkdown>{result.output_body}</ReactMarkdown>
    </div>
  </div>
);

const ResultActions = ({
  result, onApprove, onReset,
}: { result: FirstOutput; onApprove: () => void; onReset: () => void }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button onClick={onApprove} className="gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar este output
      </Button>
      <Button variant="outline" onClick={onReset} className="gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" /> Novo pedido
      </Button>
    </div>
    {result.next_actions?.length > 0 && (
      <div className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Próximos passos sugeridos</div>
        <ul className="space-y-1.5">
          {result.next_actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/90">
              <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default FirstOutputFlow;
