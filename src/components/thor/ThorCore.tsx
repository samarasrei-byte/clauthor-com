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
import {
  fetchThorVoiceId, prepareSpeechText, DEFAULT_VOICE_ID,
  loadThorMemory, saveThorMemory, clearThorMemory, touchThorVisit,
  extractNameFromMessage, extractTopicFromMessage, isForgetRequest,
  buildProactiveGreeting, buildNameQuestion,
} from "./ThorVoice";

const SESSION_GREETED_KEY = "thor_session_greeted";
const SESSION_DISMISSED_KEY = "thor_session_dismissed";

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
  visitorName: string | null;
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
  forgetMemory: () => void;
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
  const [visitorName, setVisitorName] = useState<string | null>(null);
  const [askedForName, setAskedForName] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ThorMessage[]>([]);
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const lang = navigator.language || "en";
  const shouldUseLiteCore = isMobile || !!prefersReducedMotion;

  // Track if user has interacted with page (for mobile autoplay policy)
  const userHasInteractedWithPageRef = useRef(false);
  useEffect(() => {
    const mark = () => { userHasInteractedWithPageRef.current = true; };
    window.addEventListener("click", mark, { once: true });
    window.addEventListener("touchstart", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    return () => {
      window.removeEventListener("click", mark);
      window.removeEventListener("touchstart", mark);
      window.removeEventListener("keydown", mark);
    };
  }, []);

  // Fetch dynamic voice config + load memory
  useEffect(() => {
    fetchThorVoiceId().then(setThorVoiceId);
    const mem = loadThorMemory();
    if (mem.name) setVisitorName(mem.name);
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ═══ MUDANÇA 1: Proactive greeting — 5s after page load, once per session ═══
  useEffect(() => {
    const alreadyGreeted = sessionStorage.getItem(SESSION_GREETED_KEY);
    const dismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (alreadyGreeted || dismissed) return;
    if (location.pathname !== "/") return;

    const timer = setTimeout(() => {
      // Double-check dismiss wasn't set during the timeout
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY)) return;

      const memory = loadThorMemory();
      const greeting = buildProactiveGreeting(lang, memory);
      touchThorVisit();

      setPhase("active");
      setShowChat(true);
      setMessages([{ role: "assistant", content: greeting }]);
      sessionStorage.setItem(SESSION_GREETED_KEY, "1");

      // Speak the greeting (respect mobile autoplay)
      const canSpeak = !isMobile || userHasInteractedWithPageRef.current;
      if (canSpeak) {
        setVoiceEnabled(true);
        setTimeout(() => {
          const speechText = prepareSpeechText(greeting);
          if (speechText) speak(speechText, thorVoiceId);
        }, 300);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname, lang, isMobile, speak, thorVoiceId]);

  // Entrance → active transition (kept for manual entrance)
  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("active");
        const memory = loadThorMemory();
        const greeting = buildProactiveGreeting(lang, memory);
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceEnabled) {
          const st = prepareSpeechText(greeting);
          if (st) speak(st, thorVoiceId);
        }
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // ═══ MUDANÇA 2: Memory extraction from messages ═══
  const processMemory = useCallback((userMsg: string, assistantReply: string) => {
    // Extract name
    const name = extractNameFromMessage(userMsg);
    if (name) {
      saveThorMemory("name", name);
      setVisitorName(name);
    }

    // Extract topic/interest
    const topic = extractTopicFromMessage(userMsg);
    if (topic) {
      saveThorMemory("lastTopic", topic);
      saveThorMemory("interest", topic);
    }

    // Extract company name heuristic
    const companyMatch = userMsg.match(/(?:empresa|company|trabalho\s+na|work\s+at|da\s+empresa)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
    if (companyMatch?.[1]) {
      saveThorMemory("company", companyMatch[1].trim());
    }

    // Update last visit
    touchThorVisit();
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    setHasInteracted(true);
    setShowChat(true);

    // Handle "forget my data" command
    if (isForgetRequest(msg)) {
      clearThorMemory();
      setVisitorName(null);
      const isPt = lang.startsWith("pt");
      setMessages(prev => [
        ...prev,
        { role: "user", content: msg },
        { role: "assistant", content: isPt
          ? "Pronto! Todas as suas informações foram apagadas. É como se fosse a primeira vez que nos vemos. 🔒"
          : "Done! All your information has been cleared. It's like we're meeting for the first time. 🔒"
        },
      ]);
      return;
    }

    stopTTS();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
      },
    });

    // Process memory from user message + response
    processMemory(msg, fullText);

    // Ask for name on first interaction if we don't know it
    if (!visitorName && !askedForName && !extractNameFromMessage(msg)) {
      setAskedForName(true);
      const nameQ = buildNameQuestion(lang);
      setMessages(prev => [...prev, { role: "assistant", content: nameQ }]);
    }

    // Speak result if voice enabled
    if (!controller.signal.aborted && voiceEnabled && fullText) {
      const speechText = prepareSpeechText(fullText);
      if (speechText) speak(speechText, thorVoiceId);
    }

    setIsLoading(false);
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
  }, [input, isLoading, user, location.pathname, voiceEnabled, speak, stopTTS, lang, thorVoiceId, processMemory, visitorName, askedForName]);

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
    // Mark session as dismissed so proactive won't reopen
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
  }, [stopTTS]);

  const activate = useCallback(() => {
    setPhase("active");
    setShowChat(true);
    if (messagesRef.current.length === 0) {
      const memory = loadThorMemory();
      const greeting = buildProactiveGreeting(lang, memory);
      setMessages([{ role: "assistant", content: greeting }]);
      setVoiceEnabled(true);
      setTimeout(() => {
        const st = prepareSpeechText(greeting);
        if (st) speak(st, thorVoiceId);
      }, 150);
    }
  }, [lang, speak, thorVoiceId]);

  const forgetMemory = useCallback(() => {
    clearThorMemory();
    setVisitorName(null);
    const isPt = lang.startsWith("pt");
    setMessages(prev => [...prev, {
      role: "assistant",
      content: isPt
        ? "Pronto! Todas as suas informações foram apagadas. 🔒"
        : "Done! All your information has been cleared. 🔒",
    }]);
  }, [lang]);

  return {
    phase, messages, input, isLoading, voiceEnabled, hasInteracted,
    showChat, expanded, isSpeaking, isMobile, shouldUseLiteCore, lang,
    visitorName,
    setInput, setExpanded, setShowChat, setVoiceEnabled,
    sendMessage, minimize, activate, stopTTS, forgetMemory,
    messagesEndRef,
  };
}
