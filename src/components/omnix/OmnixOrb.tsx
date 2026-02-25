import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
}

const OmnixOrb = ({ state, name, className }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  return (
    <div className={cn("relative", className)}>
      {/* Outer glow rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden",
          "bg-gradient-to-br from-primary via-primary/80 to-primary/50",
          isActive && "shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
        )}
        animate={
          state === "processing"
            ? { scale: [1, 1.05, 1] }
            : state === "speaking"
            ? { scale: [1, 1.08, 1, 1.04, 1] }
            : state === "listening"
            ? { scale: [1, 1.03, 1] }
            : {}
        }
        transition={{ duration: state === "speaking" ? 0.6 : 1.2, repeat: Infinity }}
      >
        {/* Inner shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <span className="relative text-lg font-display font-black text-primary-foreground tracking-wider">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </motion.div>

      {/* State label */}
      <motion.div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={cn(
          "text-[9px] font-mono uppercase tracking-widest",
          state === "listening" ? "text-primary" :
          state === "speaking" ? "text-emerald-400" :
          state === "processing" ? "text-amber-400" :
          "text-muted-foreground/50"
        )}>
          {state === "listening" ? "● LISTENING" :
           state === "speaking" ? "● SPEAKING" :
           state === "processing" ? "● PROCESSING" :
           "○ STANDBY"}
        </span>
      </motion.div>
    </div>
  );
};

export default OmnixOrb;
