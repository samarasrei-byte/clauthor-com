import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import QuickOnboarding from "@/components/onboarding/QuickOnboarding";
import RevolutionaryOnboarding from "@/components/onboarding/RevolutionaryOnboarding";
import ThorOnboardingConversation from "@/components/onboarding/ThorOnboardingConversation";

interface HomeReco {
  kind: "departamento" | "squad" | "agente";
  deptId?: string;
  ts: number;
  company_name?: string | null;
  industry?: string | null;
  size?: string | null;
  budget?: string | null;
  main_pain?: string | null;
  business_summary?: string | null;
  last_user_message?: string | null;
}

/**
 * Rota dedicada de onboarding conversacional · Thor 3.0.
 * - Conversa curta (6 perguntas) para coletar DNA da empresa.
 * - Reconfirma a recomendação vinda do chat da home (ou pede exploração).
 * - Ao final, cria contracted_departments com status='pending_payment'
 *   se o usuário confirmou o departamento sugerido.
 * - Redireciona pro /dashboard?first=1 (tour dispara).
 *
 * Fallbacks:
 *   ?explore=1 → RevolutionaryOnboarding clássico.
 *   Sem reco da home e usuário pular → QuickOnboarding.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { save } = useGuidedOnboarding();
  const [params] = useSearchParams();
  const explore = params.get("explore") === "1";
  const [homeReco, setHomeReco] = useState<HomeReco | null>(null);
  const [fallback, setFallback] = useState<"none" | "quick">("none");

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth", { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("clauthor_home_recommendation");
      if (!raw) return;
      const parsed = JSON.parse(raw) as HomeReco;
      if (Date.now() - (parsed.ts ?? 0) < 24 * 60 * 60 * 1000) {
        setHomeReco(parsed);
      }
    } catch { /* ignore */ }
  }, []);

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

  const handleDone = async ({
    recommendation,
    pendingDeptId,
  }: {
    dnaSaved: boolean;
    recommendation: unknown;
    pendingDeptId: string | null;
  }) => {
    // Persist onboarding metadata into profiles (unlocks assistants hierarchy).
    if (homeReco) {
      await save({
        path: homeReco.kind === "departamento" ? "department" : homeReco.kind === "squad" ? "team" : "agent",
        teamGoal: "onboarding_conversation",
        department: homeReco.deptId,
        companySize: "",
        processMaturity: "",
      });
    } else {
      await save({
        path: "team",
        teamGoal: "onboarding_conversation",
        companySize: "",
        processMaturity: "",
      });
    }
    try { sessionStorage.removeItem("clauthor_home_recommendation"); } catch { /* ignore */ }

    // Send to dashboard; dashboard picks up first=1 and pending_dept for tour + card.
    const dest = new URL("/dashboard", window.location.origin);
    dest.searchParams.set("first", "1");
    if (pendingDeptId) dest.searchParams.set("pending_dept", pendingDeptId);
    void recommendation;
    navigate(dest.pathname + dest.search, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo à Clauthor · Conheça sua operação em 60 segundos</title>
        <meta name="description" content="Conversa curta com o Thor para conhecer sua empresa, aplicar sua identidade e personalizar o painel." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {explore ? (
        <RevolutionaryOnboarding isOpen onSkip={handleSkip} onComplete={() => { /* self-navigates */ }} />
      ) : fallback === "quick" ? (
        <QuickOnboarding onSkip={handleSkip} />
      ) : (
        <ThorOnboardingConversation
          homeReco={homeReco}
          onDone={handleDone}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
