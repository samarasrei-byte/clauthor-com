import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, Activity, CreditCard,
  Sparkles, Plus, ArrowRight, Coins, Settings, Users, Building2, Brain, MessageSquare, Eye, BookOpen, Plug, ChevronDown, ChevronLeft, Loader2, Database, Star, Presentation,
  Rocket, Network, Target, Mic, Store, FileText, Cpu
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { SidebarItem, SidebarChild } from "@/components/dashboard/DashboardSidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import QuickActions from "@/components/dashboard/QuickActions";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import NotificationPanel from "@/components/dashboard/NotificationPanel";

import SmartOnboarding from "@/components/onboarding/SmartOnboarding";
const CompanyBoardAlert = lazy(() => import("@/components/dashboard/CompanyBoardAlert"));
const CompanyBoardGate = lazy(() => import("@/components/dashboard/CompanyBoardGate"));
const SmartAgentRouter = lazy(() => import("@/components/dashboard/SmartAgentRouter"));
const TaskRequestPanel = lazy(() => import("@/components/dashboard/TaskRequestPanel"));
const AgentCollaborationPanel = lazy(() => import("@/components/dashboard/AgentCollaborationPanel"));
const DepartmentSetup = lazy(() => import("@/components/dashboard/DepartmentSetup"));
const CompanyOnboardingWizard = lazy(() => import("@/components/dashboard/CompanyOnboardingWizard"));
const PendingActionsPanel = lazy(() => import("@/components/dashboard/PendingActionsPanel").then(m => ({ default: m.PendingActionsPanel })));
import PostPaymentCelebration from "@/components/dashboard/PostPaymentCelebration";
import { usePaypalCapture } from "@/hooks/usePaypalCapture";
import { useHireIntentFlow } from "@/hooks/useHireIntentFlow";
import { usePostPaymentFlow } from "@/hooks/usePostPaymentFlow";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";
import { agentIcons } from "@/data/libraryAgentData";
import HelpTooltip from "@/components/HelpTooltip";
import CheckoutSummaryDialog from "@/components/dashboard/CheckoutSummaryDialog";

// Lazy-load heavy section components — only loaded when the user navigates to them
const AgentChat = lazy(() => import("@/components/dashboard/AgentChat"));
const ClientCommandCenter = lazy(() => import("@/components/dashboard/ClientCommandCenter"));
const SquadChat = lazy(() => import("@/components/dashboard/SquadChat"));
const SettingsPage = lazy(() => import("@/components/dashboard/SettingsPage"));
const AgentsSection = lazy(() => import("@/components/dashboard/AgentsSection"));
const AnalyticsSection = lazy(() => import("@/components/dashboard/AnalyticsSection"));
const LogsSection = lazy(() => import("@/components/dashboard/LogsSection"));
const PaymentHistoryTable = lazy(() => import("@/components/dashboard/PaymentHistoryTable"));
const OmnixCommandCenter = lazy(() => import("@/pages/OmnixCommandCenter"));
const AgentLiveTimeline = lazy(() => import("@/components/dashboard/AgentLiveTimeline"));
const HolographicMeetingRoom = lazy(() => import("@/components/dashboard/HolographicMeetingRoom"));
const Library = lazy(() => import("./Library"));
const Integrations = lazy(() => import("./Integrations"));
const KnowledgeBase = lazy(() => import("./KnowledgeBase"));
const AIQualityDashboard = lazy(() => import("@/components/dashboard/AIQualityDashboard"));
const ComingSoonSection = lazy(() => import("@/components/dashboard/ComingSoonSection"));
const ExecutionResultsPanel = lazy(() => import("@/components/dashboard/ExecutionResultsPanel"));
import GuidedOnboarding from "@/components/dashboard/GuidedOnboarding";

