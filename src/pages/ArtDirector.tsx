import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import {
  Palette,
  Sparkles,
  Loader2,
  Send,
  Wand2,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  Share2,
  Info,
  Facebook,
  Instagram,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import ModulePaywall from "@/components/paywall/ModulePaywall";
import { kpiTrack } from "@/lib/kpiTracker";

type ChatRole = "user" | "assistant";
interface ChatMsg {
  role: ChatRole;
  content: string;
  suggested_prompt?: string;
  ready?: boolean;
}
interface ArtItem {
  id: string;
  b64: string;
  prompt: string;
  size: string;
  quality: string;
  ts: number;
}

const ASPECT_LABEL: Record<string, string> = {
  "1024x1024": "Quadrado 1:1",
  "1024x1536": "Retrato 2:3",
  "1536x1024": "Paisagem 3:2",
};

const INITIAL: ChatMsg[] = [
  {
    role: "assistant",
    content:
      "Olá, sou o **Diretor de Conteúdo**. Vou colaborar com você para transformar sua ideia em uma imagem impactante. Me conte:\n\n" +
      "1. **O que** você quer visualizar? (sujeito, cena, objeto)\n" +
      "2. **Para que** vai usar? (post, capa, ilustração, banner…)\n" +
      "3. **Que sentimento** deve transmitir?\n\n" +
      "Se preferir, jogue qualquer ideia solta e eu refino junto com você.",
    ready: false,
  },
];

type Tab = "details" | "share";

export default function ArtDirector() {
  const access = useModuleAccess("art");

  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [gallery, setGallery] = useState<ArtItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState("");
  const [size, setSize] = useState<string>("1024x1024");
  const [quality, setQuality] = useState<string>("low");
  const [composerOpen, setComposerOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("details");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const active = useMemo(
    () => gallery.find((g) => g.id === activeId) ?? gallery[0] ?? null,
    [gallery, activeId],
  );

  const chatMut = useMutation({
    mutationFn: async (userMsg: string) => {
      const history = [
        ...messages,
        { role: "user" as ChatRole, content: userMsg },
      ]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("art-director", {
        body: { action: "chat", messages: history },
      });
      if (error) throw error;
      const res = data as {
        ok: boolean;
        error?: string;
        message?: string;
        suggested_prompt?: string;
        aspect_ratio?: string;
        ready_to_generate?: boolean;
      };
      if (!res.ok) throw new Error(res.error || "Diretor falhou");
      return res;
    },
    onSuccess: (res, userMsg) => {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg },
        {
          role: "assistant",
          content: res.message || "…",
          suggested_prompt: res.suggested_prompt,
          ready: !!res.ready_to_generate && !!res.suggested_prompt,
        },
      ]);
      if (res.aspect_ratio && ASPECT_LABEL[res.aspect_ratio])
        setSize(res.aspect_ratio);
      if (res.suggested_prompt) setManualPrompt(res.suggested_prompt);
    },
    onError: (e: Error) => toast.error("Diretor: " + e.message),
  });

  const genMut = useMutation({
    mutationFn: async (prompt: string) => {
      if (prompt.trim().length < 4) throw new Error("Prompt muito curto");
      const { data, error } = await supabase.functions.invoke("art-director", {
        body: { action: "generate", prompt, size, quality },
      });
      if (error) throw error;
      const res = data as {
        ok: boolean;
        error?: string;
        b64_json?: string;
        prompt?: string;
        size?: string;
        quality?: string;
        latency_ms?: number;
      };
      if (!res.ok || !res.b64_json) throw new Error(res.error || "Artista falhou");
      return res;
    },
    onSuccess: (res) => {
      const item: ArtItem = {
        id: crypto.randomUUID(),
        b64: res.b64_json!,
        prompt: res.prompt || manualPrompt,
        size: res.size || size,
        quality: res.quality || quality,
        ts: Date.now(),
      };
      setGallery((g) => [item, ...g]);
      setActiveId(item.id);
      toast.success("Imagem gerada", { description: `${res.latency_ms}ms` });
    },
    onError: (e: Error) => toast.error("Artista: " + e.message),
  });

  const handleSend = () => {
    const v = input.trim();
    if (!v || chatMut.isPending) return;
    setInput("");
    chatMut.mutate(v);
  };

  const download = (item: ArtItem) => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${item.b64}`;
    a.download = `clauthor-art-${item.id.slice(0, 8)}.png`;
    a.click();
    kpiTrack({ event: "video_share_click", target: "download" });
  };

  const clearChat = () => {
    setMessages(INITIAL);
    setManualPrompt("");
  };

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
        module="art"
        moduleLabel="Diretor de Arte"
        moduleDescription="Duo de agentes — Diretor de Conteúdo refina o briefing e o Artista gera imagens com Clauthor AI."
        requiredDepartments={access.requiredDepartments}
        benefits={[
          "Conversa refinada com o Diretor de Conteúdo",
          "Geração de imagens em múltiplos formatos",
          "Galeria com download em 1 clique",
          "Compartilhamento social direto do palco",
        ]}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Art Studio · Command Center</title>
        <meta
          name="description"
          content="Direção de arte com IA — Diretor de Conteúdo refina o briefing e o Artista entrega a imagem final."
        />
      </Helmet>

      <div className="h-full overflow-y-auto bg-background">
        {/* Sticky header estilo Apple */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center">
                <Palette strokeWidth={1.5} className="w-4 h-4 text-foreground" />
              </div>
              <div>
                <h1 className="text-[17px] font-semibold tracking-tight text-foreground leading-none">
                  Art Studio
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Direção de arte com duo de agentes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-medium">
                Clauthor AI
              </Badge>
              <div className="text-xs text-muted-foreground hidden sm:block">
                <span className="font-medium text-foreground">{gallery.length}</span>
                <span className="opacity-60"> na galeria</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
          {/* Composer colapsável — chat + prompt */}
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
                <span className="text-sm font-medium text-foreground">
                  Diretor de Conteúdo · Artista
                </span>
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
              <div className="border-t border-border/50 grid grid-cols-1 lg:grid-cols-2">
                {/* Chat */}
                <div className="flex flex-col h-[520px] border-b lg:border-b-0 lg:border-r border-border/50">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare strokeWidth={1.5} className="w-4 h-4 text-foreground" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Diretor de Conteúdo</div>
                        <div className="text-[11px] text-muted-foreground">Refina briefing e monta o prompt</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={clearChat} disabled={chatMut.isPending} className="h-7 gap-1.5">
                      <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                      <span className="text-xs">Limpar</span>
                    </Button>
                  </div>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence initial={false}>
                      {messages.map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                              m.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/40 border border-border/40",
                            )}
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                            {m.role === "assistant" && m.suggested_prompt && (
                              <div className="mt-2 pt-2 border-t border-border/40 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                                  <Wand2 strokeWidth={1.5} className="w-3 h-3" />
                                  Prompt sugerido
                                  {m.ready && (
                                    <Badge className="text-[9px] h-4 px-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                                      Pronto
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono leading-snug break-words">
                                  {m.suggested_prompt}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => genMut.mutate(m.suggested_prompt!)}
                                    disabled={genMut.isPending}
                                  >
                                    {genMut.isPending ? (
                                      <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Wand2 strokeWidth={1.5} className="w-3 h-3 mr-1" />
                                    )}
                                    Gerar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => setManualPrompt(m.suggested_prompt!)}
                                  >
                                    Editar antes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {chatMut.isPending && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="bg-muted/40 border border-border/40 rounded-2xl px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> Diretor pensando…
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-3 border-t border-border/50 flex gap-2">
                    <Input
                      placeholder="Descreva o que quer criar…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                      }
                      disabled={chatMut.isPending}
                      className="bg-background/40 border-border/60"
                    />
                    <Button onClick={handleSend} disabled={chatMut.isPending || !input.trim()} className="rounded-full">
                      {chatMut.isPending ? (
                        <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send strokeWidth={1.5} className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Prompt manual + parâmetros */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Wand2 strokeWidth={1.5} className="w-4 h-4 text-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">Artista</div>
                      <div className="text-[11px] text-muted-foreground">
                        Prompt final · openai/gpt-image-2
                      </div>
                    </div>
                  </div>

                  <Textarea
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="O Diretor vai sugerir aqui · ou escreva livremente."
                    rows={6}
                    className="resize-none bg-background/40 border-border/60 focus-visible:ring-primary/30 font-mono text-xs"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="h-9 bg-background/40 border-border/60 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASPECT_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v} className="text-xs">
                            {l} · {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="h-9 bg-background/40 border-border/60 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">Rápida</SelectItem>
                        <SelectItem value="medium" className="text-xs">Média</SelectItem>
                        <SelectItem value="high" className="text-xs">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-muted-foreground">
                      Renderização leva 4–20s conforme qualidade.
                    </div>
                    <Button
                      onClick={() => genMut.mutate(manualPrompt)}
                      disabled={genMut.isPending || manualPrompt.trim().length < 4}
                      className="gap-2 h-9 rounded-full px-5"
                    >
                      {genMut.isPending ? (
                        <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles strokeWidth={1.5} className="w-4 h-4" />
                      )}
                      Gerar imagem
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Stage + Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
            <div className="space-y-6 min-w-0">
              <ArtStage
                item={active}
                onGenerate={() => setComposerOpen(true)}
              />
              {gallery.length > 0 && (
                <ArtLibraryStrip
                  items={gallery}
                  activeId={active?.id ?? null}
                  onSelect={setActiveId}
                />
              )}
            </div>

            <ArtInspector
              item={active}
              tab={tab}
              onTabChange={setTab}
              onDownload={download}
              onCopy={() => {
                if (!active) return;
                navigator.clipboard.writeText(active.prompt);
                toast.success("Prompt copiado.");
              }}
              onRegenerate={() => {
                if (!active) return;
                setManualPrompt(active.prompt);
                setSize(active.size);
                genMut.mutate(active.prompt);
              }}
              regenerating={genMut.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Stage ───────────────────────────────────────── */
function ArtStage({
  item,
  onGenerate,
}: {
  item: ArtItem | null;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-card/40 backdrop-blur shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-950 to-neutral-900 flex items-center justify-center">
        {item ? (
          <img
            src={`data:image/png;base64,${item.b64}`}
            alt={item.prompt}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-14 h-14 rounded-full bg-white/5 backdrop-blur border border-white/10 flex items-center justify-center mb-5">
              <ImageIcon strokeWidth={1.2} className="w-7 h-7 text-white/70" />
            </div>
            <div className="text-lg font-medium text-white/95 tracking-tight">
              Seu palco está pronto
            </div>
            <div className="text-sm text-white/50 mt-1 max-w-sm">
              Converse com o Diretor ou escreva um prompt — a imagem final aparece aqui.
            </div>
            <Button size="sm" variant="secondary" className="mt-5 gap-2" onClick={onGenerate}>
              <Sparkles strokeWidth={1.5} className="w-4 h-4" /> Abrir composer
            </Button>
          </div>
        )}
      </div>
      {item && (
        <div className="px-4 py-3 border-t border-border/50 text-xs text-muted-foreground truncate">
          {item.prompt}
        </div>
      )}
    </div>
  );
}

/* ─── Library Strip ───────────────────────────────── */
function ArtLibraryStrip({
  items,
  activeId,
  onSelect,
}: {
  items: ArtItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Galeria
        </div>
        <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.id)}
            className={cn(
              "shrink-0 relative w-28 aspect-square rounded-xl overflow-hidden border transition-all",
              activeId === it.id
                ? "border-primary ring-2 ring-primary/30"
                : "border-border/50 hover:border-muted-foreground/40",
            )}
          >
            <img
              src={`data:image/png;base64,${it.b64}`}
              alt={it.prompt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Inspector ───────────────────────────────────── */
function ArtInspector({
  item,
  tab,
  onTabChange,
  onDownload,
  onCopy,
  onRegenerate,
  regenerating,
}: {
  item: ArtItem | null;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onDownload: (item: ArtItem) => void;
  onCopy: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <aside className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur h-fit sticky top-24">
      {/* Segmented tabs */}
      <div className="p-2">
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/40 rounded-xl">
          <TabBtn active={tab === "details"} onClick={() => onTabChange("details")}>
            <Info strokeWidth={1.5} className="w-3.5 h-3.5" /> Detalhes
          </TabBtn>
          <TabBtn active={tab === "share"} onClick={() => onTabChange("share")}>
            <Share2 strokeWidth={1.5} className="w-3.5 h-3.5" /> Compartilhar
          </TabBtn>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 space-y-4">
        {!item ? (
          <div className="text-xs text-muted-foreground py-10 text-center">
            Selecione uma imagem para ver os detalhes.
          </div>
        ) : tab === "details" ? (
          <>
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Prompt
              </div>
              <p className="text-xs leading-relaxed text-foreground/90 font-mono break-words">
                {item.prompt}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Meta label="Formato" value={item.size} />
              <Meta label="Qualidade" value={item.quality} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-8 gap-2 flex-1" onClick={onCopy}>
                <Copy strokeWidth={1.5} className="w-3.5 h-3.5" /> Prompt
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-2 flex-1"
                onClick={onRegenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw strokeWidth={1.5} className="w-3.5 h-3.5" />
                )}
                Refazer
              </Button>
            </div>
          </>
        ) : (
          <ShareBlock
            item={item}
            onDownload={() => onDownload(item)}
            onCopyPrompt={onCopy}
          />
        )}
      </div>
    </aside>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-xs font-medium text-foreground mt-0.5 truncate">{value}</div>
    </div>
  );
}

function ShareBlock({
  item,
  onDownload,
  onCopyPrompt,
}: {
  item: ArtItem;
  onDownload: () => void;
  onCopyPrompt: () => void;
}) {
  const handleMeta = (target: "facebook" | "instagram") => {
    kpiTrack({ event: "video_share_click", target });
    toast.info("Meta em modo Development", {
      description: "OAuth admin será ativado no próximo turno para publicar direto no Facebook e Instagram.",
    });
  };
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
        Publicar
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => handleMeta("facebook")}>
          <Facebook strokeWidth={1.5} className="w-3.5 h-3.5" /> Facebook
        </Button>
        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => handleMeta("instagram")}>
          <Instagram strokeWidth={1.5} className="w-3.5 h-3.5" /> Instagram
        </Button>
        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={onCopyPrompt}>
          <Link2 strokeWidth={1.5} className="w-3.5 h-3.5" /> Prompt
        </Button>
        <Button size="sm" variant="outline" className="h-9 gap-2" onClick={onDownload}>
          <Download strokeWidth={1.5} className="w-3.5 h-3.5" /> Baixar
        </Button>
      </div>
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        Meta App em <b>Development Mode</b> — apenas admins autorizados publicam. A integração OAuth
        real será liberada assim que as credenciais Meta forem adicionadas.
      </div>
    </div>
  );
}
