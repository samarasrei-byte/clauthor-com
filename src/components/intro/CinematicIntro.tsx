import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import LightningCanvas from "./LightningCanvas";
import ParticleField from "./ParticleField";
import thorHologram from "@/assets/thor-hologram.png";

const SPEECH_LINES = [
  "Oi. Eu sou o Thor, CEO da Clauthor.",
  "Seja muito bem-vindo.",
  "Eu quero te mostrar algo que pode mudar completamente a forma como você cria.",
];

const LINE_DELAYS = [0, 2200, 4400]; // ms after avatar appears

interface CinematicIntroProps {
  onComplete: () => void;
}

const CinematicIntro = ({ onComplete }: CinematicIntroProps) => {
  const [phase, setPhase] = useState<"dark" | "lightning" | "avatar" | "speech" | "cta">("dark");
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [shake, setShake] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("lightning"), 1200);
    return () => clearTimeout(t1);
  }, []);

  const handleStrikeComplete = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setTimeout(() => setPhase("avatar"), 600);
  }, []);

  // Avatar → speech → cta
  useEffect(() => {
    if (phase !== "avatar") return;
    const t = setTimeout(() => setPhase("speech"), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "speech") return;
    const timers = LINE_DELAYS.map((delay, i) =>
      setTimeout(() => setVisibleLines(i + 1), delay)
    );
    const ctaTimer = setTimeout(() => setPhase("cta"), LINE_DELAYS[2] + 3000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(ctaTimer);
    };
  }, [phase]);

  // TTS playback (only if user enabled sound)
  useEffect(() => {
    if (!soundOn || phase !== "speech") return;
    if (audioPlaying) return;

    const playTTS = async () => {
      try {
        setAudioPlaying(true);
        const text = SPEECH_LINES.join(" ");
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              text,
              voiceId: "JBFqnCBsd6RMkjVDRZzb",
            }),
          }
        );
        if (!response.ok) return;
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {});
      } catch {
        // TTS is optional, fail silently
      }
    };
    playTTS();
  }, [soundOn, phase, audioPlaying]);

  const handleSkip = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    onComplete();
  };

  const handleCTA = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    onComplete();
  };

  return (
    <motion.div
      className={`fixed inset-0 z-[200] bg-black overflow-hidden ${shake ? "animate-shake" : ""}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[hsl(220,60%,6%)] via-black to-black" />

      {/* Particle field - always visible */}
      <ParticleField />

      {/* Lightning strike */}
      <LightningCanvas
        active={phase === "lightning" || phase === "avatar"}
        onStrikeComplete={handleStrikeComplete}
      />

      {/* Central light point before lightning */}
      <AnimatePresence>
        {phase === "dark" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-5"
          >
            <div className="w-3 h-3 rounded-full bg-[hsl(220,80%,70%)] shadow-[0_0_40px_20px_hsla(220,80%,60%,0.4)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Impact ring */}
      <AnimatePresence>
        {(phase === "avatar" || phase === "speech" || phase === "cta") && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-[hsl(220,70%,60%)] z-5"
          />
        )}
      </AnimatePresence>

      {/* Thor Avatar */}
      <AnimatePresence>
        {(phase === "avatar" || phase === "speech" || phase === "cta") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[15%] md:top-[10%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
          >
            {/* Energy glow behind avatar */}
            <div className="relative">
              <div className="absolute inset-0 -m-8 rounded-full bg-[hsl(220,70%,50%)] opacity-20 blur-[60px] animate-pulse" />
              <div className="absolute inset-0 -m-4 rounded-full bg-[hsl(260,60%,40%)] opacity-15 blur-[40px] animate-pulse" style={{ animationDelay: "0.5s" }} />
              <img
                src={thorHologram}
                alt="Thor - CEO da Clauthor"
                className="w-48 h-auto md:w-64 drop-shadow-[0_0_30px_hsla(220,80%,60%,0.5)] relative z-10"
                style={{
                  filter: "drop-shadow(0 0 20px hsla(220, 80%, 60%, 0.3))",
                }}
              />
              {/* Floating energy ring */}
              <motion.div
                animate={{ rotateZ: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 md:w-72 md:h-72 rounded-full border border-[hsl(220,70%,50%)]/20 z-0"
              />
              <motion.div
                animate={{ rotateZ: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 rounded-full border border-[hsl(260,60%,50%)]/10 z-0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech text - Apple keynote style */}
      <div className="absolute bottom-[22%] md:bottom-[20%] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-6 text-center">
        <AnimatePresence mode="sync">
          {phase === "speech" || phase === "cta" ? (
            <div className="space-y-3">
              {SPEECH_LINES.map((line, i) =>
                i < visibleLines ? (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`font-display text-sm md:text-lg leading-relaxed ${
                      i === 0
                        ? "text-white font-bold"
                        : i === 2
                        ? "text-[hsl(220,70%,70%)] font-medium"
                        : "text-white/80"
                    }`}
                  >
                    {line}
                  </motion.p>
                ) : null
              )}
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <AnimatePresence>
        {phase === "cta" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[8%] md:bottom-[10%] left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={handleCTA}
              className="group relative h-14 px-8 rounded-2xl bg-gradient-to-r from-[hsl(220,70%,50%)] to-[hsl(260,60%,50%)] text-white font-display font-bold text-base md:text-lg border-0 shadow-[0_0_40px_hsla(220,70%,50%,0.3)] hover:shadow-[0_0_60px_hsla(220,70%,50%,0.5)] transition-shadow duration-500"
            >
              <span className="relative z-10 flex items-center gap-2">
                Quero ver o futuro
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Hover energy glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[hsl(220,70%,60%)] to-[hsl(260,60%,60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 text-white/40 hover:text-white text-xs font-mono tracking-wider transition-colors"
      >
        PULAR INTRO →
      </motion.button>

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => setSoundOn((s) => !s)}
        className="absolute top-6 left-6 z-50 text-white/40 hover:text-white transition-colors p-2"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </motion.button>

      {/* Bottom brand mark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 3 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30"
      >
        <p className="text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">
          Clauthor AI Platform
        </p>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-3px) translateY(2px); }
          20% { transform: translateX(5px) translateY(-1px); }
          30% { transform: translateX(-4px) translateY(3px); }
          40% { transform: translateX(2px) translateY(-2px); }
          50% { transform: translateX(-1px) translateY(1px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </motion.div>
  );
};

export default CinematicIntro;
