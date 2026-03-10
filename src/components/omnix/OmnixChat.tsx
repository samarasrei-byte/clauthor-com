import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, VolumeX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import ChatFeedback from "@/components/dashboard/ChatFeedback";
import OmnixOrb from "./OmnixOrb";
import type { OmnixMessage, OmnixConfig } from "@/hooks/useOmnix";
import { useTranslation } from "react-i18next";

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<number>(-1);
  const autoListenAfterSpeakRef = useRef(true);

  // ─── Stop TTS immediately ───
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── TTS: speak text, auto-listen after done ───
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    // Stop any listening first
    recognitionRef.current?.stop?.();
    setIsListening(false);
    window.speechSynthesis.cancel();

    const cleaned = text.replace(/```[\s\S]*?```/g, "").replace(/[#*_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleaned.slice(0, 500));
    utterance.lang = config.language || "en-US";

    const voices = window.speechSynthesis.getVoices();
    const lang = config.language || "en-US";
    const langVoices = voices.filter(v => v.lang.startsWith(lang.split("-")[0]));
    const premium = langVoices.find(v => /google|microsoft|natural|neural|online/i.test(v.name));
    const fallback = langVoices.find(v => v.localService === false) || langVoices[0];
    if (premium) utterance.voice = premium;
    else if (fallback) utterance.voice = fallback;

    utterance.rate = 1.25;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-listen after THOR finishes speaking (if voice mode)
      if (autoListenAfterSpeakRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [config.language]);

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

  // ─── Start listening — BARGE-IN: stops TTS first ───
  const startListening = useCallback(async () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error(t("cmd.mic_unsupported", { defaultValue: "Your browser doesn't support voice recognition." }));
      return;
    }
    if (isListening || isStreaming || isLoading) return;

    // BARGE-IN: if THOR is speaking, stop it immediately so user can talk
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
    recognition.lang = config.language || "en-US";
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
        // Silently restart listening instead of showing toast
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
    // If THOR is speaking, barge-in: stop speaking and start listening
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

  return (
    <div className="flex flex-col h-full">
      {/* Orb hero — shrinks when messages exist */}
      <motion.div
        className="shrink-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-primary/[0.02] to-transparent"
        animate={{
          paddingTop: hasMessages ? 12 : 32,
          paddingBottom: hasMessages ? 4 : 16,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          animate={{ scale: hasMessages ? 0.65 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="origin-center"
        >
          <OmnixOrb state={getOrbState()} name={config.name} />
        </motion.div>

        {/* Auto-voice toggle */}
        <button
          onClick={() => {
            setAutoSpeak(!autoSpeak);
            autoListenAfterSpeakRef.current = !autoSpeak;
            if (isSpeaking) stopSpeaking();
          }}
          className="flex items-center gap-1 text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          {autoSpeak ? <Volume2 className="h-2.5 w-2.5" /> : <VolumeX className="h-2.5 w-2.5" />}
          {t("cmd.auto_voice", { defaultValue: "Auto-voice" })} {autoSpeak ? t("cmd.on", { defaultValue: "ON" }) : t("cmd.off", { defaultValue: "OFF" })}
        </button>
      </motion.div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-3 scroll-smooth"
      >
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
              {voiceFirst ? (
                <>{t("cmd.hello_voice", { defaultValue: "Hi, I'm {{name}}. I'm listening. Just speak.", name: config.name })}</>
              ) : (
                <>{t("cmd.hello_text", { defaultValue: "Hi, I'm {{name}}. Your central AI agent. Speak or type to begin.", name: config.name })}</>
              )}
            </p>
            {!voiceFirst && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-md">
                {[
                  t("cmd.audit_system", { defaultValue: "{{name}}, run a system audit", name: config.name }),
                  t("cmd.briefing_day", { defaultValue: "Executive briefing of the day" }),
                  t("cmd.status_agents", { defaultValue: "Status of all agents" }),
                  t("cmd.risk_analysis", { defaultValue: "Risk analysis" }),
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    className="px-3 py-1.5 rounded-full border border-border/20 text-[11px] text-muted-foreground/60 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.role}-${msg.timestamp.getTime()}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 break-words overflow-hidden ${
                  msg.role === "user"
                    ? "max-w-[88%] sm:max-w-[75%] bg-primary/90 text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.12)]"
                    : "max-w-[95%] sm:max-w-[85%] bg-card/80 border border-border/15 backdrop-blur-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] sm:text-[15px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_p]:break-words [&_table]:block [&_table]:overflow-x-auto">
                    <ReactMarkdown>{msg.content.replace(/```kpi[\s\S]*?```/g, "")}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[14px] sm:text-[15px] leading-relaxed break-words">{msg.content}</p>
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
        </AnimatePresence>

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

      {/* Input bar */}
      <div className="shrink-0 px-3 sm:px-4 py-3 border-t border-border/8 bg-background/60 backdrop-blur-sm">
        <div className="flex gap-2 items-center max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className={`shrink-0 h-11 w-11 rounded-full transition-all ${
              isListening
                ? "text-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.25)] animate-pulse"
                : isSpeaking
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground/50 hover:text-foreground"
            }`}
            onClick={toggleVoice}
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={t("cmd.talk_to", { defaultValue: "Talk to {{name}}...", name: config.name })}
            className="flex-1 bg-card/20 border-border/15 h-11 text-sm"
            disabled={isLoading}
          />
          {isStreaming ? (
            <Button variant="destructive" size="icon" className="shrink-0 h-10 w-10 rounded-full" onClick={onStop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="shrink-0 h-10 w-10 rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground/30 hover:text-destructive"
            onClick={() => {
              if (messages.length === 0) return;
              if (messages.length > 2) {
                const confirmed = window.confirm(t("cmd.clear_confirm", { defaultValue: "Clear all chat history?" }));
                if (!confirmed) return;
              }
              onClear();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OmnixChat;
