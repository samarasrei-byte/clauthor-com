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
  const faceR = r * 0.55;

  const describeArc = (cx: number, cy: number, radius: number, startDeg: number, endDeg: number) => {
    const s = (startDeg - 90) * Math.PI / 180;
    const e = (endDeg - 90) * Math.PI / 180;
    const la = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx + radius * Math.cos(s)} ${cy + radius * Math.sin(s)} A ${radius} ${radius} 0 ${la} 1 ${cx + radius * Math.cos(e)} ${cy + radius * Math.sin(e)}`;
  };

  // Hexagonal grid pattern for background
  const hexGrid = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const sp = 18;
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = center + col * sp + (row % 2 ? sp / 2 : 0);
        const y = center + row * sp * 0.866;
        const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (dist < r + 25 && dist > faceR + 15) pts.push({ x, y });
      }
    }
    return pts;
  }, [size]);

  // Data ring segments with different radii
  const dataRings = useMemo(() => [
    // Inner data ring
    { r: faceR + 8, segments: [{ s: 0, e: 45 }, { s: 60, e: 130 }, { s: 150, e: 200 }, { s: 230, e: 310 }, { s: 325, e: 355 }], w: 2.5, speed: 25, dir: 1 },
    // Mid analysis ring
    { r: r - 10, segments: [{ s: 10, e: 80 }, { s: 100, e: 160 }, { s: 200, e: 290 }, { s: 310, e: 350 }], w: 1.2, speed: 40, dir: -1 },
    // Outer telemetry ring
    { r: r + 4, segments: [{ s: 0, e: 50 }, { s: 70, e: 170 }, { s: 190, e: 250 }, { s: 280, e: 360 }], w: 0.8, speed: 55, dir: 1 },
    // Outermost thin ring
    { r: r + 18, segments: [{ s: 20, e: 90 }, { s: 120, e: 210 }, { s: 240, e: 340 }], w: 0.5, speed: 70, dir: -1 },
  ], [r, faceR]);

  // Precision tick marks (like a scope)
  const ticks = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const angle = (i / 120) * Math.PI * 2;
      const isMajor = i % 10 === 0;
      const isMid = i % 5 === 0;
      const inner = r + 1;
      const outer = r + (isMajor ? 14 : isMid ? 8 : 3);
      return { x1: center + Math.cos(angle) * inner, y1: center + Math.sin(angle) * inner, x2: center + Math.cos(angle) * outer, y2: center + Math.sin(angle) * outer, isMajor, isMid };
    });
  }, [size]);

  // Floating data particles along orbits
  const orbitParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      orbit: faceR + 10 + (i % 4) * ((r - faceR) / 4),
      startAngle: (i / 12) * 360,
      speed: 8 + i * 3,
      size: 1.5 + (i % 3) * 0.5,
    }));
  }, [r, faceR]);

  return (
    <div className="absolute inset-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <clipPath id="face-clip"><circle cx={center} cy={center} r={faceR} /></clipPath>
          <linearGradient id="hud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.6" />
            <stop offset="50%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.8" />
            <stop offset="70%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ── Background hex grid — subtle neural mesh ── */}
        {hexGrid.map((pt, i) => (
          <motion.rect
            key={`hx-${i}`}
            x={pt.x - 1} y={pt.y - 1}
            width="2" height="2"
            rx="0.3"
            fill="hsl(var(--accent-violet))"
            animate={isSpeaking ? {
              opacity: [0.02, 0.12 + Math.random() * 0.15, 0.02],
            } : {
              opacity: [0.015, 0.04, 0.015],
            }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}

        {/* ── Precision scope ticks ── */}
        {ticks.map((t, i) => (
          <motion.line
            key={`t-${i}`}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="hsl(var(--accent-violet))"
            strokeWidth={t.isMajor ? "1.2" : t.isMid ? "0.6" : "0.3"}
            animate={isSpeaking && t.isMajor ? {
              strokeOpacity: [0.3, 0.7, 0.3],
            } : {
              strokeOpacity: t.isMajor ? 0.35 : t.isMid ? 0.15 : 0.06,
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.02 }}
          />
        ))}

        {/* ── Multi-layer data rings with gradient ── */}
        {dataRings.map((ring, ri) => (
          <motion.g
            key={`ring-${ri}`}
            style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: ring.dir * 360 }}
            transition={{ duration: ring.speed, repeat: Infinity, ease: "linear" }}
          >
            {ring.segments.map((seg, si) => (
              <motion.path
                key={`seg-${ri}-${si}`}
                d={describeArc(center, center, ring.r, seg.s, seg.e)}
                fill="none"
                stroke={ri === 0 ? "url(#ring-grad)" : "hsl(var(--accent-violet))"}
                strokeWidth={ring.w}
                strokeLinecap="round"
                animate={isSpeaking ? {
                  strokeOpacity: [0.2, 0.6 + ri * 0.05, 0.2],
                } : {
                  strokeOpacity: 0.12 + (3 - ri) * 0.04,
                }}
                transition={{ duration: 1.2 + si * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
            {/* Endpoint diamonds on major ring */}
            {ri === 0 && ring.segments.map((seg, si) => {
              const endRad = (seg.e - 90) * Math.PI / 180;
              const dx = center + ring.r * Math.cos(endRad);
              const dy = center + ring.r * Math.sin(endRad);
              return (
                <motion.rect
                  key={`dia-${si}`}
                  x={dx - 2} y={dy - 2} width="4" height="4"
                  fill="hsl(var(--accent-cyan))"
                  rx="0.5"
                  style={{ transform: `rotate(45deg)`, transformOrigin: `${dx}px ${dy}px` }}
                  animate={{ opacity: isSpeaking ? [0.4, 1, 0.4] : [0.15, 0.3, 0.15] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: si * 0.2 }}
                />
              );
            })}
          </motion.g>
        ))}

        {/* ── Corner bracket HUD frames ── */}
        {[
          { x: center - r * 0.7, y: center - r * 0.7, rot: 0 },
          { x: center + r * 0.7, y: center - r * 0.7, rot: 90 },
          { x: center + r * 0.7, y: center + r * 0.7, rot: 180 },
          { x: center - r * 0.7, y: center + r * 0.7, rot: 270 },
        ].map((c, i) => (
          <g key={`br-${i}`} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="hsl(var(--accent-violet))" strokeWidth="1.5" strokeOpacity="0.5" />
            <line x1="0" y1="0" x2="0" y2="18" stroke="hsl(var(--accent-violet))" strokeWidth="1.5" strokeOpacity="0.5" />
            <rect x="0" y="0" width="3" height="3" fill="hsl(var(--accent-cyan))" fillOpacity="0.4" rx="0.5" />
          </g>
        ))}

        {/* ── Face boundary ring — sharp with dashes ── */}
        <circle cx={center} cy={center} r={faceR + 1} fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="0.4" strokeOpacity="0.2" strokeDasharray="2 4" />
        <motion.circle
          cx={center} cy={center} r={faceR + 3}
          fill="none"
          stroke="hsl(var(--accent-violet))"
          strokeWidth="1"
          strokeDasharray="8 4 2 4"
          animate={isSpeaking ? {
            strokeOpacity: [0.15, 0.45, 0.15],
            r: [faceR + 2, faceR + 5, faceR + 2],
          } : {
            strokeOpacity: 0.1,
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Circular waveform EQ — 64 precision bars ── */}
        {Array.from({ length: 64 }).map((_, i) => {
          const angle = (i / 64) * Math.PI * 2 - Math.PI / 2;
          const baseR = faceR + 6;
          const x1 = center + Math.cos(angle) * baseR;
          const y1 = center + Math.sin(angle) * baseR;
          return (
            <motion.line
              key={`eq-${i}`}
              x1={x1} y1={y1}
              x2={center + Math.cos(angle) * (baseR + 2)}
              y2={center + Math.sin(angle) * (baseR + 2)}
              stroke={i % 8 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
              strokeWidth="1.5"
              strokeLinecap="butt"
              animate={isSpeaking ? {
                x2: [
                  center + Math.cos(angle) * (baseR + 2),
                  center + Math.cos(angle) * (baseR + 5 + Math.random() * 18),
                  center + Math.cos(angle) * (baseR + 1 + Math.random() * 7),
                  center + Math.cos(angle) * (baseR + 4 + Math.random() * 15),
                  center + Math.cos(angle) * (baseR + 2),
                ],
                y2: [
                  center + Math.sin(angle) * (baseR + 2),
                  center + Math.sin(angle) * (baseR + 5 + Math.random() * 18),
                  center + Math.sin(angle) * (baseR + 1 + Math.random() * 7),
                  center + Math.sin(angle) * (baseR + 4 + Math.random() * 15),
                  center + Math.sin(angle) * (baseR + 2),
                ],
                strokeOpacity: [0.3, 0.85, 0.4, 0.9, 0.3],
              } : {
                strokeOpacity: [0.06, 0.12, 0.06],
              }}
              transition={{
                duration: isSpeaking ? 0.15 + Math.random() * 0.25 : 3,
                repeat: Infinity,
                delay: i * 0.008,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* ── Orbiting data particles ── */}
        {orbitParticles.map((p, i) => (
          <motion.g key={`op-${i}`} style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: [p.startAngle, p.startAngle + 360] }}
            transition={{ duration: p.speed, repeat: Infinity, ease: "linear" }}
          >
            <circle cx={center + p.orbit} cy={center} r={p.size} fill={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"} opacity={isSpeaking ? 0.7 : 0.2} />
            {/* Trail */}
            <line
              x1={center + p.orbit - 6} y1={center}
              x2={center + p.orbit} y2={center}
              stroke={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
              strokeWidth="0.8"
              strokeOpacity={isSpeaking ? 0.3 : 0.08}
            />
          </motion.g>
        ))}

        {/* ── Scanning sweep — radar style ── */}
        <motion.g style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <line x1={center} y1={center} x2={center} y2={center - r - 8} stroke="hsl(var(--accent-cyan))" strokeWidth="0.5" strokeOpacity="0.15" />
          {/* Sweep gradient trail */}
          <path
            d={describeArc(center, center, r * 0.7, -30, 0)}
            fill="none" stroke="hsl(var(--accent-cyan))" strokeWidth="12" strokeOpacity="0.03"
          />
        </motion.g>

        {/* ── HUD text labels ── */}
        <text x={center + r + 20} y={center - 12} fill="hsl(var(--accent-violet))" fontSize="5" fontFamily="monospace" opacity="0.35" letterSpacing="2">NEURAL</text>
        <text x={center + r + 20} y={center - 3} fill="hsl(var(--accent-cyan))" fontSize="7" fontFamily="monospace" opacity="0.4" fontWeight="bold">
          {isSpeaking ? "ACTIVE" : "STANDBY"}
        </text>
        <text x={center + r + 20} y={center + 8} fill="hsl(var(--accent-violet))" fontSize="4" fontFamily="monospace" opacity="0.2">
          {isSpeaking ? "▮▮▮▮▮▮▮▮" : "▯▯▯▮▯▯▯▯"}
        </text>

        <text x={center - r - 55} y={center - 8} fill="hsl(var(--accent-violet))" fontSize="4" fontFamily="monospace" opacity="0.25" letterSpacing="1">SYNC</text>
        <motion.text x={center - r - 55} y={center + 2} fill="hsl(var(--accent-cyan))" fontSize="6" fontFamily="monospace"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >98.7%</motion.text>
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ThorMessage[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  const lang = navigator.language || "en";

  // Keep messagesRef in sync to avoid stale closures
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Safety: force-stop native speech after 30s to prevent infinite talking
  useEffect(() => {
    if (!isSpeaking) return;
    const timeout = setTimeout(() => {
      console.warn("[Thor] Safety timeout: stopping speech after 30s");
      stopTTS();
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [isSpeaking, stopTTS]);

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

  // Proactive messages — clear on hasInteracted or phase change
  useEffect(() => {
    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }
    if (phase !== "minimized" || hasInteracted) return;
    proactiveTimerRef.current = setInterval(() => {
      const msgs = getProactiveMessages(location.pathname, lang);
      const idx = proactiveIndexRef.current % msgs.length;
      proactiveIndexRef.current++;
      stopTTS(); // Stop any ongoing speech before new proactive msg
      setPhase("active");
      setMessages(prev => [...prev, { role: "assistant", content: msgs[idx] }]);
      if (voiceEnabled) speak(msgs[idx].replace(/[*#🚀]/g, ""), THOR_VOICE_ID);
    }, PROACTIVE_INTERVAL);
    return () => {
      if (proactiveTimerRef.current) {
        clearInterval(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
    };
  }, [phase, location.pathname, hasInteracted, voiceEnabled, stopTTS, speak, lang]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);
    setShowChat(true);

    // === CRITICAL: Stop any ongoing speech and cancel previous stream ===
    stopTTS();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Clear proactive timer permanently
    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }

    const userMsg: ThorMessage = { role: "user", content: msg };
    const currentMessages = messagesRef.current;
    const updated = [...currentMessages, userMsg];
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
            messages: updated.slice(-12).map(m => ({ role: m.role, content: m.content })),
            context: {
              area: user ? "client" : "public",
              route: location.pathname,
              authenticated: !!user,
              persona: "thor",
            },
          }),
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        if (controller.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              const snapshot = assistantText;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Only speak if not aborted and text exists
      if (!controller.signal.aborted && voiceEnabled && assistantText) {
        const cleanText = assistantText.replace(/[*#🚀🧠💡\[\]()]/g, "").slice(0, 250);
        speak(cleanText, THOR_VOICE_ID);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("[Thor] Stream aborted by user");
        return;
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: lang.startsWith("pt") ? "Ops, tive um problema. Tenta de novo?" : "Oops, had an issue. Try again?",
      }]);
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [input, isLoading, user, location.pathname, voiceEnabled, speak, stopTTS, lang]);

  const minimize = () => {
    stopTTS();
    // Abort any running stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPhase("minimized");
    setShowChat(false);
  };
  const activate = () => {
    setPhase("active");
    if (messagesRef.current.length === 0) {
      const isPt = lang.startsWith("pt");
      const greeting = isPt ? "Voltei! 😄 Em que posso te ajudar?" : "I'm back! 😄 How can I help?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  };

  const coreSize = typeof window !== "undefined" && window.innerWidth < 640 ? 260 : 360;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  /* ══ ENTRANCE — cinematic boot sequence ══ */
  if (phase === "entrance") {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 backdrop-blur-xl"
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent-violet) / 0.08) 0%, hsl(var(--background) / 0.8) 60%, hsl(var(--background) / 0.92) 100%)" }}
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
                width: coreSize * 0.52,
                height: coreSize * 0.52,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: `inset 0 0 20px hsl(var(--accent-violet) / 0.15)`,
                border: "1px solid hsl(var(--accent-violet) / 0.2)",
              }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.04) 2px, hsl(var(--accent-violet) / 0.04) 3px)",
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
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[9999] group cursor-pointer"
        aria-label="Talk to Thor"
      >
        {/* Rotating conic border */}
        <motion.span
          className="absolute inset-[-3px] rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute inset-0" style={{
            background: "conic-gradient(from 0deg, transparent 30%, hsl(var(--accent-violet) / 0.7), hsl(var(--accent-violet) / 0.15), transparent 75%)",
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
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.03) 2px, hsl(var(--accent-violet) / 0.03) 3px)",
          }} />
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_hsl(var(--accent-violet)/0.15)]" />
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

  const hasSpeech = messages.length > 0;
  const isPresenting = hasSpeech && !showChat;
  const presentCoreSize = typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 300;

  /* ══ ACTIVE — Cinematic holographic entity ══ */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop — frosted glass blur */}
        <motion.div
          className="absolute inset-0 pointer-events-auto"
          onClick={minimize}
          initial={{ backdropFilter: "blur(0px)" }}
          animate={{ backdropFilter: "blur(10px)" }}
          transition={{ duration: 0.8 }}
          style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent-violet) / 0.06) 0%, hsl(var(--background) / 0.6) 60%, hsl(var(--background) / 0.75) 100%)" }}
        />

        {/* Layout: when presenting = Thor above panel. Otherwise centered */}
        <div className={`relative z-10 w-full h-full flex pointer-events-none ${
          isPresenting
            ? "flex-col items-center justify-center px-4 sm:px-6"
            : "flex-col items-center justify-center"
        }`}>

          {/* Thor orb container */}
          <motion.div
            className={`relative pointer-events-auto flex flex-col items-center ${isPresenting ? "z-20 -mb-10 sm:-mb-14" : ""}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", damping: 16, stiffness: 120 }}
            style={{ flexShrink: 0 }}
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
              style={{ width: isPresenting ? presentCoreSize : coreSize, height: isPresenting ? presentCoreSize : coreSize, transition: "width 0.5s, height 0.5s" }}
              onClick={() => setShowChat(!showChat)}
            >
              <NeuralCore isSpeaking={isSpeaking} size={isPresenting ? presentCoreSize : coreSize} />

            {/* Face */}
            <motion.div
              className="absolute rounded-full overflow-hidden"
              style={{
                width: (isPresenting ? presentCoreSize : coreSize) * 0.52,
                height: (isPresenting ? presentCoreSize : coreSize) * 0.52,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                border: "1px solid hsl(var(--accent-violet) / 0.25)",
              }}
              animate={isSpeaking ? {
                boxShadow: [
                  "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
                  "inset 0 0 25px hsl(var(--accent-violet) / 0.2)",
                  "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
                ],
              } : {
                boxShadow: "inset 0 0 15px hsl(var(--accent-violet) / 0.1)",
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              <motion.div className="absolute inset-0" style={{
                background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, hsl(var(--accent-violet) / 0.03) 2px, hsl(var(--accent-violet) / 0.03) 3px)",
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-accent-violet/10 via-transparent to-accent-violet/5" />
            </motion.div>

            {/* HUD data points — hide when presenting */}
            {!isPresenting && <HUDElement label="Status" value="ACTIVE" position="left" />}
            {!isPresenting && <HUDElement label="Neural" value="98.7%" position="right" />}

            {/* Name badge */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
               <div className={`flex items-center gap-2 bg-background/80 backdrop-blur-xl py-1 rounded-full border border-accent-violet/15 shadow-lg shadow-accent-violet/5 ${isPresenting ? "px-2" : "px-4"}`}>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                 <span className={`font-mono font-bold tracking-[0.35em] uppercase text-foreground/90 ${isPresenting ? "text-[7px]" : "text-[9px]"}`}>THOR</span>
                {!isPresenting && <span className="text-[7px] font-mono text-accent-violet/40 tracking-wider">AI</span>}
              </div>
            </motion.div>
           </div>
          </motion.div>

          {/* ══ PRESENTATION PANEL — appears below Thor when presenting ══ */}
          {isPresenting && (
            <motion.div
              className="pointer-events-auto w-full max-w-[92vw] sm:max-w-[640px] max-h-[70vh] overflow-y-auto pt-14 sm:pt-20"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", damping: 20 }}
            >
              <div className="bg-background/80 backdrop-blur-2xl border border-accent-violet/10 rounded-[2rem] p-5 sm:p-6 shadow-2xl shadow-accent-violet/5">
                {lastMessage && lastMessage.role === "assistant" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <motion.span className="w-2 h-2 rounded-full bg-accent-violet" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-accent-violet/60">Thor · Apresentando</span>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2">
                      <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
                    </div>
                    {isSpeaking && (
                      <div className="flex items-center gap-[2px] h-3 justify-start pt-1">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-[1.5px] rounded-full bg-accent-violet/50"
                            animate={{ height: [1, Math.random() * 10 + 3, 1] }}
                            transition={{ duration: 0.25 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.02 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2 mt-4 pt-3 border-t border-accent-violet/5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={lang.startsWith("pt") ? "Pergunte algo ao Thor..." : "Ask Thor something..."}
                    disabled={isLoading}
                    className="flex-1 bg-muted/10 border border-accent-violet/10 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/30 transition-all placeholder:text-muted-foreground/30"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-9 w-9 rounded-lg bg-accent-violet/90 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20"
                  >
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Speech bubble — only when NOT presenting and not chat */}
          {lastMessage && !showChat && !isPresenting && (
            <motion.div
              className="mt-4 max-w-[88vw] sm:max-w-[340px] pointer-events-auto"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={lastMessage.content.slice(0, 20)}
            >
              <div
                className="relative bg-background/70 backdrop-blur-2xl border border-accent-violet/10 rounded-xl px-3 py-2 shadow-2xl shadow-accent-violet/5 cursor-pointer"
                onClick={() => setShowChat(true)}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background/70 border-l border-t border-accent-violet/10" />
                <p className="text-[10px] text-foreground/80 leading-snug relative z-10 font-mono">
                  {lastMessage.content.length > 130
                    ? lastMessage.content.slice(0, 130) + "..."
                    : lastMessage.content}
                </p>
                {lastMessage.content.length > 130 && (
                  <span className="text-[8px] text-accent-violet/50 font-mono mt-1 block">▼ ver mais</span>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-[1.5px] mt-1.5 h-2 justify-center">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[1px] rounded-full bg-accent-violet/50"
                        animate={{ height: [1, Math.random() * 6 + 2, 1] }}
                        transition={{ duration: 0.25 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.025 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick actions — hide when presenting */}
          {messages.length <= 1 && !showChat && !isPresenting && !isLoading && messages.some(m => m.role === "assistant") && (
            <motion.div
              className="mt-4 flex gap-2 flex-wrap justify-center pointer-events-auto"
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
                className="mt-4 w-[92vw] sm:w-[420px] overflow-hidden pointer-events-auto"
              >
                <div className="bg-background/85 backdrop-blur-2xl border border-accent-violet/10 rounded-2xl overflow-hidden shadow-2xl shadow-accent-violet/5">
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
                            <div className="text-[11px] prose prose-xs dark:prose-invert max-w-none [&_p]:mb-0.5 leading-snug">
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

          {/* Inline input when chat hidden and NOT presenting */}
          {!showChat && !isPresenting && (
            <motion.div
              className="mt-4 w-[88vw] sm:w-[380px] pointer-events-auto"
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorGreeter;
