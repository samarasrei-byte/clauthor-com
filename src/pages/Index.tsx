/**
 * Home — Apple-inspired minimal & premium.
 *
 * Princípios:
 *  - Tipografia enorme, hierarquia rígida, muito respiro
 *  - Paleta reduzida: preto absoluto, off-white, cinza técnico, vermelho como único acento
 *  - Anima\u00e7\u00f5es discretas, sem gradientes coloridos, sem \u00edcones decorativos ruidosos
 *  - Chat LLM real como abertura (Thor consultor)
 */
import { lazy, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Headphones, Megaphone, Scale, Wallet, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Footer from "@/components/Footer";
import ThorConciergeChat from "@/components/landing/ThorConciergeChat";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
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

const CEO_TESTIMONIALS = [
  {
    lang: "PT-BR",
    flag: "🇧🇷",
    quote:
      "Substituí um time de seis SDRs por um departamento comercial da Clauthor. Em 45 dias o pipeline triplicou e o custo caiu 78%.",
    name: "Rafael Mendes",
    role: "CEO · Ironberg Distribuidora",
    metric: "3,1× pipeline",
  },
  {
    lang: "EN",
    flag: "🇺🇸",
    quote:
      "We replaced an entire back-office team with Clauthor's finance department. Reconciliation runs 24/7 and I finally have real cash predictability.",
    name: "Sarah Whitfield",
    role: "CFO · Northline Capital",
    metric: "-47% cost",
  },
  {
    lang: "ES",
    flag: "🇪🇸",
    quote:
      "El departamento de atención al cliente responde en catorce idiomas sin descanso. Nuestro NPS subió 34 puntos en tres meses.",
    name: "Alejandro Ruiz",
    role: "COO · Global Trade Hub",
    metric: "NPS +34",
  },
  {
    lang: "FR",
    flag: "🇫🇷",
    quote:
      "Le département juridique de Clauthor examine plus de 400 contrats par mois. Mon cabinet retrouve enfin du temps pour les dossiers stratégiques.",
    name: "Camille Laurent",
    role: "Associée · Laurent & Cie",
    metric: "-62% temps",
  },
  {
    lang: "IT",
    flag: "🇮🇹",
    quote:
      "Marketing autonomo. Post, campagne, analisi. Il mio direttore marketing oggi si limita ad approvare — non esegue più nulla.",
    name: "Marco Bellini",
    role: "CMO · Nuvia SaaS Italia",
    metric: "+412% output",
  },
  {
    lang: "JA",
    flag: "🇯🇵",
    quote:
      "Clauthorの人事部門を導入した日に、シニアアナリストが退職しました。それでも業務は一切止まらず、むしろ加速しました。",
    name: "小野 詩織 · Shiori Ono",
    role: "CEO · Osmose Digital 東京",
    metric: "0 gap",
  },
  {
    lang: "ZH",
    flag: "🇨🇳",
    quote:
      "Clauthor 的销售部门就像一支永不下班的团队。90 天内我们的合格线索翻了三倍,而人力成本几乎归零。",
    name: "陈 建华 · Jianhua Chen",
    role: "创始人 · Vertex 建设集团",
    metric: "3× leads",
  },
];

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

  const startFlow = (section: string) => {
    trackKpi("thor_guide_section_play", { source: "landing", section });
    navigate("/departamentos");
  };

  const featured = FEATURED_DEPT_IDS
    .map((id) => DEPARTMENT_PACKAGES.find((d) => d.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <div className="light relative overflow-x-hidden bg-background text-foreground">
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28"
        aria-label="Hero"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-10"
          >
            <span className="h-px w-6 bg-border" />
            35.827 empresas · 14 idiomas · operação 24/7
            <span className="h-px w-6 bg-border" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.035em] leading-[0.98] max-w-5xl mb-8"
          >
            Sua operação
            <br />
            <span className="text-muted-foreground">rodando sozinha.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-14 leading-relaxed"
          >
            Departamentos de agentes de IA prontos para operar. Sem contratação, sem CLT,
            sem headcount — a partir de{" "}
            <span className="text-foreground font-medium">R$ 1.700/mês</span>.
          </motion.p>

          {/* Chat LLM real como CTA principal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="w-full max-w-2xl"
          >
            <ThorConciergeChat source="landing" minHeight="min-h-[360px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <button
              onClick={() => startFlow("hero_primary")}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Ver todos os departamentos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver preços →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ NUMBERS (dark contrast band) ═══════════ */}
      <section className="dark relative bg-black text-white overflow-hidden" aria-label="Escala">
        {/* Grain overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
          {[
            { num: 35827, prefix: "", suffix: "", label: "Empresas ativas", accent: false, sub: null as string | null },
            { num: 200, prefix: "+", suffix: "", label: "Especialistas de IA", accent: false, sub: null },
            { num: 1700, prefix: "R$ ", suffix: "", label: "Custo mensal", accent: true, sub: "vs R$ 90.000 CLT" },
            { num: 14, prefix: "", suffix: "", label: "Idiomas nativos", accent: false, sub: null },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center md:text-left"
            >
              <AnimatedCounter
                value={s.num}
                prefix={s.prefix}
                suffix={s.suffix}
                duration={2}
                className={`block text-4xl md:text-5xl font-semibold tracking-tight ${s.accent ? "text-primary" : "text-white"}`}
              />
              <div className="mt-1.5 text-xs uppercase tracking-[0.14em] text-white/50">
                {s.label}
              </div>
              {s.sub && (
                <div className="mt-1 text-[11px] text-white/40 line-through decoration-white/30">
                  {s.sub}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ DEPARTAMENTOS ═══════════ */}
      <section className="max-w-6xl mx-auto px-6 py-24 sm:py-32" aria-label="Departamentos">
        <div className="mb-16 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            Departamentos
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
            Escolha o que quer{" "}
            <span className="text-muted-foreground">parar de fazer.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Cada departamento chega pronto para operar. Você escolhe a dor, a Clauthor entrega o time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 rounded-3xl overflow-hidden border border-border/60">
          {featured.map((dept, idx) => {
            const Icon = DEPT_ICONS[dept.id] ?? Briefcase;
            const isFeatured = idx === 0;
            return (
              <motion.button
                key={dept.id}
                onClick={() => {
                  trackKpi("thor_guide_section_play", { source: "landing", section: `dept_${dept.id}` });
                  navigate(`/departamentos/${dept.id}`);
                }}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`group relative text-left p-8 transition-all flex flex-col min-h-[280px] ${
                  isFeatured
                    ? "bg-foreground text-background hover:shadow-[0_30px_80px_-20px_hsl(0_85%_55%/0.35)]"
                    : "bg-background hover:bg-card hover:shadow-[0_20px_60px_-25px_hsl(0_0%_0%/0.25)]"
                }`}
              >
                {isFeatured && (
                  <span className="absolute top-6 right-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    ● Mais contratado
                  </span>
                )}
                <Icon
                  className={`h-6 w-6 mb-8 ${isFeatured ? "text-background" : "text-foreground"}`}
                  strokeWidth={1.5}
                />
                <h3
                  className={`text-xl font-semibold mb-2 tracking-tight ${
                    isFeatured ? "text-background" : "text-foreground"
                  }`}
                >
                  {dept.name}
                </h3>
                <p
                  className={`text-sm leading-relaxed flex-1 mb-6 ${
                    isFeatured ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {dept.painPoint}
                </p>
                <div
                  className={`flex items-center justify-between pt-5 border-t ${
                    isFeatured ? "border-background/15" : "border-border/50"
                  }`}
                >
                  <span
                    className={`text-xs ${isFeatured ? "text-background/60" : "text-muted-foreground"}`}
                  >
                    {dept.agentSlugs.length} agentes · 24/7
                  </span>
                  <span
                    className={`text-sm font-semibold inline-flex items-center gap-1 transition-colors ${
                      isFeatured
                        ? "text-background group-hover:text-primary"
                        : "text-foreground group-hover:text-primary"
                    }`}
                  >
                    {formatBRL(dept.priceMonthly)}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ═══════════ PAINEL PREVIEW (dark) ═══════════ */}
      <section className="dark bg-black text-white" aria-label="Painel">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
              Painel
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white mb-6">
              Você comanda.
              <br />
              <span className="text-primary">A IA executa.</span>
            </h2>
            <p className="text-lg text-white/60">
              Aprove, ajuste ou apenas observe. Cada agente reporta em tempo real.
            </p>
          </div>

          <div className="relative rounded-t-3xl border-t border-x border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.14em] text-white/40">
                clauthor · live
              </span>
            </div>
            <div className="grid grid-cols-12 gap-4 h-[380px] p-5 overflow-hidden">
              <div className="col-span-3 space-y-2 border-r border-white/10 pr-4">
                <div className="h-3 w-2/3 bg-white/15 rounded-full" />
                <div className="pt-3 space-y-1.5">
                  <div className="h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center px-3">
                    <div className="h-2 w-16 bg-white/50 rounded-full" />
                  </div>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded-lg bg-white/[0.03] flex items-center px-3">
                      <div className="h-2 w-14 bg-white/20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-9 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-64 bg-white/15 rounded-full" />
                    <div className="h-3 w-40 bg-white/10 rounded-full" />
                  </div>
                  <div className="h-9 w-28 bg-primary rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-black border border-white/10 space-y-2"
                    >
                      <div className="h-2 w-16 bg-white/30 rounded-full" />
                      <div className={`h-7 w-20 rounded-md ${i === 1 ? "bg-primary" : "bg-white/80"}`} />
                      <div className="h-2 w-full bg-white/10 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-black border border-white/10 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/25 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="h-3 w-48 bg-white/25 rounded-full" />
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full" />
                  <div className="h-2 w-5/6 bg-white/10 rounded-full" />
                  <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="border-y border-border/60" aria-label="Depoimentos">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Depoimentos
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              CEOs que deixaram
              <br />
              <span className="text-muted-foreground">de operar no braço.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              +35.000 fundadores e diretores em 14 países já opera com Clauthor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CEO_TESTIMONIALS.map((c) => (
              <motion.figure
                key={c.name}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="group p-7 rounded-2xl bg-card border border-border/60 hover:border-foreground/25 hover:shadow-[0_25px_60px_-25px_hsl(0_0%_0%/0.25)] transition-all flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-lg leading-none" aria-hidden>{c.flag}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {c.lang}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.14em]">
                    {c.metric}
                  </span>
                </div>
                <blockquote className="text-[15px] leading-relaxed text-foreground/90 flex-1 mb-6">
                  "{c.quote}"
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-5 border-t border-border/50">
                  <div className="h-9 w-9 rounded-full bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-foreground">
                    {c.name.replace(/·.*$/, "").trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.role}</div>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SCALE ═══════════ */}
      <section className="max-w-6xl mx-auto px-6 py-24" aria-label="Escala">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6 text-center md:text-left">
          {[
            { value: String(totalSquads), label: "Squads orquestrados" },
            { value: String(CLAUTHOR_ORG_CHART.length), label: "Departamentos" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Operação global" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-2">
                {s.value}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Case study section (dados reais quando existirem) */}
      <Suspense fallback={<div className="h-24" />}>
        <CaseStudySection />
      </Suspense>

      {/* ═══════════ CTA FINAL (dark) ═══════════ */}
      <section className="dark bg-black text-white" aria-label="CTA">
        <div className="max-w-4xl mx-auto px-6 py-32 sm:py-40 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.035em] leading-[0.98] text-white mb-8"
          >
            Seu departamento
            <br />
            <span className="text-primary">começa em 90 segundos.</span>
          </motion.h2>
          <p className="text-lg text-white/60 max-w-lg mx-auto mb-12">
            Escolha a dor. A Clauthor entrega o time. Você comanda de casa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => startFlow("final")}
              className="group inline-flex items-center gap-2 px-9 py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)]"
            >
              Escolher meu departamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/thor"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Falar com o Thor primeiro →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
