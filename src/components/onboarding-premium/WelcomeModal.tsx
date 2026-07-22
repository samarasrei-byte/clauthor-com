/**
 * WelcomeModal · abertura fullscreen do onboarding premium.
 * Mostra apenas na primeira vez (status === "welcome").
 */
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./OnboardingProvider";

export function WelcomeModal() {
  const { status, flow, start, skip } = useOnboarding();
  const open = status === "welcome";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/95 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
        >
          <div className="absolute inset-0 bg-grain opacity-40 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, hsl(var(--primary) / 0.08), transparent 70%)",
            }}
          />

          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-xl px-8 py-12 mx-4 rounded-3xl bg-card/80 backdrop-blur-2xl border border-border/50 shadow-2xl text-center"
          >
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-4">
              <Clock className="w-3 h-3" />
              <span>~{flow?.welcome.estimatedMinutes ?? 8} minutos</span>
            </div>

            <h2
              id="onboarding-welcome-title"
              className="text-3xl font-semibold tracking-tight text-foreground mb-3"
            >
              {flow?.welcome.title ?? "Olá, eu sou o Thor"}
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
              {flow?.welcome.message}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={start}
                className="rounded-full px-8 group"
              >
                Começar
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={skip}
                className="rounded-full text-muted-foreground"
              >
                Pular onboarding
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WelcomeModal;
