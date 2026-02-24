import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits, useTokenUsage } from "@/hooks/useCredits";
import {
  LayoutDashboard, Bot, BarChart3, Activity, CreditCard,
  Sparkles, Plus, ArrowRight, Clock, Zap, CheckCircle, DollarSign,
  TrendingUp, Coins, Target, Settings, Users, UserPlus, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import MiniSparkline from "@/components/dashboard/MiniSparkline";
import QuickActions from "@/components/dashboard/QuickActions";
import AgentChat from "@/components/dashboard/AgentChat";
import TokenUpgradeDialog from "@/components/dashboard/TokenUpgradeDialog";
import ClientCommandCenter from "@/components/dashboard/ClientCommandCenter";
import AgentSettings from "@/components/dashboard/AgentSettings";
import SquadChat from "@/components/dashboard/SquadChat";
import TeamMembers from "@/components/dashboard/TeamMembers";
import ConciergeChat from "@/components/dashboard/ConciergeChat";
import type { HireIntent } from "./Auth";

const ClientDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const hireProcessed = useRef(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState<{ id: string; name: string } | null>(null);
  const [showConcierge, setShowConcierge] = useState(false);
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const { data: tokenUsage = [] } = useTokenUsage();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["my-agents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, agent:agents(*)")
        .eq("user_id", user!.id)
        .eq("status", "active");
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
      const { data, error } = await supabase
        .from("execution_logs")
        .select("*, agent:agents(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
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

  // Auto-hire from sessionStorage intent
  useEffect(() => {
    if (!user || hireProcessed.current) return;
    const raw = sessionStorage.getItem("hireIntent");
    if (!raw) return;
    
    hireProcessed.current = true;
    sessionStorage.removeItem("hireIntent");
    
    const intent: HireIntent = JSON.parse(raw);
    if (!intent.slugs || intent.slugs.length === 0) return;

    const processHire = async () => {
      const uniqueSlugs = [...new Set(intent.slugs)];
      toast.info(t("dashboard.hiring_agents", { label: intent.label }), { duration: 3000 });

      let hired = 0;
      for (const slug of uniqueSlugs) {
        try {
          const { data: template } = await supabase
            .from("agent_templates")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

          if (!template) continue;

          const { error } = await supabase
            .from("agents")
            .insert({
              user_id: user.id,
              name: template.name,
              description: template.description,
              instructions: template.system_prompt || template.instructions,
              objective: template.description,
              tier: template.tier as any,
              monthly_price: 0,
              status: "active",
              channels: template.default_channels,
              integrations: template.default_integrations,
              actions: template.default_actions,
            });

          if (!error) hired++;
        } catch (err) {
          console.error(`Failed to hire ${slug}:`, err);
        }
      }

      if (hired > 0) {
        toast.success(t("dashboard.agents_hired", { count: hired }));
        queryClient.invalidateQueries({ queryKey: ["my-agents"] });
        setActiveSection("agents");
      } else {
        toast.error(t("dashboard.hire_failed"));
      }
    };

    processHire();
  }, [user, queryClient, t]);

  // Show concierge on first visit
  useEffect(() => {
    if (!user || loadingAgents) return;
    const key = `clauthor_concierge_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => setShowConcierge(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, loadingAgents]);

  const handleCloseConcierge = () => {
    setShowConcierge(false);
    if (user) localStorage.setItem(`clauthor_concierge_seen_${user.id}`, "true");
  };

  const totalExecutions = agents.reduce((acc, a) => acc + (a.total_executions || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTokensUsed = tokenUsage.reduce((acc, t) => acc + t.tokens_used, 0);
  const estimatedSavings = activeAgents * 7560;

  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  const sidebarItems = [
    { id: "overview", label: t("dashboard.command_center"), icon: LayoutDashboard },
    { id: "concierge", label: t("dashboard.concierge"), icon: Wand2 },
    { id: "agents", label: t("dashboard.agents_tab"), icon: Bot, badge: agents.length || undefined },
    { id: "squad-chat", label: t("dashboard.meeting"), icon: Users },
    { id: "agent-settings", label: t("dashboard.settings"), icon: Settings },
    { id: "chat", label: t("dashboard.ai_assistant"), icon: Sparkles },
    { id: "analytics", label: t("dashboard.analytics"), icon: BarChart3 },
    { id: "team", label: t("dashboard.team"), icon: UserPlus },
    { id: "logs", label: t("dashboard.logs"), icon: Activity, badge: recentLogs.length || undefined },
    { id: "billing", label: t("dashboard.billing"), icon: CreditCard },
  ];

  const mockChartData = [
    { name: t("dashboard.jan"), execucoes: 400, sucesso: 380 },
    { name: t("dashboard.feb"), execucoes: 600, sucesso: 580 },
    { name: t("dashboard.mar"), execucoes: 800, sucesso: 770 },
    { name: t("dashboard.apr"), execucoes: 1200, sucesso: 1150 },
    { name: t("dashboard.may"), execucoes: 1500, sucesso: 1460 },
    { name: t("dashboard.jun"), execucoes: 1800, sucesso: 1750 },
  ];

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
    enterprise: "bg-primary/15 text-primary",
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "error") return <Activity className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(value / 100);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          items={sidebarItems}
          activeItem={activeSection}
          onItemChange={(id) => {
            if (id === "concierge") {
              setShowConcierge(true);
            } else {
              setActiveSection(id);
            }
          }}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="font-display text-2xl font-bold">{t("dashboard.control_panel")}</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <QuickActions />
          </motion.div>

          {/* Mobile tabs */}
          <div className="flex gap-2 overflow-x-auto lg:hidden pb-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => item.id === "concierge" ? setShowConcierge(true) : setActiveSection(item.id)}
                className="shrink-0 gap-1.5"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {activeSection === "overview" && (
            <ClientCommandCenter
              activeAgents={activeAgents}
              totalExecutions={totalExecutions}
              totalTokensUsed={totalTokensUsed}
              usagePercentage={usagePercentage}
              estimatedSavings={estimatedSavings}
              credits={credits}
              remainingCredits={remainingCredits}
              agents={agents}
              subscriptions={subscriptions}
              recentLogs={recentLogs}
              tokenUsage={tokenUsage}
            />
          )}

          {/* ═══ CHAT ═══ */}
          {activeSection === "chat" && (
            <div className="h-[calc(100vh-14rem)]">
              <AgentChat agentId={selectedAgent?.id} agentName={selectedAgent?.name || t("dashboard.ai_assistant")} />
            </div>
          )}

          {/* ═══ AGENT SETTINGS ═══ */}
          {activeSection === "agent-settings" && <AgentSettings />}

          {/* ═══ SQUAD CHAT (REUNIÃO) ═══ */}
          {activeSection === "squad-chat" && <SquadChat agents={agents} />}

          {/* ═══ TEAM MEMBERS ═══ */}
          {activeSection === "team" && <TeamMembers />}

          {/* ═══ AGENTS ═══ */}
          {activeSection === "agents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{t("dashboard.agents_tab")} ({agents.length})</h2>
                <Link to="/create-agent"><Button className="glow gap-1.5"><Plus className="h-4 w-4" /> {t("dashboard.new_agent")}</Button></Link>
              </div>
              {agents.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-bold mb-2">{t("dashboard.no_agent_created")}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{t("dashboard.start_creating")}</p>
                  <Link to="/library"><Button className="glow">{t("dashboard.explore_library")}</Button></Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {agents.map((agent, i) => (
                    <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-5 glass-hover cursor-pointer" onClick={() => agent.status === "active" && setSelectedAgent({ id: agent.id, name: agent.name })}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-display font-semibold">{agent.name}</p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}`}>{agent.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">{t("dashboard.price")}</p>
                          <p className="font-display font-bold text-sm">{formatCurrency(agent.monthly_price)}</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">{t("dashboard.executions")}</p>
                          <p className="font-display font-bold text-sm">{agent.total_executions}</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-xs text-muted-foreground">{t("dashboard.status")}</p>
                          <p className={`font-bold text-sm ${agent.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {agent.status === "active" ? "●" : "○"} {agent.status}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">{t("dashboard.analytics")}</h2>
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-display font-semibold">{t("dashboard.exec_vs_success")}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-primary" /><span className="text-xs text-muted-foreground">{t("dashboard.executions")}</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-emerald-500" /><span className="text-xs text-muted-foreground">{t("dashboard.success_rate_short")}</span></div>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockChartData}>
                      <defs>
                        <linearGradient id="cExec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cSucc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                      <Area type="monotone" dataKey="execucoes" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#cExec)" />
                      <Area type="monotone" dataKey="sucesso" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#cSucc)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t("dashboard.this_month")}</p>
                    <p className="font-display text-xl font-bold">1,800</p>
                    <p className="text-xs text-emerald-500">+20%</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t("dashboard.avg_rate")}</p>
                    <p className="font-display text-xl font-bold">97.2%</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.of_success")}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{t("dashboard.avg_time")}</p>
                    <p className="font-display text-xl font-bold">1.2s</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.per_execution")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LOGS ═══ */}
          {activeSection === "logs" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">{t("dashboard.execution_logs")} ({recentLogs.length})</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                {recentLogs.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">{t("dashboard.no_logs_found")}</div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium">{log.agent_name}</p>
                            <p className="text-xs text-muted-foreground">{log.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className={`text-[10px] ${log.status === "success" ? "bg-emerald-500/10 text-emerald-500" : log.status === "error" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"}`}>
                            {log.status}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ BILLING ═══ */}
          {activeSection === "billing" && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold">{t("dashboard.subscription_credits")}</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Credits */}
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

                {/* Subscriptions */}
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
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
            </div>
          )}
        </div>
      </div>

      {/* Concierge Chat */}
      <ConciergeChat
        isOpen={showConcierge}
        onClose={handleCloseConcierge}
        onNavigate={(section) => {
          setActiveSection(section);
          handleCloseConcierge();
        }}
      />
    </div>
  );
};

export default ClientDashboard;
