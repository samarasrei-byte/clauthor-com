import { motion } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const SmartOnboarding = lazy(() => import("@/components/onboarding/SmartOnboarding"));
const LiveDemoSection = lazy(() => import("@/components/landing/LiveDemoSection"));
const SmartAgentFinder = lazy(() => import("@/components/library/SmartAgentFinder"));
const LiveDemoAgent = lazy(() => import("@/components/landing/LiveDemoAgent"));
const InnovationRoadmap = lazy(() => import("@/components/landing/InnovationRoadmap"));
const ROIBenchmark = lazy(() => import("@/components/landing/ROIBenchmark"));
const CompetitiveMoat = lazy(() => import("@/components/landing/CompetitiveMoat"));
import HeroTerminal from "@/components/landing/HeroTerminal";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck,
  Code, UsersRound,
  Headphones, PenTool, ShoppingCart, Megaphone, LineChart,
  Receipt, Globe, Briefcase, DollarSign, MessageSquare,
  ChevronRight,
} from "lucide-react";
import { useRef, useMemo, useState } from "react";
import { CLAUTHOR_ORG_CHART, CLAUTHOR_AGENT_COUNT } from "@/data/clauthorOrgChart";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import helixaPhoto from "@/assets/helixa-ai.png";
import thorPhoto from "@/assets/kaelis-ai.webp";

/* ═══════════════════════════════════════════════════════
   TYPEWRITER HOOK
   ═══════════════════════════════════════════════════════ */
