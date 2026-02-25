import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput = ({ onTranscript, disabled }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveData, setWaveData] = useState<number[]>(new Array(24).fill(0));
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopVisualization = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
    setWaveData(new Array(24).fill(0));
  }, []);

  const startVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        // Pick 24 bars from frequency data
        const bars: number[] = [];
        for (let i = 0; i < 24; i++) {
          const idx = Math.floor((i / 24) * dataArray.length);
          bars.push(dataArray[idx] / 255);
        }
        setWaveData(bars);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // No mic access, still allow speech recognition
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        console.error("Speech error:", event.error);
        toast.error("Erro no reconhecimento de voz.");
      }
      setIsRecording(false);
      stopVisualization();
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(true);
      stopVisualization();
      const text = finalTranscript.trim();
      if (text) {
        onTranscript(text);
      }
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    startVisualization();
  }, [onTranscript, startVisualization, stopVisualization]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => {
      stopVisualization();
      recognitionRef.current?.abort();
    };
  }, [stopVisualization]);

  return (
    <div className="flex items-center gap-2">
      {/* Waveform visualization */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center gap-[2px] h-8 overflow-hidden"
          >
            {waveData.map((level, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-primary"
                animate={{
                  height: Math.max(4, level * 28),
                  opacity: 0.4 + level * 0.6,
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <Button
        type="button"
        size="icon"
        variant={isRecording ? "destructive" : "ghost"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`shrink-0 relative ${isRecording ? "animate-pulse" : ""}`}
        title={isRecording ? "Parar gravação" : "Falar com o agente"}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <>
            <MicOff className="h-4 w-4" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-md border-2 border-destructive animate-ping opacity-30" />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default VoiceInput;
