import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ArrowRight, Loader2, Check, X } from "lucide-react";
import { useWowVoice } from "@/hooks/useWowVoice";
import { supabase } from "@/integrations/supabase/client";

export type PainFocus = "comercial" | "atendimento" | "marketing" | "financeiro";

interface Props {
  initial?: string;
  onDone: (pain: string, focus?: PainFocus) => void;
}

interface Analysis {
  paraphrase: string;
  focus: PainFocus;
  confidence: number;
}

const FOCUS_LABEL: Record<PainFocus, string> = {
  comercial: "vender e prospectar",
  atendimento: "atender seus clientes",
  marketing: "criar conteúdo e campanhas",
  financeiro: "organizar seu financeiro",
};

/**
 * Tela 1 · Pain Capture com Thor ao vivo (Onboarding Zero salto #1).
 *
 * Fluxo:
 *   1. Usuário digita/fala a dor.
 *   2. Clica "Continuar" → chama pain-analyzer (Gemini Flash Lite).
 *   3. Thor devolve paráfrase + foco inferido, tipada com efeito máquina de escrever.
 *   4. Usuário confirma com "É isso" (pula QuickPicks) OU "Não é bem isso" (fluxo manual).
 */
export default function PainCapture({ initial = "", onDone }: Props) {
  const [text, setText] = useState(initial);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { state, errorMsg, elapsedMs, start, stop, maxMs } = useWowVoice((t) => {
    setText((prev) => (prev ? `${prev} ${t}` : t));
    setTimeout(() => inputRef.current?.focus(), 50);
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Typewriter effect para paráfrase — Thor "pensando".
  useEffect(() => {
    if (!analysis) { setTyped(""); return; }
    let i = 0;
    setTyped("");
    const id = setInterval(() => {
      i += 1;
      setTyped(analysis.paraphrase.slice(0, i));
      if (i >= analysis.paraphrase.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [analysis]);

  const recording = state === "recording";
  const transcribing = state === "transcribing";
  const canSubmit = text.trim().length >= 3 && !transcribing && !recording && !analyzing;
  const seconds = Math.min(30, Math.floor(elapsedMs / 1000));
  const remaining = Math.max(0, Math.ceil((maxMs - elapsedMs) / 1000));

  const analyze = async () => {
    if (!canSubmit) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("pain-analyzer", {
        body: { pain: text.trim() },
      });
      if (error || !data || typeof data.paraphrase !== "string") {
        // Fallback duro: manda direto sem foco inferido.
        onDone(text.trim());
        return;
      }
      setAnalysis({
        paraphrase: data.paraphrase,
        focus: data.focus as PainFocus,
        confidence: Number(data.confidence ?? 0),
      });
    } catch {
      onDone(text.trim());
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmMatch = () => {
    if (!analysis) return;
    // Se a confiança for boa, pula QuickPicks passando o foco inferido.
    const focus = analysis.confidence >= 60 ? analysis.focus : undefined;
    onDone(text.trim(), focus);
  };

  const rejectMatch = () => {
    // Segue o fluxo antigo — sem foco inferido, força QuickPicks manual.
    onDone(text.trim());
  };

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 py-10">
      {/* Thor orb */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
        aria-hidden
      >
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-primary/10 ${analyzing ? "animate-ping" : "animate-pulse"}`} />
          <span className="relative font-display text-2xl font-bold text-primary">T</span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {!analysis ? (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-center max-w-3xl leading-[1.05]">
              Oi. Me conta o que tá te <span className="text-primary">atrapalhando</span> hoje.
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-muted-foreground text-center max-w-xl">
              Pode falar como quiser. Se preferir, aperta no microfone e me conta com sua voz.
            </p>

            <div className="w-full max-w-2xl mt-10">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
                      e.preventDefault();
                      analyze();
                    }
                  }}
                  placeholder="Ex.: perdemos vendas porque ninguém atende a tempo…"
                  rows={3}
                  disabled={recording || transcribing || analyzing}
                  className="w-full resize-none rounded-2xl border border-[hsl(var(--hairline))] bg-card/50 px-5 py-4 pr-20 text-lg leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                  aria-label="Sua dor principal"
                />
                <button
                  type="button"
                  onClick={() => (recording ? stop() : start())}
                  disabled={transcribing || analyzing}
                  aria-label={recording ? "Parar gravação" : "Gravar com voz"}
                  className={
                    "absolute bottom-3 right-3 h-12 w-12 rounded-full flex items-center justify-center transition-all " +
                    (recording
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-foreground text-background hover:opacity-90")
                  }
                >
                  {transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> : recording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              {recording && (
                <p className="mt-3 text-sm text-muted-foreground text-center" aria-live="polite">
                  Gravando · {seconds}s · restam {remaining}s
                </p>
              )}
              {transcribing && (
                <p className="mt-3 text-sm text-muted-foreground text-center" aria-live="polite">
                  Transcrevendo sua fala…
                </p>
              )}
              {errorMsg && (
                <p className="mt-3 text-sm text-destructive text-center" role="alert">{errorMsg}</p>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={analyze}
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Pensando…
                    </>
                  ) : (
                    <>
                      Continuar <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Sem cadastro pra continuar · leva 30 segundos
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="paraphrase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full max-w-3xl"
          >
            <p className="text-xs uppercase tracking-widest text-primary/70 mb-4">Thor está entendendo</p>

            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-center leading-[1.15] mb-3 min-h-[3em]">
              &ldquo;{typed}
              <span className="inline-block w-[3px] h-[0.9em] align-middle bg-primary ml-1 animate-pulse" aria-hidden />
              &rdquo;
            </h1>

            {typed.length >= analysis.paraphrase.length && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-muted-foreground text-center max-w-xl mb-8"
              >
                Se estiver certo, posso te mostrar quem cuida disso — o time de{" "}
                <span className="text-foreground font-medium">{FOCUS_LABEL[analysis.focus]}</span>.
              </motion.p>
            )}

            {typed.length >= analysis.paraphrase.length && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <button
                  type="button"
                  onClick={confirmMatch}
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all"
                >
                  <Check className="w-5 h-5" /> É isso
                </button>
                <button
                  type="button"
                  onClick={rejectMatch}
                  className="inline-flex items-center gap-2 h-14 px-6 rounded-full border border-[hsl(var(--hairline))] bg-card/40 text-foreground text-base font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <X className="w-4 h-4" /> Não é bem isso
                </button>
              </motion.div>
            )}

            {typed.length >= analysis.paraphrase.length && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                type="button"
                onClick={() => { setAnalysis(null); setTyped(""); }}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Reescrever minha resposta
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step dots */}
      <div className="mt-12 flex items-center gap-2" aria-hidden>
        <span className="w-6 h-2 rounded-full bg-primary" />
        <span className="w-2 h-2 rounded-full bg-muted/40" />
        <span className="w-2 h-2 rounded-full bg-muted/40" />
      </div>
    </main>
  );
}
