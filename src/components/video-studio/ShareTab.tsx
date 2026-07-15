import { useState } from "react";
import { Facebook, Instagram, Link2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackKpi } from "@/lib/kpiTracker";

interface Props {
  outputUrl: string | null;
  prompt: string;
  generationId: string;
}

/**
 * Aba "Compartilhar" — botões estilo iOS Share Sheet.
 * Meta em modo dev: dispara telemetria e abre modal informativo.
 */
export default function ShareTab({ outputUrl, prompt, generationId }: Props) {
  const [openMeta, setOpenMeta] = useState<"facebook" | "instagram" | null>(null);

  const disabled = !outputUrl;

  const handleShare = (target: "facebook" | "instagram" | "copy" | "download") => {
    trackKpi("video_share_click", {
      generation_id: generationId,
      target,
    } as never);

    if (target === "copy") {
      if (!outputUrl) return;
      void navigator.clipboard.writeText(outputUrl);
      toast.success("Link copiado para a área de transferência.");
      return;
    }
    if (target === "download") {
      if (!outputUrl) return;
      window.open(outputUrl, "_blank", "noreferrer");
      return;
    }
    setOpenMeta(target);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Share2 strokeWidth={1.5} className="w-4 h-4 text-muted-foreground" />
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Compartilhar
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ShareButton
          icon={<Facebook strokeWidth={1.5} className="w-4 h-4" />}
          label="Facebook"
          hint="Post na página"
          onClick={() => handleShare("facebook")}
          disabled={disabled}
        />
        <ShareButton
          icon={<Instagram strokeWidth={1.5} className="w-4 h-4" />}
          label="Instagram"
          hint="Reels · Feed"
          onClick={() => handleShare("instagram")}
          disabled={disabled}
        />
        <ShareButton
          icon={<Link2 strokeWidth={1.5} className="w-4 h-4" />}
          label="Copiar link"
          hint="URL assinada 24h"
          onClick={() => handleShare("copy")}
          disabled={disabled}
        />
        <ShareButton
          icon={<Download strokeWidth={1.5} className="w-4 h-4" />}
          label="Baixar"
          hint="MP4 original"
          onClick={() => handleShare("download")}
          disabled={disabled}
        />
      </div>

      {disabled && (
        <div className="text-[11px] text-muted-foreground text-center pt-2">
          O compartilhamento aparece assim que o vídeo terminar de renderizar.
        </div>
      )}

      <Dialog open={!!openMeta} onOpenChange={(open) => !open && setOpenMeta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {openMeta === "facebook" ? (
                <Facebook strokeWidth={1.5} className="w-5 h-5" />
              ) : (
                <Instagram strokeWidth={1.5} className="w-5 h-5" />
              )}
              Publicação Meta em desenvolvimento
            </DialogTitle>
            <DialogDescription>
              A integração com Facebook e Instagram está em modo de desenvolvimento
              (apenas admin). Enquanto isso, você pode copiar o link ou baixar o MP4
              e publicar manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Legenda sugerida</div>
            <div className="line-clamp-3">{prompt}</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleShare("copy")}>
              <Link2 strokeWidth={1.5} className="w-4 h-4 mr-2" /> Copiar link
            </Button>
            <Button onClick={() => handleShare("download")}>
              <Download strokeWidth={1.5} className="w-4 h-4 mr-2" /> Baixar MP4
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShareButton({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-all px-3 py-3 text-left disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="w-8 h-8 rounded-lg bg-muted/40 group-hover:bg-muted/60 flex items-center justify-center text-foreground">
        {icon}
      </div>
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </button>
  );
}
