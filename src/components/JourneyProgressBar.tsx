import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface JourneyStep {
  id: string;
  label: string;
  threshold: number; // scroll % to activate
}

const STEPS: JourneyStep[] = [
  { id: "conheceu", label: "Conheceu", threshold: 5 },
  { id: "demo", label: "Viu a demo", threshold: 25 },
  { id: "roi", label: "Calculou ROI", threshold: 55 },
  { id: "plano", label: "Escolheu plano", threshold: 85 },
];

const JourneyProgressBar = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    let step = 0;
    for (let i = STEPS.length - 1; i >= 0; i--) {
      if (pct >= STEPS[i].threshold) {
        step = i + 1;
        break;
      }
    }
    setCurrentStep(step);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Hide for logged-in users or dismissed
  if (user || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ delay: 2, duration: 0.4 }}
        className="fixed top-16 left-0 right-0 z-30 pointer-events-none"
      >
        <div className="max-w-2xl mx-auto px-4 py-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/50 bg-card/80 backdrop-blur-md shadow-sm">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 mr-1 shrink-0">
              Sua jornada:
            </span>
            {STEPS.map((step, i) => {
              const completed = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.id} className="flex items-center gap-1">
                  <span className={`text-[10px] font-mono transition-colors duration-300 ${
                    completed ? "text-accent-emerald" : active ? "text-primary" : "text-muted-foreground/40"
                  }`}>
                    {completed ? "✅" : "🔲"} {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="text-muted-foreground/20 text-[8px]">→</span>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => setDismissed(true)}
              className="ml-auto text-muted-foreground/30 hover:text-muted-foreground text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JourneyProgressBar;
