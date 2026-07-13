import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Diamond, Plus, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import { getDepartmentById, formatBRL } from "@/data/departmentPackages";
import { WORKFORCE_CATALOG } from "@/data/workforceCatalog";
import AgentsWorkingScene from "@/components/departments/AgentsWorkingScene";
import SEO from "@/components/SEO";
import { useDeptSelection } from "@/stores/deptSelection";
import { toast } from "sonner";

// Custo médio de uma equipe humana equivalente para um departamento (CLT + encargos + gestão)
const HUMAN_TEAM_COST = 90000;

export default function DepartmentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dept = slug ? getDepartmentById(slug) : undefined;
  const inCart = useDeptSelection((s) => (dept ? s.has(dept.id) : false));
  const addToCart = useDeptSelection((s) => s.add);
  const removeFromCart = useDeptSelection((s) => s.remove);

  const agents = useMemo(() => {
    if (!dept) return [];
    return dept.agentSlugs
      .map((s) => WORKFORCE_CATALOG.find((a) => a.id === s))
      .filter((a): a is NonNullable<typeof a> => !!a);
  }, [dept]);

  if (!dept) return <Navigate to="/departamentos" replace />;

  const Icon = dept.icon;
  const savings = HUMAN_TEAM_COST - dept.priceMonthly;
  const savingsPct = Math.round((savings / HUMAN_TEAM_COST) * 100);

  const handleAdd = () => {
    if (inCart) {
      removeFromCart(dept.id);
      toast.message(`${dept.name} removido do carrinho`);
    } else {
      addToCart({
        id: dept.id,
        name: dept.name,
        priceMonthly: dept.priceMonthly,
        agentSlugs: [...dept.agentSlugs],
      });
      toast.success(`${dept.name} adicionado ao carrinho`);
    }
  };

  const handleBuyNow = () => {
    if (!inCart) {
      addToCart({
        id: dept.id,
        name: dept.name,
        priceMonthly: dept.priceMonthly,
        agentSlugs: [...dept.agentSlugs],
      });
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SEO title={`${dept.name} · Clauthor`} description={dept.painPoint} />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <Link to="/departamentos" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar aos departamentos
        </Link>

        {/* Hero */}
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center">
              <Icon className="w-6 h-6 text-white/80" strokeWidth={1.5} />
            </div>
            {dept.flagship && (
              <Badge variant="outline" className="gap-1 border-white/10 bg-white/[0.03] text-white/60 rounded-full">
                <Diamond className="w-3 h-3" /> Flagship
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-white">
            {dept.name}
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed">{dept.painPoint}</p>
        </motion.header>

        {/* Live Scene */}
        <AgentsWorkingScene agentSlugs={dept.agentSlugs} />

        {/* Outcome */}
        <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/40 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Outcome garantido
          </div>
          <p className="mt-2 text-xl md:text-2xl text-white font-medium">{dept.outcome}</p>
        </Card>

        {/* Functionality */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/60" />
            <h2 className="text-2xl font-display font-semibold">Funcionalidades & Responsabilidades</h2>
          </div>
          <p className="text-sm text-white/50 max-w-2xl">
            Cada agente abaixo é um especialista treinado com processos, KPIs e integrações prontas. Todos trabalham 24/7 e reportam para você.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((a) => (
              <Card key={a.id} className="p-4 bg-white/[0.02] border-white/[0.08] rounded-xl space-y-3">
                <div>
                  <div className="text-sm font-semibold text-white">{a.role}</div>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">{a.tagline}.</p>
                </div>
                {a.resultTags && a.resultTags.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Entrega</div>
                    <div className="flex flex-wrap gap-1">
                      {a.resultTags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {a.defaultKPIs && a.defaultKPIs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">KPIs monitorados</div>
                    <div className="text-[11px] text-white/60">{a.defaultKPIs.join(" · ")}</div>
                  </div>
                )}
                {a.suggestedIntegrations && a.suggestedIntegrations.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Integrações</div>
                    <div className="text-[11px] text-white/60">{a.suggestedIntegrations.join(" · ")}</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Economy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-display font-semibold">Economia potencial</h2>
          </div>
          <Card className="p-6 bg-white/[0.02] border-white/10 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Equipe humana</div>
                <div className="mt-1 text-2xl font-semibold text-white/80 line-through decoration-white/30">
                  {formatBRL(HUMAN_TEAM_COST)}
                </div>
                <div className="text-xs text-white/40">por mês</div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider">Com Clauthor</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {formatBRL(dept.priceMonthly)}
                </div>
                <div className="text-xs text-white/40">por mês, outcome incluso</div>
              </div>
              <div>
                <div className="text-xs text-emerald-400/70 uppercase tracking-wider">Você economiza</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-400">
                  {formatBRL(savings)} <span className="text-sm">({savingsPct}%)</span>
                </div>
                <div className="text-xs text-white/40">por mês</div>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
          <div>
            <div className="text-sm text-white/50">Pronto para contratar?</div>
            <div className="text-2xl font-semibold text-white mt-1">
              {formatBRL(dept.priceMonthly)}<span className="text-sm text-white/40"> / mês</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/departamentos")}>Ver outros</Button>
            <PremiumCTAButton variant="red" onClick={() => navigate(`/contratar/${dept.id}`)}>
              Contratar por {formatBRL(dept.priceMonthly)} <ArrowRight className="w-4 h-4 ml-2" />
            </PremiumCTAButton>
          </div>
        </div>
      </div>
    </div>
  );
}
