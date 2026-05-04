import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  active: boolean;
  mode: "listening" | "speaking" | "idle";
  className?: string;
}

const BAR_COUNT = 48;
const PARTICLE_COUNT = 16;

const AudioWaveform = ({ active, mode, className }: AudioWaveformProps) => {
  const seeds = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => [Math.random(), Math.random(), Math.random()]),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * 100,
        delay: Math.random() * 2,
        dur: 1.5 + Math.random() * 2,
        size: 1.5 + Math.random() * 2.5,
      })),
    []
  );

  if (!active) return null;

  const isSpeaking = mode === "speaking";
  const isListening = mode === "listening";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 64 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "relative flex items-center justify-center gap-[1.5px] overflow-hidden px-4",
        className
      )}
    >
      {/* Floating particles */}
      <AnimatePresence>
        {(isSpeaking || isListening) &&
          particles.map((p, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full bg-primary/40"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{
                opacity: [0, 0.8, 0],
                y: [40, -10, -30],
                x: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30],
              }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* Waveform bars with parabolic envelope */}
      {seeds.map(([r1, r2, r3], i) => {
        const center = BAR_COUNT / 2;
        const dist = Math.abs(i - center) / center;
        // Parabolic envelope - tallest at center, fading at edges
        const envelope = 1 - dist * dist;
        const maxH = isSpeaking ? 48 : isListening ? 36 : 20;
        const minH = 2;
        const amplitude = maxH * envelope;

        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 2,
              background: isSpeaking
                ? `linear-gradient(to top, hsl(var(--primary) / ${0.3 + envelope * 0.4}), hsl(var(--primary) / ${0.6 + envelope * 0.4}))`
                : isListening
                ? `hsl(var(--primary) / ${0.4 + envelope * 0.3})`
                : `hsl(var(--primary) / 0.15)`,
              boxShadow: isSpeaking && envelope > 0.5
                ? `0 0 ${4 + envelope * 6}px hsl(var(--primary) / ${envelope * 0.3})`
                : "none",
            }}
            animate={{
              height: isSpeaking
                ? [
                    minH,
                    amplitude * (0.5 + r1 * 0.5),
                    minH + amplitude * 0.15,
                    amplitude * (0.3 + r2 * 0.7),
                    minH,
                    amplitude * (0.4 + r3 * 0.6),
                    minH,
                  ]
                : isListening
                ? [minH, amplitude * (0.3 + r1 * 0.5), minH, amplitude * (0.2 + r2 * 0.4), minH]
                : [minH, minH + 2, minH],
            }}
            transition={{
              duration: isSpeaking ? 0.6 + r1 * 0.4 : isListening ? 0.9 + r1 * 0.5 : 2,
              repeat: Infinity,
              delay: i * 0.015,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Glow underline */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)`,
        }}
        animate={{
          width: isSpeaking ? ["40%", "80%", "40%"] : isListening ? ["30%", "60%", "30%"] : "20%",
          opacity: isSpeaking ? [0.3, 0.8, 0.3] : [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

export default AudioWaveform;
