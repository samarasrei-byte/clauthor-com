import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Rocket, CheckCircle2, Sparkles } from "lucide-react";

interface PostPaymentCelebrationProps {
  agentName: string;
  isDepartment: boolean;
  agentCount: number;
  onComplete: () => void;
}

const confettiColors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#facc15",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#a78bfa",
];

const ConfettiParticle = ({ delay, x }: { delay: number; x: number }) => {
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute top-0 rounded-sm"
      style={{
        left: `${x}%`,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        rotate: rotation,
      }}
      initial={{ y: -20, opacity: 1, scale: 1 }}
      animate={{
        y: ["0vh", "100vh"],
        opacity: [1, 1, 0],
        rotate: [rotation, rotation + 720],
        x: [0, (Math.random() - 0.5) * 200],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay: delay,
        ease: "easeIn",
      }}
    />
  );
};

const PostPaymentCelebration = ({ agentName, isDepartment, agentCount, onComplete }: PostPaymentCelebrationProps) => {
  const [phase, setPhase] = useState<"explode" | "message" | "exit">("explode");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("message"), 800);
    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(onComplete, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const confetti = Array.from({ length: 60 }, (_, i) => (
    <ConfettiParticle key={i} delay={Math.random() * 0.6} x={Math.random() * 100} />
  ));

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
        >
          {/* Confetti layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti}
          </div>

          {/* Glow pulse */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 text-center space-y-6 max-w-md px-6"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            {/* Icon cluster */}
            <div className="relative mx-auto w-24 h-24">
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.8 }}
              >
                <PartyPopper className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 1 }}
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              className="space-y-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-3xl font-display font-bold text-foreground">
                Pagamento Confirmado!
              </h2>
              <p className="text-lg text-muted-foreground">
                {isDepartment
                  ? `🚀 ${agentName} ativado com ${agentCount} agentes`
                  : `🚀 ${agentName} está pronto para trabalhar`}
              </p>
            </motion.div>

            {/* Redirect hint */}
            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <Rocket className="w-4 h-4 animate-pulse" />
              <span>Redirecionando para o THOR para configuração guiada...</span>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default PostPaymentCelebration;
