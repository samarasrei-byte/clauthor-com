import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Inbox,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "all" | "revision" | "approved" | "unread";

interface MediaNotif {
  id: string;
  created_at: string;
  is_read: boolean;
  title: string;
  message: string;
  type: string;
  metadata: {
    approval_id?: string;
    media_id?: string;
    media_kind?: "video" | "image";
    media_url?: string | null;
    networks?: string[];
    decision?: "approve" | "reject";
  } | null;
}

const RELEVANT_TYPES = ["media_approved", "media_revision_requested"];

export default function AgentInbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["agent-inbox", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, created_at, is_read, title, message, type, metadata")
        .eq("user_id", user!.id)
        .in("type", RELEVANT_TYPES)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MediaNotif[];
    },
    refetchInterval: 20_000,
  });

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === "unread") return !n.is_read;
      if (filter === "revision") return n.type === "media_revision_requested";
      if (filter === "approved") return n.type === "media_approved";
      return true;
    });
  }, [items, filter]);

  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((n) => !n.is_read).length,
      revision: items.filter((n) => n.type === "media_revision_requested").length,
      approved: items.filter((n) => n.type === "media_approved").length,
    }),
    [items],
  );

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-inbox", user?.id] });
    },
  });

  const handleSelect = (n: MediaNotif) => {
    setSelectedId(n.id);
    if (!n.is_read) markRead.mutate([n.id]);
  };

  const markAllRead = () => {
    const ids = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) {
      toast.info("Não há notificações não lidas.");
      return;
    }
    markRead.mutate(ids, {
      onSuccess: () => toast.success(`${ids.length} notificações marcadas como lidas`),
    });
  };

  return (
    <>
      <Helmet>
        <title>Inbox do Agente · Clauthor</title>
        <meta
          name="description"
          content="Central de aprovações e feedback do cliente para os agentes"
        />
      </Helmet>

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Inbox className="h-6 w-6 text-primary" />
              Inbox do Agente
            </h1>
            <p className="text-sm text-muted-foreground">
              Decisões e feedback do cliente sobre entregas de mídia
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={markRead.isPending || counts.unread === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar tudo como lido
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">
              Todas <Badge variant="secondary" className="ml-2">{counts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Não lidas <Badge variant="secondary" className="ml-2">{counts.unread}</Badge>
            </TabsTrigger>
            <TabsTrigger value="revision">
              Ajustes <Badge variant="secondary" className="ml-2">{counts.revision}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovados <Badge variant="secondary" className="ml-2">{counts.approved}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Split view */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[560px]">
          {/* List */}
          <Card className="p-0 overflow-hidden">
            <ScrollArea className="h-[560px]">
              {isLoading ? (
                <div className="p-6 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando…
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="divide-y">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => handleSelect(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                          selected?.id === n.id && "bg-muted",
                          !n.is_read && "font-medium",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <MediaIcon kind={n.metadata?.media_kind} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm">{n.title}</p>
                              {!n.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(n.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </Card>

          {/* Detail */}
          <Card className="p-6">
            {selected ? (
              <DetailPanel item={selected} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Selecione uma notificação
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function MediaIcon({ kind }: { kind?: "video" | "image" }) {
  if (kind === "video") return <VideoIcon className="h-4 w-4 text-primary mt-0.5" />;
  if (kind === "image") return <ImageIcon className="h-4 w-4 text-primary mt-0.5" />;
  return <Sparkles className="h-4 w-4 text-primary mt-0.5" />;
}

function EmptyState() {
  return (
    <div className="p-10 text-center text-sm text-muted-foreground space-y-2">
      <Inbox className="h-8 w-8 mx-auto opacity-40" />
      <p>Nenhuma notificação por aqui.</p>
      <p className="text-xs">
        Assim que o cliente aprovar ou pedir ajuste em uma entrega, você verá aqui.
      </p>
    </div>
  );
}

function DetailPanel({ item }: { item: MediaNotif }) {
  const isRevision = item.type === "media_revision_requested";
  const meta = item.metadata ?? {};
  const networks = meta.networks ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Badge variant={isRevision ? "destructive" : "default"} className="mb-2">
          {isRevision ? "Ajuste solicitado" : "Aprovado pelo cliente"}
        </Badge>
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(item.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>

      {/* Preview */}
      {meta.media_url && (
        <div className="rounded-lg overflow-hidden border bg-muted/30 max-h-80">
          {meta.media_kind === "video" ? (
            <video src={meta.media_url} controls className="w-full max-h-80" />
          ) : (
            <img
              src={meta.media_url}
              alt={item.title}
              className="w-full max-h-80 object-contain"
            />
          )}
        </div>
      )}

      {/* Message */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          Feedback do cliente
        </div>
        <p className="text-sm whitespace-pre-wrap">{item.message}</p>
      </div>

      {/* Networks */}
      {networks.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Redes selecionadas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {networks.map((n) => (
              <Badge key={n} variant="outline">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {meta.approval_id && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/dashboard?approval=${meta.approval_id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir na Central de Aprovações
            </a>
          </Button>
        )}
        {isRevision && meta.media_kind === "video" && (
          <Button size="sm" asChild>
            <a href="/video-studio">Refazer no Studio</a>
          </Button>
        )}
        {!isRevision && (
          <Button size="sm" asChild>
            <a href="/settings/social">Configurar publicação</a>
          </Button>
        )}
      </div>
    </div>
  );
}
