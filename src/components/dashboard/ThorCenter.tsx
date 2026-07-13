/**
 * ThorCenter · seção "Centro do Thor" no dashboard, que consolida:
 *  1. Histórico de recomendações e boas-vindas do Thor (thor_touchpoints)
 *  2. Alertas de tokens (notifications type=token_limit_*)
 *  3. Atalhos para ações pendentes (approvals + ambient_signals)
 *
 * Objetivo: o cliente nunca fica sem saber o que o Thor já falou com ele
 * e sempre encontra os próximos passos concretos num único lugar.
 */
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Brain, Bell, Sparkles, ArrowRight, CheckCircle2, AlertTriangle,
  Coins, Radar, Inbox, ExternalLink, Clock, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useThorTouchpoints } from "@/hooks/useThorTouchpoints";
import { cn } from "@/lib/utils";

interface Props {
  onNavigate?: (section: string) => void;
}

const CONTEXT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  first_touch_dashboard: { label: "Boas-vindas do Thor", icon: <Sparkles className="h-3.5 w-3.5" /> },
  token_alert_80:        { label: "Alerta de tokens (80%)", icon: <Coins className="h-3.5 w-3.5" /> },
  token_alert_90:        { label: "Alerta de tokens (90%)", icon: <Coins className="h-3.5 w-3.5" /> },
  token_alert_100:       { label: "Cofre zerado", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  consultant_recommendation: { label: "Recomendação do Thor consultor", icon: <Brain className="h-3.5 w-3.5" /> },
  ambient_high_severity: { label: "Sinal ambiente crítico", icon: <Radar className="h-3.5 w-3.5" /> },
};

function relativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch { return ""; }
}

type Period = "24h" | "7d" | "30d" | "all";
const PERIOD_MS: Record<Period, number | null> = {
  "24h": 24 * 3600 * 1000,
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
  all: null,
};
const PERIOD_LABEL: Record<Period, string> = { "24h": "24h", "7d": "7 dias", "30d": "30 dias", all: "Tudo" };

const PERIOD_STORAGE_KEY = "clauthor-thor-center-period";

