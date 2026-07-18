import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import thorAvatar from "@/assets/thor-avatar.png";

interface ThorStuckHintProps {
  /** Chave única por passo · usada para não repetir o mesmo hint. */
  stepKey: string;
  /** Texto contextual que o Thor mostra quando o usuário trava. */
  message: string;
  /** Segundos de inatividade antes de aparecer. Default 25s. */
  delayMs?: number;
}

/**
 * Bolha discreta no canto inferior direito que aparece quando o usuário
 * fica parado numa etapa do funil. "Modo tooltip" · não é chat.
 */
export default function ThorStuckHint({ stepKey, message, delayMs = 25000 }: ThorStuckHintProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Não repete no mesmo passo/sessão se já foi fechado.
    const seen = sessionStorage.getItem(`thor-hint:${stepKey}`);
    if (seen) return;

    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(true), delayMs);
    };
    const cancel = () => window.clearTimeout(timer);

    arm();
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));

    return () => {
      cancel();
      events.forEach((ev) => window.removeEventListener(ev, arm));
    };
  }, [stepKey, delayMs]);

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(`thor-hint:${stepKey}`, "1"); } catch { /* ignore */ }
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-4 flex gap-3"
        >
          <img
            src={thorAvatar}
            alt=""
            aria-hidden
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-primary/80 font-medium mb-0.5">Thor</p>
            <p className="text-sm text-foreground/90 leading-snug">{message}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar dica"
            className="text-white/40 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
