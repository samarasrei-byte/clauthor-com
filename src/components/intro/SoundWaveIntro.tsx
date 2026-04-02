import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaveCanvas from "./WaveCanvas";
import { NeuralCore } from "@/components/thor/ThorUI";

type Phase = "dark" | "pulse" | "wave" | "intensify" | "glitch" | "avatar" | "speech" | "cta";

const SPEECH_LINES = [
  { text: "Oi… eu sou o Thor…", delay: 0 },
  { text: "CEO da Clauthor…", delay: 2000 },
  { text: "Eu vou te mostrar o futuro…", delay: 4000 },
  { text: "Seja bem-vindo.", delay: 6000 },
];

interface SoundWaveIntroProps {
  onComplete: () => void;
}

const SoundWaveIntro = ({ onComplete }: SoundWaveIntroProps) => {
  const [phase, setPhase] = useState<Phase>("dark");
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [visibleLines, setVisibleLines] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const ttsPlayedRef = useRef(false);

  // Phase progression — immediate Thor speaking
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("pulse"), 300));
    timers.push(setTimeout(() => setPhase("avatar"), 800));
    timers.push(setTimeout(() => setPhase("speech"), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Speech lines
  useEffect(() => {
    if (phase !== "speech") return;
    const timers = SPEECH_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    const ctaTimer = setTimeout(() => setPhase("cta"), 8500);
    return () => { timers.forEach(clearTimeout); clearTimeout(ctaTimer); };
  }, [phase]);

  // Web Audio
  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      gainRef.current = gain;

      const freqs = [32, 64, 128, 256];
      const volumes = [1, 0.5, 0.15, 0.04];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = volumes[i];
        osc.connect(g);
        g.connect(gain);
        osc.start();
        oscillatorsRef.current.push(osc);
      });

      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
    } catch { /* no audio */ }
  }, []);

  const stopAudio = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
      setTimeout(() => {
        oscillatorsRef.current.forEach(o => { try { o.stop(); } catch {} });
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        oscillatorsRef.current = [];
      }, 600);
    }
  }, []);

  useEffect(() => {
    if (soundOn) startAudio(); else stopAudio();
  }, [soundOn, startAudio, stopAudio]);

  // Audio dynamics per phase
  useEffect(() => {
    if (!gainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    const now = ctx.currentTime;
    if (phase === "intensify") gain.gain.linearRampToValueAtTime(0.3, now + 1);
    else if (phase === "glitch") gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    else if (phase === "avatar") gain.gain.linearRampToValueAtTime(0.12, now + 1);
    else if (phase === "speech") gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
  }, [phase]);

  // TTS
  useEffect(() => {
    if (!soundOn || phase !== "speech" || ttsPlayedRef.current) return;
    ttsPlayedRef.current = true;
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: "Oi. Eu sou o Thor, CEO da Clauthor. Eu vou te mostrar o futuro. Seja bem-vindo.", voiceId: "JBFqnCBsd6RMkjVDRZzb" }),
          }
        );
        if (!res.ok) return;
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play().catch(() => {});
      } catch {}
    })();
  }, [soundOn, phase]);

  // Mouse
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) setMousePos({ x: t.clientX / window.innerWidth, y: t.clientY / window.innerHeight });
  }, []);

  const intensity =
    phase === "dark" ? 0 :
    phase === "pulse" ? 0.1 :
    phase === "wave" ? 0.4 :
    phase === "intensify" ? 1.0 :
    phase === "glitch" ? 1.2 :
    phase === "avatar" ? 0.6 :
    phase === "speech" ? 0.35 : 0.45;

  const handleComplete = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    stopAudio();
    onComplete();
  };

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  const phaseIndex = ["dark", "pulse", "wave", "intensify", "glitch", "avatar", "speech", "cta"].indexOf(phase);
  const showAvatar = phaseIndex >= 5;
  const showSpeech = phaseIndex >= 6;

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black overflow-hidden select-none flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* NeuralCore orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
        style={{
          "--accent-violet": "0 85% 50%",
          "--accent-cyan": "0 70% 40%",
        } as React.CSSProperties}
      >
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          <NeuralCore isSpeaking={showSpeech} size={384} />
        </div>

        {/* THOR label */}
        <p className="mt-4 text-[10px] md:text-xs font-mono tracking-[0.4em] text-white/40 uppercase">
          Thor
        </p>

        {/* SPEAKING status */}
        <AnimatePresence>
          {showSpeech && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-1 text-[9px] md:text-[10px] font-mono tracking-[0.5em] text-destructive uppercase"
            >
              Speaking
            </motion.p>
          )}
        </AnimatePresence>

        {/* Waveform bars */}
        <AnimatePresence>
          {showSpeech && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="mt-4 flex items-center justify-center gap-[2px]"
            >
              {Array.from({ length: 32 }, (_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full bg-destructive/80"
                  animate={{
                    height: [
                      4 + Math.random() * 4,
                      8 + Math.random() * 18,
                      4 + Math.random() * 6,
                      10 + Math.random() * 14,
                    ],
                  }}
                  transition={{
                    duration: 0.4 + Math.random() * 0.4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.02,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <AnimatePresence>
        {phase === "cta" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={handleComplete}
              className="group h-14 px-10 rounded-2xl bg-transparent text-white font-display font-bold text-base md:text-lg border border-white/20 backdrop-blur-md hover:border-white/50 transition-all duration-500"
            >
              <span className="flex items-center gap-3">
                Entrar na experiência
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 3 }}
        onClick={handleComplete}
        className="absolute top-6 right-6 z-50 text-white/20 hover:text-white text-[9px] font-mono tracking-[0.3em] transition-colors uppercase"
      >
        Pular →
      </motion.button>

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => setSoundOn(s => !s)}
        className="absolute top-6 left-6 z-50 text-white/20 hover:text-white transition-colors p-2"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </motion.button>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 5 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30"
      >
        <p className="text-[8px] font-mono text-white/10 tracking-[0.5em] uppercase">
          Clauthor AI Platform
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SoundWaveIntro;
