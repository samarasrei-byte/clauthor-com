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
      className="relative flex items-center justify-center px-5 pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden"
      aria-label="Hero"
    >
      <NeuralBackdrop intensity={1} />


      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
        {/* Eyebrow minimal — sem pulse vermelho, só tipografia */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[11px] uppercase tracking-[0.28em] text-white/40 mb-10"
        >
          Meet Thor · AI Orchestrator
        </motion.p>

        {/* Headline — clean Apple/Tesla, tipografia pura */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-5xl sm:text-7xl lg:text-[88px] tracking-[-0.04em] leading-[1.02] text-white font-semibold"
        >
          Contrate um
          <br />
          departamento
          <br />
          <span className="text-white/40">inteiro de IA.</span>
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
              "group relative rounded-2xl overflow-hidden",
              "border border-white/10 bg-white/[0.02]",
              "transition-colors duration-300",
              "focus-within:border-white/25",
            )}
          >

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
                  "ml-auto flex items-center gap-2 rounded-full h-9 px-4",
                  "bg-white text-black text-[13px] font-medium",
                  "transition-all duration-200",
                  "hover:bg-white/90",
                  "disabled:bg-white/10 disabled:text-white/40 disabled:pointer-events-none",
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
                  <p className="text-[13px] text-white/40">
                    <span className="text-white/30">Ex.</span> "{GHOST_DEMOS[ghostIdx].q}"
                  </p>
                  <p className="text-[13px] text-white/70">
                    → {GHOST_DEMOS[ghostIdx].dept} · {GHOST_DEMOS[ghostIdx].a.replace(/^[^—]+—\s*/, "")}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.form>

        {/* Trusted-by strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <div className="flex -space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-2 border-black/80 bg-gradient-to-br from-primary/60 to-purple-500/60"
                style={{ zIndex: 5 - i }}
              />
            ))}
          </div>
          <p className="text-[13px] sm:text-[14px] text-white/60">
            <span className="font-semibold text-white">+200 empresas</span>{" "}
            <span className="text-white/50">já orquestram departamentos com CLAUTHOR</span>
          </p>
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
