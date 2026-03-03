import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, Activity, CreditCard,
  Sparkles, Plus, ArrowRight, Coins, Settings, Users, Building2, Brain, MessageSquare, Eye, BookOpen, Plug, ChevronDown, Loader2
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
import QuickActions from "@/components/dashboard/QuickActions";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import NotificationPanel from "@/components/dashboard/NotificationPanel";

import PostSignupOnboarding from "@/components/onboarding/PostSignupOnboarding";
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
  const [activeSection, setActiveSection] = useState(() => {
    if (!user) return "overview";
    const key = `clauthor_concierge_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "true");
      return "omnix";
    }
    return "overview";
  });
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!user) return false;
    return !localStorage.getItem(`clauthor_onboarding_done_${user.id}`);
  });
  const { credits, remainingCredits, usagePercentage } = useCredits();
  usePaypalCapture();
  const { data: tokenUsage = [] } = useTokenUsage();

  const [postPaymentContext, setPostPaymentContext] = useState<{ agentName: string; isDepartment: boolean; agentCount: number } | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummaryData | null>(null);
  const [pendingCheckoutIntent, setPendingCheckoutIntent] = useState<{ intent: HireIntent; uniqueSlugs: string[] } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("clauthor_post_payment_onboarding");
    if (!raw) return;
    sessionStorage.removeItem("clauthor_post_payment_onboarding");
    try { setPostPaymentContext(JSON.parse(raw)); } catch { /* ignore */ }
    const timer = setTimeout(() => setActiveSection("omnix"), 800);
    return () => clearTimeout(timer);
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

  // Auto-hire from sessionStorage intent → show checkout summary (only AFTER onboarding is dismissed)
  useEffect(() => {
    if (!user || hireProcessed.current || showOnboarding) return;
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
  }, [user, i18n.language, showOnboarding]);

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
    id: "chat", label: selectedAgent.name, icon: MessageSquare, group: t("dashboard.operations", { defaultValue: "Operações" }),
  } : null;

  const operationsGroup = t("dashboard.operations", { defaultValue: "Operações" });
  const analysisGroup = t("dashboard.analysis", { defaultValue: "Análise" });
  const systemGroup = t("dashboard.system", { defaultValue: "Sistema" });
  const coreGroup = t("dashboard.core", { defaultValue: "Núcleo" });
  const agentsGroup = t("dashboard.agents_group", { defaultValue: "Agentes" });

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: t("dashboard.command_center"), icon: LayoutDashboard, group: coreGroup },
    { id: "omnix", label: "THOR", icon: Brain, badge: "AI", group: coreGroup },
    { id: "agents", label: t("dashboard.agents_tab"), icon: Bot, badge: agents.length || undefined, group: agentsGroup },
    { id: "library", label: t("dashboard.library", { defaultValue: "Biblioteca" }), icon: BookOpen, group: agentsGroup },
    ...departmentSidebarItems,
    ...soloAgentItems,
    ...(chatSidebarItem ? [chatSidebarItem] : []),
    { id: "live-timeline", label: "Timeline", icon: Eye, badge: "LIVE", group: operationsGroup },
    { id: "squad-chat", label: t("dashboard.meeting"), icon: Users, group: operationsGroup },
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrações" }), icon: Plug, group: operationsGroup },
    { id: "analytics", label: t("dashboard.analytics"), icon: BarChart3, group: analysisGroup },
    { id: "logs", label: t("dashboard.logs"), icon: Activity, badge: recentLogs.length || undefined, group: analysisGroup },
    { id: "settings", label: t("dashboard.settings"), icon: Settings, group: systemGroup },
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
      if (agent) { setSelectedAgent({ id: agent.id, name: agent.name }); setActiveSection("chat"); return; }
    }
    setActiveSection(id);
  };

  const breadcrumbLabel = activeSection === "overview" ? t("dashboard.command_center")
    : activeSection === "omnix" ? "THOR"
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
      <AnimatePresence>
        {showOnboarding && <PostSignupOnboarding onComplete={() => setShowOnboarding(false)} />}
      </AnimatePresence>

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
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Breadcrumb + Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <span>Dashboard</span><span>/</span>
                <span className="text-foreground/80 font-medium capitalize">{breadcrumbLabel}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold">{t("dashboard.control_panel")}</h1>
                    <HelpTooltip id="dashboard-intro" text={t("dashboard.help_intro", { defaultValue: "Este é seu painel de controle. Use a sidebar à esquerda para navegar entre seções." })} position="bottom" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <NotificationPanel />
                  <QuickActions />
                </div>
              </div>
            </motion.div>

            {/* Mobile nav — includes flattened department children */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full justify-start">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {breadcrumbLabel}
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 border-b border-border/10">
                    <SheetTitle className="font-display text-sm">{t("dashboard.navigation", { defaultValue: "Navegação" })}</SheetTitle>
                  </SheetHeader>
                  <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-6rem)]">
                    {flatMobileItems.map((item, idx) => {
                      const showGroup = item.group && (idx === 0 || flatMobileItems[idx - 1]?.group !== item.group);
                      return (
                        <div key={item.id}>
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
                                activeSection === item.id || (item.id.startsWith("agent-chat-") && activeSection === "chat")
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                              )}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1 text-left truncate">{item.label}</span>
                              {item.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">{item.badge}</span>}
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
              </div>
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
                <AgentChat agentId={selectedAgent.id} agentName={selectedAgent.name} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboard;
