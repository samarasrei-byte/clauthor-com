import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Zap, CheckCircle2, ArrowRight, Sparkles, Minimize2, Maximize2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
/* ═══════════════════════════════════════════════════════
   LIVE DEMO AGENT
   Auto-playing conversation that shows an AI agent
   solving a real business problem in real-time.
   The agent "calls" the user — not the other way around.
   ═══════════════════════════════════════════════════════ */

interface ChatMessage {
  role: "agent" | "user" | "system";
  content: string;
  typing?: boolean;
  action?: string;
}

const DEMO_SCRIPT: ChatMessage[] = [
  { role: "system", content: "Agente de Atendimento conectado" },
  { role: "agent", content: "Olá! Sou a Ana, sua agente de atendimento. Detectei 3 tickets abertos com clientes insatisfeitos. Posso resolver agora?" },
  { role: "user", content: "Sim, pode resolver." },
  { role: "agent", content: "Analisando os tickets..." },
  { role: "system", content: "🔍 Processando ticket #1247 — Cliente: Maria Silva" },
  { role: "agent", content: "Ticket #1247 resolvido: cliente queria reembolso por atraso na entrega. Apliquei 15% de desconto + frete grátis no próximo pedido. Cliente respondeu: \"Obrigada, adorei o atendimento!\"" },
  { role: "system", content: "✅ Ticket #1247 — Resolvido em 8 segundos" },
  { role: "system", content: "✅ Ticket #1248 — Resolvido em 12 segundos" },
  { role: "system", content: "✅ Ticket #1249 — Resolvido em 6 segundos" },
  { role: "agent", content: "Pronto! 3 tickets resolvidos em 26 segundos. Satisfação do cliente: 98%. Tempo médio que um humano levaria: 45 minutos." },
];

const TIMINGS = [800, 2000, 1500, 1200, 1000, 2500, 800, 700, 700, 2000];

const LiveDemoAgent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-start after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Play script
  useEffect(() => {
    if (!started || currentIndex >= DEMO_SCRIPT.length) {
      if (currentIndex >= DEMO_SCRIPT.length && started) setCompleted(true);
      return;
    }

    const msg = DEMO_SCRIPT[currentIndex];
    const delay = TIMINGS[currentIndex] || 1000;

    if (msg.role === "agent") {
      setIsTyping(true);
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, msg]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(typingTimer);
    } else {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [started, currentIndex]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // On mobile, show minimized pill by default after a few seconds
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => setMinimized(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Minimized pill for mobile
  if (minimized && isMobile) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setMinimized(false)}
        className="w-full max-w-md mx-auto flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 backdrop-blur-xl relative z-10"
      >
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display text-xs font-bold">Ana — Atendimento</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {messages.length > 0 ? messages[messages.length - 1].content.slice(0, 40) + "..." : "Demo ao vivo"}
          </p>
        </div>
        <Maximize2 className="h-4 w-4 text-muted-foreground shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto lg:mx-0 relative z-10"
    >
      <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl overflow-hidden relative">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
              </div>
            </div>
            <div>
              <p className="font-display text-xs font-bold">Ana — Atendimento</p>
              <p className="font-mono text-[9px] text-emerald-500/80 uppercase tracking-wider">Online agora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <Zap className="h-2.5 w-2.5 text-primary/60" />
              <span className="font-mono text-[9px] text-muted-foreground">DEMO AO VIVO</span>
            </div>
            {isMobile && (
              <button
                onClick={() => setMinimized(true)}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div ref={scrollRef} className="h-[280px] sm:h-[320px] overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === "system" ? (
                  <div className="flex items-center justify-center">
                    <span className="font-mono text-[10px] text-muted-foreground/70 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.role === "agent" ? (
                  <div className="flex items-start gap-2.5 max-w-[90%]">
                    <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                      <Bot className="h-3 w-3 text-primary/70" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-muted/40 border border-border/50 px-3.5 py-2.5">
                      <p className="text-xs leading-relaxed text-foreground/90">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                      <User className="h-3 w-3 text-primary/70" />
                    </div>
                    <div className="rounded-xl rounded-tr-sm bg-primary/10 border border-primary/15 px-3.5 py-2.5">
                      <p className="text-xs leading-relaxed text-foreground/90">{msg.content}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2.5"
              >
                <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-primary/70" />
                </div>
                <div className="rounded-xl rounded-tl-sm bg-muted/40 border border-border/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(j => (
                      <motion.div
                        key={j}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary/50"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion CTA */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="pt-2"
            >
              <Link to="/library">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="font-display text-xs font-bold text-primary">Impressionado?</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Esse é só 1 dos 80 agentes. Cada um é especialista em uma área diferente.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-wider">
                    Conhecer todos os agentes
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subtle label below */}
      <div className="text-center mt-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
          Demonstração automática — sem input necessário
        </span>
      </div>
    </motion.div>
  );
};

export default LiveDemoAgent;
