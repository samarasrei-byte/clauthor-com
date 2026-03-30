/**
 * ThorCore.tsx — State management, API calls, credit validation, all hooks
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "framer-motion";
import { ThorMessage, streamThorResponse } from "./ThorStreaming";
import { fetchThorVoiceId, getThorGreeting, prepareSpeechText, DEFAULT_VOICE_ID } from "./ThorVoice";

const STORAGE_KEY = "thor_greeter_seen_v3";

export type ThorPhase = "entrance" | "active" | "minimized";

export interface ThorCoreState {
  phase: ThorPhase;
  messages: ThorMessage[];
  input: string;
  isLoading: boolean;
  voiceEnabled: boolean;
  hasInteracted: boolean;
  showChat: boolean;
  expanded: boolean;
  isSpeaking: boolean;
  isMobile: boolean;
  shouldUseLiteCore: boolean;
  lang: string;
}

export interface ThorCoreActions {
  setInput: (v: string) => void;
  setExpanded: (v: boolean) => void;
  setShowChat: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  sendMessage: (text?: string) => Promise<void>;
  minimize: () => void;
  activate: () => void;
  stopTTS: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function useThorCore(): ThorCoreState & ThorCoreActions {
  const [phase, setPhase] = useState<ThorPhase>("minimized");
  const [messages, setMessages] = useState<ThorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [thorVoiceId, setThorVoiceId] = useState(DEFAULT_VOICE_ID);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ThorMessage[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const lang = navigator.language || "en";
  const shouldUseLiteCore = isMobile || !!prefersReducedMotion;

  // Fetch dynamic voice config
  useEffect(() => {
    fetchThorVoiceId().then(setThorVoiceId);
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const { speak, stop: stopTTS, isSpeaking } = useElevenLabsTTS({
    onStart: () => {},
    onEnd: () => {},
  });

  // Safety timeout for speech
  useEffect(() => {
    if (!isSpeaking) return;
    const timeout = setTimeout(() => {
      console.warn("[Thor] Safety timeout: stopping speech after 30s");
      stopTTS();
    }, 30_000);
    return () => clearTimeout(timeout);
  }, [isSpeaking, stopTTS]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-activate Thor on first visit after 4s delay
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === "/") {
      const timer = setTimeout(() => {
        setPhase("active");
        setShowChat(true);
        localStorage.setItem(STORAGE_KEY, "1");
        setMessages([{ role: "assistant", content: getThorGreeting(lang) }]);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, lang]);

  // Entrance → active transition
  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("active");
        localStorage.setItem(STORAGE_KEY, "1");
        const greeting = getThorGreeting(lang);
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceEnabled) speak(greeting.replace(/[*#🧠]/g, ""), thorVoiceId);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Proactive messages disabled
  useEffect(() => {
    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }
    return () => {
      if (proactiveTimerRef.current) {
        clearInterval(proactiveTimerRef.current);
        proactiveTimerRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);
    setShowChat(true);

    stopTTS();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (proactiveTimerRef.current) {
      clearInterval(proactiveTimerRef.current);
      proactiveTimerRef.current = null;
    }

    const userMsg: ThorMessage = { role: "user", content: msg };
    const currentMessages = messagesRef.current;
    const updated = [...currentMessages, userMsg];
    setMessages(updated);
    setIsLoading(true);

    let fullText = "";

    await streamThorResponse({
      messages: updated,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      context: {
        area: user ? "client" : "public",
        route: location.pathname,
        authenticated: !!user,
        persona: "thor",
      },
      signal: controller.signal,
      onFlush: (snapshot) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: snapshot } : m);
          }
          return [...prev, { role: "assistant", content: snapshot }];
        });
      },
      onDone: (text) => {
        fullText = text;
      },
      onError: (reason) => {
        if (reason === "stalled" || reason === "timeout") {
          controller.abort(reason === "stalled" ? "stream_stalled" : "hard_timeout");
          setMessages(prev => {
            const alreadyHasAssistant = prev[prev.length - 1]?.role === "assistant";
            if (alreadyHasAssistant) return prev;
            return [...prev, {
              role: "assistant",
              content: lang.startsWith("pt")
                ? "Tive uma instabilidade rápida no stream. Me manda de novo em uma frase curta e eu respondo objetivamente."
                : "I hit a brief stream issue. Send it again in one short sentence and I'll answer directly.",
            }];
          });
        } else if (reason === "network") {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: lang.startsWith("pt") ? "Ops, tive um problema. Tenta de novo?" : "Oops, had an issue. Try again?",
          }]);
        }
        // "abort" is user-initiated, no message needed
      },
    });

    // Speak result if voice enabled
    if (!controller.signal.aborted && voiceEnabled && fullText) {
      const speechText = prepareSpeechText(fullText);
      if (speechText) speak(speechText, thorVoiceId);
    }

    setIsLoading(false);
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
  }, [input, isLoading, user, location.pathname, voiceEnabled, speak, stopTTS, lang, thorVoiceId]);

  const minimize = useCallback(() => {
    stopTTS();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setPhase("minimized");
    setShowChat(false);
    setExpanded(false);
  }, [stopTTS]);

  const activate = useCallback(() => {
    setPhase("active");
    setShowChat(true);
    if (messagesRef.current.length === 0) {
      const greeting = getThorGreeting(lang);
      setMessages([{ role: "assistant", content: greeting }]);
      setVoiceEnabled(true);
      setTimeout(() => speak(greeting.replace(/[*#🧠]/g, ""), thorVoiceId), 150);
    }
  }, [lang, speak, thorVoiceId]);

  return {
    phase, messages, input, isLoading, voiceEnabled, hasInteracted,
    showChat, expanded, isSpeaking, isMobile, shouldUseLiteCore, lang,
    setInput, setExpanded, setShowChat, setVoiceEnabled,
    sendMessage, minimize, activate, stopTTS,
    messagesEndRef,
  };
}
