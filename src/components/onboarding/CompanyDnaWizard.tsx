import { useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import ClauthorLogo from "@/components/ClauthorLogo";
import VideoOwnershipStep, { type Ownership } from "./steps/VideoOwnershipStep";
import CompanyDnaStep from "./steps/CompanyDnaStep";
import BrandingPreviewStep from "./steps/BrandingPreviewStep";
import BusinessContextStep from "./steps/BusinessContextStep";
import {
  useCompanyDna,
  type BrandColors,
  type BrandFont,
  type ScrapeResult,
} from "@/hooks/useCompanyDna";
import { useToast } from "@/hooks/use-toast";

type Step = 0 | 1 | 2 | 3 | 4;

interface State {
  step: Step;
  ownership: Ownership | null;
  clientLabel: string;
  sourceUrl: string;
  colors: BrandColors;
  fonts: BrandFont[];
  logo: string | null;
  favicon: string | null;
  industry: string;
  coreBusiness: string;
  painPoints: string[];
  scrapeError: string | null;
}

const initial: State = {
  step: 0,
  ownership: null,
  clientLabel: "",
  sourceUrl: "",
  colors: {},
  fonts: [],
  logo: null,
  favicon: null,
  industry: "",
  coreBusiness: "",
  painPoints: [],
  scrapeError: null,
};

type Action =
  | { type: "next" }
  | { type: "back" }
  | { type: "goto"; step: Step }
  | { type: "setOwnership"; value: Ownership }
  | { type: "setClientLabel"; value: string }
  | { type: "applyScrape"; result: ScrapeResult }
  | { type: "setColors"; value: BrandColors }
  | { type: "setFonts"; value: BrandFont[] }
  | { type: "setContext"; patch: Partial<Pick<State, "industry" | "coreBusiness" | "painPoints">> }
  | { type: "setScrapeError"; value: string | null };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "next": return { ...s, step: Math.min(4, s.step + 1) as Step };
    case "back": return { ...s, step: Math.max(0, s.step - 1) as Step };
    case "goto": return { ...s, step: a.step };
    case "setOwnership": return { ...s, ownership: a.value };
    case "setClientLabel": return { ...s, clientLabel: a.value };
    case "setScrapeError": return { ...s, scrapeError: a.value };
    case "applyScrape":
      return {
        ...s,
        sourceUrl: a.result.sourceUrl,
        colors: a.result.colors,
        fonts: a.result.fonts?.length ? a.result.fonts : s.fonts,
        logo: a.result.logo,
        favicon: a.result.favicon,
        coreBusiness: s.coreBusiness || a.result.summary || "",
        scrapeError: null,
      };
    case "setColors": return { ...s, colors: a.value };
    case "setFonts": return { ...s, fonts: a.value };
    case "setContext": return { ...s, ...a.patch };
  }
}

interface Props {
  onDone: () => void;
  onSkip: () => void;
}

export default function CompanyDnaWizard({ onDone, onSkip }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { scrape, save, scraping, saving } = useCompanyDna();
  const [state, dispatch] = useReducer(reducer, initial);
  const [finishing, setFinishing] = useState(false);

  const totalSteps = 4;

  const handleOwnership = (v: Ownership) => {
    dispatch({ type: "setOwnership", value: v });
    if (v === "skip") {
      onSkip();
      return;
    }
    dispatch({ type: "next" });
  };

  const handleScrape = async (url: string) => {
    const result = await scrape(url);
    if ("error" in result) {
      dispatch({ type: "setScrapeError", value: result.error });
      return;
    }
    dispatch({ type: "applyScrape", result });
    dispatch({ type: "next" });
  };

  const handleManual = () => {
    dispatch({ type: "setScrapeError", value: null });
    dispatch({ type: "next" });
  };

  const finish = async () => {
    if (state.ownership === null || state.ownership === "skip") return;
    setFinishing(true);
    const saved = await save({
      scope: state.ownership === "client" ? "client" : "own",
      client_label: state.ownership === "client" ? (state.clientLabel || null) : null,
      source_url: state.sourceUrl || null,
      brand_colors: state.colors,
      fonts: state.fonts,
      logo_url: state.logo,
      favicon_url: state.favicon,
      core_business: state.coreBusiness || null,
      industry: state.industry || null,
      pain_points: state.painPoints,
    });
    setFinishing(false);
    if (!saved) {
      toast({ title: "Não foi possível salvar", description: "Tenta de novo em alguns segundos.", variant: "destructive" });
      return;
    }
    toast({ title: "DNA da marca salvo", description: "Thor vai usar essas informações em vídeos, atendimento e roteiros." });
    onDone();
    navigate("/dashboard", { replace: true });
  };

  const canAdvance =
    (state.step === 2 && Object.values(state.colors).some(Boolean)) ||
    (state.step === 3 && state.industry && state.coreBusiness.trim().length > 3);

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="w-full px-6 md:px-10 pt-8 pb-4 flex items-center justify-between">
        <ClauthorLogo size="md" />
        <div className="flex items-center gap-4">
          {state.step > 0 && state.step < 4 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              className="inline-flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} /> Voltar
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="type-caption text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular DNA
          </button>
        </div>
      </header>

      <div className="px-6 md:px-10">
        <div className="max-w-2xl mx-auto flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={[
                "h-px flex-1 transition-colors duration-500",
                i < state.step ? "bg-primary" : "bg-[hsl(var(--hairline))]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <section className="flex-1 flex items-start md:items-center justify-center px-6 md:px-10 py-10">
        <div
          key={state.step}
          className="w-full max-w-4xl animate-fade-in"
          style={{ animationDuration: "400ms" }}
        >
          {state.step === 0 && (
            <VideoOwnershipStep value={state.ownership} onSelect={handleOwnership} />
          )}
          {state.step === 1 && state.ownership && state.ownership !== "skip" && (
            <CompanyDnaStep
              scope={state.ownership === "client" ? "client" : "own"}
              clientLabel={state.clientLabel}
              onClientLabelChange={(v) => dispatch({ type: "setClientLabel", value: v })}
              scraping={scraping}
              onScrape={handleScrape}
              onManual={handleManual}
              error={state.scrapeError}
            />
          )}
          {state.step === 2 && (
            <BrandingPreviewStep
              colors={state.colors}
              fonts={state.fonts}
              logo={state.logo}
              onColorsChange={(c) => dispatch({ type: "setColors", value: c })}
              onFontsChange={(f) => dispatch({ type: "setFonts", value: f })}
            />
          )}
          {state.step === 3 && (
            <BusinessContextStep
              industry={state.industry}
              coreBusiness={state.coreBusiness}
              painPoints={state.painPoints}
              onChange={(patch) => dispatch({ type: "setContext", patch })}
            />
          )}
        </div>
      </section>

      {state.step >= 2 && state.step <= 3 && (
        <footer className="px-6 md:px-10 pb-10">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!canAdvance || finishing || saving}
              onClick={() => {
                if (state.step === 3) { finish(); return; }
                dispatch({ type: "next" });
              }}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {finishing || saving
                ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> Salvando</>
                : state.step === 3
                  ? <><Check className="w-4 h-4" strokeWidth={1.75} /> Finalizar e entrar no Thor</>
                  : <>Continuar</>}
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
