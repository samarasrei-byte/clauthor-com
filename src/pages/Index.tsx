/**
 * Home — modelo Thor-first.
 *
 * Estrutura minimalista:
 *  1. Hero único — headline + CTA "Conversar com Thor" → /thor
 *  2. Stats compacto — prova de escala
 *  3. Case study (social proof)
 *  4. CTA final → /thor
 *
 * Removido da landing (movido para /departamentos):
 *  - ConversationalHero (competia com o Thor)
 *  - DepartmentsBento (agora só em /departamentos)
 *  - LandingDiagnosisDialog (Thor faz o diagnóstico)
 */
import { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import Footer from "@/components/Footer";
import { CLAUTHOR_ORG_CHART, CLAUTHOR_AGENT_COUNT } from "@/data/clauthorOrgChart";
import { trackKpi } from "@/lib/kpiTracker";

const CaseStudySection = lazy(() => import("@/components/landing/CaseStudySection"));
const SalesChatbot = lazy(() => import("@/components/landing/SalesChatbot"));

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const goToThor = (source: string) => {
    trackKpi("thor_guide_section_play", { source: "landing", section: `cta_${source}` });
    navigate("/thor");
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* ═══════════ HERO ÚNICO — CTA para /thor ═══════════ */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center px-5 py-24"
        aria-label="Hero"
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm text-xs text-muted-foreground"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span>20 departamentos · +200 especialistas de IA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] text-foreground leading-[1.05]"
          >
            Um departamento inteiro trabalhando pra você{" "}
            <span className="animate-gradient-shift">hoje à noite.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            Converse com o Thor. Ele monta seu squad e mostra a Mesa Redonda com
            o contexto real do seu negócio — antes de você pagar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <PremiumCTAButton
              size="lg"
              icon={<Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
              onClick={() => goToThor("hero")}
              className="px-10"
            >
              Conversar com Thor
            </PremiumCTAButton>
            <Link
              to="/departamentos"
              className="text-[14px] rounded-full px-5 py-3 border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-all inline-flex items-center gap-1.5"
            >
              Ver departamentos
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          <p className="text-xs text-muted-foreground/70 pt-4">
            Sem cadastro. Sem cartão. Mesa Redonda com seus dados em ~90 segundos.
          </p>
        </div>
      </section>

      {/* ═══════════ STATS COMPACTO ═══════════ */}
      <section
        className="py-12 sm:py-16 px-5 border-y border-border/40"
        aria-label="Escala da plataforma"
      >
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: "+200", label: "Especialistas de IA" },
              { value: String(totalSquads), label: "Squads orquestrados" },
              { value: String(CLAUTHOR_ORG_CHART.length), label: "Departamentos" },
              { value: "99.9%", label: "Uptime" },
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

      {/* ═══════════ PROVA SOCIAL ═══════════ */}
      <Suspense fallback={<div className="h-40" />}>
        <CaseStudySection />
      </Suspense>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="py-20 sm:py-28 px-5" aria-label="Chamada final">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Seu próximo departamento{" "}
            <span className="animate-gradient-shift">começa em 90 segundos.</span>
          </motion.h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-muted-foreground max-w-lg mx-auto">
            Sem contratação, sem CLT, sem headcount. Só resultado.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <PremiumCTAButton
              size="lg"
              icon={<Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
              onClick={() => goToThor("final")}
              className="px-10"
            >
              Conversar com Thor
            </PremiumCTAButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
