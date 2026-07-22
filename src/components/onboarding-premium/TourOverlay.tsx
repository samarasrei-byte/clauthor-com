/**
 * TourOverlay · escurece a tela e destaca o elemento alvo (spotlight).
 * Usa clip-path SVG pra recortar um retângulo arredondado em torno do target.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "./OnboardingProvider";
import { ThorTooltip } from "./ThorTooltip";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function TourOverlay() {
  const { status, currentStep, next } = useOnboarding();
  const [rect, setRect] = useState<Rect | null>(null);

  const targetSelector = currentStep?.target;
  const enabled = status === "running" && !!targetSelector;

  useEffect(() => {
    if (!enabled || !targetSelector) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(targetSelector);
      if (!el) {
        setRect(null);
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRect({ x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [enabled, targetSelector]);

  if (!enabled || !rect || !currentStep) return null;

  // Posição do tooltip
  const tooltipSide = currentStep.tooltipSide ?? "bottom";
  const tooltipX =
    tooltipSide === "left"
      ? Math.max(16, rect.x - 320)
      : tooltipSide === "right"
      ? rect.x + rect.w + 12
      : Math.max(16, Math.min(window.innerWidth - 340, rect.x));
  const tooltipY =
    tooltipSide === "top"
      ? Math.max(16, rect.y - 140)
      : tooltipSide === "bottom"
      ? rect.y + rect.h + 12
      : rect.y;

  return (
    <AnimatePresence>
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[85] pointer-events-none"
        aria-hidden="true"
      >
        {/* Máscara escura com recorte no alvo · usa SVG pra suporte cross-browser */}
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx={12}
                ry={12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Halo animado ao redor do alvo */}
        <motion.div
          className="absolute rounded-xl border-2 border-primary/60"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            boxShadow: "0 0 40px hsl(var(--primary) / 0.4)",
          }}
        />

        {/* Tooltip */}
        <div className="pointer-events-auto">
          <ThorTooltip
            title={currentStep.title}
            body={currentStep.tooltip ?? currentStep.description}
            side={tooltipSide}
            x={tooltipX}
            y={tooltipY}
            onNext={next}
            ctaLabel={currentStep.ctaLabel ?? "Próximo"}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TourOverlay;
