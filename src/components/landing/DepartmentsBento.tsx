/**
 * DepartmentsBento — grade dos departamentos com filtro por objetivo.
 * Reutiliza `DepartmentCard` no variant `compact` e o dado canônico
 * de `departmentPackages`. Sem fetch, puramente presentacional.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DepartmentCard from "@/components/departments/DepartmentCard";
import { DEPARTMENT_PACKAGES, type DepartmentPackage } from "@/data/departmentPackages";
import { cn } from "@/lib/utils";

type Goal = "todos" | "vender" | "estruturar" | "escalar" | "reduzir";

const GOAL_MAP: Record<Goal, string[]> = {
  todos: [],
  vender: ["comercial", "marketing"],
  estruturar: ["juridico", "financeiro", "rh"],
  escalar: ["marketing", "atendimento", "comercial"],
  reduzir: ["atendimento", "financeiro", "juridico"],
};

const GOAL_LABEL: Record<Goal, string> = {
  todos: "Todos",
  vender: "Vender mais",
  estruturar: "Estruturar",
  escalar: "Escalar",
  reduzir: "Reduzir custo",
};

const DepartmentsBento = () => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal>("todos");

  const visible = useMemo<DepartmentPackage[]>(() => {
    if (goal === "todos") return [...DEPARTMENT_PACKAGES];
    const ids = new Set(GOAL_MAP[goal]);
    return DEPARTMENT_PACKAGES.filter((d) => ids.has(d.id));
  }, [goal]);

  const handleHire = (dept: DepartmentPackage) => navigate(`/departamentos#${dept.id}`);
  const handleDemo = (dept: DepartmentPackage) => navigate(`/departamentos#${dept.id}`);

  return (
    <section id="departamentos" className="relative py-20 sm:py-28 px-5" aria-label="Departamentos disponíveis">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 mb-3">Departamentos prontos</p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-foreground">
            Escolha o time que resolve sua dor.
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-muted-foreground max-w-xl mx-auto">
            Cada departamento é um squad completo de agentes especialistas. De <span className="text-foreground font-medium">R$ 1.477,30</span> a <span className="text-foreground font-medium">R$ 1.878,00</span>/mês conforme a complexidade.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/experience")}
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-[13px] font-medium text-destructive-foreground shadow-[0_0_24px_hsl(var(--destructive)/0.35)] transition hover:brightness-110"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
              Ver mesa redonda ao vivo
            </button>
            <button
              onClick={() => navigate("/simulador-social")}
              className="rounded-full border border-border bg-card/40 px-5 py-2.5 text-[13px] text-muted-foreground transition hover:text-foreground hover:border-foreground/30"
            >
              Simulador de redes sociais
            </button>
            <button
              onClick={() => navigate("/departamentos")}
              className="rounded-full border border-border bg-card/40 px-5 py-2.5 text-[13px] text-muted-foreground transition hover:text-foreground hover:border-foreground/30"
            >
              Todos os departamentos
            </button>
          </div>
        </motion.div>

        {/* Filtro */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 sm:mb-12">
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => {
            const active = goal === g;
            return (
              <button
                key={g}
                onClick={() => setGoal(g)}
                aria-pressed={active}
                className={cn(
                  "text-[13px] rounded-full px-4 py-2 transition-all duration-300 border",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-foreground/30",
                )}
              >
                {GOAL_LABEL[g]}
              </button>
            );
          })}
        </div>

        {/* Grid asymmetric — 1st card = hero (2 cols), 2nd = tall (2 rows), resto normal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
          {visible.map((d, i) => (
            <div
              key={d.id}
              className={cn(
                i === 0 && "lg:col-span-2",
                i === 1 && "lg:row-span-1",
              )}
            >
              <DepartmentCard
                department={d}
                variant="compact"
                onHire={handleHire}
                onSeeLiveDemo={handleDemo}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DepartmentsBento;
