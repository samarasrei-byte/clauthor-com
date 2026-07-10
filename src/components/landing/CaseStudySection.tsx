/**
 * CaseStudySection — depoimentos REAIS na landing.
 *
 * Renderiza nada se `CASE_STUDIES` estiver vazio. Isso é intencional:
 * melhor não ter social proof do que ter social proof fake.
 *
 * Design: austero, sem ilustrações inventadas. Foco na métrica + quote + logo.
 */
import { CASE_STUDIES } from "@/data/caseStudies";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const CaseStudySection = () => {
  if (CASE_STUDIES.length === 0) return null;

  return (
    <section
      className="border-t border-border/40 bg-muted/20 px-5 py-20 sm:py-28"
      aria-label="Casos reais de clientes"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-14 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Clientes · resultados auditáveis
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Números reais, medidos em produção
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Cada métrica abaixo foi mensurada no dashboard do cliente e autorizada por escrito.
          </p>
        </header>

        <div
          className={cn(
            "grid gap-6",
            CASE_STUDIES.length === 1
              ? "mx-auto max-w-2xl"
              : CASE_STUDIES.length === 2
                ? "sm:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {CASE_STUDIES.map((cs) => (
            <article
              key={cs.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header: logo + industry */}
              <div className="mb-6 flex items-center justify-between gap-4">
                {cs.logoUrl ? (
                  <img
                    src={cs.logoUrl}
                    alt={`Logo ${cs.companyName}`}
                    className="h-8 w-auto max-w-[140px] object-contain opacity-80"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-sm font-semibold text-foreground">
                    {cs.companyName}
                  </div>
                )}
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {cs.industry}
                </div>
              </div>

              {/* Headline metric */}
              <div className="mb-6">
                <div className="text-5xl font-bold tabular-nums tracking-tight text-primary">
                  {cs.headlineMetric.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {cs.headlineMetric.label}
                </div>
              </div>

              {/* Secondary metrics */}
              {cs.secondaryMetrics && cs.secondaryMetrics.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                  {cs.secondaryMetrics.slice(0, 2).map((m, i) => (
                    <div key={i}>
                      <div className="text-lg font-semibold tabular-nums text-foreground">
                        {m.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote className="mt-auto">
                <Quote
                  className="mb-2 h-4 w-4 text-muted-foreground/60"
                  aria-hidden
                />
                <p className="text-sm italic leading-relaxed text-foreground">
                  “{cs.quote}”
                </p>
                <footer className="mt-4 text-xs">
                  <div className="font-semibold text-foreground">
                    {cs.attribution.name}
                  </div>
                  <div className="text-muted-foreground">
                    {cs.attribution.role}
                  </div>
                </footer>
              </blockquote>

              {/* Measured badge */}
              <div className="mt-4 border-t border-border/40 pt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Mensurado em {cs.measuredAt}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
