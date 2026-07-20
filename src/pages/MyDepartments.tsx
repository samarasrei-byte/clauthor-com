/**
 * /meus-departamentos · lista dos departamentos contratados pelo usuário.
 * Rota autenticada dentro do DashboardLayout.
 *
 * - Se houver contratos → grid de cards "Meus Departamentos" com status, agentes e ações.
 * - Se vazio → empty state com CTA proeminente para o catálogo.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Plus, ArrowRight, Sparkles, Users, CheckCircle2,
  Clock, AlertTriangle, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENT_PACKAGES, formatBRL, getDepartmentById } from "@/data/departmentPackages";
import SEO from "@/components/SEO";

type ContractedDept = {
  id: string;
  department_id: string;
  department_name: string | null;
  status: string;
  monthly_price_cents: number | null;
  agent_count: number | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; icon: any; className: string }> = {
  active: { label: "Ativo", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  pending_payment: { label: "Aguardando pagamento", icon: Clock, className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  paused: { label: "Pausado", icon: AlertTriangle, className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelado", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

const MyDepartments = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContractedDept[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contracted_departments")
        .select("id, department_id, department_name, status, monthly_price_cents, agent_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) console.warn("[MyDepartments] load", error);
      setItems((data ?? []) as ContractedDept[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const activeCount = useMemo(
    () => (items ?? []).filter((d) => d.status === "active").length,
    [items]
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-6 md:py-8">
      <SEO title="Meus Departamentos" description="Departamentos de IA que você contratou." />

      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Meu time
            </span>
          </div>
          <h1 className="dash-hero-title font-display font-semibold">
            Meus Departamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : items && items.length > 0
              ? `${activeCount} ativo${activeCount === 1 ? "" : "s"} · ${items.length} total`
              : "Ainda sem departamentos contratados."}
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shadow-sm">
          <Link to="/departamentos">
            <Plus className="h-3.5 w-3.5" />
            Novo departamento
          </Link>
        </Button>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && items && items.length === 0 && (
        <EmptyState />
      )}

      {!loading && items && items.length > 0 && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {items.map((it, i) => (
            <ContractedCard key={it.id} item={it} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const ContractedCard = ({ item, index }: { item: ContractedDept; index: number }) => {
  const pkg = getDepartmentPackage(item.department_id);
  const status = STATUS_META[item.status] ?? STATUS_META.active;
  const StatusIcon = status.icon;
  const Icon = pkg?.icon ?? Building2;
  const name = pkg?.name ?? item.department_name ?? item.department_id;
  const price = (item.monthly_price_cents ?? 0) / 100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <Icon className="h-4 w-4 text-primary" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-sm truncate">{name}</h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {pkg?.painPoint ?? "Departamento contratado"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] ${status.className} shrink-0`}>
          <StatusIcon className="h-2.5 w-2.5 mr-1" />
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          <span className="tabular-nums">{item.agent_count ?? pkg?.agentSlugs.length ?? 0}</span>
          {" "}agentes
        </span>
        {price > 0 && (
          <span className="font-semibold text-foreground tabular-nums">
            {formatBRL(price)}<span className="text-muted-foreground font-normal">/mês</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Button asChild size="sm" variant="secondary" className="flex-1 text-xs h-8 gap-1">
          <Link to={`/departamento-ativo/${item.department_id}`}>
            Abrir painel
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="text-xs h-8 gap-1 text-muted-foreground">
          <Link to={`/departamentos/${item.department_id}`}>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
};

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-primary/[0.04] via-background to-background p-8 md:p-12 text-center"
  >
    <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-4">
      <Sparkles className="h-5 w-5 text-primary" />
    </div>
    <h2 className="font-display font-semibold text-lg mb-1.5">
      Contrate seu primeiro departamento
    </h2>
    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
      Cada departamento entrega um time completo de agentes que já executam
      tarefas 24/7 no seu negócio. Ativação em minutos.
    </p>

    <div
      className="grid gap-2 max-w-2xl mx-auto mb-6"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
    >
      {DEPARTMENT_PACKAGES.slice(0, 4).map((d) => (
        <Link
          key={d.id}
          to={`/departamentos/${d.id}`}
          className="group rounded-xl border border-border/50 bg-card/60 p-3 text-left hover:border-primary/40 hover:bg-card transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <d.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
            <span className="text-xs font-semibold truncate">
              {d.name.replace("Departamento ", "").replace("de ", "")}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            {formatBRL(d.priceMonthly)}/mês
          </div>
        </Link>
      ))}
    </div>

    <Button asChild size="lg" className="gap-2">
      <Link to="/departamentos">
        <Plus className="h-4 w-4" />
        Ver catálogo completo
      </Link>
    </Button>
  </motion.div>
);

export default MyDepartments;
