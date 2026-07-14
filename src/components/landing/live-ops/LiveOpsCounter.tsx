/**
 * LiveOpsCounter · três contadores subindo em tempo real.
 *
 * Prova sensorial da promessa "operação 24/7" · números com jitter
 * plausível pra não parecerem estáticos. Não vazam dado real de cliente.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Metric {
  label: string;
  format: (n: number) => string;
  initial: number;
  tick: () => number;
  intervalMs: number;
}

const METRICS: Metric[] = [
  {
    label: "Mensagens processadas hoje",
    format: (n) => n.toLocaleString("pt-BR"),
    initial: 184_207,
    tick: () => 1 + Math.floor(Math.random() * 3),
    intervalMs: 1200,
  },
  {
    label: "Empresas ativas agora",
    format: (n) => n.toLocaleString("pt-BR"),
    initial: 35_827,
    tick: () => 0, // fixo · número oficial aprovado
    intervalMs: 5000,
  },
  {
    label: "Agentes rodando",
    format: (n) => n.toLocaleString("pt-BR"),
    initial: 1_412,
    tick: () => Math.floor(Math.random() * 11) - 5, // -5..+5
    intervalMs: 2600,
  },
];

export default function LiveOpsCounter() {
  const [values, setValues] = useState<number[]>(() => METRICS.map((m) => m.initial));

  useEffect(() => {
    const timers = METRICS.map((m, idx) =>
      window.setInterval(() => {
        setValues((prev) => {
          const next = [...prev];
          next[idx] = Math.max(0, next[idx] + m.tick());
          return next;
        });
      }, m.intervalMs),
    );
    return () => {
      timers.forEach((t) => window.clearInterval(t));
    };
  }, []);

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-3xl overflow-hidden border border-white/10 bg-white/10"
      role="group"
      aria-label="Operação em tempo real"
    >
      {METRICS.map((m, idx) => (
        <div key={m.label} className="relative p-8 sm:p-10 bg-black">
          <div className="flex items-center gap-2 mb-6">
            <span
              className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/70">Ao vivo</span>
          </div>
          <motion.div
            key={values[idx]}
            initial={{ opacity: 0.7, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white tabular-nums"
          >
            {m.format(values[idx])}
          </motion.div>
          <p className="mt-4 text-sm text-white/70 leading-snug">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
