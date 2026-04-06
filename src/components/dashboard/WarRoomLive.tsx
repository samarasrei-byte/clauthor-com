import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Radio, Eye, MessageSquare, FileText, Zap,
  CheckCircle, XCircle, Loader2, Clock, Bot,
  ChevronRight, Users, Activity, Package
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Status helpers ──
const StatusIcon = ({ status }: { status: string }) => {
  if (status === "success") return <CheckCircle className="h-3 w-3 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-3 w-3 text-destructive" />;
  if (status === "running") return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
  return <Clock className="h-3 w-3 text-muted-foreground" />;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const WarRoomLive = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  // ── Live Activity (execution_logs) ──
  const { data: liveActions = [] } = useQuery({
    queryKey: ["warroom-actions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name, tier)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []).map((l: any) => ({
        id: l.id,
        agentName: l.agent?.name || "Agente IA",
        agentTier: l.agent?.tier || "basic",
        action: l.action,
        status: l.status,
        time: l.created_at,
        details: l.details,
        ms: l.execution_time_ms,
      }));
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // ── Squad Conversations (chat_messages) ──
  const { data: squadChats = [] } = useQuery({
    queryKey: ["warroom-chats", user?.id],
    queryFn: async () => {
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user!.id)
        .limit(1)
        .single();
      if (!membership) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("tenant_id", membership.tenant_id)
        .order("created_at", { ascending: false })
        .limit(80);
      return (data || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        agentName: m.agent_name || (m.role === "user" ? "Você" : "Agente"),
        agentTier: m.agent_tier,
        squadId: m.squad_id,
        time: m.created_at,
      }));
    },
    enabled: !!user,
    refetchInterval: 4000,
  });

  // ── Deliverables (agent_reports + tasks done) ──
  const { data: deliverables = [] } = useQuery({
    queryKey: ["warroom-deliverables", user?.id],
    queryFn: async () => {
      const [{ data: reports }, { data: tasks }] = await Promise.all([
        supabase
          .from("agent_reports")
          .select("id, title, report_type, created_at, agent_id")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("agent_tasks")
          .select("id, title, status, category, created_at, assigned_to")
          .eq("user_id", user!.id)
          .eq("status", "done")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const items = [
        ...(reports || []).map((r: any) => ({
          id: r.id, title: r.title, type: "report" as const,
          sub: r.report_type, time: r.created_at,
        })),
        ...(tasks || []).map((t: any) => ({
          id: t.id, title: t.title, type: "task" as const,
          sub: t.category || t.assigned_to || "", time: t.created_at,
        })),
      ];
      return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!user) return;
    const ch1 = supabase
      .channel("warroom-exec")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "execution_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["warroom-actions"] });
      })
      .subscribe();

    const ch2 = supabase
      .channel("warroom-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["warroom-chats"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [user, queryClient]);

  // ── Stats + Anomaly Detection ──
  const stats = useMemo(() => {
    const running = liveActions.filter(a => a.status === "running").length;
    const last1h = liveActions.filter(a => Date.now() - new Date(a.time).getTime() < 3_600_000).length;
    const errors = liveActions.filter(a => a.status === "error").length;
    const convos = new Set(squadChats.filter(c => c.role === "assistant").map(c => c.agentName)).size;

    // Anomaly: error spike detection (>30% error rate in last hour)
    const last1hActions = liveActions.filter(a => Date.now() - new Date(a.time).getTime() < 3_600_000);
    const last1hErrors = last1hActions.filter(a => a.status === "error").length;
    const errorRateLastHour = last1hActions.length > 0 ? Math.round((last1hErrors / last1hActions.length) * 100) : 0;
    const hasErrorSpike = errorRateLastHour > 30 && last1hErrors >= 3;

    // Anomaly: slowdown detection (avg ms > 2x overall avg)
    const withMs = liveActions.filter(a => a.ms && a.ms > 0);
    const overallAvgMs = withMs.length > 0 ? withMs.reduce((s, a) => s + a.ms, 0) / withMs.length : 0;
    const last1hWithMs = last1hActions.filter(a => a.ms && a.ms > 0);
    const last1hAvgMs = last1hWithMs.length > 0 ? last1hWithMs.reduce((s, a) => s + a.ms, 0) / last1hWithMs.length : 0;
    const hasSlowdown = overallAvgMs > 0 && last1hAvgMs > overallAvgMs * 2 && last1hWithMs.length >= 3;

    // Top error agents
    const errorByAgent = new Map<string, number>();
    liveActions.filter(a => a.status === "error").forEach(a => {
      errorByAgent.set(a.agentName, (errorByAgent.get(a.agentName) || 0) + 1);
    });
    const topErrorAgent = [...errorByAgent.entries()].sort((a, b) => b[1] - a[1])[0];

    return { running, last1h, errors, convos, errorRateLastHour, hasErrorSpike, hasSlowdown, topErrorAgent };
  }, [liveActions, squadChats]);

  // ── Unified feed ──
  const allFeed = useMemo(() => {
    const items = [
      ...liveActions.map(a => ({ ...a, feedType: "action" as const })),
      ...squadChats.filter(c => c.role === "assistant").map(c => ({
        id: c.id, agentName: c.agentName, action: "chat",
        status: "success", time: c.time, feedType: "chat" as const,
        content: c.content,
      })),
      ...deliverables.map(d => ({
        id: d.id, agentName: d.sub || "Agente", action: d.type,
        status: "success", time: d.time, feedType: "deliverable" as const,
        title: d.title,
      })),
    ];
    return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 60);
  }, [liveActions, squadChats, deliverables]);

  const filteredFeed = activeTab === "all" ? allFeed
    : allFeed.filter(f => f.feedType === activeTab);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Radio className="h-5 w-5 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">War Room Live</h2>
          <p className="text-xs text-muted-foreground">Monitoramento em tempo real de toda a operação</p>
        </div>
      </div>

      {/* Anomaly Alerts */}
      {(stats.hasErrorSpike || stats.hasSlowdown) && (
        <div className="space-y-2">
          {stats.hasErrorSpike && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-destructive">⚠️ Spike de erros detectado</p>
                <p className="text-[10px] text-muted-foreground">
                  {stats.errorRateLastHour}% taxa de erro na última hora
                  {stats.topErrorAgent && ` · Agente mais afetado: ${stats.topErrorAgent[0]} (${stats.topErrorAgent[1]} erros)`}
                </p>
              </div>
            </motion.div>
          )}
          {stats.hasSlowdown && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-400">🐌 Lentidão detectada</p>
                <p className="text-[10px] text-muted-foreground">Tempo médio de execução 2x acima do normal na última hora</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Executando", value: stats.running, icon: Loader2, pulse: stats.running > 0 },
          { label: "Última 1h", value: stats.last1h, icon: Activity },
          { label: "Erros", value: stats.errors, icon: XCircle, alert: stats.errors > 0 },
          { label: "Agentes falando", value: stats.convos, icon: Users },
        ].map((kpi) => (
          <Card key={kpi.label} className={cn(
            "p-3 border-border/50 bg-card/50 backdrop-blur-sm",
            kpi.alert && "border-destructive/40",
            kpi.pulse && "border-primary/40",
          )}>
            <div className="flex items-center gap-2">
              <kpi.icon className={cn(
                "h-3.5 w-3.5",
                kpi.alert ? "text-destructive" : kpi.pulse ? "text-primary animate-spin" : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="all" className="text-xs gap-1">
            <Activity className="h-3 w-3" /> Tudo
          </TabsTrigger>
          <TabsTrigger value="action" className="text-xs gap-1">
            <Zap className="h-3 w-3" /> Ações
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs gap-1">
            <MessageSquare className="h-3 w-3" /> Conversas
          </TabsTrigger>
          <TabsTrigger value="deliverable" className="text-xs gap-1">
            <Package className="h-3 w-3" /> Entregas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feed */}
      <ScrollArea className="h-[calc(100vh-22rem)]">
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {filteredFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <div className={cn(
                  "flex items-start gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted/30",
                  item.feedType === "chat" && "bg-primary/[0.03]",
                  item.feedType === "deliverable" && "bg-accent/[0.03]",
                )}>
                  {/* Type indicator */}
                  <div className={cn(
                    "mt-0.5 h-7 w-7 rounded-md flex items-center justify-center shrink-0",
                    item.feedType === "action" && "bg-primary/10",
                    item.feedType === "chat" && "bg-blue-500/10",
                    item.feedType === "deliverable" && "bg-amber-500/10",
                  )}>
                    {item.feedType === "action" && <Zap className="h-3.5 w-3.5 text-primary" />}
                    {item.feedType === "chat" && <MessageSquare className="h-3.5 w-3.5 text-blue-400" />}
                    {item.feedType === "deliverable" && <Package className="h-3.5 w-3.5 text-amber-400" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.agentName}
                      </span>
                      <StatusIcon status={item.status} />
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {timeAgo(item.time)}
                      </span>
                    </div>

                    {item.feedType === "chat" && (item as any).content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {(item as any).content}
                      </p>
                    )}

                    {item.feedType === "action" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.action?.replace(/_/g, " ")}
                      </p>
                    )}

                    {item.feedType === "deliverable" && (item as any).title && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        📦 {(item as any).title}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredFeed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Quando seus agentes começarem a trabalhar, você verá tudo aqui em tempo real
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WarRoomLive;
