import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
}

const OmnixOrb = ({ state, name, className }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  const waveRings = Array.from({ length: 5 }, (_, i) => i);
  const particleCount = 12;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  // Dynamic color per state
  const stateColor = state === "speaking"
    ? "hsl(var(--primary))"
    : state === "listening"
    ? "hsl(160 84% 50%)"
    : state === "processing"
    ? "hsl(40 96% 56%)"
    : "hsl(var(--primary))";

  return (
    <div className={cn("relative w-32 h-32 flex items-center justify-center mb-2", className)}>

      {/* Ambient field — radial gradient background */}
      <motion.div
        className="absolute inset-[-30px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${isActive ? "hsl(var(--primary) / 0.06)" : "transparent"} 0%, transparent 70%)`,
        }}
        animate={isActive ? { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Hexagonal grid overlay — futuristic feel */}
      {isActive && (
        <motion.div
          className="absolute inset-[-20px] rounded-full overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15, rotate: [0, 30] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='hsl(0 0%25 100%25)' fill-opacity='0.1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Wave rings — emanating outward */}
      {isActive && waveRings.map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid`,
            borderColor: state === "speaking"
              ? "hsl(var(--primary) / 0.2)"
              : state === "listening"
              ? "hsl(160 84% 50% / 0.15)"
              : "hsl(var(--primary) / 0.1)",
          }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{
            scale: [1, 1.5 + i * 0.3, 2 + i * 0.4],
            opacity: [0.5 - i * 0.08, 0.2 - i * 0.03, 0],
          }}
          transition={{
            duration: 2.5 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Primary scanning arc */}
      {isActive && (
        <motion.div
          className="absolute inset-[-10px] rounded-full"
          style={{
            border: "2px solid transparent",
            borderTopColor: state === "listening" ? "hsl(160 84% 50% / 0.5)" : "hsl(var(--primary) / 0.5)",
            borderRightColor: "hsl(var(--primary) / 0.15)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Counter-rotate arc */}
      {(state === "processing" || state === "speaking") && (
        <motion.div
          className="absolute inset-[-16px] rounded-full"
          style={{
            border: "1.5px solid transparent",
            borderBottomColor: state === "speaking" ? "hsl(var(--primary) / 0.3)" : "hsl(40 96% 56% / 0.3)",
            borderLeftColor: "hsl(var(--primary) / 0.08)",
          }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Third arc — ultra-fast for processing */}
      {state === "processing" && (
        <motion.div
          className="absolute inset-[-6px] rounded-full"
          style={{
            border: "1px solid transparent",
            borderLeftColor: "hsl(40 96% 56% / 0.4)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Floating particles — more of them, varied sizes */}
      {isActive && particles.map((i) => {
        const angle = (i / particleCount) * 360;
        const radius = 58 + (i % 3) * 6;
        const size = i % 3 === 0 ? 1.5 : 1;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: size * 2,
              height: size * 2,
              background: state === "listening" ? "hsl(160 84% 50% / 0.5)" : "hsl(var(--primary) / 0.5)",
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * (radius - 12),
                Math.cos(((angle + 60) * Math.PI) / 180) * radius,
                Math.cos(((angle + 120) * Math.PI) / 180) * (radius - 8),
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * (radius - 12),
                Math.sin(((angle + 60) * Math.PI) / 180) * radius,
                Math.sin(((angle + 120) * Math.PI) / 180) * (radius - 8),
              ],
              opacity: [0.15, 0.8, 0.15],
              scale: [0.6, 1.4, 0.6],
            }}
            transition={{
              duration: 3 + (i % 4) * 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Energy streaks for speaking */}
      {state === "speaking" && Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={`streak-${i}`}
          className="absolute w-px bg-gradient-to-t from-primary/40 to-transparent"
          style={{
            height: 20,
            left: "50%",
            top: "50%",
            transformOrigin: "bottom center",
          }}
          animate={{
            rotate: [i * 60, i * 60 + 360],
            scaleY: [0.5, 1.5, 0.5],
            opacity: [0.2, 0.6, 0.2],
            y: [-50, -65, -50],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Outer glow pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-[-6px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${
              state === "speaking" ? "hsl(var(--primary) / 0.25)" 
              : state === "listening" ? "hsl(160 84% 50% / 0.15)"
              : "hsl(var(--primary) / 0.12)"
            } 0%, transparent 70%)`,
          }}
          animate={{
            scale: state === "speaking" ? [1, 1.35, 1] : [1, 1.2, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{ duration: state === "speaking" ? 0.6 : 2, repeat: Infinity }}
        />
      )}

      {/* Main orb — transparent center, only waveform effects visible */}
      <motion.div
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden z-10",
          "border-2",
          state === "listening"
            ? "border-emerald-500/50"
            : state === "speaking"
            ? "border-primary/50"
            : state === "processing"
            ? "border-amber-500/50"
            : "border-muted-foreground/20",
          isActive && "shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
        )}
        style={{ background: "transparent" }}
        animate={
          state === "processing"
            ? { scale: [1, 1.08, 1, 1.04, 1] }
            : state === "speaking"
            ? { scale: [1, 1.12, 1, 1.07, 1] }
            : state === "listening"
            ? { scale: [1, 1.05, 1] }
            : {}
        }
        transition={{
          duration: state === "speaking" ? 0.4 : state === "processing" ? 0.7 : 1.2,
          repeat: Infinity,
        }}
      >
        {/* Inner shimmer effects only */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/3"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* State label — positioned below orb with proper spacing */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-1.5">
          <motion.span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              state === "listening" ? "bg-emerald-400" :
              state === "speaking" ? "bg-primary" :
              state === "processing" ? "bg-amber-400" :
              "bg-muted-foreground/30"
            )}
            animate={isActive ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className={cn(
            "text-[9px] font-mono uppercase tracking-[0.2em]",
            state === "listening" ? "text-emerald-400" :
            state === "speaking" ? "text-primary" :
            state === "processing" ? "text-amber-400" :
            "text-muted-foreground/40"
          )}>
            {state === "listening" ? "LISTENING" :
             state === "speaking" ? "SPEAKING" :
             state === "processing" ? "PROCESSING" :
             "STANDBY"}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default OmnixOrb;
