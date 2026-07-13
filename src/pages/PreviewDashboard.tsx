/**
 * PreviewDashboard · preview do painel para usuários NÃO autenticados que
 * escolheram um departamento no checkout. Usa DADOS REAIS do departamento
 * (agentes, dor, outcome, timeline de execução) para mostrar exatamente o
 * que aquele squad vai fazer pela empresa dele.
 *
 * Fluxo:
 *   Checkout (!user) → /preview-dashboard →
 *   1) "O que esse departamento faz por você" (problema, solução, entrega)
 *   2) Time real de agentes (do package)
 *   3) Timeline demo (o que acontece na prática)
 *   4) Aprovações + métricas
 *   → CTA "Criar conta e ativar" → /auth (preserva hireIntent)
 *
 * Se o usuário passou pelo Thor (loadDiagnosis retorna dados), personaliza
 * o topo com "Baseado no que você me contou".
 */
import { useMemo, useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Rocket,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import {
  formatBRL,
  getDepartmentById,
  type DepartmentPackage,
} from "@/data/departmentPackages";
import { useDeptSelection } from "@/stores/deptSelection";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThorGuestTour from "@/components/preview/ThorGuestTour";
import Typewriter from "@/components/preview/Typewriter";
import {
  loadDiagnosis,
  loadThorBriefing,
  PAIN_TO_RECOMMENDATION,
} from "@/lib/diagnosis-routing";

// Deterministic hash for stable mock values per cart
function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

// Human-readable role from agent slug (fallback)
function humanizeSlug(slug: string) {
  return slug
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PreviewDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const items = useDeptSelection((s) => s.items);
  const total = useDeptSelection((s) => s.total());
  const [tourOpen, setTourOpen] = useState(true);

  // Já logado → não faz sentido preview
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/checkout", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Cart vazio → volta pra departamentos
  if (!authLoading && !user && items.length === 0) {
    return <Navigate to="/departamentos" replace />;
  }

  // Pega dados REAIS de cada departamento do carrinho
  const packages = useMemo(
    () =>
      items
        .map((it) => getDepartmentById(it.id))
        .filter((p): p is DepartmentPackage => Boolean(p)),
    [items],
  );

  // Departamento em foco (o primeiro) · o preview conta a história desse dept
  const focusPkg = packages[0];

  const cartLabel =
    items.length === 1
      ? items[0].name
      : `${items.length} departamentos`;

  // Diagnóstico do Thor (se veio de lá)
  const diagnosis = useMemo(() => loadDiagnosis(), []);
  const thorBriefing = useMemo(() => loadThorBriefing(), []);
  const thorRecommendation = diagnosis
    ? PAIN_TO_RECOMMENDATION[diagnosis.pain]
    : null;

  // Time real de agentes: prioriza o timelineDemo (tem nomes prontos),
  // depois complementa com os agentSlugs restantes.
  const teamAgents = useMemo(() => {
    if (!focusPkg) return [];
    const fromTimeline = new Map<string, { name: string; slug: string }>();
    focusPkg.timelineDemo.forEach((ev) => {
      if (!fromTimeline.has(ev.agentSlug)) {
        fromTimeline.set(ev.agentSlug, { name: ev.agentName, slug: ev.agentSlug });
      }
    });
    const list = Array.from(fromTimeline.values());
    // Complementa com slugs que não aparecem na timeline
    focusPkg.agentSlugs.forEach((slug) => {
      if (!fromTimeline.has(slug)) {
        list.push({ name: humanizeSlug(slug), slug });
      }
    });
    return list;
  }, [focusPkg]);

  // Métricas plausíveis derivadas do outcomeMetric do package
  const metrics = useMemo(() => {
    if (!focusPkg) {
      return { primary: { label: "Execuções", value: "340" }, approvals: 8, timeToValue: "24h", savings: 42000 };
    }
    const seed = hashSeed(focusPkg.id);
    const finalProgress =
      focusPkg.outcomeMetric.progression[focusPkg.outcomeMetric.progression.length - 1] ?? 0;
    return {
      primary: {
        label: focusPkg.outcomeMetric.label,
        value: `${finalProgress}${focusPkg.outcomeMetric.suffix ?? ""}`,
      },
      approvals: 3 + (seed % 5),
      timeToValue: thorRecommendation?.timeToValue ?? "24h",
      savings: thorRecommendation?.monthlySavings ?? 42000 + (seed % 15000),
    };
  }, [focusPkg, thorRecommendation]);

  const activateNow = () => {
    navigate("/auth", {
      state: {
        hireIntent: {
          type: "cart",
          label: cartLabel,
          departments: items.map((i) => ({ id: i.id, slugs: i.agentSlugs })),
        },
        signup: true,
        from: { pathname: "/checkout" },
      },
    });
  };

  // Sem package correspondente (dept custom sem dados) · fallback simples
  if (!focusPkg) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Departamento sem preview disponível.
          </p>
          <Button onClick={() => navigate("/checkout")}>Voltar ao checkout</Button>
        </div>
      </div>
    );
  }

  const Icon = focusPkg.icon;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO
        title={`Preview: ${focusPkg.name} · Clauthor`}
        description={`Veja como ${focusPkg.name} vai operar na sua empresa antes de ativar.`}
      />

      {/* Guest banner */}
      <div className="border-b border-primary/20 bg-primary/5 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Preview ao vivo</span>
            <span className="text-muted-foreground hidden sm:inline">
              · Esse é o painel que você recebe ao ativar
            </span>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar ao checkout
          </button>
        </div>
      </div>

      {/* Header */}
      <header
        data-tour="guest-header"
        className="border-b border-border/40 bg-background/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClauthorLogo className="h-6" />
            <div className="h-6 w-px bg-border" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Seu painel
              </p>
              <h1 className="text-lg font-semibold tracking-[-0.01em]">{cartLabel}</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {teamAgents.length} agentes prontos
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 1) Personalização via Thor (se houver diagnosis) */}
        {(diagnosis || thorBriefing.briefing) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary font-semibold mb-1">
                Thor · baseado no que você me contou
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {thorBriefing.briefing ||
                  (thorRecommendation
                    ? `Você disse que ${diagnosis?.freeText?.toLowerCase() || thorRecommendation.tagline.toLowerCase()} Esse é o painel que resolve isso.`
                    : "Esse é o painel que monta o time ideal pro que você precisa.")}
              </p>
            </div>
          </motion.div>
        )}

        {/* 2) O que esse departamento FAZ por você · bloco hero */}
        <Card
          data-tour="guest-header"
          className="p-6 sm:p-8 bg-card/60 border-border/50 rounded-2xl"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-primary font-semibold mb-1">
                O que esse departamento faz por você
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] leading-tight">
                {focusPkg.name}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-xl border border-border/50 bg-background/40">
              <div className="flex items-center gap-2 mb-2 text-destructive/90">
                <Target className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">
                  O problema
                </p>
              </div>
              <p className="text-sm text-foreground/90 leading-snug">
                {focusPkg.painPoint}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-primary/25 bg-primary/[0.04]">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">
                  A solução
                </p>
              </div>
              <p className="text-sm text-foreground/90 leading-snug">
                {focusPkg.outcome}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04]">
              <div className="flex items-center gap-2 mb-2 text-emerald-500">
                <Rocket className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wider font-semibold">
                  A entrega
                </p>
              </div>
              <p className="text-sm text-foreground/90 leading-snug">
                {focusPkg.outcomeMetric.progression[focusPkg.outcomeMetric.progression.length - 1]}
                {focusPkg.outcomeMetric.suffix ?? ""} {focusPkg.outcomeMetric.label.toLowerCase()} no primeiro mês. Primeiro resultado em {metrics.timeToValue}.
              </p>
            </div>
          </div>
        </Card>

        {/* 3) Layout principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Time real de agentes */}
          <section className="lg:col-span-2 space-y-6">
            <Card
              data-tour="guest-agents"
              className="p-6 bg-card/60 border-border/50 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Seu time · {teamAgents.length} agentes
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Rodando 24/7
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {teamAgents.map((a, idx) => (
                  <motion.div
                    key={`${a.slug}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-sm font-semibold shrink-0">
                      {a.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {humanizeSlug(a.slug)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Ativo
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Timeline REAL · o que acontece na prática */}
            <Card className="p-6 bg-card/60 border-border/50 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Como funciona na prática · exemplo de 1 dia
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mb-5">
                Um dia real do seu {focusPkg.name.toLowerCase()}. Isso vai virar seu feed.
              </p>
              <ul className="space-y-4">
                {focusPkg.timelineDemo.map((ev, idx) => {
                  const baseDelay = 300 + idx * 700;
                  return (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: baseDelay / 1000, duration: 0.35 }}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                        {ev.agentName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ev.agentName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
                            {ev.time}
                          </span>
                        </div>
                        <p className="text-[13px] text-foreground/85 leading-snug mt-0.5">
                          <Typewriter
                            text={ev.action}
                            speed={14}
                            startDelay={baseDelay + 200}
                          />
                        </p>
                        <p className="text-[11px] mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> {ev.outcome}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </Card>
          </section>

          {/* Aside: Aprovações + Métricas */}
          <aside className="space-y-6">
            <Card
              data-tour="guest-approvals"
              className="p-6 bg-card/60 border-border/50 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Você aprova
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Nada crítico sai sem seu OK.
              </p>
              <div className="space-y-3">
                {focusPkg.timelineDemo.slice(0, 3).map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border/50 bg-background/40"
                  >
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {ev.agentName}
                    </p>
                    <p className="text-xs leading-snug mb-2.5 line-clamp-2">
                      {ev.action}
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="text-[11px] px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                        Aprovar
                      </button>
                      <button className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              data-tour="guest-metrics"
              className="p-6 bg-card/60 border-border/50 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Seu impacto no mês 1
                </h2>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {metrics.primary.label}
                  </p>
                  <p className="text-2xl font-semibold mt-1 text-primary tracking-[-0.01em]">
                    {metrics.primary.value}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile
                    label="Aprovações"
                    value={metrics.approvals.toString()}
                  />
                  <MetricTile label="1º resultado" value={metrics.timeToValue} />
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04]">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Economia vs CLT
                  </p>
                  <p className="text-lg font-semibold mt-1 tracking-[-0.01em]">
                    {formatBRL(metrics.savings)}/mês
                  </p>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Sticky activate bar */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Total mensal
              </p>
              <p className="text-xl font-semibold tracking-[-0.01em]">
                {formatBRL(total)}
              </p>
            </div>
            <ul className="hidden md:flex items-center gap-4 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ativa em minutos
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cancele quando quiser
              </li>
            </ul>
          </div>
          <div data-tour="guest-activate" className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTourOpen(true)}
              className="text-xs text-muted-foreground"
            >
              <Zap className="w-3.5 h-3.5 mr-1" /> Rever tour
            </Button>
            <PremiumCTAButton variant="red" onClick={activateNow}>
              Criar conta e ativar
            </PremiumCTAButton>
          </div>
        </div>
      </div>

      {tourOpen && (
        <ThorGuestTour
          cartLabel={cartLabel}
          totalMonthly={formatBRL(total)}
          onActivate={activateNow}
          onDismiss={() => setTourOpen(false)}
        />
      )}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-border/50 bg-background/40">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold mt-1 tracking-[-0.01em]">{value}</p>
    </div>
  );
}
