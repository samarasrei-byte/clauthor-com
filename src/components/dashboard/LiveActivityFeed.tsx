import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CheckCircle2,
  FileText,
  Linkedin,
  MessageSquare,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityEvent {
  id: string;
  user_id: string;
  tenant_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LiveActivityFeedProps {
  tenantId?: string | null;
  userId?: string | null;
  limit?: number;
  className?: string;
}

const EVENT_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }
> = {
  community_post_created: { icon: MessageSquare, label: "Publicação", tone: "text-blue-500" },
  linkedin_post_published: { icon: Linkedin, label: "LinkedIn", tone: "text-sky-500" },
  task_completed: { icon: CheckCircle2, label: "Tarefa concluída", tone: "text-emerald-500" },
  agent_executed: { icon: Zap, label: "Agente executado", tone: "text-amber-500" },
  approval_approved: { icon: ShieldCheck, label: "Aprovado", tone: "text-emerald-500" },
  approval_rejected: { icon: ShieldCheck, label: "Rejeitado", tone: "text-red-500" },
};

const fallback = { icon: FileText, label: "Atividade", tone: "text-muted-foreground" };

export function LiveActivityFeed({
  tenantId,
  userId,
  limit = 30,
  className,
}: LiveActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      let q = supabase
        .from("user_activity_stream")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (tenantId) q = q.eq("tenant_id", tenantId);
      else if (userId) q = q.eq("user_id", userId);

      const { data, error } = await q;
      if (!mounted) return;
      if (!error && data) setEvents(data as ActivityEvent[]);
      setLoading(false);
    };
    load();

    const filter = tenantId
      ? `tenant_id=eq.${tenantId}`
      : userId
        ? `user_id=eq.${userId}`
        : undefined;

    const channel = supabase
      .channel(`activity-stream-${tenantId ?? userId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activity_stream",
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          setEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, limit));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tenantId, userId, limit]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Atividade ao vivo
        </CardTitle>
        <Badge variant="outline" className="gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          AO VIVO
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[420px] px-6 pb-6">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma atividade recente. Assim que algo acontecer, aparecerá aqui.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((ev) => {
                const meta = EVENT_META[ev.event_type] ?? fallback;
                const Icon = meta.icon;
                return (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className={cn("mt-0.5 rounded-md bg-muted p-1.5", meta.tone)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{meta.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ev.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {ev.title && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{ev.title}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LiveActivityFeed;
