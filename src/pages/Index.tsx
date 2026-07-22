/**
 * Home · Apple-inspired minimal & premium.
 *
 * Princípios:
 *  - Tipografia enorme, hierarquia rígida, muito respiro
 *  - Paleta reduzida: preto absoluto, off-white, cinza técnico, vermelho como único acento
 *  - Anima\u00e7\u00f5es discretas, sem gradientes coloridos, sem \u00edcones decorativos ruidosos
 *  - Chat LLM real como abertura (Thor consultor)
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Headphones, Megaphone, Scale, Wallet, Users, MessageSquareWarning, TrendingDown, Repeat, LineChart, HelpCircle, Network, Bot, Building2, Zap } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

import Footer from "@/components/Footer";
import FunnelResumeBanner from "@/components/funnel/FunnelResumeBanner";
import { SQUADS } from "@/data/squads";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import PanelMockup from "@/components/landing/PanelMockup";
import ThorConciergeChat from "@/components/landing/ThorConciergeChat";
import LiveOpsSection from "@/components/landing/LiveOpsSection";
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

const PAIN_QUIZ_IDS: Array<{ id: string; icon: React.ElementType }> = [
  { id: "whatsapp", icon: MessageSquareWarning },
  { id: "leads", icon: TrendingDown },
  { id: "repetitivo", icon: Repeat },
  { id: "kpi", icon: LineChart },
  { id: "juridico", icon: Scale },
  { id: "explorar", icon: HelpCircle },
];

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [seedPrompt, setSeedPrompt] = useState<string>("");
  const chatRef = useRef<HTMLDivElement | null>(null);

  const PAIN_QUIZ = PAIN_QUIZ_IDS.map((p) => ({
    ...p,
    label: t(`home.pain_${p.id}_label`),
    prompt: t(`home.pain_${p.id}_prompt`),
  }));

  const pickPain = (item: (typeof PAIN_QUIZ)[number]) => {
    trackKpi("home_pain_quiz_click", { pain_id: item.id });
    setSeedPrompt(item.prompt);
    // Rolagem suave até o chat para o usuário ver a resposta do Thor.
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

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
      <FunnelResumeBanner />
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="dark relative bg-[#050505] text-white overflow-hidden isolate"
        aria-label="Hero"
      >
        {/* Aurora orbs · mesmo efeito da tela de login */}
        <div aria-hidden className="absolute inset-0 pointer-events-none z-0">
          <motion.div
            animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[8%] w-[560px] h-[560px] rounded-full blur-[130px] will-change-transform"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.55), transparent 65%)" }}
          />
          <motion.div
            animate={{ x: [0, -50, 40, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.1, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[8%] right-[6%] w-[500px] h-[500px] rounded-full blur-[140px] will-change-transform"
            style={{ background: "radial-gradient(circle, #6366f1aa, transparent 65%)" }}
          />
        </div>
        {/* Grid overlay futurista */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-16 sm:pt-20 sm:pb-20">


        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.03] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-primary/80 mb-5"
          >
            <Network className="h-3.5 w-3.5" strokeWidth={2} />
            {t("home.hero_badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-[38px] sm:text-5xl md:text-[58px] lg:text-[68px] font-semibold tracking-[-0.035em] leading-[1.02] max-w-5xl mb-5"
          >
            <span className="text-foreground">Primeiro entendemos sua empresa.</span>
            <br />
            <span className="gradient-text">Depois montamos a IA certa.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-base md:text-lg text-white/75 max-w-2xl mb-6 leading-relaxed"
          >
            Sem vender volume de agentes. O Thor faz um diagnóstico do seu mercado, concorrentes
            e dores · e recomenda apenas os agentes que fazem sentido para o{" "}
            <span className="text-white font-medium">seu porte, orçamento e cenário</span>.
            De uma pequena operação a um time enterprise.
          </motion.p>

          {/* Pílulas consultivas · foco em resultado, não em volume */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-6"
          >
            {[
              { icon: Network, value: "Diagnóstico", label: "primeiro, sempre" },
              { icon: Building2, value: "SMB → Enterprise", label: "escala sob medida" },
              { icon: Zap, value: "Só o necessário", label: "sem inflar contrato" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/40 border border-border text-sm">
                <s.icon className="h-3.5 w-3.5 text-primary/70" strokeWidth={2} />
                <span className="font-display font-bold text-foreground">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>


          {/* Quiz de dor · seis caminhos claros */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10"
          >
            {PAIN_QUIZ.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickPain(item)}
                  className="group flex items-start gap-3 text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 hover:-translate-y-0.5 transition-all"
                >
                  <span className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  </span>
                  <span className="text-sm text-foreground leading-snug font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Chat qualificador · Thor concierge (recebe seedPrompt do quiz) */}
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="w-full max-w-3xl mb-16"
          >
            <div className="dark rounded-3xl bg-black text-white p-4 sm:p-6 shadow-[0_30px_80px_-20px_hsl(0_0%_0%/0.4)] border border-white/10">
              <div className="flex items-center gap-2 mb-4 px-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/60">
                  {t("home.thor_status")}
                </span>
              </div>
              <ThorConciergeChat source="landing" minHeight="360px" seedPrompt={seedPrompt} />
            </div>
          </motion.div>


          {/* Showcase de squads · vitrine principal na home */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="w-full max-w-6xl"
          >
            <div className="flex items-end justify-between mb-6 px-1">
              <div className="text-left">
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  {t("home.squads_eyebrow")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {t("home.squads_title")}
                </h2>
              </div>
              <Link
                to="/squads"
                className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("home.squads_see_all", { count: SQUADS.length })} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SQUADS.filter((s) => s.demand === "TOP").slice(0, 6).map((squad) => {
                const Icon = squad.icon;
                const href = squad.overrideHref ?? `/squads/${squad.slug}`;
                return (
                  <Link
                    key={squad.slug}
                    to={href}
                    className="group text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-card/80 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {squad.agents} {t("home.squads_agents_short")}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                      {squad.category}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{squad.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {squad.tagline}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-muted-foreground">{t("home.squads_from")}</span>
                        <span className="text-lg font-semibold text-foreground">
                          {squad.tiers[0].price.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{t("home.squads_per_month")}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex sm:hidden justify-center">
              <Link
                to="/squads"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("home.squads_see_all", { count: SQUADS.length })} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
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
              {t("home.cta_view_departments")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("home.cta_view_pricing")}
            </Link>
          </motion.div>
        </div>
        </div>
      </section>

      {/* ═══════════ STACK STRIP · integrações reais (prova de infra, não de clientes) ═══════════ */}
      <section aria-label="Integrações e infraestrutura" className="border-y border-border/60 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground shrink-0">
            Rodando sobre
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-4">
            {[
              { slug: "openai", label: "OpenAI" },
              { slug: "anthropic", label: "Anthropic" },
              { slug: "googlegemini", label: "Gemini" },
              { slug: "paypal", label: "PayPal" },
              { slug: "whatsapp", label: "WhatsApp" },
              { slug: "linkedin", label: "LinkedIn" },
              { slug: "meta", label: "Meta" },
              { slug: "supabase", label: "Supabase" },
            ].map((brand) => (
              <img
                key={brand.slug}
                src={`https://cdn.simpleicons.org/${brand.slug}/9ca3af`}
                alt={brand.label}
                title={brand.label}
                loading="lazy"
                width={22}
                height={22}
                className="h-[22px] w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>
      </section>


      <section
        className="dark relative bg-black text-white overflow-hidden"
        aria-label="Squad ou Departamento"
      >
        {/* Grain overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
        {/* Glow atmosférico */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-primary/[0.08] blur-[120px]"
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32">
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="mb-16 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
              Dois caminhos
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white mb-6">
              Comece com um squad.{" "}
              <span className="text-white/40">Escale para um departamento.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-xl">
              Você escolhe o tamanho da mordida. Do primeiro time vertical ao departamento inteiro.
            </p>
          </div>

          {/* ── Cards ──────────────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Squad · entrada PME */}
            <motion.button
              onClick={() => {
                trackKpi("home_path_select", { section: "squad" });
                navigate("/squads");
              }}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="group relative text-left p-8 sm:p-10 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 backdrop-blur-sm transition-all flex flex-col min-h-[360px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  ● Squad
                </span>
                <span className="text-[11px] text-white/40">Comece rápido</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
                Comece rápido.
              </h3>
              <p className="text-base text-white/60 leading-relaxed mb-8 flex-1">
                Um time vertical de 4 a 7 agentes de IA para resolver{" "}
                <span className="text-white">uma dor específica</span>. Ativação em minutos, sem
                equipe técnica. Ideal para PME e profissionais liberais.
              </p>

              <ul className="space-y-2 mb-8 text-sm text-white/80">
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Reputação IA, Atendimento 24h, SDR, Financeiro, Conteúdo</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Self-serve, sem onboarding pesado</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> Cancelamento livre</li>
              </ul>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-white/50">A partir de</div>
                  <div className="text-2xl font-semibold text-white">R$ 597<span className="text-sm font-normal text-white/50">/mês</span></div>
                </div>
                <span className="text-sm font-semibold inline-flex items-center gap-1 text-white group-hover:text-primary transition-colors">
                  {t("home.paths_squad_see")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>

            {/* Departamento · core empresa · destaque com fundo vermelho sutil */}
            <motion.button
              onClick={() => {
                trackKpi("home_path_select", { section: "departamento" });
                navigate("/departamentos");
              }}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="group relative text-left p-8 sm:p-10 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/[0.12] via-white/[0.04] to-white/[0.02] border border-primary/30 hover:border-primary/50 hover:shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.5)] transition-all flex flex-col min-h-[360px]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"
              />
              <div className="relative flex items-center justify-between mb-8">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {t("home.paths_dept_badge")}
                </span>
                <span className="text-[11px] text-white/50">{t("home.paths_dept_recommended")}</span>
              </div>

              <h3 className="relative text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
                {t("home.paths_dept_title")}
              </h3>
              <p className="relative text-base text-white/70 leading-relaxed mb-8 flex-1">
                <Trans i18nKey="home.paths_dept_desc" components={{ 1: <span className="text-white" /> }} />
              </p>

              <ul className="relative space-y-2 mb-8 text-sm text-white/85">
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> {t("home.paths_dept_bullet1")}</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> {t("home.paths_dept_bullet2")}</li>
                <li className="flex items-center gap-2"><span className="text-primary">▪</span> {t("home.paths_dept_bullet3")}</li>
              </ul>

              <div className="relative flex items-center justify-between pt-6 border-t border-white/15">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-white/50">{t("home.paths_dept_from")}</div>
                  <div className="text-2xl font-semibold text-white">R$ 1.477<span className="text-sm font-normal text-white/50">/mês</span></div>
                </div>
                <span className="text-sm font-semibold inline-flex items-center gap-1 text-white group-hover:text-primary transition-colors">
                  {t("home.paths_dept_see")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>
          </div>

          {/* ── Escala · faixa de prova (fundida à mesma seção) ─── */}
          <div className="relative mt-20 pt-12 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-8 text-center">
              {t("home.scale_eyebrow")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
              {[
                { num: 20, prefix: "", suffix: "", label: t("home.scale_companies"), accent: false, sub: null as string | null },
                { num: 200, prefix: "+", suffix: "", label: t("home.scale_specialists"), accent: false, sub: null },
                { num: 1477, prefix: "R$ ", suffix: "", label: t("home.scale_cost"), accent: true, sub: "vs R$ 90.000 CLT" },
                { num: 14, prefix: "", suffix: "", label: t("home.scale_langs"), accent: false, sub: null },
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
                    className={`block text-3xl md:text-4xl font-semibold tracking-tight ${s.accent ? "text-primary" : "text-white"}`}
                  />
                  <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/50">
                    {s.label}
                  </div>
                  {s.sub && (
                    <div className="mt-1 text-[10px] text-white/35 line-through decoration-white/25">
                      {s.sub}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROVA DE VIDA · operação em tempo real ═══════════ */}
      <LiveOpsSection />




      {/* ═══════════ DEPARTAMENTOS ═══════════ */}
      <section className="max-w-6xl mx-auto px-6 py-24 sm:py-32" aria-label="Departamentos">
        <div className="mb-16 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
            {t("home.dept_section_eyebrow")}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
            {t("home.dept_section_title1")}{" "}
            <span className="text-muted-foreground">{t("home.dept_section_title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            {t("home.dept_section_desc")}
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
                    {t("home.dept_most_hired")}
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
                    {t("home.dept_agents_247", { count: dept.agentSlugs.length })}
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
              {t("home.how_eyebrow")}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              {t("home.how_title1")}{" "}
              <span className="text-muted-foreground">{t("home.how_title2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              {t("home.how_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: t("home.how_s1_title"),
                copy: t("home.how_s1_copy"),
              },
              {
                step: "02",
                title: t("home.how_s2_title"),
                copy: t("home.how_s2_copy"),
              },
              {
                step: "03",
                title: t("home.how_s3_title"),
                copy: t("home.how_s3_copy"),
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
              {t("home.compare_eyebrow")}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              {t("home.compare_title1")}{" "}
              <span className="text-muted-foreground">{t("home.compare_title2")}</span>
            </h2>
          </div>

          <div className="rounded-3xl border border-border/60 overflow-hidden bg-background">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-border/60 bg-card/40">
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                {t("home.compare_col_metric")}
              </div>
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold border-l border-border/60">
                {t("home.compare_col_clt")}
              </div>
              <div className="p-5 text-[11px] uppercase tracking-[0.14em] text-primary font-semibold border-l border-border/60 bg-primary/[0.03]">
                {t("home.compare_col_cla")}
              </div>
            </div>
            {[
              { label: t("home.compare_row_cost"), clt: "R$ 90.000", cla: "R$ 1.477" },
              { label: t("home.compare_row_setup"), clt: t("home.compare_v_setup_clt"), cla: t("home.compare_v_setup_cla") },
              { label: t("home.compare_row_cov"), clt: t("home.compare_v_cov_clt"), cla: t("home.compare_v_cov_cla") },
              { label: t("home.compare_row_langs"), clt: t("home.compare_v_lang_clt"), cla: t("home.compare_v_lang_cla") },
              { label: t("home.compare_row_scale"), clt: t("home.compare_v_scale_clt"), cla: t("home.compare_v_scale_cla") },
              { label: t("home.compare_row_turn"), clt: t("home.compare_v_turn_clt"), cla: t("home.compare_v_turn_cla") },
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
            {t("home.compare_sources")}
          </p>
        </div>
      </section>



      {/* ═══════════ PAINEL PREVIEW (dark) ═══════════ */}
      <section className="dark bg-black text-white" aria-label="Painel">
        <div className="max-w-6xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 mb-4">
              {t("home.panel_eyebrow")}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-white mb-6">
              {t("home.panel_title1")}
              <br />
              <span className="text-primary">{t("home.panel_title2")}</span>
            </h2>
            <p className="text-lg text-white/60">
              {t("home.panel_desc")}
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
              {t("home.testi_eyebrow")}
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.02] text-foreground mb-6">
              {t("home.testi_title1")}
              <br />
              <span className="text-muted-foreground">{t("home.testi_title2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              {t("home.testi_desc")}
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
            { value: String(totalSquads), label: t("home.scale2_squads") },
            { value: String(CLAUTHOR_ORG_CHART.length), label: t("home.scale2_depts") },
            { value: "99.9%", label: t("home.scale2_uptime") },
            { value: "24/7", label: t("home.scale2_ops") },
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
      <Suspense fallback={<div className="h-24 bg-background" />}>
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
            {t("home.final_title1")}
            <br />
            <span className="text-primary">{t("home.final_title2")}</span>
          </motion.h2>
          <p className="text-lg text-white/60 max-w-lg mx-auto mb-12">
            {t("home.final_desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => startFlow("final")}
              className="group inline-flex items-center gap-2 px-9 py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.6)]"
            >
              {t("home.final_cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link
              to="/thor"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {t("home.final_thor")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
