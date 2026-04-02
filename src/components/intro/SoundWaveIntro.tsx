import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaveCanvas from "./WaveCanvas";
import thorHologram from "@/assets/thor-hologram.png";

type Phase = "dark" | "wave" | "intensify" | "avatar" | "speech" | "cta";

const SPEECH_LINES = [
  "Oi… eu sou o Thor…",
  "CEO da Clauthor…",
  "Eu vou te mostrar o futuro…",
  "Seja bem-vindo.",
];

interface SoundWaveIntroProps {
  onComplete: () => void;
}

const SoundWaveIntro = ({ onComplete }: SoundWaveIntroProps) => {
  const [phase, setPhase] = useState<Phase>("dark");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [visibleLines, setVisibleLines] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [avatarOpacity, setAvatarOpacity] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const ttsPlayedRef = useRef(false);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("wave"), 800));
    timers.push(setTimeout(() => setPhase("intensify"), 3500));
    timers.push(setTimeout(() => {
      setPhase("avatar");
      // Gradual avatar reveal
      let op = 0;
      const interval = setInterval(() => {
        op += 0.02;
        setAvatarOpacity(Math.min(op, 1));
        if (op >= 1) clearInterval(interval);
      }, 50);
    }, 6000));
    timers.push(setTimeout(() => setPhase("speech"), 8500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Speech lines
  useEffect(() => {
    if (phase !== "speech") return;
    const delays = [0, 2200, 4200, 6200];
    const timers = delays.map((d, i) =>
      setTimeout(() => setVisibleLines(i + 1), d)
    );
    const ctaTimer = setTimeout(() => setPhase("cta"), 8500);
    return () => { timers.forEach(clearTimeout); clearTimeout(ctaTimer); };
  }, [phase]);

  // Web Audio sub-bass
  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      gainRef.current = gain;

      // Sub-bass oscillator
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = 40;
      osc1.connect(gain);
      osc1.start();

      // Harmonic layer
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 80;
      const g2 = ctx.createGain();
      g2.gain.value = 0.3;
      osc2.connect(g2);
      g2.connect(gain);
      osc2.start();

      // High shimmer
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = 220;
      const g3 = ctx.createGain();
      g3.gain.value = 0.05;
      osc3.connect(g3);
      g3.connect(gain);
      osc3.start();

      oscillatorsRef.current = [osc1, osc2, osc3];

      // Fade in
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
    } catch {
      // Audio not available
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
      setTimeout(() => {
        oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
      }, 600);
    }
  }, []);

  // Toggle sound
  useEffect(() => {
    if (soundOn) {
      startAudio();
    } else {
      stopAudio();
    }
  }, [soundOn, startAudio, stopAudio]);

  // Adjust audio based on phase
  useEffect(() => {
    if (!gainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    const now = ctx.currentTime;

    if (phase === "intensify") {
      gain.gain.linearRampToValueAtTime(0.25, now + 1);
      oscillatorsRef.current[0]?.frequency.linearRampToValueAtTime(55, now + 2);
    } else if (phase === "avatar") {
      gain.gain.linearRampToValueAtTime(0.12, now + 1);
    } else if (phase === "speech") {
      gain.gain.linearRampToValueAtTime(0.06, now + 0.5);
    }
  }, [phase]);

  // TTS
  useEffect(() => {
    if (!soundOn || phase !== "speech" || ttsPlayedRef.current) return;
    ttsPlayedRef.current = true;
    const playTTS = async () => {
      try {
        const text = "Oi. Eu sou o Thor, CEO da Clauthor. Eu vou te mostrar o futuro. Seja bem-vindo.";
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text, voiceId: "JBFqnCBsd6RMkjVDRZzb" }),
          }
        );
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {});
      } catch { /* TTS optional */ }
    };
    playTTS();
  }, [soundOn, phase]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) setMousePos({ x: touch.clientX / window.innerWidth, y: touch.clientY / window.innerHeight });
  }, []);

  const intensity = phase === "dark" ? 0 : phase === "wave" ? 0.3 : phase === "intensify" ? 0.8 : phase === "avatar" ? 0.6 : phase === "speech" ? 0.4 : 0.5;

  const handleComplete = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    stopAudio();
    onComplete();
  };

  // Cleanup
  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black overflow-hidden cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      {/* Wave visualization */}
      <WaveCanvas
        intensity={intensity}
        mousePos={mousePos}
        particleMode={phase !== "dark"}
      />

      {/* Radial glow behind avatar area */}
      <AnimatePresence>
        {(phase === "avatar" || phase === "speech" || phase === "cta") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none z-[5]"
            style={{
              background: "radial-gradient(circle, hsla(220,80%,50%,0.15) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Thor avatar — built from wave energy */}
      <AnimatePresence>
        {(phase === "avatar" || phase === "speech" || phase === "cta") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(20px) brightness(2)" }}
            animate={{
              opacity: avatarOpacity,
              scale: 1,
              filter: `blur(${(1 - avatarOpacity) * 15}px) brightness(${1 + (1 - avatarOpacity) * 1.5})`,
            }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[8%] md:top-[5%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
          >
            <div className="relative">
              {/* Energy pulse rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 -m-10 rounded-full border border-[hsl(220,70%,50%)]/30 z-0"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 -m-16 rounded-full border border-[hsl(260,60%,50%)]/20 z-0"
              />
              {/* Glow */}
              <div className="absolute inset-0 -m-8 rounded-full bg-[hsl(220,70%,50%)] opacity-20 blur-[50px] animate-pulse" />
              {/* Avatar with scan-line effect */}
              <div className="relative">
                <img
                  src={thorHologram}
                  alt="Thor — CEO da Clauthor"
                  className="w-44 h-auto md:w-56 relative z-10"
                  style={{
                    filter: `drop-shadow(0 0 25px hsla(220,80%,60%,0.5)) drop-shadow(0 0 50px hsla(260,60%,50%,0.2))`,
                    mixBlendMode: "screen",
                  }}
                />
                {/* Scan line overlay */}
                <div
                  className="absolute inset-0 z-20 pointer-events-none opacity-10"
                  style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100,160,255,0.1) 2px, rgba(100,160,255,0.1) 4px)",
                  }}
                />
              </div>
              {/* Rotating rings */}
              <motion.div
                animate={{ rotateZ: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 md:w-64 md:h-64 rounded-full border border-[hsl(220,70%,50%)]/15 z-0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech lines — cinematic typographic reveal */}
      <div className="absolute bottom-[22%] md:bottom-[20%] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-6 text-center">
        <AnimatePresence mode="sync">
          {(phase === "speech" || phase === "cta") && (
            <div className="space-y-4">
              {SPEECH_LINES.map((line, i) =>
                i < visibleLines ? (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className={`font-display leading-relaxed tracking-wide ${
                      i === 0 ? "text-white font-bold text-base md:text-xl" :
                      i === 3 ? "text-[hsl(220,70%,70%)] font-semibold text-base md:text-xl" :
                      "text-white/75 text-sm md:text-lg"
                    }`}
                  >
                    {line}
                  </motion.p>
                ) : null
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA — emerges from wave */}
      <AnimatePresence>
        {phase === "cta" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[8%] md:bottom-[10%] left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={handleComplete}
              className="group relative h-14 px-10 rounded-2xl bg-transparent text-white font-display font-bold text-base md:text-lg border border-[hsl(220,70%,50%)]/50 backdrop-blur-sm hover:border-[hsl(220,70%,60%)] transition-all duration-500 overflow-hidden"
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, hsla(220,70%,50%,0.4), hsla(260,60%,50%,0.4))",
                }}
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              />
              {/* Vibration effect */}
              <motion.span
                className="relative z-10 flex items-center gap-3"
                animate={{ x: [0, 1, -1, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                Entrar na experiência
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
              {/* Edge glow */}
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_hsla(220,70%,50%,0.1),0_0_30px_hsla(220,70%,50%,0.15)] group-hover:shadow-[inset_0_0_30px_hsla(220,70%,50%,0.2),0_0_50px_hsla(220,70%,50%,0.3)] transition-shadow duration-500" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 3 }}
        onClick={handleComplete}
        className="absolute top-6 right-6 z-50 text-white/30 hover:text-white text-[10px] font-mono tracking-[0.2em] transition-colors uppercase"
      >
        Pular →
      </motion.button>

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => setSoundOn(s => !s)}
        className="absolute top-6 left-6 z-50 text-white/30 hover:text-white transition-colors p-2"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </motion.button>

      {/* Brand mark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 4 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30"
      >
        <p className="text-[9px] font-mono text-white/15 tracking-[0.4em] uppercase">
          Clauthor AI Platform
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SoundWaveIntro;
