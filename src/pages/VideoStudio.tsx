import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Loader2,
  RefreshCw,
  Clapperboard,
  Settings2,
  Sparkles,
  Zap,
  Command as CommandIcon,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import ModulePaywall from "@/components/paywall/ModulePaywall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

import VideoStage, { type StageTemplate } from "@/components/video-studio/VideoStage";
import VideoInspector from "@/components/video-studio/VideoInspector";
import VideoLibrarySheet from "@/components/video-studio/VideoLibrarySheet";
import VideoCommandPalette from "@/components/video-studio/VideoCommandPalette";
import ThorVideoCopilot from "@/components/video-studio/ThorVideoCopilot";
import CopilotTour from "@/components/video-studio/CopilotTour";
import StageActions from "@/components/video-studio/StageActions";
import { useVideoCopilot } from "@/hooks/useVideoCopilot";
import { useVideoUpload } from "@/hooks/useVideoUpload";


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
  { label: string; sub: string; Icon: typeof Sparkles; comingSoon?: boolean }
> = {
  veo3: { label: "Veo 3", sub: "Google · alta qualidade", Icon: Sparkles },
  replicate: { label: "Replicate", sub: "Multi-modelo · rápido", Icon: Zap },
  lovable: { label: "Clauthor AI", sub: "Em breve", Icon: Clapperboard, comingSoon: true },
};

export default function VideoStudio() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const access = useModuleAccess("video");

  const [provider, setProvider] = useState<Provider>("veo3");
  const [aspect, setAspect] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const [quota, setQuota] = useState<Quota | null>(null);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const copilot = useVideoCopilot();
  const { upload: uploadFile } = useVideoUpload();

  // UI state — library sheet, command palette, drop preview
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropPreview, setDropPreview] = useState<string | null>(null);
  const [dropUploading, setDropUploading] = useState(false);
  const copilotChatRef = useRef<HTMLDivElement | null>(null);



  // ?prompt= param pre-fills the final prompt (from Marketing agent link, etc)
  useEffect(() => {
    const q = searchParams.get("prompt");
    if (q) {
      copilot.setFinalPrompt(q);
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
      .channel(`video-gens-${user.id}`)
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
      .channel(`video-steps-${activeId}`)
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
    if (error) return console.error(error);
    setQuota(data as unknown as Quota);
  }

  async function loadGenerations() {
    const { data, error } = await supabase
      .from("video_generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return console.error(error);
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
    const finalPrompt = copilot.finalPrompt?.trim();
    if (!finalPrompt || finalPrompt.length < 3) {
      toast.error("Termine a conversa com o Thor para gerar o prompt.");
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
          prompt: finalPrompt,
          input_image_url:
            copilot.attachment && copilot.attachment.kind === "image"
              ? copilot.attachment.signedUrl
              : null,
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
      copilot.reset();
      await loadQuota();
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao iniciar geração.");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePickTemplate(t: StageTemplate) {
    copilot.setFinalPrompt(t.prompt);
    toast.success(`Template "${t.label}" carregado — revise e gere.`);
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
          "Copiloto Thor guia você na criação do prompt ideal",
          "Vídeos ilimitados dentro da cota do plano",
          "Timeline ao vivo do processamento",
          "Biblioteca com signed URLs regeneradas automaticamente",
          "Integração com DNA da empresa (cores/tom da marca)",
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
          content="Gere vídeos com IA guiado pelo copiloto Thor — Veo 3 e Replicate direto do dashboard."
        />
      </Helmet>

      <CopilotTour />

      <div className="h-full overflow-y-auto bg-background">
        {/* Sticky header estilo Notion */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/40">
          <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <Clapperboard strokeWidth={1.5} className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
                  Video Studio
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Direção cinematográfica guiada por Thor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {quota && (
                <>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium">
                    {quota.plan}
                  </Badge>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    <span className="font-medium text-foreground">{quota.used}</span>
                    <span className="opacity-60"> / {quota.monthly_limit}</span>
                  </div>
                </>
              )}

              {/* Advanced settings popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[11px]">
                    <Settings2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Configurações</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4 space-y-4">
                  <div className="text-[11px] text-muted-foreground -mb-1">
                    Formato do vídeo — o motor é escolhido no palco.
                  </div>


                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Aspect
                      </div>
                      <Select value={aspect} onValueChange={setAspect}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="9:16">9:16</SelectItem>
                          <SelectItem value="1:1">1:1</SelectItem>
                          <SelectItem value="4:3">4:3</SelectItem>
                          <SelectItem value="21:9">21:9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                        Duração
                      </div>
                      <Select value={String(duration)} onValueChange={(v) => setDuration(parseInt(v, 10))}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5s</SelectItem>
                          <SelectItem value="10" disabled={!!quota && quota.max_duration_s < 10}>
                            10s {quota && quota.max_duration_s < 10 && "🔒"}
                          </SelectItem>
                          <SelectItem value="15" disabled={!!quota && quota.max_duration_s < 15}>
                            15s {quota && quota.max_duration_s < 15 && "🔒"}
                          </SelectItem>
                          <SelectItem value="30" disabled={!!quota && quota.max_duration_s < 30}>
                            30s {quota && quota.max_duration_s < 30 && "🔒"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="sm" onClick={handleRefreshPoll} className="h-8 w-8 p-0">
                <RefreshCw strokeWidth={1.5} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-6">
          {/* Grid principal 3 colunas: Copiloto | Palco | Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)_360px] gap-5">
            {/* Coluna esquerda: Copiloto Thor */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
              <ThorVideoCopilot
                messages={copilot.messages}
                step={copilot.step}
                attachment={copilot.attachment}
                onAttachmentChange={copilot.setAttachment}
                thinking={copilot.thinking}
                finalPrompt={copilot.finalPrompt}
                onFinalPromptChange={copilot.setFinalPrompt}
                onSend={copilot.sendUserMessage}
                onReset={copilot.reset}
                onGenerate={handleGenerate}
                canGenerate={!!copilot.finalPrompt && !!quota?.can_generate}
                submitting={submitting}
              />
            </motion.div>

            {/* Coluna central: Palco + ações + biblioteca */}
            <div className="space-y-4 min-w-0">
              <VideoStage
                gen={activeGen}
                onFocusComposer={() => copilot.reset()}
                onPickTemplate={handlePickTemplate}
              />
              <StageActions
                provider={provider}
                onProviderChange={setProvider}
                providerAvailable={providerAvailable}
                finalPrompt={copilot.finalPrompt}
                onFinalPromptChange={copilot.setFinalPrompt}
                onGenerate={handleGenerate}
                canGenerate={!!copilot.finalPrompt && !!quota?.can_generate && !submitting}
                submitting={submitting}
                quotaRemaining={quota?.remaining}
              />
              <LibraryStrip generations={generations} activeId={activeId} onSelect={setActiveId} />
            </div>


            {/* Coluna direita: Inspector */}
            <VideoInspector gen={activeGen} steps={steps} providerLabel={providerLabel} />
          </div>
        </div>
      </div>
    </>
  );
}
