import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
}

const OmnixOrb = ({ state, name, className }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  // Generate wave rings for futuristic effect
  const waveRings = Array.from({ length: 4 }, (_, i) => i);
  const particleCount = 8;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <div className={cn("relative w-28 h-28 flex items-center justify-center", className)}>

      {/* Futuristic orbital rings — always visible when active */}
      {isActive && waveRings.map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: state === "speaking"
              ? "hsl(var(--primary) / 0.15)"
              : state === "listening"
              ? "hsl(var(--primary) / 0.2)"
              : "hsl(var(--primary) / 0.1)",
          }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{
            scale: [1, 1.4 + i * 0.25, 1.8 + i * 0.3],
            opacity: [0.6 - i * 0.1, 0.3 - i * 0.05, 0],
            rotate: [0, (i % 2 === 0 ? 90 : -90)],
          }}
          transition={{
            duration: 2 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Scanning arc — rotating partial ring */}
      {isActive && (
        <motion.div
          className="absolute inset-[-8px] rounded-full"
          style={{
            border: "2px solid transparent",
            borderTopColor: "hsl(var(--primary) / 0.4)",
            borderRightColor: "hsl(var(--primary) / 0.15)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Second scanning arc — counter-rotate */}
      {(state === "processing" || state === "speaking") && (
        <motion.div
          className="absolute inset-[-14px] rounded-full"
          style={{
            border: "1.5px solid transparent",
            borderBottomColor: "hsl(var(--primary) / 0.25)",
            borderLeftColor: "hsl(var(--primary) / 0.1)",
          }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Floating particles */}
      {isActive && particles.map((i) => {
        const angle = (i / particleCount) * 360;
        const radius = 52;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * (radius - 10),
                Math.cos(((angle + 45) * Math.PI) / 180) * radius,
                Math.cos(((angle + 90) * Math.PI) / 180) * (radius - 5),
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * (radius - 10),
                Math.sin(((angle + 45) * Math.PI) / 180) * radius,
                Math.sin(((angle + 90) * Math.PI) / 180) * (radius - 5),
              ],
              opacity: [0.2, 0.7, 0.2],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 3 + (i % 3) * 0.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Outer glow pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-[-4px] rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / ${state === "speaking" ? "0.2" : "0.12"}) 0%, transparent 70%)`,
          }}
          animate={{
            scale: state === "speaking" ? [1, 1.3, 1] : [1, 1.15, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{ duration: state === "speaking" ? 0.8 : 2, repeat: Infinity }}
        />
      )}

      {/* Main orb */}
      <motion.div
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center overflow-hidden z-10",
          "bg-gradient-to-br from-primary via-primary/80 to-primary/50",
          isActive && "shadow-[0_0_50px_hsl(var(--primary)/0.5)]"
        )}
        animate={
          state === "processing"
            ? { scale: [1, 1.06, 1, 1.03, 1] }
            : state === "speaking"
            ? { scale: [1, 1.1, 1, 1.06, 1] }
            : state === "listening"
            ? { scale: [1, 1.04, 1] }
            : {}
        }
        transition={{
          duration: state === "speaking" ? 0.5 : state === "processing" ? 0.8 : 1.2,
          repeat: Infinity,
        }}
      >
        {/* Inner rotating shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/5"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner concentric ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-white/10"
          animate={isActive ? { scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        <span className="relative text-lg font-display font-black text-primary-foreground tracking-wider z-10">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </motion.div>

      {/* State label */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
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
