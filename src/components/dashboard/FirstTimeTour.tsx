import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Rocket, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "clauthor:tour:v1";

const steps = [
  {
    icon: Compass,
    title: "Bem-vindo à Clauthor",
    body: "Aqui você comanda departamentos inteiros de IA. Cada departamento resolve uma dor específica do seu negócio — sem contratar humanos.",
  },
  {
    icon: Sparkles,
    title: "Comece pelo diagnóstico",
    body: "Use o Hero no topo para descrever sua dor. A plataforma recomenda o departamento certo em 60 segundos.",
  },
  {
    icon: Rocket,
    title: "Contrate em 1 clique",
    body: "Escolha um departamento em Biblioteca ou Departamentos, ative com um clique e ele já começa a produzir. Você aprova, ele executa.",
  },
];

const FirstTimeTour = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch { return; }

    // Wait until no other dialog/modal is on screen — don't bombard the user.
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      const hasOtherDialog = !!document.querySelector(
        '[role="dialog"]:not([data-first-time-tour]), [data-radix-portal] [role="dialog"]'
      );
      if (!hasOtherDialog) {
        setOpen(true);
      } else {
        setTimeout(check, 1200);
      }
    };
    const t = setTimeout(check, 1500);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* ignore */ }
    setOpen(false);
  };

  const next = () => {
    if (step >= steps.length - 1) return dismiss();
    setStep(s => s + 1);
  };

  const Current = steps[step];
  const Icon = Current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              aria-label="Fechar tour"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Passo {step + 1} de {steps.length}
              </div>
            </div>

            <h3 className="text-xl font-display font-bold mb-2">{Current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {Current.body}
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step < steps.length - 1 && (
                  <Button variant="ghost" size="sm" onClick={dismiss}>
                    Pular
                  </Button>
                )}
                <Button size="sm" onClick={next} className="gap-1.5">
                  {step === steps.length - 1 ? "Começar" : "Próximo"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstTimeTour;
