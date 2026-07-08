import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Coins, Plus, X, Sparkles, Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import thorAvatar from "@/assets/thor-hologram.png";

const STORAGE_KEY = "clauthor-thor-daily-greeting";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("pt-BR");
}

export default function ThorDailyGreeting() {
  const { user, isAdmin } = useAuth();
  const { credits, remainingCredits, usagePercentage, isLoading } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Yesterday's activity summary (executions + tokens consumed)
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

  // Compute level once for logging + UI
  const usageLevel: "ok" | "low" | "critical" = isAdmin
    ? "ok"
    : usagePercentage >= 90
      ? "critical"
      : usagePercentage >= 70
        ? "low"
        : "ok";

  // Fire-and-forget analytics event
  const logEvent = async (
    eventType: "impression" | "cta_click" | "dismiss",
    metadata: Record<string, unknown> = {},
  ) => {
    if (!user) return;
    try {
      await supabase.from("thor_greeting_events").insert({
        user_id: user.id,
        event_type: eventType,
        usage_percentage: Number.isFinite(usagePercentage) ? Math.round(usagePercentage) : null,
        remaining_credits: isAdmin ? null : remainingCredits,
        level: usageLevel,
        is_admin: !!isAdmin,
        metadata,
      });
    } catch {
      /* analytics is non-blocking */
    }
  };

  // Trigger once per day per user
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

  // Compose Thor's message dynamically from the user's real balance
  const displayCredits = isAdmin ? Infinity : remainingCredits;
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "guerreiro";

  const message = isAdmin
    ? `Salve, ${firstName}! Como comandante desta plataforma, seus créditos são ilimitados ⚡. Aproveite o dia — os agentes estão prontos para batalhar ao seu comando.`
    : `Salve, ${firstName}! Aqui é o Thor ⚡. Notei que você tem cerca de ${fmt(displayCredits)} tokens no cofre. Se quiser manter a forja acesa sem interrupções, adicione mais tokens hoje mesmo — assim seus agentes seguem forjando resultados sem pausas.`;

  // Typewriter effect
  useEffect(() => {
    if (!open) {
      setTypedText("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTypedText(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [open, message]);

  const handleClose = () => {
    if (user) {
      try {
        localStorage.setItem(`${STORAGE_KEY}-${user.id}`, todayKey());
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const level: "ok" | "low" | "critical" = isAdmin
    ? "ok"
    : usagePercentage >= 90
      ? "critical"
      : usagePercentage >= 70
        ? "low"
        : "ok";

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl">
        {/* Lightning glow background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px]" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-8">
          {/* Thor header */}
          <div className="flex items-start gap-4 mb-5">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
              className="relative shrink-0"
            >
              {/* Halo */}
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_24px_hsl(var(--primary)/0.4)]">
                <img src={thorAvatar} alt="Thor" className="w-full h-full object-cover" />
              </div>
              {/* Online pulse */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background flex items-center justify-center">
                <Zap className="h-2 w-2 text-background" fill="currentColor" />
              </div>
            </motion.div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-display font-bold text-lg">Thor</h2>
                <Badge className="bg-primary/15 text-primary border-0 text-[9px] font-mono px-1.5 py-0">
                  ORQUESTRADOR
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online agora • Recado do dia
              </p>
            </div>
          </div>

          {/* Speech bubble */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-2xl rounded-tl-sm border border-primary/20 bg-card/60 p-4 backdrop-blur-sm"
          >
            <p className="text-sm leading-relaxed text-foreground/90 min-h-[80px]">
              {typedText}
              {typedText.length < message.length && (
                <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          </motion.div>

          {/* Token stats card */}
          <AnimatePresence>
            {typedText.length >= message.length && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-border/40 bg-background/40 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        Seu cofre de tokens
                      </p>
                      <p className="font-display font-bold text-xl">
                        {isAdmin ? "∞" : fmt(remainingCredits)}
                      </p>
                    </div>
                  </div>
                  {!isAdmin && (
                    <Badge
                      className={
                        level === "critical"
                          ? "bg-destructive/15 text-destructive border-0"
                          : level === "low"
                            ? "bg-amber-500/15 text-amber-500 border-0"
                            : "bg-emerald-500/15 text-emerald-500 border-0"
                      }
                    >
                      {level === "critical" ? "🔴 Baixo" : level === "low" ? "🟡 Atenção" : "🟢 OK"}
                    </Badge>
                  )}
                </div>

                {!isAdmin && credits && (
                  <>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Consumido neste ciclo</span>
                      <span className="font-mono">{usagePercentage}%</span>
                    </div>
                    <Progress value={Math.min(100, usagePercentage)} className="h-1.5" />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 mt-1.5">
                      <span>{fmt(credits.used_credits)} usados</span>
                      <span>Limite: {fmt(credits.total_credits)}</span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Yesterday activity summary */}
          <AnimatePresence>
            {typedText.length >= message.length && yesterdaySummary && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 rounded-xl border border-border/30 bg-background/30 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[11px] font-semibold">Resumo de ontem</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(yesterdayRange.startIso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </span>
                </div>
                {yesterdaySummary.total === 0 && yesterdaySummary.tokensUsed === 0 ? (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Nenhuma execução registrada — que tal colocar seus agentes para trabalhar hoje?
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-card/40 border border-border/20 p-2">
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                        <Zap className="h-2.5 w-2.5" />
                        Ações
                      </div>
                      <p className="font-display font-bold text-sm mt-0.5">{yesterdaySummary.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2">
                      <div className="flex items-center gap-1 text-[9px] text-emerald-500 uppercase tracking-wider">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Sucesso
                      </div>
                      <p className="font-display font-bold text-sm mt-0.5">{yesterdaySummary.success}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-2">
                      <div className="flex items-center gap-1 text-[9px] text-destructive uppercase tracking-wider">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Falhas
                      </div>
                      <p className="font-display font-bold text-sm mt-0.5">{yesterdaySummary.errors}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                      <div className="flex items-center gap-1 text-[9px] text-primary uppercase tracking-wider">
                        <Coins className="h-2.5 w-2.5" />
                        Tokens
                      </div>
                      <p className="font-display font-bold text-sm mt-0.5">{fmt(yesterdaySummary.tokensUsed)}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <AnimatePresence>
            {typedText.length >= message.length && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5 flex flex-col sm:flex-row gap-2"
              >
                {!isAdmin && (
                  <Button
                    className="flex-1 gap-1.5 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    onClick={() => {
                      handleClose();
                      navigate("/pricing");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar mais tokens
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={isAdmin ? "flex-1 gap-1.5" : "sm:w-auto gap-1.5"}
                  onClick={handleClose}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isAdmin ? "Continuar" : "Depois"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
