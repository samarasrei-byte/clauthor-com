import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import RevolutionaryOnboarding from "@/components/onboarding/RevolutionaryOnboarding";

/**
 * Rota dedicada de onboarding — ativada logo após o signup em /auth.
 * Renderiza o RevolutionaryOnboarding em modo full-screen sem AppLayout.
 * Se o usuário pular, marca a sessão como "skipped" e o banner no dashboard
 * permite retomar.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#04040a]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSkip = () => {
    try { sessionStorage.setItem("onboarding-skipped-session", "1"); } catch { /* ignore */ }
    navigate("/dashboard", { replace: true });
  };

  const handleComplete = () => {
    try { sessionStorage.removeItem("onboarding-skipped-session"); } catch { /* ignore */ }
    // RevolutionaryOnboarding já navega para /dashboard no final da tela "done".
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo à Clauthor — Monte seu squad em 60s</title>
        <meta name="description" content="20 departamentos, squads customizáveis e +200 especialistas de IA orquestrados. Descubra em 60 segundos qual departamento resolve sua maior dor operacional." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <RevolutionaryOnboarding isOpen onSkip={handleSkip} onComplete={handleComplete} />
    </>
  );
}
