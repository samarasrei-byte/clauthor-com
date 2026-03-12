import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export function useElevenLabsTTS({ onStart, onEnd }: UseElevenLabsTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
    onEnd?.();
  }, [onEnd]);

  const speak = useCallback(async (text: string, voiceId?: string) => {
    if (!text.trim()) return;

    // Clean markdown/code blocks for speech
    const cleaned = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```kpi[\s\S]*?```/g, "")
      .replace(/[#*_`]/g, "")
      .replace(/\n{2,}/g, ". ")
      .trim()
      .slice(0, 3500);

    if (!cleaned) return;

    stop();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleaned, voiceId }),
        }
      );

      if (!response.ok) {
        console.error("ElevenLabs TTS failed:", response.status);
        return false;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      objectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        onStart?.();
      };
      audio.onended = () => {
        stop();
      };
      audio.onerror = () => {
        console.error("Audio playback error");
        stop();
      };

      await audio.play();
      return true;
    } catch (err) {
      console.error("TTS error:", err);
      stop();
      return false;
    }
  }, [stop, onStart]);

  return { speak, stop, isSpeaking };
}
