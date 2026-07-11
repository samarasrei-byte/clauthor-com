/**
 * Home — modelo conversational-first.
 *
 * Estrutura:
 *  1. ConversationalHero — input central + Thor recomenda departamento
 *  2. DepartmentsBento — grade dos departamentos com filtro por objetivo
 *  3. CaseStudySection — prova social + CTA final
 *
 * Seções densas anteriores (HeroTerminal, LiveDemoSection, ROIBenchmark,
 * CompetitiveMoat, InnovationRoadmap) foram movidas para páginas internas.
 */
import { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import ConversationalHero from "@/components/landing/ConversationalHero";
import DepartmentsBento from "@/components/landing/DepartmentsBento";
import LandingDiagnosisDialog from "@/components/landing/LandingDiagnosisDialog";
import { useLandingDiagnosis } from "@/hooks/useLandingDiagnosis";
import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import Footer from "@/components/Footer";
import { CLAUTHOR_ORG_CHART, CLAUTHOR_AGENT_COUNT } from "@/data/clauthorOrgChart";

const CaseStudySection = lazy(() => import("@/components/landing/CaseStudySection"));

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const diagnosis = useLandingDiagnosis();

  // SEO meta tags + JSON-LD Organization
  useEffect(() => {
    document.title = t("home.seo_title");
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", t("home.seo_description"));
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = t("home.seo_description");
      document.head.appendChild(meta);
    }
    let script = document.getElementById("jsonld-org") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "jsonld-org";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CLAUTHOR",
      url: "https://clauthor.com",
      logo: "https://clauthor.com/favicon.png",
      description: t("home.seo_description"),
      sameAs: ["https://linkedin.com/company/clauthor"],
    });
    return () => {
      const el = document.getElementById("jsonld-org");
      if (el) el.remove();
    };
  }, [t]);

  const totalSquads = CLAUTHOR_ORG_CHART.reduce((s, d) => s + d.squads.length, 0);

  return (
    <div className="relative overflow-x-hidden">
      <LandingDiagnosisDialog
        open={diagnosis.isOpen}
        onOpenChange={(v) => (v ? diagnosis.open() : diagnosis.close())}
      />

      {/* ═══════════ DOBRA 1 — HERO CONVERSACIONAL ═══════════ */}
      <ConversationalHero />

      {/* ═══════════ DOBRA 2 — DEPARTAMENTOS BENTO ═══════════ */}
      <DepartmentsBento />

      {/* ═══════════ STATS COMPACTO ═══════════ */}
      <section className="py-12 sm:py-16 px-5 border-y border-border/40" aria-label="Escala da plataforma">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: `${CLAUTHOR_AGENT_COUNT}+`, label: "Especialistas de IA" },
              { value: String(totalSquads),         label: "Squads orquestrados" },
              { value: String(CLAUTHOR_ORG_CHART.length), label: "Departamentos" },
              { value: "99.9%",                     label: "Uptime" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-1">
                  {s.value}
                </p>
                <p className="text-[13px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DOBRA 3 — PROVA + CTA FINAL ═══════════ */}
      <Suspense fallback={<div className="h-40" />}>
        <CaseStudySection />
      </Suspense>

      <section className="py-20 sm:py-28 px-5" aria-label="Chamada final">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Seu próximo departamento{" "}
            <span className="animate-gradient-shift">começa em 60 segundos.</span>
          </motion.h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-muted-foreground max-w-lg mx-auto">
            Sem contratação, sem CLT, sem headcount. Só resultado.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <PremiumCTAButton
              size="lg"
              icon={<Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
              onClick={() => navigate("/departamentos")}
              className="px-10"
            >
              Ver todos os departamentos
            </PremiumCTAButton>
            <button
              onClick={diagnosis.open}
              className="text-[14px] rounded-full px-5 py-3 border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-all"
            >
              Diagnóstico em 30s
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
