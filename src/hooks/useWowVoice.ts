/**
 * useWowVoice — grava até 30s com MediaRecorder, sobe pra elevenlabs-stt
 * e devolve o transcript. Erros são silenciosos; UI mostra estado via flags.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
import { trackKpi } from "@/lib/kpiTracker";

export type VoiceState = "idle" | "recording" | "transcribing" | "done" | "error";
const MAX_MS = 30_000;

export function useWowVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
    const stream = recorderRef.current?.stream;
    stream?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setErrorMsg(null);
    setElapsedMs(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const totalMs = Date.now() - startTsRef.current;
        cleanup();
        setState("transcribing");
        try {
          const fd = new FormData();
          fd.append("audio", blob, "wow.webm");
          fd.append("language", "por");
          const { data, error } = await supabase.functions.invoke("elevenlabs-stt", { body: fd });
          if (error) throw error;
          const text = (data as { text?: string } | null)?.text?.trim() ?? "";
          if (!text) throw new Error("empty_transcript");
          trackKpi("wow_voice_transcribed", {
            source: "instant_wow",
            variant: "voice",
            duration_recorded_ms: totalMs,
            chars: text.length,
          });
          onTranscript(text);
          setState("done");
        } catch (err) {
          logger.warn("[wow] stt failed:", err);
          trackKpi("wow_voice_failed", { source: "instant_wow", variant: "voice" });
          setErrorMsg("Não consegui transcrever. Tenta digitar ou gravar de novo.");
          setState("error");
        }
      };
      recorderRef.current = rec;
      rec.start();
      startTsRef.current = Date.now();
      setState("recording");
      trackKpi("wow_voice_started", { source: "instant_wow", variant: "voice" });
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTsRef.current), 100);
      autoStopRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, MAX_MS);
    } catch (err) {
      logger.warn("[wow] mic permission denied:", err);
      trackKpi("wow_voice_failed", { source: "instant_wow", variant: "voice" });
      setErrorMsg("Permita o microfone para gravar.");
      setState("error");
    }
  }, [cleanup, onTranscript]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  return { state, errorMsg, elapsedMs, start, stop, maxMs: MAX_MS };
}
