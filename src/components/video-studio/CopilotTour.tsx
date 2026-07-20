import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageSquare, Image as ImageIcon, Wand, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "clauthor:video-copilot-tour-v1";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Converse com o Thor",
    body: "Explique em uma frase o que precisa. O Thor faz 3–4 perguntas objetivas · sem prompt cru.",
  },
  {
    icon: ImageIcon,
    title: "Imagem é opcional",
    body: "Se enviar uma foto/frame, o vídeo animará a partir dela. Sem imagem, geramos do zero.",
  },
  {
    icon: Wand,
    title: "Prompt otimizado",
    body: "O Thor devolve um prompt cinematográfico em inglês, pronto para Veo 3 / Replicate.",
  },
  {
    icon: Wand2,
    title: "Gerar vídeo",
    body: "Clique em Gerar. Se Veo 3 estiver sem cota, cai automaticamente para Replicate.",
  },
] as const;

export default function CopilotTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // pequena espera para não brigar com animações iniciais da página
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  };

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fechar tour"
            className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Copiloto Thor · {step + 1}/{STEPS.length}
          </div>

          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-foreground">{current.title}</h3>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{current.body}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === step
                      ? "h-1.5 w-6 rounded-full bg-primary"
                      : "h-1.5 w-1.5 rounded-full bg-muted"
                  }
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={close}>
                Pular
              </Button>
              <Button size="sm" onClick={next}>
                {step < STEPS.length - 1 ? "Próximo" : "Começar"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
