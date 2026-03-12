import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
  /** Full immersive mode — larger orb */
  immersive?: boolean;
}

const RING_COUNT = 5;
const PARTICLE_COUNT = 24;

const OmnixOrb = ({ state, name, className, immersive }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (360 / PARTICLE_COUNT) * i + Math.random() * 15,
        distance: 80 + Math.random() * 60,
        size: 1.5 + Math.random() * 2.5,
        speed: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      })),
    []
  );

  const stateLabel = {
    idle: "",
    listening: "LISTENING",
    speaking: "SPEAKING",
    processing: "THINKING",
  }[state];

  const orbSize = immersive ? 180 : 120;
  const containerSize = immersive ? 420 : 300;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 select-none",
        className
      )}
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Ambient radial glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, hsl(var(--primary) / ${isActive ? 0.15 : 0.03}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: isActive ? [1, 1.15, 1] : 1,
          opacity: isActive ? [0.6, 1, 0.6] : 0.2,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Concentric pulse rings */}
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const ringScale = 1 + i * 0.35;
        const baseOpacity = isActive ? 0.25 - i * 0.04 : 0.04;

        return (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border pointer-events-none"
            style={{
              width: orbSize,
              height: orbSize,
              borderColor: `hsl(var(--primary) / ${baseOpacity})`,
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
            }}
            animate={
              isActive
                ? {
                    scale: [ringScale, ringScale + 0.2, ringScale],
                    opacity: [baseOpacity, baseOpacity * 2, baseOpacity],
                    borderWidth: state === "speaking" ? [1, 2, 1] : 1,
                  }
                : { scale: ringScale, opacity: baseOpacity }
            }
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Orbiting particles */}
      <AnimatePresence>
        {isActive &&
          particles.map((p, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: `hsl(var(--primary))`,
                boxShadow: `0 0 ${p.size * 3}px hsl(var(--primary) / 0.6)`,
                left: "50%",
                top: "50%",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.3, 0.9, 0],
                scale: [0.5, 1.2, 0.8, 1.4, 0.5],
                x: [
                  Math.cos((p.angle * Math.PI) / 180) * p.distance * 0.5,
                  Math.cos(((p.angle + 60) * Math.PI) / 180) * p.distance,
                  Math.cos(((p.angle + 120) * Math.PI) / 180) * p.distance * 0.7,
                  Math.cos(((p.angle + 180) * Math.PI) / 180) * p.distance,
                  Math.cos(((p.angle + 240) * Math.PI) / 180) * p.distance * 0.5,
                ],
                y: [
                  Math.sin((p.angle * Math.PI) / 180) * p.distance * 0.5,
                  Math.sin(((p.angle + 60) * Math.PI) / 180) * p.distance,
                  Math.sin(((p.angle + 120) * Math.PI) / 180) * p.distance * 0.7,
                  Math.sin(((p.angle + 180) * Math.PI) / 180) * p.distance,
                  Math.sin(((p.angle + 240) * Math.PI) / 180) * p.distance * 0.5,
                ],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: p.speed,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* Core orb — fluid plasma effect */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: orbSize,
          height: orbSize,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          background: isActive
            ? `radial-gradient(circle at 40% 35%, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.4) 40%, hsl(var(--primary) / 0.1) 70%, transparent 100%)`
            : `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 50%, transparent 100%)`,
          boxShadow: isActive
            ? `0 0 ${orbSize * 0.4}px hsl(var(--primary) / 0.3), inset 0 0 ${orbSize * 0.3}px hsl(var(--primary) / 0.15)`
            : `0 0 20px hsl(var(--primary) / 0.05)`,
        }}
        animate={
          isActive
            ? {
                scale:
                  state === "speaking"
                    ? [1, 1.12, 0.95, 1.08, 1]
                    : state === "listening"
                    ? [1, 1.06, 0.97, 1.04, 1]
                    : [1, 1.03, 0.98, 1.02, 1],
                borderRadius: [
                  "50%",
                  "47% 53% 51% 49%",
                  "52% 48% 49% 51%",
                  "49% 51% 52% 48%",
                  "50%",
                ],
              }
            : { scale: [1, 1.02, 1], borderRadius: "50%" }
        }
        transition={{
          duration: state === "speaking" ? 0.6 : state === "listening" ? 1.2 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner bright core */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orbSize * 0.35,
          height: orbSize * 0.35,
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
          background: `radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.3) 60%, transparent 100%)`,
          filter: "blur(4px)",
        }}
        animate={{
          opacity: isActive ? [0.5, 1, 0.5] : [0.1, 0.2, 0.1],
          scale: isActive ? [0.8, 1.1, 0.8] : 1,
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Name label */}
      <motion.span
        className="absolute font-mono tracking-[0.35em] uppercase text-muted-foreground/50"
        style={{
          bottom: immersive ? 30 : 16,
          fontSize: immersive ? 13 : 10,
          left: "50%",
          x: "-50%",
        }}
        animate={{ opacity: isActive ? 1 : 0.35 }}
      >
        {name}
      </motion.span>

      {/* State label */}
      <AnimatePresence>
        {isActive && stateLabel && (
          <motion.span
            className="absolute font-mono tracking-[0.5em] uppercase"
            style={{
              bottom: immersive ? 10 : 2,
              fontSize: immersive ? 10 : 8,
              left: "50%",
              x: "-50%",
              color: "hsl(var(--primary))",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            {stateLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmnixOrb;
