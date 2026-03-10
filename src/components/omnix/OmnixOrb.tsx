import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
}

const RING_COUNT = 48;

const OmnixOrb = ({ state, className }: OmnixOrbProps) => {
  const isActive = state !== "idle";

  const seeds = useMemo(
    () => Array.from({ length: RING_COUNT }, () => [Math.random(), Math.random()]),
    []
  );

  const stateColor = {
    idle: "hsl(var(--muted-foreground) / 0.15)",
    listening: "hsl(var(--primary))",
    speaking: "hsl(var(--primary))",
    processing: "hsl(var(--primary))",
  }[state];

  return (
    <div className={cn("relative w-36 h-36 flex items-center justify-center", className)}>
      {/* Ambient glow */}
      {isActive && (
        <motion.div
          className="absolute inset-[-40px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Rotating scan arc */}
      {isActive && (
        <motion.div
          className="absolute inset-[-8px] rounded-full"
          style={{
            border: "1.5px solid transparent",
            borderTopColor: "hsl(var(--primary) / 0.5)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Main orb container — transparent with border */}
      <div
        className={cn(
          "relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden z-10",
          "border transition-colors duration-500",
          state === "idle" ? "border-muted-foreground/10" : "border-primary/30"
        )}
        style={{
          boxShadow: isActive ? `0 0 40px hsl(var(--primary) / 0.15), inset 0 0 30px hsl(var(--primary) / 0.05)` : "none",
        }}
      >
        {/* Circular waveform — the star of the show */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {seeds.map(([r1, r2], i) => {
            const angle = (i / RING_COUNT) * 360;
            const rad = (angle * Math.PI) / 180;
            const baseRadius = 60;

            const amplitudes = {
              idle: 2 + r1 * 3,
              listening: 8 + r1 * 18,
              speaking: 12 + r1 * 24,
              processing: 6 + r1 * 14,
            };
            const amp = amplitudes[state];

            const innerR = baseRadius - amp * 0.3;
            const outerR = baseRadius + amp * 0.7;

            const x1 = 100 + Math.cos(rad) * innerR;
            const y1 = 100 + Math.sin(rad) * innerR;
            const x2 = 100 + Math.cos(rad) * outerR;
            const y2 = 100 + Math.sin(rad) * outerR;

            const duration = state === "speaking" ? 0.3 + r1 * 0.3 : state === "listening" ? 0.6 + r1 * 0.4 : 1.5 + r1;
            const delay = i * 0.015;

            return (
              <motion.line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)"}
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{ opacity: isActive ? 0.7 + r1 * 0.3 : 0.15 }}
                animate={
                  isActive
                    ? {
                        x1: [
                          100 + Math.cos(rad) * (baseRadius - amp * 0.2),
                          100 + Math.cos(rad) * (baseRadius - amp * (0.4 + r2 * 0.3)),
                          100 + Math.cos(rad) * (baseRadius - amp * 0.1),
                          100 + Math.cos(rad) * (baseRadius - amp * (0.3 + r1 * 0.2)),
                          100 + Math.cos(rad) * (baseRadius - amp * 0.2),
                        ],
                        y1: [
                          100 + Math.sin(rad) * (baseRadius - amp * 0.2),
                          100 + Math.sin(rad) * (baseRadius - amp * (0.4 + r2 * 0.3)),
                          100 + Math.sin(rad) * (baseRadius - amp * 0.1),
                          100 + Math.sin(rad) * (baseRadius - amp * (0.3 + r1 * 0.2)),
                          100 + Math.sin(rad) * (baseRadius - amp * 0.2),
                        ],
                        x2: [
                          100 + Math.cos(rad) * (baseRadius + amp * 0.6),
                          100 + Math.cos(rad) * (baseRadius + amp * (0.8 + r1 * 0.2)),
                          100 + Math.cos(rad) * (baseRadius + amp * 0.4),
                          100 + Math.cos(rad) * (baseRadius + amp * (0.7 + r2 * 0.3)),
                          100 + Math.cos(rad) * (baseRadius + amp * 0.6),
                        ],
                        y2: [
                          100 + Math.sin(rad) * (baseRadius + amp * 0.6),
                          100 + Math.sin(rad) * (baseRadius + amp * (0.8 + r1 * 0.2)),
                          100 + Math.sin(rad) * (baseRadius + amp * 0.4),
                          100 + Math.sin(rad) * (baseRadius + amp * (0.7 + r2 * 0.3)),
                          100 + Math.sin(rad) * (baseRadius + amp * 0.6),
                        ],
                        opacity: [0.5, 0.9, 0.4, 0.8, 0.5],
                      }
                    : {}
                }
                transition={{
                  duration,
                  repeat: Infinity,
                  delay,
                  ease: "easeInOut",
                }}
              />
            );
          })}

          {/* Center dot */}
          <motion.circle
            cx={100}
            cy={100}
            r={isActive ? 3 : 2}
            fill={stateColor}
            animate={isActive ? { opacity: [0.6, 1, 0.6], r: [2, 3.5, 2] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
      </div>

      {/* State indicator dot — minimal, below orb */}
      <motion.div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          className="block w-2 h-2 rounded-full"
          style={{ backgroundColor: stateColor }}
          animate={isActive ? { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] } : { opacity: 0.3 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

export default OmnixOrb;
