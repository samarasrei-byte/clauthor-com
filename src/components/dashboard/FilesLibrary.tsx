import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Upload, Search, FileVideo, FileAudio, FileImage, FileText,
  Palette, Sparkles, Layers, File as FileIcon, Trash2, Copy, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

const TYPE_META: Record<FileType, { label: string; icon: React.ElementType; color: string }> = {
  video: { label: "Vídeos", icon: FileVideo, color: "text-rose-500" },
  audio: { label: "Áudios", icon: FileAudio, color: "text-violet-500" },
  image: { label: "Imagens", icon: FileImage, color: "text-emerald-500" },
  pdf: { label: "PDFs", icon: FileText, color: "text-red-500" },
  doc: { label: "Documentos", icon: FileText, color: "text-blue-500" },
  brandbook: { label: "Brandbooks", icon: Palette, color: "text-fuchsia-500" },
  logo: { label: "Logos", icon: Sparkles, color: "text-amber-500" },
  marketing: { label: "Marketing", icon: Layers, color: "text-cyan-500" },
  other: { label: "Outros", icon: FileIcon, color: "text-muted-foreground" },
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

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileRow[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileList: FileList) => {
      if (!tenantId || !user) throw new Error("Sem tenant");
      for (const f of Array.from(fileList)) {
        const type = detectType(f.type, f.name);
        const path = `${tenantId}/${crypto.randomUUID()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("approval-files").upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("files").insert({
          tenant_id: tenantId,
          user_id: user.id,
          name: f.name,
          file_type: type,
          bucket_path: path,
          size_bytes: f.size,
          mime: f.type || "application/octet-stream",
        });
        if (dbErr) throw dbErr;
      }
    },
    onSuccess: () => {
      toast.success("Arquivos enviados");
      qc.invalidateQueries({ queryKey: ["files", tenantId] });
    },
    onError: (e: any) => toast.error(e.message || "Falha no upload"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: FileRow) => {
      await supabase.storage.from("approval-files").remove([row.bucket_path]);
      const { error } = await supabase.from("files").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arquivo removido");
      qc.invalidateQueries({ queryKey: ["files", tenantId] });
    },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: files.length };
    files.forEach((f) => (c[f.file_type] = (c[f.file_type] || 0) + 1));
    return c;
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (filter !== "all" && f.file_type !== filter) return false;
      if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [files, filter, query]);

  async function copyLink(row: FileRow) {
    const { data, error } = await supabase.storage.from("approval-files").createSignedUrl(row.bucket_path, 60 * 60);
    if (error || !data) return toast.error("Falha ao gerar link");
    await navigator.clipboard.writeText(data.signedUrl);
    toast.success("Link copiado (válido 1h)");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Arquivos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Biblioteca central de vídeos, áudios, imagens, PDFs, brandbooks, logos e materiais de marketing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              className="pl-8 h-9 w-56"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending} className="gap-2">
            <Upload className="h-4 w-4" /> Enviar arquivos
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todos <Badge variant="secondary" className="ml-2">{counts.all || 0}</Badge></TabsTrigger>
          {(Object.keys(TYPE_META) as FileType[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {TYPE_META[t].label}
              <Badge variant="secondary" className="ml-2">{counts[t] || 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <div className="py-16 text-center">
            <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum arquivo encontrado.</p>
            <Button variant="outline" onClick={() => inputRef.current?.click()} className="mt-4 gap-2">
              <Upload className="h-4 w-4" /> Enviar o primeiro arquivo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((f) => {
            const meta = TYPE_META[f.file_type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                    <Icon className={cn("h-10 w-10", meta.color)} strokeWidth={1.4} />
                    <Badge variant="outline" className="absolute top-2 left-2 text-[10px]">
                      {meta.label.slice(0, -1)}
                    </Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-xs font-medium truncate" title={f.name}>{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{formatSize(f.size_bytes)}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 px-2 flex-1" onClick={() => copyLink(f)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive"
                        onClick={() => {
                          if (confirm(`Excluir "${f.name}"?`)) deleteMutation.mutate(f);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilesLibrary;
