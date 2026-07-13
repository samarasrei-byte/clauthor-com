import { useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ClauthorLogo from "@/components/ClauthorLogo";
import PainStep from "./steps/PainStep";
import ContextStep from "./steps/ContextStep";
import RecommendationStep from "./steps/RecommendationStep";
import { useGuidedOnboarding, type OnboardingPath } from "@/hooks/useGuidedOnboarding";
import { recommend, type Pain, type CompanySize, type Familiarity } from "@/lib/onboarding-recommendation";

type Step = 0 | 1 | 2;

interface State {
  step: Step;
  pain: Pain | null;
  sector: string;
  size: CompanySize | null;
  familiarity: Familiarity | null;
}

type Action =
  | { type: "next" }
  | { type: "back" }
  | { type: "setPain"; pain: Pain }
  | { type: "setContext"; patch: Partial<Pick<State, "sector" | "size" | "familiarity">> };

const initial: State = { step: 0, pain: null, sector: "", size: null, familiarity: null };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "next": return { ...s, step: Math.min(2, s.step + 1) as Step };
    case "back": return { ...s, step: Math.max(0, s.step - 1) as Step };
    case "setPain": return { ...s, pain: a.pain };
    case "setContext": return { ...s, ...a.patch };
  }
}

const sizeToPath = (size: CompanySize | null): OnboardingPath =>
  size === "11-50" || size === "50+" ? "department" : "team";

export default function QuickOnboarding({ onSkip }: { onSkip: () => void }) {
  const navigate = useNavigate();
  const { save } = useGuidedOnboarding();
  const [state, dispatch] = useReducer(reducer, initial);

  const result = useMemo(() => {
    if (!state.pain || !state.size || !state.familiarity) return null;
    return recommend({
      pain: state.pain,
      sector: state.sector || "Outro",
      size: state.size,
      familiarity: state.familiarity,
    });
  }, [state.pain, state.sector, state.size, state.familiarity]);

  const canAdvance =
    (state.step === 0 && !!state.pain) ||
    (state.step === 1 && !!state.size && !!state.familiarity && !!state.sector);

  const handleActivate = async (href: string) => {
    if (!state.pain || !state.size || !state.familiarity) return;
    await save({
      path: sizeToPath(state.size),
      teamGoal: state.pain,
      department: result?.primary.targetId,
      companySize: state.size,
      processMaturity: state.familiarity,
    });
    try {
      sessionStorage.setItem(
        "clauthor_onboarding_recommendation",
        JSON.stringify(result),
      );
    } catch { /* ignore */ }
    navigate(href, { replace: true });
  };

  const handleExploreAll = async () => {
    if (state.pain && state.size && state.familiarity) {
      await save({
        path: sizeToPath(state.size),
        teamGoal: state.pain,
        department: result?.primary.targetId,
        companySize: state.size,
        processMaturity: state.familiarity,
      });
    }
    navigate("/departamentos", { replace: true });
  };

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between">
        <ClauthorLogo size="md" />
        {state.step === 0 && (
          <button
            type="button"
            onClick={onSkip}
            className="type-caption text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular por agora
          </button>
        )}
        {state.step > 0 && state.step < 2 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "back" })}
            className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Voltar
          </button>
        )}
      </header>

      {/* Progress rail */}
      <div className="px-6 md:px-10">
        <div className="max-w-2xl mx-auto flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={[
                "h-px flex-1 transition-colors duration-500",
                i <= state.step ? "bg-primary" : "bg-[hsl(var(--hairline))]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-12">
        <div
          key={state.step}
          className="w-full max-w-2xl animate-fade-in"
          style={{ animationDuration: "400ms" }}
        >
          {state.step === 0 && (
            <PainStep
              value={state.pain}
              onSelect={(p) => { dispatch({ type: "setPain", pain: p }); }}
            />
          )}
          {state.step === 1 && (
            <ContextStep
              sector={state.sector}
              size={state.size}
              familiarity={state.familiarity}
              onChange={(patch) => dispatch({ type: "setContext", patch })}
            />
          )}
          {state.step === 2 && result && (
            <RecommendationStep
              result={result}
              onActivate={handleActivate}
              onExploreAll={handleExploreAll}
            />
          )}
        </div>
      </section>

      {/* Footer CTA (steps 0 and 1) */}
      {state.step < 2 && (
        <footer className="px-6 md:px-10 pb-10">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => dispatch({ type: "next" })}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {state.step === 0 ? "Continuar" : "Ver recomendação"}
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
