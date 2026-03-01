import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface HelpTooltipProps {
  text: string;
  /** Position of the popup relative to the icon */
  position?: "top" | "bottom" | "left" | "right";
  /** Extra CSS classes on the wrapper */
  className?: string;
  /** Size of the ? icon (default 14) */
  size?: number;
}

const HelpTooltip = ({ text, position = "top", className = "", size = 14 }: HelpTooltipProps) => {
  const [open, setOpen] = useState(false);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors p-0.5"
        aria-label="Ajuda"
      >
        <HelpCircle style={{ width: size, height: size }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-56 max-w-xs px-3 py-2.5 rounded-xl bg-popover border border-border shadow-xl text-xs leading-relaxed text-popover-foreground ${positionClasses[position]}`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="absolute top-1.5 right-1.5 text-muted-foreground/50 hover:text-muted-foreground md:hidden"
            >
              <X className="h-3 w-3" />
            </button>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default HelpTooltip;
