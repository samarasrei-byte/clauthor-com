import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Loader2,
  Zap,
  Lock,
  RefreshCw,
  Clapperboard,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import ModulePaywall from "@/components/paywall/ModulePaywall";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MediaDropzone from "@/components/video-studio/MediaDropzone";
import VideoStage from "@/components/video-studio/VideoStage";
import VideoInspector from "@/components/video-studio/VideoInspector";
import LibraryStrip from "@/components/video-studio/LibraryStrip";
import type { UploadedMedia } from "@/hooks/useVideoUpload";

type Provider = "veo3" | "replicate" | "lovable";

interface Quota {
  plan: string;
  monthly_limit: number;
  used: number;
  remaining: number;
  max_duration_s: number;
  allow_veo3: boolean;
  allow_replicate: boolean;
  allow_lovable: boolean;
  can_generate: boolean;
}

interface VideoGeneration {
  id: string;
  provider: Provider;
  model: string | null;
  prompt: string;
  aspect_ratio: string;
  duration_s: number;
  status: "queued" | "uploading" | "processing" | "completed" | "failed" | "canceled";
  progress: number;
  output_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Step {
  id: string;
  generation_id: string;
  step_type: string;
  status: "in_progress" | "completed" | "failed";
  message: string | null;
  created_at: string;
}

const PROVIDER_META: Record<
  Provider,
  { label: string; sub: string; Icon: typeof Sparkles; requiresConfig: boolean; comingSoon?: boolean }
> = {
  veo3: { label: "Veo 3", sub: "Google · alta qualidade", Icon: Sparkles, requiresConfig: true },
  replicate: { label: "Replicate", sub: "Multi-modelo · rápido", Icon: Zap, requiresConfig: true },
  lovable: { label: "Clauthor AI", sub: "Em breve", Icon: Clapperboard, requiresConfig: false, comingSoon: true },
};

export default function VideoStudio() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const access = useModuleAccess("video");

  const [provider, setProvider] = useState<Provider>("veo3");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [attachment, setAttachment] = useState<UploadedMedia | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(true);

