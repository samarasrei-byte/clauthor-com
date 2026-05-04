import { useRef, useCallback, useEffect } from "react";

interface UseVADOptions {
  /** Volume threshold (0-255) to trigger barge-in. Lower = more sensitive */
  threshold?: number;
  /** How many consecutive frames above threshold before triggering */
  consecutiveFrames?: number;
  /** Called when user voice is detected */
  onVoiceDetected: () => void;
}

/**
 * Monitors microphone volume in background using AudioContext.
 * When volume crosses threshold (user starts speaking), fires onVoiceDetected.
 * Used to auto-interrupt Thor when user wants to talk.
 */
export function useVoiceActivityDetection({
  threshold = 35,
  consecutiveFrames = 3,
  onVoiceDetected,
}: UseVADOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const consecutiveCountRef = useRef(0);
  const onVoiceDetectedRef = useRef(onVoiceDetected);

  // Keep callback ref fresh
  useEffect(() => {
    onVoiceDetectedRef.current = onVoiceDetected;
  }, [onVoiceDetected]);

  const startMonitoring = useCallback(async () => {
    if (activeRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      source.connect(analyser);
      // Don't connect to destination - we only want to analyse, not play back

      activeRef.current = true;
      consecutiveCountRef.current = 0;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!activeRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        // Get average volume across frequency bins
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        if (average > threshold) {
          consecutiveCountRef.current++;
          if (consecutiveCountRef.current >= consecutiveFrames) {
            // User is speaking! Stop monitoring and fire callback
            stopMonitoring();
            onVoiceDetectedRef.current();
            return;
          }
        } else {
          consecutiveCountRef.current = 0;
        }

        rafRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("VAD: Could not access microphone", err);
    }
  }, [threshold, consecutiveFrames]);

  const stopMonitoring = useCallback(() => {
    activeRef.current = false;
    consecutiveCountRef.current = 0;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    analyserRef.current = null;

    if (audioCtxRef.current?.state !== "closed") {
      audioCtxRef.current?.close().catch(() => {});
    }
    audioCtxRef.current = null;

    // Stop all tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return { startMonitoring, stopMonitoring, isMonitoring: activeRef };
}
