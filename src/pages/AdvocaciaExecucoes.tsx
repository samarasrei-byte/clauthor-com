import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Workflow,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  Scale,
  PenLine,
  Brain,
  DollarSign,
  Lock,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Catálogo visual reaproveitado do MCPAssistente
const AGENT_META: Record<
  string,
  { short: string; icon: any; color: string; bg: string }
> = {
  AGENTE_SEGURANCA: { short: "Segurança", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
  AGENTE_PROCESSUAL: { short: "Processual", icon: Scale, color: "text-blue-500", bg: "bg-blue-500/10" },
  AGENTE_PRAZOS: { short: "Prazos", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  AGENTE_REDATOR: { short: "Redator", icon: PenLine, color: "text-violet-500", bg: "bg-violet-500/10" },
  AGENTE_ESTRATEGICO: { short: "Estratégico", icon: Brain, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  AGENTE_FINANCEIRO: { short: "Financeiro", icon: DollarSign, color: "text-teal-500" , bg: "bg-teal-500/10"},
};

type Execution = {
  id: string;
  message: string;
  selected_agents: string[];
  triggered_agents: string[];
  routing: any;
  results: any[];
  security_blocked: boolean;
  security_level: string | null;
  security_output: string | null;
  total_ms: number;
  approval_status: string;
  approval_notes: string | null;
  approved_at: string | null;
  status: string;
  created_at: string;
};

export default function AdvocaciaExecucoes() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "Auditoria de Execuções MCP — Clauthor";
  }, []);

  const { data: execs, isLoading } = useQuery({
    queryKey: ["mcp-executions", user?.id, statusFilter],
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("mcp_executions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter === "blocked") q = q.eq("security_blocked", true);
      if (statusFilter === "pending") q = q.eq("approval_status", "pending");
      if (statusFilter === "approved") q = q.eq("approval_status", "approved");
      if (statusFilter === "denied") q = q.eq("approval_status", "denied");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Execution[];
    },
  });

  const filtered = useMemo(() => {
    if (!execs) return [];
    if (!search.trim()) return execs;
    const s = search.toLowerCase();
    return execs.filter(
      (e) =>
        e.message?.toLowerCase().includes(s) ||
        e.routing?.analise?.toLowerCase?.().includes(s),
    );
  }, [execs, search]);

  const stats = useMemo(() => {
    if (!execs) return null;
    const total = execs.length;
    const blocked = execs.filter((e) => e.security_blocked).length;
    const pending = execs.filter((e) => e.approval_status === "pending").length;
    const avgMs = total
      ? Math.round(execs.reduce((acc, e) => acc + (e.total_ms || 0), 0) / total)
      : 0;
    return { total, blocked, pending, avgMs };
  }, [execs]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/advocacia/painel" aria-label="Voltar ao painel">
              <ClauthorLogo size="sm" />
            </Link>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold tracking-tight">
                Auditoria de Execuções MCP
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Histórico do Orquestrador Jurídico · governança e rastreabilidade
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/advocacia/painel/mcp">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-[11px]">
                <Workflow className="w-3 h-3" />
                Voltar ao Assistente
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge
              variant="outline"
              className="text-[10px] gap-1.5 border-primary/30 text-primary bg-primary/5"
            >
              <Activity className="w-3 h-3" />
              Logs do MCP
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight mt-2">
              Toda decisão. Toda execução. Toda aprovação.
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Cada chamada do Orquestrador é registrada com agentes acionados,
              parecer de segurança, status de aprovação humana e tempo total.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Execuções"
            value={stats?.total ?? 0}
            icon={Activity}
            color="text-primary"
            bg="bg-primary/10"
            loading={isLoading}
          />
          <KPICard
            label="Bloqueios CRÍTICO"
            value={stats?.blocked ?? 0}
            icon={ShieldAlert}
            color="text-rose-500"
            bg="bg-rose-500/10"
            loading={isLoading}
          />
          <KPICard
            label="Aguardando aprovação"
            value={stats?.pending ?? 0}
            icon={AlertTriangle}
            color="text-amber-500"
            bg="bg-amber-500/10"
            loading={isLoading}
          />
          <KPICard
            label="Tempo médio"
            value={stats ? `${(stats.avgMs / 1000).toFixed(1)}s` : "—"}
            icon={Clock}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            loading={isLoading}
          />
        </div>

        {/* Filtros */}
        <Card className="p-3 border-border/50 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mensagem ou análise…"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas execuções</SelectItem>
              <SelectItem value="blocked">Bloqueadas (CRÍTICO)</SelectItem>
              <SelectItem value="pending">Aprovação pendente</SelectItem>
              <SelectItem value="approved">Aprovadas</SelectItem>
              <SelectItem value="denied">Negadas</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyAudit />
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <ExecutionRow key={e.id} exec={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────── KPI ────────
function KPICard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  bg: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </p>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      )}
    </Card>
  );
}

