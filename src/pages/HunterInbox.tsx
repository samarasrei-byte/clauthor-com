import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Send, Loader2, ArrowLeft, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  lead_linkedin_id: string;
  lead_name: string;
  lead_headline: string;
  lead_profile_url: string;
  lead_picture_url: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  status: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  sent_at: string;
}

const HunterInbox = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.lead_name.toLowerCase().includes(q) || c.lead_headline.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("hunter_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      setConversations((data || []) as Conversation[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("hunter-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hunter_conversations", filter: `user_id=eq.${user.id}` },
        async () => {
          const { data } = await supabase
            .from("hunter_conversations")
            .select("*")
            .eq("user_id", user.id)
            .order("last_message_at", { ascending: false });
          setConversations((data || []) as Conversation[]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages of active conversation
  useEffect(() => {
    if (!activeId || !user) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("hunter_messages_inbox")
        .select("id, sender, content, sent_at")
        .eq("conversation_id", activeId)
        .order("sent_at", { ascending: true });
      setMessages((data || []) as Message[]);

      // mark as read
      await supabase
        .from("hunter_messages_inbox")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", activeId)
        .eq("sender", "lead")
        .is("read_at", null);
      await supabase
        .from("hunter_conversations")
        .update({ unread_count: 0, status: "lendo" })
        .eq("id", activeId);
    })();

    const channel = supabase
      .channel(`hunter-messages-${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hunter_messages_inbox", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          setMessages((m) => [...m, payload.new as Message]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, user]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeId]);

  const handleSend = async () => {
    if (!active || !user || !draft.trim()) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    try {
      const { error } = await supabase.from("hunter_messages_inbox").insert({
        conversation_id: active.id,
        user_id: user.id,
        sender: "user",
        content,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase
        .from("hunter_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.slice(0, 120),
          status: "respondido",
        })
        .eq("id", active.id);

      const { error: fnError } = await supabase.functions.invoke("hunter-responder-lead", {
        body: { lead_linkedin_id: active.lead_linkedin_id, content, conversation_id: active.id },
      });
      if (fnError) {
        toast({
          title: "Mensagem salva, mas envio ao LinkedIn falhou",
          description: fnError.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Mensagem enviada", description: "Resposta encaminhada via LinkedIn." });
      }
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/hunter"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Inbox</h1>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="rounded-full">{totalUnread}</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{conversations.length} conversas</p>
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-180px)] overflow-hidden">
        {/* Left: list */}
        <div className={`border-r border-border/50 flex flex-col ${active ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma conversa ainda. As respostas dos leads aparecerão aqui.
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border/30 hover:bg-accent/50 transition-colors flex gap-3 items-start ${
                    activeId === c.id ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={c.lead_picture_url} alt={c.lead_name} />
                    <AvatarFallback>{c.lead_name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{c.lead_name || "Sem nome"}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {c.last_message_at
                          ? formatDistanceToNow(new Date(c.last_message_at), { locale: ptBR, addSuffix: false })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.lead_headline}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate flex-1">{c.last_message_preview}</p>
                      {c.unread_count > 0 && (
                        <Badge variant="destructive" className="rounded-full h-5 min-w-5 px-1.5 text-[10px]">
                          {c.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Right: conversation */}
        <div className={`flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Selecione uma conversa para começar
            </div>
          ) : (
            <>
              <div className="border-b border-border/50 p-3 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActiveId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={active.lead_picture_url} alt={active.lead_name} />
                  <AvatarFallback>{active.lead_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{active.lead_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{active.lead_headline}</p>
                </div>
                {active.lead_profile_url && (
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <a href={active.lead_profile_url} target="_blank" rel="noopener noreferrer">
                      Perfil <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollRef as any}>
                <div className="space-y-2">
                  {messages.map((m) => {
                    const isUser = m.sender === "user";
                    return (
                      <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                            isUser
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border/50 rounded-bl-sm"
                          }`}
                        >
                          {m.content}
                          <div className={`text-[10px] mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(m.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">Sem mensagens ainda.</p>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t border-border/50 p-3 flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escreva sua resposta..."
                  className="min-h-[44px] max-h-32 resize-none"
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !draft.trim()} className="gap-1">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HunterInbox;
