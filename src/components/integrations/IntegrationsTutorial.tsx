import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MousePointerClick, KeyRound, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "clauthor_integrations_tutorial_dismissed";

const STEPS = [
  {
    icon: Search,
    title: "1. Encontre o conector",
    description: "Use a busca ou os filtros por categoria para localizar a plataforma que você quer conectar (WhatsApp, Gmail, Slack, LinkedIn...).",
  },
  {
    icon: MousePointerClick,
    title: "2. Abra o card",
    description: "Clique no conector para ver o guia de configuração e o que ele libera para seus agentes.",
  },
  {
    icon: KeyRound,
    title: "3. Preencha as credenciais",
    description: "Cole a API key, faça OAuth ou siga o passo-a-passo. Suas credenciais ficam cifradas e isoladas por tenant.",
  },
  {
    icon: CheckCircle2,
    title: "4. Pronto — agentes ativos",
    description: "Assim que o selo verde aparecer, seus agentes já podem usar a integração automaticamente.",
  },
];

const IntegrationsTutorial = () => {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Session-scoped dismissal so tutorial reappears next time user opens Integrações
    if (sessionStorage.getItem(STORAGE_KEY)) setVisible(false);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) {
    return (
      <button
        onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setStep(0); setVisible(true); }}
        className="text-xs text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1.5"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Rever tutorial
      </button>
    );
  }

  const Current = STEPS[step];
  const Icon = Current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
      >
        <button
          onClick={dismiss}
          aria-label="Fechar tutorial"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold">
                Tutorial · {step + 1}/{STEPS.length}
              </span>
            </div>
            <h3 className="font-display font-semibold text-sm mb-1">{Current.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{Current.description}</p>

            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-1 flex-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= step ? "bg-primary" : "bg-primary/15"
                    }`}
                  />
                ))}
              </div>
              {step > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep(s => s - 1)}>
                  Voltar
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => (isLast ? dismiss() : setStep(s => s + 1))}
              >
                {isLast ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationsTutorial;