  const [quota, setQuota] = useState<Quota | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  // Preencher prompt via ?prompt=
  useEffect(() => {
    const q = searchParams.get("prompt");
    if (q && !prompt) {
      setPrompt(q);
      setComposerOpen(true);
      // limpa o param para não repetir em navegações internas
      searchParams.delete("prompt");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadQuota();
    void loadGenerations();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`video-gens-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_generations", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as VideoGeneration;
          if (!row?.id) return;
          setGenerations((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((g) => g.id !== row.id);
            const idx = prev.findIndex((g) => g.id === row.id);
            if (idx === -1) return [row, ...prev];
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    setSteps([]);
    void loadSteps(activeId);
    const channel = supabase
      .channel(`video-steps-${activeId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_generation_steps", filter: `generation_id=eq.${activeId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as Step | undefined;
          if (!row?.id) return;
          setSteps((prev) => {
            if (payload.eventType === "DELETE") return prev.filter((s) => s.id !== row.id);
            const idx = prev.findIndex((s) => s.id === row.id);
            if (idx === -1) return [...prev, row];
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  const activeGen = useMemo(
    () => generations.find((g) => g.id === activeId) ?? null,
    [generations, activeId],
  );

  const providerAvailable = (p: Provider): boolean => {
    if (!quota) return false;
    if (PROVIDER_META[p].comingSoon) return false;
    if (p === "veo3") return quota.allow_veo3;
    if (p === "replicate") return quota.allow_replicate;
    return quota.allow_lovable;
  };

  async function loadQuota() {
    const { data, error } = await supabase.rpc("check_video_quota", { _user_id: user!.id });
    if (error) {
      console.error(error);
      return;
    }
    setQuota(data as unknown as Quota);
  }

  async function loadGenerations() {
    const { data, error } = await supabase
      .from("video_generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error(error);
      return;
    }
    const rows = (data ?? []) as VideoGeneration[];
    const resigned = await Promise.all(
      rows.map(async (g: any) => {
        if (g.status === "completed" && g.storage_path) {
          const { data: signed } = await supabase.storage
            .from("videos")
            .createSignedUrl(g.storage_path, 60 * 60 * 24);
          if (signed?.signedUrl) return { ...g, output_url: signed.signedUrl };
        }
        return g;
      }),
    );
    setGenerations(resigned as VideoGeneration[]);
    if (resigned.length > 0 && !activeId) setActiveId(resigned[0].id);
  }

  async function loadSteps(genId: string) {
    const { data } = await supabase
      .from("video_generation_steps")
      .select("*")
      .eq("generation_id", genId)
      .order("created_at", { ascending: true });
    setSteps((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      for (const row of (data ?? []) as Step[]) byId.set(row.id, row);
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });
  }

  async function handleGenerate() {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Descreva a cena com pelo menos 3 caracteres.");
      return;
    }
    if (!quota) {
      toast.error("Aguardando informações de plano…");
      return;
    }
    if (!quota.can_generate) {
      toast.error(`Limite mensal atingido (${quota.used}/${quota.monthly_limit}).`);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("video-generate", {
        body: {
          provider,
          prompt: prompt.trim(),
          input_image_url:
            attachment && attachment.kind === "image" ? attachment.signedUrl : null,
          aspect_ratio: aspect,
          duration_s: duration,
        },
      });
      if (error) {
        const details = (error as any)?.context ? await (error as any).context.text?.() : error.message;
        toast.error(`Falha: ${details ?? error.message}`);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).message ?? (data as any).error);
        return;
      }
      toast.success("Vídeo em produção — acompanhe no Inspector.");
      const genId = (data as any)?.generation?.id;
      if (genId) setActiveId(genId);
      setPrompt("");
      setAttachment(null);
      await loadQuota();
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao iniciar geração.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefreshPoll() {
    await supabase.functions.invoke("video-poll", { body: {} });
    await loadGenerations();
    toast.success("Status atualizado.");
  }

  // ─── Gate premium ───
  if (access.loading) {
    return (
      <div className="h-full grid place-items-center bg-background">
        <Loader2 strokeWidth={1.5} className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!access.hasAccess) {
    return (
      <ModulePaywall
        module="video"
        moduleLabel="Video Studio"
        moduleDescription="Geração e edição de vídeos com IA — Veo 3, Replicate e Clauthor AI direto do dashboard."
        requiredDepartments={access.requiredDepartments}
        benefits={[
          "Vídeos ilimitados dentro da cota do plano",
          "Timeline ao vivo do processamento",
          "Biblioteca com signed URLs regeneradas automaticamente",
          "Aspect ratios 16:9, 9:16 e 1:1 para todas as redes",
          "Integração direta com os agentes de Marketing e Comercial",
        ]}
      />
    );
  }

  const providerLabel = activeGen ? PROVIDER_META[activeGen.provider]?.label ?? activeGen.provider : "";

  return (
    <>
      <Helmet>
        <title>Video Studio · Command Center</title>
        <meta
          name="description"
          content="Gere e edite vídeos com IA — Veo 3, Replicate e Clauthor AI direto do dashboard."
        />
      </Helmet>

      <div className="h-full overflow-y-auto bg-background">
        {/* Sticky header estilo Apple */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center">
                <Clapperboard strokeWidth={1.5} className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-[17px] font-semibold tracking-tight text-foreground leading-none">
                  Video Studio
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Direção cinematográfica com agentes de IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {quota && (
                <>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium">
                    {quota.plan}
                  </Badge>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    <span className="font-medium text-foreground">{quota.used}</span>
                    <span className="opacity-60"> / {quota.monthly_limit} este mês</span>
                  </div>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleRefreshPoll} className="h-8 w-8 p-0">
                <RefreshCw strokeWidth={1.5} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Composer colapsável */}
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setComposerOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles strokeWidth={1.5} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Nova geração</span>
              </div>
              <ChevronDown
                strokeWidth={1.5}
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  composerOpen ? "rotate-180" : "rotate-0",
                )}
              />
            </button>

            {composerOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
                {/* Providers */}
                <div className="grid grid-cols-3 gap-2">
                  {(["veo3", "replicate", "lovable"] as Provider[]).map((p) => {
                    const meta = PROVIDER_META[p];
                    const available = providerAvailable(p);
                    const active = provider === p;
                    const Icon = meta.Icon;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => available && setProvider(p)}
                        disabled={!available}
                        className={cn(
                          "relative text-left px-3 py-2.5 rounded-xl border transition-all",
                          active && available
                            ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/20"
                            : "border-border/60 bg-background/40 hover:border-muted-foreground/40",
                          !available && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Icon strokeWidth={1.5} className="w-4 h-4 text-foreground" />
                          {!available && <Lock strokeWidth={1.5} className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <div className="mt-1.5 text-sm font-medium text-foreground">{meta.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{meta.sub}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Prompt */}
                <Textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Um close-up cinematográfico de uma xícara de café fumegante sobre madeira, luz da manhã…"
                  rows={3}
                  className="resize-none bg-background/40 border-border/60 focus-visible:ring-primary/30"
                />

                {/* Grid opções + upload */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.4fr] gap-3">
                  <Select value={aspect} onValueChange={setAspect}>
                    <SelectTrigger className="h-9 bg-background/40 border-border/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 · landscape</SelectItem>
                      <SelectItem value="9:16">9:16 · vertical</SelectItem>
                      <SelectItem value="1:1">1:1 · square</SelectItem>
                      <SelectItem value="4:3">4:3</SelectItem>
                      <SelectItem value="21:9">21:9 · cinema</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(duration)} onValueChange={(v) => setDuration(parseInt(v, 10))}>
                    <SelectTrigger className="h-9 bg-background/40 border-border/60 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 segundos</SelectItem>
                      <SelectItem value="10" disabled={!!quota && quota.max_duration_s < 10}>
                        10 segundos {quota && quota.max_duration_s < 10 && "(upgrade)"}
                      </SelectItem>
                      <SelectItem value="15" disabled={!!quota && quota.max_duration_s < 15}>
                        15 segundos {quota && quota.max_duration_s < 15 && "(upgrade)"}
                      </SelectItem>
                      <SelectItem value="30" disabled={!!quota && quota.max_duration_s < 30}>
                        30 segundos {quota && quota.max_duration_s < 30 && "(enterprise)"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <MediaDropzone value={attachment} onChange={setAttachment} accept="both" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-muted-foreground">
                    {quota && !quota.can_generate ? (
                      <span className="text-destructive">Limite mensal atingido.</span>
                    ) : (
                      <span>Renderização leva 1–5 minutos.</span>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={submitting || !prompt.trim() || !quota?.can_generate}
                    className="gap-2 h-9 rounded-full px-5"
                  >
                    {submitting ? (
                      <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles strokeWidth={1.5} className="w-4 h-4" />
                    )}
                    Gerar vídeo
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Grid stage + inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
            <div className="space-y-6 min-w-0">
              <VideoStage
                gen={activeGen}
                onFocusComposer={() => {
                  setComposerOpen(true);
                  setTimeout(() => promptRef.current?.focus(), 150);
                }}
              />
              <LibraryStrip generations={generations} activeId={activeId} onSelect={setActiveId} />
            </div>
            <VideoInspector gen={activeGen} steps={steps} providerLabel={providerLabel} />
          </div>
        </div>
      </div>
    </>
  );
}
