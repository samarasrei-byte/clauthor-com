import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuralCore } from "@/components/thor/ThorUI";

type Phase = "tap" | "dark" | "reveal" | "speaking" | "cta";

const SPEECH_LINES = [
  { text: "Seja bem-vindo.", delay: 0, style: "welcome" },
  { text: "Eu sou o Thor, CEO da Clauthor.", delay: 2200, style: "normal" },
  { text: "Eu vou te mostrar o futuro.", delay: 4400, style: "normal" },
];

interface SoundWaveIntroProps {
  onComplete: () => void;
}

const SoundWaveIntro = ({ onComplete }: SoundWaveIntroProps) => {
  const [phase, setPhase] = useState<Phase>("tap");
  const [visibleLines, setVisibleLines] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const ttsPlayedRef = useRef(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // After user taps: dark → reveal → speaking → cta
  useEffect(() => {
    if (phase !== "dark") return;
    const t1 = setTimeout(() => setPhase("reveal"), 300);
    const t2 = setTimeout(() => setPhase("speaking"), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Speech lines + CTA
  useEffect(() => {
    if (phase !== "speaking") return;
    const timers = SPEECH_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    const ctaTimer = setTimeout(() => setPhase("cta"), 7500);
    return () => { timers.forEach(clearTimeout); clearTimeout(ctaTimer); };
  }, [phase]);

  // Ambient audio engine
  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      gainRef.current = gain;
      [32, 64, 128, 256].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = [1, 0.5, 0.15, 0.04][i];
        osc.connect(g);
        g.connect(gain);
        osc.start();
        oscillatorsRef.current.push(osc);
      });
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
    } catch {}
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

  // TTS — triggered after user tap (guaranteed interaction context)
  const playTTS = useCallback(async () => {
    if (ttsPlayedRef.current) return;
    ttsPlayedRef.current = true;
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
          body: JSON.stringify({
            text: "Seja bem-vindo. Eu sou o Thor, CEO da Clauthor. Eu vou te mostrar o futuro.",
            voiceId: "57fRHlU547szfU1IrRoS",
          }),
        }
      );
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("audio")) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.muted = !soundOn;
      await audio.play();
    } catch {
      // TTS optional
    }
  }, [soundOn]);

  // Handle the initial tap — this is the USER INTERACTION that unlocks audio on mobile
  const handleStart = useCallback(() => {
    setPhase("dark");
    // Start ambient sound immediately (within user gesture)
    if (soundOn) startAudio();
    // Start TTS fetch + play (within user gesture context)
    playTTS();
  }, [soundOn, startAudio, playTTS]);

  // Toggle sound
  const toggleSound = useCallback((newState: boolean) => {
    setSoundOn(newState);
    if (newState) {
      startAudio();
    } else {
      stopAudio();
    }
    // Mute/unmute TTS audio if playing
    if (ttsAudioRef.current) {
      ttsAudioRef.current.muted = !newState;
    }
  }, [startAudio, stopAudio]);

  const handleComplete = () => {
    localStorage.setItem("clauthor_intro_seen", "true");
    stopAudio();
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    onComplete();
  };

  useEffect(() => () => { stopAudio(); }, [stopAudio]);

  const isRevealed = phase !== "dark" && phase !== "tap";
  const isSpeaking = phase === "speaking" || phase === "cta";

  // Background particles
  const particles = useMemo(() =>
    Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      dur: 5 + Math.random() * 10,
      delay: Math.random() * 6,
    })), []
  );

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* ═══ TAP TO START — Mobile audio unlock ═══ */}
      <AnimatePresence>
        {phase === "tap" && (
          <motion.div
            className="absolute inset-0 z-[210] flex flex-col items-center justify-center cursor-pointer"
            onClick={handleStart}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Subtle background pulse */}
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, hsla(0,80%,40%,0.15) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Small NeuralCore preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                "--accent-violet": "0 85% 50%",
                "--accent-cyan": "0 70% 40%",
                width: 120,
                height: 120,
              } as React.CSSProperties}
            >
              <NeuralCore isSpeaking={false} size={120} />
            </motion.div>

            {/* Play button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  border: "1px solid hsla(0, 60%, 50%, 0.4)",
                  background: "hsla(0, 60%, 40%, 0.1)",
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Play className="h-6 w-6 ml-1" style={{ color: "hsl(0, 70%, 55%)" }} />
              </motion.div>
              <p
                className="text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: "hsla(0, 50%, 60%, 0.6)" }}
              >
                Toque para iniciar
              </p>
            </motion.div>

            {/* Brand */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ delay: 1 }}
              className="absolute bottom-6 text-[8px] font-mono text-white/10 tracking-[0.5em] uppercase"
            >
              Clauthor AI Platform
            </motion.p>

            {/* Skip on tap screen too */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              whileHover={{ opacity: 0.9 }}
              transition={{ delay: 2 }}
              onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              className="absolute top-5 right-5 z-50 text-white/15 hover:text-white text-[8px] font-mono tracking-[0.3em] transition-all duration-300 uppercase"
            >
              Pular →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BACKGROUND LAYER ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(0,90%,30%,0.3) 0%, hsla(0,80%,20%,0.15) 25%, hsla(0,60%,15%,0.05) 50%, transparent 70%)" }}
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : [0.9, 1, 0.9],
            opacity: isSpeaking ? [0.7, 1, 0.7] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: "1px solid hsla(0, 60%, 50%, 0.06)" }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full"
          style={{ border: "1px solid hsla(0, 50%, 45%, 0.08)" }}
          animate={{ scale: [1.1, 1.5, 1.1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              backgroundColor: "hsla(0, 70%, 50%, 0.4)",
            }}
            animate={{
              y: [-30, 30, -30],
              x: [-15, 15, -15],
              opacity: [0, 0.5, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ═══ NEURAL CORE ═══ */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.2, filter: "blur(40px) brightness(4)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[5%] z-20 flex flex-col items-center"
            style={{
              "--accent-violet": "0 85% 50%",
              "--accent-cyan": "0 70% 40%",
              left: "50%",
              marginLeft: -190,
            } as React.CSSProperties}
          >
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 500, height: 500,
                top: -60, left: -60,
                background: "radial-gradient(circle, hsla(0,80%,45%,0.2) 0%, hsla(0,70%,35%,0.08) 40%, transparent 65%)",
              }}
              animate={isSpeaking ? {
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6],
              } : { scale: 1, opacity: 0.4 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div style={{ width: 380, height: 380, position: "relative" }}>
              <NeuralCore isSpeaking={true} size={380} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BOTTOM SECTION ═══ */}
      {phase !== "tap" && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-30 pb-6">
          <AnimatePresence>
            {isRevealed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.8, duration: 1.5 }}
                className="text-[10px] md:text-xs font-mono tracking-[0.5em] text-white/40 uppercase mb-1"
              >
                Thor
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSpeaking && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[9px] md:text-[10px] font-mono tracking-[0.5em] uppercase mb-3"
                style={{ color: "hsl(0, 85%, 55%)" }}
              >
                Speaking
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-[1.5px] mb-8"
              >
                {Array.from({ length: 48 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-[1.5px] md:w-[2px] rounded-full"
                    style={{ backgroundColor: "hsla(0, 80%, 50%, 0.7)" }}
                    animate={{
                      height: [
                        2 + Math.random() * 3,
                        5 + Math.random() * 20,
                        2 + Math.random() * 4,
                        7 + Math.random() * 15,
                      ],
                    }}
                    transition={{
                      duration: 0.25 + Math.random() * 0.25,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.01,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full max-w-md px-6 text-center mb-6">
            <AnimatePresence mode="sync">
              {isSpeaking && SPEECH_LINES.map((line, i) =>
                i < visibleLines ? (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`mb-3 font-display leading-relaxed tracking-wide ${
                      line.style === "welcome"
                        ? "font-bold text-lg md:text-2xl"
                        : "text-white font-medium text-sm md:text-lg"
                    }`}
                    style={line.style === "welcome" ? { color: "hsl(0, 70%, 55%)" } : undefined}
                  >
                    {line.text}
                  </motion.p>
                ) : null
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {phase === "cta" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <Button
                  onClick={handleComplete}
                  className="group h-14 px-10 rounded-2xl bg-transparent text-white font-display font-bold text-sm md:text-base border backdrop-blur-md transition-all duration-500 hover:scale-105"
                  style={{ borderColor: "hsla(0, 50%, 50%, 0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsla(0, 60%, 55%, 0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsla(0, 50%, 50%, 0.3)")}
                >
                  <span className="flex items-center gap-3">
                    Entrar na experiência
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ delay: 5 }}
            className="text-[7px] font-mono text-white/10 tracking-[0.5em] uppercase"
          >
            Clauthor AI Platform
          </motion.p>
        </div>
      )}

      {/* ═══ TOP CONTROLS (after tap) ═══ */}
      {phase !== "tap" && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            whileHover={{ opacity: 0.9 }}
            transition={{ delay: 2 }}
            onClick={handleComplete}
            className="absolute top-5 right-5 z-50 text-white/15 hover:text-white text-[8px] font-mono tracking-[0.3em] transition-all duration-300 uppercase"
          >
            Pular →
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            whileHover={{ opacity: 0.9 }}
            transition={{ delay: 1 }}
            onClick={() => toggleSound(!soundOn)}
            className="absolute top-5 left-5 z-50 text-white/15 hover:text-white transition-all duration-300 p-2"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </motion.button>
        </>
      )}
    </motion.div>
  );
};

export default SoundWaveIntro;
