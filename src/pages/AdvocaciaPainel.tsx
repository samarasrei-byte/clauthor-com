import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ChevronsLeft,
  ChevronsRight,
  Briefcase,
  Inbox,
  X,
  Circle,
  Lightbulb,
  Users,
  LifeBuoy,
  MessageSquare,
  Plug,
  CreditCard,
  Plus,
  Send,
  Mail,
  Loader2,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * AdvocaciaPainel — workspace vertical isolado para advogados.
 * Sidebar minimalista com toggle expand/collapse (icon-rail).
 * Configurações = painel completo (Equipe, Suporte, WhatsApp, Integrações, Conta).
 */

type SidebarItem = { to: string; label: string; icon: any; end?: boolean; soon?: boolean };
type SidebarGroup = { label?: string; items: SidebarItem[] };

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    items: [
      { to: "/advocacia/painel", label: "Visão geral", icon: Scale, end: true },
      { to: "/advocacia/painel/captacao", label: "Leads & Captação", icon: Inbox },
      { to: "/advocacia/painel/propostas", label: "Propostas", icon: Handshake },
      { to: "/advocacia/painel/contratos", label: "Contratos & Risco", icon: ShieldAlert },
      { to: "/advocacia/painel/documentos", label: "Documentos", icon: FileText },
      { to: "/advocacia/painel/configuracoes", label: "Configurações", icon: SettingsIcon },
    ],
  },
  {
    label: "Em breve",
    items: [
      { to: "/advocacia/painel", label: "Clientes (CRM)", icon: Users, soon: true },
      { to: "/advocacia/painel", label: "Agenda", icon: Clock, soon: true },
      { to: "/advocacia/painel", label: "Produção jurídica", icon: ClipboardCheck, soon: true },
      { to: "/advocacia/painel", label: "Compliance LGPD/PLD", icon: ShieldAlert, soon: true },
    ],
  },
];

// Flat list kept for legacy refs
const SIDEBAR_ITEMS: SidebarItem[] = SIDEBAR_GROUPS[0].items;

const CROSS_SELL_DISMISS_KEY = "clauthor_advocacia_crosssell_dismissed";
const CHECKLIST_DISMISS_KEY = "clauthor_advocacia_checklist_dismissed";
const SIDEBAR_COLLAPSED_KEY = "clauthor_advocacia_sidebar_collapsed";
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
        { id: "agents", label: "Agentes ativados", done: (agentsCount || 0) > 0, to: "/advocacia/painel" },
        { id: "whatsapp", label: "Conectar WhatsApp", done: onb?.whatsapp_status === "connected", to: "/advocacia/painel/configuracoes" },
        { id: "clicksign", label: "Conectar ClickSign", done: onb?.clicksign_status === "connected", to: "/advocacia/painel/configuracoes" },
        { id: "first_exec", label: "Primeira execução", done: (execCount || 0) > 0, to: "/advocacia/painel/contratos" },
      ];

      return { steps, completed: steps.filter((s) => s.done).length, total: steps.length };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

const AdvocaciaPainelLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: progress } = useOnboardingProgress(user?.id);

  const [collapsed, setCollapsed] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
  );
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

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
      const daysSince = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
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

  const checklistCompleted = progress && progress.completed === progress.total;
  const showChecklist = !collapsed && !!progress && !checklistCompleted && checklistOpen;
  const showCrossSell = !collapsed && !showChecklist && crossSellEligible && crossSellOpen;

  const sidebarWidth = collapsed ? "w-[60px]" : "w-56";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-background text-foreground">
        {/* ─── Sidebar ─── */}
        <aside
          className={`hidden md:flex flex-col ${sidebarWidth} border-r border-border bg-card/30 transition-[width] duration-200`}
        >
          {/* Header */}
          <div className={`h-14 flex items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            {collapsed ? (
              <Link to="/advocacia/painel" aria-label="Clauthor">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-primary" />
                </div>
              </Link>
            ) : (
              <Link to="/advocacia/painel" className="flex flex-col leading-none gap-0.5">
                <ClauthorLogo size="sm" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Advocacia
                </span>
              </Link>
            )}
          </div>

          {/* Nav */}
          <nav className={`flex-1 ${collapsed ? "px-2" : "px-2"} py-3 space-y-4 overflow-y-auto`}>
            {SIDEBAR_GROUPS.map((group, gi) => (
              <div key={gi} className="space-y-0.5">
                {group.label && !collapsed && (
                  <div className="px-2.5 pt-1 pb-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 font-medium">
                    {group.label}
                  </div>
                )}
                {group.label && collapsed && gi > 0 && (
                  <div className="mx-auto my-1 h-px w-6 bg-border/60" />
                )}
                {group.items.map((item) => {
                  if (item.soon) {
                    const soonBtn = (
                      <div
                        key={`${item.to}-${item.label}`}
                        className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-2.5 py-2 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed select-none`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            <span className="ml-auto text-[9px] uppercase tracking-wider text-muted-foreground/50 border border-border/60 rounded px-1 py-px">
                              em breve
                            </span>
                          </>
                        )}
                      </div>
                    );
                    return collapsed ? (
                      <Tooltip key={`${item.to}-${item.label}`}>
                        <TooltipTrigger asChild>{soonBtn}</TooltipTrigger>
                        <TooltipContent side="right">{item.label} · em breve</TooltipContent>
                      </Tooltip>
                    ) : (
                      soonBtn
                    );
                  }
                  const link = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? "justify-center" : "gap-3"} px-2.5 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                  return collapsed ? (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Onboarding checklist */}
          <AnimatePresence mode="wait">
            {showChecklist && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-2 mb-2 p-3 rounded-md border border-border bg-muted/20 relative"
              >
                <button
                  onClick={dismissChecklist}
                  aria-label="Dispensar checklist"
                  className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Configuração</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {progress!.completed}/{progress!.total}
                  </span>
                </div>
                <Progress value={(progress!.completed / progress!.total) * 100} className="h-1 mb-2.5" />
                <ul className="space-y-1">
                  {progress!.steps.map((step) => (
                    <li key={step.id}>
                      <Link to={step.to} className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors group">
                        {step.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={step.done ? "line-through text-muted-foreground" : "group-hover:underline"}>{step.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {showCrossSell && (
              <motion.div
                key="crosssell"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-2 mb-2 p-3 rounded-md border border-border bg-muted/30 relative"
              >
                <button onClick={dismissCrossSell} aria-label="Dispensar" className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  <Sparkles className="h-3 w-3" /> Sugestão
                </div>
                <p className="text-xs text-foreground leading-snug mb-2">
                  Quer escalar captação fora do jurídico? Conheça o SDR Outbound.
                </p>
                <Link to="/marketplace" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                  Ver agentes <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rodapé: collapse + sair */}
          <div className="border-t border-border p-2 space-y-0.5">
            {(() => {
              const signOutBtn = (
                <button
                  onClick={handleSignOut}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} w-full px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors`}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </button>
              );
              const collapseBtn = (
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} w-full px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors`}
                  aria-label={collapsed ? "Expandir" : "Recolher"}
                >
                  {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                  {!collapsed && <span>Recolher</span>}
                </button>
              );
              return (
                <>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{signOutBtn}</TooltipTrigger>
                      <TooltipContent side="right">Sair</TooltipContent>
                    </Tooltip>
                  ) : (
                    signOutBtn
                  )}
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{collapseBtn}</TooltipTrigger>
                      <TooltipContent side="right">Expandir</TooltipContent>
                    </Tooltip>
                  ) : (
                    collapseBtn
                  )}
                </>
              );
            })()}
          </div>
        </aside>

        {/* Main */}
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
    </TooltipProvider>
  );
};

