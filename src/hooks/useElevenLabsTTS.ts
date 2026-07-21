import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook de narração curta usado no sidebar e em tooltips.
 *
 * Roteia pela edge function `tts-speak` (Lovable AI Gateway · openai/gpt-4o-mini-tts).
 * Quando a conexão ElevenLabs for vinculada ao projeto, a edge function passa a
 * chamar https://api.elevenlabs.io/v1/text-to-speech/{voiceId} · o contrato do
 * hook não muda.
 *
 * · Cancela áudio anterior antes de tocar o próximo (requisito de "fala isolada").
 * · Silencia falhas para não quebrar UX de navegação.
 * · Cache in-memory por texto+voz para reduzir latência e créditos.
 */
export interface UseElevenLabsTTSOptions {
  /** Voz padrão da narração. Aceita nomes OpenAI (alloy, verse, aria...) */
  defaultVoice?: string;
  /** Se falso, chamadas `speak()` são no-op (útil para desligar via preferência). */
  enabled?: boolean;
}

export interface UseElevenLabsTTSReturn {
  speak: (text: string, voice?: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: () => boolean;
}

const audioCache = new Map<string, string>(); // `${voice}::${text}` -> blob URL

export const useElevenLabsTTS = (
  options: UseElevenLabsTTSOptions = {},
): UseElevenLabsTTSReturn => {
  const { defaultVoice = "alloy", enabled = true } = options;
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const cancel = useCallback(() => {
    const audio = currentAudioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch { /* noop */ }
      currentAudioRef.current = null;
    }
  }, []);

  const speak = useCallback(
    async (text: string, voice?: string): Promise<void> => {
      if (!enabled || !text.trim()) return;
      cancel();

      const v = voice || defaultVoice;
      const cacheKey = `${v}::${text}`;

      try {
        let url = audioCache.get(cacheKey);

        if (!url) {
          const { data, error } = await supabase.functions.invoke("tts-speak", {
            body: { text, voice: v },
          });
          if (error) throw error;
          // supabase-js retorna Blob para binários quando o content-type é audio/*
          const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
          url = URL.createObjectURL(blob);
          audioCache.set(cacheKey, url);
        }

        const audio = new Audio(url);
        audio.preload = "auto";
        audio.volume = 0.85;
        currentAudioRef.current = audio;
        await audio.play().catch(() => { /* autoplay bloqueado · silencia */ });
      } catch {
        /* silencia · narração é enhancement, não bloqueia UX */
      }
    },
    [defaultVoice, enabled, cancel],
  );

  const isSpeaking = useCallback(() => {
    const a = currentAudioRef.current;
    return !!a && !a.paused && !a.ended;
  }, []);

  useEffect(() => cancel, [cancel]);

  return { speak, cancel, isSpeaking };
};

export default useElevenLabsTTS;
