import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2, User, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

const ConciergeChat = ({ isOpen, onClose, onNavigate }: ConciergeChatProps) => {
  const { t, i18n } = useTranslation();

  const QUICK_PROMPTS = [
    { label: i18n.language === "pt" ? "O que meus agentes fazem?" : "What do my agents do?", icon: "🤖" },
    { label: i18n.language === "pt" ? "Me mostre o dashboard" : "Show me the dashboard", icon: "📊" },
    { label: i18n.language === "pt" ? "Como falo com um agente?" : "How do I talk to an agent?", icon: "💬" },
    { label: i18n.language === "pt" ? "O que é a Reunião?" : "What is the Meeting?", icon: "👥" },
  ];
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialSent = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial greeting when opened
  useEffect(() => {
    if (isOpen && !initialSent.current && messages.length === 0) {
      initialSent.current = true;
      sendToBackend([{ role: "user", content: i18n.language === "pt" ? "Olá! Acabei de chegar no meu dashboard. Me apresente meus agentes e me guie!" : "Hello! I just arrived at my dashboard. Introduce my agents and guide me!" }], true);
    }
  }, [isOpen]);

  const sendToBackend = useCallback(async (apiMessages: ConciergeMessage[], isAutomatic = false) => {
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        toast.error("Faça login para usar o concierge.");
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/concierge-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: apiMessages, language: i18n.language }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Erro no concierge.");
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      // SSE streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (deltaContent) {
              assistantSoFar += deltaContent;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) {
              assistantSoFar += c;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Concierge error:", error);
      toast.error("Erro de conexão.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");

    const userMessage: ConciergeMessage = { role: "user", content: msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    await sendToBackend(updatedMessages);
  }, [input, isLoading, messages, sendToBackend]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg holo-card rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center animate-pulse-glow">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">CLAUTHOR Concierge</h3>
                <p className="text-[10px] text-muted-foreground">{t("dashboard.concierge_subtitle")}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center mb-4 animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">{t("dashboard.preparing")}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.getting_to_know")}</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-primary/20" : "bg-gradient-to-br from-primary/15 to-primary-glow/15"
                }`}>
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="text-sm prose prose-sm prose-invert max-w-none [&_p]:mb-1.5 [&_li]:mb-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary-glow/15 flex items-center justify-center">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-xl px-3.5 py-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts (show only at start) */}
          {messages.length <= 2 && !isLoading && messages.some(m => m.role === "assistant") && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handleSend(prompt.label)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all text-xs font-medium whitespace-nowrap"
                  >
                    <span>{prompt.icon}</span>
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("dashboard.ask_anything")}
                disabled={isLoading}
                className="flex-1 bg-card border-border text-sm h-9"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 neon-glow"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
            <button
              onClick={onClose}
              className="w-full mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            >
              {t("dashboard.skip_explore")} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConciergeChat;
