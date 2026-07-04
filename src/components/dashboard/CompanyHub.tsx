import { useState, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Bot, Shield, Plug, BookOpen, ChevronRight, Crown, Plus, Loader2, BarChart3, Briefcase, Globe, FileText, Package } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useTranslation } from "react-i18next";
import { DEPARTMENTS, SLUG_TO_DEPT } from "@/data/departmentMap";

const ContentPipelinePanel = lazy(() => import("@/components/dashboard/ContentPipelinePanel"));
const DeliverablesHub = lazy(() => import("@/components/dashboard/DeliverablesHub"));

import SectionLoader from "@/components/ui/section-loader";

interface CompanyHubProps {
  agents: any[];
  nameToSlug: Record<string, string>;
  onNavigate: (section: string) => void;
  onOpenAgent: (agent: { id: string; name: string }) => void;
  onSetupCompany: () => void;
}

const planLimits: Record<string, { members: number; agents: number }> = {
  free: { members: 3, agents: 5 },
  starter: { members: 5, agents: 15 },
  pro: { members: 10, agents: 30 },
  enterprise: { members: 100, agents: -1 },
};

const CompanyHub = ({ agents, nameToSlug, onNavigate, onOpenAgent, onSetupCompany }: CompanyHubProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { credits, remainingCredits, usagePercentage } = useCredits();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Tenant info
  const { data: tenant } = useQuery({
    queryKey: ["tenant-info", user?.id],
    queryFn: async () => {
      const { data: member } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenant:tenants(*)")
        .eq("user_id", user!.id)
        .limit(1)
        .single();
      return member;
    },
    enabled: !!user,
  });

  // Team members count
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-count", tenant?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenant_members")
        .select("id, role, user_id")
        .eq("tenant_id", tenant!.tenant_id);
      return data || [];
    },
    enabled: !!tenant?.tenant_id,
  });

  // Company board count
  const { data: boardCount = 0 } = useQuery({
    queryKey: ["company-board-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("company_board")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  // Credentials count
  const { data: credentialCount = 0 } = useQuery({
    queryKey: ["credential-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("agent_credentials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  // Group agents by department
  const departmentGroups = useMemo(() => {
    const groups: Record<string, { dept: typeof DEPARTMENTS[string]; agents: any[] }> = {};
    const ungrouped: any[] = [];

    for (const agent of agents) {
      const slug = nameToSlug[agent.name];
      const deptId = slug ? SLUG_TO_DEPT[slug] : null;
      if (deptId && DEPARTMENTS[deptId]) {
        if (!groups[deptId]) groups[deptId] = { dept: DEPARTMENTS[deptId], agents: [] };
        groups[deptId].agents.push(agent);
      } else {
        ungrouped.push(agent);
      }
    }

    return { groups, ungrouped };
  }, [agents, nameToSlug]);

  const tenantData = tenant?.tenant as any;
  const planType = tenantData?.plan_type || credits?.plan_type || "free";
  const limits = planLimits[planType] || planLimits.free;
  const activeAgents = agents.filter(a => a.status === "active").length;

  const stats = [
    { label: "Agentes Ativos", value: activeAgents, max: limits.agents === -1 ? "∞" : limits.agents, icon: Bot, color: "text-primary" },
    { label: "Membros", value: teamMembers.length, max: limits.members, icon: Users, color: "text-accent-emerald" },
    { label: "Dados da Empresa", value: boardCount, max: null, icon: BookOpen, color: "text-accent-amber" },
    { label: "Credenciais", value: credentialCount, max: null, icon: Shield, color: "text-accent-violet" },
  ];

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-border/10"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{tenantData?.name || "Minha Empresa"}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/15 text-primary">
                  {planType.charAt(0).toUpperCase() + planType.slice(1)}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {Object.keys(departmentGroups.groups).length} departamentos • {activeAgents} agentes
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={onSetupCompany}>
              <BookOpen className="h-3.5 w-3.5" /> Ensinar Empresa
            </Button>
            <Button size="sm" className="text-xs h-8 gap-1.5" onClick={() => onNavigate("library")}>
              <Plus className="h-3.5 w-3.5" /> Contratar Agente
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs: Visão Geral / Conteúdo / Entregas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/10 border border-border/10 h-9">
          <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <FileText className="h-3.5 w-3.5" />
            Conteúdo
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Package className="h-3.5 w-3.5" />
            Entregas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 border border-border/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="font-display text-2xl font-bold">{stat.value}</span>
                {stat.max && <span className="text-xs text-muted-foreground mb-0.5">/ {stat.max}</span>}
              </div>
              {stat.max && typeof stat.max === "number" && (
                <Progress value={(stat.value / stat.max) * 100} className="h-1 mt-2" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Credits Overview */}
      {credits && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-border/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Créditos</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {remainingCredits.toLocaleString()} restantes de {credits.total_credits.toLocaleString()}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </motion.div>
      )}

      {/* Departments */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          Departamentos Ativos
        </h3>

        {Object.keys(departmentGroups.groups).length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center border border-border/10">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum departamento ativo ainda</p>
            <Button size="sm" className="text-xs" onClick={() => onNavigate("library")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Explorar Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {Object.entries(departmentGroups.groups).map(([deptId, { dept, agents: deptAgents }]) => {
              const isExpanded = expandedDept === deptId;
              const activeCount = deptAgents.filter(a => a.status === "active").length;
              return (
                <motion.div
                  key={deptId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl border border-border/10 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDept(isExpanded ? null : deptId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", dept.color.replace("text-", "bg-"))} />
                      <span className="text-sm font-medium">{dept.label}</span>
                      <Badge variant="outline" className="text-[9px] h-5">{activeCount} ativo{activeCount !== 1 ? "s" : ""}</Badge>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border/10 px-4 pb-3"
                    >
                      <div className="grid gap-1.5 pt-2">
                        {deptAgents.map(agent => (
                          <button
                            key={agent.id}
                            onClick={() => onOpenAgent({ id: agent.id, name: agent.name })}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/10 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">{agent.name}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[8px] h-4",
                                  agent.status === "active" ? "border-accent-emerald/30 text-accent-emerald" : "border-muted text-muted-foreground"
                                )}
                              >
                                {agent.status === "active" ? "Ativo" : agent.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-muted-foreground">{agent.total_executions} exec.</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Ungrouped agents */}
        {departmentGroups.ungrouped.length > 0 && (
          <div className="glass-card rounded-xl border border-border/10 p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agentes Avulsos</h4>
            <div className="grid gap-1.5">
              {departmentGroups.ungrouped.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onOpenAgent({ id: agent.id, name: agent.name })}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/10 transition-colors text-left"
                >
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Equipe", icon: Users, action: () => onNavigate("equipe") },
          { label: "Integrações", icon: Plug, action: () => onNavigate("integrations") },
          { label: "Insights", icon: BarChart3, action: () => onNavigate("insights") },
          { label: "Configurações", icon: Globe, action: () => onNavigate("settings") },
        ].map(item => (
          <button
            key={item.label}
            onClick={item.action}
            className="glass-card rounded-xl p-3 border border-border/10 flex items-center gap-2 hover:bg-muted/5 hover:border-border/20 transition-all text-left"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <ContentPipelinePanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="deliverables" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <DeliverablesHub onNavigate={onNavigate} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyHub;
