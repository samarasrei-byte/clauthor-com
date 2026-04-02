import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuralCore } from "@/components/thor/ThorUI";

type Phase = "tap" | "dark" | "reveal" | "speaking" | "showcase" | "cta";

const SPEECH_LINES = [
  { text: "Seja bem-vindo.", delay: 0, style: "welcome" as const },
  { text: "Eu sou o Thor.", delay: 1800, style: "normal" as const },
  { text: "CEO de IA da Clauthor.", delay: 3200, style: "accent" as const },
  { text: "200 agentes autônomos.", delay: 5200, style: "stat" as const },
  { text: "12 departamentos.", delay: 6400, style: "stat" as const },
  { text: "Uma força de trabalho inteira.", delay: 7600, style: "highlight" as const },
  { text: "Pronta pra sua empresa.", delay: 9200, style: "highlight" as const },
];

const TTS_TEXT =
  "Seja bem-vindo. Eu sou o Thor, CEO de inteligência artificial da Clauthor. Imagine 200 agentes autônomos, cobrindo 12 departamentos da sua empresa. Uma força de trabalho completa, pronta para começar agora.";

const SHOWCASE_ITEMS = [
  { icon: "🧠", label: "Vendas", desc: "SDR, Closer, Follow-up" },
  { icon: "📊", label: "Marketing", desc: "Conteúdo, Ads, Social" },
  { icon: "🛡️", label: "Segurança", desc: "Auditoria, Monitoramento" },
  { icon: "💰", label: "Financeiro", desc: "CFO, Análise, Relatórios" },
];

interface SoundWaveIntroProps {
  onComplete: () => void;
}

