import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseElevenLabsTTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

const ELEVENLABS_NATIVE_ONLY_KEY = "thor_tts_native_only";

/** Fallback to browser's native speech synthesis */
function speakNative(text: string, lang: string, onStart?: () => void, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!("speechSynthesis" in window)) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.08;
  utterance.pitch = 0.92; // slightly lower for masculine tone
  utterance.volume = 1;
  utterance.lang = lang;

  // Pick best MALE voice for language — avoid female voices
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = lang.split("-")[0];
  const nameLower = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  const isFemale = (v: SpeechSynthesisVoice) => {
    const n = nameLower(v);
    return n.includes("female") || n.includes("femin") || n.includes("mulher") ||
           n.includes("maria") || n.includes("luciana") || n.includes("francisca") ||
           n.includes("vitoria") || n.includes("google us english") === false && n.includes("woman");
  };
  const isMale = (v: SpeechSynthesisVoice) => {
    const n = nameLower(v);
    return n.includes("male") || n.includes("masculin") || n.includes("daniel") ||
           n.includes("ricardo") || n.includes("google brasileiro") || n.includes("felipe") ||
           n.includes("diego") || n.includes("jorge");
  };

  const langVoices = voices.filter((v) => v.lang.startsWith(langPrefix));
  const preferred =
    langVoices.find((v) => isMale(v) && !isFemale(v)) ||
    langVoices.find((v) => !isFemale(v)) ||
    langVoices[0] ||
    voices.find((v) => v.lang.startsWith("en") && isMale(v)) ||
    voices.find((v) => v.lang.startsWith("en") && !isFemale(v)) ||
    voices[0];
  if (preferred) utterance.voice = preferred;

  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    onEnd?.();
  };

  utterance.onstart = () => onStart?.();
  utterance.onend = finish;
  utterance.onerror = finish;

  // Safety: Chrome sometimes doesn't fire onend for long texts
  // Poll speechSynthesis.speaking every 500ms as backup
  const checkInterval = setInterval(() => {
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      clearInterval(checkInterval);
      finish();
    }
  }, 500);

  // Also clear interval after max 30s
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!ended) {
      window.speechSynthesis.cancel();
      finish();
    }
  }, 30_000);

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
  // Check localStorage — but expire after 10 minutes so we retry ElevenLabs periodically
  const elevenLabsFailedRef = useRef(() => {
    if (typeof window === "undefined") return false;
    const ts = localStorage.getItem(ELEVENLABS_NATIVE_ONLY_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - parseInt(ts, 10);
    if (elapsed > 10 * 60 * 1000) {
      localStorage.removeItem(ELEVENLABS_NATIVE_ONLY_KEY);
      return false;
    }
    return true;
  });
  const isElevenLabsFailed = () => elevenLabsFailedRef.current();
  const markElevenLabsFailed = () => {
    localStorage.setItem(ELEVENLABS_NATIVE_ONLY_KEY, String(Date.now()));
  };

  const stop = useCallback((notify = true) => {
    const wasPlaying =
      !!audioRef.current ||
      !!nativeUtteranceRef.current ||
      (typeof window !== "undefined" && !!window.speechSynthesis?.speaking);

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
    if (notify && wasPlaying) onEnd?.();
  }, [onEnd]);

  const speak = useCallback(async (text: string, voiceId?: string, waitForEnd = false) => {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    stop(false);

    // Resolves when speech finishes (used by waitForEnd)
    let resolveFinished: (() => void) | null = null;
    const finishedPromise = waitForEnd ? new Promise<void>(r => { resolveFinished = r; }) : null;

    const wrappedOnEnd = () => {
      setIsSpeaking(false);
      onEnd?.();
      resolveFinished?.();
    };

    const doNativeFallback = () => {
      const utterance = speakNative(
        cleaned,
        "pt-BR",
        () => {
          setIsSpeaking(true);
          onStart?.();
        },
        wrappedOnEnd
      );

      nativeUtteranceRef.current = utterance;

      if (!utterance) {
        setIsSpeaking(false);
        onEnd?.();
        resolveFinished?.();
        return false;
      }

      return true;
    };

    // If ElevenLabs already failed recently, go straight to native
    if (isElevenLabsFailed()) {
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
        markElevenLabsFailed();
        doNativeFallback();
        return true;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        markElevenLabsFailed();
        doNativeFallback();
        return true;
      }

      const audioBlob = await response.blob();
      if (audioBlob.size < 100) {
        markElevenLabsFailed();
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
      audio.onended = () => {
        audioRef.current = null;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setIsSpeaking(false);
        wrappedOnEnd();
      };
      audio.onerror = () => {
        stop(false);
        doNativeFallback();
      };

      await audio.play();
      if (finishedPromise) await finishedPromise;
      return true;
    } catch {
      doNativeFallback();
      if (finishedPromise) await finishedPromise;
      return true;
    }
  }, [stop, onStart, onEnd]);

  const resetProvider = useCallback(() => {
    localStorage.removeItem(ELEVENLABS_NATIVE_ONLY_KEY);
  }, []);

  return { speak, stop, isSpeaking, resetProvider };
}
