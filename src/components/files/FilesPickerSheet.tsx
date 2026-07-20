import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileImage, FileVideo, FileAudio, FileText, Palette, Layers, File as FileIcon, Search, Loader2, FolderOpen, Wand } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FileType = "video" | "audio" | "image" | "pdf" | "doc" | "brandbook" | "logo" | "marketing" | "other";

interface FileRow {
  id: string;
  name: string;
  file_type: FileType;
  bucket_path: string;
  size_bytes: number | null;
  mime: string | null;
  created_at: string;
}

export interface PickedFile {
  id: string;
  name: string;
  file_type: FileType;
  mime: string | null;
  signedUrl: string;
  bucket_path: string;
}

const TYPE_META: Record<FileType, { label: string; icon: React.ElementType; ring: string }> = {
  video:     { label: "Vídeo",     icon: FileVideo,  ring: "text-rose-500" },
  audio:     { label: "Áudio",     icon: FileAudio,  ring: "text-violet-500" },
  image:     { label: "Imagem",    icon: FileImage,  ring: "text-success" },
  pdf:       { label: "PDF",       icon: FileText,   ring: "text-destructive" },
  doc:       { label: "Documento", icon: FileText,   ring: "text-sky-500" },
  brandbook: { label: "Brandbook", icon: Palette,    ring: "text-fuchsia-500" },
  logo:      { label: "Logo",      icon: Wand,       ring: "text-warning" },
  marketing: { label: "Marketing", icon: Layers,     ring: "text-cyan-500" },
  other:     { label: "Outro",     icon: FileIcon,   ring: "text-muted-foreground" },
};

interface FilesPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (file: PickedFile) => void;
  /** Restrict picker to certain file types (defaults to all). */
  accept?: FileType[];
  title?: string;
  description?: string;
}

/**
 * Reusable sheet that shows the user's Files Library and returns a signed
 * URL for the picked asset. Used by Video Studio and Approvals to reuse
 * previously-uploaded media without leaving the current flow.
 */
