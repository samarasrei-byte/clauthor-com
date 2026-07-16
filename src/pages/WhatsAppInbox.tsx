/**
 * WhatsAppInbox · caixa de entrada bidirecional dentro do workspace.
 *
 * - Lista conversas do tenant (ordenadas por última mensagem).
 * - Mostra histórico da conversa selecionada.
 * - Envia mensagens outbound via edge function.
 * - Realtime: novas mensagens/conversas aparecem sem refresh.
 * - Se o tenant ainda não configurou o WhatsApp, mostra card de setup
 *   com o webhook URL + verify_token para colar no Meta.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/useTenantId";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, Phone, Copy, Settings2, CheckCircle2, AudioLines } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SEO from "@/components/SEO";

interface Conversation {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

interface WAMessage {
  id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  text_body: string | null;
  audio_transcript: string | null;
  status: string;
  thor_intent: string | null;
  created_at: string;
}

interface WAConfig {
  id: string;
  phone_number_id: string;
  display_phone_number: string | null;
  verify_token: string;
  is_active: boolean;
}

// ─── Setup card (quando não há config) ──────────────────────────────────────
function SetupCard({ tenantId, onConfigured }: { tenantId: string; onConfigured: () => void }) {
  const [phoneId, setPhoneId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [display, setDisplay] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ verify_token: string; webhook_url: string } | null>(null);

  async function save() {
    if (!phoneId.trim()) return toast.error("Phone Number ID é obrigatório");
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-configure", {
        body: {
          tenant_id: tenantId,
          phone_number_id: phoneId.trim(),
          waba_id: wabaId.trim() || null,
          display_phone_number: display.trim() || null,
        },
      });
      if (error) throw error;
      setResult({ verify_token: (data as any).verify_token, webhook_url: (data as any).webhook_url });
      toast.success("Configuração salva. Agora registre o webhook no Meta.");
      onConfigured();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Conectar WhatsApp Business
        </CardTitle>
        <CardDescription>
          Preencha com os dados do Meta Business (WhatsApp → API Setup).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Phone Number ID *</label>
          <Input value={phoneId} onChange={(e) => setPhoneId(e.target.value)} placeholder="123456789012345" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">WhatsApp Business Account ID</label>
          <Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="Opcional" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Número exibido</label>
          <Input value={display} onChange={(e) => setDisplay(e.target.value)} placeholder="+55 11 99999-0000" />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar e gerar webhook"}
        </Button>

        {result && (
          <div className="mt-6 p-4 rounded-lg bg-muted space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Próximo passo — configurar no Meta:
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium">Callback URL:</p>
                <div className="flex items-center gap-2 bg-background p-2 rounded border">
                  <code className="flex-1 break-all">{result.webhook_url}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.webhook_url); toast.success("Copiado"); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-medium">Verify Token:</p>
                <div className="flex items-center gap-2 bg-background p-2 rounded border">
                  <code className="flex-1 break-all">{result.verify_token}</code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(result.verify_token); toast.success("Copiado"); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground pt-2">
                No Meta → WhatsApp → Configuration → Webhook: cole a Callback URL + Verify Token, marque os campos <code>messages</code> e <code>message_status</code>, salve.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function WhatsAppInbox() {
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const configQuery = useQuery({
    queryKey: ["wa-config", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<WAConfig | null> => {
      const { data } = await supabase
        .from("whatsapp_config")
        .select("id, phone_number_id, display_phone_number, verify_token, is_active")
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      return (data as WAConfig | null) ?? null;
    },
  });

  const convsQuery = useQuery({
    queryKey: ["wa-conversations", tenantId],
    enabled: !!tenantId && !!configQuery.data,
    queryFn: async (): Promise<Conversation[]> => {
      const { data } = await supabase
        .from("whatsapp_conversations")
        .select("id, contact_phone, contact_name, last_message_at, last_message_preview, unread_count")
        .eq("tenant_id", tenantId!)
        .order("last_message_at", { ascending: false })
        .limit(100);
      return (data as Conversation[]) ?? [];
    },
  });

  const msgsQuery = useQuery({
    queryKey: ["wa-messages", selectedConv],
    enabled: !!selectedConv,
    queryFn: async (): Promise<WAMessage[]> => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("id, direction, message_type, text_body, audio_transcript, status, thor_intent, created_at")
        .eq("conversation_id", selectedConv!)
        .order("created_at", { ascending: true })
        .limit(500);
      return (data as WAMessage[]) ?? [];
    },
  });

  // Realtime: nova mensagem ou nova conversa → invalidar cache.
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`wa-${tenantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `tenant_id=eq.${tenantId}` }, () => {
        qc.invalidateQueries({ queryKey: ["wa-messages"] });
        qc.invalidateQueries({ queryKey: ["wa-conversations", tenantId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations", filter: `tenant_id=eq.${tenantId}` }, () => {
        qc.invalidateQueries({ queryKey: ["wa-conversations", tenantId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, qc]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgsQuery.data?.length]);

  const currentConv = useMemo(
    () => convsQuery.data?.find((c) => c.id === selectedConv) ?? null,
    [selectedConv, convsQuery.data],
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!currentConv || !tenantId || !draft.trim()) return;
      const { error } = await supabase.functions.invoke("whatsapp-send", {
        body: { tenant_id: tenantId, to: currentConv.contact_phone, text: draft.trim(), conversation_id: currentConv.id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["wa-messages", selectedConv] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao enviar"),
  });

  if (!tenantId) {
    return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  }

  if (configQuery.isLoading) {
    return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  }

  if (!configQuery.data) {
    return (
      <>
        <SEO title="Conectar WhatsApp — Clauthor" description="Configure o WhatsApp Business no workspace" />
        <div className="p-6">
          <SetupCard tenantId={tenantId} onConfigured={() => configQuery.refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="WhatsApp — Clauthor" description="Caixa de entrada WhatsApp integrada com THOR" />
      <div className="flex h-[calc(100vh-4rem)] border-t">
        {/* Sidebar de conversas */}
        <aside className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">WhatsApp</h2>
              <Badge variant="outline" className="ml-auto text-xs">
                {configQuery.data.display_phone_number ?? "Ativo"}
              </Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {convsQuery.data?.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma conversa ainda. Aguarde a primeira mensagem chegar.
              </div>
            )}
            {convsQuery.data?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={`w-full text-left p-3 border-b hover:bg-muted transition ${selectedConv === conv.id ? "bg-muted" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {conv.contact_name ?? conv.contact_phone}
                  </span>
                  {conv.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 text-xs">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_message_preview ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
              </button>
            ))}
          </ScrollArea>
        </aside>

        {/* Painel de mensagens */}
        <main className="flex-1 flex flex-col">
          {!currentConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <header className="p-4 border-b bg-card">
                <h3 className="font-semibold">{currentConv.contact_name ?? currentConv.contact_phone}</h3>
                <p className="text-xs text-muted-foreground">{currentConv.contact_phone}</p>
              </header>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
                {msgsQuery.data?.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                        m.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      }`}
                    >
                      {m.message_type === "audio" && (
                        <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                          <AudioLines className="w-3 h-3" /> áudio transcrito
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {m.text_body ?? m.audio_transcript ?? `[${m.message_type}]`}
                      </p>
                      {m.thor_intent && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          THOR → {m.thor_intent}
                        </Badge>
                      )}
                      <p className="text-[10px] opacity-60 mt-1">
                        {format(new Date(m.created_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-card flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMutation.mutate(); } }}
                  placeholder="Digite uma mensagem..."
                  disabled={sendMutation.isPending}
                />
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={!draft.trim() || sendMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
