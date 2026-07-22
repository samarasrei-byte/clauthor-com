import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Inbox,
  Search,
  Mail,
  MessageCircle,
  Loader2,
  Plug,
  Linkedin,
  Instagram,
  Facebook,
  Phone,
  Music2,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { BreadcrumbActions } from "@/components/dashboard/DashboardBreadcrumb";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ── Channels ────────────────────────────────────────────────────────────────
type ChannelId =
  | "all"
  | "linkedin"
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "tiktok"
  | "email";

interface ChannelDef {
  id: Exclude<ChannelId, "all">;
  label: string;
  icon: typeof Mail;
  color: string;
  connected: boolean;
  connectHref?: string;
}

const BASE_CHANNELS: Omit<ChannelDef, "connected">[] = [
  { id: "linkedin",  label: "LinkedIn",  icon: Linkedin,      color: "text-[#0A66C2]", connectHref: "/dashboard/hunter" },
  { id: "instagram", label: "Instagram", icon: Instagram,     color: "text-[#E4405F]", connectHref: "/integrations" },
  { id: "whatsapp",  label: "WhatsApp",  icon: Phone,         color: "text-success",   connectHref: "/dashboard/whatsapp" },
  { id: "facebook",  label: "Facebook",  icon: Facebook,      color: "text-[#1877F2]", connectHref: "/integrations" },
  { id: "tiktok",    label: "TikTok",    icon: Music2,        color: "text-foreground",connectHref: "/integrations" },
  { id: "email",     label: "E-mail",    icon: Mail,          color: "text-accent-blue" },
];

