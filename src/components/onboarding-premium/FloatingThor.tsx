/**
 * FloatingThor · botão flutuante bottom-right com menu contextual.
 * Aparece quando o onboarding NÃO está em welcome/test/success (ou seja, running ou idle pós-conclusão).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  BookOpen,
  ListChecks,
  MessageCircle,
  LifeBuoy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboarding } from "./OnboardingProvider";

interface MenuItem {
  id: string;
  label: string;
  icon: typeof Sparkles;
  onClick: () => void;
  disabled?: boolean;
}

export function FloatingThor() {
  const { status, start, goToTest } = useOnboarding();
  const [open, setOpen] = useState(false);

  // Não mostrar durante welcome/success · outros surfaces já ocupam a tela.
  if (status === "welcome" || status === "success") return null;

  const items: MenuItem[] = [
    {
      id: "continue",
      label: status === "running" ? "Continuar onboarding" : "Reabrir onboarding",
      icon: Play,
      onClick: () => {
        start();
        setOpen(false);
      },
    },
    {
      id: "learn",
      label: "Aprender esta tela",
      icon: BookOpen,
      onClick: () => {
        // Dispara HelpBubble da rota atual (se montado)
        window.dispatchEvent(new CustomEvent("clauthor:help-bubble:open"));
        setOpen(false);
      },
    },
    {
      id: "next",
      label: "Ver próximos passos",
      icon: ListChecks,
      onClick: () => {
        if (status === "test") goToTest();
        else start();
        setOpen(false);
      },
    },
    {
      id: "talk",
      label: "Falar com Thor",
      icon: MessageCircle,
      onClick: () => {
        window.dispatchEvent(new CustomEvent("cmdk:open"));
        setOpen(false);
      },
    },
    {
      id: "help",
      label: "Central de ajuda",
      icon: LifeBuoy,
      onClick: () => {
        window.open("https://docs.lovable.dev", "_blank", "noopener");
        setOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-[60] pointer-events-auto">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden"
            role="menu"
          >
            <div className="p-2">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    onClick={it.onClick}
                    disabled={it.disabled}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                      "hover:bg-muted/60",
                      it.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
                    )}
                    role="menuitem"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{it.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Assistente Thor"
        className={cn(
          "relative w-14 h-14 rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-primary via-primary to-primary/80",
          "text-primary-foreground shadow-lg hover:shadow-xl",
          "transition-all hover:scale-105 active:scale-95",
        )}
      >
        <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl animate-pulse pointer-events-none" />
        {open ? (
          <X className="w-5 h-5 relative" />
        ) : (
          <Sparkles className="w-5 h-5 relative" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

export default FloatingThor;