export default function ThorCenter({ onNavigate }: Props) {
  const { user } = useAuth();
  const { touchpoints, isLoading } = useThorTouchpoints();
  const qc = useQueryClient();
  const [period, setPeriodState] = useState<Period>(() => {
    if (typeof window === "undefined") return "30d";
    const saved = localStorage.getItem(PERIOD_STORAGE_KEY);
    return (saved && (saved in PERIOD_MS) ? saved : "30d") as Period;
  });
  const setPeriod = (p: Period) => {
    setPeriodState(p);
    try { localStorage.setItem(PERIOD_STORAGE_KEY, p); } catch { /* ignore */ }
  };

  // Realtime: mantém timeline e atalhos vivos quando o Thor registra algo novo
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`thor-center-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "thor_touchpoints", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["thor-touchpoints", user.id] }))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["thor-center-token-alerts", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals", filter: `created_by=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["thor-center-approvals", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "ambient_signals", filter: `created_by=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["thor-center-ambient", user.id] }))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  // Notificações de token (últimas 10)
  const { data: tokenAlerts = [] } = useQuery({
    queryKey: ["thor-center-token-alerts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, message, created_at, metadata")
        .eq("user_id", user!.id)
        .like("type", "token_limit_%")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as Array<{ id: string; type: string; title: string; message: string; created_at: string; metadata: Record<string, unknown> | null }>;
    },
  });

  // Aprovações pendentes (contagem + últimas 5)
  const { data: pendingApprovals = { count: 0, items: [] as Array<{ id: string; title: string; created_at: string }> } } = useQuery({
    queryKey: ["thor-center-approvals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ count }, { data: items }] = await Promise.all([
        supabase
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user!.id)
          .eq("status", "pending"),
        supabase
          .from("approvals")
          .select("id, title, created_at")
          .eq("created_by", user!.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return { count: count ?? 0, items: (items ?? []) as Array<{ id: string; title: string; created_at: string }> };
    },
  });

  // Sinais ambient de alta severidade
  const { data: ambientSignals = [] } = useQuery({
    queryKey: ["thor-center-ambient", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ambient_signals")
        .select("id, kind, title, severity, created_at, status")
        .eq("created_by", user!.id)
        .in("severity", ["high", "critical"])
        .neq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as Array<{ id: string; kind: string; title: string; severity: string; created_at: string }>;
    },
  });


  const timeline = useMemo(() => {
    // Une histórico do Thor + alertas de token num único stream ordenado
    const fromTouchpoints = touchpoints.map((tp) => ({
      key: `tp-${tp.id}`,
      when: tp.seen_at,
      context: tp.context,
      title: CONTEXT_LABELS[tp.context]?.label ?? tp.context,
      icon: CONTEXT_LABELS[tp.context]?.icon ?? <Brain className="h-3.5 w-3.5" />,
      ctaTaken: tp.cta_taken,
      metadata: tp.metadata,
      kind: "touchpoint" as const,
    }));
    const fromAlerts = tokenAlerts.map((n) => ({
      key: `n-${n.id}`,
      when: n.created_at,
      context: n.type,
      title: n.title,
      icon: <Coins className="h-3.5 w-3.5" />,
      ctaTaken: false,
      metadata: n.metadata ?? {},
      kind: "notification" as const,
      message: n.message,
    }));
    const merged = [...fromTouchpoints, ...fromAlerts].sort((a, b) => b.when.localeCompare(a.when));
    const cutoff = PERIOD_MS[period];
    if (cutoff == null) return merged.slice(0, 40);
    const min = Date.now() - cutoff;
    return merged.filter((e) => new Date(e.when).getTime() >= min).slice(0, 40);
  }, [touchpoints, tokenAlerts, period]);

  const resolveSignal = async (signalId: string) => {
    const { error } = await supabase
      .from("ambient_signals")
      .update({ status: "resolved" })
      .eq("id", signalId);
    if (error) {
      toast.error("Não consegui marcar como resolvido.");
      return;
    }
    toast.success("Marcado como resolvido.");
    qc.invalidateQueries({ queryKey: ["thor-center-ambient", user?.id] });
  };

  const resolveApproval = async (approvalId: string) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("approvals")
      .update({ status: "approved", approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", approvalId)
      .eq("status", "pending");
    if (error) {
      toast.error("Não consegui marcar como resolvido.");
      return;
    }
    toast.success("Aprovação marcada como resolvida.", {
      description: "Some do Thor Center. Você pode revisar em Aprovações se precisar.",
      action: { label: "Desfazer", onClick: async () => {
        await supabase.from("approvals")
          .update({ status: "pending", approved_by: null, approved_at: null })
          .eq("id", approvalId);
        qc.invalidateQueries({ queryKey: ["thor-center-approvals", user.id] });
      }},
    });
    qc.invalidateQueries({ queryKey: ["thor-center-approvals", user.id] });
  };

  // Contagens por tipo dentro do período ativo (para mostrar no header/quick actions)
  const periodCounts = useMemo(() => {
    const cutoff = PERIOD_MS[period];
    const min = cutoff ? Date.now() - cutoff : 0;
    const inPeriod = (iso: string) => (cutoff == null ? true : new Date(iso).getTime() >= min);
    return {
      touchpoints: touchpoints.filter((t) => inPeriod(t.seen_at)).length,
      tokenAlerts: tokenAlerts.filter((n) => inPeriod(n.created_at)).length,
      approvals: pendingApprovals.items.filter((a) => inPeriod(a.created_at)).length,
      ambient: ambientSignals.filter((s) => inPeriod(s.created_at)).length,
    };
  }, [period, touchpoints, tokenAlerts, pendingApprovals.items, ambientSignals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-2xl leading-tight">Centro do Thor</h1>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/40 text-primary">
              seu copiloto
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Tudo que o Thor te avisou, recomendou e o que ainda espera decisão sua — num só lugar.
            Sempre que eu chegar aqui é porque tem impacto real na sua operação.
          </p>
        </div>
      </motion.div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickAction
          icon={<Inbox className="h-4 w-4 text-primary" />}
          label="Aprovações pendentes"
          value={pendingApprovals.count}
          periodValue={periodCounts.approvals}
          periodLabel={PERIOD_LABEL[period]}
          hint={pendingApprovals.count === 0 ? "Nada te esperando ✨" : "Requer sua decisão"}
          onClick={() => onNavigate?.("approvals")}
        />
        <QuickAction
          icon={<Bell className="h-4 w-4 text-amber-500" />}
          label="Alertas de tokens"
          value={tokenAlerts.length}
          periodValue={periodCounts.tokenAlerts}
          periodLabel={PERIOD_LABEL[period]}
          hint={tokenAlerts.length === 0 ? "Consumo saudável" : "Confira o histórico abaixo"}
          onClick={() => onNavigate?.("system")}
        />
        <QuickAction
          icon={<Radar className="h-4 w-4 text-destructive" />}
          label="Sinais críticos"
          value={ambientSignals.length}
          periodValue={periodCounts.ambient}
          periodLabel={PERIOD_LABEL[period]}
          hint={ambientSignals.length === 0 ? "Nada urgente" : "Detectados pelo Thor"}
          onClick={() => onNavigate?.("overview")}
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Histórico de conversas com o Thor
            </CardTitle>
            <div className="flex gap-1">
              {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "text-[11px] px-2 py-1 rounded-md border transition-colors",
                    period === p
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted/40",
                  )}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : timeline.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {period === "all"
                  ? "O Thor ainda não precisou te alertar. Bom sinal — sua operação está saudável."
                  : `Nada registrado nas últimas ${PERIOD_LABEL[period].toLowerCase()}. Amplie o filtro se quiser ver mais.`}
              </div>
            ) : (
              <ScrollArea className="max-h-[440px] pr-2">
                <ol className="relative border-l border-border/60 ml-2 space-y-4">
                  {timeline.map((ev) => (
                    <li key={ev.key} className="ml-4">
                      <span className="absolute -left-[7px] mt-1.5 flex h-3 w-3 rounded-full bg-primary/70 ring-2 ring-background" />
                      <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">{ev.icon}{ev.title}</span>
                          <span>·</span>
                          <span>{relativeDate(ev.when)}</span>
                          {ev.kind === "touchpoint" && ev.ctaTaken && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" /> agiu
                            </Badge>
                          )}
                        </div>
                        {ev.kind === "notification" && (
                          <p className="text-sm mt-1.5">{ev.message}</p>
                        )}
                        {ev.kind === "touchpoint" && ev.metadata && Object.keys(ev.metadata).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {formatMetadata(ev.context, ev.metadata as Record<string, unknown>)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Ações pendentes (1/3) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                Precisam de você
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingApprovals.items.length === 0 && ambientSignals.length === 0 && (
                <p className="text-sm text-muted-foreground">Nada pendente. Aproveita o café ☕</p>
              )}
              {pendingApprovals.items.map((a) => (
                <div
                  key={a.id}
                  className="w-full rounded-lg border border-border/50 bg-background/40 p-2.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate?.("approvals")}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-medium truncate">{a.title || "Aprovação pendente"}</p>
                      <p className="text-[11px] text-muted-foreground">{relativeDate(a.created_at)}</p>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title="Marcar como resolvido"
                      onClick={(e) => { e.stopPropagation(); void resolveApproval(a.id); }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
              {ambientSignals.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-lg border p-2.5",
                    s.severity === "critical" ? "border-destructive/40 bg-destructive/5" : "border-amber-500/30 bg-amber-500/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", s.severity === "critical" ? "text-destructive" : "text-amber-500")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{relativeDate(s.created_at)}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title="Marcar como resolvido"
                      onClick={() => resolveSignal(s.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Falar com o Thor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Precisa de análise, quer criar mais um agente ou tem dúvida do que fazer? Abre uma conversa.
              </p>
              <Button className="w-full gap-2" onClick={() => onNavigate?.("omnix")}>
                Abrir o Thor
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon, label, value, hint, onClick, periodValue, periodLabel,
}: {
  icon: React.ReactNode; label: string; value: number; hint: string; onClick?: () => void;
  periodValue?: number; periodLabel?: string;
}) {
  const showPeriodChip = typeof periodValue === "number" && !!periodLabel && periodLabel !== "Tudo";
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border/60 bg-card/60 p-4 text-left hover:border-primary/40 hover:bg-card transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          {icon} {label}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <p className="font-display font-bold text-3xl mt-2 leading-none">{value}</p>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">{hint}</p>
        {showPeriodChip && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary/80">
            {periodValue} nas últimas {periodLabel!.toLowerCase()}
          </Badge>
        )}
      </div>
    </button>
  );
}

function formatMetadata(context: string, md: Record<string, unknown>): string {
  if (context.startsWith("token_alert_")) {
    const pct = md.usage_pct ?? md.threshold;
    const days = md.avg_daily ? Math.round(Number(md.avg_daily)) : null;
    return `Consumo em ${pct}%${days ? ` · média de ${days} tokens/dia` : ""}`;
  }
  if (context === "first_touch_dashboard") {
    const names = (md.department_names as string[] | undefined) || [];
    if (names.length) return `Departamentos ativos: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}`;
  }
  return "";
}
