import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import type { MonixMessage, MonixConfig } from "@/hooks/useMonix";
import { useTranslation } from "react-i18next";

interface MonixChatProps {
  messages: MonixMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  config: MonixConfig;
  onSend: (msg: string) => void;
  onStop: () => void;
  onClear: () => void;
}

const MonixChat = ({ messages, isLoading, isStreaming, config, onSend, onStop, onClear }: MonixChatProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  // Voice input with proper permission handling (parity with OmnixChat)
  const toggleVoice = useCallback(async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error(t("cmd.mic_unsupported"));
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Request microphone permission explicitly
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      if (err.name === "NotAllowedError") {
        toast.error(t("cmd.mic_denied"));
      } else if (err.name === "NotFoundError") {
        toast.error(t("cmd.mic_not_found"));
      } else {
        toast.error(t("cmd.mic_error", { error: err.message || "Unknown" }));
      }
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = config.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      console.error("SpeechRecognition error:", e.error, e.message);
      if (e.error === "not-allowed") {
        toast.error(t("cmd.mic_denied_short"));
      } else if (e.error === "no-speech") {
        toast.info(t("cmd.no_speech"));
      } else if (e.error === "network") {
        toast.error(t("cmd.network_error"));
      } else if (e.error !== "aborted") {
        toast.error(t("cmd.voice_error", { error: e.error }));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [config.language, isListening, t]);

  // TTS output
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/```[\s\S]*?```/g, "").replace(/[#*_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleaned.slice(0, 500));
    utterance.lang = config.language || "pt-BR";
    utterance.rate = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className={`absolute inset-0 rounded-full bg-primary/20 ${isStreaming ? "animate-ping" : ""}`} />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {config.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">{config.name}</h3>
            <p className="text-[11px] text-muted-foreground">
              {isStreaming ? t("cmd.processing") : t("cmd.chief_ai")}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClear}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <span className="text-2xl font-display font-bold text-primary">{config.name.slice(0, 2)}</span>
            </div>
            <h3 className="font-display font-bold text-lg mb-1">{t("cmd.hello_monix", { name: config.name })}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("cmd.monix_desc")}
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {[t("cmd.briefing_short"), t("cmd.agent_status_short"), t("cmd.kpi_analysis"), t("cmd.risk_opportunities")].map(s => (
                <button key={s} onClick={() => onSend(s)} className="px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/60 border border-border/30"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content.replace(/```kpi[\s\S]*?```/g, "")}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.role === "assistant" && !isStreaming && (
                  <button onClick={() => speak(msg.content)} className="mt-2 text-muted-foreground hover:text-primary transition-colors">
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card/60 border border-border/30 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice waveform */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 flex items-center justify-center gap-1 overflow-hidden"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-primary/60 rounded-full"
                animate={{ height: [4, Math.random() * 28 + 4, 4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-border/30">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className={`shrink-0 h-10 w-10 ${isListening ? "text-primary bg-primary/10" : "text-muted-foreground"}`} onClick={toggleVoice}>
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("cmd.talk_to", { name: config.name })}
            className="flex-1"
            disabled={isLoading}
          />
          {isStreaming ? (
            <Button variant="destructive" size="icon" className="shrink-0 h-10 w-10" onClick={onStop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" className="shrink-0 h-10 w-10 glow" onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonixChat;
