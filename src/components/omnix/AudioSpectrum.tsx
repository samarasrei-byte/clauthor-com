import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioSpectrumProps {
  active: boolean;
  className?: string;
}

const BAR_COUNT = 16;

const AudioSpectrum = ({ active, className }: AudioSpectrumProps) => {
  // Memoize random seeds so bars stay stable across re-renders
  const seeds = useMemo(
    () => Array.from({ length: BAR_COUNT }, () => [Math.random(), Math.random(), Math.random()]),
    []
  );

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-end justify-center gap-1 h-12",
        className
      )}
    >
      {seeds.map(([r1, r2, r3], i) => {
        const centerDist = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
        const maxH = 40 * (1 - centerDist * 0.5);

        return (
          <motion.div
            key={i}
            className="w-1.5 rounded-t-sm bg-gradient-to-t from-primary/30 via-primary/60 to-primary"
            style={{ boxShadow: "0 0 6px hsl(var(--primary) / 0.3)" }}
            animate={{
              height: [
                4,
                maxH * (0.3 + r1 * 0.7),
                maxH * (0.1 + r2 * 0.5),
                maxH * (0.4 + r3 * 0.6),
                4,
              ],
            }}
            transition={{
              duration: 1.2 + r1 * 0.8,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </motion.div>
  );
};

export default AudioSpectrum;
