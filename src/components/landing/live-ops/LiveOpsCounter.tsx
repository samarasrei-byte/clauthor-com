/**
 * LiveOpsCounter · três indicadores auditáveis da plataforma.
 *
 * Números fixos e verificáveis (workforce catalog + status de beta).
 * Nada de contador inflado — integridade > vaidade.
 */
import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string;
  sub: string;
}

const METRICS: Metric[] = [
  {
    value: "20",
    label: "Departamentos disponíveis",
    sub: "Comercial, Atendimento, Marketing, Financeiro, RH…",
  },
  {
    value: "+200",
    label: "Especialistas de IA prontos",
    sub: "Cada um com playbook, memória e integrações próprias",
  },
  {
    value: "Beta fechado",
    label: "Vagas limitadas · 2026",
    sub: "Early access com acompanhamento 1:1 do time Clauthor",
  },
];

export default function LiveOpsCounter() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-3xl overflow-hidden border border-white/10 bg-white/10"
      role="group"
      aria-label="Escopo verificável da plataforma"
    >
      {METRICS.map((m) => (
        <div key={m.label} className="relative p-8 sm:p-10 bg-black">
          <div className="flex items-center gap-2 mb-6">
            <span
              className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/70">Auditável</span>
          </div>
          <motion.div
            initial={{ opacity: 0.7, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white tabular-nums"
          >
            {m.value}
          </motion.div>
          <p className="mt-4 text-sm text-white/80 leading-snug font-medium">{m.label}</p>
          <p className="mt-1 text-xs text-white/50 leading-snug">{m.sub}</p>
        </div>
      ))}
    </div>
  );
}
