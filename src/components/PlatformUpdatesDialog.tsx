import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coins, ShieldCheck, TrendingUp, X, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";

// Bump this whenever there are new updates you want everyone to see.
const CURRENT_VERSION = "2026.07.08";
const STORAGE_KEY = `clauthor-updates-seen-${CURRENT_VERSION}`;

interface UpdateItem {
  icon: typeof Sparkles;
  title: string;
  description: string;
  tag?: string;
}

const UPDATES: UpdateItem[] = [
  {
    icon: ShieldCheck,
    title: "Sistema de tokens transparente",
    description: "Agora você vê em tempo real quanto está consumindo e recebe alertas em 80% e 95% do limite. Sem surpresas no fim do mês.",
    tag: "Novidade",
  },
  {
    icon: Sparkles,
    title: "Painel de motores de IA",
    description: "Consumo por categoria de motor (Raciocínio Avançado, Núcleo Cognitivo, Análise Profunda) direto no Command Center.",
    tag: "Novidade",
  },
  {
    icon: CheckCircle2,
    title: "Integrações auditadas",
    description: "Cada conector agora exibe seu status real (🟢 API ativa · 🟡 Beta · ⚪ Em breve) para você conectar com confiança.",
  },
  {
    icon: TrendingUp,
    title: "Performance & Web Vitals",
    description: "Lazy loading, code splitting e otimizações que deixam a plataforma até 40% mais rápida no primeiro carregamento.",
  },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("pt-BR");
}

export default function PlatformUpdatesDialog() {
  const { user, isAdmin } = useAuth();
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : "1";
    if (!seen) {
      // Small delay so it doesn't fight with route transitions
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [user]);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore quota errors */
    }
    setOpen(false);
  };

  const level: "ok" | "warn" | "crit" | "admin" = isAdmin
    ? "admin"
    : usagePercentage >= 95
      ? "crit"
      : usagePercentage >= 80
        ? "warn"
        : "ok";

  const levelBadge = {
    admin: <Badge className="bg-primary/15 text-primary border-0">Acesso ilimitado</Badge>,
    ok: <Badge className="bg-emerald-500/15 text-emerald-500 border-0">🟢 Saudável</Badge>,
    warn: <Badge className="bg-amber-500/15 text-amber-500 border-0">🟡 Atenção</Badge>,
    crit: <Badge className="bg-destructive/15 text-destructive border-0">🔴 Crítico</Badge>,
  }[level];

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
        </div>

        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">O que há de novo no Clauthor</DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Atualização {CURRENT_VERSION} • Segurança e transparência primeiro
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar"
              className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Token/credit status card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/40 bg-background/40 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Seu saldo de tokens</h3>
              </div>
              {levelBadge}
            </div>

            {isAdmin ? (
              <div className="text-xs text-muted-foreground">
                Como administrador, você tem acesso ilimitado a todos os motores de IA e agentes.
              </div>
            ) : credits ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Disponível</p>
                    <p className="font-display font-bold text-lg">{fmt(remainingCredits)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Consumido</p>
                    <p className="font-display font-bold text-lg">{fmt(credits.used_credits)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Total do ciclo</p>
                    <p className="font-display font-bold text-lg">{fmt(credits.total_credits)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Uso do plano ({credits.plan_type.toUpperCase()})</span>
                    <span className="font-mono">{usagePercentage}%</span>
                  </div>
                  <Progress value={Math.min(100, usagePercentage)} className="h-1.5" />
                </div>
                {level === "warn" && (
                  <p className="mt-3 text-[11px] text-amber-500 flex items-start gap-1.5">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    Você já usou mais de 80% dos tokens deste ciclo. Considere fazer upgrade para evitar interrupções.
                  </p>
                )}
                {level === "crit" && (
                  <p className="mt-3 text-[11px] text-destructive flex items-start gap-1.5">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    Consumo crítico. Faça upgrade agora para manter seus agentes rodando sem interrupção.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Carregando saldo…</p>
            )}
          </motion.section>

          {/* Updates list */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2 px-1">
              Novidades desta versão
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {UPDATES.map((u, i) => (
                  <motion.div
                    key={u.title}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 rounded-lg border border-border/30 bg-background/30 p-3 hover:bg-background/50 transition-colors"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                      <u.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold">{u.title}</p>
                        {u.tag && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {u.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{u.description}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 bg-background/40 px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            Você pode revisar essas informações a qualquer momento no Command Center.
          </p>
          <div className="flex items-center gap-2">
            {!isAdmin && level !== "ok" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5 border-primary/30 text-primary"
                onClick={() => {
                  handleClose();
                  navigate("/pricing");
                }}
              >
                Ver planos
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
            <Button size="sm" className="text-xs" onClick={handleClose}>
              Entendi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
