/**
 * ThorCore.tsx - State management, API calls, credit validation, all hooks
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
import {
  detectIntent, detectDepartmentFromConversation,
  buildPricingResponse, buildCompetitorResponse, buildDemoOffer,
  type ThorIntent,
} from "./ThorIntentDetector";
import type { DemoType } from "./AgentDemoModal";
import { useThorScrollTrigger } from "@/hooks/useThorScrollTrigger";
import { fetchThorDashboardContext, formatContextForPrompt } from "./ThorContextProvider";

const SESSION_GREETED_KEY = "thor_session_greeted";
const SESSION_DISMISSED_KEY = "thor_session_dismissed";
const SESSION_FOLLOWUP_KEY = "thor_session_followup_sent";

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
  // Demo modal state
  demoModalOpen: boolean;
  demoType: DemoType;
  lastAssistantContent: string | null;
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
  openDemo: (type: DemoType) => void;
  closeDemo: () => void;
  replayLastMessage: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function useThorCore(): ThorCoreState & ThorCoreActions {
  const [phase, setPhase] = useState<ThorPhase>("minimized");
  const [messages, setMessages] = useState<ThorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Voice defaults to OFF - user must explicitly enable
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [thorVoiceId, setThorVoiceId] = useState(DEFAULT_VOICE_ID);
  const [visitorName, setVisitorName] = useState<string | null>(null);
  const [askedForName, setAskedForName] = useState(false);
  // Demo modal
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoType, setDemoType] = useState<DemoType>("generic");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ThorMessage[]>([]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ═══ Proactive greeting - 5s after page load, once per session ═══
  useEffect(() => {
    const alreadyGreeted = sessionStorage.getItem(SESSION_GREETED_KEY);
    const dismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (alreadyGreeted || dismissed) return;
    if (location.pathname !== "/") return;

    const timer = setTimeout(async () => {
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY)) return;

      const memory = loadThorMemory();
      let greeting = buildProactiveGreeting(lang, memory);

      // For authenticated users, enrich greeting with real context
      if (user) {
        try {
          const dashCtx = await fetchThorDashboardContext(user.id);
          if (dashCtx) {
            const isPt = lang.startsWith("pt");
            const name = memory.name;

            if (dashCtx.totalAgents === 0) {
              greeting = isPt
                ? `${name ? `**${name}**, ` : ""}bom te ver! Você ainda não contratou nenhum agente.\n\nVamos resolver isso agora?\n\n1. **Ver agentes recomendados**\n2. **Me dizer seu desafio**\n3. **Explorar por departamento**`
                : `${name ? `**${name}**, ` : ""}good to see you! You haven't hired any agents yet.\n\nLet's fix that?\n\n1. **See recommended agents**\n2. **Tell me your challenge**\n3. **Browse by department**`;
            } else if (dashCtx.overdueTasks > 0) {
              greeting = isPt
                ? `${name ? `**${name}**, ` : ""}atenção: você tem **${dashCtx.overdueTasks} tarefa(s) atrasada(s)** e ${dashCtx.activeAgents} agentes ativos.\n\nQuer que eu priorize?\n\n1. **Ver tarefas atrasadas**\n2. **Delegar para um agente**\n3. **Ignorar por agora**`
                : `${name ? `**${name}**, ` : ""}heads up: you have **${dashCtx.overdueTasks} overdue task(s)** and ${dashCtx.activeAgents} active agents.\n\nWant me to prioritize?\n\n1. **View overdue tasks**\n2. **Delegate to an agent**\n3. **Skip for now**`;
            } else if (dashCtx.recentExecutions === 0 && dashCtx.totalAgents > 0) {
              greeting = isPt
                ? `${name ? `**${name}**, ` : ""}seus ${dashCtx.totalAgents} agentes estão prontos, mas nenhum recebeu tarefa ainda.\n\nQuer começar?\n\n1. **Enviar primeira tarefa**\n2. **Ver o que cada agente faz**\n3. **Configurar minha empresa**`
                : `${name ? `**${name}**, ` : ""}your ${dashCtx.totalAgents} agents are ready, but none received a task yet.\n\nWant to start?\n\n1. **Send first task**\n2. **See what each agent does**\n3. **Set up my company**`;
            } else if (dashCtx.usagePercent > 80) {
              greeting = isPt
                ? `${name ? `**${name}**, ` : ""}alerta: você usou **${dashCtx.usagePercent}%** dos seus créditos. ${dashCtx.activeAgents} agentes ativos.\n\nO que quer fazer?\n\n1. **Ver meu consumo**\n2. **Upgrade de plano**\n3. **Otimizar uso**`
                : `${name ? `**${name}**, ` : ""}alert: you've used **${dashCtx.usagePercent}%** of your credits. ${dashCtx.activeAgents} active agents.\n\nWhat to do?\n\n1. **View usage**\n2. **Upgrade plan**\n3. **Optimize usage**`;
            }
          }
        } catch {
          // Fallback to standard greeting
        }
      }

      touchThorVisit();
      setPhase("active");
      setShowChat(true);
      setMessages([{ role: "assistant", content: greeting }]);
      sessionStorage.setItem(SESSION_GREETED_KEY, "1");
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname, lang, isMobile, speak, thorVoiceId, user]);

  // Entrance → active transition (kept for manual entrance)
  useEffect(() => {
    if (phase === "entrance") {
      const timer = setTimeout(() => {
        setPhase("active");
        const memory = loadThorMemory();
        const greeting = buildProactiveGreeting(lang, memory);
        setMessages([{ role: "assistant", content: greeting }]);
      // Don't auto-speak on entrance transition - wait for user to enable voice
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // ═══ Inactivity follow-up - 2min after Thor opens, once per session ═══
  useEffect(() => {
    if (phase !== "active" || !showChat) return;
    if (sessionStorage.getItem(SESSION_FOLLOWUP_KEY)) return;

    // Reset timer on every new message
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = setTimeout(() => {
      if (sessionStorage.getItem(SESSION_FOLLOWUP_KEY)) return;
      const isPt = lang.startsWith("pt");
      const followup = isPt
        ? "Ei, ainda tá aí? Sem pressão - mas posso te mostrar um resultado rápido.\n\nEscolhe:\n1. **Ver um agente em ação**\n2. **Calcular meu ROI**\n3. **Falar com um especialista**"
        : "Hey, still there? No pressure - but I can show you a quick result.\n\nPick one:\n1. **See an agent in action**\n2. **Calculate my ROI**\n3. **Talk to a specialist**";

      setMessages(prev => [...prev, { role: "assistant", content: followup }]);
      sessionStorage.setItem(SESSION_FOLLOWUP_KEY, "1");
    }, 90_000); // 1.5 minutes

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [phase, showChat, messages.length, lang]);

  // Memory extraction from messages
  const processMemory = useCallback((userMsg: string, assistantReply: string) => {
    const name = extractNameFromMessage(userMsg);
    if (name) {
      saveThorMemory("name", name);
      setVisitorName(name);
    }

    const topic = extractTopicFromMessage(userMsg);
    if (topic) {
      saveThorMemory("lastTopic", topic);
      saveThorMemory("interest", topic);
    }

    const companyMatch = userMsg.match(/(?:empresa|company|trabalho\s+na|work\s+at|da\s+empresa)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i);
    if (companyMatch?.[1]) {
      saveThorMemory("company", companyMatch[1].trim());
    }

    touchThorVisit();
  }, []);

  // ═══ Intent handling - intercept certain messages before sending to API ═══
  const handleIntent = useCallback((msg: string, intent: ThorIntent): boolean => {
    const isPt = lang.startsWith("pt");

    if (intent.type === "pricing") {
      const pricingMsg = buildPricingResponse(lang);
      setMessages(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: pricingMsg }]);
      return true;
    }

    if (intent.type === "competitor") {
      const competitorMsg = buildCompetitorResponse(intent.competitor, lang);
      setMessages(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: competitorMsg }]);
      return true;
    }

    if (intent.type === "demo") {
      const demoOffer = buildDemoOffer(intent.demoType, lang);
      setMessages(prev => [...prev, { role: "user", content: msg }, { role: "assistant", content: demoOffer }]);
      // Auto-open demo after a short delay
      setTimeout(() => {
        setDemoType(intent.demoType);
        setDemoModalOpen(true);
      }, 1500);
      return true;
    }

    return false;
  }, [lang]);

  // Check if user is accepting a demo offer
  const isAcceptingDemo = useCallback((msg: string): boolean => {
    return /\b(sim|yes|quero|want|show|mostre|mostra|vamos|let'?s|ok|claro|sure|yeah|bora|go)\b/i.test(msg);
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

    // Check if user is accepting a previous demo offer
    const lastAssistant = messagesRef.current.filter(m => m.role === "assistant").pop();
    if (lastAssistant?.content.includes("🎬") && isAcceptingDemo(msg)) {
      const dept = detectDepartmentFromConversation(messagesRef.current);
      setMessages(prev => [...prev, { role: "user", content: msg }]);
      setTimeout(() => {
        setDemoType(dept);
        setDemoModalOpen(true);
      }, 500);
      return;
    }

    // Detect intent and handle locally if possible
    const intent = detectIntent(msg);
    if (intent.type !== "none" && handleIntent(msg, intent)) {
      processMemory(msg, "");
      return;
    }

    // ── Normal flow: send to API ──
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

    // Fetch real dashboard context for authenticated users
    let diagnostics: string | undefined;
    if (user) {
      try {
        const dashCtx = await fetchThorDashboardContext(user.id);
        if (dashCtx) {
          diagnostics = formatContextForPrompt(dashCtx);
        }
      } catch {
        // Silent - context is optional enhancement
      }
    }

    await streamThorResponse({
      messages: updated,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      context: {
        area: user ? "client" : "public",
        route: location.pathname,
        authenticated: !!user,
        persona: "thor",
        diagnostics,
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

    // After API response, check if response mentions a department → offer demo
    if (fullText) {
      const dept = detectDepartmentFromConversation([...updated, { role: "assistant", content: fullText }]);
      if (dept !== "generic") {
        const isPt = lang.startsWith("pt");
        const offerMsg = isPt
          ? `\n\n🎬 Quer ver o agente de **${dept === "sdr" ? "vendas" : dept === "support" ? "suporte" : dept === "hr" ? "RH" : dept === "content" ? "conteúdo" : "dados"}** em ação? Posso te mostrar agora!`
          : `\n\n🎬 Want to see the **${dept}** agent in action? I can show you right now!`;
        // Append offer to last message
        setMessages(prev => {
          const lastIdx = prev.length - 1;
          if (prev[lastIdx]?.role === "assistant" && !prev[lastIdx].content.includes("🎬")) {
            return prev.map((m, i) => i === lastIdx ? { ...m, content: m.content + offerMsg } : m);
          }
          return prev;
        });
      }
    }

    // Ask for name on first interaction if we don't know it
    if (!visitorName && !askedForName && !extractNameFromMessage(msg)) {
      setAskedForName(true);
      const nameQ = buildNameQuestion(lang);
      setMessages(prev => [...prev, { role: "assistant", content: nameQ }]);
    }

    // Speak result if voice enabled - wrapped in try/catch for silent fallback
    if (!controller.signal.aborted && voiceEnabled && fullText) {
      try {
        const speechText = prepareSpeechText(fullText);
        if (speechText) speak(speechText, thorVoiceId);
      } catch {
        // Silent fallback - TTS failure should never break the chat
      }
    }

    setIsLoading(false);
    if (abortControllerRef.current === controller) abortControllerRef.current = null;
  }, [input, isLoading, user, location.pathname, voiceEnabled, speak, stopTTS, lang, thorVoiceId, processMemory, visitorName, askedForName, handleIntent, isAcceptingDemo]);

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
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
  }, [stopTTS]);

  const activate = useCallback(() => {
    setPhase("active");
    setShowChat(true);
    if (messagesRef.current.length === 0) {
      const memory = loadThorMemory();
      const greeting = buildProactiveGreeting(lang, memory);
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [lang]);

  // ═══ Contextual scroll triggers ═══
  const handleScrollTrigger = useCallback((message: string) => {
    if (phase !== "active" && phase !== "minimized") return;
    setPhase("active");
    setShowChat(true);
    setMessages(prev => [...prev, { role: "assistant", content: message }]);
  }, [phase]);

  useThorScrollTrigger(handleScrollTrigger);

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

  const openDemo = useCallback((type: DemoType) => {
    setDemoType(type);
    setDemoModalOpen(true);
  }, []);

  const closeDemo = useCallback(() => {
    setDemoModalOpen(false);
  }, []);

  const replayLastMessage = useCallback(() => {
    const lastAssistant = messagesRef.current.filter(m => m.role === "assistant").pop();
    if (!lastAssistant?.content) return;
    try {
      const speechText = prepareSpeechText(lastAssistant.content);
      if (speechText) {
        setVoiceEnabled(true);
        speak(speechText, thorVoiceId);
      }
    } catch {
      // Silent fallback
    }
  }, [speak, thorVoiceId]);

  const lastAssistantContent = messages.filter(m => m.role === "assistant").pop()?.content || null;

  return {
    phase, messages, input, isLoading, voiceEnabled, hasInteracted,
    showChat, expanded, isSpeaking, isMobile, shouldUseLiteCore, lang,
    visitorName, demoModalOpen, demoType, lastAssistantContent,
    setInput, setExpanded, setShowChat, setVoiceEnabled,
    sendMessage, minimize, activate, stopTTS, forgetMemory,
    openDemo, closeDemo, replayLastMessage,
    messagesEndRef,
  };
}
