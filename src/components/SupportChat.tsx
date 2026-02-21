import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SupportChatProps {
  area?: "public" | "client" | "admin";
}

const SupportChat = ({ area = "public" }: SupportChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user } = useAuth();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({
            messages: updated.map(m => ({ role: m.role, content: m.content })),
            context: { area, route: location.pathname, authenticated: !!user },
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
              scrollToBottom();
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, estou com dificuldades no momento. Tente novamente ou entre em contato pelo email suporte@prometheus.ai"
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [input, isLoading, messages, area, location.pathname, user]);

  const greeting = area === "admin"
    ? "Olá, Admin! Como posso ajudar na gestão da plataforma?"
    : area === "client"
    ? "Olá! Como posso ajudar com seus agentes hoje?"
    : "Olá! Bem-vindo ao PROMETHEUS. Como posso ajudar?";

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-[9998] h-13 w-13 rounded-2xl flex items-center justify-center group cursor-pointer"
            style={{ position: "fixed" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Rotating border */}
            <span className="absolute inset-0 rounded-2xl overflow-hidden">
              <span
                className="absolute inset-[-50%] animate-spin"
                style={{
                  background: "conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent, transparent)",
                  animationDuration: "5s",
                }}
              />
            </span>
            <span className="absolute inset-[1px] rounded-[15px] bg-background/90 backdrop-blur-2xl" />
            
            {/* Notification dot */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)] z-20" />
            
            <MessageSquare className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors duration-300 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-6 z-[9998] w-[380px] h-[520px] flex flex-col rounded-2xl overflow-hidden"
            style={{ position: "fixed" }}
          >
            {/* Animated border */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <div
                className="absolute inset-[-100%] animate-spin"
                style={{
                  background: "conic-gradient(from 180deg, transparent 60%, hsl(var(--primary) / 0.3), transparent 80%)",
                  animationDuration: "8s",
                }}
              />
            </div>

            {/* Main container */}
            <div className="relative flex flex-col h-full rounded-2xl bg-background/[0.97] backdrop-blur-3xl border border-white/[0.04] overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              {/* Header */}
              <div className="relative px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <div className="relative">
                  <div className="h-8 w-8 rounded-xl border border-white/[0.06] bg-primary/[0.08] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-foreground/80">
                    Suporte IA
                  </p>
                  <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40">
                    Sempre online
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-lg border border-white/[0.04] bg-white/[0.02] flex items-center justify-center hover:border-white/[0.08] hover:bg-white/[0.04] transition-all"
                >
                  <Minimize2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5 items-start"
                  >
                    <div className="h-6 w-6 rounded-lg bg-primary/[0.08] border border-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                      <p className="text-[12px] text-foreground/70 leading-relaxed">{greeting}</p>
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`h-6 w-6 rounded-lg border border-white/[0.04] flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.role === "user" ? "bg-primary/[0.12]" : "bg-white/[0.03]"
                    }`}>
                      {msg.role === "user" 
                        ? <User className="h-3 w-3 text-primary" />
                        : <Bot className="h-3 w-3 text-primary/70" />
                      }
                    </div>
                    <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary/[0.1] border border-primary/[0.15] rounded-tr-sm"
                        : "bg-white/[0.03] border border-white/[0.04] rounded-tl-sm"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="text-[12px] text-foreground/70 leading-relaxed prose prose-invert prose-xs max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2.5 items-start"
                  >
                    <div className="h-6 w-6 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center shrink-0">
                      <Bot className="h-3 w-3 text-primary/70" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl rounded-tl-sm px-3 py-2.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-primary/40"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input area */}
              <div className="relative px-3 pb-3 pt-2 shrink-0">
                <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Digite sua dúvida..."
                      className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/20 focus:bg-white/[0.04] transition-all tracking-wide"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center hover:border-primary/20 hover:bg-primary/[0.06] disabled:opacity-30 transition-all duration-300 group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>
                </div>
                <p className="text-center text-[8px] tracking-[0.15em] uppercase text-muted-foreground/20 mt-2">
                  Powered by PROMETHEUS AI
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;
