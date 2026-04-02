import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuralCore } from "@/components/thor/ThorUI";

type Phase = "dark" | "pulse" | "avatar" | "speech" | "cta";

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
  const [visibleLines, setVisibleLines] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const ttsPlayedRef = useRef(false);

  // Immediate phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("pulse"), 200));
    timers.push(setTimeout(() => setPhase("avatar"), 500));
    timers.push(setTimeout(() => setPhase("speech"), 1200));
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

  useEffect(() => {
    if (!gainRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    const now = ctx.currentTime;
    if (phase === "avatar") gain.gain.linearRampToValueAtTime(0.12, now + 1);
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

  const handleComplete = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    stopAudio();
    onComplete();
  };

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  const phaseIndex = ["dark", "pulse", "avatar", "speech", "cta"].indexOf(phase);
  const showAvatar = phaseIndex >= 2;
  const showSpeech = phaseIndex >= 3;

  // Floating particles for epic background
  const floatingParticles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 4 + Math.random() * 8,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black overflow-hidden select-none flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Epic background glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Central radial glow - massive */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(0,80%,40%,0.25) 0%, hsla(0,70%,30%,0.1) 30%, transparent 70%)" }}
          animate={{
            scale: showSpeech ? [1, 1.15, 1] : [1, 1.05, 1],
            opacity: showSpeech ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Secondary pulsing ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-red-500/10"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating particles */}
        {floatingParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-red-500/30"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0, 0.6, 0],
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* NeuralCore orb */}
      <AnimatePresence>
        {showAvatar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, filter: "blur(30px) brightness(3)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
            style={{
              "--accent-violet": "0 85% 50%",
              "--accent-cyan": "0 70% 40%",
            } as React.CSSProperties}
          >
            {/* Outer massive glow behind orb */}
            <div className="relative">
              <motion.div
                className="absolute -inset-16 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, hsla(0,80%,50%,0.15) 0%, transparent 70%)" }}
                animate={showSpeech ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                } : { opacity: 0.3 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <NeuralCore isSpeaking={showSpeech} size={384} />
              </div>
            </div>

            {/* THOR label */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mt-4 text-[10px] md:text-xs font-mono tracking-[0.5em] text-white/50 uppercase"
            >
              Thor
            </motion.p>

            {/* SPEAKING status */}
            <AnimatePresence>
              {showSpeech && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: [0.4, 1, 0.4], y: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-1.5 text-[9px] md:text-[10px] font-mono tracking-[0.5em] uppercase"
                  style={{ color: "hsl(0, 85%, 55%)" }}
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
                  {Array.from({ length: 40 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{ backgroundColor: "hsla(0, 80%, 50%, 0.8)" }}
                      animate={{
                        height: [
                          3 + Math.random() * 3,
                          6 + Math.random() * 22,
                          3 + Math.random() * 5,
                          8 + Math.random() * 16,
                        ],
                      }}
                      transition={{
                        duration: 0.3 + Math.random() * 0.3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.015,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech text */}
      <div className="absolute bottom-[22%] md:bottom-[20%] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-6 text-center">
        <AnimatePresence mode="sync">
          {showSpeech && (
            <div className="space-y-4">
              {SPEECH_LINES.map((line, i) =>
                i < visibleLines ? (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className={`font-display leading-relaxed tracking-wider ${
                      i === 0 ? "text-white font-bold text-lg md:text-2xl" :
                      i === 3 ? "font-semibold text-lg md:text-2xl" :
                      "text-white/60 text-base md:text-xl"
                    }`}
                    style={i === 3 ? { color: "hsl(0, 70%, 65%)" } : undefined}
                  >
                    {line.text}
                  </motion.p>
                ) : null
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

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
              className="group h-14 px-10 rounded-2xl bg-transparent text-white font-display font-bold text-base md:text-lg border border-white/20 backdrop-blur-md hover:border-red-500/50 transition-all duration-500"
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
        transition={{ delay: 2 }}
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
        transition={{ delay: 1 }}
        onClick={() => setSoundOn(s => !s)}
        className="absolute top-6 left-6 z-50 text-white/20 hover:text-white transition-colors p-2"
      >
        {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </motion.button>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 4 }}
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