// ──────── Linha de execução ────────
function ExecutionRow({ exec }: { exec: Execution }) {
  const [open, setOpen] = useState(false);

  const { statusLabel, statusColor, StatusIcon } = useMemo(() => {
    if (exec.security_blocked && exec.approval_status === "pending") {
      return {
        statusLabel: "Aguardando aprovação",
        statusColor: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5",
        StatusIcon: AlertTriangle,
      };
    }
    if (exec.approval_status === "denied") {
      return {
        statusLabel: "Negada",
        statusColor: "border-muted text-muted-foreground bg-muted/30",
        StatusIcon: X,
      };
    }
    if (exec.security_blocked) {
      return {
        statusLabel: "Bloqueada",
        statusColor: "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/5",
        StatusIcon: ShieldAlert,
      };
    }
    if (exec.approval_status === "approved") {
      return {
        statusLabel: "Aprovada manualmente",
        statusColor: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
        StatusIcon: Lock,
      };
    }
    return {
      statusLabel: "Concluída",
      statusColor: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
      StatusIcon: CheckCircle2,
    };
  }, [exec]);

  const created = new Date(exec.created_at);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/50 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left">
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${exec.security_blocked ? "bg-rose-500/10" : "bg-primary/10"}`}>
              <StatusIcon className={`w-4 h-4 ${exec.security_blocked ? "text-rose-500" : "text-primary"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-[10px] ${statusColor}`}>
                  {statusLabel}
                </Badge>
                {exec.security_level && (
                  <Badge variant="outline" className="text-[10px] border-border/50">
                    Segurança: {exec.security_level}
                  </Badge>
                )}
                {exec.results?.some((r: any) => r.output?.includes("Base Legal")) && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Grounding Validado
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {created.toLocaleDateString("pt-BR")} ·{" "}
                  {created.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  · {(exec.total_ms / 1000).toFixed(1)}s
                </span>
              </div>
              <p className="text-sm leading-snug line-clamp-1">{exec.message}</p>
              {/* Pipeline mini */}
              {exec.triggered_agents?.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {exec.triggered_agents.map((a, i) => {
                    const meta = AGENT_META[a];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={`${a}-${i}`}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${meta.bg}`}
                      >
                        <Icon className={`w-2.5 h-2.5 ${meta.color}`} />
                        <span className={`text-[9px] font-medium ${meta.color}`}>
                          {meta.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-3">
            {exec.routing?.analise && (
              <DetailBlock label="Análise do roteador">
                <p className="text-xs leading-relaxed">{exec.routing.analise}</p>
              </DetailBlock>
            )}

            {exec.security_output && (
              <DetailBlock label="Parecer de Segurança & LGPD">
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {exec.security_output}
                </p>
              </DetailBlock>
            )}

            {exec.approval_notes && (
              <DetailBlock label="Justificativa da aprovação humana">
                <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {exec.approval_notes}
                </p>
                {exec.approved_at && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Registrado em{" "}
                    {new Date(exec.approved_at).toLocaleString("pt-BR")}
                  </p>
                )}
              </DetailBlock>
            )}

            {exec.results?.length > 0 && (
              <DetailBlock label={`Saídas dos agentes (${exec.results.length})`}>
                <div className="space-y-2">
                  {exec.results.map((r: any, i: number) => {
                    const meta = AGENT_META[r.agent];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={`${r.agent}-${i}`}
                        className="rounded-lg border border-border/40 p-2.5"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-5 h-5 rounded ${meta.bg} flex items-center justify-center`}>
                            <Icon className={`w-3 h-3 ${meta.color}`} />
                          </div>
                          <span className="text-[11px] font-medium">{meta.short}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {(r.ms / 1000).toFixed(2)}s
                          </span>
                          {r.error && (
                            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-600">
                              erro
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-foreground/75 whitespace-pre-wrap line-clamp-6">
                          {r.error || r.output}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </DetailBlock>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
        {children}
      </div>
    </div>
  );
}

function EmptyAudit() {
  return (
    <Card className="p-12 border-border/50 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
        <Workflow className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold mb-1">Nenhuma execução registrada</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
        Use o Assistente MCP no painel para começar — toda execução aparece aqui com auditoria completa.
      </p>
      <Link to="/advocacia/painel/mcp">
        <Button size="sm" className="gap-1.5">
          <Workflow className="w-3.5 h-3.5" />
          Abrir Assistente MCP
        </Button>
      </Link>
    </Card>
  );
}
