/**
 * ThorVoice.ts — Voice configuration, speech helpers, queue management, visitor memory
 */

import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_VOICE_ID = "57fRHlU547szfU1IrRoS";

/* ─── localStorage memory keys ─── */
const MEMORY_KEYS = {
  name: "thor_visitor_name",
  lastTopic: "thor_last_topic",
  lastVisit: "thor_last_visit",
  company: "thor_company",
  interest: "thor_interest",
} as const;

export interface ThorMemory {
  name: string | null;
  lastTopic: string | null;
  lastVisit: string | null;
  company: string | null;
  interest: string | null;
}

/** Read all Thor memory from localStorage */
export function loadThorMemory(): ThorMemory {
  return {
    name: localStorage.getItem(MEMORY_KEYS.name),
    lastTopic: localStorage.getItem(MEMORY_KEYS.lastTopic),
    lastVisit: localStorage.getItem(MEMORY_KEYS.lastVisit),
    company: localStorage.getItem(MEMORY_KEYS.company),
    interest: localStorage.getItem(MEMORY_KEYS.interest),
  };
}

/** Save a single memory key */
export function saveThorMemory(key: keyof typeof MEMORY_KEYS, value: string) {
  localStorage.setItem(MEMORY_KEYS[key], value);
}

/** Clear all thor_* keys from localStorage */
export function clearThorMemory() {
  Object.values(MEMORY_KEYS).forEach(k => localStorage.removeItem(k));
}

/** Update last visit timestamp */
export function touchThorVisit() {
  localStorage.setItem(MEMORY_KEYS.lastVisit, new Date().toISOString());
}

/** Try to extract visitor name from a message like "Me chamo João" / "Meu nome é Maria" */
export function extractNameFromMessage(msg: string): string | null {
  const patterns = [
    /(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+o|sou\s+a|pode\s+me\s+chamar\s+de|i'?m|my\s+name\s+is|call\s+me)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
  ];
  for (const p of patterns) {
    const m = msg.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Try to detect topic/interest from a message */
export function extractTopicFromMessage(msg: string): string | null {
  const lc = msg.toLowerCase();
  const topics: [string[], string][] = [
    [["vendas", "sales", "sdr", "prospecção", "prospect", "lead"], "vendas"],
    [["suporte", "support", "atendimento", "customer"], "suporte"],
    [["rh", "recursos humanos", "hr", "human resources", "recrutamento"], "RH"],
    [["marketing", "conteúdo", "content", "social media", "ads"], "marketing"],
    [["financeiro", "finance", "cfo", "contabilidade"], "financeiro"],
    [["dados", "data", "análise", "analytics", "bi"], "dados"],
    [["segurança", "security", "cyber", "cibersegurança"], "segurança"],
    [["jurídico", "legal", "compliance"], "jurídico"],
  ];
  for (const [keywords, topic] of topics) {
    if (keywords.some(k => lc.includes(k))) return topic;
  }
  return null;
}

/** Check if user is asking to forget their data */
export function isForgetRequest(msg: string): boolean {
  const lc = msg.toLowerCase();
  return lc.includes("esqueça minhas informações") ||
    lc.includes("esqueça meus dados") ||
    lc.includes("forget my info") ||
    lc.includes("forget my data") ||
    lc.includes("apagar meus dados") ||
    lc.includes("limpar memória") ||
    lc.includes("clear memory");
}

/**
 * Fetch dynamic voice_id from platform_credentials.
 */
export async function fetchThorVoiceId(): Promise<string> {
  try {
    const { data } = await supabase
      .from("platform_credentials")
      .select("credential_value")
      .eq("integration_name", "elevenlabs")
      .eq("credential_key", "voice_id")
      .eq("is_active", true)
      .maybeSingle();
    return data?.credential_value || DEFAULT_VOICE_ID;
  } catch {
    return DEFAULT_VOICE_ID;
  }
}

/**
 * Clean a Thor response for TTS
 */
export function prepareSpeechText(text: string): string | null {
  const cleaned = text.replace(/[*#🚀🧠💡\[\]()]/g, "");
  const sentences = cleaned.split(/[.!?]\s+/).filter(Boolean);
  const shortText = sentences.slice(0, 2).join(". ").slice(0, 180);
  return shortText.length > 10 ? shortText : null;
}

/**
 * Get proactive messages based on route and language.
 */
export function getProactiveMessages(pathname: string, lang: string): string[] {
  const isPt = lang.startsWith("pt");
  if (pathname === "/" || pathname === "") {
    return isPt
      ? [
          "Ei! Notei que você tá olhando a home. Quer que eu te mostre como nossos agentes podem revolucionar sua empresa? 🚀",
          "Tô vendo que você ainda não explorou os departamentos. Posso te guiar? Tenho 200 agentes prontos!",
        ]
      : [
          "Hey! Want me to show you how our agents can transform your business? 🚀",
          "I see you haven't explored the departments yet. Can I guide you?",
        ];
  }
  if (pathname.includes("/library")) {
    return isPt
      ? ["Boa escolha vir na biblioteca! Posso te ajudar a encontrar o agente perfeito pro seu caso."]
      : ["Great choice! I can help you find the perfect agent."];
  }
  if (pathname.includes("/pricing")) {
    return isPt
      ? ["Analisando preços? Posso te ajudar a escolher o plano ideal."]
      : ["Checking prices? I can help you pick the ideal plan."];
  }
  return isPt ? ["Precisa de ajuda? Tô aqui 24/7!"] : ["Need help? I'm here 24/7!"];
}

/** The new proactive greeting (MUDANÇA 1) */
const PROACTIVE_GREETING_PT = "Olá! Eu sou o Thor, CEO de IA da Clauthor. Posso te mostrar como nossos agentes podem transformar sua empresa em minutos. Por onde quer começar?";
const PROACTIVE_GREETING_EN = "Hi! I'm Thor, AI CEO of Clauthor. Let me show you how our agents can transform your business in minutes. Where would you like to start?";

/**
 * Build the proactive greeting considering visitor memory.
 */
export function buildProactiveGreeting(lang: string, memory: ThorMemory): string {
  const isPt = lang.startsWith("pt");

  // Returning visitor with name
  if (memory.name) {
    const topicLine = memory.lastTopic
      ? (isPt
          ? ` Da última vez você perguntou sobre **${memory.lastTopic}**. Quer continuar de onde paramos?`
          : ` Last time you asked about **${memory.lastTopic}**. Want to continue where we left off?`)
      : "";
    return isPt
      ? `Bem-vindo de volta, **${memory.name}**!${topicLine}`
      : `Welcome back, **${memory.name}**!${topicLine}`;
  }

  // First visit
  return isPt ? PROACTIVE_GREETING_PT : PROACTIVE_GREETING_EN;
}

/**
 * Build the follow-up question to ask for the visitor's name.
 */
export function buildNameQuestion(lang: string): string {
  const isPt = lang.startsWith("pt");
  return isPt
    ? "Antes de continuar, como posso te chamar?"
    : "Before we continue, what should I call you?";
}

/**
 * Generate the Thor greeting message based on language (legacy, kept for backward compat).
 */
export function getThorGreeting(lang: string): string {
  const isPt = lang.startsWith("pt");
  return isPt
    ? "Olá! Eu sou o **Thor**, CEO e Orquestrador da CLAUTHOR. 🧠 Me conta: **o que te trouxe aqui hoje?**"
    : "Hello! I'm **Thor**, CEO & Orchestrator of CLAUTHOR. 🧠 Tell me: **what brought you here today?**";
}
