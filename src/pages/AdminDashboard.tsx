import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, DollarSign, TrendingUp, ShoppingBag, CheckCircle, XCircle, Clock, BarChart3, Shield, Activity, Coins, ListOrdered, Mail, Phone, Building, Zap, LayoutDashboard, CreditCard, Store, Wallet, Crown, Settings, Key, Gift, ChevronDown, Cpu, Scale, PlayCircle } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import AdminCommandCenter from "@/components/dashboard/AdminCommandCenter";
import { LiveActivityFeed } from "@/components/dashboard/LiveActivityFeed";
import AdminUserManager from "@/components/dashboard/AdminUserManager";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import PaymentsPanel from "@/components/dashboard/PaymentsPanel";
import AdminWarRoom from "@/components/dashboard/AdminWarRoom";
import AdminAgentSettings from "@/components/dashboard/AdminAgentSettings";
import AdminInsightsPanel from "@/components/dashboard/AdminInsightsPanel";
import OmnixCommandCenter from "@/pages/OmnixCommandCenter";
import PlatformCredentialsPanel from "@/components/dashboard/PlatformCredentialsPanel";
import OpenClawStatusPanel from "@/components/dashboard/OpenClawStatusPanel";
import { AdminCouponManager } from "@/components/dashboard/AdminCouponManager";
import AdminAgentsTable from "@/components/dashboard/AdminAgentsTable";
import AdminWaitlistTable from "@/components/dashboard/AdminWaitlistTable";
import AdminLogsTable from "@/components/dashboard/AdminLogsTable";
import AdminMarketplacePanel from "@/components/dashboard/AdminMarketplacePanel";
import AdminRevenuePanel from "@/components/dashboard/AdminRevenuePanel";
import AdminSubscriptionsTable from "@/components/dashboard/AdminSubscriptionsTable";
import AdminSignupMetrics from "@/components/dashboard/AdminSignupMetrics";
import AdminCostsDashboard from "@/components/dashboard/AdminCostsDashboard";
import AdminSimulationsPanel from "@/components/dashboard/AdminSimulationsPanel";
import TokenAlertsTable from "@/components/dashboard/TokenAlertsTable";
import ThorGreetingMetricsCard from "@/components/dashboard/ThorGreetingMetricsCard";
import AdminMarginAnalysis from "@/components/dashboard/AdminMarginAnalysis";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const { verified } = useAdminGuard();
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const handleTabChange = (id: string) => {
    if (id === "vertical-advocacia") {
      navigate("/admin/verticals/advocacia");
      return;
    }
    setActiveTab(id);
  };
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const { data: usersCount = 0 } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin-all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allAgents = [] } = useQuery({
    queryKey: ["admin-all-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingAgents = [] } = useQuery({
    queryKey: ["admin-pending-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_agents").select("*").eq("is_approved", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*, agent:agents(name)").eq("status", "active").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: waitlist = [] } = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: executionLogs = [] } = useQuery({
    queryKey: ["admin-execution-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execution_logs").select("*, agent:agents(name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["admin-token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("token_usage").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: allCredits = [] } = useQuery({
    queryKey: ["admin-all-credits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_credits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentHistory = [] } = useQuery({
    queryKey: ["admin-payment-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_history").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = allSubscriptions.reduce((acc, s) => acc + (s.monthly_price || 0), 0);
  const activeAgents = allAgents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + (t.tokens_used || 0), 0);
  const totalExecutions = executionLogs.length;
  const successLogs = executionLogs.filter((l: any) => l.status === "success").length;
  const successRate = totalExecutions > 0 ? Math.round((successLogs / totalExecutions) * 100) : 0;
  const waitingCount = waitlist.filter((w) => w.status === "waiting").length;

  const revenueData = useMemo(() => {
    const now = new Date();
    const months: { name: string; receita: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString(locale, { month: "short" });
      const paymentsInMonth = paymentHistory.filter((p: any) => {
        const pd = new Date(p.created_at);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status === "completed";
      });
      const total = paymentsInMonth.reduce((acc: number, p: any) => acc + (p.amount_cents || 0), 0);
      months.push({ name: monthName, receita: Math.round(total / 100) });
    }
    return months;
  }, [paymentHistory, locale]);

  const planDistribution = useMemo(() => [
    { name: "Free", value: allCredits.filter(c => c.plan_type === "free").length, color: "hsl(var(--muted-foreground))" },
    { name: "Starter", value: allCredits.filter(c => c.plan_type === "starter").length || 0, color: "hsl(var(--primary))" },
    { name: "Pro", value: allCredits.filter(c => c.plan_type === "pro").length || 0, color: "#22d3ee" },
    { name: "Enterprise", value: allCredits.filter(c => c.plan_type === "enterprise").length || 0, color: "#f59e0b" },
  ].filter(d => d.value > 0), [allCredits]);

  const sidebarItems = [
    { id: "omnix", label: "THOR", icon: Sparkles, badge: "AI", group: t("dashboard.core", { defaultValue: "Núcleo" }) },
    { id: "overview", label: "Command Center", icon: LayoutDashboard, group: t("dashboard.core", { defaultValue: "Núcleo" }) },
    { id: "insights", label: t("dashboard.predictive_ai", { defaultValue: "IA Preditiva" }), icon: Sparkles, group: t("dashboard.core", { defaultValue: "Núcleo" }) },
    { id: "war-room", label: "War Room", icon: Crown, group: t("dashboard.management", { defaultValue: "Gestão" }) },
    { id: "agent-settings", label: t("dashboard.agent_config", { defaultValue: "Config. Agentes" }), icon: Settings, group: t("dashboard.management", { defaultValue: "Gestão" }) },
    { id: "users", label: t("dashboard.users", { defaultValue: "Usuários" }), icon: Users, badge: usersCount || undefined, group: t("dashboard.management", { defaultValue: "Gestão" }) },
    { id: "agents", label: t("dashboard.agents_tab", { defaultValue: "Agentes" }), icon: Bot, badge: allAgents.length || undefined, group: t("dashboard.management", { defaultValue: "Gestão" }) },
    { id: "marketplace", label: "Marketplace", icon: Store, badge: pendingAgents.length || undefined, group: t("dashboard.management", { defaultValue: "Gestão" }) },
    { id: "revenue", label: t("dashboard.revenue", { defaultValue: "Receita" }), icon: BarChart3, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "payments", label: t("dashboard.payments", { defaultValue: "Pagamentos" }), icon: Wallet, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "subscriptions", label: t("dashboard.subscriptions", { defaultValue: "Assinaturas" }), icon: CreditCard, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "logs", label: "Logs", icon: Activity, badge: totalExecutions || undefined, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "platform-creds", label: t("dashboard.platform_creds", { defaultValue: "Credenciais Central" }), icon: Key, group: t("dashboard.system", { defaultValue: "Sistema" }) },
    { id: "openclaw", label: "Execution Engine", icon: Activity, group: t("dashboard.system", { defaultValue: "Sistema" }) },
    { id: "coupons", label: t("dashboard.coupons", { defaultValue: "Cupons" }), icon: Gift, group: t("dashboard.system", { defaultValue: "Sistema" }) },
    { id: "signup-metrics", label: "Signups", icon: Users, badge: undefined, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "ai-costs", label: "Custos IA", icon: Cpu, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "simulations", label: "Simulações", icon: PlayCircle, group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "margin", label: "Margem por Depto", icon: TrendingUp, badge: "NEW", group: t("dashboard.analysis", { defaultValue: "Análise" }) },
    { id: "waitlist", label: "Waitlist", icon: ListOrdered, badge: waitingCount || undefined, group: t("dashboard.system", { defaultValue: "Sistema" }) },
    { id: "vertical-advocacia", label: "Vertical: Advocacia", icon: Scale, group: "Verticais" },
  ];

  const breadcrumbLabel = sidebarItems.find(i => i.id === activeTab)?.label || activeTab;

  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <DashboardSidebar items={sidebarItems} activeItem={activeTab} onItemChange={handleTabChange} />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 relative">
            {/* Premium admin glow accent */}
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <span>Admin</span><span>/</span>
              <span className="text-foreground/80 font-medium capitalize">{breadcrumbLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md animate-pulse" />
                <Shield className="h-6 w-6 text-primary relative" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
              </div>
              <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">CLAUTHOR</h1>
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono shadow-[0_0_8px_hsl(var(--primary)/0.15)]">ADMIN MASTER</Badge>
              <div className="flex items-center gap-2 ml-auto">
                <NotificationPanel />
                <TokenUpgradeDialog trigger={
                  <Button size="sm" variant="outline" className="gap-1.5 border-primary/20 text-primary text-xs hover:shadow-[0_0_12px_hsl(var(--primary)/0.2)] transition-shadow">
                    <Coins className="h-3.5 w-3.5" /> Tokens
                  </Button>
                } />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Command Center - {t("dashboard.full_control", { defaultValue: "Controle total da plataforma" })}</p>
          </motion.div>

          {/* Mobile nav */}
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
                  <SheetTitle className="font-display text-sm">{t("dashboard.admin_nav", { defaultValue: "Navegação Admin" })}</SheetTitle>
                </SheetHeader>
                <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-6rem)]">
                  {sidebarItems.map((item, idx) => {
                    const showGroup = item.group && (idx === 0 || sidebarItems[idx - 1].group !== item.group);
                    return (
                      <div key={item.id}>
                        {showGroup && (
                          <div className="px-3 pt-4 pb-1.5 first:pt-1">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">{item.group}</span>
                          </div>
                        )}
                        <SheetClose asChild>
                          <button
                            onClick={() => handleTabChange(item.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors",
                              activeTab === item.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === "omnix" && (
                <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-border/10">
                  <OmnixCommandCenter />
                </div>
              )}

              {activeTab === "insights" && (
                <AdminInsightsPanel allProfiles={allProfiles} allAgents={allAgents} allCredits={allCredits} executionLogs={executionLogs} totalRevenue={totalRevenue} totalExecutions={totalExecutions} />
              )}

              {activeTab === "war-room" && <AdminWarRoom />}
              {activeTab === "agent-settings" && <AdminAgentSettings />}
              {activeTab === "platform-creds" && <PlatformCredentialsPanel />}
              {activeTab === "coupons" && <AdminCouponManager />}
              {activeTab === "openclaw" && <OpenClawStatusPanel />}

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <AdminCommandCenter
                    usersCount={usersCount} activeAgents={activeAgents} totalRevenue={totalRevenue}
                    pendingCount={pendingAgents.length} totalTokensUsed={totalTokensUsed} totalExecutions={totalExecutions}
                    successRate={successRate} waitingCount={waitingCount} allAgents={allAgents} allCredits={allCredits}
                    allProfiles={allProfiles} executionLogs={executionLogs} revenueData={revenueData}
                    planDistribution={planDistribution} onTabChange={setActiveTab}
                  />
                  <TokenAlertsTable
                    mode="admin"
                    credits={allCredits}
                    tokenUsage={tokenUsage}
                    profiles={allProfiles}
                    warnAt={80}
                    criticalAt={95}
                  />
                  <ThorGreetingMetricsCard />
                  <LiveActivityFeed />
                </div>
              )}

              {activeTab === "payments" && <PaymentsPanel totalRevenue={totalRevenue} subscriptionCount={allSubscriptions.length} />}
              {activeTab === "users" && <AdminUserManager allProfiles={allProfiles} allCredits={allCredits} />}
              {activeTab === "agents" && <AdminAgentsTable allAgents={allAgents} locale={locale} />}
              {activeTab === "revenue" && <AdminRevenuePanel revenueData={revenueData} totalRevenue={totalRevenue} allSubscriptions={allSubscriptions} locale={locale} />}
              {activeTab === "waitlist" && <AdminWaitlistTable waitlist={waitlist} waitingCount={waitingCount} locale={locale} />}
              {activeTab === "logs" && <AdminLogsTable executionLogs={executionLogs} locale={locale} />}
              {activeTab === "marketplace" && <AdminMarketplacePanel pendingAgents={pendingAgents} locale={locale} />}
              {activeTab === "subscriptions" && <AdminSubscriptionsTable allSubscriptions={allSubscriptions} locale={locale} />}
              {activeTab === "signup-metrics" && <AdminSignupMetrics allProfiles={allProfiles} locale={locale} />}
              {activeTab === "ai-costs" && <AdminCostsDashboard />}
              {activeTab === "simulations" && <AdminSimulationsPanel />}
              {activeTab === "margin" && <AdminMarginAnalysis />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
