import { useState, useEffect, useCallback } from "react";
import { HelpCircle, X, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HelpTooltipProps {
  text: string;
  /** Unique key to track if user has seen this tooltip (used with localStorage) */
  id?: string;
  /** Position of the popup relative to the icon */
  position?: "top" | "bottom" | "left" | "right";
  /** Extra CSS classes on the wrapper */
  className?: string;
  /** Size of the ? icon (default 14) */
  size?: number;
  /** Auto-show on first visit (default true when id is provided) */
  autoShow?: boolean;
  /** Delay before auto-showing in ms (default 1200) */
  autoShowDelay?: number;
}

const STORAGE_KEY = "clauthor_seen_tooltips";

const getSeenTooltips = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const markTooltipSeen = (id: string) => {
  const seen = getSeenTooltips();
  seen.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
};

const HelpTooltip = ({
  text,
  id,
  position = "top",
  className = "",
  size = 14,
  autoShow = true,
  autoShowDelay = 1500,
}: HelpTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [hasAutoShown, setHasAutoShown] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Auto-show logic for first-time visitors
  useEffect(() => {
    if (!id || !autoShow || hasAutoShown) return;

    const seen = getSeenTooltips();
    if (seen.has(id)) return;

    setIsFirstVisit(true);
    const timer = setTimeout(() => {
      setOpen(true);
      setHasAutoShown(true);

      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        setOpen(false);
        markTooltipSeen(id);
      }, 5000);

      return () => clearTimeout(dismissTimer);
    }, autoShowDelay);

    return () => clearTimeout(timer);
  }, [id, autoShow, autoShowDelay, hasAutoShown]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    if (id) markTooltipSeen(id);
  }, [id]);

  const handleToggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<string, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-border",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-border",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-border",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-border",
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => { if (!isFirstVisit || hasAutoShown) setOpen(false); }}
        className={`inline-flex items-center justify-center rounded-full transition-all duration-300 p-0.5 ${
          isFirstVisit && !hasAutoShown
            ? "text-primary animate-pulse ring-2 ring-primary/20 ring-offset-1 ring-offset-background"
            : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
        }`}
        aria-label="Ajuda"
      >
        {isFirstVisit && !hasAutoShown ? (
          <Sparkles style={{ width: size, height: size }} className="text-primary" />
        ) : (
          <HelpCircle style={{ width: size, height: size }} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: position === "bottom" ? -4 : position === "top" ? 4 : 0, x: position === "right" ? -4 : position === "left" ? 4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`absolute z-50 w-64 max-w-xs ${positionClasses[position]}`}
          >
            {/* Glassmorphism card */}
            <div className="relative rounded-xl bg-popover/95 backdrop-blur-xl border border-border/60 shadow-2xl shadow-primary/5 overflow-hidden">
              {/* Gradient accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              
              <div className="px-3.5 py-3 pr-8">
                {/* First visit badge */}
                {isFirstVisit && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Dica</span>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-popover-foreground/90">{text}</p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default HelpTooltip;
