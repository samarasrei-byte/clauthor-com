/**
 * ThorUI.tsx — All visual rendering: NeuralCore, message bubbles, inputs, overlays, animations
 */

import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, Volume2, VolumeX, Maximize2, Minimize2, Mic, MicOff, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";
import thorPhoto from "@/assets/kaelis-ai.webp";
import type { ThorCoreState, ThorCoreActions } from "./ThorCore";
import { AgentDemoModal } from "./AgentDemoModal";

/* ═══════════════════════════════════════════════════
   QUANTUM NEURAL CORE — Adaptive holographic engine
   ═══════════════════════════════════════════════════ */
export const NeuralCore = memo(({ isSpeaking, size = 240, lite = false }: { isSpeaking: boolean; size?: number; lite?: boolean }) => {
  const center = size / 2;
  const r = size / 2 - (lite ? 15 : 30);
  const faceR = r * 0.55;

  const describeArc = (cx: number, cy: number, radius: number, startDeg: number, endDeg: number) => {
    const s = (startDeg - 90) * Math.PI / 180;
    const e = (endDeg - 90) * Math.PI / 180;
    const la = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx + radius * Math.cos(s)} ${cy + radius * Math.sin(s)} A ${radius} ${radius} 0 ${la} 1 ${cx + radius * Math.cos(e)} ${cy + radius * Math.sin(e)}`;
  };

  const particleCount = lite ? 10 : 30;
  const eqBars = lite ? 16 : 36;
  const dnaCount = lite ? 8 : 20;
  const tickCount = lite ? 30 : 60;

  const quantumParticles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = faceR + 15 + Math.random() * (r - faceR + 30);
      return {
        x: center + Math.cos(angle) * dist,
        y: center + Math.sin(angle) * dist,
        size: 0.5 + Math.random() * 2,
        speed: 3 + Math.random() * 8,
        delay: Math.random() * 5,
        type: i % 3,
        drift: (Math.random() - 0.5) * 20,
        driftY: (Math.random() - 0.5) * 20,
      };
    });
  }, [size, center, faceR, r, particleCount]);

  const dnaHelix = useMemo(() => {
    return Array.from({ length: dnaCount }, (_, i) => {
      const t = (i / dnaCount) * Math.PI * 4;
      return {
        angle1: (i / dnaCount) * 360,
        angle2: (i / dnaCount) * 360 + 180,
        r: r - 5,
        offset: Math.sin(t) * (lite ? 6 : 12),
        size: 1.2 + Math.abs(Math.sin(t)) * 1.2,
      };
    });
  }, [r, dnaCount, lite]);

  const dataRings = useMemo(() => {
    const base = [
      { r: faceR + 8, segments: [{ s: 0, e: 45 }, { s: 60, e: 130 }, { s: 230, e: 310 }], w: 2, speed: 20, dir: 1 },
      { r: faceR + 18, segments: [{ s: 15, e: 70 }, { s: 195, e: 260 }], w: 1.5, speed: 30, dir: -1 },
      { r: r - 8, segments: [{ s: 10, e: 80 }, { s: 200, e: 290 }], w: 1, speed: 40, dir: 1 },
    ];
    if (lite) return base.slice(0, 2);
    return [
      ...base,
      { r: r + 4, segments: [{ s: 0, e: 50 }, { s: 190, e: 250 }], w: 0.8, speed: 55, dir: -1 },
    ];
  }, [r, faceR, lite]);

  const ticks = useMemo(() => {
    return Array.from({ length: tickCount }, (_, i) => {
      const angle = (i / tickCount) * Math.PI * 2;
      const isMajor = i % (lite ? 5 : 15) === 0;
      const isMid = i % (lite ? 3 : 5) === 0;
      const inner = r + 1;
      const outer = r + (isMajor ? 12 : isMid ? 6 : 2);
      return { x1: center + Math.cos(angle) * inner, y1: center + Math.sin(angle) * inner, x2: center + Math.cos(angle) * outer, y2: center + Math.sin(angle) * outer, isMajor, isMid };
    });
  }, [size, center, r, tickCount, lite]);

  return (
    <div className="absolute inset-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <clipPath id="face-clip"><circle cx={center} cy={center} r={faceR} /></clipPath>
          <radialGradient id="plasma-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.12" />
            <stop offset="60%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(var(--accent-violet))" stopOpacity="0.7" />
            <stop offset="70%" stopColor="hsl(var(--accent-cyan))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--accent-violet))" stopOpacity="0" />
          </linearGradient>
          <filter id="quantum-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <motion.circle cx={center} cy={center} r={r + 20} fill="url(#plasma-glow)"
          animate={isSpeaking ? { r: [r + 20, r + 30, r + 20], opacity: [0.5, 0.9, 0.5] } : { opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {ticks.map((t, i) => (
          <motion.line key={`t-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
            strokeWidth={t.isMajor ? "1.2" : t.isMid ? "0.5" : "0.2"}
            animate={isSpeaking && t.isMajor ? { strokeOpacity: [0.3, 0.9, 0.3] } : { strokeOpacity: t.isMajor ? 0.35 : t.isMid ? 0.1 : 0.03 }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.01 }}
          />
        ))}

        {dataRings.map((ring, ri) => (
          <motion.g key={`ring-${ri}`} style={{ transformOrigin: `${center}px ${center}px` }}
            animate={{ rotate: ring.dir * 360 }}
            transition={{ duration: ring.speed, repeat: Infinity, ease: "linear" }}
          >
            {ring.segments.map((seg, si) => (
              <motion.path key={`seg-${ri}-${si}`}
                d={describeArc(center, center, ring.r, seg.s, seg.e)}
                fill="none"
                stroke={ri === 0 ? "url(#ring-grad)" : ri % 2 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
                strokeWidth={ring.w} strokeLinecap="round"
                animate={isSpeaking ? { strokeOpacity: [0.15, 0.55, 0.15] } : { strokeOpacity: 0.08 + (3 - ri) * 0.04 }}
                transition={{ duration: 1.2 + si * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </motion.g>
        ))}

        <motion.g style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          {dnaHelix.map((h, i) => {
            const rad1 = (h.angle1 - 90) * Math.PI / 180;
            const rad2 = (h.angle2 - 90) * Math.PI / 180;
            const x1 = center + (h.r + h.offset) * Math.cos(rad1);
            const y1 = center + (h.r + h.offset) * Math.sin(rad1);
            const x2 = center + (h.r - h.offset) * Math.cos(rad2);
            const y2 = center + (h.r - h.offset) * Math.sin(rad2);
            return (
              <g key={`dna-${i}`}>
                <circle cx={x1} cy={y1} r={h.size * 0.5} fill="hsl(var(--accent-violet))" opacity={isSpeaking ? 0.45 : 0.1} />
                <circle cx={x2} cy={y2} r={h.size * 0.4} fill="hsl(var(--accent-cyan))" opacity={isSpeaking ? 0.35 : 0.07} />
              </g>
            );
          })}
        </motion.g>

        <motion.circle cx={center} cy={center} r={faceR + 3}
          fill="none" stroke="hsl(var(--accent-violet))" strokeWidth="0.8" strokeDasharray="6 3 1 3"
          animate={isSpeaking ? { strokeOpacity: [0.15, 0.45, 0.15], r: [faceR + 2, faceR + 5, faceR + 2] } : { strokeOpacity: 0.08 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {Array.from({ length: eqBars }).map((_, i) => {
          const angle = (i / eqBars) * Math.PI * 2 - Math.PI / 2;
          const baseR = faceR + 5;
          const x1 = center + Math.cos(angle) * baseR;
          const y1 = center + Math.sin(angle) * baseR;
          const isAccent = i % (lite ? 4 : 12) === 0;
          return (
            <motion.line key={`eq-${i}`} x1={x1} y1={y1}
              x2={center + Math.cos(angle) * (baseR + 2)}
              y2={center + Math.sin(angle) * (baseR + 2)}
              stroke={isAccent ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
              strokeWidth={isAccent ? "1.5" : "0.8"} strokeLinecap="butt"
              animate={isSpeaking ? {
                x2: [center + Math.cos(angle) * (baseR + 2), center + Math.cos(angle) * (baseR + 4 + Math.random() * 16), center + Math.cos(angle) * (baseR + 2)],
                y2: [center + Math.sin(angle) * (baseR + 2), center + Math.sin(angle) * (baseR + 4 + Math.random() * 16), center + Math.sin(angle) * (baseR + 2)],
                strokeOpacity: [0.2, 0.85, 0.2],
              } : { strokeOpacity: [0.03, 0.08, 0.03] }}
              transition={{ duration: isSpeaking ? 0.15 + Math.random() * 0.2 : 3, repeat: Infinity, delay: i * 0.005 }}
            />
          );
        })}

        {quantumParticles.map((p, i) => (
          <motion.circle key={`qp-${i}`} cx={p.x} cy={p.y} r={p.size}
            fill={i % 3 === 0 ? "hsl(var(--accent-cyan))" : "hsl(var(--accent-violet))"}
            animate={{ cx: [p.x, p.x + p.drift, p.x], cy: [p.y, p.y + p.driftY, p.y], opacity: isSpeaking ? [0.08, 0.5, 0.08] : [0.02, 0.06, 0.02] }}
            transition={{ duration: p.speed, repeat: Infinity, delay: p.delay }}
          />
        ))}

        <motion.g style={{ transformOrigin: `${center}px ${center}px` }}
          animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <line x1={center} y1={center} x2={center} y2={center - r - 10} stroke="hsl(var(--accent-cyan))" strokeWidth="0.4" strokeOpacity="0.1" />
        </motion.g>

        {[
          { x: center - r * 0.7, y: center - r * 0.7, rot: 0 },
          { x: center + r * 0.7, y: center - r * 0.7, rot: 90 },
          { x: center + r * 0.7, y: center + r * 0.7, rot: 180 },
          { x: center - r * 0.7, y: center + r * 0.7, rot: 270 },
        ].map((c, i) => (
          <g key={`br-${i}`} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
            <line x1="0" y1="0" x2="16" y2="0" stroke="hsl(var(--accent-violet))" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="0" y1="0" x2="0" y2="16" stroke="hsl(var(--accent-violet))" strokeWidth="1" strokeOpacity="0.4" />
            <rect x="0" y="0" width="2" height="2" fill="hsl(var(--accent-cyan))" fillOpacity="0.4" rx="0.3" />
          </g>
        ))}

        {!lite && (
          <>
            <text x={center + r + 18} y={center - 8} fill="hsl(var(--accent-violet))" fontSize="4" fontFamily="monospace" opacity="0.25" letterSpacing="2">QUANTUM</text>
            <text x={center + r + 18} y={center + 2} fill="hsl(var(--accent-cyan))" fontSize="6" fontFamily="monospace" opacity="0.4" fontWeight="bold">
              {isSpeaking ? "STREAM" : "READY"}
            </text>
          </>
        )}
      </svg>
    </div>
  );
});

NeuralCore.displayName = "NeuralCore";

/* ─── Shared sub-components ─── */

interface MessageListProps {
  messages: { role: string; content: string }[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  compact?: boolean;
}

const MessageList = ({ messages, isLoading, messagesEndRef, compact }: MessageListProps) => (
  <>
    {messages.map((msg, idx) => (
      <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={`flex gap-${compact ? "2" : "2.5"} ${msg.role === "user" ? "flex-row-reverse" : ""}`}
      >
        {msg.role === "assistant" && (
          <div className={`w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0 mt-0.5 ${compact ? "" : "shadow-md shadow-accent-violet/10"}`}>
            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`max-w-[${compact ? "80" : "85"}%] rounded-xl px-3 py-${compact ? "2" : "2.5"} ${
          msg.role === "user"
            ? `bg-accent-violet/90 text-accent-violet-foreground${compact ? "" : " shadow-lg shadow-accent-violet/20"}`
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
      <div className={`flex gap-${compact ? "2" : "2.5"}`}>
        <div className="w-6 h-6 rounded-full overflow-hidden border border-accent-violet/15 shrink-0">
          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
        </div>
        <div className={`bg-muted/20 rounded-xl px-3 py-${compact ? "2" : "2.5"} border border-accent-violet/5`}>
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
  </>
);

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onVoiceSubmit?: (text: string) => void;
  lang: string;
  rounded?: boolean;
}

const ChatInput = ({ input, setInput, isLoading, onSubmit, onVoiceSubmit, lang, rounded }: ChatInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = lang.startsWith("pt") ? "pt-BR" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text && onVoiceSubmit) {
        onVoiceSubmit(text);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, lang, onVoiceSubmit]);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={lang.startsWith("pt") ? (isListening ? "🎤 Ouvindo..." : "Fale com o Thor...") : (isListening ? "🎤 Listening..." : "Talk to Thor...")}
        disabled={isLoading || isListening}
        className={`flex-1 bg-muted/10 border ${isListening ? "border-accent-violet/40 animate-pulse" : "border-accent-violet/10"} ${rounded ? "rounded-full px-4" : "rounded-lg px-3"} py-2.5 text-xs font-mono focus:outline-none focus:border-accent-violet/30 transition-all placeholder:text-muted-foreground/30`}
      />
      <button type="button" onClick={toggleVoice} disabled={isLoading}
        className={`h-9 w-9 ${rounded ? "rounded-full" : "rounded-lg"} ${isListening ? "bg-destructive/80 hover:bg-destructive" : "bg-muted/20 hover:bg-muted/40"} flex items-center justify-center shrink-0 transition-all relative`}
      >
        {isListening ? (
          <>
            <MicOff className="h-3.5 w-3.5 text-destructive-foreground" />
            <span className={`absolute inset-0 ${rounded ? "rounded-full" : "rounded-lg"} border border-destructive animate-ping opacity-30`} />
          </>
        ) : (
          <Mic className="h-3.5 w-3.5 text-accent-violet/60" />
        )}
      </button>
      <button type="submit" disabled={!input.trim() || isLoading}
        className={`h-9 w-9 ${rounded ? "rounded-full" : "rounded-lg"} bg-accent-violet/90 hover:bg-accent-violet text-accent-violet-foreground flex items-center justify-center shrink-0 disabled:opacity-30 transition-all shadow-lg shadow-accent-violet/20`}
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      </button>
    </form>
  );
};

interface QuickActionsProps {
  lang: string;
  sendMessage: (text: string) => void;
  mobile?: boolean;
}

const QuickActions = ({ lang, sendMessage, mobile }: QuickActionsProps) => {
  const items = lang.startsWith("pt")
    ? [
        { label: "Me mostre os agentes", icon: "⚡" },
        { label: "Como funciona?", icon: "🔮" },
        ...(!mobile ? [{ label: "Quero um tour", icon: "🌐" }] : []),
      ]
    : [
        { label: "Show me agents", icon: "⚡" },
        { label: "How does it work?", icon: "🔮" },
        ...(!mobile ? [{ label: "Give me a tour", icon: "🌐" }] : []),
      ];

  return (
    <div className={`flex gap-2 flex-wrap ${mobile ? "px-3 pb-2" : "justify-center"}`}>
      {items.map(q => (
        <button key={q.label} onClick={() => sendMessage(q.label)}
          className={`flex items-center gap-1${mobile ? "" : ".5"} px-${mobile ? "3" : "4"} py-${mobile ? "1.5" : "2"} rounded-full ${
            mobile
              ? "bg-muted/20 border border-accent-violet/10 active:bg-accent-violet/10 text-[10px]"
              : "bg-background/60 backdrop-blur-xl border border-accent-violet/10 hover:border-accent-violet/30 hover:bg-accent-violet/5 text-[11px]"
          } font-mono tracking-wide transition-all`}
        >
          <span>{q.icon}</span>{q.label}
        </button>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   THOR RENDERER — Composes all visual phases
   ═══════════════════════════════════════════════════ */

export function ThorRenderer(props: ThorCoreState & ThorCoreActions) {
  const {
    phase, messages, input, isLoading, voiceEnabled, showChat, expanded,
    isSpeaking, isMobile, shouldUseLiteCore, lang, visitorName,
    demoModalOpen, demoType, lastAssistantContent,
    setInput, setExpanded, setShowChat, setVoiceEnabled,
    sendMessage, minimize, activate, stopTTS, forgetMemory,
    openDemo, closeDemo, replayLastMessage,
    messagesEndRef,
  } = props;

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  const demoModal = (
    <AgentDemoModal
      isOpen={demoModalOpen}
      onClose={closeDemo}
      demoType={demoType}
      lang={lang}
      onCTA={() => {
        const isPt = lang.startsWith("pt");
        window.location.href = "/pricing";
      }}
    />
  );
  /* ══ ENTRANCE ══ */
  if (phase === "entrance") {
    const entranceSize = isMobile ? 200 : 360;
    return (
      <>
        {demoModal}
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 backdrop-blur-xl"
            style={{ background: "radial-gradient(ellipse at center, hsl(var(--accent-violet) / 0.08) 0%, hsl(var(--background) / 0.8) 60%, hsl(var(--background) / 0.92) 100%)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
          />
          <motion.div className="relative z-10 flex flex-col items-center"
            initial={{ scale: 0.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 60 }}
          >
            <div className="relative" style={{ width: entranceSize, height: entranceSize }}>
              <NeuralCore isSpeaking={false} size={entranceSize} lite={isMobile} />
              <div className="absolute rounded-full overflow-hidden"
                style={{ width: entranceSize * 0.52, height: entranceSize * 0.52, left: "50%", top: "50%", transform: "translate(-50%, -50%)", border: "1px solid hsl(var(--accent-violet) / 0.2)" }}
              >
                <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              </div>
            </div>
            <motion.div className="mt-4 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <motion.h2 className="font-mono text-lg sm:text-2xl font-bold tracking-[0.4em] uppercase text-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              >THOR</motion.h2>
              <motion.div className="mt-2 flex items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
                <motion.span className="h-px bg-accent-violet/30" initial={{ width: 0 }} animate={{ width: 30 }} transition={{ delay: 1.5, duration: 0.8 }} />
                <motion.span className="text-[7px] font-mono uppercase tracking-[0.5em] text-accent-violet/60"
                  animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                >Neural Sync</motion.span>
                <motion.span className="h-px bg-accent-violet/30" initial={{ width: 0 }} animate={{ width: 30 }} transition={{ delay: 1.5, duration: 0.8 }} />
              </motion.div>
            </motion.div>
            <motion.div className="mt-3 flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div key={i} className="w-5 h-[2px] rounded-full bg-accent-violet"
                  animate={{ opacity: [0.1, 0.8, 0.1], scaleX: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </>
    );
  }

  /* ══ MINIMIZED ══ */
  if (phase === "minimized") {
    return (
      <>
        {demoModal}
        <motion.button
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
          onClick={activate}
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[9999] group cursor-pointer"
          aria-label="Talk to Thor"
        >
          <motion.span className="absolute inset-[-3px] rounded-full overflow-hidden"
            animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute inset-0" style={{
              background: "conic-gradient(from 0deg, transparent 30%, hsl(var(--accent-violet) / 0.7), hsl(var(--accent-violet) / 0.15), transparent 75%)",
            }} />
          </motion.span>
          <motion.span className="absolute inset-[-8px] rounded-full border border-accent-violet/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/95 backdrop-blur-2xl overflow-hidden border border-accent-violet/10">
            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover rounded-full" />
            <span className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_hsl(var(--accent-violet)/0.15)]" />
          </span>
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background z-10">
            <span className="block w-full h-full rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
          </span>
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-[0.3em] uppercase text-accent-violet/50 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-accent-violet/10">
            THOR · ONLINE
          </span>
        </motion.button>
      </>
    );
  }

  /* ══ ACTIVE — MOBILE ══ */
  if (isMobile) {
    const mobileOrbSize = expanded ? 140 : 100;
    return (
      <>
        {demoModal}
      <AnimatePresence>
        <motion.div
          className={`fixed z-[9999] ${expanded ? "inset-0 flex flex-col" : "bottom-0 left-0 right-0"}`}
          initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {expanded && (
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(12px)" }}
              onClick={() => setExpanded(false)}
            />
          )}

          <div className={`relative z-10 ${expanded ? "flex-1 flex flex-col safe-area-bottom" : ""}`}>
            <div className={`flex flex-col items-center ${expanded ? "pt-6 pb-2" : "pt-3 pb-1"}`}>
              <div className="relative" style={{ width: mobileOrbSize, height: mobileOrbSize }}>
                <NeuralCore isSpeaking={isSpeaking} size={mobileOrbSize} lite />
                <motion.div className="absolute rounded-full overflow-hidden"
                  style={{ width: mobileOrbSize * 0.52, height: mobileOrbSize * 0.52, left: "50%", top: "50%", transform: "translate(-50%, -50%)", border: "1px solid hsl(var(--accent-violet) / 0.2)" }}
                >
                  <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                </motion.div>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/60 border border-accent-violet/10">
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[8px] font-mono font-bold tracking-[0.3em] uppercase text-foreground/80">THOR</span>
                </div>
                <button onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                  className="p-1 rounded-full bg-background/60 border border-accent-violet/10"
                >
                  {voiceEnabled ? <Volume2 className="w-3 h-3 text-accent-violet/60" /> : <VolumeX className="w-3 h-3 text-accent-violet/40" />}
                </button>
                <button onClick={() => setExpanded(!expanded)}
                  className="p-1 rounded-full bg-background/60 border border-accent-violet/10"
                >
                  {expanded ? <Minimize2 className="w-3 h-3 text-accent-violet/40" /> : <Maximize2 className="w-3 h-3 text-accent-violet/40" />}
                </button>
                <button onClick={minimize}
                  className="p-1 rounded-full bg-background/60 border border-accent-violet/10"
                >
                  <X className="w-3 h-3 text-accent-violet/40" />
                </button>
              </div>
            </div>

            <div className={`${expanded ? "flex-1 flex flex-col" : ""} bg-background/80 backdrop-blur-2xl ${expanded ? "" : "rounded-t-2xl"} border-t border-accent-violet/5`}>
              {expanded ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <MessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} compact />
                </div>
              ) : (
                lastMessage && (
                  <div className="px-4 py-3 cursor-pointer" onClick={() => setExpanded(true)}>
                    <p className="text-[11px] text-foreground/80 leading-snug font-mono line-clamp-3">
                      {lastMessage.content.replace(/[*#]/g, "").slice(0, 150)}
                      {lastMessage.content.length > 150 && "..."}
                    </p>
                    <span className="text-[8px] text-accent-violet/40 font-mono mt-1 block">▼ toque para expandir</span>
                  </div>
                )
              )}

              {!expanded && messages.length <= 1 && !isLoading && messages.some(m => m.role === "assistant") && (
                <QuickActions lang={lang} sendMessage={sendMessage} mobile />
              )}

              <div className="p-3 border-t border-accent-violet/5 safe-area-bottom">
                <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={() => sendMessage()} onVoiceSubmit={(text) => sendMessage(text)} lang={lang} />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      </>
    );
  }

  /* ══ ACTIVE — DESKTOP: Premium floating command widget ══ */
  const widgetOrbSize = 80;

  return (
    <>
      {demoModal}
    <motion.div
      className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
      style={{ maxWidth: 400 }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="pointer-events-auto w-[400px]"
            style={{ maxHeight: 540 }}
          >
            {/* Outer glow border */}
            <div className="relative rounded-[20px] p-[1px]">
              {/* Animated gradient border */}
              <motion.div
                className="absolute inset-0 rounded-[20px] overflow-hidden"
                style={{ padding: "1px" }}
              >
                <motion.div
                  className="absolute inset-[-50%] w-[200%] h-[200%]"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 40%, hsl(var(--accent-violet) / 0.6), hsl(var(--accent-cyan) / 0.4), transparent 65%)",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>

              {/* Main container */}
              <div className="relative bg-background/[0.97] backdrop-blur-3xl rounded-[20px] overflow-hidden flex flex-col shadow-[0_0_60px_-10px_hsl(var(--accent-violet)/0.25),0_25px_50px_-12px_hsl(0_0%_0%/0.5)]" style={{ maxHeight: 538 }}>

                {/* Ambient glow effect at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-24 rounded-full opacity-[0.07]"
                  style={{ background: "radial-gradient(ellipse, hsl(var(--accent-violet)), transparent)" }}
                />

                {/* Header — Premium tier */}
                <div className="relative px-4 py-3 border-b border-accent-violet/[0.06] shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar with ring */}
                      <div className="relative">
                        <motion.div
                          className="absolute inset-[-2px] rounded-full"
                          style={{ background: "conic-gradient(from 0deg, hsl(var(--accent-violet) / 0.5), hsl(var(--accent-cyan) / 0.3), hsl(var(--accent-violet) / 0.5))" }}
                          animate={isSpeaking ? { rotate: 360 } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-background">
                          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                        </div>
                        {/* Status indicator */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background z-10 flex items-center justify-center">
                          <span className="w-full h-full rounded-full bg-emerald-500" />
                          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold tracking-wide text-foreground">THOR</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet/70 tracking-widest uppercase border border-accent-violet/[0.06]">AI CEO</span>
                        </div>
                        {visitorName ? (
                          <span className="text-[9px] text-muted-foreground/60 font-mono">
                            {lang.startsWith("pt") ? `Falando com ${visitorName}` : `Talking to ${visitorName}`}
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-500/70 font-mono flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                        className={`p-2 rounded-lg transition-all ${voiceEnabled ? "bg-accent-violet/10 text-accent-violet" : "hover:bg-muted/20 text-muted-foreground/40 hover:text-muted-foreground/60"}`}
                      >
                        {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={minimize}
                        className="p-2 rounded-lg hover:bg-muted/20 text-muted-foreground/40 hover:text-muted-foreground/60 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 340 }}>
                  <MessageList messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} />
                </div>

                {/* Quick actions */}
                {messages.length <= 1 && !isLoading && messages.some(m => m.role === "assistant") && (
                  <div className="px-4 pb-2">
                    <QuickActions lang={lang} sendMessage={sendMessage} mobile />
                  </div>
                )}

                {/* Speaking visualizer */}
                {isSpeaking ? (
                  <div className="flex items-center gap-[2px] h-5 justify-center px-4 pb-2">
                    <div className="flex items-center gap-[1.5px] bg-accent-violet/[0.06] rounded-full px-3 py-1.5">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <motion.div key={i} className="w-[1.5px] rounded-full bg-accent-violet/60"
                          animate={{ height: [1, Math.random() * 10 + 3, 1] }}
                          transition={{ duration: 0.2 + Math.random() * 0.25, repeat: Infinity, delay: i * 0.015 }}
                        />
                      ))}
                      <button onClick={stopTTS} className="ml-2 p-0.5 rounded-full hover:bg-muted/20 transition-all">
                        <VolumeX className="w-3 h-3 text-accent-violet/60" />
                      </button>
                    </div>
                  </div>
                ) : (
                  lastAssistantContent && !isLoading && (
                    <div className="flex items-center justify-center px-4 pb-1">
                      <button onClick={replayLastMessage}
                        className="flex items-center gap-1 text-[8px] font-mono text-accent-violet/40 hover:text-accent-violet/70 transition-all px-2 py-1 rounded-full hover:bg-accent-violet/[0.04]"
                      >
                        <Play className="w-2.5 h-2.5" />
                        {lang.startsWith("pt") ? "Ouvir resposta" : "Listen"}
                      </button>
                    </div>
                  )
                )}

                {/* Input area */}
                <div className="p-3 border-t border-accent-violet/[0.06] shrink-0 bg-muted/[0.02]">
                  <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={() => sendMessage()} onVoiceSubmit={(text) => sendMessage(text)} lang={lang} rounded />
                  {messages.length > 2 && (
                    <button
                      onClick={forgetMemory}
                      className="mt-2 w-full text-[8px] font-mono text-muted-foreground/30 hover:text-destructive/60 transition-colors"
                    >
                      🔒 {lang.startsWith("pt") ? "Esqueça minhas informações" : "Forget my information"}
                    </button>
                  )}
                </div>

                {/* Powered by badge */}
                <div className="flex items-center justify-center pb-2.5 pt-0.5">
                  <span className="text-[7px] font-mono tracking-[0.25em] uppercase text-muted-foreground/20">Powered by Clauthor Neural Engine</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thor orb — always visible at bottom-right */}
      <motion.div className="pointer-events-auto flex items-end gap-3">
        {/* Bubble preview when chat is closed */}
        {!showChat && lastMessage && (
          <motion.div
            className="max-w-[260px] cursor-pointer"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setShowChat(true)}
          >
            <div className="bg-background/90 backdrop-blur-xl border border-accent-violet/10 rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-[0_8px_30px_-8px_hsl(var(--accent-violet)/0.15)]">
              <p className="text-[10px] text-foreground/80 leading-snug font-mono line-clamp-2">
                {lastMessage.content.replace(/[*#]/g, "").slice(0, 120)}
                {lastMessage.content.length > 120 && "..."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Orb button */}
        <div className="relative cursor-pointer" onClick={() => setShowChat(!showChat)}>
          <div className="relative" style={{ width: widgetOrbSize, height: widgetOrbSize }}>
            <NeuralCore isSpeaking={isSpeaking} size={widgetOrbSize} lite />
            {isSpeaking && (
              <motion.div className="absolute inset-[-4px] rounded-full border-2 border-accent-violet/40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
            <div className="absolute rounded-full overflow-hidden"
              style={{
                width: widgetOrbSize * 0.6,
                height: widgetOrbSize * 0.6,
                left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                border: `1px solid hsl(var(--accent-violet) / ${isSpeaking ? '0.5' : '0.2'})`,
              }}
            >
              <img src={thorPhoto} alt="Thor" className={`w-full h-full object-cover ${isSpeaking ? "thor-glitch-active" : ""}`} />
            </div>
          </div>
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-background z-10">
            <span className="block w-full h-full rounded-full bg-emerald-500" />
            {!showChat && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />}
          </span>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}