const SoundWaveIntro = ({ onComplete }: SoundWaveIntroProps) => {
  const [phase, setPhase] = useState<Phase>("tap");
  const [visibleLines, setVisibleLines] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [ttsStatus, setTtsStatus] = useState<"idle" | "loading" | "playing" | "failed">("idle");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const ttsPlayedRef = useRef(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Phase flow: dark → reveal → speaking → showcase → cta
  useEffect(() => {
    if (phase !== "dark") return;
    const t1 = setTimeout(() => setPhase("reveal"), 400);
    const t2 = setTimeout(() => setPhase("speaking"), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  // Speech lines timing
  useEffect(() => {
    if (phase !== "speaking") return;
    const timers = SPEECH_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    const showcaseTimer = setTimeout(() => setPhase("showcase"), 11000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(showcaseTimer);
    };
  }, [phase]);

  // Showcase → CTA
  useEffect(() => {
    if (phase !== "showcase") return;
    const t = setTimeout(() => setPhase("cta"), 4000);
    return () => clearTimeout(t);
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
    } catch (e) {
      console.warn("[Intro] Ambient audio failed:", e);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
      setTimeout(() => {
        oscillatorsRef.current.forEach((o) => {
          try { o.stop(); } catch {}
        });
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        oscillatorsRef.current = [];
      }, 600);
    }
  }, []);

  // TTS
  const playTTS = useCallback(async () => {
    if (ttsPlayedRef.current) return;
    ttsPlayedRef.current = true;
    setTtsStatus("loading");
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
            text: TTS_TEXT,
            voiceId: "57fRHlU547szfU1IrRoS",
          }),
        }
      );
      if (!res.ok) {
        console.warn("[Intro TTS] API returned", res.status);
        setTtsStatus("failed");
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("audio")) {
        console.warn("[Intro TTS] Non-audio response:", contentType);
        setTtsStatus("failed");
        return;
      }
      const blob = await res.blob();
      if (blob.size < 200) {
        console.warn("[Intro TTS] Audio too small:", blob.size);
        setTtsStatus("failed");
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.muted = !soundOn;
      audio.onplay = () => setTtsStatus("playing");
      audio.onended = () => setTtsStatus("idle");
      audio.onerror = () => {
        console.warn("[Intro TTS] Playback error");
        setTtsStatus("failed");
      };
      await audio.play();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        console.warn("[Intro TTS] Autoplay blocked");
      } else {
        console.error("[Intro TTS] Error:", err);
      }
      setTtsStatus("failed");
    }
  }, [soundOn]);

  const handleStart = useCallback(() => {
    setPhase("dark");
    if (soundOn) startAudio();
    playTTS();
  }, [soundOn, startAudio, playTTS]);

  const toggleSound = useCallback(
    (newState: boolean) => {
      setSoundOn(newState);
      if (newState) startAudio();
      else stopAudio();
      if (ttsAudioRef.current) ttsAudioRef.current.muted = !newState;
    },
    [startAudio, stopAudio]
  );

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
  const isSpeaking = phase === "speaking" || phase === "showcase" || phase === "cta";

  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        dur: 5 + Math.random() * 10,
        delay: Math.random() * 6,
      })),
    []
  );

  const getLineClass = (style: string) => {
    switch (style) {
      case "welcome":
        return "font-bold text-xl md:text-3xl";
      case "accent":
        return "font-semibold text-sm md:text-lg";
      case "stat":
        return "font-mono font-bold text-base md:text-xl";
      case "highlight":
        return "font-display font-semibold text-sm md:text-lg";
      default:
        return "font-medium text-sm md:text-lg";
    }
  };

  const getLineColor = (style: string) => {
    switch (style) {
      case "welcome":
        return "hsl(0, 70%, 55%)";
      case "accent":
        return "hsl(0, 50%, 65%)";
      case "stat":
        return "hsl(0, 85%, 60%)";
      case "highlight":
        return "hsla(0, 0%, 100%, 0.95)";
      default:
        return "hsla(0, 0%, 100%, 0.85)";
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* ═══ TAP TO START ═══ */}
      <AnimatePresence>
        {phase === "tap" && (
          <motion.div
            className="absolute inset-0 z-[210] flex flex-col items-center justify-center cursor-pointer"
            onClick={handleStart}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsla(0,80%,40%,0.15) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
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
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              whileHover={{ opacity: 0.9 }}
              transition={{ delay: 2 }}
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              className="absolute top-5 right-5 z-50 text-white/15 hover:text-white text-[8px] font-mono tracking-[0.3em] transition-all duration-300 uppercase"
            >
              Pular →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BACKGROUND ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, hsla(0,90%,30%,0.3) 0%, hsla(0,80%,20%,0.15) 25%, transparent 60%)",
          }}
          animate={{
            scale: isSpeaking ? [1, 1.1, 1] : [0.9, 1, 0.9],
            opacity: isSpeaking ? [0.7, 1, 0.7] : [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: "1px solid hsla(0, 60%, 50%, 0.06)" }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: "hsla(0, 70%, 50%, 0.4)",
            }}
            animate={{
              y: [-30, 30, -30],
              x: [-15, 15, -15],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
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
            className="absolute z-20 flex flex-col items-center"
            style={{
              "--accent-violet": "0 85% 50%",
              "--accent-cyan": "0 70% 40%",
              left: "50%",
              top: "5%",
              marginLeft: -140,
            } as React.CSSProperties}
          >
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 400,
                height: 400,
                top: -50,
                left: -50,
                background:
                  "radial-gradient(circle, hsla(0,80%,45%,0.2) 0%, transparent 65%)",
              }}
              animate={
                isSpeaking
                  ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }
                  : { scale: 1, opacity: 0.4 }
              }
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div style={{ width: 280, height: 280, position: "relative" }}>
              <NeuralCore isSpeaking={isSpeaking} size={280} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BOTTOM CONTENT ═══ */}
      {phase !== "tap" && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-30 pb-4 md:pb-6">
          {/* Thor label */}
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

          {/* Speaking indicator */}
          <AnimatePresence>
            {(phase === "speaking" || phase === "showcase") && ttsStatus === "playing" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[9px] md:text-[10px] font-mono tracking-[0.5em] uppercase mb-2"
                style={{ color: "hsl(0, 85%, 55%)" }}
              >
                Speaking
              </motion.p>
            )}
          </AnimatePresence>

          {/* TTS failed indicator */}
          {ttsStatus === "failed" && soundOn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-[8px] font-mono tracking-wider text-white/30 mb-2"
            >
              🔇 voz indisponível
            </motion.p>
          )}

          {/* Waveform */}
          <AnimatePresence>
            {(phase === "speaking" || phase === "showcase") && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-[1.5px] mb-4 md:mb-6"
              >
                {Array.from({ length: 48 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-[1.5px] md:w-[2px] rounded-full"
                    style={{ backgroundColor: "hsla(0, 80%, 50%, 0.7)" }}
                    animate={{
                      height: ttsStatus === "playing"
                        ? [2 + Math.random() * 3, 5 + Math.random() * 22, 2 + Math.random() * 4, 7 + Math.random() * 18]
                        : [2, 4, 2, 3],
                    }}
                    transition={{
                      duration: ttsStatus === "playing" ? 0.2 + Math.random() * 0.2 : 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.01,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Speech lines */}
          <div className="w-full max-w-lg px-6 text-center mb-4 md:mb-6">
            <AnimatePresence mode="sync">
              {phase === "speaking" &&
                SPEECH_LINES.map((line, i) =>
                  i < visibleLines ? (
                    <motion.p
                      key={`line-${i}`}
                      initial={{ opacity: 0, y: 15, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`mb-2 leading-relaxed tracking-wide ${getLineClass(line.style)}`}
                      style={{ color: getLineColor(line.style) }}
                    >
                      {line.text}
                    </motion.p>
                  ) : null
                )}
            </AnimatePresence>
          </div>

          {/* ═══ SHOWCASE — departments preview ═══ */}
          <AnimatePresence>
            {(phase === "showcase" || phase === "cta") && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6 px-4 max-w-xl"
              >
                {SHOWCASE_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md"
                    style={{
                      border: "1px solid hsla(0, 50%, 50%, 0.15)",
                      background: "hsla(0, 40%, 20%, 0.15)",
                    }}
                  >
                    <span className="text-base md:text-lg">{item.icon}</span>
                    <div className="text-left">
                      <p className="text-[11px] md:text-xs font-semibold text-white/90">{item.label}</p>
                      <p className="text-[8px] md:text-[9px] text-white/40 font-mono">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <AnimatePresence>
            {phase === "cta" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6"
              >
                <Button
                  onClick={handleComplete}
                  className="group h-14 px-10 rounded-2xl text-white font-display font-bold text-sm md:text-base border backdrop-blur-md transition-all duration-500 hover:scale-105"
                  style={{
                    borderColor: "hsla(0, 60%, 50%, 0.4)",
                    background: "linear-gradient(135deg, hsla(0, 70%, 40%, 0.3), hsla(0, 50%, 30%, 0.15))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsla(0, 70%, 55%, 0.7)";
                    e.currentTarget.style.background = "linear-gradient(135deg, hsla(0, 70%, 40%, 0.5), hsla(0, 50%, 30%, 0.3))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsla(0, 60%, 50%, 0.4)";
                    e.currentTarget.style.background = "linear-gradient(135deg, hsla(0, 70%, 40%, 0.3), hsla(0, 50%, 30%, 0.15))";
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Zap className="h-4 w-4" style={{ color: "hsl(0, 70%, 55%)" }} />
                    Conhecer meus agentes
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

      {/* ═══ TOP CONTROLS ═══ */}
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
            animate={{ opacity: 0.4 }}
            whileHover={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => toggleSound(!soundOn)}
            className="absolute top-5 left-5 z-50 text-white/30 hover:text-white transition-all"
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </motion.button>
        </>
      )}
    </motion.div>
  );
};

export default SoundWaveIntro;
