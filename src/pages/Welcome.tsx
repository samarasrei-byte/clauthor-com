import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import QuickOnboarding from "@/components/onboarding/QuickOnboarding";
import RevolutionaryOnboarding from "@/components/onboarding/RevolutionaryOnboarding";
import RecommendationStep from "@/components/onboarding/steps/RecommendationStep";
import ClauthorLogo from "@/components/ClauthorLogo";
import { fromHomeChat, type RecommendationResult } from "@/lib/onboarding-recommendation";

interface HomeReco {
  kind: "departamento" | "squad" | "agente";
  deptId?: string;
  ts: number;
}

/**
 * Rota dedicada de onboarding · ativada logo após o signup em /auth.
 * - Se o Thor da home já recomendou algo (sessionStorage), pula direto para
 *   o passo 3 · não pergunta duas vezes.
 * - Caso contrário, roda o fluxo curto de 3 passos.
 * - `?explore=1` → RevolutionaryOnboarding clássico como fallback.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { save } = useGuidedOnboarding();
  const [params] = useSearchParams();
  const explore = params.get("explore") === "1";

  const [homeReco, setHomeReco] = useState<HomeReco | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth", { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("clauthor_home_recommendation");
      if (!raw) return;
      const parsed = JSON.parse(raw) as HomeReco;
      // valid for 24h
      if (Date.now() - (parsed.ts ?? 0) < 24 * 60 * 60 * 1000) {
        setHomeReco(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const hydratedResult = useMemo<RecommendationResult | null>(
    () => (homeReco ? fromHomeChat({ kind: homeReco.kind, deptId: homeReco.deptId }) : null),
    [homeReco],
  );

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

  const handleActivateHydrated = async (href: string) => {
    if (!homeReco) return;
    await save({
      path: homeReco.kind === "departamento" ? "department" : homeReco.kind === "squad" ? "team" : "agent",
      teamGoal: "home_thor_chat",
      department: homeReco.deptId,
      companySize: "",
      processMaturity: "",
    });
    try { sessionStorage.removeItem("clauthor_home_recommendation"); } catch { /* ignore */ }
    navigate(href, { replace: true });
  };

  const handleExploreAll = () => {
    try { sessionStorage.removeItem("clauthor_home_recommendation"); } catch { /* ignore */ }
    navigate("/departamentos", { replace: true });
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
      ) : hydratedResult ? (
        <main className="min-h-dvh bg-background text-foreground flex flex-col">
          <header className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between">
            <ClauthorLogo size="md" />
            <button
              type="button"
              onClick={handleSkip}
              className="type-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular por agora
            </button>
          </header>
          <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
            <div className="w-full max-w-2xl animate-fade-in" style={{ animationDuration: "400ms" }}>
              <RecommendationStep
                result={hydratedResult}
                onActivate={handleActivateHydrated}
                onExploreAll={handleExploreAll}
              />
            </div>
          </section>
        </main>
      ) : (
        <QuickOnboarding onSkip={handleSkip} />
      )}
    </>
  );
}
