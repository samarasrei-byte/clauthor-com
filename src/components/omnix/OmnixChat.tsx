import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, VolumeX, Trash2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import ChatFeedback from "@/components/dashboard/ChatFeedback";
import OmnixOrb from "./OmnixOrb";
import type { OmnixMessage, OmnixConfig } from "@/hooks/useOmnix";
import { useTranslation } from "react-i18next";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";

interface OmnixChatProps {
  messages: OmnixMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  config: OmnixConfig;
  onSend: (msg: string) => void;
  onStop: () => void;
  onClear: () => void;
  voiceFirst?: boolean;
}

const OmnixChat = ({ messages, isLoading, isStreaming, config, onSend, onStop, onClear, voiceFirst }: OmnixChatProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<number>(-1);
  const autoListenAfterSpeakRef = useRef(true);

  // ─── ElevenLabs TTS ───
  const { speak: elevenLabsSpeak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    onEnd: () => {
      if (autoListenAfterSpeakRef.current && autoSpeak) {
        setTimeout(() => startListening(), 400);
      }
    },
  });

  // ─── TTS: speak text ───
  const speak = useCallback((text: string) => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
    elevenLabsSpeak(text);
  }, [elevenLabsSpeak]);

  // ─── Scroll on new messages ───
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ─── Auto-speak when assistant finishes ───
  useEffect(() => {
    if (!autoSpeak || isStreaming) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last?.role === "assistant" && lastIdx > lastSpokenRef.current) {
      lastSpokenRef.current = lastIdx;
      speak(last.content);
    }
  }, [messages, isStreaming, autoSpeak, speak]);

  // ─── Voice-first: auto-start listening ───
  useEffect(() => {
    if (!voiceFirst) return;
    if (messages.length === 0 && !isListening && !isLoading && !isStreaming && !isSpeaking) {
      const timer = setTimeout(() => startListening(), 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceFirst]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const getOrbState = (): "idle" | "listening" | "speaking" | "processing" => {
    if (isListening) return "listening";
    if (isSpeaking) return "speaking";
    if (isStreaming || isLoading) return "processing";
    return "idle";
  };

  // ─── Start listening — BARGE-IN ───
  const startListening = useCallback(async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error(t("cmd.mic_unsupported", { defaultValue: "Your browser doesn't support voice recognition." }));
      return;
    }
    if (isListening || isStreaming || isLoading) return;

    if (isSpeaking) {
      stopSpeaking();
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      if (err.name === "NotAllowedError") {
        toast.error(t("cmd.mic_denied", { defaultValue: "Microphone permission denied." }));
      } else if (err.name === "NotFoundError") {
        toast.error(t("cmd.mic_not_found", { defaultValue: "No microphone detected." }));
      } else {
        toast.error(t("cmd.mic_error", { defaultValue: "Error accessing microphone: {{error}}", error: err.message || "Unknown" }));
      }
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = config.language || "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
      if (e.results[0]?.isFinal) {
        if (isStreaming || isLoading) return;
        setTimeout(() => {
          onSend(transcript);
          setInput("");
        }, 300);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      console.error("SpeechRecognition error:", e.error, e.message);
      if (e.error === "not-allowed") {
        toast.error(t("cmd.mic_denied_short", { defaultValue: "Microphone permission denied." }));
      } else if (e.error === "no-speech") {
        setTimeout(() => startListening(), 500);
        return;
      } else if (e.error === "network") {
        toast.error(t("cmd.network_error", { defaultValue: "Voice recognition network error." }));
      } else if (e.error !== "aborted") {
        toast.error(t("cmd.voice_error", { defaultValue: "Voice error: {{error}}", error: e.error }));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [config.language, isListening, isSpeaking, isStreaming, isLoading, onSend, stopSpeaking, t]);

  const toggleVoice = () => {
    if (isStreaming || isLoading) return;
    if (isSpeaking) {
      stopSpeaking();
      setTimeout(() => startListening(), 200);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    startListening();
  };

  const hasMessages = messages.length > 0;

  // ─── Immersive voice-only view (default) ───
  // Shows full-screen orb with floating controls; chat panel slides in on demand
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── IMMERSIVE ORB VIEW ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background ambient effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              left: "50%",
              top: "50%",
              x: "-50%",
              y: "-50%",
              background: `radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)`,
            }}
            animate={{
              scale: isListening ? [1, 1.3, 1] : isSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* The Orb — immersive size */}
        <OmnixOrb state={getOrbState()} name={config.name} immersive />

        {/* Live transcript while listening */}
        <AnimatePresence>
          {(isListening || input) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-md px-6"
            >
              <p className="text-center text-sm text-muted-foreground/70 italic">
                {input || "..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last assistant response preview (when chat is hidden) */}
        <AnimatePresence>
          {!showChat && hasMessages && messages[messages.length - 1]?.role === "assistant" && !isSpeaking && !isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-lg px-6"
            >
              <p className="text-center text-xs text-muted-foreground/40 line-clamp-2">
                {messages[messages.length - 1].content.slice(0, 120)}…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="shrink-0 flex items-center justify-center gap-4 pb-6 pt-3 relative z-10">
        {/* Auto-voice toggle */}
        <button
          onClick={() => {
            const next = !autoSpeak;
            setAutoSpeak(next);
            autoListenAfterSpeakRef.current = next;
            if (isSpeaking) stopSpeaking();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-border/10 hover:border-border/30 transition-all"
        >
          {autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          {autoSpeak ? "ON" : "OFF"}
        </button>

        {/* Main mic button — large, prominent */}
        <Button
          size="icon"
          className={`h-16 w-16 rounded-full transition-all duration-300 ${
            isListening
              ? "bg-primary text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.4)] scale-110"
              : isSpeaking
              ? "bg-destructive/80 text-destructive-foreground shadow-[0_0_30px_hsl(var(--destructive)/0.3)]"
              : "bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          }`}
          onClick={toggleVoice}
          disabled={isStreaming || isLoading}
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : isStreaming || isLoading ? (
            <Square className="h-5 w-5" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* Show chat panel */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] border transition-all ${
            showChat
              ? "text-primary border-primary/30 bg-primary/5"
              : "text-muted-foreground/40 border-border/10 hover:text-muted-foreground hover:border-border/30"
          }`}
        >
          <MessageSquare className="h-3 w-3" />
          Chat
        </button>

        {/* Clear */}
        {hasMessages && (
          <button
            onClick={() => {
              if (messages.length > 2) {
                const confirmed = window.confirm(t("cmd.clear_confirm", { defaultValue: "Clear all chat history?" }));
                if (!confirmed) return;
              }
              onClear();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] text-muted-foreground/30 hover:text-destructive border border-border/10 hover:border-destructive/30 transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── SLIDE-IN CHAT PANEL ── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-background/95 backdrop-blur-xl border-l border-border/15 z-20 flex flex-col shadow-[-20px_0_60px_hsl(var(--background)/0.8)]"
          >
            {/* Chat header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/10">
              <span className="text-xs font-mono tracking-wider text-muted-foreground/60 uppercase">
                {config.name} · Chat
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowChat(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
              {!hasMessages && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground/40 text-center px-4">
                    {t("cmd.hello_text", { defaultValue: "Hi, I'm {{name}}. Your central AI agent. Speak or type to begin.", name: config.name })}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg.role}-${msg.timestamp.getTime()}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 break-words overflow-hidden ${
                      msg.role === "user"
                        ? "max-w-[85%] bg-primary/90 text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.12)]"
                        : "max-w-[95%] bg-card/80 border border-border/15 backdrop-blur-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_p]:break-words">
                        <ReactMarkdown>{msg.content.replace(/```kpi[\s\S]*?```/g, "")}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                    )}
                    {msg.role === "assistant" && !isStreaming && (
                      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border/10">
                        <button onClick={() => speak(msg.content)} className="text-muted-foreground/40 hover:text-primary transition-colors">
                          <Volume2 className="h-3 w-3" />
                        </button>
                        <ChatFeedback
                          userMessage={messages[i - 1]?.content || ""}
                          assistantMessage={msg.content}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-card/40 border border-border/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text input inside chat panel */}
            <div className="shrink-0 px-3 py-3 border-t border-border/8">
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={t("cmd.talk_to", { defaultValue: "Talk to {{name}}...", name: config.name })}
                  className="flex-1 bg-card/20 border-border/15 h-10 text-sm"
                  disabled={isLoading}
                />
                {isStreaming ? (
                  <Button variant="destructive" size="icon" className="shrink-0 h-9 w-9 rounded-full" onClick={onStop}>
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="shrink-0 h-9 w-9 rounded-full"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OmnixChat;
