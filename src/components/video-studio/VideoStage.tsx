import { useState } from "react";
import { Download, Link2, Loader2, PlayCircle, XCircle, Wand, Megaphone, Rocket, Film, Store, Camera, Zap, UploadCloud, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface StageTemplate {
  id: string;
  label: string;
  sub: string;
  icon: typeof Wand;
  prompt: string;
}

const TEMPLATES: StageTemplate[] = [
  {
    id: "launch",
    label: "Post de lançamento",
    sub: "30s · vertical",
    icon: Rocket,
    prompt:
      "Vídeo vertical 9:16 de 30 segundos anunciando o lançamento de um produto. Câmera cinemática se aproxima do produto sobre pedestal iluminado, luz dramática lateral, partículas suaves ao fundo, revelação heroica no clímax com o nome do produto surgindo em tipografia sans-serif elegante.",
  },
  {
    id: "demo",
    label: "Demo de produto",
    sub: "15s · 16:9",
    icon: Film,
    prompt:
      "Vídeo horizontal 16:9 de 15 segundos mostrando um produto em uso. Enquadramentos rápidos em close-up nas mãos usando o produto, iluminação natural clara, cortes ritmados, foco em textura e detalhe, mood otimista e limpo estilo Apple.",
  },
  {
    id: "reels",
    label: "Reels viral",
    sub: "15s · 9:16",
    icon: Zap,
    prompt:
      "Vídeo vertical 9:16 de 15 segundos estilo Reels viral. Sequência de takes energéticos com transições rápidas de whip pan, cores saturadas, movimento constante da câmera, close-ups expressivos de pessoas reagindo com surpresa e alegria, ambiente urbano vibrante.",
  },
  {
    id: "institutional",
    label: "Institucional",
    sub: "20s · 16:9",
    icon: Camera,
    prompt:
      "Vídeo horizontal 16:9 institucional de 20 segundos. Câmera em movimento suave em dolly sobre escritório moderno, pessoas colaborando em silêncio, luz natural de janelas grandes, paleta neutra sofisticada, tom sério e confiante estilo B2B enterprise.",
  },
  {
    id: "offer",
    label: "Anúncio de oferta",
    sub: "10s · 1:1",
    icon: Store,
    prompt:
      "Vídeo quadrado 1:1 de 10 segundos anunciando promoção relâmpago. Produto girando 360° sobre fundo colorido saturado, elementos gráficos com preço grande aparecendo em pop-in animado, ritmo acelerado, mood urgente e persuasivo estilo e-commerce.",
  },
  {
    id: "bts",
    label: "Behind the scenes",
    sub: "20s · 9:16",
    icon: Megaphone,
    prompt:
      "Vídeo vertical 9:16 de 20 segundos estilo bastidor. Handheld com leve tremor natural, iluminação prática de set, pessoas trabalhando em foco documental, cortes em jump cut, granulado sutil, mood autêntico e humano.",
  },
];

interface Props {
  gen: Gen | null;
  onFocusComposer?: () => void;
  onPickTemplate?: (t: StageTemplate) => void;
  onDropFile?: (file: File) => void;
  droppedPreviewUrl?: string | null;
  dropUploading?: boolean;
}

/**
 * Palco central. Empty state agora carrega 6 templates prontos que pré-preenchem
 * o prompt final · remove a fricção do "e agora, o que eu escrevo?".
 *
 * Também aceita drag-and-drop de imagem direto no palco: preview instantâneo
 * via object URL enquanto o upload real acontece em background.
 */
export default function VideoStage({
  gen,
  onFocusComposer,
  onPickTemplate,
  onDropFile,
  droppedPreviewUrl,
  dropUploading,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const handleCopy = async () => {
    if (!gen?.output_url) return;
    await navigator.clipboard.writeText(gen.output_url);
    toast.success("Link copiado.");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!onDropFile) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Solte uma imagem ou vídeo.");
      return;
    }
    onDropFile(file);
  };

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border bg-card/40 backdrop-blur shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all relative",
        dragging ? "border-primary ring-4 ring-primary/20" : "border-border/60",
      )}
      onDragOver={(e) => {
        if (!onDropFile) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="relative aspect-video bg-gradient-to-br from-neutral-950 to-neutral-900">
        {droppedPreviewUrl ? (
          <div className="absolute inset-0">
            <img
              src={droppedPreviewUrl}
              alt="Preview do anexo"
              className="w-full h-full object-contain bg-black"
            />
            {dropUploading && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 text-white text-[10px] uppercase tracking-widest">
                <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" />
                Enviando referência…
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-widest">
              <ImagePlus strokeWidth={1.8} className="w-3 h-3" />
              Referência
            </div>
          </div>
        ) : !gen ? (
          <EmptyStage onGenerate={onFocusComposer} onPickTemplate={onPickTemplate} />
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

      {dragging && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary z-20">
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadCloud strokeWidth={1.5} className="w-8 h-8" />
            <div className="text-sm font-medium">Solte para usar como referência</div>
            <div className="text-[11px] opacity-70">Imagem ou vídeo · preview instantâneo</div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyStage({
  onGenerate,
  onPickTemplate,
}: {
  onGenerate?: () => void;
  onPickTemplate?: (t: StageTemplate) => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8 overflow-y-auto">
      <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center mb-4">
        <PlayCircle strokeWidth={1.2} className="w-6 h-6 text-white/70" />
      </div>
      <div className="text-base font-medium text-white/95 tracking-tight">Comece por um template</div>
      <div className="text-xs text-white/50 mt-1 mb-5 max-w-sm">
        Clique num modelo e o Thor abre o prompt já preenchido · você só ajusta.
      </div>

      {onPickTemplate && (
        <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPickTemplate(t)}
                className="group text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25 transition-all px-3 py-2.5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon strokeWidth={1.5} className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition" />
                  <span className="text-[12px] font-medium text-white/90">{t.label}</span>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">{t.sub}</div>
              </button>
            );
          })}
        </div>
      )}

      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          className="mt-5 text-[11px] text-white/50 hover:text-white/80 underline underline-offset-4 transition"
        >
          ou conversar do zero com o Thor <Wand strokeWidth={1.5} className="inline w-3 h-3 ml-1" />
        </button>
      )}
    </div>
  );
}
