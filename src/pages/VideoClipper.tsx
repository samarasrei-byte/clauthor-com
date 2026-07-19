/**
 * Video Clipper — Ultra-modern auto-cutter.
 * Paste a YouTube/Drive/direct video URL → Thor analyzes → propose 3-6 clips
 * with hook, caption, hashtags, and target formats. Human-in-the-loop approves
 * each clip before render + auto-post to connected social networks.
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {

  Link2,
  Sparkles,
  Loader2,
  Wand2,
  Scissors,
  Youtube,
  Upload,
  CheckCircle2,
  Send,
  Instagram,
  Linkedin,
  Music2,
  Hash,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import ModulePaywall from "@/components/paywall/ModulePaywall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";


type Format = "9:16" | "1:1" | "16:9";
type ClipStatus = "proposed" | "approved" | "rendering" | "ready" | "posted" | "skipped" | "failed";

interface ClipRow {
  id: string;
  job_id: string;
  start_s: number;
  end_s: number;
  hook: string | null;
  caption: string | null;
  hashtags: string[];
  title: string | null;
  cover_url: string | null;
  status: ClipStatus;
  created_at: string;
}

interface JobRow {
  id: string;
  source_url: string;
  source_type: "youtube" | "drive" | "direct" | "upload";
  formats: Format[];
  status: string;
  created_at: string;
}

const FORMAT_OPTIONS: { value: Format; label: string; hint: string }[] = [
  { value: "9:16", label: "9:16", hint: "Reels · Shorts · TikTok" },
  { value: "1:1", label: "1:1", hint: "Feed IG · LinkedIn" },
  { value: "16:9", label: "16:9", hint: "YouTube · LI nativo" },
];

function detectSource(url: string): { type: "youtube" | "drive" | "direct" | null; icon: typeof Youtube } {
  if (!url) return { type: null, icon: Link2 };
  if (/youtu\.be|youtube\.com/i.test(url)) return { type: "youtube", icon: Youtube };
  if (/drive\.google\.com|dropbox\.com/i.test(url)) return { type: "drive", icon: Upload };
  return { type: "direct", icon: Link2 };
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoClipper() {
  useDenseMode();
  const { user } = useAuth();
  const qc = useQueryClient();
  const access = useModuleAccess("video");

  const [sourceUrl, setSourceUrl] = useState("");
  const [hint, setHint] = useState("");
  const [formats, setFormats] = useState<Format[]>(["9:16", "1:1", "16:9"]);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const source = detectSource(sourceUrl);
  const SourceIcon = source.icon;

  if (!access.loading && !access.hasAccess) {
    return (
      <ModulePaywall
        module="video-clipper"
        moduleLabel="Auto-Clipper de Vídeo"
        moduleDescription="Transforme lives, podcasts e vídeos longos em Shorts/Reels prontos para postar — corte, legenda e publicação automáticos."
        requiredDepartments={access.requiredDepartments}
        benefits={[
          "Corta os melhores momentos com IA",
          "Gera hook, legenda e hashtags",
          "Publica em Instagram, YouTube e TikTok",
          "Aprovação humana antes de postar",
        ]}
      />
    );
  }

  // Live list of clips for the current job.
  const { data: clips = [] } = useQuery<ClipRow[]>({
    queryKey: ["clipper-clips", currentJobId],
    queryFn: async () => {
      if (!currentJobId) return [];
      const { data, error } = await supabase
        .from("clipper_clips" as never)
        .select("*")
        .eq("job_id", currentJobId)
        .order("start_s", { ascending: true });
      if (error) throw error;
      return (data as unknown as ClipRow[]) ?? [];
    },
    enabled: !!currentJobId,
    refetchInterval: currentJobId ? 4000 : false,
  });

  // Recent jobs (history).
  const { data: recentJobs = [] } = useQuery<JobRow[]>({
    queryKey: ["clipper-jobs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clipper_jobs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as unknown as JobRow[]) ?? [];
    },
    enabled: !!user,
  });

  const toggleFormat = (f: Format) => {
    setFormats((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const analyze = async () => {
    if (!sourceUrl.trim()) {
      toast.error("Cole um link do vídeo primeiro");
      return;
    }
    if (formats.length === 0) {
      toast.error("Escolha pelo menos 1 formato");
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-clipper-analyze", {
        body: { source_url: sourceUrl, formats, hint: hint || undefined },
      });
      if (error) throw error;
      if (!data?.job_id) throw new Error("Resposta inválida");
      setCurrentJobId(data.job_id);
      qc.invalidateQueries({ queryKey: ["clipper-jobs"] });
      toast.success(`${data.clips?.length ?? 0} clips propostos pelo Thor`);
    } catch (e) {
      console.error(e);
      toast.error("Falha ao analisar. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const approveClip = async (clipId: string) => {
    const { error } = await supabase
      .from("clipper_clips" as never)
      .update({ status: "approved" } as never)
      .eq("id", clipId);
    if (error) {
      toast.error("Falha ao aprovar");
    } else {
      toast.success("Clip aprovado · entrando na fila de render");
      qc.invalidateQueries({ queryKey: ["clipper-clips", currentJobId] });
    }
  };

  const skipClip = async (clipId: string) => {
    await supabase.from("clipper_clips" as never).update({ status: "skipped" } as never).eq("id", clipId);
    qc.invalidateQueries({ queryKey: ["clipper-clips", currentJobId] });
  };

  return (
    <>
      <Helmet>
        <title>Auto-Clipper · Corte de vídeos com IA · Clauthor</title>
        <meta
          name="description"
          content="Cole um link do YouTube ou envie um vídeo — a IA corta os melhores momentos, cria legendas, capas e publica nas redes conectadas."
        />
      </Helmet>

      <div className="h-full overflow-y-auto bg-background">
        {/* Hero */}
        <div className="border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="mx-auto max-w-6xl px-6 pt-10 pb-8">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Auto-Clipper · powered by Thor
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
              Cole um link. Ganhe <span className="text-primary">10 Reels prontos.</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              A IA transcreve o vídeo, identifica os melhores momentos, gera legenda + hashtags + capa
              e publica direto nas redes conectadas. Você só aprova.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: input + clips */}
          <div className="space-y-6">
            {/* Ingest card */}
            <Card className="p-6 border-border/70 bg-card/50 backdrop-blur-sm">
              <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                1 · Origem do vídeo
              </label>
              <div className="relative">
                <SourceIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="Cole o link do YouTube, Google Drive, Dropbox ou MP4 público…"
                  className="pl-10 h-12 text-base"
                />
                {source.type && (
                  <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase">
                    {source.type}
                  </Badge>
                )}
              </div>

              <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                2 · Formatos (o Thor gera todos escolhidos)
              </label>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const active = formats.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFormat(opt.value)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-lg border px-4 py-2.5 text-left transition-all",
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-muted/20 hover:border-primary/40",
                      )}
                    >
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mt-6 mb-2">
                3 · Dica opcional pro Thor
              </label>
              <Textarea
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Ex.: foque nos momentos de storytelling; evite o intro; prefira quotes fortes."
                className="min-h-[70px] resize-none"
                maxLength={500}
              />

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  A análise leva ~15s. Você aprova cada corte antes de renderizar.
                </p>
                <Button size="lg" onClick={analyze} disabled={analyzing || !sourceUrl}>
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando…
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Cortar com IA
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Clips grid */}
            <AnimatePresence>
              {currentJobId && clips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      Clips propostos ({clips.length})
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      Aprovar → renderiza → posta nas redes
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {clips.map((clip, i) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        index={i}
                        onApprove={() => approveClip(clip.id)}
                        onSkip={() => skipClip(clip.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentJobId && clips.length === 0 && (
              <Card className="p-8 text-center bg-muted/10 border-dashed">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Thor está identificando os melhores momentos…</p>
              </Card>
            )}
          </div>

          {/* Right: sidebar with recent jobs + network status */}
          <aside className="space-y-4">
            <Card className="p-4 bg-card/50 border-border/70">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Redes conectadas
              </h3>
              <div className="space-y-2">
                <NetworkRow icon={Instagram} name="Instagram" status="disconnected" />
                <NetworkRow icon={Music2} name="TikTok" status="disconnected" />
                <NetworkRow icon={Youtube} name="YouTube" status="disconnected" />
                <NetworkRow icon={Linkedin} name="LinkedIn" status="disconnected" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Conecte suas redes em <span className="text-foreground">Integrações</span> pra permitir postagem automática.
              </p>
            </Card>

            <Card className="p-4 bg-card/50 border-border/70">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Jobs recentes
              </h3>
              {recentJobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum vídeo processado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setCurrentJobId(j.id)}
                      className={cn(
                        "w-full text-left rounded-md border p-2 transition-colors",
                        currentJobId === j.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono uppercase text-muted-foreground">
                          {j.source_type}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {j.status}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-foreground">{j.source_url}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Como funciona</span>
              </div>
              <ol className="space-y-1.5 text-[11px] leading-relaxed text-muted-foreground list-decimal ml-4">
                <li>Você cola o link ou envia o vídeo</li>
                <li>Thor transcreve e detecta os picos de atenção</li>
                <li>Propõe 3-6 clips com legenda, hashtags e capa</li>
                <li>Você aprova → render em 9:16 / 1:1 / 16:9</li>
                <li>Post automático nas redes conectadas</li>
              </ol>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function ClipCard({
  clip,
  index,
  onApprove,
  onSkip,
}: {
  clip: ClipRow;
  index: number;
  onApprove: () => void;
  onSkip: () => void;
}) {
  const isTerminal = clip.status !== "proposed";
  const duration = clip.end_s - clip.start_s;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 h-full flex flex-col bg-card/70 border-border/70 hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            {fmtTime(clip.start_s)} → {fmtTime(clip.end_s)} · {duration}s
          </div>
          <Badge
            variant={
              clip.status === "posted"
                ? "default"
                : clip.status === "approved" || clip.status === "rendering"
                ? "secondary"
                : "outline"
            }
            className="text-[9px] uppercase"
          >
            {clip.status}
          </Badge>
        </div>

        <h4 className="font-display text-base font-semibold text-foreground leading-tight mb-1">
          {clip.title ?? "Clip sem título"}
        </h4>
        {clip.hook && (
          <p className="text-sm text-primary italic mb-2 line-clamp-2">"{clip.hook}"</p>
        )}
        {clip.caption && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
            {clip.caption}
          </p>
        )}

        {clip.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {clip.hashtags.slice(0, 4).map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-0.5 rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                <Hash className="h-2.5 w-2.5" />
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border/40">
          {!isTerminal ? (
            <>
              <Button size="sm" variant="ghost" onClick={onSkip} className="text-muted-foreground">
                Pular
              </Button>
              <Button size="sm" onClick={onApprove} className="ml-auto">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Aprovar & publicar
              </Button>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {clip.status === "posted" ? (
                <>
                  <Send className="h-3 w-3 text-primary" /> Publicado nas redes
                </>
              ) : (
                <>Processando…</>
              )}
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function NetworkRow({
  icon: Icon,
  name,
  status,
}: {
  icon: typeof Instagram;
  name: string;
  status: "connected" | "disconnected";
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{name}</span>
      </div>
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-wider",
          status === "connected" ? "text-emerald-500" : "text-muted-foreground",
        )}
      >
        {status === "connected" ? "ativa" : "conectar"}
      </span>
    </div>
  );
}
