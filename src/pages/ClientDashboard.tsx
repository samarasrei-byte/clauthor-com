import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import { LayoutDashboard, Bot, BarChart3, CreditCard, Settings, Brain, MessageSquare, Plug, ChevronLeft, Building2, KanbanSquare, Layers3, Clock, Radar, Orbit, Inbox, Rewind, TrendingUp, Dna, Workflow, Radio, CheckSquare, FolderOpen } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";

import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { SidebarItem, SidebarChild } from "@/components/dashboard/DashboardSidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileNavSheet from "@/components/dashboard/MobileNavSheet";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardSectionRenderer from "@/components/dashboard/DashboardSectionRenderer";
import SettingsBillingContent from "@/components/dashboard/SettingsBillingContent";

import { DashboardTour } from "@/components/dashboard/DashboardTour";
const CompanyBoardGate = lazy(() => import("@/components/dashboard/CompanyBoardGate"));
const DepartmentSetup = lazy(() => import("@/components/dashboard/DepartmentSetup"));
const CompanyOnboardingWizard = lazy(() => import("@/components/dashboard/CompanyOnboardingWizard"));
import PostPaymentCelebration from "@/components/dashboard/PostPaymentCelebration";
// Onboarding legado (Quick/FirstAccess/MagicMoment) removido — substituído pelo
// RevolutionaryOnboardingGate global montado em AppLayout.
import { usePaypalCapture } from "@/hooks/usePaypalCapture";
import { useHireIntentFlow } from "@/hooks/useHireIntentFlow";
import { usePostPaymentFlow } from "@/hooks/usePostPaymentFlow";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";
import { TIER_COLORS as tierColors } from "@/lib/tier-colors";
import { agentIcons } from "@/data/libraryAgentData";
import CheckoutSummaryDialog from "@/components/dashboard/CheckoutSummaryDialog";
import SectionLoader from "@/components/ui/section-loader";
import AmbientThorCard from "@/components/dashboard/AmbientThorCard";
import OnboardingResumeBanner from "@/components/OnboardingResumeBanner";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import { loadDiagnosis, loadThorBriefing, hasSeenDiagnosisRecap, markDiagnosisRecapSeen } from "@/lib/diagnosis-routing";
import DiagnosisRecapDialog from "@/components/dashboard/DiagnosisRecapDialog";

const lazyRetry = (fn: () => Promise<any>) => lazy(() => fn().catch(() => {
  window.location.reload();
  return fn();
}));

const AgentChat = lazyRetry(() => import("@/components/dashboard/AgentChat"));
const OmnixCommandCenter = lazyRetry(() => import("@/pages/OmnixCommandCenter"));
import { useFloatingDock } from "@/components/dashboard/FloatingDock";
const QuickStartWizard = lazy(() => import("@/components/dashboard/QuickStartWizard"));

const ClientDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");
  const [previousSection, setPreviousSection] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [pendingTaskMessage, setPendingTaskMessage] = useState<string | null>(null);
  const [omnixMounted, setOmnixMounted] = useState(false);
  // showSmartOnboarding removido — Revolutionary gate global cuida do primeiro contato.
  const [showBoardGate, setShowBoardGate] = useState(false);
  const [showLiveGuide, setShowLiveGuide] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("clauthor_live_guide_dismissed");
  });
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showDiagnosisRecap, setShowDiagnosisRecap] = useState(false);
  const [diagnosisRecapData, setDiagnosisRecapData] = useState<{
    diagnosis: ReturnType<typeof loadDiagnosis>;
    briefing: string | null;
    siteSummary: string | null;
  } | null>(null);
  
  // MagicMoment removido — parte do fluxo legado.
  const [boardGateSkipped, setBoardGateSkipped] = useState(() => {
    if (!user) return false;
    return !!localStorage.getItem(`clauthor_board_gate_skipped_${user.id}`);
  });

  // ── First-time redirect to THOR ──
  // CRÍTICO: NÃO redirecionar pra Thor se o usuário acabou de escolher um plano.
  // O hireIntent precisa ser processado pelo CheckoutSummaryDialog primeiro.
  useEffect(() => {
    if (!user) return;
    // Stamp the signup/first-visit timestamp once, for Magic Moment timing
    if (!localStorage.getItem("clauthor_signup_ts")) {
      localStorage.setItem("clauthor_signup_ts", String(Date.now()));
    }
    const key = `clauthor_concierge_seen_${user.id}`;
    if (localStorage.getItem(key)) return;

    // Se há hireIntent pendente, deixa o checkout flow tomar conta primeiro.
    const hireIntent = localStorage.getItem("hireIntent");
    if (hireIntent) return;

    // Se a pessoa veio do quiz da landing, o Thor continua a mesma linha de
    // conversa usando o briefing já gerado por Firecrawl + Lovable AI.
    const diag = loadDiagnosis();
    const { briefing, siteSummary } = loadThorBriefing();

    // ── Recap gate: primeira visita pós-quiz mostra o modal de diagnóstico
    // com CTA "Ativar time e ir pro pagamento". Só marca concierge_seen e
    // abre o Thor DEPOIS que a pessoa fechar o modal (ou ativar o time).
    if (diag && !hasSeenDiagnosisRecap()) {
      setDiagnosisRecapData({ diagnosis: diag, briefing, siteSummary });
      setShowDiagnosisRecap(true);
      return;
    }

    localStorage.setItem(key, "true");
    setActiveSection("omnix");
    setOmnixMounted(true);

    if (briefing) {
      setWelcomeMessage(briefing);
    } else if (diag) {
      const company = diag.company ? ` da ${diag.company}` : "";
      setWelcomeMessage(
        `Sou um novo usuário${company} e acabei de terminar o diagnóstico na landing. Me dê boas-vindas como Thor, confirme o departamento pré-ativado com base na dor "${diag.pain}"${diag.website ? ` (site: ${diag.website})` : ""} e me guie no próximo passo dentro do painel. Explique que o pagamento acontece aqui mesmo quando eu decidir ativar o time.`,
      );
    } else {
      setWelcomeMessage(`Sou um novo usuário na plataforma. Me dê boas-vindas, se apresente como Thor (o CEO e orquestrador de todos os agentes) e me guie: explique os 3 passos (Ensinar, Contratar e Comandar) de forma simples e pergunte como posso te ajudar.`);
    }
  }, [user]);

  // Handlers do DiagnosisRecapDialog
  const handleRecapClose = useCallback(() => {
    if (!user) return;
    setShowDiagnosisRecap(false);
    markDiagnosisRecapSeen();
    const key = `clauthor_concierge_seen_${user.id}`;
    localStorage.setItem(key, "true");
    // Abre o Thor com o briefing na sequência.
    const diag = diagnosisRecapData?.diagnosis ?? loadDiagnosis();
    const briefing = diagnosisRecapData?.briefing ?? loadThorBriefing().briefing;
    setActiveSection("omnix");
    setOmnixMounted(true);
    if (briefing) {
      setWelcomeMessage(briefing);
    } else if (diag) {
      const company = diag.company ? ` da ${diag.company}` : "";
      setWelcomeMessage(
        `Sou um novo usuário${company} e acabei de fechar o meu diagnóstico. Me dê boas-vindas como Thor e me guie no próximo passo.`,
      );
    }
  }, [user, diagnosisRecapData]);

  const handleRecapActivate = useCallback(() => {
    // hireIntent já foi setado pelo dialog. Fecha modal — useHireIntentFlow abre o CheckoutSummaryDialog.
    if (!user) return;
    setShowDiagnosisRecap(false);
    markDiagnosisRecapSeen();
    const key = `clauthor_concierge_seen_${user.id}`;
    localStorage.setItem(key, "true");
    // Força o hook a re-processar o hireIntent recém-inserido.
    // Como useHireIntentFlow escuta [user, lang], não re-dispara sozinho. Recarregamos.
    window.location.reload();
  }, [user]);

  /** Reabre o modal de diagnóstico (ex.: usuário clicou em "Ativar" no empty state). */
  const openRecapFromDashboard = useCallback(() => {
    const diag = loadDiagnosis();
    if (!diag) {
      // Sem diagnóstico → manda para Thor no painel, sem navegar pra /departamentos.
      setActiveSection("omnix");
      setOmnixMounted(true);
      return;
    }
    const { briefing, siteSummary } = loadThorBriefing();
    setDiagnosisRecapData({ diagnosis: diag, briefing, siteSummary });
    setShowDiagnosisRecap(true);
  }, []);


  useEffect(() => {
    if (activeSection === "omnix" && !omnixMounted) setOmnixMounted(true);
  }, [activeSection, omnixMounted]);

  // Deep-link via ?tab=xxx (permite /dashboard?tab=omnix vindo do redirect /omnix)
  const [searchParamsDeep] = useSearchParams();
  useEffect(() => {
    const tab = searchParamsDeep.get("tab");
    if (tab && tab !== activeSection) {
      setActiveSection(tab);
      if (tab === "omnix") setOmnixMounted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsDeep]);

  // ── Queries ──
  const { data: boardCount = 0 } = useQuery({
    queryKey: ["company-board-count-gate", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("company_board").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const needsBoardSetup = boardCount === 0 && !boardGateSkipped;

  const { checkoutSummary, handleApprove, cancelCheckout } = useHireIntentFlow(user);
  const {
    postPaymentContext, showCelebration, showDeptSetup, showCompanyOnboarding: showCompanyOnboardingPost,
    setShowCompanyOnboarding: setShowCompanyOnboardingPost, onCelebrationComplete, onCompanyOnboardingDone,
    onDeptSetupDone, clearPostPayment,
  } = usePostPaymentFlow();

  // Check onboarding_completed from profile
  const { data: profileOnboarding, isLoading: loadingProfileOnboarding } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("onboarding_completed, onboarded_at").eq("user_id", user!.id).maybeSingle();
      return { completed: !!data?.onboarding_completed || !!data?.onboarded_at };
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchOnMount: "always",
  });

  // ── Onboarding gate: se o usuário nunca completou o diagnóstico (site + dor),
  // manda pra /welcome antes de mostrar o painel. Respeita skip da sessão e
  // fluxo de checkout pendente pra não interromper pagamento.
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || loadingProfileOnboarding) return;
    if (profileOnboarding?.completed) return;
    const skipped = typeof window !== "undefined" && sessionStorage.getItem("onboarding-skipped-session") === "1";
    if (skipped) return;
    const pendingCheckout = typeof window !== "undefined" && !!localStorage.getItem("hireIntent");
    if (pendingCheckout) return;
    // Se a pessoa veio do quiz da landing, o diagnóstico JÁ conta como onboarding.
    // Não mandamos ela pra /welcome — Thor continua a conversa direto aqui.
    const hasDiagnosis = typeof window !== "undefined" && !!localStorage.getItem("clauthor:diagnosis");
    if (hasDiagnosis) return;
    navigate("/welcome", { replace: true });
  }, [user, loadingProfileOnboarding, profileOnboarding, navigate]);


  // ── Checkout-pending guard: bloqueia TODOS os onboardings/tours/cards
  //    enquanto o usuário ainda não pagou (hireIntent presente OU dialog aberto). ──
  const hasPendingCheckout = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("hireIntent") || !!checkoutSummary;
  }, [checkoutSummary]);

  // Onboarding do primeiro contato agora é 100% delegado ao RevolutionaryOnboardingGate
  // (montado em AppLayout via useGuidedOnboarding). Nada a fazer aqui.

  const { credits, remainingCredits, usagePercentage } = useCredits();
  usePaypalCapture();
  const { data: tokenUsage = [] } = useTokenUsage();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-agents", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (!isAdmin) {
        query = query.eq("user_id", user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // ── Contracted departments (drives empty-state gate) ──
  const { data: contractedCount = 0, isLoading: loadingContracted } = useQuery({
    queryKey: ["contracted-departments-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("contracted_departments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "active");
      return count || 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Empty-state gate: novo usuário sem departamentos → tela single-focus.
  // Não aplica para admin (que vê catálogo completo virtual) nem durante
  // checkout pendente (o dialog toma conta) nem se onboarding legado ainda
  // não terminou.
  const showEmptyState =
    !isAdmin &&
    !hasPendingCheckout &&
    !loadingContracted &&
    contractedCount === 0 &&
    activeSection === "overview";

  // First-access modal legacy removido — GuidedOnboarding cuida disso globalmente.


  const { data: templates = [] } = useQuery({
    queryKey: ["agent-templates-slugs"],
    queryFn: async () => {
      const { data } = await supabase.from("agent_templates").select("name, slug").eq("is_active", true);
      return data || [];
    },
    staleTime: Infinity,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.id, isAdmin],
    queryFn: async () => {
      // Admin gets all agents from WORKFORCE as virtual subscriptions
      if (isAdmin) {
        const allAgents: any[] = [];
        const { WORKFORCE: WF } = await import("@/data/workforceArchitecture");
        WF.forEach((dept) => {
          dept.squads.forEach((squad) => {
            squad.agents.forEach((agent) => {
              allAgents.push({
                id: `admin-${agent.slug}`,
                agent_name: agent.name,
                monthly_price: 0,
                status: "active",
                current_period_end: null,
              });
            });
          });
        });
        return allAgents;
      }

      let query = supabase.from("subscriptions").select("*, agent:agents(*)").eq("status", "active").eq("user_id", user!.id);
      const { data, error } = await query;
      if (error) throw error;
      return data.map((sub: any) => ({
        id: sub.id,
        agent_name: sub.agent?.name || t("dashboard.ai_assistant"),
        monthly_price: sub.monthly_price,
        status: sub.status,
        current_period_end: sub.current_period_end,
      }));
    },
    enabled: !!user,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["execution-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("execution_logs").select("*, agent:agents(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data.map((log: any) => ({
        id: log.id, agent_name: log.agent?.name || t("dashboard.ai_assistant"),
        action: log.action, status: log.status, execution_time_ms: log.execution_time_ms, created_at: log.created_at,
      }));
    },
    enabled: !!user,
  });

  // ── Computed ──
  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, tu) => acc + tu.tokens_used, 0);
  const estimatedSavings = activeAgents * 7560;
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const realChartData = useMemo(() => {
    const now = new Date();
    const months: { name: string; execucoes: number; sucesso: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString(locale, { month: "short" });
      const logsInMonth = recentLogs.filter((l) => {
        const ld = new Date(l.created_at);
        return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
      });
      months.push({ name: monthName, execucoes: logsInMonth.length, sucesso: logsInMonth.filter((l) => l.status === "success").length });
    }
    return months;
  }, [recentLogs, locale]);

  const nameToSlug = useMemo(() => {
    const map: Record<string, string> = {};
    templates.forEach(t => { map[t.name] = t.slug; });
    return map;
  }, [templates]);

  const pendingTaskCount = useMemo(() => {
    return recentLogs.filter(l => l.status === "running" || l.status === "pending").length;
  }, [recentLogs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(value / 100);
  };

  // ── Sidebar items ──
  const { departmentSidebarItems, soloAgentItems } = useMemo(() => {
    if (agents.length === 0) return { departmentSidebarItems: [] as SidebarItem[], soloAgentItems: [] as SidebarItem[] };
    const groups: Record<string, { dept: typeof DEPARTMENTS[string]; children: SidebarChild[] }> = {};
    const soloChildren: SidebarChild[] = [];
    for (const agent of agents) {
      const slug = nameToSlug[agent.name];
      if (!slug) { soloChildren.push({ id: `agent-chat-${agent.id}`, label: agent.name, icon: Bot }); continue; }
      const deptId = SLUG_TO_DEPT[slug];
      if (!deptId || !DEPARTMENTS[deptId]) { soloChildren.push({ id: `agent-chat-${agent.id}`, label: agent.name, icon: agentIcons[slug] || Bot }); continue; }
      if (!groups[deptId]) groups[deptId] = { dept: DEPARTMENTS[deptId], children: [] };
      groups[deptId].children.push({ id: `agent-chat-${agent.id}`, label: agent.name, icon: agentIcons[slug] || Bot });
    }
    const deptItems = Object.entries(groups).map(([, { dept, children }]) => ({
      id: `dept-${dept.id}`, label: dept.label, icon: Bot, badge: children.length,
      group: t("dashboard.departments", { defaultValue: "Departamentos" }), colorClass: dept.color, children,
    } as SidebarItem));
    const soloItems: SidebarItem[] = soloChildren.length > 0 ? [{
      id: "solo-agents", label: t("dashboard.solo_agents", { defaultValue: "Agentes Avulsos" }),
      icon: Sparkles, badge: soloChildren.length,
      group: t("dashboard.departments", { defaultValue: "Departamentos" }), children: soloChildren,
    }] : [];
    return { departmentSidebarItems: deptItems, soloAgentItems: soloItems };
  }, [agents, nameToSlug, t]);

  const chatSidebarItem: SidebarItem | null = selectedAgent ? {
    id: "chat", label: selectedAgent.name, icon: MessageSquare, group: t("dashboard.zone_work", { defaultValue: "Meu trabalho" }),
  } : null;

  // ─── 4 zonas: Meu trabalho / Meu time / IA & Voz / Configuração ───
  const zoneWork    = t("dashboard.zone_work",    { defaultValue: "Meu trabalho" });
  const zoneTeam    = t("dashboard.zone_team",    { defaultValue: "Meu time" });
  const zoneAI      = t("dashboard.zone_ai",      { defaultValue: "IA & Voz" });
  const zoneConfig  = t("dashboard.zone_config",  { defaultValue: "Configuração" });
  // (compat) grupo dos departamentos gerados dinamicamente acima
  const teamGroup   = zoneTeam;

  // Reetiqueta os itens de departamento/solo para caírem na zona "Meu time"
  const rebrandedDeptItems = departmentSidebarItems.map(it => ({ ...it, group: teamGroup }));
  const rebrandedSoloItems = soloAgentItems.map(it => ({ ...it, group: teamGroup }));

  // Itens completos (vistos por admin). Cliente vê apenas o subset estável.
  const allSidebarItems: SidebarItem[] = [
    // ─── Meu trabalho: o que eu faço no dia a dia ───
    { id: "overview",  label: t("dashboard.command_center"), icon: LayoutDashboard, group: zoneWork },
    { id: "workspace", label: "Workspace", icon: Layers3, badge: pendingTaskCount || undefined, group: zoneWork },
    // Chat unificado: sem entrada própria — o Command Center é o hub conversacional,
    // e conversar com um agente específico entra por "Meus Agentes" → agente.
    ...(chatSidebarItem && selectedAgent ? [{ ...chatSidebarItem, id: `agent-chat-active`, label: `· ${selectedAgent.name}`, group: zoneWork }] : []),
    { id: "intelligence-hub", label: t("dashboard.intelligence_hub", { defaultValue: "Inteligência" }), icon: BarChart3, group: zoneWork },

    // ─── Meu time: agentes e departamentos ───
    { id: "agents", label: t("dashboard.agents_tab"), icon: Bot, badge: agents.length || undefined, group: zoneTeam },
    ...rebrandedDeptItems,
    ...rebrandedSoloItems,

    // ─── IA & Voz: assistente global ───
    { id: "omnix", label: "THOR", icon: Brain, group: zoneAI },

    // ─── Configuração ───
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrações" }), icon: Plug, group: zoneConfig },
    { id: "system", label: t("dashboard.nav_system", { defaultValue: "Sistema" }), icon: Settings, group: zoneConfig },
  ];


  // Itens exclusivos do cliente (experiência limpa, sem PRO incompleto).
  const CLIENT_ALLOWED = new Set([
    "overview", "agents", "agent-chat-active",
    "intelligence-hub", "omnix", "workspace",
    "integrations", "system",
  ]);
  const sidebarItems: SidebarItem[] = isAdmin
    ? allSidebarItems
    : allSidebarItems.filter((it) =>
        CLIENT_ALLOWED.has(it.id) ||
        it.id.startsWith("dept-") ||
        it.id === "solo-agents"
      );

  // ── Navigation ──
  const handleSidebarNav = (id: string) => {
    if (id.startsWith("agent-chat-")) {
      const agentId = id.replace("agent-chat-", "");
      const agent = agents.find(a => a.id === agentId);
      if (agent) { setPreviousSection(activeSection); setSelectedAgent({ id: agent.id, name: agent.name }); setActiveSection("chat"); return; }
    }
    if (id === "chat") setPreviousSection(activeSection);
    setActiveSection(id);
  };

  // Register Thor in the FloatingDock (bottom-center reserved zone).
  const { registerThor } = useFloatingDock();
  const dismissLiveGuide = useCallback(() => {
    setShowLiveGuide(false);
    localStorage.setItem("clauthor_live_guide_dismissed", "true");
  }, []);
  useEffect(() => {
    if (showLiveGuide && !hasPendingCheckout && !showEmptyState) {
      registerThor({ activeSection, onNavigate: handleSidebarNav, onDismiss: dismissLiveGuide });
    } else {
      registerThor(null);
    }
    return () => registerThor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLiveGuide, hasPendingCheckout, activeSection, showEmptyState]);

  const handleBack = () => {
    setActiveSection(previousSection || "overview");
    setPreviousSection(null);
  };

  const breadcrumbMap: Record<string, string> = useMemo(() => ({
    overview: t("dashboard.command_center"),
    omnix: t("dashboard.ai_assistant_label", { defaultValue: "AI Assistant" }),
    agents: t("dashboard.agents_tab"),
    insights: t("dashboard.insights", { defaultValue: "Insights" }),
    settings: t("dashboard.settings"),
    library: t("dashboard.library", { defaultValue: "Library" }),
    integrations: t("dashboard.integrations", { defaultValue: "Integrations" }),
    "operations-center": t("dashboard.operations_center", { defaultValue: "Operações" }),
    empresa: t("dashboard.company", { defaultValue: "Empresa" }),
    kanban: t("dashboard.tasks_kanban", { defaultValue: "Tarefas" }),
    files: "Arquivos",
    approvals: "Aprovações",
    benchmarks: "Benchmarks",
    squads: "Squads",
    "neural-network": "Rede Neural",
    "agent-replay": "Agent Replay",
    predictive: "Predictive Dashboard",
    "agent-dna": "Agent DNA",
    "mission-composer": "Mission Composer",
    "war-room-live": "War Room Live",
    chat: selectedAgent?.name || "Chat",
    inbox: "Inbox",
  }), [t, selectedAgent]);

  const breadcrumbLabel = breadcrumbMap[activeSection] || activeSection;

  // ── Task submit handler ──
  const handleSubmitTask = useCallback((task: string, mode: string) => {
    if (mode === "strategic" || mode === "guided") {
      setPendingTaskMessage(task);
      setActiveSection("omnix");
    } else {
      const q = task.toLowerCase();
      const matchedSlug = agents.map(a => nameToSlug[a.name]).filter(Boolean).find(slug => q.includes(slug?.replace(/_/g, " ") || ""));
      if (matchedSlug) {
        const agent = agents.find(a => nameToSlug[a.name] === matchedSlug);
        if (agent) { setPreviousSection(activeSection); setSelectedAgent({ id: agent.id, name: agent.name }); setActiveSection("chat"); return; }
      }
      setPendingTaskMessage(task);
      setActiveSection("omnix");
    }
  }, [agents, nameToSlug, activeSection]);

  const handleSelectAgentBySlug = useCallback((slug: string) => {
    const agent = agents.find(a => nameToSlug[a.name] === slug);
    if (agent) { setPreviousSection(activeSection); setSelectedAgent({ id: agent.id, name: agent.name }); setActiveSection("chat"); }
    else setActiveSection("library");
  }, [agents, nameToSlug, activeSection]);

  const actualShowCompanyOnboarding = showCompanyOnboarding || showCompanyOnboardingPost;

  return (
    <>
      {showCelebration && postPaymentContext && (
        <PostPaymentCelebration
          agentName={postPaymentContext.agentName}
          isDepartment={postPaymentContext.isDepartment}
          agentCount={postPaymentContext.agentCount}
          onComplete={onCelebrationComplete}
        />
      )}

      {actualShowCompanyOnboarding && (
        <Suspense fallback={<SectionLoader />}>
          <CompanyOnboardingWizard
            onComplete={() => {
              setShowCompanyOnboarding(false);
              onCompanyOnboardingDone(
                !!postPaymentContext?.isDepartment && !!postPaymentContext?.departmentId,
                postPaymentContext?.departmentId
              );
              if (!postPaymentContext?.isDepartment || !postPaymentContext?.departmentId) setActiveSection("omnix");
            }}
            onSkip={() => {
              setShowCompanyOnboarding(false);
              onCompanyOnboardingDone(
                !!postPaymentContext?.isDepartment && !!postPaymentContext?.departmentId,
                postPaymentContext?.departmentId
              );
              if (!postPaymentContext?.isDepartment || !postPaymentContext?.departmentId) setActiveSection("omnix");
            }}
          />
        </Suspense>
      )}

      {showDeptSetup && postPaymentContext?.departmentId && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <Suspense fallback={<SectionLoader />}>
              <DepartmentSetup
                departmentId={postPaymentContext.departmentId}
                departmentName={postPaymentContext.agentName}
                onComplete={() => { onDeptSetupDone(); setActiveSection("omnix"); }}
                onSkip={() => { onDeptSetupDone(); setActiveSection("omnix"); }}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* QuickOnboardingWizard + MagicMomentCard + FirstAccessOnboarding removidos.
          Onboarding do primeiro contato: RevolutionaryOnboardingGate global (AppLayout). */}

      <CheckoutSummaryDialog data={checkoutSummary} onApprove={handleApprove} onCancel={cancelCheckout} />

      {diagnosisRecapData?.diagnosis && (
        <DiagnosisRecapDialog
          open={showDiagnosisRecap}
          diagnosis={diagnosisRecapData.diagnosis}
          briefing={diagnosisRecapData.briefing}
          siteSummary={diagnosisRecapData.siteSummary}
          onClose={handleRecapClose}
          onActivateDepartment={handleRecapActivate}
        />
      )}

      <OnboardingResumeBanner />

      <div className="flex h-full">
        <div className="hidden lg:block relative z-10">
          <DashboardSidebar items={sidebarItems} activeItem={activeSection} onItemChange={handleSidebarNav} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* THOR - stays mounted */}
          {omnixMounted && (
            <div className={activeSection === "omnix" ? "h-full" : "hidden"}>
              <Suspense fallback={<SectionLoader />}>
                <OmnixCommandCenter
                  postPaymentContext={postPaymentContext}
                  onPostPaymentHandled={clearPostPayment}
                  initialMessage={pendingTaskMessage || welcomeMessage}
                  onInitialMessageHandled={() => { setPendingTaskMessage(null); setWelcomeMessage(null); }}
                />
              </Suspense>
            </div>
          )}

          {/* Chat - empty state */}
          {activeSection === "chat" && !selectedAgent && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-xl font-semibold">{t("dashboard.select_agent_chat", { defaultValue: "Selecione um agente para conversar" })}</h2>
              <p className="text-sm text-muted-foreground max-w-sm">{t("dashboard.select_agent_chat_desc", { defaultValue: "Escolha um dos seus agentes na aba Agentes para iniciar uma conversa." })}</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveSection("agents")}>
                <Bot className="h-3.5 w-3.5" /> {t("dashboard.agents_tab")}
              </Button>
            </div>
          )}

          {/* Chat - with agent */}
          {activeSection === "chat" && selectedAgent && (
            <Suspense fallback={<SectionLoader />}>
              {needsBoardSetup ? (
                <CompanyBoardGate
                  agentName={selectedAgent.name}
                  onSetupCompany={() => setShowCompanyOnboarding(true)}
                  onSkip={() => { setBoardGateSkipped(true); if (user) localStorage.setItem(`clauthor_board_gate_skipped_${user.id}`, "true"); }}
                />
              ) : (
                <div className="h-full flex flex-col">
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/10 bg-background/50 backdrop-blur-sm">
                    <button onClick={handleBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                      <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span>{t("dashboard.back", { defaultValue: "Voltar" })}</span>
                    </button>
                    <span className="text-xs text-muted-foreground/40">•</span>
                    <span className="text-xs font-medium text-foreground">{selectedAgent.name}</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <AgentChat agentId={selectedAgent.id} agentName={selectedAgent.name} />
                  </div>
                </div>
              )}
            </Suspense>
          )}

          {/* Standard sections */}
          {activeSection !== "omnix" && activeSection !== "chat" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-6 space-y-5">
                <DashboardHeader locale={locale} remainingCredits={remainingCredits} credits={credits} />
                <MobileNavSheet sidebarItems={sidebarItems} activeSection={activeSection} breadcrumbLabel={breadcrumbLabel} onNavigate={handleSidebarNav} />


                {activeSection === "overview" && showEmptyState && (
                  <DashboardEmptyState
                    userName={user?.user_metadata?.full_name || user?.email || undefined}
                    onHireFirstDepartment={openRecapFromDashboard}
                    onExploreLibrary={() => setActiveSection("agents")}
                    onActivateRecommended={openRecapFromDashboard}
                  />
                )}

                {activeSection === "overview" && !showEmptyState && (
                  <>
                    {/* AmbientThorCard removido: HeroBriefing dentro de DashboardOverview
                        agora consolida greeting + status + CTA numa única voz. */}
                    <DashboardOverview
                    loadingAgents={loadingAgents}
                    boardCount={boardCount}
                    agents={agents}
                    activeAgents={activeAgents}
                    totalExecutions={totalExecutions}
                    totalTokensUsed={totalTokensUsed}
                    usagePercentage={usagePercentage}
                    estimatedSavings={estimatedSavings}
                    credits={credits}
                    remainingCredits={remainingCredits}
                    subscriptions={subscriptions}
                    recentLogs={recentLogs}
                    tokenUsage={tokenUsage}
                    nameToSlug={nameToSlug}
                    activeSection={activeSection}
                    onNavigate={handleSidebarNav}
                    onSetActiveSection={setActiveSection}
                    onTeach={() => setShowCompanyOnboarding(true)}
                    onHire={() => setActiveSection("library")}
                    onCommand={() => setActiveSection("omnix")}
                    onSubmitTask={handleSubmitTask}
                    onSelectAgentBySlug={handleSelectAgentBySlug}
                  />
                  </>
                )}

                <DashboardSectionRenderer
                  activeSection={activeSection}
                  realChartData={realChartData}
                  totalExecutions={totalExecutions}
                  recentLogs={recentLogs}
                  locale={locale}
                  agents={agents}
                  loadingAgents={loadingAgents}
                  nameToSlug={nameToSlug}
                  tierColors={tierColors}
                  formatCurrency={formatCurrency}
                  billingContent={
                    <SettingsBillingContent
                      credits={credits}
                      usagePercentage={usagePercentage}
                      remainingCredits={remainingCredits}
                      subscriptions={subscriptions}
                      locale={locale}
                      formatCurrency={formatCurrency}
                    />
                  }
                  onNavigate={handleSidebarNav}
                  onSetActiveSection={setActiveSection}
                  onSelectAgent={(agent) => { setSelectedAgent(agent); setActiveSection("chat"); }}
                  onSetupCompany={() => setShowCompanyOnboarding(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ThorLiveGuide is rendered globally by FloatingDock (bottom-center zone). */}


      {!hasPendingCheckout && !showEmptyState && (
        <Suspense fallback={null}>
          <QuickStartWizard
            isOpen={showQuickStart}
            onClose={() => setShowQuickStart(false)}
            onTeach={() => { setShowCompanyOnboarding(true); setShowQuickStart(false); }}
            onHire={() => { setActiveSection("library"); setShowQuickStart(false); }}
            onCommand={() => { setActiveSection("omnix"); setOmnixMounted(true); setShowQuickStart(false); }}
          />
        </Suspense>
      )}

      <MobileBottomNav activeSection={activeSection} onNavigate={handleSidebarNav} agentCount={agents.length || undefined} />
      {!hasPendingCheckout && !showEmptyState && <DashboardTour />}
    </>
  );
};

export default ClientDashboard;
