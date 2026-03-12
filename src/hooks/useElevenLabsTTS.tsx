import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

/** Fallback to browser's native speech synthesis */
function speakNative(text: string, onStart?: () => void, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!("speechSynthesis" in window)) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.9;
  utterance.volume = 1;

  // Try to pick a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("pt") && v.name.toLowerCase().includes("male")
  ) || voices.find((v) => v.lang.startsWith("pt")) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
  if (preferred) utterance.voice = preferred;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/** Clean markdown/code blocks from text for speech */
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```kpi[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> text
    .replace(/[#*_`~]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 3500);
}

export function useElevenLabsTTS({ onStart, onEnd }: UseElevenLabsTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const nativeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const elevenLabsFailedRef = useRef(false);

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    // Stop native speech
    if (nativeUtteranceRef.current) {
      window.speechSynthesis?.cancel();
      nativeUtteranceRef.current = null;
    }
    setIsSpeaking(false);
    onEnd?.();
  }, [onEnd]);

  const speak = useCallback(async (text: string, voiceId?: string) => {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    stop();

    // If ElevenLabs already failed this session, go straight to native
    if (elevenLabsFailedRef.current) {
      setIsSpeaking(true);
      onStart?.();
      nativeUtteranceRef.current = speakNative(cleaned, undefined, () => {
        setIsSpeaking(false);
        onEnd?.();
      });
      return true;
    }

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
        console.warn("ElevenLabs TTS failed, falling back to native speech:", response.status);
        elevenLabsFailedRef.current = true;

        if (response.status === 401) {
          toast.info("Usando voz nativa — configure sua API ElevenLabs para voz premium.", { duration: 5000 });
        }

        // Fallback to native
        setIsSpeaking(true);
        onStart?.();
        nativeUtteranceRef.current = speakNative(cleaned, undefined, () => {
          setIsSpeaking(false);
          onEnd?.();
        });
        return true;
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
      audio.onended = () => stop();
      audio.onerror = () => {
        console.error("Audio playback error, falling back to native");
        // Fallback on playback error too
        setIsSpeaking(true);
        nativeUtteranceRef.current = speakNative(cleaned, undefined, () => {
          setIsSpeaking(false);
          onEnd?.();
        });
      };

      await audio.play();
      return true;
    } catch (err) {
      console.error("TTS error, using fallback:", err);
      // Fallback to native on any error
      setIsSpeaking(true);
      onStart?.();
      nativeUtteranceRef.current = speakNative(cleaned, undefined, () => {
        setIsSpeaking(false);
        onEnd?.();
      });
      return true;
    }
  }, [stop, onStart, onEnd]);

  /** Reset ElevenLabs failure flag (e.g., after user updates API key) */
  const resetProvider = useCallback(() => {
    elevenLabsFailedRef.current = false;
  }, []);

  return { speak, stop, isSpeaking, resetProvider };
}
