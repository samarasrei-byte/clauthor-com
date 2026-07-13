/**
 * PreviewDashboard — clone visual do ClientDashboard com dados 100% mockados,
 * exibido a usuários NÃO autenticados que iniciaram checkout.
 *
 * Fluxo:
 *   Checkout (!user) → /preview-dashboard → ThorGuestTour (5 passos)
 *   → CTA final "Criar conta e ativar" → /auth (com hireIntent preservado)
 *
 * Tudo aqui é fake plausível. Nenhuma chamada Supabase, nenhum dado real.
 */
import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import { formatBRL } from "@/data/departmentPackages";
import { useDeptSelection } from "@/stores/deptSelection";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThorGuestTour from "@/components/preview/ThorGuestTour";

// ----- Mock data generators (deterministic per department) -----
const AGENT_NAMES = [
  "Athena", "Hermes", "Apollo", "Artemis", "Ares", "Poseidon",
  "Nyx", "Iris", "Zephyr", "Selene", "Helios", "Kairos",
];
const ACTIVITIES = [
  { verb: "gerou proposta para", target: "Cliente #4821", time: "há 2 min" },
  { verb: "enviou 12 mensagens de outbound para", target: "lista ICP-B2B", time: "há 8 min" },
  { verb: "analisou métricas de", target: "campanha Q4", time: "há 15 min" },
  { verb: "criou peça para", target: "Instagram — Black Friday", time: "há 27 min" },
  { verb: "respondeu ticket #921 sobre", target: "integração API", time: "há 41 min" },
  { verb: "atualizou pipeline com", target: "6 leads qualificados", time: "há 1h" },
];

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export default function PreviewDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const items = useDeptSelection((s) => s.items);
  const total = useDeptSelection((s) => s.total());
  const [tourOpen, setTourOpen] = useState(true);

  // Se já logado, não faz sentido preview → mandar direto pro checkout
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/checkout", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Cart vazio → volta pra departamentos
  if (!authLoading && !user && items.length === 0) {
    return <Navigate to="/departamentos" replace />;
  }

  const cartLabel =
    items.length === 1
      ? items[0].name
      : `${items.length} departamento${items.length > 1 ? "s" : ""}`;

  const allAgents = useMemo(() => {
    const list: { name: string; role: string; deptId: string; status: "running" | "idle" }[] = [];
    items.forEach((item) => {
      item.agentSlugs.forEach((slug, idx) => {
        const seed = hashSeed(item.id + slug);
        list.push({
          name: AGENT_NAMES[(seed + idx) % AGENT_NAMES.length],
          role: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          deptId: item.id,
          status: seed % 5 === 0 ? "idle" : "running",
        });
      });
    });
    return list.slice(0, 8);
  }, [items]);

  const metrics = useMemo(() => {
    const seed = hashSeed(items.map((i) => i.id).join("_") || "default");
    return {
      executions: 340 + (seed % 180),
      approvals: 12 + (seed % 8),
      leads: 47 + (seed % 30),
      revenue: 8200 + (seed % 4000),
    };
  }, [items]);

  const activateNow = () => {
    // Preserva hireIntent do checkout original — vai pro /auth com signup
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

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO
        title="Preview do painel · Clauthor"
        description="Veja como seu departamento de IA vai funcionar antes de ativar."
      />

      {/* Guest banner */}
      <div className="border-b border-primary/20 bg-primary/5 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider">Preview</span>
            <span className="text-muted-foreground hidden sm:inline">
              · Este é um exemplo. Ative para ter o seu.
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
              <h1 className="text-lg font-semibold tracking-[-0.01em]">
                {cartLabel}
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {allAgents.filter((a) => a.status === "running").length} agentes ativos
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-3">
        {/* Left: Agents */}
        <section className="lg:col-span-2 space-y-6">
          <Card
            data-tour="guest-agents"
            className="p-6 bg-card/60 border-border/50 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Sua equipe de agentes
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {allAgents.length} de {items.reduce((a, i) => a + i.agentSlugs.length, 0)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {allAgents.map((a, idx) => (
                <motion.div
                  key={`${a.deptId}-${a.name}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold",
                      a.status === "running"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/40 text-muted-foreground border border-border/50",
                    )}
                  >
                    {a.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {a.role}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        a.status === "running"
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {a.status === "running" ? "Ativo" : "Idle"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Activity feed */}
          <Card className="p-6 bg-card/60 border-border/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Atividade recente
              </h2>
            </div>
            <ul className="space-y-3">
              {ACTIVITIES.map((act, idx) => {
                const agent = allAgents[idx % allAgents.length];
                return (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                      {agent?.name[0] ?? "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground/90 leading-snug">
                        <span className="font-medium">{agent?.name ?? "Agente"}</span>{" "}
                        <span className="text-muted-foreground">{act.verb}</span>{" "}
                        <span className="font-medium">{act.target}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {act.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>

        {/* Right: Approvals + Metrics */}
        <aside className="space-y-6">
          <Card
            data-tour="guest-approvals"
            className="p-6 bg-card/60 border-border/50 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Aprovações
              </h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Proposta comercial · Cliente #4821", urgent: true },
                { label: "Peça Instagram · Black Friday", urgent: false },
                { label: "Sequência de e-mails · Coldstart", urgent: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-border/50 bg-background/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-snug flex-1">{item.label}</p>
                    {item.urgent && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                        Urgente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
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
                Impacto do mês
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricTile label="Execuções" value={metrics.executions.toString()} />
              <MetricTile label="Aprovações" value={metrics.approvals.toString()} />
              <MetricTile label="Leads" value={metrics.leads.toString()} />
              <MetricTile
                label="Receita gerada"
                value={formatBRL(metrics.revenue)}
                accent
              />
            </div>
          </Card>
        </aside>
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

function MetricTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl border",
        accent
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 bg-background/40",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-semibold mt-1 tracking-[-0.01em]",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
