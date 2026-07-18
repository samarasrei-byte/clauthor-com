import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyDna } from "@/hooks/useCompanyDna";
import { trackKpi } from "@/lib/kpiTracker";
import { DEPARTMENT_PACKAGES, getDepartmentById } from "@/data/departmentPackages";
import PainCapture from "@/components/onboarding-zero/PainCapture";
import QuickPicks, { type QuickAnswers } from "@/components/onboarding-zero/QuickPicks";
import Recommendation from "@/components/onboarding-zero/Recommendation";
import CompanyInfoStep, { type CompanyInfo } from "@/components/onboarding-zero/CompanyInfoStep";

type Stage = "pain" | "pick0" | "pick1" | "pick2" | "reco" | "company" | "creating";

const FOCUS_TO_DEPT: Record<QuickAnswers["focus"], string> = {
  vender: "comercial",
  clientes: "atendimento",
  conteudo: "marketing",
  organizar: "financeiro",
};

const FOCUS_TO_BENEFIT: Record<QuickAnswers["focus"], string> = {
  vender: "prospectar e fechar novos clientes",
  clientes: "atender seus clientes 24 horas por dia",
  conteudo: "criar conteúdo e rodar suas campanhas",
  organizar: "organizar seu financeiro e sua operação",
};

/**
 * OnboardingZero · fluxo minimalista "vovô test" para leigos.
 * 5 telas · uma decisão por tela · zero jargão.
 * Salva pain_raw em profiles + cria contracted_departments pending
 * antes de navegar ao /dashboard?activate=1 (Tela 4+5 acontecem lá).
 */
export default function OnboardingZero() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { save: saveDna } = useCompanyDna();
  const [stage, setStage] = useState<Stage>("pain");
  const [pain, setPain] = useState("");
  const [picks, setPicks] = useState<Partial<QuickAnswers>>({});
  const startedAt = useState(() => Date.now())[0];

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth", { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    trackKpi("thor_onboarding_started", { source: "onboarding" });
  }, []);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handlePain = async (raw: string) => {
    setPain(raw);
    trackKpi("thor_onboarding_step", { step: 1, source: "onboarding" });
    // Persist pain_raw immediately so Thor lembra mesmo se o usuário sair.
    try {
      await supabase
        .from("profiles")
        .update({ pain_raw: raw } as never)
        .eq("user_id", user.id);
    } catch { /* non-blocking */ }
    setStage("pick0");
  };

  const handlePick = (key: keyof QuickAnswers, value: string) => {
    const next = { ...picks, [key]: value } as Partial<QuickAnswers>;
    setPicks(next);
    trackKpi("thor_onboarding_step", {
      step: stage === "pick0" ? 2 : stage === "pick1" ? 3 : 4,
      source: "onboarding",
    });
    if (stage === "pick0") setStage("pick1");
    else if (stage === "pick1") setStage("pick2");
    else setStage("reco");
  };

  const chosenDeptId = picks.focus ? FOCUS_TO_DEPT[picks.focus] : "comercial";
  const chosenBenefit = picks.focus ? FOCUS_TO_BENEFIT[picks.focus] : "sua operação comercial";

  const handleAccept = () => {
    // Antes de criar o pending department, coletamos o DNA mínimo:
    // nome da empresa, website e cores da marca.
    setStage("company");
  };

  const finalizeContract = async (info: CompanyInfo | null) => {
    setStage("creating");
    const pkg = getDepartmentById(chosenDeptId) ?? DEPARTMENT_PACKAGES[0];
    // Best-effort DNA save with pain + picks + company info.
    try {
      await saveDna({
        scope: "own",
        client_label: info?.name ?? null,
        source_url: info?.website || null,
        brand_colors: info
          ? {
              primary: info.colors.primary,
              secondary: info.colors.secondary,
              accent: info.colors.accent,
            }
          : {},
        fonts: [],
        logo_url: null,
        favicon_url: null,
        core_business: null,
        pain_points: pain ? [pain] : [],
        industry: null,
      });
    } catch { /* non-blocking */ }

    // Create pending department (payment happens in dashboard modal).
    let pendingId: string | null = null;
    try {
      const { data } = await supabase
        .from("contracted_departments")
        .insert({
          user_id: user.id,
          department_id: pkg.id,
          department_name: pkg.name,
          department_icon: null,
          monthly_price_cents: Math.round(pkg.priceMonthly * 100),
          currency: "BRL",
          agent_count: pkg.agentSlugs.length,
          agent_ids: [],
          pain_point: pain || null,
          company_snapshot: {
            name: info?.name ?? null,
            website: info?.website ?? null,
            brand_colors: info?.colors ?? null,
            contact_name: user.user_metadata?.full_name ?? null,
            email: user.email ?? null,
          } as never,
          onboarding_snapshot: {
            pain_raw: pain,
            picks,
            company: info,
            from: "onboarding_zero",
          } as never,
          status: "pending_payment",
        })
        .select("id")
        .maybeSingle();
      pendingId = data?.id ?? null;
    } catch { /* non-blocking */ }

    trackKpi("thor_onboarding_completed", {
      source: "onboarding",
      kind: "departamento",
      dept_id: pkg.id,
      pain,
      duration_ms: Date.now() - startedAt,
    });

    const url = new URL("/dashboard", window.location.origin);
    url.searchParams.set("first", "1");
    url.searchParams.set("activate", "1");
    if (pendingId) url.searchParams.set("pending_dept", pendingId);
    navigate(url.pathname + url.search, { replace: true });
  };

  const handleExplain = () => {
    // Fallback: envia ao modo completo (conversa com Thor).
    navigate("/welcome?mode=full", { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Bem-vindo · Vamos entender sua dor</title>
        <meta name="description" content="Uma conversa curta com o Thor para descobrir sua dor e montar seu time." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {stage === "pain" && <PainCapture initial={pain} onDone={handlePain} />}
      {stage === "pick0" && <QuickPicks step={0} onPick={handlePick} />}
      {stage === "pick1" && <QuickPicks step={1} onPick={handlePick} />}
      {stage === "pick2" && <QuickPicks step={2} onPick={handlePick} />}
      {stage === "reco" && (
        <Recommendation
          deptId={chosenDeptId}
          humanBenefit={chosenBenefit}
          onAccept={handleAccept}
          onExplain={handleExplain}
        />
      )}
      {stage === "company" && (
        <CompanyInfoStep
          departmentName={(getDepartmentById(chosenDeptId) ?? DEPARTMENT_PACKAGES[0]).name}
          onDone={(info) => finalizeContract(info)}
          onSkip={() => finalizeContract(null)}
        />
      )}
      {stage === "creating" && (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-background gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Montando seu painel…</p>
        </div>
      )}
    </>
  );
}
