/**
 * CaseStudySection — depoimentos na landing.
 *
 * Design: estética Apple/Notion. Sombras mínimas (apenas hairline border),
 * tipografia leve com tracking negativo, spacing generoso, hierarquia clara.
 * Placeholders são renderizados com selo "Exemplo" para transparência.
 */
import { CASE_STUDIES } from "@/data/caseStudies";
import { cn } from "@/lib/utils";

const CaseStudySection = () => {
  if (CASE_STUDIES.length === 0) return null;

  return (
    <section
      className="relative border-t border-border/40 bg-background px-5 py-24 sm:py-32"
      aria-label="Casos reais de clientes"
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Header — refinado, sem all-caps agressivo */}
        <header className="mb-16 max-w-2xl">
          <div className="mb-4 text-[11px] font-medium tracking-[0.14em] text-muted-foreground/80">
            Casos de clientes
          </div>
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
            Resultados medidos em produção.
          </h2>
          <p className="mt-5 text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
            Cada métrica abaixo é auditável no dashboard do cliente e autorizada por escrito.
          </p>
        </header>

        {/* Grid — gap generoso, cards sem sombra pesada */}
        <div
          className={cn(
            "grid gap-4 sm:gap-5",
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
              className={cn(
                // Base Apple-like: soft surface, hairline border, subtle inner glow
                "group relative flex flex-col rounded-3xl border border-border/50 bg-card/60 p-8 backdrop-blur-sm",
                "transition-all duration-500 ease-out",
                "hover:border-border hover:bg-card/80",
                // Sombra mínima — só um hint em hover
                "shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)]"
              )}
            >
              {/* Placeholder badge — transparência sobre exemplos */}
              {cs.isPlaceholder && (
                <div className="absolute right-5 top-5 rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground backdrop-blur-md">
                  Exemplo
                </div>
              )}

              {/* Header: logo/nome + setor */}
              <div className="mb-10 flex flex-col gap-1.5">
                {cs.logoUrl ? (
                  <img
                    src={cs.logoUrl}
                    alt={`Logo ${cs.companyName}`}
                    className="h-7 w-auto max-w-[120px] object-contain opacity-70"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-[15px] font-medium tracking-tight text-foreground">
                    {cs.companyName}
                  </div>
                )}
                <div className="text-[11px] tracking-wide text-muted-foreground/80">
                  {cs.industry}
                  {cs.departmentUsed ? ` · ${cs.departmentUsed}` : ""}
                </div>
              </div>

              {/* Headline metric — hero number com tracking apertado */}
              <div className="mb-8">
                <div className="text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-foreground">
                  {cs.headlineMetric.value}
                </div>
                <div className="mt-2 text-sm font-light text-muted-foreground">
                  {cs.headlineMetric.label}
                </div>
              </div>

              {/* Métricas secundárias — divisor ultra-sutil */}
              {cs.secondaryMetrics && cs.secondaryMetrics.length > 0 && (
                <div className="mb-8 grid grid-cols-2 gap-6 border-t border-border/40 pt-6">
                  {cs.secondaryMetrics.slice(0, 2).map((m, i) => (
                    <div key={i}>
                      <div className="text-lg font-medium tracking-tight tabular-nums text-foreground">
                        {m.value}
                      </div>
                      <div className="mt-0.5 text-xs font-light text-muted-foreground">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quote — sem ícone barulhento, tipografia refinada */}
              <blockquote className="mt-auto">
                <p className="text-[15px] font-light leading-[1.6] tracking-[-0.01em] text-foreground/90">
                  “{cs.quote}”
                </p>
                <footer className="mt-5 flex items-center gap-3 border-t border-border/40 pt-4">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium tracking-tight text-foreground">
                      {cs.attribution.name}
                    </div>
                    <div className="text-[11px] font-light text-muted-foreground">
                      {cs.attribution.role}
                    </div>
                  </div>
                  <div className="text-[10px] tracking-wide text-muted-foreground/60">
                    {cs.measuredAt}
                  </div>
                </footer>
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
