import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, CreditCard,
  Sparkles, Settings, Brain, MessageSquare, Plug, ChevronLeft,
  Building2, KanbanSquare, Layers3,
  Clock, Radar, Orbit, Inbox, Rewind, TrendingUp, Dna, Workflow, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { SidebarItem, SidebarChild } from "@/components/dashboard/DashboardSidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileNavSheet from "@/components/dashboard/MobileNavSheet";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardSectionRenderer from "@/components/dashboard/DashboardSectionRenderer";
import SettingsBillingContent from "@/components/dashboard/SettingsBillingContent";

import QuickOnboardingWizard from "@/components/onboarding/QuickOnboardingWizard";
import { DashboardTour } from "@/components/dashboard/DashboardTour";
const CompanyBoardGate = lazy(() => import("@/components/dashboard/CompanyBoardGate"));
const DepartmentSetup = lazy(() => import("@/components/dashboard/DepartmentSetup"));
const CompanyOnboardingWizard = lazy(() => import("@/components/dashboard/CompanyOnboardingWizard"));
import PostPaymentCelebration from "@/components/dashboard/PostPaymentCelebration";
import { usePaypalCapture } from "@/hooks/usePaypalCapture";
import { useHireIntentFlow } from "@/hooks/useHireIntentFlow";
import { usePostPaymentFlow } from "@/hooks/usePostPaymentFlow";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";
import { TIER_COLORS as tierColors } from "@/lib/tier-colors";
import { agentIcons } from "@/data/libraryAgentData";
import CheckoutSummaryDialog from "@/components/dashboard/CheckoutSummaryDialog";
import SectionLoader from "@/components/ui/section-loader";

const lazyRetry = (fn: () => Promise<any>) => lazy(() => fn().catch(() => {
  window.location.reload();
  return fn();
}));

const AgentChat = lazyRetry(() => import("@/components/dashboard/AgentChat"));
const OmnixCommandCenter = lazyRetry(() => import("@/pages/OmnixCommandCenter"));
const ThorLiveGuide = lazyRetry(() => import("@/components/dashboard/ThorLiveGuide"));
const QuickStartWizard = lazy(() => import("@/components/dashboard/QuickStartWizard"));

const ClientDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");
  const [previousSection, setPreviousSection] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [pendingTaskMessage, setPendingTaskMessage] = useState<string | null>(null);
  const [omnixMounted, setOmnixMounted] = useState(false);
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);
  const [showBoardGate, setShowBoardGate] = useState(false);
  const [showLiveGuide, setShowLiveGuide] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("clauthor_live_guide_dismissed");
  });
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [boardGateSkipped, setBoardGateSkipped] = useState(() => {
    if (!user) return false;
    return !!localStorage.getItem(`clauthor_board_gate_skipped_${user.id}`);
  });

  // ── First-time redirect to THOR ──
  useEffect(() => {
    if (!user) return;
    const key = `clauthor_concierge_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "true");
      setActiveSection("omnix");
      setOmnixMounted(true);
      const hireIntent = localStorage.getItem("hireIntent");
      let parsed: { agentName?: string; isDepartment?: boolean; agentCount?: number } | null = null;
      try { parsed = hireIntent ? JSON.parse(hireIntent) : null; } catch {}
      if (parsed?.isDepartment && parsed.agentName) {
        setWelcomeMessage(`Acabei de entrar na plataforma e escolhi o departamento ${parsed.agentName} com ${parsed.agentCount || 'vários'} agentes. Me dê boas-vindas, explique o que esse departamento pode fazer por mim e me guie nos próximos passos.`);
      } else if (parsed?.agentName) {
        setWelcomeMessage(`Acabei de entrar na plataforma e escolhi o agente ${parsed.agentName}. Me dê boas-vindas, explique o que esse agente faz e me ajude a configurá-lo.`);
      } else {
        setWelcomeMessage(`Sou um novo usuário na plataforma. Me dê boas-vindas, se apresente como Thor (o CEO e orquestrador de todos os agentes) e me guie: explique os 3 passos (Ensinar, Contratar e Comandar) de forma simples e pergunte como posso te ajudar.`);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === "omnix" && !omnixMounted) setOmnixMounted(true);
  }, [activeSection, omnixMounted]);

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
  const { data: profileOnboarding } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("onboarding_completed").eq("user_id", user!.id).maybeSingle();
      return data?.onboarding_completed ?? false;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!user || profileOnboarding === undefined) return;
    if (profileOnboarding) return;
    const hasHireIntent = !!localStorage.getItem("hireIntent");
    const thorHandledOnboarding = !!localStorage.getItem(`clauthor_concierge_seen_${user.id}`);
    if (!hasHireIntent && !thorHandledOnboarding) {
      setShowSmartOnboarding(true);
    }
  }, [user, profileOnboarding]);

  const { credits, remainingCredits, usagePercentage } = useCredits();
  usePaypalCapture();
  const { data: tokenUsage = [] } = useTokenUsage();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["agent-templates-slugs"],
    queryFn: async () => {
      const { data } = await supabase.from("agent_templates").select("name, slug").eq("is_active", true);
      return data || [];
    },
    staleTime: Infinity,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, agent:agents(*)").eq("user_id", user!.id).eq("status", "active");
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
    id: "chat", label: selectedAgent.name, icon: MessageSquare, group: t("dashboard.nav_main", { defaultValue: "Principal" }),
  } : null;

  const mainGroup = t("dashboard.nav_main", { defaultValue: "Principal" });
  const advancedGroup = t("dashboard.nav_advanced", { defaultValue: "Ferramentas Avançadas" });
  const systemGroup = t("dashboard.nav_system", { defaultValue: "Sistema" });

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: t("dashboard.command_center"), icon: LayoutDashboard, group: mainGroup },
    { id: "agents", label: t("dashboard.agents_tab"), icon: Bot, badge: agents.length || undefined, group: mainGroup },
    { id: "chat", label: "Chat", icon: MessageSquare, group: mainGroup },
    ...(chatSidebarItem && selectedAgent ? [{ ...chatSidebarItem, id: `agent-chat-active`, label: `· ${selectedAgent.name}`, group: mainGroup }] : []),
    { id: "insights", label: t("dashboard.insights", { defaultValue: "Relatórios" }), icon: BarChart3, group: mainGroup },
    ...departmentSidebarItems,
    ...soloAgentItems,
    { id: "omnix", label: "THOR", icon: Brain, badge: "PRO", group: advancedGroup },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: "NOVO", group: advancedGroup },
    { id: "squads", label: "Squads", icon: Layers3, group: advancedGroup },
    { id: "empresa", label: t("dashboard.company", { defaultValue: "Empresa" }), icon: Building2, group: advancedGroup },
    { id: "kanban", label: t("dashboard.tasks_kanban", { defaultValue: "Tarefas" }), icon: KanbanSquare, group: advancedGroup },
    { id: "neural-network", label: "Rede Neural", icon: Orbit, badge: "PRO", group: advancedGroup },
    { id: "war-room-live", label: "War Room", icon: Radio, badge: "PRO", group: advancedGroup },
    { id: "agent-replay", label: "Agent Replay", icon: Rewind, badge: "NOVO", group: advancedGroup },
    { id: "predictive", label: "Preditivo", icon: TrendingUp, badge: "PRO", group: advancedGroup },
    { id: "agent-dna", label: "Agent DNA", icon: Dna, badge: "NOVO", group: advancedGroup },
    { id: "mission-composer", label: "Composer", icon: Workflow, badge: "PRO", group: advancedGroup },
    { id: "operations-center", label: t("dashboard.operations_center", { defaultValue: "Operações" }), icon: Radar, badge: pendingTaskCount || undefined, group: systemGroup },
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrações" }), icon: Plug, group: systemGroup },
    { id: "settings", label: t("dashboard.settings"), icon: Settings, group: systemGroup },
  ];

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

      {showSmartOnboarding && (
        <QuickOnboardingWizard
          isOpen={showSmartOnboarding}
          onComplete={(agentSlug) => {
            setShowSmartOnboarding(false);
            queryClient.invalidateQueries({ queryKey: ["profile-onboarding"] });
            if (agentSlug) {
              // Navigate to the agent chat or library
              const agent = agents.find(a => nameToSlug[a.name] === agentSlug);
              if (agent) {
                setPreviousSection(activeSection);
                setSelectedAgent({ id: agent.id, name: agent.name });
                setActiveSection("chat");
              } else {
                setActiveSection("library");
              }
            }
          }}
        />
      )}

      <CheckoutSummaryDialog data={checkoutSummary} onApprove={handleApprove} onCancel={cancelCheckout} />

      <div className="flex h-full">
        <div className="hidden lg:block relative z-10">
          <DashboardSidebar items={sidebarItems} activeItem={activeSection} onItemChange={handleSidebarNav} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* THOR — stays mounted */}
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

          {/* Chat — empty state */}
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

          {/* Chat — with agent */}
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

                {activeSection === "overview" && (
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

      {showLiveGuide && (
        <Suspense fallback={null}>
          <ThorLiveGuide
            activeSection={activeSection}
            onNavigate={handleSidebarNav}
            onDismiss={() => { setShowLiveGuide(false); localStorage.setItem("clauthor_live_guide_dismissed", "true"); }}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <QuickStartWizard
          isOpen={showQuickStart}
          onClose={() => setShowQuickStart(false)}
          onTeach={() => { setShowCompanyOnboarding(true); setShowQuickStart(false); }}
          onHire={() => { setActiveSection("library"); setShowQuickStart(false); }}
          onCommand={() => { setActiveSection("omnix"); setOmnixMounted(true); setShowQuickStart(false); }}
        />
      </Suspense>

      <MobileBottomNav activeSection={activeSection} onNavigate={handleSidebarNav} agentCount={agents.length || undefined} />
      <DashboardTour />
    </>
  );
};

export default ClientDashboard;
