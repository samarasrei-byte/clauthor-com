import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  active: boolean;
  mode: "listening" | "speaking";
  className?: string;
}

const AudioWaveform = ({ active, mode, className }: AudioWaveformProps) => {
  if (!active) return null;

  const barCount = 32;
  const isListening = mode === "listening";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 56 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-center justify-center gap-[2px] overflow-hidden px-6",
        className
      )}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const center = barCount / 2;
        const dist = Math.abs(i - center) / center;
        const maxH = isListening ? 32 : 40;
        const minH = 3;
        const amplitude = maxH * (1 - dist * 0.6);

        return (
          <motion.div
            key={i}
            className={cn(
              "w-[2px] rounded-full",
              isListening
                ? "bg-primary/70"
                : "bg-gradient-to-t from-primary/40 to-primary"
            )}
            animate={{
              height: [
                minH,
                amplitude * (0.4 + Math.random() * 0.6),
                minH,
                amplitude * (0.3 + Math.random() * 0.7),
                minH,
              ],
            }}
            transition={{
              duration: isListening ? 0.8 + Math.random() * 0.4 : 0.5 + Math.random() * 0.3,
              repeat: Infinity,
              delay: i * 0.02,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </motion.div>
  );
};

export default AudioWaveform;
