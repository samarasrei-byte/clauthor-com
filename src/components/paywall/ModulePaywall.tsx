import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Wand, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENT_PACKAGES } from "@/data/departmentPackages";
import { trackKpi } from "@/lib/kpiTracker";

interface ModulePaywallProps {
  module?: string;
  moduleLabel: string;
  moduleDescription: string;
  requiredDepartments: string[];
  benefits?: string[];
}

/**
 * Paywall exibido quando o usuário tenta acessar um módulo premium
 * sem ter contratado o(s) departamento(s) necessário(s).
 */
export default function ModulePaywall({
  module,
  moduleLabel,
  moduleDescription,
  requiredDepartments,
  benefits = [],
}: ModulePaywallProps) {
  const navigate = useNavigate();
  const options = requiredDepartments
    .map((id) => DEPARTMENT_PACKAGES.find((d) => d.id === id))
    .filter(Boolean) as (typeof DEPARTMENT_PACKAGES)[number][];

  useEffect(() => {
    trackKpi("paywall_view", {
      module,
      required_departments: requiredDepartments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const handleHire = (deptId: string) => {
    trackKpi("paywall_cta_click", {
      module,
      cta_department_id: deptId,
      required_departments: requiredDepartments,
    });
    navigate(`/departamento/${deptId}`);
  };

  const formatPrice = (brl: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(brl);

  return (
    <>
      <Helmet>
        <title>{moduleLabel} · Contrate para desbloquear</title>
        <meta name="description" content={`${moduleLabel} · ${moduleDescription}`} />
      </Helmet>

      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto p-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-10"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 grid place-items-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <Badge variant="secondary" className="mx-auto">
              <Wand className="w-3 h-3 mr-1" /> Módulo Premium
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {moduleLabel} está bloqueado
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {moduleDescription}
            </p>
          </motion.div>

          {benefits.length > 0 && (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid md:grid-cols-2 gap-3 mb-10"
            >
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 rounded-xl border border-border/40 bg-card/50 p-3 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </motion.ul>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Contrate um destes departamentos para desbloquear
            </h2>
            <div className="grid gap-3">
              {options.map((dept, i) => {
                const Icon = dept.icon;
                return (
                  <motion.button
                    key={dept.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    onClick={() => handleHire(dept.id)}
                    className="group text-left rounded-2xl border border-border/50 hover:border-primary/60 bg-card/50 hover:bg-card p-5 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold tracking-tight">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {dept.outcome}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-semibold">
                          {formatPrice(dept.priceMonthly)}
                          <span className="text-muted-foreground/70 text-xs font-normal">/mês</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {dept.agentSlugs.length} agentes
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/departamentos")}>
              Ver todos os departamentos
            </Button>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Button>
          </div>
        </div>
      </div>
    </>
  );
}
