import { useState } from "react";
import { Facebook, Instagram, Link2, Download, Share2, Loader2, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { trackKpi } from "@/lib/kpiTracker";

interface Props {
  outputUrl: string | null;
  prompt: string;
  generationId: string;
  mediaType?: "video" | "image";
}

/**
 * Aba "Compartilhar" — botões estilo iOS Share Sheet.
 * Publica em Facebook/Instagram via Edge Function `meta-publish`, usando
 * a conexão Meta salva pelo usuário (fluxo OAuth já existente).
 */
export default function ShareTab({ outputUrl, prompt, generationId, mediaType = "video" }: Props) {
  const [openMeta, setOpenMeta] = useState<"facebook" | "instagram" | null>(null);
  const [caption, setCaption] = useState(prompt);
  const [publishing, setPublishing] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; detail?: string } | null>(null);

  const disabled = !outputUrl;

  const handleShare = (target: "facebook" | "instagram" | "copy" | "download") => {
    trackKpi("video_share_click", { generation_id: generationId, target });

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
    setCaption(prompt);
    setLastResult(null);
    setOpenMeta(target);
  };

  const publish = async () => {
    if (!outputUrl || !openMeta) return;
    setPublishing(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-publish", {
        body: {
          platform: openMeta,
          media_type: mediaType,
          media_url: outputUrl,
          caption,
        },
      });
      if (error) throw error;
      if (data?.ok) {
        setLastResult({ ok: true, detail: data.detail ?? `Publicado em ${openMeta}.` });
        toast.success(`Publicado em ${openMeta === "facebook" ? "Facebook" : "Instagram"}.`);
      } else {
        const msg = data?.detail || data?.error?.message || data?.stage || "Falha ao publicar.";
        setLastResult({ ok: false, detail: msg });
        toast.error(msg);
      }
    } catch (e) {
      const msg = (e as Error).message || "Erro ao chamar meta-publish";
      setLastResult({ ok: false, detail: msg });
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
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
        <ShareButton icon={<Facebook strokeWidth={1.5} className="w-4 h-4" />} label="Facebook" hint="Post na página" onClick={() => handleShare("facebook")} disabled={disabled} />
        <ShareButton icon={<Instagram strokeWidth={1.5} className="w-4 h-4" />} label="Instagram" hint={mediaType === "video" ? "Reels" : "Feed"} onClick={() => handleShare("instagram")} disabled={disabled} />
        <ShareButton icon={<Link2 strokeWidth={1.5} className="w-4 h-4" />} label="Copiar link" hint="URL assinada 24h" onClick={() => handleShare("copy")} disabled={disabled} />
        <ShareButton icon={<Download strokeWidth={1.5} className="w-4 h-4" />} label="Baixar" hint={mediaType === "video" ? "MP4 original" : "PNG original"} onClick={() => handleShare("download")} disabled={disabled} />
      </div>

      {disabled && (
        <div className="text-[11px] text-muted-foreground text-center pt-2">
          O compartilhamento aparece assim que a mídia terminar de renderizar.
        </div>
      )}

      <Dialog open={!!openMeta} onOpenChange={(open) => !open && !publishing && setOpenMeta(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {openMeta === "facebook" ? <Facebook strokeWidth={1.5} className="w-5 h-5" /> : <Instagram strokeWidth={1.5} className="w-5 h-5" />}
              Publicar em {openMeta === "facebook" ? "Facebook" : "Instagram"}
            </DialogTitle>
            <DialogDescription>
              Usa sua conta Meta conectada. Conecte em <span className="font-medium">Ajustes → Integrações</span> se ainda não fez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">Legenda</div>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className="text-sm resize-none" placeholder="Escreva a legenda…" />
          </div>

          {lastResult && (
            <div className={`rounded-lg border p-3 text-xs ${lastResult.ok ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
              <div className="flex items-start gap-2">
                {lastResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : null}
                <span>{lastResult.detail}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleShare("copy")} disabled={publishing}>
              <Link2 strokeWidth={1.5} className="w-4 h-4 mr-2" /> Copiar link
            </Button>
            <Button onClick={publish} disabled={publishing || !outputUrl}>
              {publishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando…</> : <>Publicar agora</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShareButton({ icon, label, hint, onClick, disabled }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void; disabled?: boolean; }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 hover:border-border transition-all px-3 py-3 text-left disabled:opacity-40 disabled:cursor-not-allowed">
      <div className="w-8 h-8 rounded-lg bg-muted/40 group-hover:bg-muted/60 flex items-center justify-center text-foreground">{icon}</div>
      <div className="text-xs font-medium text-foreground">{label}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </button>
  );
}
