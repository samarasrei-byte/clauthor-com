import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { InstantWow } from "@/components/onboarding/InstantWow";
import RevolutionaryOnboarding from "@/components/onboarding/RevolutionaryOnboarding";

/**
 * Rota dedicada de onboarding — ativada logo após o signup em /auth.
 * Fase 1: InstantWow (momento uau em <90s — primeiro entregável real).
 * Fase 2 (opcional): RevolutionaryOnboarding para quem quer explorar mais.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [phase, setPhase] = useState<"wow" | "explore">("wow");

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

  const handleWowDone = () => {
    try { sessionStorage.removeItem("onboarding-skipped-session"); } catch { /* ignore */ }
    navigate("/dashboard", { replace: true });
  };

  const handleWowSkip = () => {
    // Skip do wow → oferece o onboarding explorer clássico.
    setPhase("explore");
  };

  const handleExploreSkip = () => {
    try { sessionStorage.setItem("onboarding-skipped-session", "1"); } catch { /* ignore */ }
    navigate("/dashboard", { replace: true });
  };

  const handleExploreComplete = () => {
    try { sessionStorage.removeItem("onboarding-skipped-session"); } catch { /* ignore */ }
    // RevolutionaryOnboarding já navega para /dashboard.
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo à Clauthor — Primeiro entregável em 90 segundos</title>
        <meta name="description" content="20 departamentos, squads customizáveis e +200 especialistas de IA orquestrados. Veja seu primeiro entregável real em menos de 90 segundos." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {phase === "wow" ? (
        <InstantWow onDone={handleWowDone} onSkip={handleWowSkip} />
      ) : (
        <RevolutionaryOnboarding isOpen onSkip={handleExploreSkip} onComplete={handleExploreComplete} />
      )}
    </>
  );
}
