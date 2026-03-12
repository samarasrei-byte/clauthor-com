import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, VolumeX, Trash2, MessageSquare, X, Keyboard, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import ChatFeedback from "@/components/dashboard/ChatFeedback";
import OmnixOrb from "./OmnixOrb";
import type { OmnixMessage, OmnixConfig } from "@/hooks/useOmnix";
import { useTranslation } from "react-i18next";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useVoiceActivityDetection } from "@/hooks/useVoiceActivityDetection";
import { useWebcam } from "@/hooks/useWebcam";

interface OmnixChatProps {
  messages: OmnixMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  config: OmnixConfig;
  onSend: (msg: string, image?: string | null) => void;
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
  const [showTextInput, setShowTextInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<number>(-1);
  const autoListenAfterSpeakRef = useRef(true);
  const autoStartAttemptedRef = useRef(false);
  const manualStopRef = useRef(false);
  // Ref to track if we should auto-barge-in (VAD triggered)
  const vadBargeInRef = useRef(false);

  // ─── Webcam ───
  const { isActive: webcamActive, videoRef, start: startWebcam, stop: stopWebcam, captureFrame } = useWebcam();

  const getImageForSend = useCallback((): string | null => {
    if (!webcamActive) return null;
    return captureFrame();
  }, [webcamActive, captureFrame]);

  const toggleWebcam = useCallback(async () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      const ok = await startWebcam();
      if (!ok) toast.error("Não foi possível acessar a câmera.");
    }
  }, [webcamActive, startWebcam, stopWebcam]);

  // ─── ElevenLabs TTS ───
  const { speak: elevenLabsSpeak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    onEnd: () => {
      // If VAD triggered the stop, start listening immediately
      if (vadBargeInRef.current) {
        vadBargeInRef.current = false;
        setTimeout(() => startListening(), 80);
        return;
      }
      // Auto-listen for hands-free conversation when voice mode is on
      if (autoListenAfterSpeakRef.current && autoSpeak && !showTextInput) {
        setTimeout(() => startListening(), 120);
      }
    },
  });

  // ─── TTS: speak text ───
  const speak = useCallback((text: string) => {
    manualStopRef.current = true;
    recognitionRef.current?.stop?.();
    setIsListening(false);
    elevenLabsSpeak(text);
  }, [elevenLabsSpeak]);

  // ─── VAD: Auto barge-in when user speaks while Thor is talking ───
  const handleVoiceDetected = useCallback(() => {
    if (isSpeaking) {
      vadBargeInRef.current = true;
      stopSpeaking(); // This triggers onEnd which starts listening
    }
  }, [isSpeaking, stopSpeaking]);

  const { startMonitoring: startVAD, stopMonitoring: stopVAD } = useVoiceActivityDetection({
    threshold: 18, // More sensitive for natural barge-in
    consecutiveFrames: 2, // Faster reaction (~30-40ms)
    onVoiceDetected: handleVoiceDetected,
  });

  // Auto-start VAD when Thor starts speaking, stop when he stops
  useEffect(() => {
    if (isSpeaking && !isListening) {
      startVAD();
    } else {
      stopVAD();
    }
  }, [isSpeaking, isListening, startVAD, stopVAD]);

  // ─── Scroll on new messages ───
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ─── Auto-speak when assistant finishes (NOT during streaming) ───
  useEffect(() => {
    if (!autoSpeak || isStreaming) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    if (last?.role === "assistant" && lastIdx > lastSpokenRef.current) {
      lastSpokenRef.current = lastIdx;
      speak(last.content);
    }
  }, [messages, isStreaming, autoSpeak, speak]);

  // Auto-start hands-free listening once (after first load)
  useEffect(() => {
    if (autoStartAttemptedRef.current) return;
    if (showTextInput) return;

    autoStartAttemptedRef.current = true;
    const timer = setTimeout(() => {
      if (!isListening && !isSpeaking && !isStreaming && !isLoading) {
        startListening();
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [showTextInput, isListening, isSpeaking, isStreaming, isLoading, startListening]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    autoListenAfterSpeakRef.current = false; // Text mode: don't auto-listen
    manualStopRef.current = true;
    recognitionRef.current?.stop?.();
    setIsListening(false);
    onSend(input, getImageForSend());
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
      toast.error("Seu navegador não suporta reconhecimento de voz. Use o campo de texto.");
      setShowTextInput(true);
      return;
    }
    if (isListening) return;
    if (isStreaming || isLoading) return;

    // BARGE-IN: stop Thor if speaking
    if (isSpeaking) {
      stopSpeaking();
    }

    manualStopRef.current = false;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      setShowTextInput(true);
      if (err.name === "NotAllowedError") {
        toast.error("Microfone bloqueado. Use o campo de texto abaixo.");
      } else if (err.name === "NotFoundError") {
        toast.error("Nenhum microfone detectado. Use o campo de texto.");
      } else {
        toast.error("Erro no microfone. Use o campo de texto.");
      }
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = config.language || "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;

    let hasFinalResult = false;

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("").trim();
      if (!transcript) return;

      setInput(transcript);

      const currentResult = e.results[e.resultIndex];
      if (currentResult?.isFinal && !hasFinalResult) {
        if (isStreaming || isLoading) return;
        hasFinalResult = true;
        autoListenAfterSpeakRef.current = true;
        manualStopRef.current = true;
        onSend(transcript, getImageForSend());
        setInput("");
        recognition.stop();
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }

      // Keep always-on listening for natural conversation pace
      if (autoSpeak && !showTextInput && !isSpeaking && !isStreaming && !isLoading) {
        setTimeout(() => {
          if (manualStopRef.current) return;
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            // ignore restart race
          }
        }, 120);
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      console.error("SpeechRecognition error:", e.error);

      if (e.error === "not-allowed") {
        toast.error("Microfone bloqueado. Use o campo de texto.");
        setShowTextInput(true);
        manualStopRef.current = true;
        return;
      }

      if (e.error === "network") {
        toast.error("Erro de rede no reconhecimento de voz.");
      }

      if ((e.error === "no-speech" || e.error === "aborted") && autoSpeak && !showTextInput && !isSpeaking && !isStreaming && !isLoading && !manualStopRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch {
            // ignore restart race
          }
        }, 120);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [config.language, isListening, isSpeaking, isStreaming, isLoading, onSend, stopSpeaking, autoSpeak, showTextInput, getImageForSend]);

  const toggleVoice = () => {
    if (isStreaming || isLoading) return;
    if (isSpeaking) {
      // BARGE-IN: stop Thor and immediately start listening
      stopSpeaking();
      setTimeout(() => startListening(), 120);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    startListening();
  };

  // Stop everything (streaming + speaking)
  const handleStop = () => {
    if (isSpeaking) stopSpeaking();
    if (isStreaming) onStop();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // One-tap barge-in: interrompe e tenta abrir microfone rapidamente
  const handleBargeIn = useCallback(() => {
    handleStop();
    // dupla tentativa para cobrir janela de abort/cleanup do streaming
    setTimeout(() => startListening(), 180);
    setTimeout(() => startListening(), 650);
  }, [handleStop, startListening]);

  const hasMessages = messages.length > 0;
  const isActive = isListening || isSpeaking || isStreaming || isLoading;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* ── WEBCAM PREVIEW (floating top-right) ── */}
      <AnimatePresence>
        {webcamActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 right-3 z-30 rounded-xl overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          >
            <video
              ref={videoRef as any}
              autoPlay
              muted
              playsInline
              className="w-28 h-20 object-cover rounded-xl"
            />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
              <span className="text-[8px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                📷 AO VIVO
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMMERSIVE ORB VIEW ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background ambient */}
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

        {/* Orb */}
        <OmnixOrb state={getOrbState()} name={config.name} immersive />

        {/* Live transcript while listening */}
        <AnimatePresence>
          {(isListening || (input && !showTextInput)) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 max-w-md px-6"
            >
              <p className="text-center text-sm text-muted-foreground/70 italic">
                {input || "..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last assistant response preview */}
        <AnimatePresence>
          {!showChat && hasMessages && messages[messages.length - 1]?.role === "assistant" && !isSpeaking && !isListening && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 max-w-lg px-6 cursor-pointer"
              onClick={() => setShowChat(true)}
            >
              <p className="text-center text-xs text-muted-foreground/40 line-clamp-2 hover:text-muted-foreground/60 transition-colors">
                {messages[messages.length - 1].content.slice(0, 150)}…
                <span className="ml-2 text-primary/40">ver mais</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="shrink-0 pb-5 pt-2 relative z-10">
        {/* Text input (shown when mic fails or user requests) */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-3 max-w-lg mx-auto"
            >
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={e => {
                    if (isSpeaking) stopSpeaking();
                    setInput(e.target.value);
                  }}
                  placeholder={`Fale com ${config.name}...`}
                  className="flex-1 bg-card/20 border-border/15 h-10 text-sm"
                  disabled={isLoading}
                  autoFocus
                />
                <Button
                  size="icon"
                  className="shrink-0 h-9 w-9 rounded-full"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-3">
          {/* Auto-voice toggle */}
          <button
          onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              if (!next) autoListenAfterSpeakRef.current = false;
              if (isSpeaking) stopSpeaking();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground border border-border/10 hover:border-border/30 transition-all"
          >
            {autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            {autoSpeak ? "ON" : "OFF"}
          </button>

          {/* Main action button */}
          {isSpeaking ? (
            // Thor is speaking — tap to BARGE-IN (stop + listen)
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-accent/20 text-primary border-2 border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.15)] hover:bg-primary/20 transition-all duration-300 animate-pulse"
              onClick={handleBargeIn}
              title="Toque para interromper e falar"
            >
              <Mic className="h-6 w-6" />
            </Button>
          ) : isStreaming || isLoading ? (
            // Processing — show stop
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-destructive/80 text-destructive-foreground shadow-[0_0_30px_hsl(var(--destructive)/0.3)] hover:bg-destructive transition-all duration-300"
              onClick={handleStop}
            >
              <Square className="h-6 w-6" />
            </Button>
          ) : isListening ? (
            // Listening — show active mic, tap to stop
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-destructive/80 text-destructive-foreground shadow-[0_0_30px_hsl(var(--destructive)/0.3)] hover:bg-destructive transition-all duration-300"
              onClick={() => { recognitionRef.current?.stop(); setIsListening(false); }}
            >
              <MicOff className="h-6 w-6" />
            </Button>
          ) : (
            // Idle — tap to start listening
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300"
              onClick={startListening}
            >
              <Mic className="h-6 w-6" />
            </Button>
          )}

          {/* Webcam toggle */}
          <button
            onClick={toggleWebcam}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] border transition-all ${
              webcamActive
                ? "text-primary border-primary/30 bg-primary/5"
                : "text-muted-foreground/40 border-border/10 hover:text-muted-foreground hover:border-border/30"
            }`}
          >
            {webcamActive ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
            Cam
          </button>

          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] border transition-all ${
              showTextInput
                ? "text-primary border-primary/30 bg-primary/5"
                : "text-muted-foreground/40 border-border/10 hover:text-muted-foreground hover:border-border/30"
            }`}
          >
            <Keyboard className="h-3 w-3" />
            Texto
          </button>

          {/* Chat panel toggle */}
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
                  const confirmed = window.confirm("Limpar todo o histórico?");
                  if (!confirmed) return;
                }
                handleStop();
                onClear();
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] text-muted-foreground/30 hover:text-destructive border border-border/10 hover:border-destructive/30 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
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
                    Fale ou digite para começar uma conversa com {config.name}.
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
                  onChange={e => {
                    if (isSpeaking) stopSpeaking();
                    setInput(e.target.value);
                  }}
                  placeholder={`Fale com ${config.name}...`}
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
