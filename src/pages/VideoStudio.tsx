import { useDenseMode } from "@/hooks/useDenseMode";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { BreadcrumbActions } from "@/components/dashboard/DashboardBreadcrumb";
import {

  Loader2,
  RefreshCw,
  Clapperboard,
  Settings2,
  Wand,
  Zap,
  Command as CommandIcon,
  ArrowRight,
  MessageSquare,
  Info as InfoIcon,
  FolderOpen,
} from "lucide-react";
import FilesPickerSheet, { type PickedFile } from "@/components/files/FilesPickerSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  { label: string; sub: string; Icon: typeof Wand; comingSoon?: boolean }
> = {
  veo3: { label: "Veo 3", sub: "Google · alta qualidade", Icon: Wand },
  replicate: { label: "Replicate", sub: "Multi-modelo · rápido", Icon: Zap },
  lovable: { label: "Clauthor AI", sub: "Em breve", Icon: Clapperboard, comingSoon: true },
};

export default function VideoStudio() {
  useDenseMode();
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

  // UI state · library sheet, command palette, drop preview
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [filesPickerOpen, setFilesPickerOpen] = useState(false);

  const handlePickFromLibrary = (picked: PickedFile) => {
    if (picked.file_type !== "image") {
      toast.error("Escolha uma imagem para usar como referência.");
      return;
    }
    copilot.setAttachment({
      kind: "image",
      storagePath: picked.bucket_path,
      signedUrl: picked.signedUrl,
      mime: picked.mime || "image/*",
      size: 0,
      filename: picked.name,
    });
    toast.success(`"${picked.name}" anexado como referência.`);
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropPreview, setDropPreview] = useState<string | null>(null);
  const [dropUploading, setDropUploading] = useState(false);
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
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
      toast.success("Vídeo em produção · acompanhe no Inspector.");
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
    toast.success(`Template "${t.label}" carregado · revise e gere.`);
  }

  async function handleDropFile(file: File) {
    // Instant preview via object URL · user sees the frame while upload happens.
    const localUrl = URL.createObjectURL(file);
    setDropPreview(localUrl);
    setDropUploading(true);
    try {
      const media = await uploadFile(file);
      if (media) {
        copilot.setAttachment(media);
        toast.success("Referência anexada ao Thor.");
      }
    } finally {
      setDropUploading(false);
      // Swap preview to the persistent URL (or clear) BEFORE revoking the blob,
      // so no <img> ever holds a revoked blob: URL → prevents ERR_FILE_NOT_FOUND.
      setDropPreview(null);
      URL.revokeObjectURL(localUrl);
    }
  }

  function focusCopilotChat() {
    const el = copilotChatRef.current?.querySelector<HTMLTextAreaElement>("textarea");
    el?.focus();
  }

  // Keyboard shortcuts: G (generate), L (library), /, ⇧R (reset), 1/2 provider.
  // ⌘K is handled inside VideoCommandPalette.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (paletteOpen) return;
      // "/" always focuses chat, even in inputs unless already inside one
      if (e.key === "/" && !inField) {
        e.preventDefault();
        focusCopilotChat();
        return;
      }
      if (inField) return;
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (copilot.finalPrompt && quota?.can_generate && !submitting) handleGenerate();
        else toast.info("Termine o prompt com o Thor antes de gerar (G).");
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setLibraryOpen((v) => !v);
      } else if (e.key === "R" && e.shiftKey) {
        e.preventDefault();
        copilot.reset();
      } else if (e.key === "1") {
        if (providerAvailable("veo3")) setProvider("veo3");
      } else if (e.key === "2") {
        if (providerAvailable("replicate")) setProvider("replicate");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteOpen, copilot.finalPrompt, quota?.can_generate, submitting]);

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
        moduleDescription="Geração e edição de vídeos com IA · Veo 3, Replicate e Clauthor AI direto do dashboard."
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
          content="Gere vídeos com IA guiado pelo copiloto Thor · Veo 3 e Replicate direto do dashboard."
        />
      </Helmet>

      <CopilotTour />

      <div className="h-full overflow-y-auto bg-background pb-24">
        {/* Header minimalista estilo Kling AI */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/40">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                <Clapperboard strokeWidth={1.5} className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold tracking-tight text-foreground leading-none">
                  Video Studio
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Descreva sua ideia. O Thor cuida do resto.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile-only: open Copiloto Thor as a drawer */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setMobileCopilotOpen(true)}
                aria-label="Abrir copiloto Thor"
              >
                <MessageSquare strokeWidth={1.5} className="w-4 h-4" />
              </Button>

              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-[11px]"
                      onClick={() => setPaletteOpen(true)}
                    >
                      <CommandIcon strokeWidth={1.5} className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Comandos</span>
                      <kbd className="hidden md:inline-flex h-4 px-1 items-center rounded bg-muted text-[9px] font-mono text-muted-foreground">⌘K</kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px]">Paleta de comandos · ⌘K</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <VideoLibrarySheet
                generations={generations}
                activeId={activeId}
                onSelect={setActiveId}
                open={libraryOpen}
                onOpenChange={setLibraryOpen}
              />

              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-[11px]"
                      onClick={() => setFilesPickerOpen(true)}
                      aria-label="Escolher da biblioteca de arquivos"
                    >
                      <FolderOpen strokeWidth={1.5} className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Biblioteca</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px]">
                    Reusar imagem da sua biblioteca de arquivos
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="sm" onClick={handleRefreshPoll} className="h-8 w-8 p-0" aria-label="Atualizar">
                <RefreshCw strokeWidth={1.5} className="w-4 h-4" />
              </Button>

              {/* Mobile-only: open Inspector as a drawer */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden h-8 w-8 p-0"
                onClick={() => setMobileInspectorOpen(true)}
                aria-label="Abrir inspetor"
              >
                <InfoIcon strokeWidth={1.5} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Copilot + Inspector as reusable elements for mobile drawers */}
        {(() => null)()}

        <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
          {/* Grid principal 3 colunas: Copiloto | Palco | Inspector (colapsam em drawers <lg) */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)_360px] gap-5">
            {/* Coluna esquerda: Copiloto Thor (desktop) */}
            <motion.div
              ref={copilotChatRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="hidden lg:block"
            >
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

            {/* Coluna central: Palco + ações */}
            <div className="space-y-4 min-w-0">
              <VideoStage
                gen={activeGen}
                onFocusComposer={() => copilot.reset()}
                onPickTemplate={handlePickTemplate}
                onDropFile={handleDropFile}
                droppedPreviewUrl={
                  dropPreview ??
                  (copilot.attachment?.kind === "image" ? copilot.attachment.signedUrl : null)
                }
                dropUploading={dropUploading}
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
            </div>

            {/* Coluna direita: Inspector (desktop) */}
            <div className="hidden lg:block">
              <VideoInspector gen={activeGen} steps={steps} providerLabel={providerLabel} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer · Copiloto Thor */}
      <Sheet open={mobileCopilotOpen} onOpenChange={setMobileCopilotOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border/50">
            <SheetTitle className="text-sm">Copiloto Thor</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-3">
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
              onGenerate={() => {
                setMobileCopilotOpen(false);
                handleGenerate();
              }}
              canGenerate={!!copilot.finalPrompt && !!quota?.can_generate}
              submitting={submitting}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile drawer · Inspector */}
      <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border/50">
            <SheetTitle className="text-sm">Inspetor</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">
            <VideoInspector gen={activeGen} steps={steps} providerLabel={providerLabel} />
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── Footer control bar (Kling AI / Sidense style) ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Esquerda: plano + cota */}
          <div className="flex items-center gap-3 min-w-0">
            {quota ? (
              <>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium">
                  {quota.plan}
                </Badge>
                <div className="hidden sm:flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Vídeos este mês</span>
                  <span className="font-semibold text-foreground tabular-nums">{quota.used}</span>
                  <span className="text-muted-foreground opacity-60">/ {quota.monthly_limit}</span>
                </div>
                {quota.remaining <= 2 && quota.remaining > 0 && (
                  <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                    Restam {quota.remaining}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Carregando plano…</span>
            )}
          </div>

          {/* Centro: formato + duração inline */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</span>
              <Select value={aspect} onValueChange={setAspect}>
                <SelectTrigger className="h-8 w-[86px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 · Horizontal</SelectItem>
                  <SelectItem value="9:16">9:16 · Reels</SelectItem>
                  <SelectItem value="1:1">1:1 · Quadrado</SelectItem>
                  <SelectItem value="4:3">4:3 · Clássico</SelectItem>
                  <SelectItem value="21:9">21:9 · Cinema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Duração</span>
              <Select value={String(duration)} onValueChange={(v) => setDuration(parseInt(v, 10))}>
                <SelectTrigger className="h-8 w-[92px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 segundos</SelectItem>
                  <SelectItem value="10" disabled={!!quota && quota.max_duration_s < 10}>
                    10s {quota && quota.max_duration_s < 10 && "· pro"}
                  </SelectItem>
                  <SelectItem value="15" disabled={!!quota && quota.max_duration_s < 15}>
                    15s {quota && quota.max_duration_s < 15 && "· pro"}
                  </SelectItem>
                  <SelectItem value="30" disabled={!!quota && quota.max_duration_s < 30}>
                    30s {quota && quota.max_duration_s < 30 && "· pro"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quota && quota.max_duration_s < 30 && (
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="hidden lg:inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Destrave até 30s <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Direita: atalhos */}
          <div className="hidden xl:flex items-center gap-x-3 text-[10px] text-muted-foreground">
            <Shortcut k="⌘K" label="Comandos" />
            <Shortcut k="G" label="Gerar" />
            <Shortcut k="L" label="Biblioteca" />
            <Shortcut k="/" label="Chat" />
            <Shortcut k="1/2" label="Motor" />
          </div>
        </div>
      </div>

      <VideoCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onGenerate={handleGenerate}
        onReset={copilot.reset}
        onToggleLibrary={() => setLibraryOpen((v) => !v)}
        onFocusChat={focusCopilotChat}
        onSetProvider={setProvider}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPricing={() => navigate("/pricing")}
        providerAvailable={providerAvailable}
        canGenerate={!!copilot.finalPrompt && !!quota?.can_generate && !submitting}
      />

      <FilesPickerSheet
        open={filesPickerOpen}
        onOpenChange={setFilesPickerOpen}
        onPick={handlePickFromLibrary}
        accept={["image"]}
        title="Escolher imagem de referência"
        description="Selecione uma imagem já enviada em Meus arquivos para usar como referência do vídeo."
      />
    </>
  );
}

function Shortcut({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="h-4 px-1 inline-flex items-center rounded bg-muted font-mono text-[9px] text-foreground/70">
        {k}
      </kbd>
      <span>{label}</span>
    </span>
  );
}
