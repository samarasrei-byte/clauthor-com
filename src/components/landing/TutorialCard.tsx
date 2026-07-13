/**
 * TutorialCard — card editorial que renderiza um passo-a-passo de integração
 * dentro da bolha de mensagem do Thor. Linguagem 100% leiga.
 */
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationTutorial } from "@/lib/integrationTutorials";

interface TutorialCardProps {
  tutorial: IntegrationTutorial;
  className?: string;
}

export default function TutorialCard({ tutorial, className }: TutorialCardProps) {
  const navigate = useNavigate();

  if (tutorial.stub) {
    return (
      <article className={cn("rounded-2xl border border-border/50 bg-muted/20 p-5 space-y-3", className)}>
        <div className="flex items-center gap-2">
          <span className="type-eyebrow text-muted-foreground">Integração</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-2 py-0.5 rounded-full border border-border/40">
            Em breve
          </span>
        </div>
        <h4 className="font-serif italic text-xl leading-tight text-foreground">{tutorial.name}</h4>
        <p className="type-body text-foreground/70">{tutorial.summary}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(tutorial.cta.href)}
          className="mt-1"
        >
          {tutorial.cta.label}
        </Button>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/[0.02] p-6 space-y-5",
        className,
      )}
    >
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="type-eyebrow text-primary">Tutorial de integração</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {tutorial.est_minutes} min
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground capitalize">
            <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            {tutorial.difficulty}
          </span>
        </div>
        <h4 className="font-serif italic text-2xl leading-tight tracking-tight text-foreground">
          Conectar {tutorial.name}
        </h4>
        <p className="type-body text-foreground/75 leading-relaxed">{tutorial.summary}</p>
      </header>

      {/* Prerequisites */}
      {tutorial.prereq.length > 0 && (
        <section className="rounded-lg bg-background/60 border border-border/40 p-4 space-y-2">
          <h5 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Antes de começar
          </h5>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-foreground/80">
            {tutorial.prereq.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary/60 select-none">·</span>
                <div className="prose prose-sm max-w-none [&>*]:my-0 [&_strong]:font-semibold [&_strong]:text-foreground">
                  <ReactMarkdown>{item}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      <section className="space-y-4">
        <h5 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Passo a passo
        </h5>
        <ol className="space-y-4">
          {tutorial.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary text-[13px] font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1 pt-0.5">
                <p className="text-[14px] font-medium text-foreground leading-snug">{step.title}</p>
                <div className="prose prose-sm max-w-none text-[13.5px] text-foreground/75 leading-relaxed [&>*]:my-0 [&_strong]:font-semibold [&_strong]:text-foreground">
                  <ReactMarkdown>{step.description}</ReactMarkdown>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <div className="pt-2">
        <Button
          onClick={() => navigate(tutorial.cta.href)}
          className="gap-1.5 h-11 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {tutorial.cta.label}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  );
}
