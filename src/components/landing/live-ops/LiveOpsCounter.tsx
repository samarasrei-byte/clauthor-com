/**
 * LiveOpsCounter · três indicadores auditáveis da plataforma.
 *
 * Redesenho v2 · hierarquia forte:
 *   1. Eyebrow index (01/02/03) + status "Auditável"
 *   2. Número gigante com gradient shine + tabular-nums
 *   3. Label bold em white puro
 *   4. Descrição secundária em muted
 *   5. Divider vertical hairline entre cards + hover elevation
 */
import { motion } from "framer-motion";
import { Building2, Bot, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}

const METRICS: Metric[] = [
  {
    icon: Building2,
    value: "20",
    label: "Departamentos disponíveis",
    sub: "Comercial, Atendimento, Marketing, Financeiro, RH…",
  },
  {
    icon: Bot,
    value: "+200",
    label: "Especialistas de IA prontos",
    sub: "Cada um com playbook, memória e integrações próprias",
  },
  {
    icon: Sparkles,
    value: "Beta",
    label: "Vagas limitadas · 2026",
    sub: "Early access com acompanhamento 1:1 do time Clauthor",
  },
];

export default function LiveOpsCounter() {
  return (
    <div
      className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden"
      role="group"
      aria-label="Escopo verificável da plataforma"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18),transparent_70%)] blur-2xl"
      />

      <div className="relative grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        {METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative p-8 sm:p-10 transition-colors hover:bg-white/[0.02]"
            >
              {/* Top row · index + status */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/65 tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(METRICS.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_hsl(var(--primary))]"
                    aria-hidden
                  />
                  <span className="text-[10px] uppercase tracking-[0.24em] text-white/70">
                    Auditável
                  </span>
                </div>
              </div>

              {/* Big number */}
              <div className="flex items-end gap-3 mb-6">
                <Icon
                  className="h-5 w-5 text-primary/80 mb-3 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span
                  className="font-display font-semibold tracking-[-0.045em] tabular-nums leading-none bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent"
                  style={{ fontSize: "clamp(3.5rem, 7vw, 5.5rem)" }}
                >
                  {m.value}
                </span>
              </div>

              {/* Label + sub */}
              <p className="text-[15px] font-medium text-white leading-snug mb-1.5">
                {m.label}
              </p>
              <p className="text-[13px] text-white/70 leading-relaxed">{m.sub}</p>

              {/* Hover hairline accent */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
