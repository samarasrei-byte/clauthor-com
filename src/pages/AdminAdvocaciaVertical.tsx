import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Scale, Search, ArrowLeft, ExternalLink, Users, Activity } from "lucide-react";

/**
 * AdminAdvocaciaVertical — Painel admin para a vertical jurídica.
 * Permite ao admin@clauthor.com ver todos os tenants jurídicos, métricas
 * agregadas e abrir o painel de qualquer cliente para suporte.
 */

const REQUIRED_LEGAL_SLUGS = [
  "captacao_juridica",
  "diagnostico_juridico",
  "fechamento_juridico",
  "producao_juridica",
  "risco_contratual",
  "recuperacao_leads_juridico",
  "assistente_juridico_operacional",
  "compliance_lgpd_juridico",
];

const AdminAdvocaciaVertical = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-advocacia-tenants"],
    queryFn: async () => {
      // 1. Busca todos os usuários com agentes jurídicos (via subscriptions ou agents)
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, status, monthly_price, current_period_end, created_at, agents(name, status)")
        .eq("status", "active");

      const userIds = [...new Set((subs || []).map((s: any) => s.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at")
        .in("user_id", userIds);

      // 2. Conta execuções recentes por usuário
      const { data: execCounts } = await supabase
        .from("execution_logs")
        .select("user_id")
        .in("user_id", userIds)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString());

      const execByUser = (execCounts || []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.user_id] = (acc[r.user_id] || 0) + 1;
        return acc;
      }, {});

      return (profiles || []).map((p: any) => ({
        ...p,
        executions30d: execByUser[p.user_id] || 0,
        subscriptionsCount: (subs || []).filter((s: any) => s.user_id === p.user_id).length,
      }));
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p>
        </Card>
      </div>
    );
  }

  const filtered = tenants.filter((t: any) =>
    !search ||
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <h1 className="text-base font-semibold">Vertical: Advocacia</h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Visão admin de todos os escritórios jurídicos ativos
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {REQUIRED_LEGAL_SLUGS.length} agentes catalogados
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Escritórios ativos
              </span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading ? "—" : tenants.length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Execuções 30d
              </span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading
                ? "—"
                : tenants.reduce((s: number, t: any) => s + (t.executions30d || 0), 0)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Assinaturas
              </span>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">
              {isLoading
                ? "—"
                : tenants.reduce((s: number, t: any) => s + (t.subscriptionsCount || 0), 0)}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum escritório encontrado.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((t: any) => (
                <li key={t.user_id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.full_name || "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.executions30d} exec/30d</span>
                    <span>·</span>
                    <span>{t.subscriptionsCount} assinaturas</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/dashboard?as_user=${t.user_id}`}>
                      Inspecionar <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AdminAdvocaciaVertical;
