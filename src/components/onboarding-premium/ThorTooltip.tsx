/**
 * ThorTooltip · caixa flutuante do tour, ancorada num alvo.
 * O TourOverlay já cuida do spotlight; este componente é só o balão.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThorTooltipProps {
  title?: string;
  body: string;
  side?: "top" | "bottom" | "left" | "right";
  x: number;
  y: number;
  onNext?: () => void;
  ctaLabel?: string;
}

export function ThorTooltip({
  title,
  body,
  side = "bottom",
  x,
  y,
  onNext,
  ctaLabel = "Próximo",
}: ThorTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: side === "bottom" ? -8 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed z-[90] max-w-xs rounded-2xl bg-card border border-primary/30 shadow-2xl p-4",
        "backdrop-blur-xl",
      )}
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-primary/20 animate-pulse" />
      {title && <div className="text-xs font-semibold text-primary mb-1">{title}</div>}
      <div className="text-sm text-foreground leading-relaxed">{body}</div>
      {onNext && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onNext}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ThorTooltip;
