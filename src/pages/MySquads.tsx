/**
 * /meus-squads · squads que o usuário assinou (via departamentos ou pacotes squad).
 *
 * Como o sistema ainda cobra por **departamento** (não por squad avulso), esta
 * página mostra os squads implicitamente ativos a partir dos departamentos
 * contratados + convida para o catálogo de squads verticais.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UsersRound, Plus, ArrowRight, Wand, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SQUADS } from "@/data/squads";
import SEO from "@/components/SEO";

type ContractedDept = {
  id: string;
  department_id: string;
  department_name: string | null;
  status: string;
};

type CustomSquad = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  squad_agents: { agents: { id: string; name: string; tier: string | null } | null }[];
};

const MySquads = () => {
  const { user } = useAuth();
  const [contracted, setContracted] = useState<ContractedDept[] | null>(null);
  const [customSquads, setCustomSquads] = useState<CustomSquad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setContracted([]); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [{ data: contractedData }, { data: tenantRow }] = await Promise.all([
        supabase
          .from("contracted_departments")
          .select("id, department_id, department_name, status")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).maybeSingle(),
      ]);
      let squadsData: CustomSquad[] = [];
      if (tenantRow?.tenant_id) {
        const { data } = await supabase
          .from("squads")
          .select("id, name, description, created_at, squad_agents(agents(id, name, tier))")
          .eq("tenant_id", tenantRow.tenant_id)
          .order("created_at", { ascending: false });
        squadsData = (data ?? []) as any;
      }
      if (cancelled) return;
      setContracted((contractedData ?? []) as ContractedDept[]);
      setCustomSquads(squadsData);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const activeSquads = useMemo(() => {
    if (!contracted || contracted.length === 0) return [] as typeof SQUADS;
    const depIds = new Set(contracted.map((c) => c.department_id));
    return SQUADS.filter((s) => depIds.has(s.slug));
  }, [contracted]);

  const isEmpty = !loading && activeSquads.length === 0 && customSquads.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-6 md:py-8">
      <SEO title="Meus Squads" description="Squads verticais de IA ativos na sua conta." />

      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersRound className="h-4 w-4 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Meu time
            </span>
          </div>
          <h1 className="dash-hero-title font-display font-semibold">Meus Squads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Carregando..." : (() => {
              const total = activeSquads.length + customSquads.length;
              return total > 0
                ? `${total} squad${total === 1 ? "" : "s"} no seu time`
                : "Ainda sem squads.";
            })()}
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shadow-sm">
          <Link to="/dashboard/squads">
            <Plus className="h-3.5 w-3.5" />
            Contratar squad
          </Link>
        </Button>
      </header>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {isEmpty && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-primary/[0.04] via-background to-background p-8 md:p-12 text-center"
        >
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center mb-4">
            <Wand className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-lg mb-1.5">
            Monte seu primeiro squad
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Squads são times verticais especializados: Reputação, SDR, Tráfego,
            Conteúdo, Sucesso do Cliente e mais. Escolha, ative, resultado.
          </p>

          <div
            className="grid gap-2 max-w-3xl mx-auto mb-6"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
          >
            {SQUADS.slice(0, 4).map((s) => (
              <Link
                key={s.slug}
                to={`/dashboard/squads/${s.slug}`}
                className="group rounded-xl border border-border/50 bg-card/60 p-3 text-left hover:border-primary/40 hover:bg-card transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UsersRound className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
                  <span className="text-xs font-semibold truncate">{s.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-2">
                  {s.tagline}
                </div>
              </Link>
            ))}
          </div>

          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard/squads">
              <Plus className="h-4 w-4" />
              Ver catálogo de squads
            </Link>
          </Button>
        </motion.div>
      )}

      {!loading && customSquads.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Squads criados por você
            </h2>
            <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] gap-1">
              <Link to="/dashboard?tab=workspace&view=squads">
                Gerenciar <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
          >
            {customSquads.map((s, i) => {
              const agents = s.squad_agents?.map((sa) => sa.agents).filter(Boolean) ?? [];
              return (
                <motion.article
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-sm truncate">{s.name}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {s.description || `${agents.length} agente${agents.length === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0 gap-1">
                      <Bot className="h-2.5 w-2.5" /> {agents.length}
                    </Badge>
                  </div>
                  {agents.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agents.slice(0, 4).map((a) => (
                        <Badge key={a!.id} variant="outline" className="text-[9px]">
                          {a!.name}
                        </Badge>
                      ))}
                      {agents.length > 4 && (
                        <Badge variant="outline" className="text-[9px]">+{agents.length - 4}</Badge>
                      )}
                    </div>
                  )}
                  <Button asChild size="sm" variant="secondary" className="w-full text-xs h-8 gap-1">
                    <Link to="/dashboard?tab=workspace&view=squads">
                      Abrir no workspace <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {!loading && activeSquads.length > 0 && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Squads verticais ativos
          </h2>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {activeSquads.map((s, i) => (
            <motion.article
              key={s.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-sm truncate">{s.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {s.tagline}
                  </p>
                </div>
                <Badge className="text-[9px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30 shrink-0">
                  Ativo
                </Badge>
              </div>
              <Button asChild size="sm" variant="secondary" className="w-full text-xs h-8 gap-1">
                <Link to={s.overrideHref ?? `/squads/${s.slug}`}>
                  Abrir squad
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </motion.article>
          ))}
        </div>
        </>
      )}
    </div>
  );
};

export default MySquads;
