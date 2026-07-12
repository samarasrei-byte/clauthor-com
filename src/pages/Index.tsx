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
import { ArrowRight, Globe2, Building2, Languages } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PremiumCTAButton } from "@/components/ui/premium-cta-button";
import Footer from "@/components/Footer";
import ThorConciergeChat from "@/components/landing/ThorConciergeChat";
import { CLAUTHOR_ORG_CHART } from "@/data/clauthorOrgChart";
import { trackKpi } from "@/lib/kpiTracker";

const CaseStudySection = lazy(() => import("@/components/landing/CaseStudySection"));

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

  const goToThor = (section: string) => {
    trackKpi("thor_guide_section_play", { source: "landing", section: `cta_${section}` });
    navigate("/thor");
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* ═══════════ HERO — chat concierge inline ═══════════ */}
      <section
        className="relative px-5 pt-16 pb-20 sm:pt-24 sm:pb-24"
        aria-label="Diagnóstico com o Thor"
      >
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>35.827 empresas · 20 departamentos · +200 especialistas de IA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-semibold tracking-[-0.03em] text-foreground leading-[1.05]"
          >
            Qual a sua dor hoje?{" "}
            <span className="animate-gradient-shift">Deixa o Thor analisar.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Conta pro Thor o que trava seu negócio. Ele monta um departamento inteiro
            de agentes de IA sob medida — sem sair desta página.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="max-w-3xl mx-auto"
        >
          <ThorConciergeChat source="landing" minHeight="min-h-[380px]" />
        </motion.div>

        <p className="mt-6 text-xs text-muted-foreground/70 text-center">
          Sem cadastro. Sem cartão. Análise personalizada em ~90 segundos.
        </p>
      </section>

      {/* ═══════════ FAIXA DE PROVA GLOBAL ═══════════ */}
      <section
        className="py-14 sm:py-16 px-5 border-y border-border/40 bg-card/30"
        aria-label="Alcance global"
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-8">
            Confiança global
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
            {[
              {
                icon: Building2,
                value: "35.827",
                label: "empresas atendidas",
                sub: "Brasil, LATAM, EUA e Europa",
              },
              {
                icon: Globe2,
                value: "24/7",
                label: "operação em 5 continentes",
                sub: "Uptime de 99.9%",
              },
              {
                icon: Languages,
                value: "14",
                label: "idiomas nativos",
                sub: "Português, inglês, espanhol, francês, alemão…",
              },
            ].map(({ icon: Icon, value, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border border-border/40 bg-background/40"
              >
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <p className="text-3xl font-semibold text-foreground tracking-tight">
                  {value}
                </p>
                <p className="text-[13px] font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS SECUNDÁRIO ═══════════ */}
      <section className="py-10 sm:py-14 px-5" aria-label="Escala da plataforma">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: "+200", label: "Especialistas de IA" },
              { value: String(totalSquads), label: "Squads orquestrados" },
              { value: String(CLAUTHOR_ORG_CHART.length), label: "Departamentos" },
              { value: "R$1.700", label: "A partir de /mês" },
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
            Sem contratação, sem CLT, sem headcount. Só resultado — a partir de
            R$ 1.700/mês por departamento.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <PremiumCTAButton size="lg" onClick={() => goToThor("final")} className="px-10">
              Conversar com Thor
            </PremiumCTAButton>
            <Link
              to="/departamentos"
              className="text-[14px] rounded-full px-5 py-3 border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-all inline-flex items-center gap-1.5"
            >
              Ver departamentos
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
