import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Image as ImageIcon, LayoutGrid, Search, CheckCircle2, XCircle,
  Loader2, Play, Sparkles as SparklesLucide, Copy, ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";
import { SOCIAL_NETWORKS, type SocialNetworkDef } from "@/components/social/SocialIconsBar";

// ─── Types ────────────────────────────────────────────────────────────────
type Kind = "video" | "image";
type Filter = "all" | Kind;

interface MediaItem {
  id: string;
  kind: Kind;
  title: string;
  url: string | null;
  thumbnail: string | null;
  created_at: string;
  meta: string;      // rótulo curto: "10s · Veo 3" ou "PNG · 2.1 MB"
  bucket_path?: string; // para gerar signed url quando necessário
  source_id: string; // id da tabela original
}

// ─── Bucket → public URL helper ───────────────────────────────────────────
async function signedUrl(bucket: string, path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

// ─── Panel ────────────────────────────────────────────────────────────────
const MediaGalleryPanel = () => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  // Videos: video_generations concluídos
  const videosQ = useQuery({
    queryKey: ["media-videos", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_generations")
        .select("id, prompt, output_url, thumbnail_url, duration_s, provider, created_at, status")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []).map<MediaItem>((v) => ({
        id: `video:${v.id}`,
        source_id: v.id,
        kind: "video",
        title: v.prompt || "Vídeo sem título",
        url: v.output_url,
        thumbnail: v.thumbnail_url,
        created_at: v.created_at,
        meta: `${v.duration_s ?? 5}s · ${v.provider ?? "IA"}`,
      }));
    },
  });

  // Images: files onde file_type='image'
  const imagesQ = useQuery({
    queryKey: ["media-images", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("id, name, bucket_path, size_bytes, mime, created_at, file_type")
        .eq("file_type", "image")
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      const rows = data ?? [];
      // resolver URLs em paralelo
      const withUrls = await Promise.all(
        rows.map(async (r) => {
          const url = await signedUrl("approval-files", r.bucket_path);
          return {
            id: `image:${r.id}`,
            source_id: r.id,
            kind: "image" as const,
            title: r.name,
            url,
            thumbnail: url,
            created_at: r.created_at,
            meta: `${(r.mime ?? "IMG").split("/")[1]?.toUpperCase() ?? "IMG"}${r.size_bytes ? ` · ${(r.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}`,
            bucket_path: r.bucket_path,
          };
        }),
      );
      return withUrls;
    },
  });

  const all = useMemo<MediaItem[]>(() => {
    return [...(videosQ.data ?? []), ...(imagesQ.data ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [videosQ.data, imagesQ.data]);

  const filtered = useMemo(() => all.filter((m) => {
    if (filter !== "all" && m.kind !== filter) return false;
    if (query && !m.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [all, filter, query]);

  const counts = {
    all: all.length,
    video: all.filter((m) => m.kind === "video").length,
    image: all.filter((m) => m.kind === "image").length,
  };

  // ─── Approval mutation: sempre passa pelo agente ────────────────────────
  const approvalMutation = useMutation({
    mutationFn: async ({ item, decision, notes, networks }: { item: MediaItem; decision: "approve" | "reject"; notes: string; networks: string[] }) => {
      if (!tenantId || !user) throw new Error("Sem tenant");
      const { data: inserted, error } = await supabase.from("approvals").insert({
        tenant_id: tenantId,
        created_by: user.id,
        title: `[${decision === "approve" ? "Aprovado" : "Ajuste"}] ${item.title}`.slice(0, 200),
        delivery_type: item.kind,
        preview_url: item.url,
        status: "pending", // agente revisa e publica
        content: {
          source: "media_gallery",
          media_kind: item.kind,
          media_id: item.source_id,
          client_decision: decision,
          client_notes: notes,
          networks,
        } as any,
      }).select("id").single();
      if (error) throw error;

      // Notify the responsible agent/team (best-effort, non-blocking on UX)
      try {
        await supabase.functions.invoke("media-approval-notify", {
          body: {
            approval_id: inserted.id,
            decision,
            media_kind: item.kind,
            media_id: item.source_id,
            media_title: item.title,
            media_url: item.url,
            notes,
            networks,
          },
        });
      } catch (e) {
        console.warn("[media-approval-notify] falhou:", e);
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.decision === "approve"
          ? "Enviado ao agente para publicação"
          : "Ajuste solicitado ao agente",
      );
      qc.invalidateQueries({ queryKey: ["approvals"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar ao agente"),
  });

  const isLoading = videosQ.isLoading || imagesQ.isLoading;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <LayoutGrid className="h-3 w-3" /> Mídia
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">Galeria unificada</h1>
            <p className="text-sm text-muted-foreground">
              Todo o conteúdo gerado pelos agentes — vídeos e artes visuais no mesmo lugar. Clique para revisar, aprovar ou pedir ajustes sem sair do painel.
            </p>
          </div>
          <div className="flex gap-2">
            <StatPill icon={Film} label="Vídeos" value={counts.video} accent="text-rose-500" />
            <StatPill icon={ImageIcon} label="Artes" value={counts.image} accent="text-emerald-500" />
            <StatPill icon={SparklesLucide} label="Total" value={counts.all} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou prompt..."
            className="pl-9 h-10 bg-muted/30 border-border/60"
          />
        </div>
        <div className="flex gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} icon={LayoutGrid} label="Todos" count={counts.all} />
          <FilterChip active={filter === "video"} onClick={() => setFilter("video")} icon={Film} label="Vídeos" count={counts.video} accent="text-rose-500" />
          <FilterChip active={filter === "image"} onClick={() => setFilter("image")} icon={ImageIcon} label="Artes" count={counts.image} accent="text-emerald-500" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-16 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Carregando galeria...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-gradient-to-br from-muted/20 to-transparent">
          <div className="py-16 text-center space-y-3">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <SparklesLucide className="h-6 w-6 text-primary" strokeWidth={1.4} />
            </div>
            <div>
              <p className="text-sm font-medium">Nenhuma mídia gerada ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Peça um vídeo no Video Studio ou uma arte a um dos agentes de Marketing.</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {filtered.map((m) => (
              <MediaTile key={m.id} item={m} onClick={() => setSelected(m)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal preview + approval */}
      <MediaModal
        item={selected}
        onClose={() => setSelected(null)}
        onDecision={(decision, notes, networks) => selected && approvalMutation.mutate({ item: selected, decision, notes, networks })}
        pending={approvalMutation.isPending}
      />
    </div>
  );
};

// ─── Tile ─────────────────────────────────────────────────────────────────
const MediaTile = ({ item, onClick }: { item: MediaItem; onClick: () => void }) => (
  <motion.button
    type="button"
    layout
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    whileHover={{ y: -3 }}
    transition={{ duration: 0.18 }}
    onClick={onClick}
    className="group text-left"
  >
    <Card className="overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">
      <div className="aspect-square relative bg-neutral-950 flex items-center justify-center overflow-hidden">
        {item.kind === "video" ? (
          item.thumbnail || item.url ? (
            <>
              <video
                src={item.url ?? undefined}
                poster={item.thumbnail ?? undefined}
                muted playsInline preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-8 w-8 text-white" fill="currentColor" strokeWidth={1.2} />
              </div>
            </>
          ) : (
            <Film className="h-10 w-10 text-rose-500/70" strokeWidth={1.2} />
          )
        ) : (
          item.url ? (
            <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <ImageIcon className="h-10 w-10 text-emerald-500/70" strokeWidth={1.2} />
          )
        )}
        <Badge variant="outline" className="absolute top-2 left-2 text-[9px] bg-background/80 backdrop-blur border-border/60">
          {item.kind === "video" ? "Vídeo" : "Arte"}
        </Badge>
      </div>
      <div className="p-2.5">
        <div className="text-xs font-medium truncate" title={item.title}>{item.title}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{item.meta}</div>
      </div>
    </Card>
  </motion.button>
);

// ─── Modal: preview + agent-approval workflow ─────────────────────────────
const MediaModal = ({ item, onClose, onDecision, pending }: {
  item: MediaItem | null;
  onClose: () => void;
  onDecision: (decision: "approve" | "reject", notes: string, networks: string[]) => void;
  pending: boolean;
}) => {
  const [notes, setNotes] = useState("");
  const [pickedNetworks, setPickedNetworks] = useState<string[]>([]);

  const toggleNetwork = (n: SocialNetworkDef) => {
    if (!n.ready) { toast.info(`${n.name}: em breve`); return; }
    setPickedNetworks((prev) =>
      prev.includes(n.key) ? prev.filter((k) => k !== n.key) : [...prev, n.key],
    );
  };

  const copyUrl = () => {
    if (!item?.url) return;
    navigator.clipboard.writeText(item.url);
    toast.success("Link copiado");
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && (onClose(), setNotes(""), setPickedNetworks([]))}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0 border-border/60 bg-gradient-to-br from-background via-background to-primary/[0.03]">
        {item && (
          <div className="grid md:grid-cols-[1.4fr,1fr] max-h-[85vh]">
            {/* Preview */}
            <div className="relative bg-neutral-950 flex items-center justify-center min-h-[300px] md:min-h-full">
              {item.kind === "video" ? (
                item.url ? (
                  <video src={item.url} poster={item.thumbnail ?? undefined} controls autoPlay playsInline className="max-w-full max-h-[85vh] object-contain" />
                ) : <Film className="h-16 w-16 text-white/40" />
              ) : (
                item.url ? (
                  <img src={item.url} alt={item.title} className="max-w-full max-h-[85vh] object-contain" />
                ) : <ImageIcon className="h-16 w-16 text-white/40" />
              )}
              <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur">
                {item.kind === "video" ? "Vídeo" : "Arte"} · {item.meta}
              </Badge>
            </div>

            {/* Sidebar de ações */}
            <div className="flex flex-col overflow-y-auto p-5 gap-5 border-l border-border/50">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Título</div>
                <div className="text-sm font-medium leading-snug mt-0.5">{item.title}</div>
              </div>

              {/* Feedback ao agente */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Observações para o agente</div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: aumentar contraste, trocar CTA, focar em jovens 25-35..."
                  rows={4}
                  className="text-sm bg-muted/20 border-border/60 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  <SparklesLucide className="inline h-3 w-3 mr-0.5" />
                  Toda decisão passa pelo agente responsável — ele revisa, ajusta se necessário e publica.
                </p>
              </div>

              {/* Redes escolhidas (contexto p/ o agente) */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Publicar em</div>
                <div className="flex flex-wrap gap-1.5">
                  {SOCIAL_NETWORKS.map((n) => {
                    const Icon = n.Icon;
                    const active = pickedNetworks.includes(n.key);
                    return (
                      <button
                        key={n.key}
                        type="button"
                        onClick={() => toggleNetwork(n)}
                        title={n.ready ? n.name : `${n.name} · em breve`}
                        className={cn(
                          "h-9 w-9 rounded-lg border flex items-center justify-center transition-all",
                          active
                            ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                            : "border-border/60 bg-muted/20 hover:border-primary/40",
                          !n.ready && "opacity-50",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? "text-primary" : n.brand)} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compartilhar link */}
              {item.url && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={copyUrl}>
                    <Copy className="h-3.5 w-3.5" /> Copiar link
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1" asChild>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </a>
                  </Button>
                </div>
              )}

              {/* CTA principal · sempre passa pelo agente */}
              <div className="mt-auto space-y-2 pt-2 border-t border-border/50">
                <Button
                  className="w-full gap-2"
                  disabled={pending}
                  onClick={() => onDecision("approve", buildNotePayload(notes, pickedNetworks))}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aprovar e enviar ao agente
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={pending}
                  onClick={() => onDecision("reject", buildNotePayload(notes, pickedNetworks))}
                >
                  <XCircle className="h-4 w-4" /> Pedir ajuste
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Aprovado ou não, o agente é notificado com suas observações.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function buildNotePayload(notes: string, networks: string[]): string {
  const parts: string[] = [];
  if (notes.trim()) parts.push(notes.trim());
  if (networks.length) parts.push(`Redes selecionadas: ${networks.join(", ")}`);
  return parts.join(" · ");
}

// ─── Small pieces ─────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: string }) => (
  <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 backdrop-blur px-3 py-2">
    <div className={cn("h-7 w-7 rounded-lg bg-muted flex items-center justify-center", accent || "text-muted-foreground")}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
    </div>
    <div>
      <div className="text-sm font-semibold leading-tight tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  </div>
);

const FilterChip = ({ active, onClick, icon: Icon, label, count, accent }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; count: number; accent?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 h-9 rounded-full text-xs font-medium border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
        : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground",
    )}
  >
    <Icon className={cn("h-3.5 w-3.5", !active && accent)} strokeWidth={1.8} />
    {label}
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? "bg-primary-foreground/20" : "bg-background/80")}>{count}</span>
  </button>
);

export default MediaGalleryPanel;
