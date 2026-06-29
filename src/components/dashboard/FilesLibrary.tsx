import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Search, FileVideo, FileAudio, FileImage, FileText,
  Palette, Sparkles, Layers, File as FileIcon, Trash2, Copy, FolderOpen,
  HardDrive, Filter, Grid3x3, List, Download, ArrowUpRight, Plus, Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";

type FileType = "video" | "audio" | "image" | "pdf" | "doc" | "brandbook" | "logo" | "marketing" | "other";

interface FileRow {
  id: string;
  name: string;
  file_type: FileType;
  bucket_path: string;
  size_bytes: number | null;
  mime: string | null;
  created_at: string;
  tags: string[] | null;
  folder: string | null;
}

const TYPE_META: Record<FileType, { label: string; singular: string; icon: React.ElementType; gradient: string; ring: string }> = {
  video:     { label: "Vídeos",      singular: "Vídeo",      icon: FileVideo, gradient: "from-rose-500/20 via-rose-500/5 to-transparent",        ring: "text-rose-500" },
  audio:     { label: "Áudios",      singular: "Áudio",      icon: FileAudio, gradient: "from-violet-500/20 via-violet-500/5 to-transparent",   ring: "text-violet-500" },
  image:     { label: "Imagens",     singular: "Imagem",     icon: FileImage, gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", ring: "text-emerald-500" },
  pdf:       { label: "PDFs",        singular: "PDF",        icon: FileText,  gradient: "from-red-500/20 via-red-500/5 to-transparent",         ring: "text-red-500" },
  doc:       { label: "Documentos",  singular: "Documento",  icon: FileText,  gradient: "from-sky-500/20 via-sky-500/5 to-transparent",         ring: "text-sky-500" },
  brandbook: { label: "Brandbooks",  singular: "Brandbook",  icon: Palette,   gradient: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent", ring: "text-fuchsia-500" },
  logo:      { label: "Logos",       singular: "Logo",       icon: Sparkles,  gradient: "from-amber-500/20 via-amber-500/5 to-transparent",     ring: "text-amber-500" },
  marketing: { label: "Marketing",   singular: "Marketing",  icon: Layers,    gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",       ring: "text-cyan-500" },
  other:     { label: "Outros",      singular: "Outro",      icon: FileIcon,  gradient: "from-muted via-muted/30 to-transparent",                ring: "text-muted-foreground" },
};

function detectType(mime: string, name: string): FileType {
  const lower = name.toLowerCase();
  if (lower.includes("brandbook")) return "brandbook";
  if (lower.includes("logo")) return "logo";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.includes("word") || mime.includes("document") || lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
  return "other";
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FilesLibrary = () => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<FileType | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragging, setDragging] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [extraFolders, setExtraFolders] = useState<string[]>([]);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileRow[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileList: FileList | File[]) => {
      if (!tenantId || !user) throw new Error("Sem tenant");
      for (const f of Array.from(fileList)) {
        const type = detectType(f.type, f.name);
        const path = `${tenantId}/${crypto.randomUUID()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("approval-files").upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("files").insert({
          tenant_id: tenantId, user_id: user.id, name: f.name, file_type: type,
          bucket_path: path, size_bytes: f.size, mime: f.type || "application/octet-stream",
          folder: activeFolder,
        });
        if (dbErr) throw dbErr;
      }
    },
    onSuccess: () => { toast.success("Arquivos enviados"); qc.invalidateQueries({ queryKey: ["files", tenantId] }); },
    onError: (e: any) => toast.error(e.message || "Falha no upload"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: FileRow) => {
      await supabase.storage.from("approval-files").remove([row.bucket_path]);
      const { error } = await supabase.from("files").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Arquivo removido"); qc.invalidateQueries({ queryKey: ["files", tenantId] }); },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: files.length };
    files.forEach((f) => (c[f.file_type] = (c[f.file_type] || 0) + 1));
    return c;
  }, [files]);

  const totalSize = useMemo(() => files.reduce((acc, f) => acc + (f.size_bytes || 0), 0), [files]);

  const folders = useMemo(() => {
    const set = new Set<string>(extraFolders);
    files.forEach((f) => { if (f.folder) set.add(f.folder); });
    return Array.from(set).sort();
  }, [files, extraFolders]);

  const filtered = useMemo(() => files.filter((f) => {
    if (filter !== "all" && f.file_type !== filter) return false;
    if (activeFolder !== null && (f.folder || "") !== activeFolder) return false;
    if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [files, filter, query, activeFolder]);

  const createFolder = () => {
    const name = window.prompt("Nome da nova pasta")?.trim();
    if (!name) return;
    if (folders.includes(name)) { toast.info("Pasta já existe"); setActiveFolder(name); return; }
    setExtraFolders((prev) => [...prev, name]);
    setActiveFolder(name);
    toast.success(`Pasta "${name}" criada. Próximos uploads irão para ela.`);
  };

  async function copyLink(row: FileRow) {
    const { data, error } = await supabase.storage.from("approval-files").createSignedUrl(row.bucket_path, 60 * 60);
    if (error || !data) return toast.error("Falha ao gerar link");
    await navigator.clipboard.writeText(data.signedUrl);
    toast.success("Link copiado (válido 1h)");
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.length) uploadMutation.mutate(e.dataTransfer.files);
  }, [uploadMutation]);

  return (
    <div
      className="space-y-6 relative"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="border-2 border-dashed border-primary rounded-3xl px-12 py-10 text-center bg-background/80 backdrop-blur">
              <Cloud className="h-12 w-12 mx-auto text-primary mb-3" strokeWidth={1.4} />
              <div className="text-lg font-semibold">Solte para enviar</div>
              <div className="text-xs text-muted-foreground mt-1">Aceitamos imagens, vídeos, áudios, PDFs e mais</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-fuchsia-500/5 p-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <HardDrive className="h-3 w-3" /> Biblioteca de ativos
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Arquivos</h1>
            <p className="text-sm text-muted-foreground">
              Cofre central de vídeos, imagens, brandbooks, logos e materiais que alimentam seus agentes de IA. Arraste pra cá e use em qualquer lugar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef} type="file" multiple className="hidden"
              onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
            />
            <Button variant="outline" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" />Nova pasta</Button>
            <Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Enviar arquivos
            </Button>
          </div>
        </div>

        {/* Quick stats inline */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill icon={Layers} label="Total" value={files.length} />
          <StatPill icon={HardDrive} label="Espaço" value={formatSize(totalSize)} />
          <StatPill icon={FileImage} label="Imagens" value={counts.image || 0} accent="text-emerald-500" />
          <StatPill icon={FileVideo} label="Vídeos" value={counts.video || 0} accent="text-rose-500" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar arquivos por nome..."
            className="pl-9 h-10 bg-muted/30 border-border/60"
          />
        </div>
        <div className="flex items-center gap-1 border border-border/60 rounded-lg p-1 bg-muted/30">
          <Button size="sm" variant={view === "grid" ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => setView("grid")}>
            <Grid3x3 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => setView("list")}>
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Category chips — replace tabs */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip active={filter === "all"} onClick={() => setFilter("all")} icon={Filter} label="Todos" count={counts.all || 0} />
        {(Object.keys(TYPE_META) as FileType[]).map((t) => {
          const M = TYPE_META[t];
          return (
            <CategoryChip
              key={t}
              active={filter === t}
              onClick={() => setFilter(t)}
              icon={M.icon}
              label={M.label}
              count={counts[t] || 0}
              accent={M.ring}
            />
          );
        })}
      </div>

      {/* Grid / list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-16 text-center">Carregando arquivos...</div>
      ) : filtered.length === 0 ? (
        <Card
          className="border-dashed border-2 bg-gradient-to-br from-muted/20 to-transparent cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="py-20 text-center space-y-3">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" strokeWidth={1.4} />
            </div>
            <div>
              <p className="text-sm font-medium">Nenhum arquivo aqui ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Arraste arquivos para qualquer lugar ou clique para enviar</p>
            </div>
            <Button variant="outline" className="gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" /> Enviar primeiro arquivo
            </Button>
          </div>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {filtered.map((f) => (
              <FileTile key={f.id} file={f} onCopy={() => copyLink(f)} onDelete={() => { if (confirm(`Excluir "${f.name}"?`)) deleteMutation.mutate(f); }} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Tamanho</th>
                <th className="text-right px-4 py-2.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const M = TYPE_META[f.file_type];
                const Icon = M.icon;
                return (
                  <tr key={f.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-muted", M.ring)}>
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </div>
                        <span className="text-xs font-medium truncate max-w-xs">{f.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{M.singular}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{formatSize(f.size_bytes)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyLink(f)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => { if (confirm(`Excluir "${f.name}"?`)) deleteMutation.mutate(f); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 backdrop-blur px-3 py-2.5">
    <div className={cn("h-8 w-8 rounded-lg bg-muted flex items-center justify-center", accent || "text-muted-foreground")}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
    </div>
    <div>
      <div className="text-sm font-semibold leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  </div>
);

const CategoryChip = ({ active, onClick, icon: Icon, label, count, accent }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; count: number; accent?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex items-center gap-2 px-3 h-9 rounded-full text-xs font-medium border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
        : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
    )}
  >
    <Icon className={cn("h-3.5 w-3.5", !active && accent)} strokeWidth={1.8} />
    {label}
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded-full",
      active ? "bg-primary-foreground/20" : "bg-background/80"
    )}>{count}</span>
  </button>
);

const FileTile = ({ file, onCopy, onDelete }: { file: FileRow; onCopy: () => void; onDelete: () => void }) => {
  const M = TYPE_META[file.file_type];
  const Icon = M.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">
        <div className={cn("aspect-square relative bg-gradient-to-br", M.gradient)}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={cn("h-12 w-12 transition-transform group-hover:scale-110", M.ring)} strokeWidth={1.2} />
          </div>
          <Badge variant="outline" className="absolute top-2 left-2 text-[9px] bg-background/80 backdrop-blur border-border/60">
            {M.singular}
          </Badge>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-background/90 backdrop-blur">
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="text-xs font-medium truncate" title={file.name}>{file.name}</div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground">{formatSize(file.size_bytes)}</div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCopy}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCopy}>
                <Download className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FilesLibrary;
