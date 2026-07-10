import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position: "right" | "bottom";
}

// Tour reduzido a 2 tooltips leves — recap + checkout já cobrem o onboarding pago.
const TOUR_STEPS: TourStep[] = [
  { target: "nav-overview", title: "Seu painel", description: "Aqui você vê seus agentes, métricas e ações rápidas em um só lugar.", position: "right" },
  { target: "nav-chat", title: "Fale com o Thor", description: "Converse com o Thor a qualquer momento para ajustar o time ou pedir uma nova execução.", position: "right" },
];

export function DashboardTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { data: tourCompleted } = useQuery({
    queryKey: ["profile-tour", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tour_completed")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.tour_completed ?? false;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const completeTour = useCallback(async () => {
    setDismissed(true);
    if (user) {
      await supabase.from("profiles").update({ tour_completed: true } as any).eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile-tour"] });
    }
  }, [user, queryClient]);

  // Position the tooltip next to the target element
  useEffect(() => {
    if (dismissed || tourCompleted) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const updatePosition = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setPosition(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2 - 40,
        left: rect.right + 12,
      });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 300); // after sidebar animations
    window.addEventListener("resize", updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
    };
  }, [currentStep, dismissed, tourCompleted]);

  if (tourCompleted || dismissed || !position) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]" onClick={completeTour} />

      {/* Highlight the target */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] w-72 bg-background border border-primary/20 rounded-xl shadow-2xl shadow-primary/10 p-4"
          style={{ top: position.top, left: position.left }}
        >
          {/* Arrow */}
          <div className="absolute -left-2 top-10 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-primary/20" />

          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                Passo {currentStep + 1}/{TOUR_STEPS.length}
              </p>
              <h4 className="text-sm font-bold mt-0.5">{step.title}</h4>
            </div>
            <button onClick={completeTour} className="p-1 rounded-md hover:bg-muted/20 text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            <button onClick={completeTour} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Pular tour
            </button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                if (isLast) {
                  completeTour();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
            >
              {isLast ? (
                <><Check className="w-3 h-3" /> Pronto</>
              ) : (
                <>Próximo <ArrowRight className="w-3 h-3" /></>
              )}
            </Button>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/40" : "bg-muted/30"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
