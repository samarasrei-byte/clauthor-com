import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Floating help launcher. Anchors bottom-right above other UI.
 * Opens a compact panel with quick links: How it works, FAQ, Support chat.
 */
const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-12 right-0 w-64 rounded-xl bg-background border border-border/40 shadow-2xl p-1.5"
          >
            <div className="px-3 py-2 flex items-center justify-between border-b border-border/20 mb-1">
              <span className="text-[11px] font-semibold tracking-wide text-foreground">Ajuda</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            {[
              { to: "/how-it-works", icon: BookOpen, label: "Como funciona", desc: "Tour rápido pela plataforma" },
              { to: "/community", icon: MessageCircle, label: "FAQ & Comunidade", desc: "Respostas e discussões" },
              { to: "/dashboard?section=concierge", icon: Sparkles, label: "Falar com Thor", desc: "Assistente em tempo real" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/60 transition-colors"
              >
                <item.icon className="h-3.5 w-3.5 mt-0.5 text-primary/80 shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-foreground">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{item.desc}</div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajuda"
        className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        {open ? <X className="h-4 w-4" /> : <HelpCircle className="h-5 w-5" strokeWidth={1.5} />}
      </button>
    </div>
  );
};

export default HelpButton;
