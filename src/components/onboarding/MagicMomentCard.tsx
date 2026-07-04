import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, BarChart3, ArrowRight, X, Clock } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MagicMomentCardProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToApprovals: () => void;
  agentName?: string;
}

const SIGNUP_TS_KEY = "clauthor_signup_ts";

/**
 * Magic Moment 60s — first visible value delivered right after onboarding.
 * Shows 3 ready-to-approve deliverables and tracks time_to_first_value.
 */
const MagicMomentCard = ({ isOpen, onClose, onGoToApprovals, agentName }: MagicMomentCardProps) => {
  const { user } = useAuth();

  const elapsedSeconds = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const raw = localStorage.getItem(SIGNUP_TS_KEY);
    if (!raw) return 0;
    const start = Number(raw);
    if (!Number.isFinite(start)) return 0;
    return Math.max(0, Math.round((Date.now() - start) / 1000));
  }, [isOpen]);

  // Telemetry — record time_to_first_value once when card opens
  useEffect(() => {
    if (!isOpen || !user) return;
    const flagKey = `clauthor_ttfv_logged_${user.id}`;
    if (localStorage.getItem(flagKey)) return;
    localStorage.setItem(flagKey, "1");

    supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "time_to_first_value",
        title: "Magic Moment alcançado",
        message: `Primeiro valor entregue em ${elapsedSeconds}s`,
        metadata: {
          seconds: elapsedSeconds,
          agent: agentName ?? null,
          under_60s: elapsedSeconds > 0 && elapsedSeconds <= 60,
        },
      } as never)
      .then(() => undefined);
  }, [isOpen, user, elapsedSeconds, agentName]);

  const deliverables = [
    { icon: Users, label: "3 leads qualificados", sub: "do seu ICP", color: "from-blue-500/20 to-cyan-500/10" },
    { icon: FileText, label: "1 post pronto", sub: "para LinkedIn", color: "from-primary/20 to-accent/10" },
    { icon: BarChart3, label: "1 análise rápida", sub: "do seu mercado", color: "from-emerald-500/20 to-green-500/10" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-primary/30">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-background to-accent/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Magic Moment
            </span>
            {elapsedSeconds > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />
                {elapsedSeconds}s
              </span>
            )}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            Seu agente já produziu os primeiros entregáveis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {agentName ? `${agentName} ` : "Seu agente "}preparou tudo para você revisar e aprovar.
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          <AnimatePresence>
            {deliverables.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br ${d.color} border border-border/30`}
              >
                <div className="w-10 h-10 rounded-lg bg-background/70 backdrop-blur border border-border/40 flex items-center justify-center shrink-0">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{d.label}</p>
                  <p className="text-[11px] text-muted-foreground">{d.sub}</p>
                </div>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Pronto
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button size="lg" className="w-full gap-2" onClick={onGoToApprovals}>
            Revisar e aprovar agora <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver mais tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MagicMomentCard;
