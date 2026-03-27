import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2, Volume2, VolumeX, Sparkles, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import thorPhoto from "@/assets/kaelis-ai.png";

const THOR_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const STORAGE_KEY = "thor_greeter_seen_v3";
const PROACTIVE_INTERVAL = 45_000; // Thor talks every 45s

interface ThorMessage {
  role: "user" | "assistant";
  content: string;
}

/* ─── Futuristic Orb Visualization ─── */
const NeuralOrb = ({ isSpeaking, size = 120 }: { isSpeaking: boolean; size?: number }) => {
  const rings = 4;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Core glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)",
        }}
        animate={isSpeaking ? {
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        } : { scale: 1, opacity: 0.5 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbiting rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: `hsl(var(--primary) / ${0.15 - i * 0.03})`,
            margin: -(i * 8 + 4),
          }}
          animate={{
            rotate: 360 * (i % 2 === 0 ? 1 : -1),
            scale: isSpeaking ? [1, 1.02 + i * 0.01, 1] : 1,
          }}
          transition={{
            rotate: { duration: 8 + i * 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}

      {/* Photo center */}
      <motion.div
        className="absolute inset-2 rounded-full overflow-hidden border-2 border-primary/30 shadow-2xl"
        style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.3)" }}
        animate={isSpeaking ? {
          boxShadow: [
            "0 0 30px hsl(var(--primary) / 0.2)",
            "0 0 60px hsl(var(--primary) / 0.5)",
            "0 0 30px hsl(var(--primary) / 0.2)",
          ],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
      </motion.div>

      {/* Pulse particles when speaking */}
      {isSpeaking && Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{
            left: "50%",
            top: "50%",
          }}
          animate={{
            x: [0, Math.cos((i / 6) * Math.PI * 2) * (size * 0.7)],
            y: [0, Math.sin((i / 6) * Math.PI * 2) * (size * 0.7)],
            opacity: [1, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

/* ─── Waveform bars ─── */
const SpeakingWaveform = () => (
  <div className="flex items-center gap-[2px] h-3">
    {Array.from({ length: 16 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-[1.5px] rounded-full bg-primary/50"
        animate={{ height: [3, Math.random() * 10 + 4, 3] }}
        transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.04 }}
      />
    ))}
  </div>
);

/* ─── Proactive questions based on route ─── */
const getProactiveMessages = (pathname: string, lang: string): string[] => {
  const isPt = lang.startsWith("pt");
  
  if (pathname === "/" || pathname === "") {
    return isPt ? [
      "Ei! Notei que você tá olhando a home. Quer que eu te mostre como nossos agentes podem revolucionar sua empresa? 🚀",
      "Tô vendo que você ainda não explorou os departamentos. Posso te guiar? Tenho 200 agentes prontos pra trabalhar!",
      "Quer um tour rápido? Em 2 minutos eu te mostro o que a CLAUTHOR pode fazer pela sua empresa.",
      "Psiu! Sabia que nossos agentes já executaram mais de 50 mil ações? Quer ver como eles funcionam na prática?",
    ] : [
      "Hey! I noticed you're on the homepage. Want me to show you how our agents can transform your business? 🚀",
      "I see you haven't explored the departments yet. Can I guide you? I have 200 agents ready to work!",
      "Want a quick tour? In 2 minutes I'll show you what CLAUTHOR can do for your company.",
      "Psst! Did you know our agents have executed over 50k actions? Want to see how they work?",
    ];
  }
  
  if (pathname.includes("/library")) {
    return isPt ? [
      "Boa escolha vir na biblioteca! Posso te ajudar a encontrar o agente perfeito pro seu caso.",
      "Dica: você pode testar qualquer agente gratuitamente antes de contratar. Quer experimentar?",
    ] : [
      "Great choice coming to the library! I can help you find the perfect agent for your needs.",
      "Tip: you can test any agent for free before hiring. Want to try one?",
    ];
  }
  
  if (pathname.includes("/pricing")) {
    return isPt ? [
      "Analisando preços? Posso te ajudar a escolher o plano ideal baseado no seu volume.",
      "O plano Pro tem o melhor custo-benefício. Quer que eu faça uma simulação personalizada?",
    ] : [
      "Checking prices? I can help you pick the ideal plan based on your volume.",
      "The Pro plan has the best value. Want me to run a personalized simulation?",
    ];
  }
  
  return isPt ? [
    "Precisa de ajuda com alguma coisa? Tô aqui 24/7!",
    "Quer que eu te mostre algo específico da plataforma?",
  ] : [
    "Need help with anything? I'm here 24/7!",
    "Want me to show you something specific about the platform?",
  ];
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const ThorGreeter = () => {
  const [phase, setPhase] = useState<"entrance" | "chat" | "minimized">("minimized");
  const [messages, setMessages] = useState<ThorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveIndexRef = useRef(0);
  const proactiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lang = navigator.language || "en";

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show entrance on first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => setPhase("entrance"), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Transition from entrance to chat
  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("chat");
        localStorage.setItem(STORAGE_KEY, "1");
        // Send initial greeting
        const isPt = lang.startsWith("pt");
        const greeting = isPt
          ? "Olá! Eu sou o **Thor**, CEO e Orquestrador da CLAUTHOR. 🧠\n\nEstou aqui pra te guiar por tudo. Me conta: **o que te trouxe aqui hoje?** Posso te ajudar a encontrar o agente perfeito, montar um time de IA, ou simplesmente te mostrar como tudo funciona!"
          : "Hello! I'm **Thor**, CEO & Orchestrator of CLAUTHOR. 🧠\n\nI'm here to guide you through everything. Tell me: **what brought you here today?** I can help you find the perfect agent, build an AI team, or simply show you how it all works!";
        
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceEnabled) speak(greeting.replace(/[*#]/g, ""), THOR_VOICE_ID);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Proactive messages - Thor never stops talking
  useEffect(() => {
    if (phase !== "minimized" || hasInteracted) return;
    
    proactiveTimerRef.current = setInterval(() => {
      const msgs = getProactiveMessages(location.pathname, lang);
      const idx = proactiveIndexRef.current % msgs.length;
      const msg = msgs[idx];
      proactiveIndexRef.current++;
      
      // Pop open and say something
      setPhase("chat");
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
      if (voiceEnabled) speak(msg.replace(/[*#🚀]/g, ""), THOR_VOICE_ID);
    }, PROACTIVE_INTERVAL);

    return () => {
      if (proactiveTimerRef.current) clearInterval(proactiveTimerRef.current);
    };
  }, [phase, location.pathname, hasInteracted, voiceEnabled]);

  // Send to backend
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);

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

      // Speak the response
      if (voiceEnabled && assistantText) {
        speak(assistantText.replace(/[*#🚀🧠💡]/g, "").slice(0, 300), THOR_VOICE_ID);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: lang.startsWith("pt")
          ? "Ops, tive um problema de conexão. Tenta de novo?"
          : "Oops, had a connection issue. Try again?",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, user, location.pathname, voiceEnabled, speak, lang]);

  const minimize = () => {
    stopTTS();
    setPhase("minimized");
  };

  const openChat = () => {
    setPhase("chat");
    if (messages.length === 0) {
      const isPt = lang.startsWith("pt");
      const greeting = isPt
        ? "Voltei! 😄 Em que posso te ajudar?"
        : "I'm back! 😄 How can I help you?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  };

  // ── ENTRANCE PHASE ──
  if (phase === "entrance") {
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Radial pulse */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }}
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 80 }}
        >
          <NeuralOrb isSpeaking={false} size={140} />

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">THOR</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-px w-8 bg-primary/30" />
              <span className="text-xs text-primary font-mono uppercase tracking-[0.3em]">CEO & Orchestrator</span>
              <span className="h-px w-8 bg-primary/30" />
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-2 font-mono">
              {lang.startsWith("pt") ? "Inicializando..." : "Initializing..."}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // ── MINIMIZED (Floating Orb) ──
  if (phase === "minimized") {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 14 }}
        onClick={openChat}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-[60] group cursor-pointer"
        aria-label="Talk to Thor"
      >
        {/* Rotating glow */}
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
          <span className="absolute inset-0 rounded-full bg-gradient-to-t from-background/40 via-transparent to-transparent" />
        </span>

        {/* Hover pulse */}
        <motion.span
          className="absolute inset-[-6px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.3)" }}
        />

        {/* Online dot */}
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-background z-10">
          <span className="block w-full h-full rounded-full bg-accent-emerald" />
          <span className="absolute inset-0 rounded-full bg-accent-emerald animate-ping opacity-60" />
        </span>

        {/* Tooltip */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-wider uppercase text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-border/30">
          THOR · Online
        </span>
      </motion.button>
    );
  }

  // ── CHAT PHASE ──
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[80vh] flex flex-col"
      >
        {/* Outer glow */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent opacity-60 pointer-events-none" />

        <div className="relative bg-card/95 backdrop-blur-2xl border border-border/30 rounded-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl shadow-primary/10">
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/10 shrink-0">
            <div className="relative">
              <NeuralOrb isSpeaking={isSpeaking} size={40} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-wide">THOR</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono uppercase tracking-widest border border-primary/10">
                  Online
                </span>
              </div>
              {isSpeaking && <SpeakingWaveform />}
              {!isSpeaking && (
                <span className="text-[9px] text-muted-foreground font-mono tracking-wider">
                  CEO & Orchestrator
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) stopTTS(); }}
                className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={minimize}
                className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/20 shrink-0">
                    <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 border border-border/20"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="text-[13px] prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_li]:mb-0.5 leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[13px]">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/20 shrink-0">
                  <img src={thorPhoto} alt="Thor" className="w-full h-full object-cover" />
                </div>
                <div className="bg-muted/30 border border-border/20 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions for first-time */}
          {messages.length <= 1 && !isLoading && messages.some(m => m.role === "assistant") && (
            <div className="px-3 pb-2">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {(lang.startsWith("pt") ? [
                  { label: "Me mostre os agentes", icon: "🤖" },
                  { label: "Como funciona?", icon: "⚡" },
                  { label: "Quero um tour", icon: "🗺️" },
                ] : [
                  { label: "Show me the agents", icon: "🤖" },
                  { label: "How does it work?", icon: "⚡" },
                  { label: "Give me a tour", icon: "🗺️" },
                ]).map(q => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.label)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all text-[11px] font-medium whitespace-nowrap"
                  >
                    <span>{q.icon}</span>{q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border/10 shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang.startsWith("pt") ? "Fale com o Thor..." : "Talk to Thor..."}
                disabled={isLoading}
                className="flex-1 bg-muted/20 border border-border/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/30 transition-colors placeholder:text-muted-foreground/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
          </div>

          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThorGreeter;
