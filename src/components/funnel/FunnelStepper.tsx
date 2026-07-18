import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { FUNNEL_STEPS, type FunnelStep, stepIndex } from "@/lib/funnelState";

interface FunnelStepperProps {
  current: FunnelStep;
  className?: string;
}

/**
 * Barra de progresso persistente do funil "squad → pagar".
 * Sticky no topo das páginas do funil · mostra 1-Squad · 2-Empresa · 3-Conta · 4-Pagar.
 */
export default function FunnelStepper({ current, className }: FunnelStepperProps) {
  const activeIdx = stepIndex(current);
  const pct = Math.round(((activeIdx + 1) / FUNNEL_STEPS.length) * 100);

  return (
    <div
      className={
        "sticky top-0 z-40 w-full border-b border-white/[0.06] bg-background/85 backdrop-blur-xl " +
        (className ?? "")
      }
      aria-label="Progresso da contratação"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3">
        {/* Steps */}
        <ol className="flex items-center justify-between gap-2 mb-2" role="list">
          {FUNNEL_STEPS.map((s, i) => {
            const state: "done" | "current" | "todo" =
              i < activeIdx ? "done" : i === activeIdx ? "current" : "todo";
            return (
              <li key={s.id} className="flex items-center gap-2 min-w-0">
                <div
                  aria-current={state === "current" ? "step" : undefined}
                  className={
                    "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium transition-colors " +
                    (state === "done"
                      ? "bg-primary text-primary-foreground"
                      : state === "current"
                      ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                      : "bg-white/[0.04] text-white/40")
                  }
                >
                  {state === "done" ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className={
                    "hidden sm:inline text-xs truncate " +
                    (state === "current"
                      ? "text-foreground font-medium"
                      : state === "done"
                      ? "text-white/60"
                      : "text-white/35")
                  }
                >
                  {s.short}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Barra contínua */}
        <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
