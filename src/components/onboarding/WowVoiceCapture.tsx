/**
 * WowVoiceCapture — bloco de gravação por voz para a variante A/B "voice"
 * do InstantWow. Chama STT via edge function; ao transcrever, chama
 * onTranscript(text) e o pai preenche o textarea.
 */
import { useWowVoice } from "@/hooks/useWowVoice";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function WowVoiceCapture({ onTranscript, disabled }: Props) {
  const voice = useWowVoice(onTranscript);
  const seconds = Math.floor(voice.elapsedMs / 1000);
  const remaining = Math.max(0, Math.ceil((voice.maxMs - voice.elapsedMs) / 1000));

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <div className="flex items-center gap-3">
        {voice.state === "recording" ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={voice.stop}
            className="h-10 gap-2"
          >
            <Square className="h-4 w-4" fill="currentColor" />
            Parar ({remaining}s)
          </Button>
        ) : voice.state === "transcribing" ? (
          <Button type="button" size="sm" disabled className="h-10 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcrevendo...
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={voice.start}
            disabled={disabled}
            className="h-10 gap-2"
            variant="outline"
          >
            <Mic className="h-4 w-4" />
            {voice.state === "done" ? "Gravar de novo" : "Falar sua dor"}
          </Button>
        )}

        <div className="flex-1 text-xs">
          {voice.state === "recording" && (
            <div className="flex items-center gap-2 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Gravando... {seconds}s
            </div>
          )}
          {voice.state === "transcribing" && (
            <span className="text-muted-foreground">Convertendo áudio em texto...</span>
          )}
          {voice.state === "done" && (
            <span className="text-emerald-500">Texto preenchido — ajuste se precisar.</span>
          )}
          {voice.state === "idle" && (
            <span className="text-muted-foreground">Até 30 segundos. Fale como se estivesse contando a um sócio.</span>
          )}
          {voice.state === "error" && voice.errorMsg && (
            <span className={cn("flex items-center gap-1 text-destructive")}>
              <AlertCircle className="h-3.5 w-3.5" />
              {voice.errorMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
