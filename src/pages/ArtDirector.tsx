import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Palette, Sparkles, Loader2, Send, Wand2, Download, Copy, Image as ImageIcon,
  Trash2, RefreshCw, MessageSquare,
} from "lucide-react";

/**
 * /art-director · Duo de agentes:
 *   Diretor de Conteúdo (chat) refina o briefing e propõe prompt.
 *   Artista (image gen) transforma o prompt em imagem.
 */

type ChatRole = "user" | "assistant";
interface ChatMsg { role: ChatRole; content: string; suggested_prompt?: string; ready?: boolean }
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

const INITIAL: ChatMsg[] = [{
  role: "assistant",
  content:
    "Olá, sou o **Diretor de Conteúdo** 🎨. Vou colaborar com você para transformar sua ideia em uma imagem impactante. Me diga:\n\n" +
    "1. **O que** você quer visualizar? (sujeito, cena, objeto)\n" +
    "2. **Para que** vai usar? (post, capa, ilustração, banner…)\n" +
    "3. **Que sentimento** deve transmitir?\n\n" +
    "Se preferir, jogue qualquer ideia solta e eu refino junto com você.",
  ready: false,
}];

const ArtDirector = () => {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [gallery, setGallery] = useState<ArtItem[]>([]);
  const [manualPrompt, setManualPrompt] = useState("");
  const [size, setSize] = useState<string>("1024x1024");
  const [quality, setQuality] = useState<string>("low");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const chatMut = useMutation({
    mutationFn: async (userMsg: string) => {
      const history = [...messages, { role: "user" as ChatRole, content: userMsg }]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("art-director", {
        body: { action: "chat", messages: history },
      });
      if (error) throw error;
      const res = data as {
        ok: boolean; error?: string;
        message?: string; suggested_prompt?: string; aspect_ratio?: string;
        ready_to_generate?: boolean; reasoning?: string;
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
      if (res.aspect_ratio && ASPECT_LABEL[res.aspect_ratio]) setSize(res.aspect_ratio);
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
      const res = data as { ok: boolean; error?: string; b64_json?: string; prompt?: string; size?: string; quality?: string; latency_ms?: number };
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
  };

  const clearChat = () => {
    setMessages(INITIAL);
    setManualPrompt("");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Palette className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="text-xs">Duo de agentes</Badge>
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/40">
              <Sparkles className="w-3 h-3 mr-1" /> Lovable AI
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Diretor de Arte
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            Um <b>Diretor de Conteúdo</b> conversa com você para refinar o briefing e um <b>Artista</b> gera a imagem final.
            Você pode aceitar o prompt sugerido, editá-lo ou escrever o seu.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Chat with Content Director */}
          <Card className="flex flex-col h-[70vh] lg:h-[75vh]">
            <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">Diretor de Conteúdo</div>
                  <div className="text-[11px] text-muted-foreground">Refina briefing e monta o prompt</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={clearChat} disabled={chatMut.isPending}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Limpar
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 border border-border/40"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      {m.role === "assistant" && m.suggested_prompt && (
                        <div className="mt-2 pt-2 border-t border-border/40 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                            <Wand2 className="w-3 h-3" />
                            Prompt sugerido {m.ready && <Badge className="text-[9px] h-4 px-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Pronto</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono leading-snug break-words">
                            {m.suggested_prompt}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" className="h-7 text-xs" onClick={() => genMut.mutate(m.suggested_prompt!)} disabled={genMut.isPending}>
                              {genMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                              Gerar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setManualPrompt(m.suggested_prompt!)}>
                              Editar antes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {chatMut.isPending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-muted/60 border border-border/40 rounded-2xl px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Diretor pensando…
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-3 border-t border-border/60 flex gap-2">
              <Input
                placeholder="Descreva o que quer criar…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                disabled={chatMut.isPending}
              />
              <Button onClick={handleSend} disabled={chatMut.isPending || !input.trim()}>
                {chatMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </Card>

          {/* Artist panel + gallery */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Palette className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Artista</div>
                    <div className="text-[11px] text-muted-foreground">openai/gpt-image-2</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Prompt final (editável)</label>
                  <Textarea
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="O Diretor vai sugerir aqui · ou escreva livremente."
                    rows={5}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Formato</label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASPECT_LABEL).map(([v, l]) => (
                          <SelectItem key={v} value={v} className="text-xs">{l} · {v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Qualidade</label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" className="text-xs">Rápida (low)</SelectItem>
                        <SelectItem value="medium" className="text-xs">Média</SelectItem>
                        <SelectItem value="high" className="text-xs">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1"
                    onClick={() => genMut.mutate(manualPrompt)}
                    disabled={genMut.isPending || manualPrompt.trim().length < 4}
                  >
                    {genMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    Gerar imagem
                  </Button>
                  {manualPrompt && (
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(manualPrompt);
                      toast.success("Prompt copiado");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <div className="text-sm font-semibold">Galeria</div>
                    <Badge variant="outline" className="text-[10px]">{gallery.length}</Badge>
                  </div>
                  {gallery.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setGallery([])}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Limpar
                    </Button>
                  )}
                </div>

                {gallery.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                    Nenhuma imagem ainda. Converse com o Diretor ou escreva um prompt e clique em Gerar.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gallery.map((it) => (
                      <motion.div
                        key={it.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg overflow-hidden border border-border/60 bg-muted/20"
                      >
                        <img
                          src={`data:image/png;base64,${it.b64}`}
                          alt={it.prompt}
                          className="w-full aspect-square object-cover"
                          loading="lazy"
                        />
                        <div className="p-2.5 space-y-1.5">
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">{it.prompt}</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{it.size}</Badge>
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{it.quality}</Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                navigator.clipboard.writeText(it.prompt);
                                toast.success("Prompt copiado");
                              }}>
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                setManualPrompt(it.prompt);
                                setSize(it.size);
                                genMut.mutate(it.prompt);
                              }}>
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => download(it)}>
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtDirector;
