import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OmnixOrbProps {
  state: "idle" | "listening" | "speaking" | "processing";
  name: string;
  className?: string;
  immersive?: boolean;
}

const ARC_COUNT = 6;
const PARTICLE_COUNT = 40;
const SCAN_LINES = 8;

const OmnixOrb = ({ state, name, className, immersive }: OmnixOrbProps) => {
  const isActive = state !== "idle";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isProcessing = state === "processing";

  const size = immersive ? 460 : 320;
  const center = size / 2;
  const coreR = immersive ? 70 : 48;

  // ─── Stable randomized seeds ───
  const arcs = useMemo(
    () =>
      Array.from({ length: ARC_COUNT }, (_, i) => ({
        radius: coreR + 28 + i * (immersive ? 22 : 16),
        strokeW: 1.2 + Math.random() * 1.2,
        dashArray: `${8 + Math.random() * 30} ${20 + Math.random() * 40}`,
        speed: 8 + i * 4 + Math.random() * 6,
        direction: i % 2 === 0 ? 1 : -1,
        arcLength: 90 + Math.random() * 120,
        offset: Math.random() * 360,
      })),
    [coreR, immersive]
  );

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (360 / PARTICLE_COUNT) * i + Math.random() * 20,
        dist: coreR + 20 + Math.random() * (immersive ? 130 : 90),
        size: 1 + Math.random() * 2.5,
        dur: 3 + Math.random() * 5,
        delay: Math.random() * 3,
        drift: 15 + Math.random() * 40,
      })),
    [coreR, immersive]
  );

  const scanSeeds = useMemo(
    () => Array.from({ length: SCAN_LINES }, () => Math.random()),
    []
  );

  const stateLabel = { idle: "", listening: "LISTENING", speaking: "SPEAKING", processing: "THINKING" }[state];

  // Intensity multipliers per state
  const intensity = isSpeaking ? 1.4 : isListening ? 1.1 : isProcessing ? 0.8 : 0.65;

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center select-none", className)}
      style={{ width: size, height: size + 50 }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="overflow-visible"
      >
        <defs>
          {/* Radial glow for core */}
          <radialGradient id="orb-core-grad" cx="0.42" cy="0.38" r="0.55">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95 * intensity} />
            <stop offset="35%" stopColor="hsl(var(--primary))" stopOpacity={0.5 * intensity} />
            <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity={0.12 * intensity} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </radialGradient>

          {/* Nebula ambient */}
          <radialGradient id="orb-nebula" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.06 * intensity} />
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.02 * intensity} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </radialGradient>

          {/* Inner glow filter */}
          <filter id="orb-bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isSpeaking ? 8 : 4} />
          </filter>

          <filter id="orb-bloom-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isSpeaking ? 20 : 12} />
          </filter>
        </defs>

        {/* ── Layer 1: Nebula aura ── */}
        <motion.circle
          cx={center}
          cy={center}
          r={size * 0.42}
          fill="url(#orb-nebula)"
          animate={{
            r: isActive ? [size * 0.38, size * 0.45, size * 0.38] : [size * 0.34, size * 0.4, size * 0.34],
            opacity: isActive ? [0.5, 1, 0.5] : [0.4, 0.65, 0.4],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Layer 2: Orbital arcs ── */}
        {arcs.map((arc, i) => {
          const circumference = 2 * Math.PI * arc.radius;
          const visibleLength = (arc.arcLength / 360) * circumference;
          const gapLength = circumference - visibleLength;

          return (
            <motion.circle
              key={`arc-${i}`}
              cx={center}
              cy={center}
              r={arc.radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={arc.strokeW}
              strokeLinecap="round"
              strokeDasharray={`${visibleLength} ${gapLength}`}
              strokeOpacity={isActive ? 0.25 + (i % 3) * 0.08 : 0.18 + (i % 3) * 0.06}
              style={{ transformOrigin: `${center}px ${center}px` }}
              animate={{
                rotate: [arc.offset, arc.offset + 360 * arc.direction],
                strokeOpacity: isActive
                  ? [0.15, 0.35 * intensity, 0.15]
                  : 0.04,
                strokeWidth: isSpeaking
                  ? [arc.strokeW, arc.strokeW * 2, arc.strokeW]
                  : arc.strokeW,
              }}
              transition={{
                rotate: { duration: arc.speed, repeat: Infinity, ease: "linear" },
                strokeOpacity: { duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
                strokeWidth: { duration: 0.4 + i * 0.1, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          );
        })}

        {/* ── Layer 3: Scan lines (holographic effect) ── */}
        <AnimatePresence>
          {isActive &&
            scanSeeds.map((seed, i) => {
              const angle = (360 / SCAN_LINES) * i + seed * 30;
              const innerR = coreR + 10;
              const outerR = coreR + 50 + seed * (immersive ? 80 : 50);
              const rad = (angle * Math.PI) / 180;
              const x1 = center + Math.cos(rad) * innerR;
              const y1 = center + Math.sin(rad) * innerR;
              const x2 = center + Math.cos(rad) * outerR;
              const y2 = center + Math.sin(rad) * outerR;

              return (
                <motion.line
                  key={`scan-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth={0.8}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.3 * intensity, 0],
                    x2: [x2, x2 + Math.cos(rad) * 15, x2],
                    y2: [y2, y2 + Math.sin(rad) * 15, y2],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5 + seed,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
        </AnimatePresence>

        {/* ── Layer 4: Particle field ── */}
        <AnimatePresence>
          {isActive &&
            particles.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const cx = center + Math.cos(rad) * p.dist;
              const cy = center + Math.sin(rad) * p.dist;
              const driftX = Math.cos(rad + 0.5) * p.drift;
              const driftY = Math.sin(rad + 0.5) * p.drift;

              return (
                <motion.circle
                  key={`p-${i}`}
                  r={p.size}
                  fill="hsl(var(--primary))"
                  filter="url(#orb-bloom)"
                  initial={{ cx, cy, opacity: 0 }}
                  animate={{
                    cx: [cx, cx + driftX * 0.5, cx - driftX * 0.3, cx + driftX, cx],
                    cy: [cy, cy - driftY * 0.5, cy + driftY * 0.3, cy - driftY, cy],
                    opacity: [0, 0.6 * intensity, 0.2, 0.8 * intensity, 0],
                    r: isSpeaking
                      ? [p.size, p.size * 2.5, p.size, p.size * 2, p.size]
                      : [p.size, p.size * 1.3, p.size],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: p.dur,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeInOut",
                  }}
                />
              );
            })}
        </AnimatePresence>

        {/* ── Layer 5: Outer bloom halo ── */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreR + 5}
          fill="hsl(var(--primary))"
          filter="url(#orb-bloom-lg)"
          animate={{
            r: isSpeaking
              ? [coreR + 5, coreR + 25, coreR + 8, coreR + 20, coreR + 5]
              : isListening
              ? [coreR + 3, coreR + 12, coreR + 3]
              : [coreR + 2, coreR + 6, coreR + 2],
            opacity: isActive
              ? [0.08, 0.2 * intensity, 0.08]
              : [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: isSpeaking ? 0.5 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* ── Layer 6: Core orb - liquid morphing ── */}
        <motion.circle
          cx={center}
          cy={center}
          fill="url(#orb-core-grad)"
          animate={{
            r: isSpeaking
              ? [coreR, coreR * 1.18, coreR * 0.9, coreR * 1.12, coreR]
              : isListening
              ? [coreR, coreR * 1.08, coreR * 0.95, coreR * 1.05, coreR]
              : isProcessing
              ? [coreR, coreR * 1.04, coreR * 0.97, coreR]
              : [coreR, coreR * 1.01, coreR],
          }}
          transition={{
            duration: isSpeaking ? 0.35 : isListening ? 0.9 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* ── Layer 7: Inner nucleus - bright hot center ── */}
        <motion.circle
          cx={center}
          cy={center}
          fill="hsl(var(--primary))"
          filter="url(#orb-bloom)"
          animate={{
            r: isSpeaking
              ? [coreR * 0.2, coreR * 0.4, coreR * 0.15, coreR * 0.35, coreR * 0.2]
              : [coreR * 0.15, coreR * 0.22, coreR * 0.15],
            opacity: isActive ? [0.4, 0.9, 0.4] : [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* ── Layer 8: Specular highlight - glass-like reflection ── */}
        <ellipse
          cx={center - coreR * 0.22}
          cy={center - coreR * 0.28}
          rx={coreR * 0.25}
          ry={coreR * 0.15}
          fill="white"
          opacity={isActive ? 0.12 : 0.04}
          style={{ filter: "blur(3px)" }}
        />
      </svg>

      {/* ── Name ── */}
      <motion.span
        className="absolute font-mono tracking-[0.4em] uppercase text-muted-foreground/50"
        style={{
          bottom: immersive ? 20 : 10,
          fontSize: immersive ? 12 : 9,
          left: "50%",
          x: "-50%",
        }}
        animate={{ opacity: isActive ? [0.5, 1, 0.5] : 0.3 }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {name}
      </motion.span>

      {/* ── State label ── */}
      <AnimatePresence>
        {isActive && stateLabel && (
          <motion.span
            className="absolute font-mono tracking-[0.6em] uppercase"
            style={{
              bottom: immersive ? 4 : 0,
              fontSize: immersive ? 9 : 7,
              left: "50%",
              x: "-50%",
              color: "hsl(var(--primary))",
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0.3, 1, 0.3], y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            {stateLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmnixOrb;
