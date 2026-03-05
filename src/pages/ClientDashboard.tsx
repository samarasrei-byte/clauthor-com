import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, Activity, CreditCard,
  Sparkles, Plus, ArrowRight, Coins, Settings, Users, Building2, Brain, MessageSquare, Eye, BookOpen, Plug, ChevronDown, ChevronLeft, Loader2
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { lazy, Suspense } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { SidebarItem, SidebarChild } from "@/components/dashboard/DashboardSidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import QuickActions from "@/components/dashboard/QuickActions";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import NotificationPanel from "@/components/dashboard/NotificationPanel";

import SmartOnboarding from "@/components/onboarding/SmartOnboarding";
const DepartmentSetup = lazy(() => import("@/components/dashboard/DepartmentSetup"));
import PostPaymentCelebration from "@/components/dashboard/PostPaymentCelebration";
import { usePaypalCapture } from "@/hooks/usePaypalCapture";
import { SLUG_TO_DEPT, DEPARTMENTS } from "@/data/departmentMap";
import { agentIcons } from "@/data/libraryAgentData";
import type { HireIntent } from "./Auth";
import HelpTooltip from "@/components/HelpTooltip";
import { getRegion, getPrice, formatPrice } from "@/lib/pricing";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";

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
const Library = lazy(() => import("./Library"));
const Integrations = lazy(() => import("./Integrations"));

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
  const hireProcessed = useRef(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [previousSection, setPreviousSection] = useState<string | null>(null);

  // Redirect first-time user to THOR (concierge)
  useEffect(() => {
    if (!user) return;
    const key = `clauthor_concierge_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "true");
      setActiveSection("omnix");
    }
  }, [user]);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);

  // Show PostSignupOnboarding ONLY when there's no hireIntent (flow 4).
  // Flows 1-3 skip it and go straight to CheckoutSummaryDialog.
  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(`clauthor_onboarding_done_${user.id}`);
    if (done) return;

    const hasHireIntent = !!sessionStorage.getItem("hireIntent");

    if (hasHireIntent) {
      // Flows 1-3: user already selected agents → skip onboarding, mark as done, proceed to checkout
      localStorage.setItem(`clauthor_onboarding_done_${user.id}`, "true");
    } else {
      // Flow 4: no selection → show SmartOnboarding instead of empty dashboard
      setShowSmartOnboarding(true);
    }
  }, [user]);
  const { credits, remainingCredits, usagePercentage } = useCredits();
  usePaypalCapture();
  const { data: tokenUsage = [] } = useTokenUsage();

  const [postPaymentContext, setPostPaymentContext] = useState<{ agentName: string; isDepartment: boolean; agentCount: number; departmentId?: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showDeptSetup, setShowDeptSetup] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryData | null>(null);
  const [pendingCheckoutIntent, setPendingCheckoutIntent] = useState<{ intent: HireIntent; uniqueSlugs: string[] } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("clauthor_post_payment_onboarding");
    if (!raw) return;
    sessionStorage.removeItem("clauthor_post_payment_onboarding");
    try {
      setPostPaymentContext(JSON.parse(raw));
      setShowCelebration(true);
    } catch { /* ignore */ }
  }, []);

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

  // Increased limit to 200 for better analytics charts
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

  // Auto-hire from sessionStorage intent → show checkout summary immediately (no onboarding gate for flows 1-3)
  useEffect(() => {
    if (!user || hireProcessed.current) return;
    const raw = sessionStorage.getItem("hireIntent");
    if (!raw) return;
    hireProcessed.current = true;
    sessionStorage.removeItem("hireIntent");
    const intent: HireIntent = JSON.parse(raw);
    if (!intent.slugs || intent.slugs.length === 0) return;

    const uniqueSlugs = [...new Set(intent.slugs)];
    const lang = i18n.language || "pt";
    const region = getRegion(lang);
    const isDepartment = intent.type === "department" || uniqueSlugs.length > 1;

    let price: number;
    let deptId: string | undefined;

    if (isDepartment) {
      deptId = (intent as any).departmentId || SLUG_TO_DEPT[uniqueSlugs[0]] || "comercial";
      price = (region.departments as Record<string, number>)[deptId] || region.departments.comercial;
    } else {
      const slug = uniqueSlugs[0];
      const agentPriceTierMap: Record<string, string> = {
        sdr_outbound: "entry", sales: "mid", voice_ai: "high", crm_manager: "entry",
        support_channel: "entry", omnichannel: "mid", voice_support: "high", rag: "mid",
        content: "entry", seo_growth: "mid", marketing_automation: "mid", media_buyer: "high",
        revenue: "mid", ai_cfo: "high", data_analytics: "mid",
        orchestrator: "high", project_management: "mid", scheduler: "entry",
        hr: "entry", training: "entry", people_analytics: "mid",
        coding: "premium", computer: "premium", data_engineer: "high",
        creative_design: "mid", video_production: "high", branding: "mid",
        legal: "high", contract_analyst: "mid", compliance_officer: "mid",
        ecommerce: "mid", paid_traffic: "high", affiliate_manager: "entry",
      };
      const priceTier = (agentPriceTierMap[slug] || "starter") as any;
      price = getPrice(lang, priceTier);
    }

    if (!price || price <= 0) { toast.error("Preço inválido para este agente."); return; }

    setPendingCheckoutIntent({ intent, uniqueSlugs });
    setCheckoutSummary({ label: intent.label, slugs: uniqueSlugs, isDepartment, departmentId: deptId, price, currency: region.currency, lang });
  }, [user, i18n.language]);

  const handleConfirmCheckout = useCallback(async () => {
    if (!checkoutSummary || !pendingCheckoutIntent) return;
    const { label, slugs, isDepartment, departmentId, price, currency } = checkoutSummary;
    const region = getRegion(checkoutSummary.lang);

    const agentSlug = isDepartment ? `dept-${departmentId}` : slugs[0];

    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: {
        action: "create_subscription",
        agent_slug: agentSlug,
        agent_name: label,
        amount: price,
        currency,
        return_url: `${window.location.origin}/dashboard?subscription=success`,
        cancel_url: `${window.location.origin}/dashboard?subscription=cancelled`,
      },
    });
    if (error) throw error;
    if (!data?.success || !data?.approve_url) throw new Error(data?.error || "Falha ao criar assinatura");

    sessionStorage.setItem("paypal_subscription", JSON.stringify({
      subscription_id: data.subscription_id,
      agent_slug: agentSlug,
      agent_name: label,
      price,
      currency,
      tier: isDepartment ? "advanced" : "basic",
      ...(isDepartment ? { is_department: true, department_id: departmentId, department_slugs: slugs } : {}),
    }));

    window.location.href = data.approve_url;
  }, [checkoutSummary, pendingCheckoutIntent]);

  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + t.tokens_used, 0);
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
    { id: "live-timeline", label: "Timeline", icon: Eye, group: moreGroup },
    { id: "squad-chat", label: t("dashboard.meeting"), icon: Users, group: moreGroup },
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrações" }), icon: Plug, group: moreGroup },
    { id: "analytics", label: t("dashboard.analytics"), icon: BarChart3, group: moreGroup },
    { id: "logs", label: t("dashboard.logs"), icon: Activity, group: moreGroup },
    { id: "settings", label: t("dashboard.settings"), icon: Settings, group: moreGroup },
  ];

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
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

  const breadcrumbLabel = activeSection === "overview" ? t("dashboard.command_center")
    : activeSection === "omnix" ? t("dashboard.ai_assistant_label", { defaultValue: "Assistente IA" })
    : activeSection === "agents" ? t("dashboard.agents_tab")
    : activeSection === "analytics" ? t("dashboard.analytics")
    : activeSection === "logs" ? t("dashboard.logs")
    : activeSection === "settings" ? t("dashboard.settings")
    : activeSection === "library" ? t("dashboard.library", { defaultValue: "Biblioteca" })
    : activeSection === "integrations" ? t("dashboard.integrations", { defaultValue: "Integrações" })
    : activeSection === "squad-chat" ? t("dashboard.meeting")
    : activeSection === "live-timeline" ? "Timeline"
    : activeSection === "chat" ? selectedAgent?.name || "Chat"
    : activeSection;

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
          onComplete={() => {
            setShowCelebration(false);
            // If department purchase, show setup wizard
            if (postPaymentContext.isDepartment && postPaymentContext.departmentId) {
              setShowDeptSetup(true);
            } else {
              setActiveSection("omnix");
            }
          }}
        />
      )}

      {/* Department Setup after payment */}
      {showDeptSetup && postPaymentContext?.departmentId && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <Suspense fallback={<SectionLoader />}>
              <DepartmentSetup
                departmentId={postPaymentContext.departmentId}
                departmentName={postPaymentContext.agentName}
                onComplete={() => {
                  setShowDeptSetup(false);
                  setActiveSection("omnix");
                }}
                onSkip={() => {
                  setShowDeptSetup(false);
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
        onCancel={() => { setCheckoutSummary(null); setPendingCheckoutIntent(null); }}
      />

      <div className="flex h-full">
        <div className="hidden lg:block">
          <DashboardSidebar items={sidebarItems} activeItem={activeSection} onItemChange={handleSidebarNav} />
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto">
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
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                    {credits && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {remainingCredits.toLocaleString(locale)} {t("dashboard.credits_short", { defaultValue: "créditos" })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationPanel />
                  <QuickActions />
                </div>
              </div>
            </motion.div>

            {/* Mobile nav — improved with search and cleaner hierarchy */}
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

                  {/* Mobile search */}
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

            {/* Loading state — premium skeleton */}
            {loadingAgents && activeSection === "overview" && (
              <Suspense fallback={<SectionLoader />}>
                <DashboardSkeleton />
              </Suspense>
            )}

            {/* ═══ OMNIX ═══ */}
            {activeSection === "omnix" && (
              <Suspense fallback={<SectionLoader />}>
                <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-border/10">
                  <OmnixCommandCenter postPaymentContext={postPaymentContext} onPostPaymentHandled={() => setPostPaymentContext(null)} />
                </div>
              </Suspense>
            )}

            {/* ═══ OVERVIEW ═══ */}
            {activeSection === "overview" && (
              <Suspense fallback={<SectionLoader />}>
                <ClientCommandCenter
                  activeAgents={activeAgents} totalExecutions={totalExecutions} totalTokensUsed={totalTokensUsed}
                  usagePercentage={usagePercentage} estimatedSavings={estimatedSavings} credits={credits}
                  remainingCredits={remainingCredits} agents={agents} subscriptions={subscriptions}
                  recentLogs={recentLogs} tokenUsage={tokenUsage} onNavigate={handleSidebarNav}
                />
              </Suspense>
            )}

            {/* ═══ INTEGRATIONS ═══ */}
            {activeSection === "integrations" && <Suspense fallback={<SectionLoader />}><Integrations /></Suspense>}

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
                              <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-accent-emerald" />
                                  <span className="text-sm">{sub.agent_name}</span>
                                </div>
                                <span className="text-sm font-medium">{formatCurrency(sub.monthly_price)}/{locale.startsWith("pt") ? "mês" : "mo"}</span>
                              </div>
                            ))}
                            <div className="pt-3 border-t border-white/5 flex justify-between">
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

            {/* ═══ SQUAD CHAT ═══ */}
            {activeSection === "squad-chat" && <Suspense fallback={<SectionLoader />}><SquadChat agents={agents} /></Suspense>}

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

            {/* ═══ CHAT ═══ */}
            {activeSection === "chat" && selectedAgent && (
              <Suspense fallback={<SectionLoader />}>
                <div className="space-y-3">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>{t("dashboard.back", { defaultValue: "Voltar" })}</span>
                  </button>
                  <AgentChat agentId={selectedAgent.id} agentName={selectedAgent.name} />
                </div>
              </Suspense>
            )}
          </div>
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
