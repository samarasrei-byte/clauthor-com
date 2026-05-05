import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Scale,
  FileText,
  ShieldAlert,
  Handshake,
  ClipboardCheck,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Briefcase,
  Inbox,
  X,
  MessageCircle,
  Circle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * AdvocaciaPainel — Workspace vertical isolado para advogados.
 *
 * Decisões UX (data-driven):
 * - Sidebar enxuta: 5 itens jurídicos. Reduz paradoxo da escolha.
 * - Onboarding checklist no rodapé: 4 passos. +40% ativação (Pendo 2024).
 * - Cross-sell: SOMENTE após 7d + 3 execuções. Substitui o checklist quando completo.
 * - Multitenant: cada advogado vê SOMENTE seus dados via RLS (user_id).
 */

type SidebarItem = { to: string; label: string; icon: any; end?: boolean };
const SIDEBAR_ITEMS: SidebarItem[] = [
  { to: "/advocacia/painel", label: "Visão geral", icon: Scale, end: true },
  { to: "/advocacia/painel/contratos", label: "Contratos & Risco", icon: ShieldAlert },
  { to: "/advocacia/painel/propostas", label: "Propostas", icon: Handshake },
  { to: "/advocacia/painel/captacao", label: "Captação", icon: Inbox },
  { to: "/advocacia/painel/documentos", label: "Documentos", icon: FileText },
  { to: "/advocacia/painel/configuracoes", label: "Configurações", icon: SettingsIcon },
];

const CROSS_SELL_DISMISS_KEY = "clauthor_advocacia_crosssell_dismissed";
const CHECKLIST_DISMISS_KEY = "clauthor_advocacia_checklist_dismissed";
const CROSS_SELL_MIN_DAYS = 7;
const CROSS_SELL_MIN_EXECUTIONS = 3;

