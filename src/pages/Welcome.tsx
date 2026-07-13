import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import QuickOnboarding from "@/components/onboarding/QuickOnboarding";
import RevolutionaryOnboarding from "@/components/onboarding/RevolutionaryOnboarding";

/**
 * Rota dedicada de onboarding · ativada logo após o signup em /auth.
 * Novo fluxo "Dor · Solução Pronta" em 3 passos.
 * `?explore=1` cai no RevolutionaryOnboarding clássico como fallback.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [params] = useSearchParams();
  const explore = params.get("explore") === "1";

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth", { replace: true });
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSkip = () => {
    try { sessionStorage.setItem("onboarding-skipped-session", "1"); } catch { /* ignore */ }
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo à Clauthor · Sua recomendação em 60 segundos</title>
        <meta name="description" content="Responda 3 perguntas rápidas e receba na hora o departamento, squad ou agente ideal para a sua operação." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {explore ? (
        <RevolutionaryOnboarding isOpen onSkip={handleSkip} onComplete={() => { /* self-navigates */ }} />
      ) : (
        <QuickOnboarding onSkip={handleSkip} />
      )}
    </>
  );
}
