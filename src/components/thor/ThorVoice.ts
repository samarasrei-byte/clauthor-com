/**
 * ThorVoice.ts — Voice configuration, speech helpers, queue management
 */

import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_VOICE_ID = "57fRHlU547szfU1IrRoS";

/**
 * Fetch dynamic voice_id from platform_credentials.
 * Returns DEFAULT_VOICE_ID if none configured.
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
 * Clean a Thor response for TTS:
 * - Remove markdown/emoji
 * - Take only the first 2 sentences
 * - Cap at 180 chars
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

/**
 * Generate the Thor greeting message based on language.
 */
export function getThorGreeting(lang: string): string {
  const isPt = lang.startsWith("pt");
  return isPt
    ? "Olá! Eu sou o **Thor**, CEO e Orquestrador da CLAUTHOR. 🧠 Me conta: **o que te trouxe aqui hoje?**"
    : "Hello! I'm **Thor**, CEO & Orchestrator of CLAUTHOR. 🧠 Tell me: **what brought you here today?**";
}
