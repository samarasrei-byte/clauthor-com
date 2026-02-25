import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioSpectrumProps {
  active: boolean;
  className?: string;
}

const AudioSpectrum = ({ active, className }: AudioSpectrumProps) => {
  if (!active) return null;

  const bars = 16;

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
      {Array.from({ length: bars }).map((_, i) => {
        const centerDist = Math.abs(i - bars / 2) / (bars / 2);
        const maxH = 40 * (1 - centerDist * 0.5);

        return (
          <motion.div
            key={i}
            className="w-1.5 rounded-t-sm bg-gradient-to-t from-primary/30 via-primary/60 to-primary"
            style={{ boxShadow: "0 0 6px hsl(var(--primary) / 0.3)" }}
            animate={{
              height: [
                4,
                maxH * (0.3 + Math.random() * 0.7),
                maxH * (0.1 + Math.random() * 0.5),
                maxH * (0.4 + Math.random() * 0.6),
                4,
              ],
            }}
            transition={{
              duration: 1.2 + Math.random() * 0.8,
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
