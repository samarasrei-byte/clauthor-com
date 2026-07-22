/**
 * ThorDrawer · painel lateral fixo com progresso + checklist + próximos passos.
 * Permanece aberto durante todo o onboarding (status === "running" | "test").
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "./OnboardingProvider";
import { MissionChecklist } from "./MissionChecklist";
import { cn } from "@/lib/utils";

export function ThorDrawer() {
  const { flow, status, currentIndex, completed, progress, next, back, end } = useOnboarding();
  const open = status === "running" || status === "test";
  if (!flow) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed top-0 right-0 h-dvh z-[75] w-full sm:w-[400px]",
            "bg-card/95 backdrop-blur-xl border-l border-border/60 shadow-2xl",
            "flex flex-col",
          )}
          role="complementary"
          aria-label="Assistente Thor"
        >
          {/* Header */}
          <header className="flex items-start justify-between p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Thor</div>
                <div className="text-xs text-muted-foreground">Especialista de implantação</div>
              </div>
            </div>
            <button
              onClick={end}
              aria-label="Encerrar onboarding"
              className="p-1.5 rounded-full text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Progress */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progresso
              </span>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Checklist */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <MissionChecklist
              missions={flow.missions}
              completed={completed}
              currentIndex={currentIndex}
            />
          </div>

          {/* Actions */}
          {status === "running" && (
            <footer className="border-t border-border/40 p-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                disabled={currentIndex === 0}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={next}
                className="flex-1 rounded-full group"
              >
                {flow.missions[currentIndex]?.ctaLabel ?? "Próximo"}
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </footer>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default ThorDrawer;
