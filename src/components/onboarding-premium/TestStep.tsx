/**
 * TestStep · tela final de teste. Mostra amostra + resposta gerada + 3 CTAs.
 */
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./OnboardingProvider";

export function TestStep() {
  const { status, flow, finish } = useOnboarding();
  const open = status === "test";
  const test = flow?.testStep;

  return (
    <AnimatePresence>
      {open && test && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[78] flex items-center justify-center bg-background/85 backdrop-blur-lg p-4 sm:pr-[420px]"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-lg w-full rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8"
          >
            <div className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
              {test.title}
            </div>

            {/* Sample */}
            <div className="rounded-2xl bg-muted/40 border border-border/40 p-4 mb-4">
              <div className="text-sm font-semibold text-foreground mb-1">
                {test.sampleTitle}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {test.sampleBody}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              Veja como sua IA responderia:
            </div>

            {/* Generated response */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 mb-5">
              <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {test.generatedResponse}
              </div>
            </div>

            <div className="text-sm font-medium text-foreground mb-3">Gostou?</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={finish} className="rounded-full flex-1">
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                Sim, aprovar
              </Button>
              <Button variant="outline" className="rounded-full" disabled title="Em breve">
                <Pencil className="w-4 h-4 mr-1.5" />
                Editar
              </Button>
              <Button variant="ghost" className="rounded-full" disabled title="Em breve">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Gerar outra
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TestStep;
