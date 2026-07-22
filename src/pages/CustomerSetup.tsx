import { useParams, useSearchParams, Navigate } from "react-router-dom";
import OnboardingPremium from "@/components/onboarding-premium";
import type { SubjectType } from "@/hooks/useCustomerOnboarding";

const VALID: SubjectType[] = ["agent", "squad", "department"];

const SUBJECT_LABEL: Record<SubjectType, string> = {
  squad: "Squad",
  department: "Departamento",
  agent: "Agente",
};

/**
 * /setup/:type/:ref · rota canônica do onboarding premium.
 * Mostra um shell com contexto do subject e monta o OnboardingPremium por cima
 * (welcome modal + drawer + tour + test + success + floating).
 */
export default function CustomerSetup() {
  const { type, ref } = useParams<{ type: string; ref: string }>();
  const [sp] = useSearchParams();
  const name = sp.get("name") ?? undefined;

  if (!type || !ref || !VALID.includes(type as SubjectType)) {
    return <Navigate to="/dashboard" replace />;
  }

  const subjectType = type as SubjectType;
  const label = SUBJECT_LABEL[subjectType];

  return (
    <OnboardingPremium subjectType={subjectType} subjectRef={ref} subjectName={name}>
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/50 text-xs text-muted-foreground mb-4">
            <span>{label}</span>
            <span className="opacity-40">·</span>
            <span className="font-mono">{ref}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {name ?? `Configurando sua ${label}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            O Thor vai te guiar passo a passo. Basta seguir as missões do painel lateral.
          </p>
        </div>
      </div>
    </OnboardingPremium>
  );
}
