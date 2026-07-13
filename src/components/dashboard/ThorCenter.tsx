/**
 * ThorCenter · seção "Centro do Thor" no dashboard, que consolida:
 *  1. Histórico de recomendações e boas-vindas do Thor (thor_touchpoints)
 *  2. Alertas de tokens (notifications type=token_limit_*)
 *  3. Atalhos para ações pendentes (approvals + ambient_signals)
 *
 * Objetivo: o cliente nunca fica sem saber o que o Thor já falou com ele
 * e sempre encontra os próximos passos concretos num único lugar.
 */
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Brain, Bell, Sparkles, ArrowRight, CheckCircle2, AlertTriangle,
  Coins, Radar, Inbox, ExternalLink, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
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

export default function ThorCenter({ onNavigate }: Props) {
  const { user } = useAuth();
  const { touchpoints, isLoading } = useThorTouchpoints();

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
    return [...fromTouchpoints, ...fromAlerts].sort((a, b) => b.when.localeCompare(a.when)).slice(0, 20);
  }, [touchpoints, tokenAlerts]);

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
          hint={pendingApprovals.count === 0 ? "Nada te esperando ✨" : "Requer sua decisão"}
          onClick={() => onNavigate?.("approvals")}
        />
        <QuickAction
          icon={<Bell className="h-4 w-4 text-amber-500" />}
          label="Alertas de tokens"
          value={tokenAlerts.length}
          hint={tokenAlerts.length === 0 ? "Consumo saudável" : "Confira o histórico abaixo"}
          onClick={() => onNavigate?.("system")}
        />
        <QuickAction
          icon={<Radar className="h-4 w-4 text-destructive" />}
          label="Sinais críticos"
          value={ambientSignals.length}
          hint={ambientSignals.length === 0 ? "Nada urgente" : "Detectados pelo Thor"}
          onClick={() => onNavigate?.("overview")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Histórico de conversas com o Thor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : timeline.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                O Thor ainda não precisou te alertar. Bom sinal — sua operação está saudável.
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
                <button
                  key={a.id}
                  onClick={() => onNavigate?.("approvals")}
                  className="w-full text-left rounded-lg border border-border/50 bg-background/40 p-2.5 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title || "Aprovação pendente"}</p>
                      <p className="text-[11px] text-muted-foreground">{relativeDate(a.created_at)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
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
                    <AlertTriangle className={cn("h-4 w-4 mt-0.5", s.severity === "critical" ? "text-destructive" : "text-amber-500")} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{relativeDate(s.created_at)}</p>
                    </div>
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
  icon, label, value, hint, onClick,
}: { icon: React.ReactNode; label: string; value: number; hint: string; onClick?: () => void }) {
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
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
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
