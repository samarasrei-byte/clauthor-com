/**
 * ThorTokenAlert · banner proativo do Thor no topo do dashboard quando o
 * consumo de tokens cruzar 80%, 90% ou 100%. Cada patamar aparece apenas
 * UMA vez por ciclo (persistido em `thor_touchpoints`) — depois disso o
 * usuário volta a ver o card apenas no Centro do Thor.
 *
 * Copy explica o impacto ("seus agentes vão parar em ~X dias") e oferece
 * duas ações claras: comprar créditos ou falar com o Thor.
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Coins, ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useThorTouchpoints, type ThorContext } from "@/hooks/useThorTouchpoints";
import { cn } from "@/lib/utils";

interface Props {
  onOpenThor?: () => void;
  onBuyCredits?: () => void;
  className?: string;
}

function levelForPct(pct: number): { key: ThorContext; threshold: number } | null {
  if (pct >= 100) return { key: "token_alert_100", threshold: 100 };
  if (pct >= 90) return { key: "token_alert_90", threshold: 90 };
  if (pct >= 80) return { key: "token_alert_80", threshold: 80 };
  return null;
}

export default function ThorTokenAlert({ onOpenThor, onBuyCredits, className }: Props) {
  const { user, isAdmin } = useAuth();
  const { usagePercentage, remainingCredits, credits } = useCredits();
  const { hasSeen, markSeen } = useThorTouchpoints();

  // Média diária dos últimos 7 dias para estimar impacto
  const { data: avgDaily = 0 } = useQuery({
    queryKey: ["thor-avg-daily-tokens", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const { data } = await supabase
        .from("token_usage")
        .select("tokens_used")
        .eq("user_id", user!.id)
        .gte("created_at", since);
      const total = (data ?? []).reduce((s, r) => s + (r.tokens_used || 0), 0);
      return total / 7;
    },
  });

  const level = useMemo(() => (isAdmin ? null : levelForPct(usagePercentage || 0)), [isAdmin, usagePercentage]);

  if (!user || !level || !credits) return null;
  if (hasSeen(level.key)) return null;

  const daysLeft = avgDaily > 0 && remainingCredits > 0 ? Math.max(0, Math.floor(remainingCredits / avgDaily)) : null;
  const critical = level.threshold >= 100;
  const high = level.threshold >= 90;

  const tone = critical
    ? { border: "border-destructive/50", bg: "from-destructive/15 via-background to-background", icon: "text-destructive", chip: "bg-destructive/15 text-destructive border-destructive/30" }
    : high
      ? { border: "border-amber-500/50", bg: "from-amber-500/10 via-background to-background", icon: "text-amber-500", chip: "bg-amber-500/15 text-amber-500 border-amber-500/30" }
      : { border: "border-primary/40", bg: "from-primary/10 via-background to-background", icon: "text-primary", chip: "bg-primary/15 text-primary border-primary/30" };

  const headline = critical
    ? "Seus agentes acabaram de parar."
    : high
      ? "Seu cofre está no vermelho."
      : "Tô te avisando: já usou 80% do cofre.";

  const impact = critical
    ? "Zerou o saldo — nenhum agente executa até você recarregar. Nenhuma tarefa em fila roda."
    : daysLeft !== null && daysLeft > 0
      ? `No ritmo atual, você tem cerca de ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} antes dos agentes pararem.`
      : "No ritmo atual, você deve zerar o cofre antes do fim do ciclo.";

  const dismissTouch = (ctaTaken: boolean, action: string) => {
    void markSeen(level.key, {
      ctaTaken,
      metadata: {
        threshold: level.threshold,
        usage_pct: Math.round(usagePercentage || 0),
        remaining_credits: remainingCredits,
        avg_daily: Math.round(avgDaily),
        action,
      },
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border p-4 md:p-5 bg-gradient-to-br",
          tone.border,
          tone.bg,
          className,
        )}
      >
        <button
          onClick={() => dismissTouch(false, "dismiss")}
          aria-label="Fechar alerta"
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 bg-background/60", tone.border)}>
            {critical ? <AlertTriangle className={cn("h-5 w-5", tone.icon)} /> : <Coins className={cn("h-5 w-5", tone.icon)} />}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest gap-1 border-primary/40 text-primary">
                <Sparkles className="h-3 w-3" /> Thor · alerta
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest", tone.chip)}>
                {level.threshold}% consumido
              </Badge>
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">{headline}</h3>
              <p className="text-sm text-muted-foreground mt-1">{impact}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => { dismissTouch(true, "buy_credits"); onBuyCredits?.(); }}
                className="gap-2"
              >
                Comprar créditos
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { dismissTouch(true, "open_thor"); onOpenThor?.(); }}
                className="gap-2"
              >
                Falar com o Thor
              </Button>
              <Button size="sm" variant="ghost" onClick={() => dismissTouch(false, "dismiss")}>
                Vou resolver depois
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
