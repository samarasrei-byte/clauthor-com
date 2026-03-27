import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import thorPhoto from "@/assets/kaelis-ai.png";

const THOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const STORAGE_KEY = "thor_greeter_seen_v3";
const PROACTIVE_INTERVAL = 45_000;

interface ThorMessage {
  role: "user" | "assistant";
  content: string;
}

/* ═══════════════════════════════════════════════════
   NEURAL CORE — Cinematic holographic engine
   ═══════════════════════════════════════════════════ */
const NeuralCore = ({ isSpeaking, size = 240 }: { isSpeaking: boolean; size?: number }) => {
  const center = size / 2;
  const r = size / 2 - 30;

  // Hexagonal grid points
  const hexPoints = useMemo(() => {
    const pts: { x: number; y: number; dist: number }[] = [];
    const spacing = 14;
    for (let row = -6; row <= 6; row++) {
      for (let col = -6; col <= 6; col++) {
        const x = center + col * spacing + (row % 2 ? spacing / 2 : 0);
        const y = center + row * spacing * 0.866;
        const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (dist < r + 10 && dist > r * 0.45) pts.push({ x, y, dist });
      }
    }
    return pts;
  }, [size]);

  // DNA helix points
  const helixPoints = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const t = (i / 60) * Math.PI * 4;
      const radius1 = r + 8;
      const radius2 = r + 8;
      return {
        x1: center + Math.cos(t) * radius1 * 0.15,
        y1: center + (i / 60 - 0.5) * size * 0.8,
        x2: center + Math.cos(t + Math.PI) * radius2 * 0.15,
        y2: center + (i / 60 - 0.5) * size * 0.8,
        t,
      };
    });
  }, [size]);

  return (
    <div className="absolute inset-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.2" />
            <stop offset="40%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="inner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-sm">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
          <filter id="glow-lg">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <clipPath id="face-clip">
            <circle cx={center} cy={center} r={r * 0.42} />
          </clipPath>
        </defs>

        {/* Deep ambient glow */}
        <circle cx={center} cy={center} r={r + 25} fill="url(#core-glow)" />

        {/* Hex grid — neural network nodes */}
        {hexPoints.map((pt, i) => (
          <motion.circle
            key={`hex-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={1}
            fill="hsl(var(--accent-violet))"
            initial={{ opacity: 0 }}
            animate={isSpeaking ? {
              opacity: [0.05, 0.3 + Math.random() * 0.4, 0.05],
              r: [0.8, 1.2 + Math.random(), 0.8],
            } : {
              opacity: [0.03, 0.08, 0.03],
            }}
            transition={{
              duration: isSpeaking ? 0.4 + Math.random() * 0.6 : 3 + Math.random() * 2,
              repeat: Infinity,
              delay: (pt.dist / r) * 0.5,
            }}
          />
        ))}

        {/* Neural connections — random lines between nearby hex points */}
        {hexPoints.slice(0, 40).map((pt, i) => {
          const next = hexPoints[(i * 7 + 3) % hexPoints.length];
          const dist = Math.sqrt((pt.x - next.x) ** 2 + (pt.y - next.y) ** 2);
          if (dist > 40) return null;
          return (
            <motion.line
              key={`conn-${i}`}
              x1={pt.x} y1={pt.y} x2={next.x} y2={next.y}
              stroke="hsl(var(--accent-violet))"
              strokeWidth="0.3"
              animate={isSpeaking ? {
                strokeOpacity: [0, 0.25, 0],
              } : {
                strokeOpacity: [0, 0.05, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.08,
              }}
            />
          );
        })}

        {/* Orbital ring 1 — main */}
        <motion.circle
          cx={center} cy={center} r={r + 4}
          fill="none"
          stroke="hsl(var(--accent-violet))"
          strokeWidth={isSpeaking ? 1.2 : 0.6}
          strokeOpacity={isSpeaking ? 0.5 : 0.15}
          strokeDasharray={isSpeaking ? "2 6" : "1 12"}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />

        {/* Orbital ring 2 — counter-rotate */}
        <motion.circle
          cx={center} cy={center} r={r + 16}
          fill="none"
          stroke="hsl(var(--accent-violet))"
          strokeWidth="0.4"
          strokeOpacity={0.1}
          strokeDasharray="3 20"
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />

        {/* Orbital ring 3 — subtle outer */}
        <motion.circle
          cx={center} cy={center} r={r + 24}
          fill="none"
          stroke="hsl(var(--accent-violet))"
          strokeWidth="0.3"
          strokeOpacity={0.06}
          strokeDasharray="1 25"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />

        {/* Pulse ring — expands when speaking */}
        <motion.circle
          cx={center} cy={center} r={r * 0.44}
          fill="none"
          stroke="hsl(var(--accent-violet))"
          strokeWidth="1"
          animate={isSpeaking ? {
            r: [r * 0.44, r * 0.48, r * 0.44],
            strokeOpacity: [0.15, 0.4, 0.15],
            strokeWidth: [0.5, 1.5, 0.5],
          } : {
            strokeOpacity: 0.08,
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Circular waveform — 64 bars */}
        {Array.from({ length: 64 }).map((_, i) => {
          const angle = (i / 64) * Math.PI * 2 - Math.PI / 2;
          const baseR = r * 0.44 + 3;
          const x1 = center + Math.cos(angle) * baseR;
          const y1 = center + Math.sin(angle) * baseR;
          const len = isSpeaking ? 6 + Math.random() * 16 : 3;
          return (
            <motion.line
              key={`wave-${i}`}
              x1={x1} y1={y1}
              x2={center + Math.cos(angle) * (baseR + len)}
              y2={center + Math.sin(angle) * (baseR + len)}
              stroke="hsl(var(--accent-violet))"
              strokeWidth="1.2"
              strokeLinecap="round"
              filter="url(#glow-sm)"
              animate={isSpeaking ? {
                x2: [
                  center + Math.cos(angle) * (baseR + 3),
                  center + Math.cos(angle) * (baseR + 6 + Math.random() * 20),
                  center + Math.cos(angle) * (baseR + 2 + Math.random() * 8),
                  center + Math.cos(angle) * (baseR + 4 + Math.random() * 18),
                  center + Math.cos(angle) * (baseR + 3),
                ],
                y2: [
                  center + Math.sin(angle) * (baseR + 3),
                  center + Math.sin(angle) * (baseR + 6 + Math.random() * 20),
                  center + Math.sin(angle) * (baseR + 2 + Math.random() * 8),
                  center + Math.sin(angle) * (baseR + 4 + Math.random() * 18),
                  center + Math.sin(angle) * (baseR + 3),
                ],
                strokeOpacity: [0.3, 0.8, 0.4, 0.9, 0.3],
              } : {
                strokeOpacity: [0.06, 0.12, 0.06],
              }}
              transition={{
                duration: isSpeaking ? 0.25 + Math.random() * 0.35 : 2.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.012,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Orbiting particles */}
        {[0, 1, 2, 3].map(i => {
          const orbitR = r + 4 + i * 10;
          return (
            <motion.circle
              key={`particle-${i}`}
              r={1.5 - i * 0.2}
              fill="hsl(var(--accent-violet))"
              filter="url(#glow-sm)"
              animate={{
                cx: [
                  center + Math.cos(0) * orbitR,
                  center + Math.cos(Math.PI / 2) * orbitR,
                  center + Math.cos(Math.PI) * orbitR,
                  center + Math.cos(Math.PI * 1.5) * orbitR,
                  center + Math.cos(Math.PI * 2) * orbitR,
                ],
                cy: [
                  center + Math.sin(0) * orbitR,
                  center + Math.sin(Math.PI / 2) * orbitR,
                  center + Math.sin(Math.PI) * orbitR,
                  center + Math.sin(Math.PI * 1.5) * orbitR,
                  center + Math.sin(Math.PI * 2) * orbitR,
                ],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 8 + i * 4,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2,
              }}
            />
          );
        })}

        {/* Data streams — vertical scanlines */}
        {isSpeaking && Array.from({ length: 6 }).map((_, i) => (
          <motion.rect
            key={`stream-${i}`}
            x={center - r * 0.4 + i * (r * 0.16)}
            width="0.5"
            height="8"
            fill="hsl(var(--accent-violet))"
            rx="0.25"
            animate={{
              y: [center - r, center + r],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

/* ─── Status HUD elements ─── */
const HUDElement = ({ label, value, position }: { label: string; value: string; position: "left" | "right" }) => (
  <motion.div
    className={`absolute top-1/2 -translate-y-1/2 ${position === "left" ? "-left-20 sm:-left-28" : "-right-20 sm:-right-28"} hidden sm:flex flex-col items-${position === "left" ? "end" : "start"} gap-0.5`}
    initial={{ opacity: 0, x: position === "left" ? -10 : 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.5 }}
  >
    <span className="text-[7px] font-mono uppercase tracking-[0.25em] text-accent-violet/40">{label}</span>
    <span className="text-[9px] font-mono text-accent-violet/70 font-bold">{value}</span>
  </motion.div>
);

/* ─── Proactive questions based on route ─── */
const getProactiveMessages = (pathname: string, lang: string): string[] => {
  const isPt = lang.startsWith("pt");
  if (pathname === "/" || pathname === "") {
    return isPt ? [
      "Ei! Notei que você tá olhando a home. Quer que eu te mostre como nossos agentes podem revolucionar sua empresa? 🚀",
      "Tô vendo que você ainda não explorou os departamentos. Posso te guiar? Tenho 200 agentes prontos!",
      "Quer um tour rápido? Em 2 minutos eu te mostro o que a CLAUTHOR pode fazer pela sua empresa.",
    ] : [
      "Hey! I noticed you're on the homepage. Want me to show you how our agents can transform your business? 🚀",
      "I see you haven't explored the departments yet. Can I guide you? I have 200 agents ready!",
      "Want a quick tour? In 2 minutes I'll show you what CLAUTHOR can do for your company.",
    ];
  }
  if (pathname.includes("/library")) {
    return isPt ? ["Boa escolha vir na biblioteca! Posso te ajudar a encontrar o agente perfeito pro seu caso."]
      : ["Great choice coming to the library! I can help you find the perfect agent for your needs."];
  }
  if (pathname.includes("/pricing")) {
    return isPt ? ["Analisando preços? Posso te ajudar a escolher o plano ideal baseado no seu volume."]
      : ["Checking prices? I can help you pick the ideal plan based on your volume."];
  }
  return isPt ? ["Precisa de ajuda com alguma coisa? Tô aqui 24/7!"]
    : ["Need help with anything? I'm here 24/7!"];
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — Cinematic Holographic AI Entity
   ═══════════════════════════════════════════════════════ */
const ThorGreeter = () => {
  const [phase, setPhase] = useState<"entrance" | "active" | "minimized">("minimized");
  const [messages, setMessages] = useState<ThorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveIndexRef = useRef(0);
  const proactiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const lang = navigator.language || "en";

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => setPhase("entrance"), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("active");
        localStorage.setItem(STORAGE_KEY, "1");
        const isPt = lang.startsWith("pt");
        const greeting = isPt
          ? "Olá! Eu sou o **Thor**, CEO e Orquestrador da CLAUTHOR. 🧠 Me conta: **o que te trouxe aqui hoje?**"
          : "Hello! I'm **Thor**, CEO & Orchestrator of CLAUTHOR. 🧠 Tell me: **what brought you here today?**";
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceEnabled) speak(greeting.replace(/[*#🧠]/g, ""), THOR_VOICE_ID);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "minimized" || hasInteracted) return;
    proactiveTimerRef.current = setInterval(() => {
      const msgs = getProactiveMessages(location.pathname, lang);
      const idx = proactiveIndexRef.current % msgs.length;
      proactiveIndexRef.current++;
      setPhase("active");
      setMessages(prev => [...prev, { role: "assistant", content: msgs[idx] }]);
      if (voiceEnabled) speak(msgs[idx].replace(/[*#🚀]/g, ""), THOR_VOICE_ID);
    }, PROACTIVE_INTERVAL);
    return () => { if (proactiveTimerRef.current) clearInterval(proactiveTimerRef.current); };
  }, [phase, location.pathname, hasInteracted, voiceEnabled]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);
    setShowChat(true);

    const userMsg: ThorMessage = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: updated.map(m => ({ role: m.role, content: m.content })),
            context: {
              area: user ? "client" : "public",
              route: location.pathname,
              authenticated: !!user,
              persona: "thor",
            },
          }),
        }
      );
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      if (voiceEnabled && assistantText) {
        speak(assistantText.replace(/[*#🚀🧠💡]/g, "").slice(0, 300), THOR_VOICE_ID);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: lang.startsWith("pt") ? "Ops, tive um problema. Tenta de novo?" : "Oops, had an issue. Try again?",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, user, location.pathname, voiceEnabled, speak, lang]);

  const minimize = () => { stopTTS(); setPhase("minimized"); setShowChat(false); };
  const activate = () => {
    setPhase("active");
    if (messages.length === 0) {
      const isPt = lang.startsWith("pt");
      const greeting = isPt ? "Voltei! 😄 Em que posso te ajudar?" : "I'm back! 😄 How can I help?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  };

  const coreSize = typeof window !== "undefined" && window.innerWidth < 640 ? 180 : 260;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  /* ══ ENTRANCE — cinematic boot sequence ══ */
  if (phase === "entrance") {
    return (
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, hsl(var(--background) / 0.7) 60%, hsl(var(--background) / 0.85) 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 60, duration: 2 }}
        >
          {/* Neural core with face */}
          <div className="relative" style={{ width: coreSize, height: coreSize }}>
            <NeuralCore isSpeaking={false} size={coreSize} />
            <div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: coreSize * 0.36,
                height: coreSize * 0.36,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 60px hsl(var(--primary) / 0.3), 0 0 120px hsl(var(--primary) / 0.1), inset 0 0 30px hsl(var(--primary) / 0.2)`,
                border: "1px solid hsl(var(--primary) / 0.2)",
              }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--primary) / 0.04) 2px, hsl(var(--primary) / 0.04) 3px)",
              }} />
            </div>
          </div>

          {/* Boot text */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.h2
              className="font-mono text-xl sm:text-2xl font-bold tracking-[0.4em] uppercase text-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              THOR
            </motion.h2>
            <motion.div
              className="mt-2 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <motion.span
                className="h-px bg-accent-violet/30"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
              <motion.span
                className="text-[8px] font-mono uppercase tracking-[0.5em] text-accent-violet/60"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Neural Sync
              </motion.span>
              <motion.span
                className="h-px bg-accent-violet/30"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
            </motion.div>
          </motion.div>

          {/* Loading sequence */}
          <motion.div
            className="mt-4 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-6 h-[2px] rounded-full bg-accent-violet"
                animate={{
                  opacity: [0.1, 0.8, 0.1],
                  scaleX: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.12,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  /* ══ MINIMIZED — premium floating orb ══ */
  if (phase === "minimized") {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14 }}
        onClick={activate}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[60] group cursor-pointer"
        aria-label="Talk to Thor"
      >
        {/* Rotating conic border */}
        <motion.span
          className="absolute inset-[-3px] rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute inset-0" style={{
            background: "conic-gradient(from 0deg, transparent 30%, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.15), transparent 75%)",
          }} />
        </motion.span>

        {/* Pulse rings */}
        <motion.span
          className="absolute inset-[-8px] rounded-full border border-accent-violet/10"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.span
          className="absolute inset-[-14px] rounded-full border border-accent-violet/5"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />

        <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/95 backdrop-blur-2xl overflow-hidden border border-accent-violet/10">
          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover rounded-full" />
          {/* Scanline overlay */}
          <span className="absolute inset-0 rounded-full" style={{
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 3px)",
          }} />
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_hsl(var(--primary)/0.15)]" />
        </span>

        {/* Online indicator */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background z-10">
          <span className="block w-full h-full rounded-full bg-emerald-500" />
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
        </span>

        {/* Hover tooltip */}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.3em] uppercase text-accent-violet/50 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-accent-violet/10">
          THOR · ONLINE
        </span>
      </motion.button>
    );
  }

  /* ══ ACTIVE — Cinematic holographic entity ══ */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop — radial gradient, site visible */}
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={minimize}
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.03) 0%, transparent 70%)" }}
        />

        {/* Main holographic entity */}
        <motion.div
          className="relative z-10 flex flex-col items-center pointer-events-auto max-w-[95vw]"
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.6, opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 16, stiffness: 120 }}
        >
          {/* Controls */}
          <div className="absolute -top-3 right-0 sm:-right-4 flex items-center gap-1.5 z-20">
            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-accent-violet/10 text-accent-violet/50 hover:text-accent-violet hover:border-accent-violet/30 transition-all"
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={minimize}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-accent-violet/10 text-accent-violet/50 hover:text-accent-violet hover:border-accent-violet/30 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Neural core + face */}
          <div
            className="relative cursor-pointer"
            style={{ width: coreSize, height: coreSize }}
            onClick={() => setShowChat(!showChat)}
          >
            <NeuralCore isSpeaking={isSpeaking} size={coreSize} />

            {/* Face */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: coreSize * 0.36,
                height: coreSize * 0.36,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: "1px solid hsl(var(--primary) / 0.25)",
              }}
              animate={isSpeaking ? {
                boxShadow: [
                  "0 0 30px hsl(var(--primary) / 0.15), 0 0 80px hsl(var(--primary) / 0.08)",
                  "0 0 60px hsl(var(--primary) / 0.35), 0 0 140px hsl(var(--primary) / 0.15)",
                  "0 0 30px hsl(var(--primary) / 0.15), 0 0 80px hsl(var(--primary) / 0.08)",
                ],
              } : {
                boxShadow: "0 0 40px hsl(var(--primary) / 0.2), 0 0 80px hsl(var(--primary) / 0.08)",
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 3px)",
              }} />
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-accent-violet/10 via-transparent to-accent-violet/5" />
            </motion.div>

            {/* HUD data points */}
            <HUDElement label="Status" value="ACTIVE" position="left" />
            <HUDElement label="Neural" value="98.7%" position="right" />

            {/* Name badge */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-accent-violet/15 shadow-lg shadow-accent-violet/5">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[9px] font-mono font-bold tracking-[0.35em] uppercase text-foreground/90">THOR</span>
                <span className="text-[7px] font-mono text-accent-violet/40 tracking-wider">AI</span>
              </div>
            </motion.div>
          </div>

          {/* Speech bubble */}
          {lastMessage && !showChat && (
            <motion.div
              className="mt-6 max-w-[92vw] sm:max-w-[420px]"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={lastMessage.content.slice(0, 20)}
            >
              <div className="relative bg-background/70 backdrop-blur-2xl border border-accent-violet/10 rounded-2xl px-5 py-4 shadow-2xl shadow-accent-violet/5">
                {/* Connector to orb */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 bg-background/70 border-l border-t border-accent-violet/10" />
                <div className="text-[13px] text-foreground/90 prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 leading-relaxed relative z-10">
                  <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
                </div>
                {isSpeaking && (
                  <div className="flex items-center gap-[1.5px] mt-3 h-3 justify-center">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[1px] rounded-full bg-accent-violet/50"
                        animate={{ height: [1.5, Math.random() * 10 + 3, 1.5] }}
                        transition={{ duration: 0.25 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.025 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick actions */}
          {messages.length <= 1 && !showChat && !isLoading && messages.some(m => m.role === "assistant") && (
            <motion.div
              className="mt-4 flex gap-2 flex-wrap justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {(lang.startsWith("pt") ? [
                { label: "Me mostre os agentes", icon: "⚡" },
                { label: "Como funciona?", icon: "🔮" },
                { label: "Quero um tour", icon: "🌐" },
              ] : [
                { label: "Show me agents", icon: "⚡" },
                { label: "How does it work?", icon: "🔮" },
                { label: "Give me a tour", icon: "🌐" },
              ]).map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/60 backdrop-blur-xl border border-accent-violet/10 hover:border-accent-violet/30 hover:bg-accent-violet/5 hover:shadow-lg hover:shadow-accent-violet/10 transition-all text-[11px] font-mono tracking-wide"
                >
                  <span>{q.icon}</span>{q.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Chat area */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 w-[92vw] sm:w-[420px] overflow-hidden"
              >
                <div className="bg-background/85 backdrop-blur-2xl border border-accent-violet/10 rounded-2xl overflow-hidden shadow-2xl shadow-accent-violet/5">
                  {/* Header bar */}
                  <div className="px-4 py-2 border-b border-accent-violet/5 flex items-center gap-2">
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-accent-violet/40">Neural Channel · Active</span>
                  </div>

                  <div className="max-h-[40vh] overflow-y-auto p-3 space-y-3">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0 mt-0.5 shadow-md shadow-accent-violet/10">
                            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-xl px-3 py-2.5 ${
                          msg.role === "user"
                            ? "bg-accent-violet/90 text-accent-violet-foreground shadow-lg shadow-accent-violet/20"
                            : "bg-muted/20 border border-accent-violet/5"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="text-[12px] prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 leading-relaxed">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-[12px]">{msg.content}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0">
                          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-muted/20 rounded-xl px-3 py-2.5 border border-accent-violet/5">
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-accent-violet/60"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-accent-violet/5">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                        disabled={isLoading}
                        className="flex-1 bg-muted/10 border border-accent-violet/10 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/30 focus:shadow-md focus:shadow-accent-violet/5 transition-all placeholder:text-muted-foreground/30"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="h-9 w-9 rounded-lg bg-accent-violet/90 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20 hover:shadow-accent-violet/40"
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline input when chat hidden */}
          {!showChat && (
            <motion.div
              className="mt-4 w-[88vw] sm:w-[380px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                  disabled={isLoading}
                  className="flex-1 bg-background/60 backdrop-blur-xl border border-accent-violet/10 rounded-full px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/25 focus:shadow-lg focus:shadow-accent-violet/5 transition-all placeholder:text-muted-foreground/30"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-9 w-9 rounded-full bg-accent-violet/80 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorGreeter;
