/**
 * DashboardEmptyState — "estado zero opinativo".
 *
 * Renderizado quando o usuário autenticado ainda NÃO contratou nenhum
 * departamento. Substitui o `DashboardOverview` denso por uma tela
 * single-focus: uma única CTA primária (contratar 1º departamento) e
 * um link secundário (explorar biblioteca). Zera a fadiga cognitiva
 * de sete abas + hubs + tours concorrentes na primeira visita.
 *
 * Sem efeitos colaterais: puramente apresentacional, recebe callbacks.
 */
import { motion } from "framer-motion";
import { ArrowRight, Building2, Sparkles, ShieldCheck, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { loadDiagnosis, PAIN_TO_RECOMMENDATION } from "@/lib/diagnosis-routing";

interface DashboardEmptyStateProps {
  userName?: string;
  onHireFirstDepartment: () => void;
  onExploreLibrary: () => void;
}

const DashboardEmptyState = ({
  userName,
  onHireFirstDepartment,
  onExploreLibrary,
}: DashboardEmptyStateProps) => {
  const firstName = userName?.split(" ")[0];
  const navigate = useNavigate();
  const diagnosis = loadDiagnosis();
  const rec = diagnosis ? PAIN_TO_RECOMMENDATION[diagnosis.pain] : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center"
      aria-label="Estado inicial: contratar primeiro departamento"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
      >
        <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {firstName ? `Bem-vindo, ${firstName}.` : "Bem-vindo à CLAUTHOR."}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-3 max-w-lg text-[15px] text-muted-foreground"
      >
        Você ainda não contratou nenhum departamento. Escolha um dos 20
        departamentos prontos e monte seu squad em minutos.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Button
          size="lg"
          className="gap-2 px-6"
          onClick={onHireFirstDepartment}
          aria-label="Contratar primeiro departamento"
        >
          Contratar 1º departamento
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="gap-2"
          onClick={onExploreLibrary}
        >
          <Sparkles className="h-4 w-4" />
          Explorar biblioteca
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-emerald" />
          Cancele quando quiser
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          +200 especialistas de IA
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          20 departamentos
        </span>
      </motion.div>
    </motion.section>
  );
};

export default DashboardEmptyState;
