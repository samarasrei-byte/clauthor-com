/**
 * HeroBriefing · a "primeira dobra" do dashboard.
 *
 * Um único componente, uma única voz. Substitui a pilha de 6+ cards que
 * competiam por atenção no topo (NextSteps + Welcome + ambient Thor +
 * ExecutionHealth + CompanyAlert + DailyBriefing).
 *
 * Regra de ouro: UM CTA primário por estado (Next Best Action).
 *   • sem agentes                  → contratar primeiro agente
 *   • agentes sem execução recente → rodar primeira tarefa
 *   • operação ativa               → ver últimas execuções
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bot, Zap, Coins, Activity, Diamond, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeroBriefingProps {
  agentsCount: number;
  activeAgents: number;
  totalExecutions: number;
  remainingCredits: number;
  recentLogs: Array<{ created_at?: string; status?: string }>;
  onFocusTaskInput?: () => void;
  onOpenWarRoom?: () => void;
  onOpenLibrary?: () => void;
}

type NBA = {
  key: "hire" | "run" | "review";
  label: string;
  onClick: () => void;
  helper: string;
};

const HeroBriefing = ({
  agentsCount,
  activeAgents,
  totalExecutions,
  remainingCredits,
  recentLogs,
  onFocusTaskInput,
  onOpenWarRoom,
  onOpenLibrary,
}: HeroBriefingProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Puxa a dor identificada no onboarding para personalizar o estado vazio.
  const { data: onboardingCtx } = useQuery({
    queryKey: ["hero-onboarding-ctx", user?.id],
    enabled: !!user && agentsCount === 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_answers")
        .eq("user_id", user!.id)
        .maybeSingle();
      const ans = (data?.onboarding_answers ?? null) as
        | { pain?: string; recommendation?: string; path?: string }
        | null;
      return ans;
    },
  });

  const firstName = useMemo(() => {
    const full = user?.user_metadata?.full_name?.trim();
    if (full) return full.split(" ")[0];
    const email = user?.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    const first = email?.split(" ")[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    return "por aí";
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const newestLog = recentLogs?.[0];
  const newestDate = newestLog?.created_at ? new Date(newestLog.created_at) : null;
  const hoursSince = newestDate ? (Date.now() - newestDate.getTime()) / 36e5 : Infinity;
  const isLive = hoursSince <= 24;

  const pain = onboardingCtx?.pain?.trim();
  const recommendation = onboardingCtx?.recommendation?.trim();

  // Next Best Action · depende do estado real da conta.
  const nba: NBA = useMemo(() => {
    if (agentsCount === 0) {
      return {
        key: "hire",
        label: recommendation ? `Ativar ${recommendation}` : "Contratar seu primeiro departamento",
        helper: recommendation
          ? "Recomendado com base no diagnóstico. Começa a rodar hoje."
          : "Escolha um departamento em 2 minutos. Começa a rodar hoje.",
        onClick: () => (onOpenLibrary ? onOpenLibrary() : navigate("/library")),
      };
    }
    if (!isLive) {
      return {
        key: "run",
        label: "Rodar sua primeira tarefa",
        helper: `Você tem ${agentsCount} agente${agentsCount > 1 ? "s" : ""} pronto${agentsCount > 1 ? "s" : ""}. Diga o que quer que ele faça.`,
        onClick: () => (onFocusTaskInput ? onFocusTaskInput() : navigate("/omnix")),
      };
    }
    return {
      key: "review",
      label: "Ver últimas operações",
      helper: `${recentLogs.length} execuç${recentLogs.length > 1 ? "ões" : "ão"} nas últimas 24h · revise e aprove.`,
      onClick: () => (onOpenWarRoom ? onOpenWarRoom() : navigate("/dashboard?tab=operations-center")),
    };
  }, [agentsCount, isLive, recentLogs.length, onFocusTaskInput, onOpenWarRoom, onOpenLibrary, navigate, recommendation]);

  // Uma linha de contexto humana, sem "LIVE" mentiroso.
  const statusLine = useMemo(() => {
    if (agentsCount === 0) {
      if (pain) return `Você nos disse: "${pain.slice(0, 140)}${pain.length > 140 ? "…" : ""}". Ative um departamento para resolver.`;
      return "Sua conta está pronta · falta só escolher quem trabalha por você.";
    }
    if (!newestDate) return `${activeAgents}/${agentsCount} agentes ativos. Ainda sem execuções · bora começar.`;
    const rel = formatDistanceToNow(newestDate, { addSuffix: true, locale: ptBR });
    const verb = isLive ? "rodando" : "em pausa";
    return `${activeAgents}/${agentsCount} agentes ${verb} · última ação ${rel}.`;
  }, [agentsCount, activeAgents, newestDate, isLive, pain]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Resumo do dia"
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm"
    >
      {/* accent glow único, discreto */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
        {/* Coluna esquerda: greeting + status + CTA */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"}`} />
            {isLive ? "operação ativa" : agentsCount ? "aguardando ordem" : "conta nova"}
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {greeting}, {firstName}.
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{statusLine}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <Button size="lg" onClick={nba.onClick} className="gap-2 h-12 px-6 text-sm font-medium">
              {nba.key === "hire" ? <Bot className="h-4 w-4" /> : nba.key === "run" ? <Diamond className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
              {nba.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground/80 max-w-xs">{nba.helper}</p>
          </div>
        </div>

        {/* Coluna direita: 3 KPIs enxutos */}
        <dl className="grid grid-cols-3 gap-4 sm:gap-6 lg:min-w-[340px]">
          <StatCell icon={Bot} label="agentes" value={activeAgents} sub={agentsCount ? `de ${agentsCount}` : "contratados"} />
          <StatCell icon={Zap} label="ações 24h" value={recentLogs.length} sub="registradas" />
          <StatCell
            icon={Coins}
            label="créditos"
            value={Number.isFinite(remainingCredits) ? remainingCredits : "∞"}
            sub={Number.isFinite(remainingCredits) ? "restantes" : "ilimitado"}
          />
        </dl>
      </div>
    </motion.section>
  );
};

function StatCell({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub: string;
}) {
  const display = typeof value === "number" ? value.toLocaleString("pt-BR") : value;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/70">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-semibold tabular-nums leading-none">{display}</div>
      <div className="text-[10px] text-muted-foreground/60">{sub}</div>
    </div>
  );
}

export default HeroBriefing;
