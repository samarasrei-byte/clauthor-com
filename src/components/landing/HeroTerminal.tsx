import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, lazy, Suspense } from "react";
const NeuralBackdrop = lazy(() => import("./NeuralBackdrop"));

/**
 * HeroTerminal — landing hero redesigned as a split-screen with a live agent
 * terminal on the right. Dark + Clauthor red accent. All copy in pt-BR.
 */

type LogItem =
  | { kind: "cmd"; text: string }
  | { kind: "info"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "email"; text: string }
  | { kind: "progress"; label: string; value: number };

const SCRIPT: LogItem[] = [
  { kind: "cmd", text: "Iniciando tarefa: Prospecção de leads B2B" },
  { kind: "info", text: 'Pesquisando LinkedIn por "Fundadores Tech Brasil"...' },
  { kind: "ok", text: "12 leads qualificados encontrados." },
  {
    kind: "email",
    text:
      '"Olá Roberto, notei que a TechNova está expandindo a operação em SP. Como vocês estão lidando com a triagem de leads hoje?"',
  },
  { kind: "cmd", text: "Enviando sequências automatizadas..." },
  { kind: "progress", label: "Otimização em tempo real", value: 65 },
];

const useSequentialReveal = (steps: number, delay = 700) => {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    if (visible >= steps) return;
    const t = setTimeout(() => setVisible((v) => Math.min(v + 1, steps)), delay);
    return () => clearTimeout(t);
  }, [visible, steps, delay]);
  return visible;
};

const HeroTerminal = () => {
  const visible = useSequentialReveal(SCRIPT.length, 850);

  // Só monta o backdrop pesado (SVG mesh + 3 blurs) depois do LCP.
  const [backdropReady, setBackdropReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setBackdropReady(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setBackdropReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative px-5 sm:px-6 pt-10 pb-16 sm:pt-14 sm:pb-24 overflow-hidden"
      aria-label="Hero"
    >
      {/* Base sólida para não haver flash preto/branco durante o LCP */}
      <div className="absolute inset-0 -z-10 bg-[#04040a]" aria-hidden />
      {/* Neural backdrop hidratado após idle */}
      {backdropReady && (
        <Suspense fallback={null}>
          <NeuralBackdrop intensity={0.55} />
        </Suspense>
      )}



      <div className="relative z-10 max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* LEFT — Message */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-7"
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            20 departamentos · +200 especialistas de IA
          </div>

          <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-semibold tracking-[-0.03em] leading-[1.05] text-foreground">
            Contrate um{" "}
            <span className="text-primary">departamento inteiro</span>
            {" "}de IA.
          </h1>

          <p className="text-[17px] sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            20 departamentos. Squads customizáveis. +200 especialistas de IA orquestrados.
            Monte seu squad em minutos e escale sem contratar humanos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link to="/auth" className="block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-sm font-semibold rounded-xl gap-2 shadow-[0_0_24px_-6px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.7)] transition-shadow"
              >
                Contratar um departamento
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/departamentos" className="block w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-7 text-sm font-semibold rounded-xl gap-1 bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
              >
                Ver os 20 departamentos
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Trust row */}
          <div className="pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] text-muted-foreground/70 mb-3 uppercase tracking-[0.18em] font-semibold">
              Departamentos prontos. Squads sob medida.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground/50 text-xs font-mono">
              <span>20 departamentos</span>
              <span className="opacity-40">·</span>
              <span>+200 especialistas</span>
              <span className="opacity-40">·</span>
              <span>99.9% uptime</span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT — Terminal */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-60"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          />

          <div className="relative rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary/30" />
                <div className="w-3 h-3 rounded-full bg-orange-500/30" />
                <div className="w-3 h-3 rounded-full bg-green-500/30" />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground/70">
                agente-comercial-01.clauthor.ai
              </div>
              <div className="w-12" />
            </div>

            {/* body */}
            <div className="p-6 font-mono text-[13px] space-y-3 min-h-[420px]">
              {SCRIPT.slice(0, visible).map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {item.kind === "cmd" && (
                    <div className="flex gap-3">
                      <span className="text-primary">➜</span>
                      <span className="text-slate-300">{item.text}</span>
                    </div>
                  )}
                  {item.kind === "info" && (
                    <div className="flex gap-3 text-muted-foreground border-l-2 border-white/10 ml-1.5 pl-4">
                      <span>{item.text}</span>
                    </div>
                  )}
                  {item.kind === "ok" && (
                    <div className="flex gap-3">
                      <span className="text-green-500">✓</span>
                      <span className="text-slate-300">{item.text}</span>
                    </div>
                  )}
                  {item.kind === "email" && (
                    <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.08] space-y-2">
                      <div className="flex justify-between text-[10px] text-primary font-bold uppercase tracking-wider">
                        <span>E-mail personalizado (draft)</span>
                        <span className="animate-pulse">IA analisando...</span>
                      </div>
                      <p className="text-slate-400 text-xs italic leading-relaxed font-sans">
                        {item.text}
                      </p>
                    </div>
                  )}
                  {item.kind === "progress" && (
                    <div className="mt-4 flex items-center gap-4 bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <div className="flex-1">
                        <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1.4, ease: "easeOut" }}
                          />
                        </div>
                        <div className="mt-2 text-[10px] text-primary font-bold uppercase tracking-wide">
                          {item.label}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-foreground font-sans">
                        {item.value}%
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* blinking caret when finished */}
              {visible >= SCRIPT.length && (
                <div className="flex gap-3 pt-2">
                  <span className="text-primary">➜</span>
                  <span
                    className="inline-block w-2 h-4 bg-primary/70"
                    style={{ animation: "blink-cursor 0.8s step-end infinite" }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroTerminal;
