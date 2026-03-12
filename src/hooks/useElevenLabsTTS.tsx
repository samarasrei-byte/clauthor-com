import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

/** Fallback to browser's native speech synthesis */
function speakNative(text: string, lang: string, onStart?: () => void, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!("speechSynthesis" in window)) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.08;
  utterance.pitch = 0.98;
  utterance.volume = 1;
  utterance.lang = lang;

  // Pick best voice for language
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0]; // "pt" from "pt-BR"
  const preferred =
    voices.find((v) => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes("male")) ||
    voices.find((v) => v.lang.startsWith(langPrefix)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_`~>]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
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

    const doNativeFallback = () => {
      setIsSpeaking(true);
      onStart?.();
      nativeUtteranceRef.current = speakNative(cleaned, "pt-BR", undefined, () => {
        setIsSpeaking(false);
        onEnd?.();
      });
    };

    // If ElevenLabs already failed this session, go straight to native
    if (elevenLabsFailedRef.current) {
      doNativeFallback();
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
        console.warn("ElevenLabs TTS failed, using native voice:", response.status);
        elevenLabsFailedRef.current = true;
        doNativeFallback();
        return true;
      }

      const audioBlob = await response.blob();
      if (audioBlob.size < 100) {
        // Too small = probably error response
        console.warn("ElevenLabs returned tiny response, using native");
        elevenLabsFailedRef.current = true;
        doNativeFallback();
        return true;
      }

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
        console.error("Audio playback error, using native");
        doNativeFallback();
      };

      await audio.play();
      return true;
    } catch (err) {
      console.error("TTS error, using fallback:", err);
      doNativeFallback();
      return true;
    }
  }, [stop, onStart, onEnd]);

  const resetProvider = useCallback(() => {
    elevenLabsFailedRef.current = false;
  }, []);

  return { speak, stop, isSpeaking, resetProvider };
}