const DashboardSkeleton = lazy(() => import("@/components/dashboard/DashboardSkeleton"));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const ClientDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("overview");
  const [previousSection, setPreviousSection] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [pendingTaskMessage, setPendingTaskMessage] = useState<string | null>(null);
  const [omnixMounted, setOmnixMounted] = useState(false);
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);
  const [showBoardGate, setShowBoardGate] = useState(false);

  // Redirect first-time user to THOR (concierge)
  useEffect(() => {
    if (!user) return;
    const key = `clauthor_concierge_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "true");
      setActiveSection("omnix");
      setOmnixMounted(true);
    }
  }, [user]);

  // Track when omnix is first visited so we can keep it mounted
  useEffect(() => {
    if (activeSection === "omnix" && !omnixMounted) {
      setOmnixMounted(true);
    }
  }, [activeSection, omnixMounted]);
  const [boardGateSkipped, setBoardGateSkipped] = useState(() => {
    if (!user) return false;
    return !!localStorage.getItem(`clauthor_board_gate_skipped_${user.id}`);
  });

  // Check if Company Board has data
  const { data: boardCount = 0 } = useQuery({
    queryKey: ["company-board-count-gate", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_board")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const needsBoardSetup = boardCount === 0 && !boardGateSkipped;

  // Extracted hooks for business logic
  const { checkoutSummary, handleConfirmCheckout, cancelCheckout } = useHireIntentFlow(user);
  const {
    postPaymentContext, showCelebration, showDeptSetup, showCompanyOnboarding,
    setShowCompanyOnboarding, onCelebrationComplete, onCompanyOnboardingDone,
    onDeptSetupDone, clearPostPayment,
  } = usePostPaymentFlow();

  // Show PostSignupOnboarding ONLY when there's no hireIntent (flow 4).
  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(`clauthor_onboarding_done_${user.id}`);
    if (done) return;

    const hasHireIntent = !!localStorage.getItem("hireIntent");

    if (hasHireIntent) {
      localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
    } else {
      // Flow 4: no selection → show SmartOnboarding instead of empty dashboard
      setShowSmartOnboarding(true);
    }
  }, [user]);
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
      const { data, error } = await supabase.from("execution_logs").select("*, agent:agents(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data.map((log: any) => ({
        id: log.id,
        agent_name: log.agent?.name || t("dashboard.ai_assistant"),
        action: log.action,
        status: log.status,
        execution_time_ms: log.execution_time_ms,
        created_at: log.created_at,
      }));
    },
    enabled: !!user,
  });

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

  // Human-readable group names — no developer jargon
  const mainGroup = t("dashboard.nav_main", { defaultValue: "Principal" });
  const agentsGroup = t("dashboard.nav_my_agents", { defaultValue: "Meus Agentes" });
  const moreGroup = t("dashboard.nav_more", { defaultValue: "Mais" });

  const sidebarItems: SidebarItem[] = [
    // Main — the 4 most important items
    { id: "overview", label: t("dashboard.command_center"), icon: LayoutDashboard, group: mainGroup },
    { id: "omnix", label: t("dashboard.ai_assistant_label", { defaultValue: "Assistente IA" }), icon: Brain, group: mainGroup },
    { id: "agents", label: t("dashboard.agents_tab"), icon: Bot, badge: agents.length || undefined, group: mainGroup },
    ...(chatSidebarItem ? [chatSidebarItem] : []),

    // My Agents — departments + solo
    { id: "library", label: t("dashboard.library", { defaultValue: "Biblioteca" }), icon: BookOpen, group: agentsGroup },
    ...departmentSidebarItems,
    ...soloAgentItems,

    // More — secondary features grouped together
    { id: "equipe", label: t("dashboard.team_label", { defaultValue: "Team" }), icon: Users, group: moreGroup },
    { id: "war-room", label: t("dashboard.war_room", { defaultValue: "Meeting Room" }), icon: Presentation, group: moreGroup },
    { id: "knowledge-base", label: t("dashboard.knowledge_base", { defaultValue: "Knowledge Base" }), icon: Database, group: moreGroup },
    { id: "ai-quality", label: t("dashboard.ai_quality", { defaultValue: "AI Quality" }), icon: Star, group: moreGroup },
    { id: "results", label: t("dashboard.results", { defaultValue: "Results" }), icon: FileText, group: moreGroup },
    { id: "live-timeline", label: t("dashboard.live_timeline", { defaultValue: "Timeline" }), icon: Eye, group: moreGroup },
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrations" }), icon: Plug, group: moreGroup },
    { id: "analytics", label: t("dashboard.analytics"), icon: BarChart3, group: moreGroup },
    { id: "logs", label: t("dashboard.logs"), icon: Activity, group: moreGroup },
    { id: "control-tower", label: "Control Tower", icon: Cpu, group: moreGroup },
    { id: "settings", label: t("dashboard.settings"), icon: Settings, group: moreGroup },

    // Coming soon features
    { id: "mission-control", label: "Mission Control", icon: Rocket, badge: t("dashboard.coming_soon", { defaultValue: "Coming soon" }), group: t("dashboard.nav_upcoming", { defaultValue: "🚀 Upcoming" }) },
    { id: "agent-memory", label: "Agent Memory", icon: Network, badge: t("dashboard.coming_soon", { defaultValue: "Coming soon" }), group: t("dashboard.nav_upcoming", { defaultValue: "🚀 Upcoming" }) },
    { id: "autonomous-goals", label: "Autonomous Goals", icon: Target, badge: t("dashboard.coming_soon", { defaultValue: "Coming soon" }), group: t("dashboard.nav_upcoming", { defaultValue: "🚀 Upcoming" }) },
    { id: "voice-first", label: "Voice-First", icon: Mic, badge: t("dashboard.coming_soon", { defaultValue: "Coming soon" }), group: t("dashboard.nav_upcoming", { defaultValue: "🚀 Upcoming" }) },
    { id: "marketplace-p2p", label: "Marketplace P2P", icon: Store, badge: t("dashboard.coming_soon", { defaultValue: "Coming soon" }), group: t("dashboard.nav_upcoming", { defaultValue: "🚀 Upcoming" }) },
  ];

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-accent/15 text-accent-foreground",
    advanced: "bg-accent-emerald/15 text-accent-emerald",
    enterprise: "bg-primary/15 text-primary",
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(value / 100);
  };

  const handleSidebarNav = (id: string) => {
    if (id.startsWith("agent-chat-")) {
      const agentId = id.replace("agent-chat-", "");
      const agent = agents.find(a => a.id === agentId);
      if (agent) { setPreviousSection(activeSection); setSelectedAgent({ id: agent.id, name: agent.name }); setActiveSection("chat"); return; }
    }
    if (id === "chat") { setPreviousSection(activeSection); }
    setActiveSection(id);
  };

  const handleBack = () => {
    setActiveSection(previousSection || "overview");
    setPreviousSection(null);
  };

  const breadcrumbMap: Record<string, string> = useMemo(() => ({
    results: t("dashboard.results", { defaultValue: "Results" }),
    overview: t("dashboard.command_center"),
    omnix: t("dashboard.ai_assistant_label", { defaultValue: "AI Assistant" }),
    agents: t("dashboard.agents_tab"),
    analytics: t("dashboard.analytics"),
    logs: t("dashboard.logs"),
    settings: t("dashboard.settings"),
    library: t("dashboard.library", { defaultValue: "Library" }),
    integrations: t("dashboard.integrations", { defaultValue: "Integrations" }),
    "knowledge-base": t("dashboard.knowledge_base", { defaultValue: "Knowledge Base" }),
    "ai-quality": t("dashboard.ai_quality", { defaultValue: "AI Quality" }),
    "war-room": t("dashboard.war_room", { defaultValue: "Meeting Room" }),
    "live-timeline": t("dashboard.live_timeline", { defaultValue: "Timeline" }),
    chat: selectedAgent?.name || "Chat",
  }), [t, selectedAgent]);

  const breadcrumbLabel = breadcrumbMap[activeSection] || activeSection;

  // Flatten sidebar for mobile (including children)
  const flatMobileItems = useMemo(() => {
    const flat: { id: string; label: string; icon: React.ElementType; group?: string; badge?: string | number }[] = [];
    for (const item of sidebarItems) {
      if (item.children && item.children.length > 0) {
        // Add parent as a header-like item, then children
        for (const child of item.children) {
          flat.push({ id: child.id, label: `${item.label} › ${child.label}`, icon: child.icon || Bot, group: item.group });
        }
      } else {
        flat.push({ id: item.id, label: item.label, icon: item.icon, group: item.group, badge: item.badge });
      }
    }
    return flat;
  }, [sidebarItems]);

  return (
    <>
      {/* Post-payment celebration animation */}
      {showCelebration && postPaymentContext && (
        <PostPaymentCelebration
          agentName={postPaymentContext.agentName}
          isDepartment={postPaymentContext.isDepartment}
          agentCount={postPaymentContext.agentCount}
          onComplete={onCelebrationComplete}
        />
      )}

      {/* Company Onboarding — teach agents about the business */}
      {showCompanyOnboarding && (
        <Suspense fallback={<SectionLoader />}>
          <CompanyOnboardingWizard
            onComplete={() => {
              onCompanyOnboardingDone(
                !!postPaymentContext?.isDepartment && !!postPaymentContext?.departmentId,
                postPaymentContext?.departmentId
              );
              if (!postPaymentContext?.isDepartment || !postPaymentContext?.departmentId) {
                setActiveSection("omnix");
              }
            }}
            onSkip={() => {
              onCompanyOnboardingDone(
                !!postPaymentContext?.isDepartment && !!postPaymentContext?.departmentId,
                postPaymentContext?.departmentId
              );
              if (!postPaymentContext?.isDepartment || !postPaymentContext?.departmentId) {
                setActiveSection("omnix");
              }
            }}
          />
        </Suspense>
      )}

      {/* Department Setup after company onboarding */}
      {showDeptSetup && postPaymentContext?.departmentId && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <Suspense fallback={<SectionLoader />}>
              <DepartmentSetup
                departmentId={postPaymentContext.departmentId}
                departmentName={postPaymentContext.agentName}
                onComplete={() => {
                  onDeptSetupDone();
                  setActiveSection("omnix");
                }}
                onSkip={() => {
                  onDeptSetupDone();
                  setActiveSection("omnix");
                }}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Flow 4: No hireIntent → show SmartOnboarding wizard instead of empty dashboard */}
      {showSmartOnboarding && (
        <SmartOnboarding 
          isOpen={showSmartOnboarding} 
          onClose={() => {
            setShowSmartOnboarding(false);
            if (user) localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
          }} 
        />
      )}

      <CheckoutSummaryDialog
        data={checkoutSummary}
        onConfirm={handleConfirmCheckout}
        onCancel={cancelCheckout}
      />

      <div className="flex h-full">
        <div className="hidden lg:block">
          <DashboardSidebar items={sidebarItems} activeItem={activeSection} onItemChange={handleSidebarNav} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* ═══ IMMERSIVE MODE — THOR stays mounted to preserve chat history ═══ */}
          {omnixMounted && (
            <div className={activeSection === "omnix" ? "h-full" : "hidden"}>
              <Suspense fallback={<SectionLoader />}>
                <OmnixCommandCenter postPaymentContext={postPaymentContext} onPostPaymentHandled={clearPostPayment} initialMessage={pendingTaskMessage} onInitialMessageHandled={() => setPendingTaskMessage(null)} />
              </Suspense>
            </div>
          )}

          {activeSection === "chat" && selectedAgent && (
            <Suspense fallback={<SectionLoader />}>
              {needsBoardSetup ? (
                <CompanyBoardGate
                  agentName={selectedAgent.name}
                  onSetupCompany={() => setShowCompanyOnboarding(true)}
                  onSkip={() => {
                    setBoardGateSkipped(true);
                    if (user) localStorage.setItem(`clauthor_board_gate_skipped_${user.id}`, "true");
                  }}
                />
              ) : (
                <div className="h-full flex flex-col">
                  {/* Slim back bar */}
                  <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border/10 bg-background/50 backdrop-blur-sm">
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    >
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

          {/* ═══ STANDARD MODE — padded content with header ═══ */}
          {activeSection !== "omnix" && activeSection !== "chat" && (
            <div className="h-full overflow-y-auto">
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-20 lg:pb-6 space-y-6">
                {/* Breadcrumb + Header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                    <span>Dashboard</span><span>/</span>
                    <span className="text-foreground/80 font-medium capitalize">{breadcrumbLabel}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="font-display text-2xl font-bold">
                          {(() => {
                            const hour = new Date().getHours();
                            const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t("dashboard.control_panel");
                            if (hour < 12) return t("dashboard.good_morning", { defaultValue: "Bom dia, {{name}} ☀️", name: firstName });
                            if (hour < 18) return t("dashboard.good_afternoon", { defaultValue: "Boa tarde, {{name}} 👋", name: firstName });
                            return t("dashboard.good_evening", { defaultValue: "Boa noite, {{name}} 🌙", name: firstName });
                          })()}
                        </h1>
                        <HelpTooltip id="dashboard-intro" text={t("dashboard.help_intro", { defaultValue: "Este é seu painel de controle. Use a sidebar à esquerda para navegar entre seções." })} position="bottom" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span>
                        {credits && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">
                            {remainingCredits.toLocaleString(locale)} {t("dashboard.credits_short", { defaultValue: "créditos" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <NotificationPanel />
                      <QuickActions />
                    </div>
                  </div>
                </motion.div>

                {/* Mobile nav */}
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-xs w-full justify-start border-border/30">
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">{breadcrumbLabel}</span>
                        <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                      <SheetHeader className="p-4 border-b border-border/10">
                        <SheetTitle className="font-display text-sm">{t("dashboard.navigation", { defaultValue: "Navegação" })}</SheetTitle>
                      </SheetHeader>
                      {flatMobileItems.length > 8 && (
                        <div className="px-3 pt-3">
                          <input
                            type="text"
                            placeholder={t("dashboard.search_nav", { defaultValue: "Buscar..." })}
                            className="w-full h-8 px-3 text-xs rounded-lg bg-muted/30 border border-border/20 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase();
                              const items = document.querySelectorAll("[data-mobile-nav-item]");
                              items.forEach((el) => {
                                const text = el.getAttribute("data-label")?.toLowerCase() || "";
                                (el as HTMLElement).style.display = text.includes(val) ? "" : "none";
                              });
                            }}
                          />
                        </div>
                      )}
                      <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
                        {flatMobileItems.map((item, idx) => {
                          const showGroup = item.group && (idx === 0 || flatMobileItems[idx - 1]?.group !== item.group);
                          const isActive = activeSection === item.id || (item.id.startsWith("agent-chat-") && activeSection === "chat");
                          return (
                            <div key={item.id} data-mobile-nav-item data-label={item.label}>
                              {showGroup && (
                                <div className="px-3 pt-4 pb-1.5 first:pt-1">
                                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{item.group}</span>
                                </div>
                              )}
                              <SheetClose asChild>
                                <button
                                  onClick={() => handleSidebarNav(item.id)}
                                  className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                                    isActive
                                      ? "bg-primary/10 text-primary font-medium border border-primary/15"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                  )}
                                >
                                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                                  <span className="flex-1 text-left truncate">{item.label}</span>
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                  {item.badge && !isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">{item.badge}</span>}
                                </button>
                              </SheetClose>
                            </div>
                          );
                        })}
                      </nav>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Loading state */}
                {loadingAgents && activeSection === "overview" && (
                  <Suspense fallback={<SectionLoader />}><DashboardSkeleton /></Suspense>
                )}

                {/* ═══ OVERVIEW ═══ */}
                {activeSection === "overview" && (
                  <ErrorBoundary>
                    <Suspense fallback={<SectionLoader />}>
                      <div className="space-y-4">
                        <GuidedOnboarding
                          hasCompanyData={boardCount > 0}
                          hasAgents={agents.length > 0}
                          hasSentCommand={recentLogs.length > 0}
                          onTeach={() => setShowCompanyOnboarding(true)}
                          onHire={() => setActiveSection("library")}
                          onCommand={() => setActiveSection("overview")}
                          onDismiss={() => {}}
                        />
                        <CompanyBoardAlert onSetup={() => setShowCompanyOnboarding(true)} />
                        
                        {/* Smart task entry — simple or strategic modes */}
                        <TaskRequestPanel
                          contractedAgentSlugs={agents.map(a => nameToSlug[a.name]).filter(Boolean)}
                          onSubmitTask={(task, mode) => {
                            // Strategic mode → send to THOR/Omnix for orchestration
                            if (mode === "strategic" || mode === "guided") {
                              setPendingTaskMessage(task);
                              setActiveSection("omnix");
                            } else {
                              // Simple mode — try to match an agent
                              const q = task.toLowerCase();
                              const matchedSlug = agents
                                .map(a => nameToSlug[a.name])
                                .filter(Boolean)
                                .find(slug => q.includes(slug?.replace(/_/g, " ") || ""));
                              if (matchedSlug) {
                                const agent = agents.find(a => nameToSlug[a.name] === matchedSlug);
                                if (agent) {
                                  setPreviousSection(activeSection);
                                  setSelectedAgent({ id: agent.id, name: agent.name });
                                  setActiveSection("chat");
                                  return;
                                }
                              }
                              // Fallback to THOR
                              setPendingTaskMessage(task);
                              setActiveSection("omnix");
                            }
                          }}
                          onSelectAgent={(slug) => {
                            const agent = agents.find(a => nameToSlug[a.name] === slug);
                            if (agent) {
                              setPreviousSection(activeSection);
                              setSelectedAgent({ id: agent.id, name: agent.name });
                              setActiveSection("chat");
                            } else {
                              setActiveSection("library");
                            }
                          }}
                        />
                        
                        {/* Quick router for direct agent access */}
                        <SmartAgentRouter
                          contractedAgentSlugs={agents.map(a => nameToSlug[a.name]).filter(Boolean)}
                          onSelectAgent={(slug) => {
                            const agent = agents.find(a => nameToSlug[a.name] === slug);
                            if (agent) {
                              setPreviousSection(activeSection);
                              setSelectedAgent({ id: agent.id, name: agent.name });
                              setActiveSection("chat");
                            } else {
                              setActiveSection("library");
                            }
                          }}
                          onAskThor={() => setActiveSection("omnix")}
                        />
                        
                        <PendingActionsPanel />
                        <ClientCommandCenter
                          activeAgents={activeAgents} totalExecutions={totalExecutions} totalTokensUsed={totalTokensUsed}
                          usagePercentage={usagePercentage} estimatedSavings={estimatedSavings} credits={credits}
                          remainingCredits={remainingCredits} agents={agents} subscriptions={subscriptions}
                          recentLogs={recentLogs} tokenUsage={tokenUsage} onNavigate={handleSidebarNav}
                        />
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                )}

                {/* ═══ EQUIPE (AGENT CONTACTS) ═══ */}
                {activeSection === "equipe" && (
                  <Suspense fallback={<SectionLoader />}>
                    <SquadChat agents={agents} onRequestAgent={(name) => handleSidebarNav("library")} />
                  </Suspense>
                )}

                {/* ═══ INTEGRATIONS ═══ */}
                {activeSection === "integrations" && <Suspense fallback={<SectionLoader />}><Integrations /></Suspense>}

                {/* ═══ KNOWLEDGE BASE ═══ */}
                {activeSection === "knowledge-base" && <Suspense fallback={<SectionLoader />}><KnowledgeBase /></Suspense>}

                {/* ═══ AI QUALITY ═══ */}
                {activeSection === "ai-quality" && <Suspense fallback={<SectionLoader />}><AIQualityDashboard /></Suspense>}

                {/* ═══ EXECUTION RESULTS ═══ */}
                {activeSection === "results" && (
                  <Suspense fallback={<SectionLoader />}>
                    <ExecutionResultsPanel onNavigate={handleSidebarNav} />
                  </Suspense>
                )}

                {/* ═══ SETTINGS ═══ */}
                {activeSection === "settings" && (
                  <Suspense fallback={<SectionLoader />}>
                    <SettingsPage billingContent={
                      <div className="space-y-6">
                        <h2 className="font-display text-xl font-bold">{t("dashboard.subscription_credits")}</h2>
                        <div className="grid lg:grid-cols-2 gap-6">
                          <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3">
                              <Coins className="h-5 w-5 text-primary" />
                              <h3 className="font-display font-semibold">{t("dashboard.credits_label")}</h3>
                              <Badge variant="secondary">{credits?.plan_type || "free"}</Badge>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>{credits?.used_credits?.toLocaleString(locale) || 0} {t("dashboard.used_label")}</span>
                                <span>{credits?.total_credits?.toLocaleString(locale) || 0} {t("dashboard.total_label")}</span>
                              </div>
                              <Progress value={usagePercentage} className="h-3" />
                              <p className="text-xs text-muted-foreground mt-2">{t("dashboard.pct_remaining", { pct: 100 - usagePercentage })}</p>
                            </div>
                            <TokenUpgradeDialog trigger={<Button className="w-full glow">{t("dashboard.token_upgrade")} <ArrowRight className="h-4 w-4 ml-2" /></Button>} />
                          </div>
                          <div className="glass-card rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-primary" />
                              <h3 className="font-display font-semibold">{t("dashboard.active_subscriptions")}</h3>
                            </div>
                            {subscriptions.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.no_subscriptions")}</p>
                            ) : (
                              <div className="space-y-2">
                                {subscriptions.map((sub) => (
                                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/5">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-primary" />
                                      <span className="text-sm">{sub.agent_name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{formatCurrency(sub.monthly_price)}/{t("dashboard.per_month_short", { defaultValue: "mo" })}</span>
                                  </div>
                                ))}
                                <div className="pt-3 border-t border-border/10 flex justify-between">
                                  <span className="text-sm font-medium">{t("dashboard.monthly_total")}</span>
                                  <span className="font-display font-bold gradient-text">{formatCurrency(subscriptions.reduce((a, s) => a + s.monthly_price, 0))}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Suspense fallback={<SectionLoader />}><PaymentHistoryTable /></Suspense>
                      </div>
                    } />
                  </Suspense>
                )}

                {/* ═══ WAR ROOM — Unified Meeting Room ═══ */}
                {activeSection === "war-room" && <Suspense fallback={<SectionLoader />}><HolographicMeetingRoom /></Suspense>}

                {/* ═══ LIVE TIMELINE ═══ */}
                {activeSection === "live-timeline" && <Suspense fallback={<SectionLoader />}><AgentLiveTimeline /></Suspense>}

                {/* ═══ LIBRARY ═══ */}
                {activeSection === "library" && <Suspense fallback={<SectionLoader />}><Library /></Suspense>}

                {/* ═══ AGENTS ═══ */}
                {activeSection === "agents" && (
                  <Suspense fallback={<SectionLoader />}>
                    <AgentsSection
                      agents={agents}
                      isLoading={loadingAgents}
                      nameToSlug={nameToSlug}
                      tierColors={tierColors}
                      formatCurrency={formatCurrency}
                      onOpenLibrary={() => setActiveSection("library")}
                      onOpenThor={() => setActiveSection("omnix")}
                      onOpenChat={(agent) => { setSelectedAgent(agent); setActiveSection("chat"); }}
                    />
                  </Suspense>
                )}

                {/* ═══ ANALYTICS ═══ */}
                {activeSection === "analytics" && (
                  <Suspense fallback={<SectionLoader />}>
                    <AnalyticsSection
                      chartData={realChartData}
                      totalExecutions={totalExecutions}
                      recentLogs={recentLogs}
                      locale={locale}
                      onGoToAgents={() => setActiveSection("agents")}
                    />
                  </Suspense>
                )}

                {/* ═══ LOGS ═══ */}
                {activeSection === "logs" && (
                  <Suspense fallback={<SectionLoader />}>
                    <LogsSection
                      recentLogs={recentLogs}
                      locale={locale}
                      onGoToAgents={() => setActiveSection("agents")}
                    />
                  </Suspense>
                )}

                {/* ═══ CONTROL TOWER ═══ */}
                {activeSection === "control-tower" && (
                  <Suspense fallback={<SectionLoader />}>
                    <ControlTowerSection />
                  </Suspense>
                )}

                {/* ═══ COMING SOON FEATURES ═══ */}
                {["mission-control", "agent-memory", "autonomous-goals", "voice-first", "marketplace-p2p"].includes(activeSection) && (
                  <ComingSoonSection feature={activeSection} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent mobile bottom navigation */}
      <MobileBottomNav
        activeSection={activeSection}
        onNavigate={handleSidebarNav}
        agentCount={agents.length || undefined}
      />
    </>
  );
};

export default ClientDashboard;
