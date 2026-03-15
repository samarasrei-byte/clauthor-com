import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Mic, MicOff, Volume2, VolumeX, Trash2, MessageSquare, X, Keyboard, Video, VideoOff } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import ChatFeedback from "@/components/dashboard/ChatFeedback";
import OmnixOrb from "./OmnixOrb";
import type { OmnixConfig, OmnixMessage } from "@/hooks/useOmnix";
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
  const [showTextInput, setShowTextInput] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const restartAttemptsRef = useRef(0);
  const isStartingListeningRef = useRef(false);
  const micPermissionGrantedRef = useRef(false);
  const lastListenStartRef = useRef(0);
  const startListeningRef = useRef<(() => void) | null>(null);
  const liveStateRef = useRef({
    autoSpeak: true,
    showTextInput: false,
    isSpeaking: false,
    isStreaming: false,
    isLoading: false,
  });
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

  const clearPendingRestart = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const queueRestartListening = useCallback((delayMs: number) => {
    clearPendingRestart();
    restartTimeoutRef.current = window.setTimeout(() => {
      if (manualStopRef.current) return;
      startListeningRef.current?.();
    }, delayMs);
  }, [clearPendingRestart]);

  // ─── ElevenLabs TTS ───
  const { speak: elevenLabsSpeak, stop: stopSpeaking, isSpeaking } = useElevenLabsTTS({
    onStart: () => {
      clearPendingRestart();
    },
    onEnd: () => {
      // If VAD triggered the stop, start listening immediately
      if (vadBargeInRef.current) {
        vadBargeInRef.current = false;
        queueRestartListening(80);
        return;
      }
      // Auto-listen for hands-free conversation when voice mode is on
      const live = liveStateRef.current;
      if (autoListenAfterSpeakRef.current && live.autoSpeak && !live.showTextInput) {
        queueRestartListening(360);
      }
    },
  });

  useEffect(() => {
    liveStateRef.current = {
      autoSpeak,
      showTextInput,
      isSpeaking,
      isStreaming,
      isLoading,
    };
  }, [autoSpeak, showTextInput, isSpeaking, isStreaming, isLoading]);

  // ─── TTS: speak text ───
  const speak = useCallback((text: string) => {
    manualStopRef.current = true;
    restartAttemptsRef.current = 0;
    clearPendingRestart();
    recognitionRef.current?.stop?.();
    setIsListening(false);
    elevenLabsSpeak(text);
  }, [clearPendingRestart, elevenLabsSpeak]);

  // ─── VAD: Auto barge-in when user speaks while Thor is talking ───
  const handleVoiceDetected = useCallback(() => {
    if (isSpeaking) {
      vadBargeInRef.current = true;
      stopSpeaking(); // This triggers onEnd which starts listening
    }
  }, [isSpeaking, stopSpeaking]);

  const { startMonitoring: startVAD, stopMonitoring: stopVAD } = useVoiceActivityDetection({
    threshold: 34, // Less false positives from Thor's own speaker output
    consecutiveFrames: 4, // Require sustained voice before interrupting
    onVoiceDetected: handleVoiceDetected,
  });

  // Auto-start VAD when Thor starts speaking, stop when he stops
  useEffect(() => {
    if (isSpeaking && !isListening) {
      const timer = window.setTimeout(() => {
        startVAD();
      }, 420);

      return () => {
        window.clearTimeout(timer);
        stopVAD();
      };
    }

    stopVAD();
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


  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    autoListenAfterSpeakRef.current = false; // Text mode: don't auto-listen
    manualStopRef.current = true;
    restartAttemptsRef.current = 0;
    clearPendingRestart();
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

    const live = liveStateRef.current;
    if (isListening || isStartingListeningRef.current) return;
    if (live.isStreaming || live.isLoading) return;

    const now = Date.now();
    if (now - lastListenStartRef.current < 280) return;

    // BARGE-IN: stop Thor if speaking
    if (live.isSpeaking) {
      stopSpeaking();
    }

    stopVAD();
    clearPendingRestart();
    manualStopRef.current = false;
    isStartingListeningRef.current = true;

    try {
      // Ask microphone permission once. Future restarts reuse browser permission state.
      if (!micPermissionGrantedRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        stream.getTracks().forEach((track) => track.stop());
        micPermissionGrantedRef.current = true;
      }
    } catch (err: any) {
      isStartingListeningRef.current = false;
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
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("")
        .trim();
      if (!transcript) return;

      restartAttemptsRef.current = 0;
      setInput(transcript);

      const currentResult = e.results[e.resultIndex];
      if (currentResult?.isFinal && !hasFinalResult) {
        const currentLive = liveStateRef.current;
        const normalized = transcript.toLowerCase().trim();
        const isPauseCommand = /\b(pausa|parar|pare|stop|sil[eê]ncio|silencio|fica quieto)\b/.test(normalized);

        if (isPauseCommand) {
          hasFinalResult = true;
          manualStopRef.current = true;
          restartAttemptsRef.current = 0;
          clearPendingRestart();
          autoListenAfterSpeakRef.current = false;
          setInput("");
          if (currentLive.isSpeaking) stopSpeaking();
          if (currentLive.isStreaming) onStop();
          recognition.stop();
          setIsListening(false);
          // Do NOT restart listening — user explicitly asked to stop
          return;
        }

        if (currentLive.isStreaming || currentLive.isLoading) return;
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
      isStartingListeningRef.current = false;
      recognitionRef.current = null;

      if (manualStopRef.current) {
        manualStopRef.current = false;
        restartAttemptsRef.current = 0;
        return;
      }

      const currentLive = liveStateRef.current;
      if (!currentLive.autoSpeak || currentLive.showTextInput || currentLive.isSpeaking || currentLive.isStreaming || currentLive.isLoading) {
        return;
      }

      restartAttemptsRef.current += 1;
      if (restartAttemptsRef.current > 6) {
        return;
      }

      const delay = Math.min(1200, 180 + restartAttemptsRef.current * 200);
      queueRestartListening(delay);
    };

    recognition.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e.error);

      if (e.error === "not-allowed") {
        setIsListening(false);
        isStartingListeningRef.current = false;
        clearPendingRestart();
        toast.error("Microfone bloqueado. Use o campo de texto.");
        setShowTextInput(true);
        manualStopRef.current = true;
        return;
      }

      if (e.error === "network") {
        setIsListening(false);
        isStartingListeningRef.current = false;
        clearPendingRestart();
        toast.error("Erro de rede no reconhecimento de voz.");
        return;
      }

      // no-speech/aborted are expected while switching states; onend handles restart.
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      lastListenStartRef.current = Date.now();
      setIsListening(true);
      isStartingListeningRef.current = false;
    } catch (err) {
      console.error("SpeechRecognition start error:", err);
      setIsListening(false);
      isStartingListeningRef.current = false;
      recognitionRef.current = null;

      restartAttemptsRef.current += 1;
      if (restartAttemptsRef.current <= 4) {
        const delay = 300 + restartAttemptsRef.current * 180;
        queueRestartListening(delay);
      }
    }
  }, [clearPendingRestart, config.language, getImageForSend, isListening, onSend, onStop, queueRestartListening, stopSpeaking, stopVAD]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    return () => {
      clearPendingRestart();
      manualStopRef.current = true;
      recognitionRef.current?.stop?.();
      isStartingListeningRef.current = false;
    };
  }, [clearPendingRestart]);

  // Auto-start hands-free listening when idle (after greeting/TTS cycle completes)
  useEffect(() => {
    if (showTextInput) return;
    if (isListening || isSpeaking || isStreaming || isLoading) return;
    if (messages.length === 0) return; // Wait for at least the greeting exchange

    // Only auto-start if no recognition is active and we're truly idle
    const timer = setTimeout(() => {
      if (!recognitionRef.current && !manualStopRef.current && autoListenAfterSpeakRef.current !== false) {
        startListeningRef.current?.();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [showTextInput, isListening, isSpeaking, isStreaming, isLoading, messages.length]);

  const toggleVoice = () => {
    if (isStreaming || isLoading) return;
    if (isSpeaking) {
      // BARGE-IN: stop Thor and immediately start listening
      clearPendingRestart();
      stopSpeaking();
      queueRestartListening(120);
      return;
    }
    if (isListening) {
      clearPendingRestart();
      manualStopRef.current = true;
      restartAttemptsRef.current = 0;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    startListeningRef.current?.();
  };

  // Stop everything (streaming + speaking)
  const handleStop = () => {
    clearPendingRestart();
    restartAttemptsRef.current = 0;
    if (isSpeaking) stopSpeaking();
    if (isStreaming) onStop();
    if (isListening) {
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // One-tap barge-in: interrompe e tenta abrir microfone rapidamente
  const handleBargeIn = useCallback(() => {
    handleStop();
    // dupla tentativa para cobrir janela de abort/cleanup do streaming
    queueRestartListening(180);
    setTimeout(() => startListeningRef.current?.(), 620);
  }, [handleStop, queueRestartListening]);

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

        {/* Status indicator text below orb */}
        <motion.div
          key={getOrbState()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
            {isListening ? t("omnix.status_listening", { defaultValue: "Ouvindo..." })
              : isSpeaking ? t("omnix.status_speaking", { defaultValue: "Falando..." })
              : isStreaming ? t("omnix.status_thinking", { defaultValue: "Pensando..." })
              : isLoading ? t("omnix.status_processing", { defaultValue: "Processando..." })
              : t("omnix.status_ready", { defaultValue: "Digite abaixo ou clique no microfone 🎙️" })}
          </span>
        </motion.div>

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
                <span className="ml-2 text-primary/40">{t("omnix.see_more", { defaultValue: "ver mais" })}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── WAVEFORM VISUALIZATION ── */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <div className="shrink-0 px-8">
            <AudioWaveform
              active
              mode={isSpeaking ? "speaking" : "listening"}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="shrink-0 pb-6 pt-3 relative z-10">
        {/* Premium text input — always visible pill */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="px-4 sm:px-6 pb-4 max-w-xl mx-auto"
            >
              <div className="relative flex items-center rounded-2xl bg-card/60 backdrop-blur-2xl border border-border/20 shadow-[0_8px_32px_hsl(var(--background)/0.6),0_0_0_1px_hsl(var(--border)/0.08)] hover:border-primary/20 focus-within:border-primary/30 focus-within:shadow-[0_8px_32px_hsl(var(--primary)/0.08),0_0_0_1px_hsl(var(--primary)/0.15)] transition-all duration-300">
                {/* Subtle glow accent */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/[0.02] via-transparent to-primary/[0.02] pointer-events-none" />
                
                <input
                  value={input}
                  onChange={e => {
                    if (isSpeaking) stopSpeaking();
                    setInput(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Mensagem para ${config.name}...`}
                  className="flex-1 bg-transparent border-none outline-none h-12 px-5 text-sm text-foreground placeholder:text-muted-foreground/40 relative z-10"
                  disabled={isLoading}
                  autoFocus
                />

                <div className="flex items-center gap-1 pr-2 relative z-10">
                  {/* Mic inside input */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => startListeningRef.current?.()}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isListening
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30"
                    }`}
                    title="Microfone"
                  >
                    <Mic className="h-4 w-4" />
                  </motion.button>

                  {/* Send button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      input.trim() && !isLoading
                        ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                        : "bg-muted/20 text-muted-foreground/25 cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2.5">
          {/* Auto-voice toggle — glass pill */}
          <button
            onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              if (!next) autoListenAfterSpeakRef.current = false;
              if (isSpeaking) stopSpeaking();
            }}
            className={`h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${
              autoSpeak
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                : "bg-card/30 text-muted-foreground/40 border border-border/10 hover:text-muted-foreground hover:border-border/20"
            }`}
            title={autoSpeak ? t("omnix.voice_on", { defaultValue: "Voz ativa" }) : t("omnix.voice_off", { defaultValue: "Voz desativada" })}
          >
            {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Webcam toggle */}
          <button
            onClick={toggleWebcam}
            className={`h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${
              webcamActive
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                : "bg-card/30 text-muted-foreground/40 border border-border/10 hover:text-muted-foreground hover:border-border/20"
            }`}
            title="Câmera"
          >
            {webcamActive ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          </button>

          {/* ─── MAIN ACTION BUTTON ─── */}
          {isSpeaking ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 w-12 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/15 text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_hsl(var(--background)/0.5)]"
                onClick={() => {
                  clearPendingRestart();
                  autoListenAfterSpeakRef.current = false;
                  manualStopRef.current = true;
                  restartAttemptsRef.current = 0;
                  stopSpeaking();
                  if (isListening) {
                    recognitionRef.current?.stop();
                    setIsListening(false);
                  }
                }}
                title="Parar"
              >
                <Square className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="h-16 w-16 rounded-full relative flex items-center justify-center"
                onClick={handleBargeIn}
                title="Interromper e falar"
              >
                <span className="absolute inset-0 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.15)]" />
                <motion.span
                  className="absolute inset-[-2px] rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <Mic className="h-6 w-6 text-primary relative z-10" />
              </motion.button>
            </div>
          ) : isStreaming || isLoading ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="h-16 w-16 rounded-full relative flex items-center justify-center"
              onClick={handleStop}
            >
              <span className="absolute inset-0 rounded-full bg-destructive/10 backdrop-blur-xl border border-destructive/20 shadow-[0_0_30px_hsl(var(--destructive)/0.15)]" />
              <motion.span
                className="absolute inset-[-2px] rounded-full border border-destructive/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
              />
              <Square className="h-6 w-6 text-destructive relative z-10" />
            </motion.button>
          ) : isListening ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="h-16 w-16 rounded-full relative flex items-center justify-center"
              onClick={() => {
                clearPendingRestart();
                manualStopRef.current = true;
                restartAttemptsRef.current = 0;
                recognitionRef.current?.stop();
                setIsListening(false);
              }}
            >
              <span className="absolute inset-0 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/25 shadow-[0_0_30px_hsl(var(--primary)/0.2)]" />
              <motion.span
                className="absolute inset-[-3px] rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <MicOff className="h-6 w-6 text-primary relative z-10" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="h-16 w-16 rounded-full relative flex items-center justify-center group"
              onClick={() => startListeningRef.current?.()}
            >
              <span className="absolute inset-0 rounded-full bg-card/30 backdrop-blur-xl border border-border/15 group-hover:border-primary/20 group-hover:bg-primary/5 shadow-[0_4px_20px_hsl(var(--background)/0.5)] transition-all duration-300" />
              <Mic className="h-6 w-6 text-muted-foreground/60 group-hover:text-primary transition-colors duration-300 relative z-10" />
            </motion.button>
          )}

          {/* Text toggle */}
          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className={`h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${
              showTextInput
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                : "bg-card/30 text-muted-foreground/40 border border-border/10 hover:text-muted-foreground hover:border-border/20"
            }`}
            title="Texto"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          {/* Chat panel toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-xl transition-all duration-300 ${
              showChat
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                : "bg-card/30 text-muted-foreground/40 border border-border/10 hover:text-muted-foreground hover:border-border/20"
            }`}
            title="Chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
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
              className="h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-xl bg-card/30 text-muted-foreground/30 border border-border/10 hover:text-destructive hover:border-destructive/20 transition-all duration-300"
              title="Limpar"
            >
              <Trash2 className="h-3.5 w-3.5" />
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
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
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