// ─── Hook: progresso de onboarding ───
function useOnboardingProgress(userId?: string) {
  return useQuery({
    queryKey: ["advocacia-onboarding-progress", userId],
    queryFn: async () => {
      if (!userId) return null;

      const [{ data: onb }, { count: agentsCount }, { count: execCount }] =
        await Promise.all([
          supabase
            .from("advocacia_onboarding")
            .select("whatsapp_status, crm_status, clicksign_status, completed")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("agents")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "active"),
          supabase
            .from("execution_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "success"),
        ]);

      const steps = [
        {
          id: "agents",
          label: "Agentes ativados",
          done: (agentsCount || 0) > 0,
          to: "/advocacia/painel",
        },
        {
          id: "whatsapp",
          label: "Conectar WhatsApp",
          done: onb?.whatsapp_status === "connected",
          to: "/advocacia/onboarding",
        },
        {
          id: "clicksign",
          label: "Conectar ClickSign",
          done: onb?.clicksign_status === "connected",
          to: "/advocacia/onboarding",
        },
        {
          id: "first_exec",
          label: "Primeira execução",
          done: (execCount || 0) > 0,
          to: "/advocacia/painel/contratos",
        },
      ];

      const completed = steps.filter((s) => s.done).length;
      return { steps, completed, total: steps.length };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

const AdvocaciaPainelLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: progress } = useOnboardingProgress(user?.id);

  // Cross-sell elegibility (7 dias + 3 execuções)
  const { data: crossSellEligible = false } = useQuery({
    queryKey: ["advocacia-crosssell-eligibility", user?.id],
    queryFn: async () => {
      if (!user) return false;
      if (localStorage.getItem(CROSS_SELL_DISMISS_KEY)) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.created_at) return false;
      const daysSince = Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < CROSS_SELL_MIN_DAYS) return false;

      const { count } = await supabase
        .from("execution_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "success");

      return (count || 0) >= CROSS_SELL_MIN_EXECUTIONS;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const [crossSellOpen, setCrossSellOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem(CHECKLIST_DISMISS_KEY),
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dismissCrossSell = () => {
    localStorage.setItem(CROSS_SELL_DISMISS_KEY, "1");
    setCrossSellOpen(false);
  };

  const dismissChecklist = () => {
    localStorage.setItem(CHECKLIST_DISMISS_KEY, "1");
    setChecklistOpen(false);
  };

  // Checklist tem prioridade. Cross-sell só aparece se checklist completo/dismissado.
  const checklistCompleted = progress && progress.completed === progress.total;
  const showChecklist = !!progress && !checklistCompleted && checklistOpen;
  const showCrossSell = !showChecklist && crossSellEligible && crossSellOpen;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ─── Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/40 backdrop-blur-sm">
        {/* Header — wordmark + selo "Advocacia" abaixo */}
        <div className="px-5 py-5 border-b border-border">
          <Link to="/advocacia/painel" className="flex flex-col gap-1">
            <ClauthorLogo size="sm" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Advocacia
            </span>
          </Link>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Onboarding checklist — prioridade 1 */}
        <AnimatePresence mode="wait">
          {showChecklist && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-3 mb-3 p-3 rounded-lg border border-border bg-muted/20 relative"
            >
              <button
                onClick={dismissChecklist}
                aria-label="Dispensar checklist"
                className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Configuração
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {progress!.completed}/{progress!.total}
                </span>
              </div>
              <Progress
                value={(progress!.completed / progress!.total) * 100}
                className="h-1 mb-3"
              />
              <ul className="space-y-1.5">
                {progress!.steps.map((step) => (
                  <li key={step.id}>
                    <Link
                      to={step.to}
                      className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors group"
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      )}
                      <span
                        className={
                          step.done
                            ? "line-through text-muted-foreground"
                            : "group-hover:underline"
                        }
                      >
                        {step.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Cross-sell discreto — somente após 7d+3exec E checklist completo */}
          {showCrossSell && (
            <motion.div
              key="crosssell"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-3 mb-3 p-3 rounded-lg border border-border bg-muted/30 relative"
            >
              <button
                onClick={dismissCrossSell}
                aria-label="Dispensar"
                className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                <Sparkles className="h-3 w-3" />
                Sugestão
              </div>
              <p className="text-xs text-foreground leading-snug mb-2">
                Quer escalar captação fora do jurídico? Conheça o SDR Outbound.
              </p>
              <Link
                to="/marketplace"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver agentes <ArrowRight className="h-3 w-3" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé: ajuda + sair */}
        <div className="border-t border-border px-3 py-2 space-y-0.5">
          <Link
            to="/dashboard?section=omnix"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Falar com Thor
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="text-sm text-muted-foreground">Painel do escritório</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ─── Visão Geral (home) ───
export const AdvocaciaPainelHome = () => {
  const { user } = useAuth();
  const { data: progress } = useOnboardingProgress(user?.id);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["advocacia-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [{ count: execToday }, { count: agentsActive }, { data: recentLogs }] =
        await Promise.all([
          supabase
            .from("execution_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", today.toISOString()),
          supabase
            .from("agents")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "active"),
          supabase
            .from("execution_logs")
            .select("id, action, status, created_at, details")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      return {
        execToday: execToday || 0,
        agentsActive: agentsActive || 0,
        recentLogs: recentLogs || [],
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Próximo passo recomendado: primeiro item não-feito do checklist
  const nextStep = progress?.steps.find((s) => !s.done);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bom dia, advogado.</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está o que seus agentes fizeram por você.
        </p>
      </div>

      {/* Próximo passo recomendado — só se onboarding incompleto */}
      {nextStep && (
        <Card className="p-4 border-primary/20 bg-primary/[0.03]">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-primary font-medium mb-0.5">
                Próximo passo recomendado
              </div>
              <p className="text-sm font-medium">{nextStep.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leva menos de 2 minutos.
              </p>
            </div>
            <Button asChild size="sm" variant="default">
              <Link to={nextStep.to}>
                Continuar <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={CheckCircle2}
          label="Ações hoje"
          value={isLoading ? "—" : String(stats?.execToday ?? 0)}
          hint="Execuções dos seus agentes"
        />
        <KpiCard
          icon={Briefcase}
          label="Agentes ativos"
          value={isLoading ? "—" : String(stats?.agentsActive ?? 0)}
          hint="Trabalhando agora"
        />
        <KpiCard
          icon={TrendingUp}
          label="Status"
          value={
            !progress
              ? "—"
              : progress.completed === progress.total
                ? "Pronto"
                : `${progress.completed}/${progress.total}`
          }
          hint={
            !progress || progress.completed === progress.total
              ? "Configuração completa"
              : "Etapas de configuração"
          }
        />
      </div>

      {/* Atividade recente */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Atividade recente</h2>
          <Link
            to="/advocacia/auditoria"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Ver tudo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !stats?.recentLogs.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Seus agentes ainda não executaram nenhuma ação. Comece pelo
            <Link to="/advocacia/onboarding" className="text-primary hover:underline ml-1">
              onboarding
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentLogs.map((log: any) => (
              <li key={log.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Badge variant={log.status === "success" ? "default" : "destructive"}>
                  {log.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Atalhos de ação */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            to="/advocacia/painel/contratos"
            icon={ShieldAlert}
            title="Analisar um contrato"
            desc="Receba relatório de risco em segundos"
          />
          <ActionCard
            to="/advocacia/painel/propostas"
            icon={Handshake}
            title="Gerar proposta de honorários"
            desc="Modelo híbrido pronto para enviar"
          />
          <ActionCard
            to="/advocacia/painel/captacao"
            icon={Inbox}
            title="Ver leads recebidos"
            desc="Triagem feita pelo agente de captação"
          />
          <ActionCard
            to="/advocacia/onboarding"
            icon={ClipboardCheck}
            title="Completar configuração"
            desc="Conecte WhatsApp, CRM e ClickSign"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ───
const KpiCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{hint}</div>
  </Card>
);

const ActionCard = ({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
}) => (
  <Link to={to}>
    <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer h-full">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  </Link>
);

// ─── Placeholder pages ───
export const AdvocaciaPainelContratos = () => (
  <SimplePage title="Contratos & Risco" desc="Análise automatizada de cláusulas e relatórios de risco." />
);
export const AdvocaciaPainelPropostas = () => (
  <SimplePage title="Propostas" desc="Geração de propostas de honorários personalizadas." />
);
export const AdvocaciaPainelCaptacao = () => (
  <SimplePage title="Captação" desc="Leads capturados e qualificados pelos seus agentes." />
);
export const AdvocaciaPainelDocumentos = () => (
  <SimplePage title="Documentos" desc="Repositório dos documentos analisados." />
);
export const AdvocaciaPainelConfiguracoes = () => (
  <SimplePage
    title="Configurações"
    desc="Gerencie integrações: WhatsApp, CRM, ClickSign."
    cta={{ to: "/advocacia/onboarding", label: "Abrir onboarding" }}
  />
);

const SimplePage = ({
  title,
  desc,
  cta,
}: {
  title: string;
  desc: string;
  cta?: { to: string; label: string };
}) => (
  <div className="max-w-5xl mx-auto px-6 py-8">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    <Card className="mt-6 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Em breve. Esta seção está sendo expandida com base no uso real dos advogados.
      </p>
      {cta && (
        <Button asChild className="mt-4">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </Card>
  </div>
);

export default AdvocaciaPainelLayout;
