/**
 * FlagshipDepartmentsSection — showcase de "Departamentos Prontos" na landing.
 *
 * Renderiza os 3 flagship packages como DepartmentCard, gerencia o LiveDemo
 * (60s) em um Dialog e redireciona a intenção de contratação para
 * `/departamentos?dept=<id>` (a rota já possui todo o fluxo de checkout).
 *
 * Componente puramente frontend — não faz fetch, não altera schema, não
 * duplica lógica de billing.
 */
import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DepartmentCard from "./DepartmentCard";
import {
  FLAGSHIP_DEPARTMENTS,
  type DepartmentPackage,
} from "@/data/departmentPackages";
import { trackKpi } from "@/lib/kpiTracker";

const DepartmentLiveDemo = lazy(() => import("./DepartmentLiveDemo"));

const FlagshipDepartmentsSection = () => {
  const navigate = useNavigate();
  const [demoDept, setDemoDept] = useState<DepartmentPackage | null>(null);

  const handleSeeDemo = (dept: DepartmentPackage) => {
    trackKpi("department_demo_click", {
      department_id: dept.id,
      department_name: dept.name,
      price_monthly: dept.priceMonthly,
      source: "landing",
    });
    setDemoDept(dept);
  };

  const handleHire = (dept: DepartmentPackage, source: "landing" | "live_demo" = "landing") => {
    trackKpi("department_hire_click", {
      department_id: dept.id,
      department_name: dept.name,
      price_monthly: dept.priceMonthly,
      source,
    });
    setDemoDept(null);
    // `auto=1` triggers the existing checkout flow on the /departamentos page.
    navigate(`/departamentos?dept=${dept.id}&auto=1`);
  };

  return (
    <section
      className="py-16 sm:py-24 px-5"
      aria-label="Departamentos Prontos"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            Departamentos Prontos
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
            Contrate um departamento inteiro,
            <br className="hidden sm:block" />
            <span className="text-muted-foreground">não 225 agentes soltos.</span>
          </h2>
          <p className="text-[15px] text-muted-foreground max-w-xl mx-auto">
            Cada departamento resolve uma dor específica com outcome mensurável.
            Veja funcionando em 60 segundos antes de contratar.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
          {FLAGSHIP_DEPARTMENTS.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onSeeLiveDemo={handleSeeDemo}
              onHire={(d) => handleHire(d, "landing")}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            variant="ghost"
            size="lg"
            className="gap-2"
            onClick={() => navigate("/departamentos")}
          >
            Ver todos os departamentos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {demoDept && (
        <Suspense fallback={null}>
          <DepartmentLiveDemo
            department={demoDept}
            open={!!demoDept}
            onOpenChange={(o) => !o && setDemoDept(null)}
            onHire={(d) => handleHire(d, "live_demo")}
          />
        </Suspense>
      )}
    </section>
  );
};

export default FlagshipDepartmentsSection;
