/**
 * Home · Apple-inspired minimal & premium.
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
import PanelMockup from "@/components/landing/PanelMockup";
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
      "Marketing autonomo. Post, campagne, analisi. Il mio direttore marketing oggi si limita ad approvare, non esegue più nulla.",
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
            <span className="text-black dark:text-white">Converse com o Thor.</span>
            <br />
            <span className="text-muted-foreground">Ele monta a solução certa.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-14 leading-relaxed"
          >
            Um agente, um squad ou um departamento inteiro · o Thor entende seu
            cenário e recomenda o caminho certo. A partir de{" "}
            <span className="text-foreground font-medium">R$ 197/mês</span>.
          </motion.p>

          {/* Chat LLM real como CTA principal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="dark w-full max-w-2xl rounded-3xl bg-background text-foreground"
          >
            <ThorConciergeChat source="landing" minHeight="min-h-[520px]" />
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

      {/* ═══════════ DOIS CAMINHOS · Squad vs Departamento ═══════════ */}
      <section className="border-t border-border/60" aria-label="Squad ou Departamento">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-14 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Dois caminhos
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              Comece com um squad.{" "}
              <span className="text-muted-foreground">Escale para um departamento.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Você escolhe o tamanho da mordida. Do primeiro time vertical ao departamento inteiro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Squad · entrada PME */}
            <motion.button
              onClick={() => {
                trackKpi("home_path_select", { section: "squad" });
                navigate("/squads");
              }}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="group relative text-left p-8 sm:p-10 rounded-3xl border border-border/60 bg-background hover:bg-card hover:shadow-[0_20px_60px_-25px_hsl(0_0%_0%/0.35)] transition-all flex flex-col min-h-[360px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  ● Squad
                </span>
                <span className="text-[11px] text-muted-foreground">Comece rápido</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                Comece rápido.
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed mb-8 flex-1">
                Um time vertical de 4 a 7 agentes de IA para resolver <span className="text-foreground">uma dor específica</span>.
                Ativação em minutos, sem equipe técnica. Ideal para PME e profissionais liberais.
              </p>

              <ul className="space-y-2 mb-8 text-sm text-foreground/85">
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Reputação IA, Atendimento 24h, SDR, Financeiro, Conteúdo</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Self-serve, sem onboarding pesado</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Cancelamento livre</li>
              </ul>

              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">A partir de</div>
                  <div className="text-2xl font-semibold text-foreground">R$ 597<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                </div>
                <span className="text-sm font-semibold inline-flex items-center gap-1 text-foreground group-hover:text-primary transition-colors">
                  Ver squads
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>

            {/* Departamento · core empresa */}
            <motion.button
              onClick={() => {
                trackKpi("home_path_select", { path: "departamento" });
                navigate("/departamentos");
              }}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="group relative text-left p-8 sm:p-10 rounded-3xl bg-foreground text-background hover:shadow-[0_30px_80px_-20px_hsl(0_85%_55%/0.4)] transition-all flex flex-col min-h-[360px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  ● Departamento
                </span>
                <span className="text-[11px] text-background/60">Transforme a operação</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                Transforme sua empresa.
              </h3>
              <p className="text-base text-background/70 leading-relaxed mb-8 flex-1">
                Um departamento inteiro em IA · 20+ agentes cobrindo <span className="text-background">uma área completa</span>
                {" "}(Comercial, Marketing, Financeiro, Jurídico...). Para média e grande empresa que quer trocar operação por decisão.
              </p>

              <ul className="space-y-2 mb-8 text-sm text-background/90">
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> 20 departamentos · +200 especialistas de IA</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Onboarding assistido em 7 dias</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> 35.827 empresas já confiam</li>
              </ul>

              <div className="flex items-center justify-between pt-6 border-t border-background/15">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-background/60">A partir de</div>
                  <div className="text-2xl font-semibold">R$ 1.700<span className="text-sm font-normal text-background/60">/mês</span></div>
                </div>
                <span className="text-sm font-semibold inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                  Ver departamentos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>
          </div>
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

      {/* ═══════════ COMO FUNCIONA (3 passos) ═══════════ */}
      <section className="border-t border-border/60 bg-card/30" aria-label="Como funciona">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Como funciona
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              Três passos.{" "}
              <span className="text-muted-foreground">Zero fricção.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              Do primeiro clique à operação rodando sozinha em menos de dois minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Escolha o departamento",
                copy: "Comercial, Marketing, Financeiro, Jurídico, RH ou Atendimento. Cada um chega com agentes especializados prontos.",
              },
              {
                step: "02",
                title: "Aprove o squad",
                copy: "O Thor monta a equipe ideal para sua operação. Você revisa, ajusta e aprova em um clique.",
              },
              {
                step: "03",
                title: "Você comanda de casa",
                copy: "Os agentes executam 24/7 em 14 idiomas. Você aprova entregas ou apenas acompanha o resultado.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/30 hover:shadow-[0_25px_60px_-30px_hsl(var(--primary)/0.35)] transition-all"
              >
                <div className="text-[11px] font-mono font-semibold text-primary tracking-[0.18em] mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight mb-3">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.copy}
                </p>
                {i < 2 && (
                  <ArrowRight
                    className="hidden md:block absolute top-1/2 -right-3 h-5 w-5 text-border/80 -translate-y-1/2"
                    strokeWidth={1.5}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARATIVO CLT vs CLAUTHOR ═══════════ */}
      <section className="border-t border-border/60" aria-label="Comparativo">
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="mb-16 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Comparativo
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              O time tradicional{" "}
              <span className="text-muted-foreground">vs. a Clauthor.</span>
            </h2>
          </div>

          <div className="rounded-3xl border border-border/60 overflow-hidden bg-background">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-border/60 bg-card/40">
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Métrica
              </div>
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold border-l border-border/60">
                Departamento CLT
              </div>
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-primary font-semibold border-l border-border/60 bg-primary/[0.03]">
                Departamento Clauthor
              </div>
            </div>
            {[
              { label: "Custo mensal", clt: "R$ 90.000", cla: "R$ 1.700" },
              { label: "Setup", clt: "3 a 6 meses", cla: "90 segundos" },
              { label: "Cobertura", clt: "8h · 5 dias", cla: "24/7 · 365 dias" },
              { label: "Idiomas", clt: "1 a 2", cla: "14 nativos" },
              { label: "Escala", clt: "Contratar · demitir", cla: "Instantânea" },
              { label: "Turnover", clt: "23% ao ano", cla: "Zero" },
            ].map((row, i, arr) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className={`grid grid-cols-3 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="p-5 text-sm text-foreground font-medium">{row.label}</div>
                <div className="p-5 text-sm text-muted-foreground border-l border-border/60 line-through decoration-muted-foreground/40">
                  {row.clt}
                </div>
                <div className="p-5 text-sm font-semibold text-foreground border-l border-border/60 bg-primary/[0.03] inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {row.cla}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Fontes: FGV (custo médio departamento com 6 pessoas + encargos), Great Place to Work (turnover médio Brasil).
          </p>
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

          <PanelMockup />
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

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
            {CEO_TESTIMONIALS.map((c) => (
              <motion.figure
                key={c.name}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="group mb-6 break-inside-avoid p-7 rounded-2xl bg-card border border-border/60 hover:border-foreground/25 hover:shadow-[0_25px_60px_-25px_hsl(0_0%_0%/0.25)] transition-all flex flex-col"
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
