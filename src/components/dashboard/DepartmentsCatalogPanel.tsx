/**
 * DepartmentsCatalogPanel · exibe o catálogo dos 6 departamentos direto no
 * dashboard, sem exigir navegação para /departamentos. Marketing recebe um
 * destaque de "análise geral" com highlights de entregas.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEPARTMENT_PACKAGES, formatBRL } from "@/data/departmentPackages";

const MARKETING_HIGHLIGHTS = [
  "Análise de performance de ads (ROAS/CAC) em tempo real",
  "Produção de copy, criativos e posts para redes sociais",
  "SEO técnico + calendário editorial 90 dias",
  "Relatórios semanais com decisões acionáveis",
];

const DepartmentsCatalogPanel = () => {
  const navigate = useNavigate();
  const marketing = useMemo(
    () => DEPARTMENT_PACKAGES.find((d) => d.id === "marketing"),
    []
  );
  const others = useMemo(
    () => DEPARTMENT_PACKAGES.filter((d) => d.id !== "marketing"),
    []
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
      aria-label="Catálogo de departamentos"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Departamentos disponíveis
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Escolha o time que resolve sua dor. Ativação em minutos.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/departamentos")}
          className="text-xs gap-1 h-7"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Button>
      </header>

      {/* Destaque · Marketing com análise geral */}
      {marketing && (
        <motion.article
          whileHover={{ y: -2 }}
          onClick={() => navigate(`/departamentos/${marketing.id}`)}
          className="cursor-pointer rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-4 md:p-5 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.4)]"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                <marketing.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-base">
                    {marketing.name}
                  </h3>
                  <Badge className="text-[9px] bg-primary/15 text-primary border-primary/20 uppercase tracking-wider">
                    Análise geral
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                  {marketing.painPoint}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold">
                {formatBRL(marketing.priceMonthly)}
              </div>
              <div className="text-[10px] text-muted-foreground">/mês</div>
            </div>
          </div>

          <ul className="grid sm:grid-cols-2 gap-1.5 mb-3">
            {MARKETING_HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="flex items-start gap-1.5 text-[11px] text-foreground/80"
              >
                <TrendingUp className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {marketing.agentSlugs.length} agentes especializados · 24/7
            </span>
            <span className="text-primary font-medium inline-flex items-center gap-1">
              Ver detalhes <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </motion.article>
      )}

      {/* Grid dos demais departamentos */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((dept, i) => (
          <motion.button
            key={dept.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            onClick={() => navigate(`/departamentos/${dept.id}`)}
            className="group text-left rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-3.5 hover:border-primary/40 hover:bg-card transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-lg bg-muted/60 grid place-items-center group-hover:bg-primary/10 transition-colors">
                <dept.icon className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.6} />
              </div>
              <h3 className="font-display font-semibold text-xs leading-tight">
                {dept.name.replace("Departamento ", "").replace("de ", "")}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2.5 min-h-[2.2em]">
              {dept.painPoint}
            </p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {dept.agentSlugs.length} agentes
              </span>
              <span className="font-semibold text-foreground inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                {formatBRL(dept.priceMonthly)}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
};

export default DepartmentsCatalogPanel;
