import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, VolumeX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import AudioWaveform from "./AudioWaveform";
import AudioSpectrum from "./AudioSpectrum";
import OmnixOrb from "./OmnixOrb";
import type { OmnixMessage, OmnixConfig } from "@/hooks/useOmnix";

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
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<number>(-1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!autoSpeak || isStreaming) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last?.role === "assistant" && lastIdx > lastSpokenRef.current) {
      lastSpokenRef.current = lastIdx;
      speak(last.content);
    }
  }, [messages, isStreaming, autoSpeak]);

  // Auto-start listening in voice-first mode ONLY on first load (no messages yet)
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

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = config.language || "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
      if (e.results[0]?.isFinal) {
        setTimeout(() => {
          onSend(transcript);
          setInput("");
        }, 300);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [config.language, isListening, onSend]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    startListening();
  };

  // TTS output — enhanced voice selection
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleaned = text.replace(/```[\s\S]*?```/g, "").replace(/[#*_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleaned.slice(0, 800));
    utterance.lang = config.language || "pt-BR";

    // Pick the best available voice: prefer Google/Microsoft premium voices
    const voices = window.speechSynthesis.getVoices();
    const lang = config.language || "pt-BR";
    const langVoices = voices.filter(v => v.lang.startsWith(lang.split("-")[0]));
    const premium = langVoices.find(v =>
      /google|microsoft|natural|neural|online/i.test(v.name)
    );
    const fallback = langVoices.find(v => v.localService === false) || langVoices[0];
    if (premium) utterance.voice = premium;
    else if (fallback) utterance.voice = fallback;

    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Orb area - centered and prominent */}
      <div className="shrink-0 flex flex-col items-center pt-6 pb-3 bg-gradient-to-b from-primary/[0.03] to-transparent">
        <OmnixOrb state={getOrbState()} name={config.name} className={voiceFirst ? "scale-125" : ""} />
        <h3 className="mt-8 font-display font-black text-sm tracking-widest uppercase text-foreground/80">
          {config.name}
        </h3>
        <p className="text-[10px] text-muted-foreground/60 font-mono tracking-wider mt-0.5">
          CENTRAL AI AGENT • v2.0
        </p>

        {/* Auto-speak toggle */}
        <button
          onClick={() => { setAutoSpeak(!autoSpeak); if (isSpeaking) stopSpeaking(); }}
          className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          Auto-voice {autoSpeak ? "ON" : "OFF"}
        </button>
      </div>

      {/* Waveform / Spectrum area */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <div className="shrink-0 py-2 border-b border-border/10 bg-background/50">
            {isListening && <AudioWaveform active={true} mode="listening" />}
            {isSpeaking && <AudioSpectrum active={true} />}
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {voiceFirst ? (
                <>Olá, eu sou o <span className="text-primary font-bold">{config.name}</span>. Estou ouvindo você. Basta falar.</>
              ) : (
                <>Olá, eu sou o <span className="text-primary font-bold">{config.name}</span>. Seu agente central de IA. Fale ou digite para começar.</>
              )}
            </p>
            {!voiceFirst && (
              <div className="flex flex-wrap gap-2 mt-5 justify-center">
                {[
                  `${config.name}, faça uma auditoria do sistema`,
                  "Briefing executivo do dia",
                  "Status de todos os agentes",
                  "Análise de riscos",
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    className="px-3 py-1.5 rounded-full border border-border/30 text-[11px] text-muted-foreground/70 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
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
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                  : "bg-card/50 border border-border/20 backdrop-blur-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content.replace(/```kpi[\s\S]*?```/g, "")}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.role === "assistant" && !isStreaming && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => speak(msg.content)} className="text-muted-foreground/50 hover:text-primary transition-colors">
                      <Volume2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card/50 border border-border/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 p-4 border-t border-border/10 bg-background/50 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className={`shrink-0 h-12 w-12 rounded-full ${
              isListening
                ? "text-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)] animate-pulse"
                : "text-muted-foreground/60 hover:text-foreground"
            }`}
            onClick={toggleVoice}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Fale com ${config.name}...`}
            className="flex-1 bg-card/30 border-border/20"
            disabled={isLoading}
          />
          {isStreaming ? (
            <Button variant="destructive" size="icon" className="shrink-0 h-10 w-10 rounded-full" onClick={onStop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="shrink-0 h-10 w-10 rounded-full shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-muted-foreground/40 hover:text-destructive"
            onClick={onClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OmnixChat;
