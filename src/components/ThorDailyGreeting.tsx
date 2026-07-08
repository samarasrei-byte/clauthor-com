import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Coins,
  Plus,
  X,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Flame,
  CalendarClock,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "clauthor-thor-daily-greeting";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("pt-BR");
}

export default function ThorDailyGreeting() {
  const { user, isAdmin } = useAuth();
  const { credits, remainingCredits, usagePercentage, isLoading } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Yesterday range for activity summary
  const yesterdayRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }, []);

  const { data: yesterdaySummary } = useQuery({
    queryKey: ["thor-yesterday-summary", user?.id, yesterdayRange.startIso],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const [{ data: logs }, { data: tokens }] = await Promise.all([
        supabase
          .from("execution_logs")
          .select("status")
          .eq("user_id", user!.id)
          .gte("created_at", yesterdayRange.startIso)
          .lt("created_at", yesterdayRange.endIso),
        supabase
          .from("token_usage")
          .select("tokens_used")
          .eq("user_id", user!.id)
          .gte("created_at", yesterdayRange.startIso)
          .lt("created_at", yesterdayRange.endIso),
      ]);
      const total = logs?.length ?? 0;
      const success = logs?.filter((l) => l.status === "success").length ?? 0;
      const errors = total - success;
      const tokensUsed = (tokens ?? []).reduce((s, t) => s + (t.tokens_used || 0), 0);
      return { total, success, errors, tokensUsed };
    },
  });

  const usageLevel: "ok" | "low" | "critical" = isAdmin
    ? "ok"
    : usagePercentage >= 90
      ? "critical"
      : usagePercentage >= 70
        ? "low"
        : "ok";

  // Analytics (non-blocking)
  const logEvent = async (
    eventType: "impression" | "cta_click" | "dismiss",
    metadata: Record<string, unknown> = {},
  ) => {
    if (!user) return;
    try {
      await supabase.from("thor_greeting_events").insert([{
        user_id: user.id,
        event_type: eventType,
        usage_percentage: Number.isFinite(usagePercentage) ? Math.round(usagePercentage) : null,
        remaining_credits: isAdmin ? null : remainingCredits,
        level: usageLevel,
        is_admin: !!isAdmin,
        metadata: metadata as never,
      }]);
    } catch {
      /* ignore */
    }
  };

  // Show once per day
  useEffect(() => {
    if (!user || isLoading) return;
    if (typeof window === "undefined") return;

    const key = `${STORAGE_KEY}-${user.id}`;
    const lastSeen = localStorage.getItem(key);
    if (lastSeen === todayKey()) return;

    const t = setTimeout(() => {
      setOpen(true);
      logEvent("impression");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const handleClose = (reason: "dismiss" | "cta_click" = "dismiss") => {
    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}-${user.id}`, todayKey());
      } catch {
        /* ignore */
      }
    }
    void logEvent(reason);
    setOpen(false);
  };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "guerreiro";
  const totalCredits = credits?.total_credits ?? 0;
  const usedCredits = credits?.used_credits ?? 0;

  // Level meta
  const levelMeta =
    usageLevel === "critical"
      ? {
          label: "Crítico",
          dot: "bg-destructive",
          ring: "ring-destructive/40",
          text: "text-destructive",
          chip: "bg-destructive/10 text-destructive border-destructive/20",
        }
      : usageLevel === "low"
        ? {
            label: "Atenção",
            dot: "bg-amber-400",
            ring: "ring-amber-400/40",
            text: "text-amber-400",
            chip: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          }
        : {
            label: "Saudável",
            dot: "bg-emerald-400",
            ring: "ring-emerald-400/40",
            text: "text-emerald-400",
            chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          };

  const headline = isAdmin
    ? `Bom dia, ${firstName}.`
    : usageLevel === "critical"
      ? `${firstName}, seu cofre está no limite.`
      : usageLevel === "low"
        ? `${firstName}, hora de reabastecer.`
        : `Bom dia, ${firstName}.`;

  const subtitle = isAdmin
    ? "Você tem acesso ilimitado — a forja segue acesa."
    : `${fmt(remainingCredits)} tokens disponíveis no seu cofre.`;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose("dismiss"))}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-border/60 bg-card/95 backdrop-blur-2xl shadow-2xl rounded-2xl"
      >
        {/* Ambient gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className="absolute -top-32 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        {/* Close */}
        <button
          onClick={() => handleClose("dismiss")}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase tracking-widest gap-1 border-border/60"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                Briefing diário
              </Badge>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${levelMeta.dot}`} />
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl tracking-tight leading-tight">
              {headline}
            </h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </motion.div>

          {/* Token card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative rounded-xl border border-border/50 bg-gradient-to-br from-background/60 to-background/20 p-4 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ${levelMeta.ring}`}>
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Cofre de tokens
                  </p>
                  <p className="font-display font-bold text-2xl leading-none mt-0.5">
                    {isAdmin ? "∞" : fmt(remainingCredits)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${levelMeta.chip}`}>
                {levelMeta.label}
              </Badge>
            </div>

            {!isAdmin && credits && totalCredits > 0 && (
              <>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Consumido neste ciclo</span>
                  <span className={`font-mono font-semibold ${levelMeta.text}`}>
                    {Math.round(usagePercentage)}%
                  </span>
                </div>
                <Progress value={Math.min(100, usagePercentage)} className="h-1.5" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mt-2">
                  <span>{fmt(usedCredits)} usados</span>
                  <span>Limite: {fmt(totalCredits)}</span>
                </div>
              </>
            )}

            {isAdmin && (
              <p className="text-[11px] text-muted-foreground">
                Acesso ilimitado — nenhum limite de consumo aplicado à sua conta.
              </p>
            )}
          </motion.div>

          {/* Yesterday summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/40 bg-background/30 p-3"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <p className="text-[11px] font-semibold">Resumo de ontem</p>
              <span className="text-[10px] text-muted-foreground ml-auto capitalize">
                {new Date(yesterdayRange.startIso).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>

            {!yesterdaySummary ? (
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : yesterdaySummary.total === 0 && yesterdaySummary.tokensUsed === 0 ? (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 py-1">
                <Clock className="h-3 w-3" />
                Nenhuma execução registrada — comece o dia com um agente.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <MiniStat
                  icon={<Zap className="h-3 w-3" />}
                  label="Ações"
                  value={yesterdaySummary.total}
                />
                <MiniStat
                  icon={<CheckCircle2 className="h-3 w-3" />}
                  label="Sucesso"
                  value={yesterdaySummary.success}
                  tone="emerald"
                />
                <MiniStat
                  icon={<AlertTriangle className="h-3 w-3" />}
                  label="Falhas"
                  value={yesterdaySummary.errors}
                  tone={yesterdaySummary.errors > 0 ? "destructive" : "muted"}
                />
                <MiniStat
                  icon={<Coins className="h-3 w-3" />}
                  label="Tokens"
                  value={fmt(yesterdaySummary.tokensUsed)}
                  tone="primary"
                />
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-2"
          >
            {!isAdmin && (
              <Button
                className="flex-1 gap-1.5"
                onClick={() => {
                  handleClose("cta_click");
                  navigate("/pricing");
                }}
              >
                <Plus className="h-4 w-4" />
                Adicionar tokens
              </Button>
            )}
            <Button
              variant={isAdmin ? "default" : "outline"}
              className={isAdmin ? "flex-1 gap-1.5" : "sm:w-auto gap-1.5"}
              onClick={() => handleClose("dismiss")}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {isAdmin ? "Ver operações" : "Continuar"}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "muted" | "emerald" | "destructive" | "primary";
}) {
  const toneMap = {
    muted: "border-border/30 bg-card/40 text-foreground",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
    destructive: "border-destructive/20 bg-destructive/5 text-destructive",
    primary: "border-primary/20 bg-primary/5 text-primary",
  } as const;

  return (
    <div className={`rounded-lg border p-2 ${toneMap[tone]}`}>
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <p className="font-display font-bold text-sm mt-0.5 text-foreground">{value}</p>
    </div>
  );
}
