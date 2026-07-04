import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Zap, CheckCircle2, ArrowRight, Minimize2, Maximize2, X } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

interface ChatMessage {
  role: "agent" | "user" | "system";
  contentKey: string;
  typing?: boolean;
  action?: string;
}

const SCRIPT_KEYS: ChatMessage[] = [
  { role: "system", contentKey: "demo_chat.sys_connected" },
  { role: "agent", contentKey: "demo_chat.agent_greeting" },
  { role: "user", contentKey: "demo_chat.user_confirm" },
  { role: "agent", contentKey: "demo_chat.agent_analyzing" },
  { role: "system", contentKey: "demo_chat.sys_ticket1" },
  { role: "agent", contentKey: "demo_chat.agent_resolved1" },
  { role: "system", contentKey: "demo_chat.sys_ticket1_done" },
  { role: "system", contentKey: "demo_chat.sys_ticket2_done" },
  { role: "system", contentKey: "demo_chat.sys_ticket3_done" },
  { role: "agent", contentKey: "demo_chat.agent_summary" },
];

const TIMINGS = [800, 2000, 1500, 1200, 1000, 2500, 800, 700, 700, 2000];

const LiveDemoAgent = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-start immediately with first system message pre-loaded
  useEffect(() => {
    if (SCRIPT_KEYS.length > 0) {
      setMessages([SCRIPT_KEYS[0]]);
      setCurrentIndex(1);
    }
    const timer = setTimeout(() => setStarted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started || currentIndex >= SCRIPT_KEYS.length) {
      if (currentIndex >= SCRIPT_KEYS.length && started) setCompleted(true);
      return;
    }

    const msg = SCRIPT_KEYS[currentIndex];
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => setMinimized(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  if (minimized && isMobile) {
    return (
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={() => setMinimized(false)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 backdrop-blur-xl relative z-10"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-display text-xs font-bold">{t("demo_chat.agent_name")}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {messages.length > 0 ? t(messages[messages.length - 1].contentKey).slice(0, 40) + "..." : t("demo_chat.live_label")}
            </p>
          </div>
          <Maximize2 className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
                <p className="font-display text-xs font-bold">{t("demo_chat.agent_name")}</p>
                <p className="font-mono text-[9px] text-emerald-500/80 uppercase tracking-wider">{t("demo_chat.online_now")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <Zap className="h-2.5 w-2.5 text-primary/60" />
                <span className="font-mono text-[9px] text-muted-foreground">{t("demo_chat.live_badge")}</span>
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ willChange: "opacity, transform" }}
                >
                  {msg.role === "system" ? (
                    <div className="flex items-center justify-center">
                      <span className="font-mono text-[10px] text-muted-foreground/70 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                        {t(msg.contentKey)}
                      </span>
                    </div>
                  ) : msg.role === "agent" ? (
                    <div className="flex items-start gap-2.5 max-w-[90%]">
                      <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                        <Bot className="h-3 w-3 text-primary/70" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-muted/40 border border-border/50 px-3.5 py-2.5">
                        <p className="text-xs leading-relaxed text-foreground/90">{t(msg.contentKey)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                      <div className="shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                        <User className="h-3 w-3 text-primary/70" />
                      </div>
                      <div className="rounded-xl rounded-tr-sm bg-primary/10 border border-primary/15 px-3.5 py-2.5">
                        <p className="text-xs leading-relaxed text-foreground/90">{t(msg.contentKey)}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

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

            {completed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="pt-2"
              >
                <Link to="/library">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 group cursor-pointer hover:bg-primary/10 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="font-display text-xs font-bold text-primary">{t("demo_chat.impressed")}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-3">
                      {t("demo_chat.cta_desc")}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-wider">
                      {t("demo_chat.cta_link")}
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
            {t("demo_chat.auto_label")}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveDemoAgent;
