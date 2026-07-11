/**
 * ConversationalHero — landing hero no espírito Cursor / Perplexity / Copilot.
 *
 * Estrutura:
 *  1. Título + subtítulo curtos.
 *  2. Input central grande com placeholder rotativo (5 dores).
 *  3. Chips de sugestão clicáveis.
 *  4. Ao submeter: streama a resposta do Thor via `home-thor-recommender`
 *     e destaca o departamento recomendado com CTA "Ver squad".
 *
 * Design: só tokens semânticos, dark/light-mode safe.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Loader2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import NeuralBackdrop from "@/components/landing/NeuralBackdrop";
import { getDepartmentById } from "@/data/departmentPackages";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Preciso de mais leads qualificados esse mês…",
  "Meu suporte demora horas para responder cliente…",
  "Queimo verba em ads sem saber o ROAS real…",
  "Contratos travam por semanas no jurídico…",
  "Fechamento contábil sempre atrasa 20+ dias…",
];

const SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  { label: "Vender mais",       prompt: "Preciso bater a meta de vendas do trimestre e meu pipeline está vazio." },
  { label: "Atender 24/7",       prompt: "Quero responder cliente em minutos, no WhatsApp e chat, mesmo de madrugada." },
  { label: "Otimizar ROAS",      prompt: "Gasto muito em ads e não sei o que traz retorno de verdade." },
  { label: "Revisar contratos",  prompt: "Meus contratos travam semanas no jurídico e não temos compliance." },
  { label: "Fechar DRE rápido",  prompt: "Fechamento contábil atrasa e o fluxo de caixa é no chute." },
  { label: "Contratar melhor",   prompt: "Contratação demora meses e o turnover está alto." },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// Ghost demo — Q&A que roda em loop no input até o usuário digitar
const GHOST_DEMOS: Array<{ q: string; a: string; dept: string }> = [
  {
    q: "Preciso bater a meta de vendas do trimestre.",
    a: "Recomendo o departamento Comercial — SDR + Closer + RevOps orquestrados.",
    dept: "Comercial",
  },
  {
    q: "Meus contratos travam semanas no jurídico.",
    a: "Departamento Jurídico revisa contratos em minutos, com compliance embutido.",
    dept: "Jurídico",
  },
  {
    q: "Gasto muito em ads sem saber o ROAS real.",
    a: "Departamento Marketing conecta ads, CRM e finance para ROAS em tempo real.",
    dept: "Marketing",
  },
];

const TRUSTED_LOGOS = ["Ironberg", "Zenklub", "Kovi", "Cargill", "Loft", "Nubank"];

const ConversationalHero = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [ghostIdx, setGhostIdx] = useState(0);

  // Rotate placeholder every 3s while input is empty
  useEffect(() => {
    if (input.length > 0) return;
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(t);
  }, [input]);

  // Ghost demo cycles every 5s while idle
  useEffect(() => {
    if (input.length > 0 || streaming || response) return;
    const t = setInterval(() => setGhostIdx((i) => (i + 1) % GHOST_DEMOS.length), 5000);
    return () => clearInterval(t);
  }, [input, streaming, response]);

  // Parse recommended department id from the streamed text (DEPT:<id>)
  const recommended = useMemo(() => {
    const match = response.match(/DEPT:\s*([a-z]+)/i);
    if (!match) return null;
    return getDepartmentById(match[1].toLowerCase()) ?? null;
  }, [response]);

  // Text shown in the response bubble (strip the DEPT: marker line)
  const cleanText = useMemo(
    () => response.replace(/\n?\s*DEPT:\s*[a-z]+\s*$/i, "").trim(),
    [response],
  );

  const submit = useCallback(async (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || streaming) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStreaming(true);
    setResponse("");
    setError(null);
    setInput(prompt);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/home-thor-recommender`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ prompt }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const msg = res.status === 429
          ? "Muitas requisições. Tenta em 1 minuto."
          : `Erro ao chamar o Thor (${res.status}).`;
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const line of parts) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const json = JSON.parse(t.slice(5).trim());
            if (json.type === "delta" && typeof json.text === "string") {
              setResponse((prev) => prev + json.text);
            } else if (json.type === "error") {
              throw new Error(json.message ?? "Erro no stream");
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setStreaming(false);
    }
  }, [streaming]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center px-5 py-24 sm:py-32 overflow-hidden"
      aria-label="Hero"
    >
      <NeuralBackdrop intensity={0.7} />

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12px] text-white/70 backdrop-blur-md mb-8"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Thor · seu orquestrador de IA está online
        </motion.div>

        {/* Headline — peso variável, sem gradient (nível Linear/Vercel) */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-4xl sm:text-6xl lg:text-7xl tracking-[-0.035em] leading-[1.02] text-white"
        >
          <span className="font-light text-white/70">Contrate um </span>
          <span className="font-bold text-white">departamento</span>
          <br className="hidden sm:block" />
          <span className="font-light text-white/70"> inteiro de </span>
          <span className="font-bold text-white">IA.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 text-[16px] sm:text-[18px] text-white/60 max-w-xl mx-auto leading-relaxed"
        >
          Descreva sua dor. O Thor recomenda o departamento certo em segundos.
        </motion.p>

        {/* Input */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 sm:mt-12"
        >
          <div
            className={cn(
              "group relative rounded-3xl overflow-hidden",
              "border border-white/[0.1] bg-white/[0.03] backdrop-blur-2xl",
              "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_60px_-20px_rgba(0,0,0,0.6)]",
              "transition-all duration-500",
              "focus-within:border-primary/40 focus-within:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_0_60px_-10px_hsl(var(--primary)/0.4)]",
            )}
          >
            {/* Top hairline */}
            <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {/* Placeholder rotativo (só quando vazio e sem stream) */}
            {input.length === 0 && !streaming && (
              <div className="pointer-events-none absolute left-6 sm:left-8 top-5 sm:top-6 text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="block text-[15px] sm:text-[16px] text-white/35"
                  >
                    {PLACEHOLDERS[placeholderIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              aria-label="Descreva sua dor de negócio"
              className="relative w-full resize-none bg-transparent px-6 sm:px-8 pt-5 sm:pt-6 pb-16 sm:pb-18 text-[15px] sm:text-[16px] text-white placeholder-transparent leading-relaxed focus:outline-none"
              placeholder=" "
              disabled={streaming}
            />

            {/* Bottom bar */}
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-4 sm:px-5 py-3 border-t border-white/[0.05]">
              <span className="text-[11px] text-white/40 hidden sm:inline">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-white/60 font-mono text-[10px]">Enter</kbd> para enviar
              </span>
              <button
                type="submit"
                disabled={streaming || input.trim().length === 0}
                aria-label="Enviar para o Thor"
                className={cn(
                  "ml-auto flex items-center gap-2 rounded-full h-10 px-4",
                  "bg-primary text-primary-foreground text-[13px] font-medium",
                  "shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
                  "transition-all duration-300",
                  "hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)] hover:scale-[1.02]",
                  "disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2.25} />
                )}
                <span className="hidden sm:inline">
                  {streaming ? "Thor pensando…" : "Perguntar ao Thor"}
                </span>
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => submit(s.prompt)}
                disabled={streaming}
                className={cn(
                  "text-[12px] sm:text-[13px] rounded-full px-3.5 py-1.5",
                  "border border-white/[0.08] bg-white/[0.02] text-white/70",
                  "hover:border-white/25 hover:bg-white/[0.06] hover:text-white",
                  "transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Ghost demo — Q&A cycling while idle (prova que funciona antes do click) */}
          {input.length === 0 && !streaming && !response && (
            <div className="mt-6 min-h-[52px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={ghostIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-1.5 text-left mx-auto max-w-lg"
                >
                  <div className="flex items-center gap-2 text-[11px] text-white/35 uppercase tracking-[0.15em]">
                    <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    Exemplo ao vivo
                  </div>
                  <p className="text-[13px] text-white/50 italic">
                    "{GHOST_DEMOS[ghostIdx].q}"
                  </p>
                  <p className="text-[13px] text-white/80">
                    → <span className="text-primary">{GHOST_DEMOS[ghostIdx].dept}</span>{" "}
                    <span className="text-white/60">{GHOST_DEMOS[ghostIdx].a.replace(/^[^—]+—\s*/, "")}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.form>

        {/* Trusted-by strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 sm:mt-14"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
            Times que já orquestram com CLAUTHOR
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
            {TRUSTED_LOGOS.map((name) => (
              <span
                key={name}
                className="text-[13px] sm:text-[14px] font-medium text-white/40 hover:text-white/70 transition-colors tracking-wide"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Response */}
        <AnimatePresence>
          {(cleanText || error || streaming) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="mt-8 text-left"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/40 mb-3">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Thor recomenda
                </div>

                {error ? (
                  <p className="text-[14px] text-red-300/90">{error}</p>
                ) : (
                  <p className="text-[15px] sm:text-[16px] leading-relaxed text-white/90 whitespace-pre-wrap">
                    {cleanText}
                    {streaming && (
                      <span className="inline-block w-[2px] h-[1em] align-middle bg-primary ml-1 animate-pulse" />
                    )}
                  </p>
                )}

                {recommended && !streaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t border-white/[0.06]"
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40">Departamento</p>
                      <p className="text-[17px] font-semibold text-white mt-0.5">{recommended.name}</p>
                    </div>
                    <PremiumCTAButton
                      size="md"
                      icon={<ArrowRight className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                      showArrow={false}
                      onClick={() => navigate(`/departamentos#${recommended.id}`)}
                    >
                      Ver squad
                    </PremiumCTAButton>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ConversationalHero;
