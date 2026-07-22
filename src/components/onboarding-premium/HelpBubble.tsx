/**
 * HelpBubble · balão discreto que aparece na 1ª visita de uma rota.
 * Marca localStorage: clauthor:visited:<key> após primeira interação.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "clauthor:visited:";

interface HelpBubbleProps {
  routeKey: string;
  message: string;
  onAccept?: () => void;
}

export function useFirstVisit(routeKey: string): boolean {
  const [first, setFirst] = useState(false);
  useEffect(() => {
    try {
      const key = STORAGE_PREFIX + routeKey;
      if (!localStorage.getItem(key)) {
        setFirst(true);
        localStorage.setItem(key, new Date().toISOString());
      }
    } catch {
      /* ignore */
    }
  }, [routeKey]);
  return first;
}

export function HelpBubble({ routeKey, message, onAccept }: HelpBubbleProps) {
  const first = useFirstVisit(routeKey);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (first && !dismissed) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [first, dismissed]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, x: 10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 10, x: 10 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "fixed bottom-24 right-5 z-[55] max-w-xs",
            "rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-2xl p-4",
          )}
          role="dialog"
        >
          <button
            onClick={() => {
              setOpen(false);
              setDismissed(true);
            }}
            aria-label="Fechar"
            className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-muted/60"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-primary mb-1">Thor</div>
              <div className="text-sm text-foreground leading-relaxed mb-3">{message}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAccept?.();
                    setOpen(false);
                    setDismissed(true);
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90"
                >
                  Sim, explique
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setDismissed(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default HelpBubble;
