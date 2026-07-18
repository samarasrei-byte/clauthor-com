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
import FunnelStepper from "@/components/funnel/FunnelStepper";
import ThorStuckHint from "@/components/funnel/ThorStuckHint";
import { writeFunnel, type FunnelStep } from "@/lib/funnelState";

type Stage = "pain" | "pick0" | "reco" | "company" | "creating";

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

const DRAFT_KEY = "clauthor:onboarding-zero-draft";

interface Draft {
  pain: string;
  focus?: QuickAnswers["focus"];
  stage: Stage;
}

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch { return null; }
}

function writeDraft(d: Draft) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

/**
 * OnboardingZero · fluxo "vovô test" reformulado.
 *
 * Ordem correta: pain (público) → focus (público) → reco (público)
 *   → auth (se anônimo) → company → creating → dashboard.
 *
 * Estado é persistido em sessionStorage pra sobreviver ao redirect de auth.
 */
export default function OnboardingZero() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { save: saveDna } = useCompanyDna();

  const draft = readDraft();
  const [stage, setStage] = useState<Stage>(() => {
    // Se voltou de auth com draft salvo em estado avançado, retoma no company.
    if (draft && user && (draft.stage === "reco" || draft.stage === "company")) {
      return "company";
    }
    return draft?.stage ?? "pain";
  });
  const [pain, setPain] = useState(draft?.pain ?? "");
  const [picks, setPicks] = useState<Partial<QuickAnswers>>(
    draft?.focus ? { focus: draft.focus } : {},
  );
  const startedAt = useState(() => Date.now())[0];

  useEffect(() => {
    trackKpi("thor_onboarding_started", { source: "onboarding" });
  }, []);

  // Persiste rascunho a cada mudança relevante.
  useEffect(() => {
    if (stage === "creating") return;
    writeDraft({ pain, focus: picks.focus, stage });
  }, [pain, picks.focus, stage]);

  const handlePain = async (raw: string) => {
    setPain(raw);
    trackKpi("thor_onboarding_step", { step: 1, source: "onboarding" });
    if (user) {
      try {
        await supabase.from("profiles").update({ pain_raw: raw } as never).eq("user_id", user.id);
      } catch { /* non-blocking */ }
    }
    setStage("pick0");
  };

  const handlePick = (key: keyof QuickAnswers, value: string) => {
    const next = { ...picks, [key]: value } as Partial<QuickAnswers>;
    setPicks(next);
    trackKpi("thor_onboarding_step", { step: 2, source: "onboarding" });
    // Uma única pergunta obrigatória (focus) → direto pra reco.
    setStage("reco");
  };

  const chosenDeptId = picks.focus ? FOCUS_TO_DEPT[picks.focus] : "comercial";
  const chosenBenefit = picks.focus ? FOCUS_TO_BENEFIT[picks.focus] : "sua operação comercial";

  const handleAccept = () => {
    // Se anônimo, manda pra auth e volta pra cá. Draft já está salvo.
    if (!user) {
      writeDraft({ pain, focus: picks.focus, stage: "reco" });
      const next = encodeURIComponent("/welcome");
      navigate(`/auth?signup=1&redirect=${next}`, { replace: false });
      return;
    }
    setStage("company");
  };

  const finalizeContract = async (info: CompanyInfo | null) => {
    if (!user) {
      navigate("/auth?signup=1&redirect=/welcome", { replace: false });
      return;
    }
    setStage("creating");
    const pkg = getDepartmentById(chosenDeptId) ?? DEPARTMENT_PACKAGES[0];
    try {
      await saveDna({
        scope: "own",
        client_label: info?.name ?? null,
        source_url: info?.website || null,
        brand_colors: info
          ? { primary: info.colors.primary, secondary: info.colors.secondary, accent: info.colors.accent }
          : {},
        fonts: [],
        logo_url: null,
        favicon_url: null,
        core_business: null,
        pain_points: pain ? [pain] : [],
        industry: null,
      });
    } catch { /* non-blocking */ }

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

    clearDraft();
    const url = new URL("/dashboard", window.location.origin);
    url.searchParams.set("first", "1");
    url.searchParams.set("activate", "1");
    if (pendingId) url.searchParams.set("pending_dept", pendingId);
    navigate(url.pathname + url.search, { replace: true });
  };

  const handleExplain = () => {
    navigate("/welcome?mode=full", { replace: true });
  };

  const funnelStep: FunnelStep =
    stage === "company" ? "empresa"
    : stage === "creating" ? "pagar"
    : "squad";

  useEffect(() => {
    writeFunnel({
      step: funnelStep,
      departmentId: chosenDeptId,
      departmentLabel: (getDepartmentById(chosenDeptId) ?? DEPARTMENT_PACKAGES[0]).name,
      entry: "thor",
    });
  }, [funnelStep, chosenDeptId]);

  const hintByStage: Record<Stage, string> = {
    pain: "Escreva com suas palavras — mesmo curto ajuda. Ex: 'Preciso vender mais' ou 'Não dou conta do atendimento'.",
    pick0: "Escolha o que mais dói hoje. Você pode contratar mais times depois, sem multa.",
    reco: "Sem cartão pra ver a recomendação. Você só cria conta se decidir seguir.",
    company: "Só o nome já basta. Cores e site são opcionais — o Thor detecta se você preencher o website.",
    creating: "Estou montando seu painel agora…",
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bem-vindo · Vamos entender sua dor</title>
        <meta name="description" content="Uma conversa curta com o Thor para descobrir sua dor e montar seu time." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {stage !== "creating" && <FunnelStepper current={funnelStep} />}
      <ThorStuckHint stepKey={`onboarding-${stage}`} message={hintByStage[stage]} />
      {stage === "pain" && <PainCapture initial={pain} onDone={handlePain} />}
      {stage === "pick0" && <QuickPicks step={0} onPick={handlePick} />}
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