// ─── Visão Geral ───
export const AdvocaciaPainelHome = () => {
  const { user } = useAuth();
  const { data: progress } = useOnboardingProgress(user?.id);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["advocacia-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [{ count: execToday }, { count: agentsActive }, { data: recentLogs }] = await Promise.all([
        supabase.from("execution_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", today.toISOString()),
        supabase.from("agents").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("execution_logs").select("id, action, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      return { execToday: execToday || 0, agentsActive: agentsActive || 0, recentLogs: recentLogs || [] };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const nextStep = progress?.steps.find((s) => !s.done);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bom dia, advogado.</h1>
        <p className="text-sm text-muted-foreground mt-1">Aqui está o que seus agentes fizeram por você.</p>
      </div>

      {nextStep && (
        <Card className="p-4 border-primary/20 bg-primary/[0.03]">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-primary font-medium mb-0.5">Próximo passo recomendado</div>
              <p className="text-sm font-medium">{nextStep.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Leva menos de 2 minutos.</p>
            </div>
            <Button asChild size="sm">
              <Link to={nextStep.to}>
                Continuar <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={CheckCircle2} label="Ações hoje" value={isLoading ? "—" : String(stats?.execToday ?? 0)} hint="Execuções dos seus agentes" />
        <KpiCard icon={Briefcase} label="Agentes ativos" value={isLoading ? "—" : String(stats?.agentsActive ?? 0)} hint="Trabalhando agora" />
        <KpiCard
          icon={TrendingUp}
          label="Status"
          value={!progress ? "—" : progress.completed === progress.total ? "Pronto" : `${progress.completed}/${progress.total}`}
          hint={!progress || progress.completed === progress.total ? "Configuração completa" : "Etapas de configuração"}
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Atividade recente</h2>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !stats?.recentLogs.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Seus agentes ainda não executaram nenhuma ação.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentLogs.map((log: any) => (
              <li key={log.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="text-sm font-semibold mb-3">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard to="/advocacia/painel/contratos" icon={ShieldAlert} title="Analisar um contrato" desc="Receba relatório de risco em segundos" />
          <ActionCard to="/advocacia/painel/propostas" icon={Handshake} title="Gerar proposta de honorários" desc="Modelo híbrido pronto para enviar" />
          <ActionCard to="/advocacia/painel/captacao" icon={Inbox} title="Ver leads recebidos" desc="Triagem feita pelo agente de captação" />
          <ActionCard to="/advocacia/painel/configuracoes" icon={ClipboardCheck} title="Completar configuração" desc="WhatsApp, equipe, ClickSign" />
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ───
const KpiCard = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{hint}</div>
  </Card>
);

const ActionCard = ({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) => (
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

// ─── Placeholders (mantidos) ───
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

const SimplePage = ({ title, desc, cta }: { title: string; desc: string; cta?: { to: string; label: string } }) => (
  <div className="max-w-5xl mx-auto px-6 py-8">
    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    <Card className="mt-6 p-8 text-center">
      <p className="text-sm text-muted-foreground">Em breve. Esta seção está sendo expandida com base no uso real dos advogados.</p>
      {cta && (
        <Button asChild className="mt-4">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </Card>
  </div>
);

// ─── Configurações: painel completo com tabs ───
export const AdvocaciaPainelConfiguracoes = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Equipe, suporte, integrações e conta — tudo em um só lugar.</p>
      </div>

      <Tabs defaultValue="conta" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-6">
          <TabsTrigger value="conta" className="gap-2"><CreditCard className="h-3.5 w-3.5" />Conta</TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2"><Users className="h-3.5 w-3.5" />Equipe</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2"><Plug className="h-3.5 w-3.5" />Integrações</TabsTrigger>
          <TabsTrigger value="suporte" className="gap-2"><LifeBuoy className="h-3.5 w-3.5" />Suporte</TabsTrigger>
        </TabsList>

        <TabsContent value="conta"><ContaTab /></TabsContent>
        <TabsContent value="equipe"><EquipeTab /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppTab /></TabsContent>
        <TabsContent value="integracoes"><IntegracoesTab /></TabsContent>
        <TabsContent value="suporte"><SuporteTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Tab: Conta ───
const ContaTab = () => {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["adv-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const { data: sub } = useQuery({
    queryKey: ["adv-sub", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Perfil</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={profile?.full_name || ""} readOnly className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input value={profile?.email || user?.email || ""} readOnly className="mt-1" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Plano</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sub?.status === "active" ? "Assinatura ativa" : "Sem assinatura ativa"}
            </p>
            <Badge className="mt-2" variant={sub?.status === "active" ? "default" : "secondary"}>
              {sub?.agent_id ? `Agente ${sub.agent_id.slice(0, 8)}` : "—"}
            </Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard?section=billing">Gerenciar</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ─── Tab: Equipe ───
const EquipeTab = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: tenantId } = useQuery({
    queryKey: ["adv-my-tenant", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).limit(1).maybeSingle();
      return data?.tenant_id ?? null;
    },
    enabled: !!user,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["adv-team-members", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase.from("tenant_members").select("user_id, role, created_at").eq("tenant_id", tenantId);
      return data || [];
    },
    enabled: !!tenantId,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const inviteMut = useMutation({
    mutationFn: async (email: string) => {
      // Invite por e-mail é um fluxo administrativo; aqui registramos a intenção como notificação para admin.
      const { error } = await supabase.from("notifications").insert({
        user_id: user!.id,
        type: "team_invite_request",
        title: "Convite para equipe solicitado",
        message: `Convidar ${email} para a equipe.`,
        metadata: { email, tenant_id: tenantId },
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação de convite enviada. Nossa equipe processa em até 1 dia útil.");
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["adv-team-members"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar convite"),
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Convidar membro</h3>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@dominio.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Button
            onClick={() => inviteMut.mutate(inviteEmail)}
            disabled={!inviteEmail || inviteMut.isPending}
          >
            {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-3.5 w-3.5 mr-1.5" />Convidar</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          O convite cria uma solicitação processada pela equipe Clauthor. O membro receberá acesso ao mesmo workspace.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Membros ({members.length})</h3>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Apenas você por enquanto.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m: any) => (
              <li key={m.user_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {m.user_id === user?.id ? "Você" : m.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground truncate">{m.user_id.slice(0, 8)}…</div>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

// ─── Tab: WhatsApp ───
const WhatsAppTab = () => {
  const { user } = useAuth();
  const { data: onb } = useQuery({
    queryKey: ["adv-onb-wpp", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("advocacia_onboarding").select("whatsapp_status, whatsapp_number").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const connected = onb?.whatsapp_status === "connected";

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-md ${connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Chat de WhatsApp</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {connected ? `Conectado: ${onb?.whatsapp_number ?? "—"}` : "Conecte para que seus agentes recebam e enviem mensagens."}
              </p>
            </div>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>{connected ? "Conectado" : "Desconectado"}</Badge>
        </div>
        <Button asChild className="mt-4" variant={connected ? "outline" : "default"}>
          <Link to="/advocacia/onboarding">
            {connected ? "Gerenciar" : "Conectar agora"} <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-2">Caixa de entrada</h3>
        <p className="text-xs text-muted-foreground">As conversas recebidas aparecem em <Link to="/advocacia/painel/captacao" className="text-primary hover:underline">Captação</Link>.</p>
      </Card>
    </div>
  );
};

// ─── Tab: Integrações ───
const IntegracoesTab = () => {
  const { user } = useAuth();
  const { data: onb } = useQuery({
    queryKey: ["adv-onb-int", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("advocacia_onboarding").select("crm_status, clicksign_status, whatsapp_status").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const items = [
    { key: "whatsapp", label: "WhatsApp", desc: "Mensageria via Evolution API", status: onb?.whatsapp_status },
    { key: "clicksign", label: "ClickSign", desc: "Assinatura eletrônica de contratos", status: onb?.clicksign_status },
    { key: "crm", label: "CRM", desc: "Sincronização de leads e clientes", status: onb?.crm_status },
  ];

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-4">Integrações disponíveis</h3>
      <ul className="divide-y divide-border">
        {items.map((it) => {
          const ok = it.status === "connected";
          return (
            <li key={it.key} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ok ? "default" : "secondary"}>{ok ? "Conectada" : "Desconectada"}</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link to="/advocacia/onboarding">{ok ? "Gerenciar" : "Conectar"}</Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

// ─── Tab: Suporte (chamados) ───
const SuporteTab = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["adv-support-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("last_reply_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Chamados</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Resposta média em até 4h úteis.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />Abrir chamado</Button>
            </DialogTrigger>
            <NewTicketDialog onClose={() => setOpen(false)} />
          </Dialog>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <LifeBuoy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Você ainda não abriu nenhum chamado.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t: any) => (
              <li
                key={t.id}
                onClick={() => setActiveTicket(t)}
                className="p-4 hover:bg-muted/30 cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Atualizado em {new Date(t.last_reply_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={t.status === "open" ? "default" : t.status === "resolved" ? "secondary" : "outline"}>
                    {t.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {activeTicket && (
        <TicketThreadDialog ticket={activeTicket} onClose={() => setActiveTicket(null)} />
      )}
    </div>
  );
};

const NewTicketDialog = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject, description, category, priority })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: "user",
        body: description,
      });
      return ticket;
    },
    onSuccess: () => {
      toast.success("Chamado aberto. Resposta em até 4h úteis.");
      qc.invalidateQueries({ queryKey: ["adv-support-tickets"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Falha ao abrir chamado"),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Abrir chamado</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Assunto</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Resumo do problema" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="billing">Faturamento</SelectItem>
                <SelectItem value="agents">Agentes</SelectItem>
                <SelectItem value="integrations">Integrações</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o problema com o máximo de detalhes."
            rows={5}
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => createMut.mutate()} disabled={!subject || !description || createMut.isPending}>
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const TicketThreadDialog = ({ ticket, onClose }: { ticket: any; onClose: () => void }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: messages = [] } = useQuery({
    queryKey: ["adv-ticket-messages", ticket.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem sessão");
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: "user",
        body: reply,
      });
      if (error) throw error;
      await supabase.from("support_tickets").update({ last_reply_at: new Date().toISOString(), status: "open" }).eq("id", ticket.id);
    },
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["adv-ticket-messages", ticket.id] });
      qc.invalidateQueries({ queryKey: ["adv-support-tickets"] });
    },
    onError: (e: any) => toast.error(e.message || "Falha ao enviar"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ticket.subject}
            <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
            <Badge variant={ticket.status === "open" ? "default" : "secondary"}>{ticket.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.author_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.author_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="text-[10px] opacity-70 mb-0.5">
                  {m.author_role === "user" ? "Você" : "Suporte Clauthor"} · {new Date(m.created_at).toLocaleString("pt-BR")}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-border">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva uma resposta…"
            rows={2}
            className="flex-1"
          />
          <Button onClick={() => sendMut.mutate()} disabled={!reply || sendMut.isPending}>
            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvocaciaPainelLayout;
