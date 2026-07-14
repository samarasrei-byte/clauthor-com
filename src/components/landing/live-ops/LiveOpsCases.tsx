/**
 * LiveOpsCases · cards grandes de casos reais com número em destaque.
 * Lê CASE_STUDIES · esconde a seção quando não há caso.
 */
import { motion } from "framer-motion";
import { CASE_STUDIES } from "@/data/caseStudies";

export default function LiveOpsCases() {
  if (CASE_STUDIES.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {CASE_STUDIES.map((study, idx) => (
        <motion.article
          key={study.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: idx * 0.08 }}
          className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-8 sm:p-10 overflow-hidden hover:border-primary/30 transition-colors"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-52 w-52 rounded-full bg-primary/15 blur-[90px] opacity-0 group-hover:opacity-100 transition-opacity"
          />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary/85 mb-2">
                Caso real · resultado auditável
              </p>
              <h3 className="text-xl font-semibold text-white tracking-tight">
                {study.companyName}
              </h3>
              <p className="text-sm text-white/50 mt-0.5">{study.industry}</p>
            </div>
            {study.departmentUsed && (
              <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-white/50 border border-white/15 rounded-full px-3 py-1">
                {study.departmentUsed}
              </span>
            )}
          </div>

          {/* Métrica principal */}
          <div className="relative mb-6">
            <div className="font-display font-semibold text-[44px] sm:text-[56px] leading-[0.95] tracking-[-0.035em] text-white">
              {study.headlineMetric.value}
            </div>
            <p className="mt-2 text-sm text-white/70">{study.headlineMetric.label}</p>
          </div>

          {/* Métricas secundárias */}
          {study.secondaryMetrics && study.secondaryMetrics.length > 0 && (
            <div className="relative grid grid-cols-2 gap-3 mb-6 pt-6 border-t border-white/10">
              {study.secondaryMetrics.slice(0, 2).map((m) => (
                <div key={m.label}>
                  <div className="text-base font-semibold text-white">{m.value}</div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mt-0.5">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quote */}
          <blockquote className="relative text-[15px] leading-relaxed text-white/75 mb-4">
            &ldquo;{study.quote}&rdquo;
          </blockquote>


          <div className="relative text-[11px] uppercase tracking-[0.14em] text-white/45">
            {study.attribution.name} · {study.attribution.role}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
