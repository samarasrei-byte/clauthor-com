import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Film,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Play,
  ImagePlus,
  Zap,
  Lock,
  RefreshCw,
  Clapperboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const PROVIDER_META: Record<Provider, { label: string; sub: string; icon: string; requiresConfig: boolean; comingSoon?: boolean }> = {
  veo3: { label: "Veo 3", sub: "Google · alta qualidade", icon: "✨", requiresConfig: true },
  replicate: { label: "Replicate", sub: "Multi-modelo · rápido", icon: "⚡", requiresConfig: true },
  lovable: { label: "Lovable AI", sub: "Em breve", icon: "🎬", requiresConfig: false, comingSoon: true },
};

export default function VideoStudio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [provider, setProvider] = useState<Provider>("replicate");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [quota, setQuota] = useState<Quota | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  // Load quota + library
  useEffect(() => {
    if (!user) return;
    void loadQuota();
    void loadGenerations();
  }, [user]);

  // Realtime: subscribe to changes in video_generations
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

  // Realtime steps for the active generation
  useEffect(() => {
    if (!activeId) return;
    setSteps([]);
    void loadSteps(activeId);
    const channel = supabase
      .channel(`video-steps-${activeId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_generation_steps", filter: `generation_id=eq.${activeId}` },
        (payload) => {
          setSteps((prev) => [...prev, payload.new as Step]);
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
    if (PROVIDER_META[p].comingSoon) return false; // hard-disable "coming soon" providers
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
    setGenerations((data ?? []) as VideoGeneration[]);
    if (data && data.length > 0 && !activeId) setActiveId(data[0].id);
  }

  async function loadSteps(genId: string) {
    const { data } = await supabase
      .from("video_generation_steps")
      .select("*")
      .eq("generation_id", genId)
      .order("created_at", { ascending: true });
    setSteps((data ?? []) as Step[]);
  }

  async function handleGenerate() {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Descreva a cena com pelo menos 3 caracteres.");
      return;
    }
    if (!quota) {
      toast.error("Aguardando informações de plano...");
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
          input_image_url: imageUrl.trim() || null,
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
      toast.success("Vídeo em produção! Acompanhe a timeline ao lado.");
      const genId = (data as any)?.generation?.id;
      if (genId) setActiveId(genId);
      setPrompt("");
      setImageUrl("");
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

  return (
    <>
      <Helmet>
        <title>Video Studio · Command Center</title>
        <meta name="description" content="Gere e edite vídeos com IA — Veo 3, Replicate e Lovable AI direto do dashboard." />
      </Helmet>

      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clapperboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Video Studio</h1>
                  <p className="text-sm text-muted-foreground">Gere e edite vídeos com IA — timeline ao vivo</p>
                </div>
              </div>
            </div>

            {quota && (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs uppercase tracking-wide">
                  Plano {quota.plan}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{quota.used}</span> / {quota.monthly_limit} vídeos este mês
                </div>
                <Button variant="ghost" size="sm" onClick={handleRefreshPoll} title="Verificar status">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
            {/* LEFT: composer + preview */}
            <div className="space-y-6">
              <Card className="p-6 space-y-5 bg-card border-border">
                {/* Provider tabs */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Provider</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(["veo3", "replicate", "lovable"] as Provider[]).map((p) => {
                      const meta = PROVIDER_META[p];
                      const available = providerAvailable(p);
                      const active = provider === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => available && setProvider(p)}
                          disabled={!available}
                          className={cn(
                            "relative text-left p-3 rounded-lg border transition-all",
                            active && available
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background hover:border-muted-foreground/40",
                            !available && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-lg">{meta.icon}</div>
                            {!available && <Lock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <div className="mt-1 font-medium text-sm text-foreground">{meta.label}</div>
                          <div className="text-xs text-muted-foreground">{meta.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Descrição da cena
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Um close-up cinematográfico de uma xícara de café fumegante sobre uma mesa de madeira, luz da manhã entrando pela janela..."
                    rows={4}
                    className="mt-2 resize-none"
                  />
                </div>

                {/* Options row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Aspect
                    </label>
                    <Select value={aspect} onValueChange={setAspect}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 landscape</SelectItem>
                        <SelectItem value="9:16">9:16 vertical</SelectItem>
                        <SelectItem value="1:1">1:1 square</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="21:9">21:9 cinema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Duração ({duration}s)
                    </label>
                    <Select value={String(duration)} onValueChange={(v) => setDuration(parseInt(v, 10))}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
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
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Imagem ref. (URL)
                    </label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {quota && !quota.can_generate ? (
                      <span className="text-destructive">Limite mensal atingido — faça upgrade para continuar.</span>
                    ) : (
                      <span>Vídeos levam 1-5 minutos para render. Acompanhe a timeline ao lado.</span>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={submitting || !prompt.trim() || !quota?.can_generate}
                    size="lg"
                    className="gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar vídeo
                  </Button>
                </div>
              </Card>

              {/* Preview of active gen */}
              {activeGen && <ActivePreview gen={activeGen} />}

              {/* Library */}
              <VideoLibrary
                generations={generations}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </div>

            {/* RIGHT: live timeline */}
            <GenerationTimeline gen={activeGen} steps={steps} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Sub-components ---------- */

function ActivePreview({ gen }: { gen: VideoGeneration }) {
  return (
    <Card className="overflow-hidden bg-card border-border">
      <div className="aspect-video bg-black relative flex items-center justify-center">
        {gen.status === "completed" && gen.output_url ? (
          <video src={gen.output_url} controls className="w-full h-full" />
        ) : gen.status === "failed" ? (
          <div className="text-center p-6 text-destructive">
            <XCircle className="w-10 h-10 mx-auto mb-2" />
            <div className="text-sm">{gen.error ?? "Geração falhou"}</div>
          </div>
        ) : (
          <div className="text-center text-white/60">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            <div className="text-sm">{gen.status} · {gen.progress}%</div>
            <div className="w-48 h-1 bg-white/10 rounded-full mt-3 mx-auto overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${gen.progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 flex items-center justify-between border-t border-border">
        <div className="min-w-0">
          <div className="text-sm text-foreground truncate">{gen.prompt}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {PROVIDER_META[gen.provider]?.label} · {gen.aspect_ratio} · {gen.duration_s}s
          </div>
        </div>
        {gen.status === "completed" && gen.output_url && (
          <a href={gen.output_url} download target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Baixar
            </Button>
          </a>
        )}
      </div>
    </Card>
  );
}

function GenerationTimeline({ gen, steps }: { gen: VideoGeneration | null; steps: Step[] }) {
  return (
    <Card className="p-5 bg-card border-border h-fit sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <div className="font-semibold text-foreground">Timeline ao vivo</div>
      </div>

      {!gen ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Selecione ou gere um vídeo para ver o processo aqui.
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {steps.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 py-2 border-b border-border/50 last:border-b-0"
              >
                <StepIcon type={s.step_type} status={s.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{s.message ?? s.step_type}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(s.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {steps.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">Aguardando primeiro passo...</div>
          )}
        </div>
      )}
    </Card>
  );
}

function StepIcon({ type, status }: { type: string; status: string }) {
  if (status === "failed") return <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />;
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
  return <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 mt-0.5" />;
}

function VideoLibrary({
  generations,
  activeId,
  onSelect,
}: {
  generations: VideoGeneration[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (generations.length === 0) return null;
  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-4 h-4 text-primary" />
        <div className="font-semibold text-foreground">Biblioteca</div>
        <Badge variant="outline" className="ml-auto text-xs">{generations.length}</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {generations.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className={cn(
              "text-left rounded-lg overflow-hidden border transition-all",
              activeId === g.id ? "border-primary shadow-sm" : "border-border hover:border-muted-foreground/40",
            )}
          >
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {g.status === "completed" && g.output_url ? (
                <video src={g.output_url} muted className="w-full h-full object-cover" />
              ) : g.status === "failed" ? (
                <XCircle className="w-6 h-6 text-destructive" />
              ) : (
                <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
              )}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                {g.duration_s}s
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs text-foreground line-clamp-2">{g.prompt}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {PROVIDER_META[g.provider]?.label} · {g.status}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