interface Thread {
  id: string;
  channel: Exclude<ChannelId, "all">;
  title: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  fromMe?: boolean;
  href?: string;
  body?: string;
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function AgentInbox() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelId>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // LinkedIn (via Hunter) ---------------------------------------------------
  const linkedinQuery = useQuery({
    queryKey: ["inbox-linkedin", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("hunter_messages_inbox")
        .select("id, content, sender, sent_at, read_at, conversation_id")
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false })
        .limit(100);
      return (data ?? []).map<Thread>((m) => ({
        id: `li-${m.id}`,
        channel: "linkedin",
        title: m.sender || "LinkedIn",
        preview: m.content,
        body: m.content,
        timestamp: m.sent_at,
        unread: !m.read_at,
        fromMe: m.sender === "me",
        href: "/dashboard/hunter",
      }));
    },
  });

  // WhatsApp ----------------------------------------------------------------
  const whatsappQuery = useQuery({
    queryKey: ["inbox-whatsapp", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("id, text_body, direction, created_at, conversation_id")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data ?? []).map<Thread>((m: any) => ({
        id: `wa-${m.id}`,
        channel: "whatsapp",
        title: `WhatsApp · ${(m.conversation_id || "").slice(0, 8)}`,
        preview: m.text_body || "(mídia)",
        body: m.text_body || "(mensagem sem texto)",
        timestamp: m.created_at,
        unread: m.direction === "inbound",
        fromMe: m.direction === "outbound",
        href: "/dashboard/whatsapp",
      }));
    },
  });

  // E-mail (approvals / notifications) --------------------------------------
  const emailQuery = useQuery({
    queryKey: ["inbox-email", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, created_at, is_read, type, metadata")
        .eq("user_id", user!.id)
        .in("type", ["media_approved", "media_revision_requested", "email"])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []).map<Thread>((n) => ({
        id: `em-${n.id}`,
        channel: "email",
        title: n.title,
        preview: n.message,
        body: n.message,
        timestamp: n.created_at,
        unread: !n.is_read,
      }));
    },
  });

  const isLoading =
    linkedinQuery.isLoading || whatsappQuery.isLoading || emailQuery.isLoading;

  const allThreads: Thread[] = useMemo(
    () => [
      ...(linkedinQuery.data ?? []),
      ...(whatsappQuery.data ?? []),
      ...(emailQuery.data ?? []),
    ],
    [linkedinQuery.data, whatsappQuery.data, emailQuery.data],
  );

  const counts = useMemo(() => {
    const c: Record<ChannelId, number> = {
      all: allThreads.length,
      linkedin: 0, instagram: 0, whatsapp: 0, facebook: 0, tiktok: 0, email: 0,
    };
    for (const t of allThreads) c[t.channel]++;
    return c;
  }, [allThreads]);

  const filtered = useMemo(() => {
    let out = allThreads;
    if (channel !== "all") out = out.filter((t) => t.channel === channel);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.preview.toLowerCase().includes(q),
      );
    }
    return out.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [allThreads, channel, search]);

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null;

  const activeChannelDef =
    channel !== "all" ? CHANNELS.find((c) => c.id === channel) : null;
  const showConnectState =
    activeChannelDef && !activeChannelDef.connected && filtered.length === 0;

  return (
    <>
      <Helmet>
        <title>Inbox Unificado · Clauthor</title>
        <meta
          name="description"
          content="Todas as conversas dos seus agentes — LinkedIn, Instagram, WhatsApp, Facebook, TikTok e e-mails — num só lugar."
        />
      </Helmet>

      <BreadcrumbActions>
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Link to="/dashboard/integrations"><Plug className="h-3.5 w-3.5" /> Conectar canal</Link>
        </Button>
      </BreadcrumbActions>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Inbox className="h-6 w-6 text-primary" />
              Inbox Unificado
            </h1>
            <p className="text-sm text-muted-foreground">
              LinkedIn · Instagram · WhatsApp · Facebook · TikTok · E-mail — tudo em um lugar.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Channel Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <ChannelPill
            active={channel === "all"}
            onClick={() => { setChannel("all"); setSelectedId(null); }}
            icon={Inbox}
            label="Todos"
            count={counts.all}
          />
          {CHANNELS.map((c) => (
            <ChannelPill
              key={c.id}
              active={channel === c.id}
              onClick={() => { setChannel(c.id); setSelectedId(null); }}
              icon={c.icon}
              label={c.label}
              count={counts[c.id]}
              iconColor={c.color}
              disabled={!c.connected}
            />
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[560px]">
          {/* List */}
          <Card className="p-0 overflow-hidden">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando conversas…
                </div>
              ) : showConnectState ? (
                <ConnectChannelState channel={activeChannelDef!} />
              ) : filtered.length === 0 ? (
                <EmptyInbox />
              ) : (
                <ul className="divide-y">
                  {filtered.map((t) => {
                    const def = CHANNELS.find((c) => c.id === t.channel)!;
                    const Icon = def.icon;
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => setSelectedId(t.id)}
                          className={cn(
                            "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                            selected?.id === t.id && "bg-muted",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5 shrink-0", def.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "truncate text-sm",
                                  t.unread ? "font-semibold" : "font-medium",
                                )}>
                                  {t.title}
                                </p>
                                {t.unread && (
                                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {t.fromMe && <span className="text-foreground/60">Você: </span>}
                                {t.preview}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(t.timestamp), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </Card>

          {/* Detail */}
          <Card className="p-6">
            {selected ? (
              <ThreadDetail thread={selected} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <MessageCircle className="h-8 w-8 mb-2 opacity-40" />
                Selecione uma conversa para abrir
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────────
function ChannelPill({
  active, onClick, icon: Icon, label, count, iconColor, disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mail;
  label: string;
  count: number;
  iconColor?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card hover:bg-muted border-border text-foreground/80",
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", !active && iconColor)} />
      <span>{label}</span>
      {count > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "ml-0.5 h-4 px-1.5 text-[10px]",
            active && "bg-primary-foreground/20 text-primary-foreground",
          )}
        >
          {count}
        </Badge>
      )}
      {disabled && !active && (
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 ml-0.5">
          conectar
        </span>
      )}
    </button>
  );
}

function ConnectChannelState({ channel }: { channel: ChannelDef }) {
  const Icon = channel.icon;
  return (
    <div className="p-10 text-center">
      <div className={cn(
        "mx-auto h-14 w-14 rounded-2xl bg-muted grid place-items-center mb-4",
        channel.color,
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="dash-title mb-1.5">
        Conecte sua conta {channel.label}
      </h2>
      <p className="dash-label max-w-sm mx-auto mb-5">
        Autorize o acesso para que os agentes recebam e respondam mensagens de {channel.label} direto por aqui.
      </p>
      {channel.connectHref && (
        <Button asChild size="sm">
          <Link to={channel.connectHref}>
            <Plug className="h-4 w-4 mr-2" />
            Conectar {channel.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

function EmptyInbox() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mb-4">
        <Inbox className="h-6 w-6 text-primary" />
      </div>
      <h2 className="dash-title mb-1.5">Sua caixa está limpa</h2>
      <p className="dash-label max-w-sm mx-auto">
        Quando chegar uma nova mensagem de qualquer canal conectado, ela aparece aqui em tempo real.
      </p>
    </div>
  );
}

function ThreadDetail({ thread }: { thread: Thread }) {
  const def = CHANNELS.find((c) => c.id === thread.channel)!;
  const Icon = def.icon;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2 gap-1.5">
            <Icon className={cn("h-3 w-3", def.color)} />
            {def.label}
          </Badge>
          <h2 className="dash-title">{thread.title}</h2>
          <p className="dash-label mt-1">
            {formatDistanceToNow(new Date(thread.timestamp), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          {thread.fromMe ? <UserIcon className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
          {thread.fromMe ? "Enviado por você" : "Recebido"}
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {thread.body || thread.preview}
        </p>
      </div>

      {thread.href && (
        <Button variant="outline" size="sm" asChild>
          <Link to={thread.href}>Abrir na visão completa</Link>
        </Button>
      )}
    </div>
  );
}
