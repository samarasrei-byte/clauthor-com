import { ArrowRight, Sparkles } from "lucide-react";
import type { RecommendationResult } from "@/lib/onboarding-recommendation";

interface Props {
  result: RecommendationResult;
  onActivate: (href: string) => void;
  onExploreAll: () => void;
}

export default function RecommendationStep({ result, onActivate, onExploreAll }: Props) {
  const { primary, alternatives, empathyLine } = result;

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-primary">Com base no que você nos disse</p>
        <h1 className="type-display font-serif italic text-4xl md:text-5xl tracking-tight text-foreground">
          {primary.title}.
        </h1>
        <p className="type-body text-muted-foreground max-w-xl mx-auto italic">
          {empathyLine}
        </p>
      </header>

      {/* Primary card */}
      <article className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <p className="type-eyebrow text-primary">Recomendado para você</p>
            <p className="type-title text-lg font-medium text-foreground">{primary.title}</p>
          </div>
        </div>
        <p className="type-body text-foreground/80 leading-relaxed">{primary.pitch}</p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onActivate(primary.href)}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {primary.cta}
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onExploreAll}
            className="inline-flex items-center justify-center h-11 px-5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Explorar catálogo completo
          </button>
        </div>
      </article>

      {/* Alternatives */}
      <div className="space-y-3">
        <p className="type-eyebrow text-muted-foreground text-center">Ou considere</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alternatives.map((alt) => (
            <button
              key={alt.kind + alt.targetId}
              type="button"
              onClick={() => onActivate(alt.href)}
              className="group text-left surface-1 hover:bg-[hsl(var(--surface-2))] rounded-xl p-5 transition-all border border-transparent hover:border-[hsl(var(--hairline))]"
            >
              <p className="type-caption text-muted-foreground uppercase tracking-wider">{alt.kind === "department" ? "Departamento" : alt.kind === "squad" ? "Squad" : "Agente"}</p>
              <p className="type-title text-[15px] font-medium text-foreground mt-1">{alt.title}</p>
              <p className="type-caption text-muted-foreground mt-2 line-clamp-2">{alt.pitch}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-foreground/70 group-hover:text-primary transition-colors">
                {alt.cta} <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onExploreAll}
          className="type-caption text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Não é isso? Ver todas as opções
        </button>
      </div>
    </div>
  );
}