export default function FilesPickerSheet({
  open,
  onOpenChange,
  onPick,
  accept,
  title = "Escolher da biblioteca",
  description = "Reutilize um arquivo já enviado para seus agentes.",
}: FilesPickerSheetProps) {
  const { data: tenantId } = useTenantId();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FileType | "all">("all");
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; kind: "image" | "video" | "pdf" } | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files-picker", tenantId, accept?.join(",") ?? "all"],
    enabled: !!tenantId && open,
    queryFn: async () => {
      let q = supabase.from("files").select("*").order("created_at", { ascending: false }).limit(200);
      if (accept && accept.length > 0) q = q.in("file_type", accept);
      const { data, error } = await q;
      if (error) throw error;
      return data as FileRow[];
    },
  });

  const filtered = useMemo(
    () =>
      files.filter((f) => {
        if (filter !== "all" && f.file_type !== filter) return false;
        if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [files, filter, query],
  );

  // Prefetch signed thumbnails for image rows (batched, cached in-memory).
  useEffect(() => {
    const targets = filtered.filter((f) => (f.file_type === "image" || f.file_type === "video" || f.file_type === "pdf") && !thumbs[f.id]).slice(0, 40);
    if (targets.length === 0) return;
    let cancelled = false;
    (async () => {
      const paths = targets.map((t) => t.bucket_path);
      const { data } = await supabase.storage.from("approval-files").createSignedUrls(paths, 60 * 60);
      if (cancelled || !data) return;
      const next: Record<string, string> = {};
      targets.forEach((t, i) => {
        const url = data[i]?.signedUrl;
        if (url) next[t.id] = url;
      });
      if (Object.keys(next).length) setThumbs((prev) => ({ ...prev, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [filtered, thumbs]);

  const availableTypes = useMemo(() => {
    const set = new Set<FileType>();
    files.forEach((f) => set.add(f.file_type));
    return Array.from(set);
  }, [files]);

  async function handlePick(row: FileRow) {
    setPickingId(row.id);
    try {
      const { data, error } = await supabase.storage
        .from("approval-files")
        .createSignedUrl(row.bucket_path, 60 * 60 * 24);
      if (error || !data) throw error ?? new Error("Sem URL");
      onPick({
        id: row.id,
        name: row.name,
        file_type: row.file_type,
        mime: row.mime,
        signedUrl: data.signedUrl,
        bucket_path: row.bucket_path,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar link do arquivo");
    } finally {
      setPickingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" strokeWidth={1.6} /> {title}
          </SheetTitle>
          <SheetDescription className="text-xs">{description}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-3 border-b border-border/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome…"
              className="pl-9 h-9 bg-muted/30 border-border/60"
            />
          </div>
          {availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <Chip active={filter === "all"} onClick={() => setFilter("all")} label={`Todos · ${files.length}`} />
              {availableTypes.map((t) => {
                const M = TYPE_META[t];
                const count = files.filter((f) => f.file_type === t).length;
                return (
                  <Chip
                    key={t}
                    active={filter === t}
                    onClick={() => setFilter(t)}
                    label={`${M.label} · ${count}`}
                    accent={M.ring}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando arquivos…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-muted-foreground" strokeWidth={1.4} />
              </div>
              <p className="text-sm font-medium">Nenhum arquivo compatível</p>
              <p className="text-xs text-muted-foreground">
                Envie arquivos em{" "}
                <a href="/dashboard/arquivos" className="text-primary hover:underline">
                  Meus arquivos
                </a>{" "}
                para reutilizá-los aqui.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((f) => {
                const M = TYPE_META[f.file_type];
                const Icon = M.icon;
                const isPicking = pickingId === f.id;
                const thumb = thumbs[f.id];
                return (
                  <li key={f.id}>
                    <div
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-background hover:border-primary/40 hover:bg-muted/40 transition-colors",
                        isPicking && "opacity-60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!thumb) return;
                          if (f.file_type === "image") setPreview({ url: thumb, name: f.name, kind: "image" });
                          else if (f.file_type === "video") setPreview({ url: thumb, name: f.name, kind: "video" });
                          else if (f.file_type === "pdf") setPreview({ url: thumb, name: f.name, kind: "pdf" });
                        }}
                        disabled={!((f.file_type === "image" || f.file_type === "video" || f.file_type === "pdf") && thumb)}
                        className={cn(
                          "h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden",
                          M.ring,
                          (f.file_type === "image" || f.file_type === "video" || f.file_type === "pdf") && thumb && "cursor-zoom-in hover:ring-2 hover:ring-primary/40",
                        )}
                        aria-label={thumb ? `Ver ${M.label.toLowerCase()}` : undefined}
                      >
                        {isPicking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : f.file_type === "image" && thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : f.file_type === "video" && thumb ? (
                          <video src={thumb} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {M.label} · {formatSize(f.size_bytes)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] uppercase tracking-wider"
                        onClick={() => handlePick(f)}
                        disabled={isPicking}
                      >
                        Usar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border/50 px-6 py-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Precisa enviar algo novo?</span>
          <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] gap-1">
            <a href="/dashboard/arquivos" target="_blank" rel="noreferrer">
              Abrir Meus arquivos
            </a>
          </Button>
        </div>
      </SheetContent>

      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-label={`Preview ${preview.name}`}
        >
          {preview.kind === "image" ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : preview.kind === "video" ? (
            <video
              src={preview.url}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[85vh] w-[90vw] max-w-5xl rounded-lg shadow-2xl bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </Sheet>
  );
}

function Chip({ active, onClick, label, accent }: { active: boolean; onClick: () => void; label: string; accent?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-full text-[10px] font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : cn("bg-muted/30 text-muted-foreground border-border/50 hover:text-foreground", accent),
      )}
    >
      {label}
    </button>
  );
}

function formatSize(bytes: number | null) {
  if (!bytes) return "·";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
