import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import {
  FUNNEL_STEPS,
  clearFunnel,
  nextStepRoute,
  readFunnel,
  stepIndex,
  type FunnelState,
} from "@/lib/funnelState";

/**
 * Banner discreto no topo da home que aparece SE o usuário já começou
 * a montar um time e saiu · "Você parou em X · Continuar".
 */
export default function FunnelResumeBanner() {
  const [funnel, setFunnel] = useState<FunnelState | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setFunnel(readFunnel());
  }, []);

  if (!funnel || hidden || funnel.step === "done") return null;

  const idx = stepIndex(funnel.step);
  const label = FUNNEL_STEPS[idx]?.label ?? "Contratação";
  const route = nextStepRoute(funnel.step, funnel.departmentId);
  const deptLabel = funnel.departmentLabel;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl"
      >
        <div className="rounded-full border border-primary/30 bg-background/95 backdrop-blur-xl shadow-lg shadow-primary/10 pl-4 pr-2 py-2 flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <p className="text-xs sm:text-sm text-foreground flex-1 min-w-0 truncate">
            <span className="text-muted-foreground">Você parou em</span>{" "}
            <span className="font-medium">{label}</span>
            {deptLabel && (
              <span className="hidden sm:inline text-muted-foreground"> · {deptLabel}</span>
            )}
          </p>
          <Link
            to={route}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            Continuar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Descartar"
            onClick={() => { clearFunnel(); setHidden(true); }}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
