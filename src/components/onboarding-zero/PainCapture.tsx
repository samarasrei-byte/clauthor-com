import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, ArrowRight, Loader2 } from "lucide-react";
import { useWowVoice } from "@/hooks/useWowVoice";

interface Props {
  initial?: string;
  onDone: (pain: string) => void;
}

/**
 * Tela 1 · "Me conta sua dor"
 * Um campo grande + botão de microfone. Sem menu, sem footer.
 * Tipografia gigante para leigos. Voz via useWowVoice (ElevenLabs STT).
 */
export default function PainCapture({ initial = "", onDone }: Props) {
  const [text, setText] = useState(initial);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { state, errorMsg, elapsedMs, start, stop, maxMs } = useWowVoice((t) => {
    setText((prev) => (prev ? `${prev} ${t}` : t));
    setTimeout(() => inputRef.current?.focus(), 50);
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const recording = state === "recording";
  const transcribing = state === "transcribing";
  const canSubmit = text.trim().length >= 3 && !transcribing && !recording;
  const seconds = Math.min(30, Math.floor(elapsedMs / 1000));
  const remaining = Math.max(0, Math.ceil((maxMs - elapsedMs) / 1000));

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
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <span className="relative font-display text-2xl font-bold text-primary">T</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-display text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-center max-w-3xl leading-[1.05]"
      >
        Oi. Me conta o que tá te <span className="text-primary">atrapalhando</span> hoje.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-5 text-lg sm:text-xl text-muted-foreground text-center max-w-xl"
      >
        Pode falar como quiser. Se preferir, aperta no microfone e me conta com sua voz.
      </motion.p>

      <div className="w-full max-w-2xl mt-10">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex.: perdemos vendas porque ninguém atende a tempo…"
            rows={3}
            disabled={recording || transcribing}
            className="w-full resize-none rounded-2xl border border-[hsl(var(--hairline))] bg-card/50 px-5 py-4 pr-20 text-lg leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
            aria-label="Sua dor principal"
          />
          <button
            type="button"
            onClick={() => (recording ? stop() : start())}
            disabled={transcribing}
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
            onClick={() => onDone(text.trim())}
            className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Step dots */}
      <div className="mt-12 flex items-center gap-2" aria-hidden>
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="w-2 h-2 rounded-full bg-muted/40" />
        <span className="w-2 h-2 rounded-full bg-muted/40" />
      </div>
    </main>
  );
}