const useCyclingTypewriter = (words: string[], speed = 50, pauseDuration = 2500, initialDelay = 600) => {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "typing" | "pausing" | "deleting">("waiting");
  const [firstCycleDone, setFirstCycleDone] = useState(false);

  useEffect(() => {
    const word = words[wordIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "waiting") {
      timer = setTimeout(() => setPhase("typing"), initialDelay);
    } else if (phase === "typing") {
      if (displayed.length < word.length) {
        timer = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), speed);
      } else {
        if (!firstCycleDone) setFirstCycleDone(true);
        timer = setTimeout(() => setPhase("deleting"), pauseDuration);
      }
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), speed / 2);
      } else {
        setWordIndex((prev) => (prev + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timer);
  }, [displayed, phase, wordIndex, words, speed, pauseDuration, initialDelay, firstCycleDone]);

  return { displayed, currentWord: words[wordIndex], firstCycleDone };
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);

  const cyclingRoles = useMemo(() => [
    "Funcionários de IA",
    "Vendedor de IA",
    "Agente de Suporte IA",
    "Growth Hacker de IA",
    "Assistente de CFO IA",
    "Criador de Conteúdo IA",
  ], []);
  const { displayed: typedText } = useCyclingTypewriter(cyclingRoles, 45, 2200, 600);

  // SEO meta tags
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
    let script = document.getElementById("jsonld-org") as HTMLScriptElement;
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

  const finderIcons: Record<string, React.ElementType> = {
    customer_service: Headphones, sales: DollarSign, billing: Receipt,
    developer: Code, sdr: Megaphone, hr: UsersRound, security: ShieldCheck,
    omnichannel: MessageSquare, content: PenTool, social_media: Globe,
    ecommerce: ShoppingCart, traffic_manager: LineChart, legal: Briefcase,
  };

  const finderMeta = useMemo(() => {
    const keys = Object.keys(finderIcons);
    return Object.fromEntries(keys.map(k => [k, {
      icon: finderIcons[k],
      tier: "advanced" as string,
      socialProof: { companies: 150, rating: 4.9, savings: "$8,500" },
      capabilities: [],
      slug: k.replace(/_/g, "-"),
    }]));
  }, []);

  return (
    <div className="relative overflow-x-hidden">

      {/* ═══════════ HERO ═══════════ */}
      <div ref={heroRef}>
        <HeroTerminal />
      </div>

      {/* ═══════════ LIVE DEMO ═══════════ */}
      <Suspense fallback={null}>
        <LiveDemoSection />
      </Suspense>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-16 sm:py-20 px-5" aria-label="Platform capabilities">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: `${CLAUTHOR_AGENT_COUNT}+`, label: t("home.stats_active_agents", { defaultValue: "AI Agents" }) },
              { value: String(CLAUTHOR_ORG_CHART.reduce((s, d) => s + d.squads.length, 0)), label: t("home.stats_squads", { defaultValue: "Smart Squads" }) },
              { value: String(CLAUTHOR_ORG_CHART.length), label: t("home.stats_departments", { defaultValue: "Departments" }) },
              { value: "99.9%", label: t("home.stats_uptime", { defaultValue: "Uptime" }) },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-1">{stat.value}</p>
                <p className="text-[13px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AI CONCIERGE ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="AI Concierge">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                {t("home.concierge_title")}
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-lg mx-auto">
                {t("home.concierge_desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-8">
              <Suspense fallback={<div className="h-[200px] rounded-xl bg-muted animate-pulse" />}>
                <SmartAgentFinder
                  agentMeta={finderMeta}
                  onHire={() => navigate("/library")}
                  onPreview={() => {}}
                  hiringSlug={null}
                />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="How it works">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {t("home.how_title")}
            </h2>
          </div>

          <div className="space-y-6">
            {[
              { step: "1", title: t("home.how_step1"), desc: t("home.how_step1_desc") },
              { step: "2", title: t("home.how_step2"), desc: t("home.how_step2_desc") },
              { step: "3", title: t("home.how_step3"), desc: t("home.how_step3_desc") },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-5"
              >
                <span className="text-[28px] font-light text-muted-foreground/40 leading-none mt-0.5 shrink-0">{item.step}</span>
                <div>
                  <h4 className="font-medium text-[15px] mb-1">{item.title}</h4>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY CLAUTHOR ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="Why CLAUTHOR">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              {t("home.why_title")}
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-lg mx-auto">
              {t("home.why_subtitle")}
            </p>
          </div>

          {/* Highlight metric */}
          <div className="text-center mb-12">
            <p className="text-5xl sm:text-6xl font-semibold tracking-tight mb-2">+88%</p>
            <p className="text-[15px] text-muted-foreground">{t("home.diff_savings")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50 rounded-2xl border border-border/50 overflow-hidden">
            {[
              { title: t("home.diff_security"), desc: t("home.diff_security_desc") },
              { title: t("home.diff_setup"), desc: t("home.diff_setup_desc") },
              { title: t("home.diff_orchestration"), desc: t("home.diff_orchestration_desc") },
              { title: t("home.diff_multilang"), desc: t("home.diff_multilang_desc") },
              { title: t("home.diff_scale"), desc: t("home.diff_scale_desc") },
              { title: t("home.diff_savings"), desc: t("home.diff_savings_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-background p-6"
              >
                <h3 className="font-medium text-[15px] mb-2">{item.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ROI CALCULATOR ═══════════ */}
      <div data-thor-trigger="roi_section">
        <Suspense fallback={<div className="py-20" />}>
          <ROIBenchmark />
        </Suspense>
      </div>

      {/* ═══════════ COMPETITIVE MOAT ═══════════ */}
      <Suspense fallback={<div className="py-20" />}>
        <CompetitiveMoat />
      </Suspense>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="Testimonials">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {t("home.cases_title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                initials: "RM", name: t("home.case1_name"), role: t("home.case1_role"),
                quote: t("home.case1_quote"), metric: t("home.case1_metric"), metricLabel: t("home.case1_metric_label"),
              },
              {
                initials: "CS", name: t("home.case2_name"), role: t("home.case2_role"),
                quote: t("home.case2_quote"), metric: t("home.case2_metric"), metricLabel: t("home.case2_metric_label"),
              },
              {
                initials: "LP", name: t("home.case3_name"), role: t("home.case3_role"),
                quote: t("home.case3_quote"), metric: t("home.case3_metric"), metricLabel: t("home.case3_metric_label"),
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col"
              >
                <p className="text-[22px] font-semibold tracking-tight mb-1">{testimonial.metric}</p>
                <p className="text-[12px] text-muted-foreground mb-4">{testimonial.metricLabel}</p>

                <p className="text-[14px] text-muted-foreground leading-relaxed mb-6 flex-1">
                  "{testimonial.quote}"
                </p>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-[13px] font-medium">{testimonial.name}</p>
                  <p className="text-[12px] text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST ═══════════ */}
      <section className="py-16 sm:py-20 px-5" aria-label="Trust">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">{t("home.trust_section_title")}</h3>
          <p className="text-[14px] text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
            {t("home.trust_section_desc")}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { text: t("home.trust_encrypted") },
              { text: t("home.trust_cancel") },
              { text: t("home.trust_support") },
            ].map((g) => (
              <span key={g.text} className="text-[12px] text-muted-foreground">{g.text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="Team">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("home.team_title")}</h2>
            <p className="text-[15px] text-muted-foreground mt-3 max-w-lg mx-auto">{t("home.team_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              { name: "THOR", role: t("home.thor_role"), photo: thorPhoto, bio: t("home.thor_bio") },
              { name: "HELIXA AI", role: t("home.helixa_role"), photo: helixaPhoto, bio: t("home.helixa_bio") },
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-2xl overflow-hidden"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    width={400}
                    height={533}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[11px] text-white/60 uppercase tracking-wider mb-1">{member.role}</p>
                  <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-[13px] text-white/70 leading-relaxed line-clamp-2">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="Pricing">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              {t("home.pricing_from")} {t("home.pricing_amount")} {t("home.pricing_per_agent")}
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-md mx-auto mb-8">
              {t("home.pricing_desc")}
            </p>

            {/* Value comparison */}
            <div className="flex justify-center gap-8 mb-10">
              <div className="text-center">
                <p className="text-[12px] text-muted-foreground mb-1">{t("home.pricing_val_human", { defaultValue: "Employee" })}</p>
                <p className="text-lg font-medium text-muted-foreground line-through">$5,500/mo</p>
              </div>
              <div className="text-center">
                <p className="text-[12px] text-muted-foreground mb-1">{t("home.pricing_val_agent", { defaultValue: "AI Agent" })}</p>
                <p className="text-lg font-semibold text-foreground">$139/mo</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/waitlist">
                <Button size="lg" className="h-11 px-8 gap-2 text-[13px] font-medium rounded-full">
                  {t("home.cta_waitlist", { defaultValue: "Get Started" })}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" className="h-11 px-6 text-[13px] font-medium text-primary gap-1">
                  {t("home.cta_see_pricing")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ EARLY ADOPTERS ═══════════ */}
      <section className="py-16 sm:py-24 px-5" aria-label="Early adopters">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {t("home.early_adopters_title", { defaultValue: "Quem já está usando" })}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                id: "testimonial-ceo",
                quote: t("home.testimonial_1", { defaultValue: "Automatizamos 80% do atendimento ao cliente no primeiro mês." }),
                author: "CEO",
                company: t("home.testimonial_1_company", { defaultValue: "E-commerce de Moda" }),
                metric: "80%",
                metricLabel: t("home.testimonial_1_metric", { defaultValue: "tickets automatizados" }),
              },
              {
                id: "testimonial-cfo",
                quote: t("home.testimonial_2", { defaultValue: "O agente financeiro concilia notas fiscais e gera relatórios. Economizamos um funcionário." }),
                author: "CFO",
                company: t("home.testimonial_2_company", { defaultValue: "Startup SaaS B2B" }),
                metric: "$8k",
                metricLabel: t("home.testimonial_2_metric", { defaultValue: "economia mensal" }),
              },
              {
                id: "testimonial-growth",
                quote: t("home.testimonial_3", { defaultValue: "Configurei o SDR em 10 minutos. Ele já prospecta e qualifica leads automaticamente." }),
                author: "Head of Growth",
                company: t("home.testimonial_3_company", { defaultValue: "Agência Digital" }),
                metric: "3x",
                metricLabel: t("home.testimonial_3_metric", { defaultValue: "mais leads qualificados" }),
              },
            ].map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col"
              >
                <p className="text-[22px] font-semibold tracking-tight mb-1">{item.metric}</p>
                <p className="text-[12px] text-muted-foreground mb-4">{item.metricLabel}</p>
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-5 flex-1">"{item.quote}"</p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-[13px] font-medium">{item.author}</p>
                  <p className="text-[12px] text-muted-foreground">{item.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ INNOVATION ROADMAP ═══════════ */}
      <Suspense fallback={null}>
        <InnovationRoadmap />
      </Suspense>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-24 sm:py-32 px-5" aria-label="Final CTA">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4">
              {t("home.final_cta_title_v2", { defaultValue: "Vagas limitadas. Garanta a sua." })}
            </h2>
            <p className="text-[16px] text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              {t("home.final_cta_desc_v2", { defaultValue: "Os primeiros a entrar ganham acesso antecipado e desconto exclusivo de lançamento." })}
            </p>
            <Link to="/waitlist">
              <Button size="lg" className="h-12 px-10 gap-2 text-[14px] font-medium rounded-full">
                {t("home.cta_waitlist", { defaultValue: "Get Started" })}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <Footer />
      <Suspense fallback={null}>
        <SmartOnboarding isOpen={showSmartOnboarding} onClose={() => setShowSmartOnboarding(false)} />
      </Suspense>
    </div>
  );
};

export default HomePage;
