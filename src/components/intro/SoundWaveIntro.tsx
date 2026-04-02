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

  // Phase progression — tighter, more dramatic
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("pulse"), 600));
    timers.push(setTimeout(() => setPhase("wave"), 1800));
    timers.push(setTimeout(() => setPhase("intensify"), 4000));
    timers.push(setTimeout(() => {
      setPhase("glitch");
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 800);
    }, 6000));
    timers.push(setTimeout(() => setPhase("avatar"), 7000));
    timers.push(setTimeout(() => setPhase("speech"), 9500));
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
      className="fixed inset-0 z-[200] bg-black overflow-hidden cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Glitch screen flash */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 0.8, 0, 0.6, 0] }}
            transition={{ duration: 0.8, times: [0, 0.1, 0.15, 0.3, 0.35, 0.5, 1] }}
            className="absolute inset-0 z-[100] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(100,160,255,0.15) 0%, rgba(140,80,255,0.1) 50%, rgba(100,160,255,0.05) 100%)" }}
          />
        )}
      </AnimatePresence>

      {/* Central pulse on dark phase */}
      <AnimatePresence>
        {phase === "dark" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0.4], scale: [0, 0.5, 1] }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-10"
            style={{ background: "radial-gradient(circle, rgba(120,160,255,0.8) 0%, transparent 70%)", boxShadow: "0 0 60px 30px rgba(100,140,255,0.3)" }}
          />
        )}
      </AnimatePresence>

      {/* Pulse ring */}
      <AnimatePresence>
        {phase === "pulse" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.6, 0], scale: [0, 3] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-blue-400/50 z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Wave canvas */}
      <WaveCanvas intensity={intensity} mousePos={mousePos} particleMode={phaseIndex >= 2} />

      {/* Radial glow behind avatar */}
      {showAvatar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-[5]"
          style={{ background: "radial-gradient(circle, hsla(230,80%,50%,0.2) 0%, hsla(270,60%,40%,0.1) 40%, transparent 70%)" }}
        />
      )}

      {/* Thor avatar */}
      <AnimatePresence>
        {showAvatar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 40, filter: "blur(30px) brightness(3)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px) brightness(1)" }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[8%] md:top-[5%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <NeuralCore isSpeaking={showSpeech} size={320} />
            </div>
            {/* THOR label */}
            <p className="mt-2 text-[10px] md:text-xs font-mono tracking-[0.4em] text-white/40 uppercase">
              Thor
            </p>
            {/* SPEAKING status */}
            <AnimatePresence>
              {showSpeech && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-1 text-[9px] md:text-[10px] font-mono tracking-[0.5em] text-red-500 uppercase"
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
                  className="mt-3 flex items-center justify-center gap-[2px]"
                >
                  {Array.from({ length: 32 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="w-[2px] rounded-full bg-red-500/80"
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
        )}
      </AnimatePresence>

      {/* Speech */}
      <div className="absolute bottom-[20%] md:bottom-[18%] left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-6 text-center">
        <AnimatePresence mode="sync">
          {showSpeech && (
            <div className="space-y-5">
              {SPEECH_LINES.map((line, i) =>
                i < visibleLines ? (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`font-display leading-relaxed tracking-wider ${
                      i === 0 ? "text-white font-bold text-lg md:text-2xl" :
                      i === 3 ? "text-blue-300 font-semibold text-lg md:text-2xl" :
                      "text-white/70 text-base md:text-xl"
                    }`}
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
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[6%] md:bottom-[8%] left-1/2 -translate-x-1/2 z-30"
          >
            <Button
              onClick={handleComplete}
              className="group relative h-16 px-12 rounded-2xl bg-transparent text-white font-display font-bold text-lg md:text-xl border border-blue-500/40 backdrop-blur-md hover:border-blue-400/70 transition-all duration-700 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-50 transition-opacity duration-700"
                style={{ background: "linear-gradient(135deg, hsla(220,80%,50%,0.5), hsla(270,70%,50%,0.5), hsla(220,80%,50%,0.5))" }}
                animate={{ backgroundPosition: ["0% 0%", "200% 200%"] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.span
                className="relative z-10 flex items-center gap-4"
                animate={{ x: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              >
                Entrar na experiência
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-500" />
              </motion.span>
              <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_25px_hsla(220,70%,50%,0.08),0_0_40px_hsla(220,70%,50%,0.15)] group-hover:shadow-[inset_0_0_40px_hsla(220,70%,50%,0.15),0_0_80px_hsla(220,70%,50%,0.3)] transition-shadow duration-700" />
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
