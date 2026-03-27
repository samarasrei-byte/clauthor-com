import { useState, useRef, useEffect, useCallback } from "react";
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

/* ─── Holographic Voice Wave ─── */
const HoloWaveform = ({ isSpeaking, size = 220 }: { isSpeaking: boolean; size?: number }) => {
  const bars = 48;
  const radius = size / 2 - 20;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
      <defs>
        <radialGradient id="holo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <filter id="holo-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <circle cx={size / 2} cy={size / 2} r={radius + 15} fill="url(#holo-glow)" />

      {/* Waveform bars in a circle */}
      {Array.from({ length: bars }).map((_, i) => {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const x1 = size / 2 + Math.cos(angle) * (radius - 4);
        const y1 = size / 2 + Math.sin(angle) * (radius - 4);
        const baseLen = 8;
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={size / 2 + Math.cos(angle) * (radius - 4 + baseLen)}
            y2={size / 2 + Math.sin(angle) * (radius - 4 + baseLen)}
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity={isSpeaking ? 0.7 : 0.2}
            animate={isSpeaking ? {
              x2: [
                size / 2 + Math.cos(angle) * (radius - 4 + baseLen),
                size / 2 + Math.cos(angle) * (radius - 4 + baseLen + Math.random() * 18 + 6),
                size / 2 + Math.cos(angle) * (radius - 4 + baseLen),
              ],
              strokeOpacity: [0.4, 0.9, 0.4],
            } : {
              x2: size / 2 + Math.cos(angle) * (radius - 4 + baseLen),
              strokeOpacity: 0.15,
            }}
            transition={{
              duration: 0.3 + Math.random() * 0.4,
              repeat: Infinity,
              delay: i * 0.02,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Outer ring */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius + 16}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="0.5"
        strokeOpacity={0.15}
        strokeDasharray="4 8"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />

      {/* Inner ring */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius - 8}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="0.5"
        strokeOpacity={isSpeaking ? 0.3 : 0.08}
        animate={isSpeaking ? {
          r: [radius - 8, radius - 5, radius - 8],
          strokeOpacity: [0.15, 0.4, 0.15],
        } : {}}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
};

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
    return isPt ? [
      "Boa escolha vir na biblioteca! Posso te ajudar a encontrar o agente perfeito pro seu caso.",
    ] : [
      "Great choice coming to the library! I can help you find the perfect agent for your needs.",
    ];
  }

  if (pathname.includes("/pricing")) {
    return isPt ? [
      "Analisando preços? Posso te ajudar a escolher o plano ideal baseado no seu volume.",
    ] : [
      "Checking prices? I can help you pick the ideal plan based on your volume.",
    ];
  }

  return isPt ? [
    "Precisa de ajuda com alguma coisa? Tô aqui 24/7!",
  ] : [
    "Need help with anything? I'm here 24/7!",
  ];
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — Holographic Center Overlay
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

  // Show entrance on first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => setPhase("entrance"), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Entrance → active
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
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Proactive messages
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

  // Send to backend
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

  const minimize = () => {
    stopTTS();
    setPhase("minimized");
    setShowChat(false);
  };

  const activate = () => {
    setPhase("active");
    if (messages.length === 0) {
      const isPt = lang.startsWith("pt");
      const greeting = isPt ? "Voltei! 😄 Em que posso te ajudar?" : "I'm back! 😄 How can I help?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  };

  const holoSize = typeof window !== "undefined" && window.innerWidth < 640 ? 160 : 220;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // ── ENTRANCE ──
  if (phase === "entrance") {
    return (
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Subtle backdrop — site still visible */}
        <motion.div
          className="absolute inset-0 bg-background/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center gap-4"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 14, stiffness: 80 }}
        >
          {/* Holo waveform + face */}
          <div className="relative" style={{ width: holoSize, height: holoSize }}>
            <HoloWaveform isSpeaking={false} size={holoSize} />
            <div
              className="absolute rounded-full overflow-hidden border border-primary/20"
              style={{
                width: holoSize * 0.55,
                height: holoSize * 0.55,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 40px hsl(var(--primary) / 0.25), inset 0 0 20px hsl(var(--primary) / 0.1)",
              }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
            </div>
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">THOR</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="h-px w-6 bg-primary/30" />
              <span className="text-[9px] text-primary font-mono uppercase tracking-[0.3em]">Initializing</span>
              <span className="h-px w-6 bg-primary/30" />
            </div>
          </motion.div>

          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // ── MINIMIZED — small floating orb ──
  if (phase === "minimized") {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 14 }}
        onClick={activate}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[60] group cursor-pointer"
        aria-label="Talk to Thor"
      >
        <motion.span
          className="absolute inset-[-4px] rounded-full overflow-hidden"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute inset-0" style={{
            background: "conic-gradient(from 0deg, transparent 40%, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.2), transparent 80%)",
          }} />
        </motion.span>

        <span className="absolute inset-[-1px] rounded-full bg-gradient-to-b from-primary/30 via-primary/10 to-primary/30" />

        <span className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-background/90 backdrop-blur-2xl overflow-hidden">
          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover rounded-full" />
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_hsl(var(--primary)/0.15)]" />
        </span>

        {/* Online dot */}
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background z-10">
          <span className="block w-full h-full rounded-full bg-green-500" />
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
        </span>

        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-wider uppercase text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-border/30">
          THOR · Online
        </span>
      </motion.button>
    );
  }

  // ── ACTIVE — Holographic center overlay ──
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Click-through backdrop — very subtle, site fully visible */}
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={minimize}
          style={{ background: "transparent" }}
        />

        {/* Holographic Thor — centered */}
        <motion.div
          className="relative z-10 flex flex-col items-center pointer-events-auto"
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 18, stiffness: 200 }}
        >
          {/* Controls top-right */}
          <div className="absolute -top-2 -right-2 flex items-center gap-1 z-20">
            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
              className="p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
            >
              {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            </button>
            <button
              onClick={minimize}
              className="p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Holo face + waveform */}
          <div className="relative cursor-pointer" style={{ width: holoSize, height: holoSize }}
            onClick={() => setShowChat(!showChat)}
          >
            <HoloWaveform isSpeaking={isSpeaking} size={holoSize} />

            {/* Face */}
            <motion.div
              className="absolute rounded-full overflow-hidden border border-primary/25"
              style={{
                width: holoSize * 0.55,
                height: holoSize * 0.55,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 50px hsl(var(--primary) / 0.2), 0 0 100px hsl(var(--primary) / 0.08)",
              }}
              animate={isSpeaking ? {
                boxShadow: [
                  "0 0 30px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.05)",
                  "0 0 60px hsl(var(--primary) / 0.35), 0 0 120px hsl(var(--primary) / 0.12)",
                  "0 0 30px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.05)",
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
              {/* Holographic scanline */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, hsl(var(--primary) / 0.03) 3px, hsl(var(--primary) / 0.03) 4px)",
                }}
              />
            </motion.div>

            {/* Name label */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-md px-3 py-1 rounded-full border border-primary/15">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase text-foreground/80">THOR</span>
              </div>
            </div>
          </div>

          {/* Floating last message — speech bubble */}
          {lastMessage && !showChat && (
            <motion.div
              className="mt-4 max-w-[90vw] sm:max-w-[400px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={lastMessage.content.slice(0, 20)}
            >
              <div className="relative bg-background/70 backdrop-blur-xl border border-border/20 rounded-2xl px-4 py-3 shadow-xl shadow-primary/5">
                {/* Arrow pointing up */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background/70 border-l border-t border-border/20" />
                <div className="text-[13px] text-foreground/90 prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 leading-relaxed relative z-10">
                  <ReactMarkdown>{lastMessage.content}</ReactMarkdown>
                </div>
                {isSpeaking && (
                  <div className="flex items-center gap-[2px] mt-2 h-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[1.5px] rounded-full bg-primary/40"
                        animate={{ height: [2, Math.random() * 8 + 3, 2] }}
                        transition={{ duration: 0.3 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.03 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Quick actions for first interaction */}
          {messages.length <= 1 && !showChat && !isLoading && messages.some(m => m.role === "assistant") && (
            <motion.div
              className="mt-3 flex gap-2 flex-wrap justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {(lang.startsWith("pt") ? [
                { label: "Me mostre os agentes", icon: "🤖" },
                { label: "Como funciona?", icon: "⚡" },
                { label: "Quero um tour", icon: "🗺️" },
              ] : [
                { label: "Show me agents", icon: "🤖" },
                { label: "How does it work?", icon: "⚡" },
                { label: "Give me a tour", icon: "🗺️" },
              ]).map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.label)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-primary/15 hover:border-primary/30 hover:bg-primary/10 transition-all text-[11px] font-medium"
                >
                  <span>{q.icon}</span>{q.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Expandable Chat Area */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 w-[90vw] sm:w-[400px] overflow-hidden"
              >
                <div className="bg-background/80 backdrop-blur-2xl border border-border/20 rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
                  {/* Messages */}
                  <div className="max-h-[40vh] overflow-y-auto p-3 space-y-2.5">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20 shrink-0 mt-0.5">
                            <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 border border-border/10"
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
                      <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/20 shrink-0">
                          <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-muted/30 rounded-xl px-3 py-2">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                                animate={{ scale: [1, 1.4, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-2.5 border-t border-border/10">
                    <form
                      onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                      className="flex gap-2"
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                        disabled={isLoading}
                        className="flex-1 bg-muted/20 border border-border/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/40"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="h-8 w-8 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input when chat is not expanded — always visible */}
          {!showChat && (
            <motion.div
              className="mt-3 w-[85vw] sm:w-[360px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                  disabled={isLoading}
                  className="flex-1 bg-background/60 backdrop-blur-md border border-border/20 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
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
