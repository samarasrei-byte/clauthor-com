import { Download, Link2, Loader2, PlayCircle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Gen {
  id: string;
  status: string;
  progress: number;
  output_url: string | null;
  thumbnail_url: string | null;
  prompt: string;
  error: string | null;
}

interface Props {
  gen: Gen | null;
  onFocusComposer?: () => void;
}

/**
 * Palco central estilo Apple TV: player 16:9 grande, controles nativos,
 * poster do thumbnail, e ações rápidas discretas abaixo.
 */
export default function VideoStage({ gen, onFocusComposer }: Props) {
  const handleCopy = async () => {
    if (!gen?.output_url) return;
    await navigator.clipboard.writeText(gen.output_url);
    toast.success("Link copiado.");
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-card/40 backdrop-blur shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="relative aspect-video bg-gradient-to-br from-neutral-950 to-neutral-900">
        {!gen ? (
          <EmptyStage onGenerate={onFocusComposer} />
        ) : gen.status === "completed" && gen.output_url ? (
          <video
            src={gen.output_url}
            poster={gen.thumbnail_url ?? undefined}
            controls
            className="w-full h-full object-contain"
          />
        ) : gen.status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <XCircle strokeWidth={1.5} className="w-10 h-10 text-destructive mb-3" />
            <div className="text-sm text-white/90 max-w-md">{gen.error ?? "Geração falhou."}</div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin text-white/80 mb-4" />
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
              {gen.status} · {gen.progress}%
            </div>
            <div className="w-56 h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-500"
                style={{ width: `${gen.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {gen?.status === "completed" && gen.output_url && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground truncate max-w-[60%]">{gen.prompt}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2 h-8" onClick={handleCopy}>
              <Link2 strokeWidth={1.5} className="w-3.5 h-3.5" /> Copiar link
            </Button>
            <a href={gen.output_url} download target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Download strokeWidth={1.5} className="w-3.5 h-3.5" /> Baixar
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyStage({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
      <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center mb-5">
        <PlayCircle strokeWidth={1.2} className="w-7 h-7 text-white/70" />
      </div>
      <div className="text-lg font-medium text-white/95 tracking-tight">Seu palco está pronto</div>
      <div className="text-sm text-white/50 mt-1 max-w-sm">
        Descreva a cena e nossos agentes cinematográficos produzem o vídeo em minutos.
      </div>
      {onGenerate && (
        <Button size="sm" variant="secondary" className="mt-5 gap-2" onClick={onGenerate}>
          <Sparkles strokeWidth={1.5} className="w-4 h-4" /> Gerar primeiro vídeo
        </Button>
      )}
    </div>
  );
}
