import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
}

const BAR_COUNT = 64;

const OmnixOrb = ({ state, name, className }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  const seeds = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => [Math.random(), Math.random(), Math.random()]),
    []
  );

  const stateLabel = {
    idle: "",
    listening: "LISTENING",
    speaking: "SPEAKING",
    processing: "THINKING",
  }[state];

  return (
    <div className={cn("relative flex flex-col items-center gap-3", className)}>
      {/* Name */}
      <motion.span
        className="text-[11px] font-mono tracking-[0.35em] uppercase text-muted-foreground/50"
        animate={{ opacity: isActive ? 1 : 0.4 }}
      >
        {name}
      </motion.span>

      {/* Waveform container — wide horizontal strip */}
      <div className="relative w-[420px] sm:w-[520px] h-[80px] flex items-center justify-center">
        {/* Ambient glow behind waveform */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 100% at center, hsl(var(--primary) / 0.12) 0%, transparent 70%)`,
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* The waveform bars — horizontal, filling the width */}
        <svg
          viewBox={`0 0 ${BAR_COUNT * 6.5} 80`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="bar-idle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.08" />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {seeds.map(([r1, r2, r3], i) => {
            const x = i * 6.5 + 3;
            const center = 40;

            // Distance from center (0..1) — bars taller near center, shorter at edges
            const centerFactor = 1 - Math.abs((i - BAR_COUNT / 2) / (BAR_COUNT / 2));
            const envelope = 0.3 + centerFactor * 0.7;

            const heights = {
              idle: (3 + r1 * 4) * envelope,
              listening: (10 + r1 * 28) * envelope,
              speaking: (14 + r1 * 32) * envelope,
              processing: (8 + r1 * 20) * envelope,
            };
            const h = heights[state];
            const halfH = h / 2;

            const speeds = {
              idle: 2 + r1 * 1.5,
              listening: 0.4 + r1 * 0.35,
              speaking: 0.2 + r1 * 0.25,
              processing: 0.8 + r1 * 0.5,
            };

            const barWidth = 3;

            return (
              <motion.rect
                key={i}
                x={x - barWidth / 2}
                rx={1.5}
                ry={1.5}
                width={barWidth}
                fill={isActive ? "url(#bar-gradient)" : "url(#bar-idle)"}
                animate={
                  isActive
                    ? {
                        y: [
                          center - halfH * 0.5,
                          center - halfH * (0.9 + r2 * 0.1),
                          center - halfH * 0.3,
                          center - halfH * (0.7 + r3 * 0.3),
                          center - halfH * 0.5,
                        ],
                        height: [
                          halfH * 1,
                          halfH * (1.8 + r2 * 0.2),
                          halfH * 0.6,
                          halfH * (1.4 + r3 * 0.6),
                          halfH * 1,
                        ],
                        opacity: [0.6, 1, 0.5, 0.9, 0.6],
                      }
                    : {
                        y: center - halfH,
                        height: halfH * 2,
                        opacity: 1,
                      }
                }
                transition={{
                  duration: speeds[state],
                  repeat: Infinity,
                  delay: i * 0.02,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* State label */}
      <motion.span
        className="text-[9px] font-mono tracking-[0.5em] uppercase h-3"
        style={{ color: isActive ? "hsl(var(--primary))" : "transparent" }}
        animate={{ opacity: isActive ? [0.4, 1, 0.4] : 0 }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        {stateLabel}
      </motion.span>
    </div>
  );
};

export default OmnixOrb;
