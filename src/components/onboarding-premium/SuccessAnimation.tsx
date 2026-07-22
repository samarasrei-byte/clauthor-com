/**
 * SuccessAnimation · tela final com confetes + resumo.
 */
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WowConfetti } from "@/components/onboarding/WowConfetti";
import { useOnboarding } from "./OnboardingProvider";

export function SuccessAnimation() {
  const { status, flow, end } = useOnboarding();
  const navigate = useNavigate();
  const open = status === "success";

  if (!flow) return null;

  const handleGo = () => {
    end();
    navigate(flow.success.ctaRoute);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-background/95 backdrop-blur-xl p-4"
          role="dialog"
          aria-modal="true"
        >
          <WowConfetti />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-lg w-full text-center rounded-3xl bg-card/90 backdrop-blur-2xl border border-border shadow-2xl p-8 sm:p-12"
          >
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2} />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              {flow.success.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              A partir de agora você comanda, a IA executa.
            </p>

            <ul className="text-left space-y-2 mb-8 max-w-sm mx-auto">
              {flow.success.summary.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" onClick={handleGo} className="rounded-full px-8 group">
              {flow.success.ctaLabel}
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SuccessAnimation;
