import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Phone, Upload, FileAudio, Loader2, CheckCircle2, Mic, Clock, Brain, Plus, Save } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { motion } from "framer-motion";
import { toast } from "sonner";
import HelpTooltip from "@/components/HelpTooltip";

const SalesCallTranscriber = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [callTitle, setCallTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch saved transcriptions from knowledge_documents
  const { data: savedCalls = [] } = useQuery({
    queryKey: ["sales-transcriptions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("knowledge_documents")
        .select("*")
        .eq("user_id", user!.id)
        .eq("category", "sales_call")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;
    setIsTranscribing(true);
    setTranscription(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("language", "por");

      const { data, error } = await supabase.functions.invoke("elevenlabs-stt", {
        body: formData,
      });

      if (error) throw error;
      if (!data?.text) throw new Error("Nenhuma transcrição retornada");

      setTranscription(data.text);
      setCallTitle(file.name.replace(/\.\w+$/, "") || `Chamada ${new Date().toLocaleDateString("pt-BR")}`);
      toast.success("Transcrição concluída!");
    } catch (err: any) {
      console.error("Transcription error:", err);
      toast.error("Erro na transcrição. Verifique a configuração do ElevenLabs.");
    } finally {
      setIsTranscribing(false);
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) handleFileUpload(file);
    else toast.error("Por favor, envie um arquivo de áudio.");
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const saveToKnowledge = useCallback(async () => {
    if (!user || !transcription || !callTitle.trim()) return;
    setIsSaving(true);

    try {
      // Get tenant_id
      const { data: tenantData } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
      if (!tenantData) throw new Error("Tenant não encontrado");

      await supabase.from("knowledge_documents").insert({
        user_id: user.id,
        tenant_id: tenantData,
        title: callTitle,
        content: transcription,
        category: "sales_call",
        metadata: { source: "transcription", transcribed_at: new Date().toISOString() },
      });

      toast.success("Transcrição salva na Knowledge Base!");
      setTranscription(null);
      setCallTitle("");
      queryClient.invalidateQueries({ queryKey: ["sales-transcriptions"] });
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Erro ao salvar transcrição.");
    } finally {
      setIsSaving(false);
    }
  }, [user, transcription, callTitle, queryClient]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Transcrição de Chamadas
          <HelpTooltip id="call-transcriber" text="Envie áudios de chamadas de vendas e transcreva automaticamente. As transcrições são salvas na Knowledge Base para alimentar seus agentes." size={14} />
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Transcreva chamadas de vendas e alimente a inteligência dos seus agentes.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <Card
            className="glass-card border-border/10 p-8 flex flex-col items-center justify-center gap-4 min-h-[200px] cursor-pointer hover:border-primary/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {isTranscribing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Transcrevendo com ElevenLabs Scribe...</span>
              </motion.div>
            ) : (
              <>
                <div className="p-4 rounded-full bg-primary/10">
                  <FileAudio className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Arraste um áudio ou clique para enviar</p>
                  <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG • Máx. 25MB</p>
                </div>
              </>
            )}
          </Card>

          {/* Transcription Result */}
          {transcription && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass-card border-border/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Transcrição pronta</span>
                </div>

                <Input
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  placeholder="Título da chamada..."
                  className="text-sm"
                />

                <Textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  rows={8}
                  className="text-xs resize-none"
                />

                <Button
                  className="w-full gap-2"
                  onClick={saveToKnowledge}
                  disabled={isSaving || !callTitle.trim()}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar na Knowledge Base
                </Button>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Saved Transcriptions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Chamadas Transcritas</span>
            <Badge variant="secondary" className="text-[10px] h-5">{savedCalls.length}</Badge>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {savedCalls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  Nenhuma chamada transcrita ainda.
                </div>
              ) : savedCalls.map((call: any) => (
                <Card key={call.id} className="p-3 glass-card border-border/10 group hover:bg-card/80 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">{call.title}</span>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{call.content?.slice(0, 150)}...</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground">{formatDate(call.created_at)}</span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Na KB
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default SalesCallTranscriber;
