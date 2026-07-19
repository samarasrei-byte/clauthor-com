import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import { supabase } from "@/integrations/supabase/client";
import ThorOnboardingConversation from "@/components/onboarding/ThorOnboardingConversation";
import OnboardingZero from "@/pages/OnboardingZero";


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
 * Rota /welcome · dois modos apenas:
 *   default → OnboardingZero (fluxo curto público, "vovô test")
 *   ?mode=full → ThorOnboardingConversation (fallback power-user)
 *
 * Rotas antigas (?explore=1, QuickOnboarding, RevolutionaryOnboarding)
 * foram removidas para evitar fragmentação de funil.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { save } = useGuidedOnboarding();
  const [params] = useSearchParams();
  const mode = params.get("mode"); // "full" apenas
  const [homeReco] = useState<HomeReco | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("clauthor_home_recommendation");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as HomeReco;
      if (Date.now() - (parsed.ts ?? 0) < 24 * 60 * 60 * 1000) return parsed;
    } catch { /* ignore */ }
    return null;
  });

  // Modo full continua exigindo auth (é conversa longa).
  // OnboardingZero é público até o passo "reco".
  useEffect(() => {
    if (mode === "full" && !isLoading && !user) navigate("/auth?redirect=/welcome%3Fmode%3Dfull", { replace: true });
  }, [mode, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleSkip = () => {
    try { sessionStorage.setItem("onboarding-skipped-session", "1"); } catch { /* ignore */ }
    navigate(user ? "/dashboard" : "/", { replace: true });
  };

  const handleDone = async ({
    recommendation,
    pendingDeptId,
    contractKind,
  }: {
    dnaSaved: boolean;
    recommendation: unknown;
    pendingDeptId: string | null;
    contractKind: "squad" | "departamento" | "agente" | null;
  }) => {
    const effectiveKind = contractKind ?? homeReco?.kind ?? null;
    await save({
      path: effectiveKind === "departamento" ? "department" : effectiveKind === "agente" ? "agent" : "team",
      teamGoal: "onboarding_conversation",
      department: homeReco?.deptId,
      companySize: "",
      processMaturity: "",
    });
    try { sessionStorage.removeItem("clauthor_home_recommendation"); } catch { /* ignore */ }
    void recommendation;

    if (effectiveKind === "squad") { navigate("/squads?from=onboarding", { replace: true }); return; }
    if (effectiveKind === "agente") { navigate("/library?from=onboarding", { replace: true }); return; }
    const dest = new URL("/dashboard", window.location.origin);
    dest.searchParams.set("first", "1");
    if (pendingDeptId) dest.searchParams.set("pending_dept", pendingDeptId);
    navigate(dest.pathname + dest.search, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo à Clauthor · Conheça sua operação em 60 segundos</title>
        <meta name="description" content="Conversa curta com o Thor para conhecer sua empresa, aplicar sua identidade e personalizar o painel." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {mode === "full" && user ? (
        <ThorOnboardingConversation
          homeReco={homeReco}
          onDone={handleDone}
          onSkip={handleSkip}
        />
      ) : (
        <OnboardingZero />
      )}
    </>
  );
}

