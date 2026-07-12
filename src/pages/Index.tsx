/**
 * Home — modelo de alta conversão (v2 direction).
 *
 * Estrutura:
 *  1. Hero centrado — pill + headline + CTAs + faixa de 4 números
 *  2. Grid de departamentos — "Escolha seu departamento" (dor → outcome → preço)
 *  3. Mockup do painel — dá gostinho da experiência
 *  4. Case study + CTA final
 */
import { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Headphones, Megaphone, Scale, Wallet, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Footer from "@/components/Footer";
import { CLAUTHOR_ORG_CHART } from "@/data/clauthorOrgChart";
import { DEPARTMENT_PACKAGES, formatBRL } from "@/data/departmentPackages";
import { trackKpi } from "@/lib/kpiTracker";

const CaseStudySection = lazy(() => import("@/components/landing/CaseStudySection"));

const DEPT_ICONS: Record<string, React.ElementType> = {
  comercial: Briefcase,
  atendimento: Headphones,
  marketing: Megaphone,
  juridico: Scale,
  financeiro: Wallet,
  rh: Users,
};

const FEATURED_DEPT_IDS = ["comercial", "atendimento", "marketing", "juridico", "financeiro", "rh"] as const;

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t("home.seo_title");
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", t("home.seo_description"));
    else {
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

  const startFlow = (source: string) => {
    trackKpi("thor_guide_section_play", { source: "landing", section: `cta_${source}` });
    navigate("/departamentos");
  };

  const featured = FEATURED_DEPT_IDS
    .map((id) => DEPARTMENT_PACKAGES.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <div className="relative overflow-x-hidden">
      {/* ═══════════ HERO ═══════════ */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-14 sm:pt-24 sm:pb-16" aria-label="Hero">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            35.827 empresas · operação em 14 idiomas nativos
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl leading-[1.02]"
          >
            Monte seu departamento de{" "}
            <span className="text-primary">agentes de IA</span> agora.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
          >
            Substitua processos manuais por especialistas digitais. Implementação
            imediata, escala infinita e custo fixo a partir de{" "}
            <span className="text-foreground font-semibold">R$ 1.700/mês</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="flex flex-col sm:flex-row gap-3 mb-16"
          >
            <button
              onClick={() => startFlow("hero_primary")}
              className="px-8 py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all shadow-lg inline-flex items-center gap-2"
            >
              Começar agora
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                trackKpi("thor_guide_section_play", { source: "landing", section: "cta_thor" });
                navigate("/thor");
              }}
              className="px-8 py-4 bg-card text-foreground font-semibold rounded-xl border border-border hover:bg-muted transition-colors inline-flex items-center gap-2"
            >
              Falar com Thor
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
          </motion.div>

          {/* Numbers divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-border"
          >
            {[
              { value: "35.827", label: "empresas ativas" },
              { value: "+200", label: "especialistas prontos" },
              { value: "R$ 1.700", label: "custo fixo mensal" },
              { value: "14", label: "idiomas nativos" },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ ESCOLHA SEU DEPARTAMENTO ═══════════ */}
      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-20" aria-label="Departamentos">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
              Escolha seu departamento
            </h2>
            <p className="text-muted-foreground">
              Selecione a dor que você quer resolver hoje.
            </p>
          </div>
          <Link
            to="/departamentos"
            className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            Ver todos os departamentos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((dept) => {
            const Icon = DEPT_ICONS[dept.id] ?? Briefcase;
            return (
              <button
                key={dept.id}
                onClick={() => {
                  trackKpi("thor_guide_section_play", {
                    source: "landing",
                    section: `dept_card_${dept.id}`,
                  });
                  navigate(`/departamentos/${dept.id}`);
                }}
                className="group text-left p-7 rounded-2xl bg-card/60 border border-border hover:border-primary/50 hover:bg-card transition-all cursor-pointer flex flex-col"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{dept.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 flex-1">
                  {dept.painPoint}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <div className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">{dept.agentSlugs.length}</span> agentes
                  </div>
                  <div className="text-xs">
                    <span className="text-foreground font-semibold">{formatBRL(dept.priceMonthly)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════ MOCKUP DO PAINEL ═══════════ */}
      <section className="max-w-6xl mx-auto px-6 pt-10" aria-label="Prévia do painel">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            Assim que ativa, o painel <span className="text-primary">roda pra você.</span>
          </h2>
          <p className="text-muted-foreground">
            Você acompanha cada agente executando em tempo real, aprova o que sair
            e vê os resultados chegando no dashboard.
          </p>
        </div>

        <div className="relative rounded-t-3xl border-t border-x border-border bg-card p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <div className="w-3 h-3 rounded-full bg-muted" />
            <div className="w-3 h-3 rounded-full bg-muted" />
            <div className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
              clauthor / painel · live
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 h-80 overflow-hidden">
            {/* Sidebar mock */}
            <div className="col-span-3 border-r border-border p-3 space-y-3">
              <div className="h-3 w-3/4 bg-muted rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-8 w-full rounded-lg bg-primary/10 border border-primary/20 flex items-center px-3">
                  <div className="h-2 w-16 bg-primary/40 rounded" />
                </div>
                <div className="h-8 w-full rounded-lg bg-muted/40" />
                <div className="h-8 w-full rounded-lg bg-muted/40" />
                <div className="h-8 w-full rounded-lg bg-muted/40" />
                <div className="h-8 w-full rounded-lg bg-muted/40" />
              </div>
            </div>
            {/* Main mock */}
            <div className="col-span-9 p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-5 w-56 bg-muted rounded" />
                  <div className="h-3 w-40 bg-muted/50 rounded" />
                </div>
                <div className="h-9 w-28 bg-primary rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 bg-background rounded-xl border border-border p-3 space-y-2">
                    <div className="h-2 w-16 bg-muted/60 rounded" />
                    <div className="h-6 w-20 bg-foreground/80 rounded" />
                    <div className="h-2 w-full bg-muted/30 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-32 bg-background rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="h-3 w-40 bg-muted/60 rounded" />
                </div>
                <div className="h-2 w-full bg-muted/30 rounded" />
                <div className="h-2 w-5/6 bg-muted/30 rounded" />
                <div className="h-2 w-2/3 bg-muted/30 rounded" />
              </div>
            </div>
          </div>
          {/* Fade Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ═══════════ PROVA SOCIAL — CEOs ═══════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20 sm:py-24" aria-label="Depoimentos de CEOs">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground mb-5">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            +35.000 CEOs já operam com Clauthor
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            O que dizem os CEOs que <span className="text-primary">deixaram a operação</span>
          </h2>
          <p className="text-muted-foreground">
            Fundadores, CEOs e diretores em 14 países usam departamentos de IA da Clauthor para escalar sem contratar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              quote: "Substituí um time de 6 SDRs por um departamento comercial da Clauthor. Em 45 dias, o pipeline triplicou e o custo caiu 78%.",
              name: "Rafael Mendes",
              role: "CEO · Ironberg Distribuidora",
              metric: "3,1× pipeline",
            },
            {
              quote: "O departamento jurídico revisa 400 contratos por mês. Meu escritório voltou a ter margem para atender casos estratégicos.",
              name: "Camila Prado",
              role: "Sócia-fundadora · Prado & Associados",
              metric: "-62% tempo",
            },
            {
              quote: "Marketing autônomo. Postagens, campanhas, análise. Meu head de marketing hoje só valida — não executa mais nada.",
              name: "Diego Alcântara",
              role: "CMO · Nuvia SaaS",
              metric: "+412% output",
            },
            {
              quote: "Atendimento em 14 idiomas, 24/7. Meu NPS subiu 34 pontos em 3 meses e demiti a operadora terceirizada.",
              name: "Larissa Ono",
              role: "COO · Global Trade Hub",
              metric: "NPS +34",
            },
            {
              quote: "Financeiro rodando conciliação e cobrança sem CLT. Enxuguei o back-office e ganhei previsibilidade de caixa.",
              name: "Bruno Salgado",
              role: "CFO · Vertex Construtora",
              metric: "-47% custo",
            },
            {
              quote: "Contratei o departamento de RH da Clauthor no mesmo dia que perdi minha analista sênior. Nem senti a saída.",
              name: "Patrícia Kimura",
              role: "CEO · Osmose Digital",
              metric: "0 gap",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="group p-6 rounded-2xl bg-card/60 border border-border hover:border-primary/40 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-1 mb-4 text-primary">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-sm">{s}</span>
                ))}
                <span className="ml-auto text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                  {t.metric}
                </span>
              </div>
              <p className="text-[15px] text-foreground/90 leading-relaxed mb-6 flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 35.827 empresas ativas</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 14 idiomas nativos</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 4,9/5 avaliação média</span>
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Operação 24/7</span>
        </div>
      </section>

      {/* ═══════════ STATS SECUNDÁRIO ═══════════ */}
      <section className="py-14 px-6 border-y border-border" aria-label="Escala da plataforma">

        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: String(totalSquads), label: "Squads orquestrados" },
            { value: String(CLAUTHOR_ORG_CHART.length), label: "Departamentos" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Operação global" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
                {s.value}
              </p>
              <p className="text-[12px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ PROVA SOCIAL ═══════════ */}
      <Suspense fallback={<div className="h-40" />}>
        <CaseStudySection />
      </Suspense>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="py-24 px-6" aria-label="Chamada final">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground"
          >
            Seu próximo departamento{" "}
            <span className="text-primary">começa em 90 segundos.</span>
          </motion.h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-muted-foreground max-w-lg mx-auto">
            Sem contratação, sem CLT, sem headcount. A partir de R$ 1.700/mês por
            departamento.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => startFlow("final")}
              className="px-10 py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-all shadow-lg inline-flex items-center gap-2"
            >
              Escolher meu departamento
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/thor"
              className="px-6 py-3 rounded-xl border border-border text-foreground/80 hover:text-foreground hover:border-foreground/40 transition-all inline-flex items-center gap-1.5 text-sm"
            >
              Falar com Thor primeiro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
