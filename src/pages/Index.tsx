import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { lazy, Suspense, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const SmartOnboarding = lazy(() => import("@/components/onboarding/SmartOnboarding"));
const LiveDemoSection = lazy(() => import("@/components/landing/LiveDemoSection"));
const SmartAgentFinder = lazy(() => import("@/components/library/SmartAgentFinder"));
const LiveDemoAgent = lazy(() => import("@/components/landing/LiveDemoAgent"));
const InnovationRoadmap = lazy(() => import("@/components/landing/InnovationRoadmap"));
const ROIBenchmark = lazy(() => import("@/components/landing/ROIBenchmark"));
const CompetitiveMoat = lazy(() => import("@/components/landing/CompetitiveMoat"));
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, Bolt,
  Code, UsersRound,
  LockKeyhole, Workflow,
  Headphones, BotMessageSquare, PenTool, ShoppingCart, Megaphone, LineChart,
  Star, Receipt, Globe, Briefcase, DollarSign, MessageSquare,
  ChevronRight, Layers3,
  Building2, Clock, Rocket, Fingerprint, Crosshair,
} from "lucide-react";
import { useRef, useMemo, useState, useCallback } from "react";
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
  const isMobile = useIsMobile();
  const [showSmartOnboarding, setShowSmartOnboarding] = useState(false);

  const cyclingRoles = useMemo(() => [
    "AI Employees",
    "AI Sales Rep",
    "AI Support Agent",
    "AI Growth Hacker",
    "AI CFO Assistant",
    "AI Content Creator",
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
      <section ref={heroRef} className="relative min-h-[70svh] sm:min-h-[75vh] flex items-center px-5 sm:px-6 pt-24 pb-16 sm:pt-32 sm:pb-20" aria-label="Hero">
        <div className="relative z-10 max-w-[1120px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* LEFT — Text */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mb-5"
              >
                <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-semibold leading-[1.05] tracking-[-0.04em]">
                  <span className="text-foreground">{typedText}</span>
                  <span className="inline-block w-[2px] h-[0.7em] bg-foreground/30 ml-1 align-middle" style={{ animation: "blink-cursor 0.8s step-end infinite" }} />
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="text-[16px] sm:text-[17px] text-muted-foreground max-w-md mx-auto lg:mx-0 leading-[1.6] mb-8 font-light">
                  {t("home.subtitle")}
                  <span className="text-foreground font-normal"> {t("home.subtitle_highlight")}</span>
                </p>

                {/* CTAs — minimal Apple style */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link to="/waitlist" className="block w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto h-11 px-7 text-[13px] font-medium rounded-full gap-2">
                      {t("home.cta_waitlist", { defaultValue: "Get Started" })}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link to="/library" className="block">
                    <Button variant="ghost" size="lg" className="h-11 px-5 text-[13px] font-medium text-primary gap-1">
                      {t("home.cta_explore_agents")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* RIGHT — Live Demo */}
            <div className="w-full max-w-[400px] lg:w-[400px] shrink-0 mx-auto lg:mx-0">
              <Suspense fallback={
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="w-28 h-3 rounded bg-muted animate-pulse" />
                      <div className="w-16 h-2 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="h-[300px]" />
                </div>
              }>
                <LiveDemoAgent />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LIVE DEMO ═══════════ */}
      <Suspense fallback={null}>
        <LiveDemoSection />
      </Suspense>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-16 sm:py-20 px-5" aria-label="Platform capabilities">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {[
              { value: "200+", label: t("home.stats_active_agents", { defaultValue: "AI Agents" }) },
              { value: "55", label: t("home.stats_squads", { defaultValue: "Smart Squads" }) },
              { value: "15", label: t("home.stats_departments", { defaultValue: "Departments" }) },
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
      <section className="py-16 sm:py-20 px-4" aria-label="AI Concierge">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_concierge")}</p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t("home.concierge_title")} <span className="text-primary">{t("home.concierge_title_hl")}</span>
              </h2>
              <p className="text-[14px] text-muted-foreground mt-2">
                {t("home.concierge_desc")}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 sm:p-8 shadow-sm">
              <Suspense fallback={<div className="h-[200px] rounded-lg bg-muted animate-pulse" />}>
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
      <section className="py-16 sm:py-20 px-4" aria-label="How it works">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_protocol")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("home.how_title")} <span className="text-primary">{t("home.how_steps_count")}</span>
            </h2>
          </div>

          <div className="space-y-2">
            {[
              { step: "01", icon: Crosshair, title: t("home.how_step1"), desc: t("home.how_step1_desc") },
              { step: "02", icon: Layers3, title: t("home.how_step2"), desc: t("home.how_step2_desc") },
              { step: "03", icon: Bolt, title: t("home.how_step3"), desc: t("home.how_step3_desc") },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-xl border border-transparent hover:border-border hover:bg-accent/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-[15px] mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY CLAUTHOR ═══════════ */}
      <section className="py-16 sm:py-20 px-4 border-y border-border" aria-label="Why CLAUTHOR">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_differentials")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("home.why_title")} <span className="text-primary">CLAUTHOR</span>
            </h2>
            <p className="text-[14px] text-muted-foreground mt-2 max-w-xl mx-auto">
              {t("home.why_subtitle")}
            </p>
          </div>

          {/* Hero savings card */}
          <div className="mb-6 p-6 sm:p-8 rounded-xl border-2 border-primary/20 bg-primary/[0.03] relative">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-primary/10 text-primary">
                {t("home.diff_savings_badge", { defaultValue: "MAIOR IMPACTO" })}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">+88%</p>
                <h3 className="font-bold text-lg mb-1">{t("home.diff_savings")}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{t("home.diff_savings_desc")}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Fingerprint, title: t("home.diff_security"), desc: t("home.diff_security_desc") },
              { icon: Bolt, title: t("home.diff_setup"), desc: t("home.diff_setup_desc") },
              { icon: Workflow, title: t("home.diff_orchestration"), desc: t("home.diff_orchestration_desc") },
              { icon: Globe, title: t("home.diff_multilang"), desc: t("home.diff_multilang_desc") },
              { icon: Rocket, title: t("home.diff_scale"), desc: t("home.diff_scale_desc") },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5 group-hover:text-primary transition-colors">{item.title}</h3>
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
      <section className="py-16 sm:py-20 px-4" aria-label="Testimonials">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_cases")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("home.cases_title")} <span className="text-primary">{t("home.cases_title_hl")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                initials: "RM", name: t("home.case1_name"), role: t("home.case1_role"), sector: t("home.case1_sector"),
                quote: t("home.case1_quote"), metric: t("home.case1_metric"), metricLabel: t("home.case1_metric_label"),
              },
              {
                initials: "CS", name: t("home.case2_name"), role: t("home.case2_role"), sector: t("home.case2_sector"),
                quote: t("home.case2_quote"), metric: t("home.case2_metric"), metricLabel: t("home.case2_metric_label"),
              },
              {
                initials: "LP", name: t("home.case3_name"), role: t("home.case3_role"), sector: t("home.case3_sector"),
                quote: t("home.case3_quote"), metric: t("home.case3_metric"), metricLabel: t("home.case3_metric_label"),
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-5 flex flex-col"
              >
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 mb-4 w-fit">
                  <span className="text-[13px] font-bold text-primary">{testimonial.metric}</span>
                  <span className="text-[11px] text-primary/70">{testimonial.metricLabel}</span>
                </div>

                <p className="text-[14px] text-foreground/90 leading-relaxed italic mb-5 flex-1">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] truncate">{testimonial.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{testimonial.role}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST ═══════════ */}
      <section className="py-12 sm:py-16 px-4" aria-label="Trust">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">{t("home.trust_section_title")}</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed max-w-lg mx-auto mb-6">
              {t("home.trust_section_desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: LockKeyhole, text: t("home.trust_encrypted") },
                { icon: Bolt, text: t("home.trust_cancel") },
                { icon: Headphones, text: t("home.trust_support") },
              ].map((g) => (
                <div key={g.text} className="flex items-center gap-1.5">
                  <g.icon className="h-3.5 w-3.5 text-primary/60" strokeWidth={1.5} />
                  <span className="text-[12px] font-medium text-muted-foreground">{g.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TEAM ═══════════ */}
      <section className="py-16 sm:py-20 px-4" aria-label="Team">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_team")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold">{t("home.team_title")}</h2>
            <p className="text-[14px] text-muted-foreground mt-2 max-w-2xl mx-auto">{t("home.team_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { name: "THOR", role: t("home.thor_role"), photo: thorPhoto, bio: t("home.thor_bio"), isAI: true },
              { name: "HELIXA AI", role: t("home.helixa_role"), photo: helixaPhoto, bio: t("home.helixa_bio"), isAI: true },
            ].map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={member.photo}
                    alt={member.name}
                    loading="lazy"
                    width={400}
                    height={533}
                    className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    {member.isAI && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">AI</span>}
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{member.role}</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold mb-1">{member.name}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="py-12 sm:py-16 px-4 border-y border-border" aria-label="Pricing">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">{t("home.section_pricing")}</p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {t("home.pricing_from")} <span className="text-primary">{t("home.pricing_amount")}</span> {t("home.pricing_per_agent")}
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-lg mx-auto mb-6">
              {t("home.pricing_desc")}
            </p>

            {/* Value comparison */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {[
                { label: t("home.pricing_val_human", { defaultValue: "Full-time Employee" }), value: "$5,500/mo", muted: true },
                { label: t("home.pricing_val_agent", { defaultValue: "CLAUTHOR Agent" }), value: "$139/mo", muted: false },
              ].map((item) => (
                <div key={item.label} className={`px-5 py-3 rounded-xl border text-center ${item.muted ? "border-border bg-muted/30 opacity-60" : "border-primary/20 bg-primary/5"}`}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                  <p className={`text-lg font-bold ${item.muted ? "line-through text-muted-foreground" : "text-primary"}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Tiers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
              {[
                { label: t("home.pricing_tier_3"), discount: t("home.pricing_off_10") },
                { label: t("home.pricing_tier_5"), discount: t("home.pricing_off_20") },
                { label: t("home.pricing_tier_7"), discount: t("home.pricing_off_30") },
                { label: t("home.pricing_tier_10"), discount: t("home.pricing_off_35") },
              ].map(tier => (
                <div key={tier.label} className="px-3 py-2 rounded-lg border border-border bg-card text-center">
                  <p className="text-[11px] text-muted-foreground">{tier.label}</p>
                  <p className="text-[14px] font-bold text-primary">{tier.discount}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/waitlist">
                <Button size="lg" className="h-12 px-10 gap-2 text-[13px] font-semibold rounded-lg">
                  <Rocket className="h-4 w-4" strokeWidth={1.5} />
                  {t("home.cta_waitlist", { defaultValue: "JOIN THE WAITLIST" })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="h-11 px-8 text-[13px] font-medium rounded-lg">
                  {t("home.cta_see_pricing")}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WAITLIST BANNER ═══════════ */}
      <section className="py-12 sm:py-16 px-4" aria-label="Waitlist">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-emerald" />
                </span>
                <span className="text-[11px] font-semibold text-accent-emerald uppercase tracking-wider">{t("home.waitlist_banner_live", { defaultValue: "LANÇAMENTO EM BREVE" })}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                {t("home.waitlist_banner_title", { defaultValue: "Não fique de fora do futuro." })}
              </h3>
              <p className="text-[14px] text-muted-foreground">
                {t("home.waitlist_banner_desc", { defaultValue: "Entre na fila agora e seja dos primeiros a ter acesso exclusivo." })}
              </p>
            </div>
            <Link to="/waitlist" className="shrink-0">
              <Button size="lg" className="h-12 px-8 gap-2 text-[13px] font-semibold rounded-lg">
                <Rocket className="h-4 w-4" strokeWidth={1.5} />
                {t("home.cta_waitlist", { defaultValue: "JOIN THE WAITLIST" })}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ INNOVATION ROADMAP ═══════════ */}
      <Suspense fallback={null}>
        <InnovationRoadmap />
      </Suspense>

      {/* ═══════════ EARLY ADOPTERS ═══════════ */}
      <section className="py-16 sm:py-20 px-4 border-t border-border" aria-label="Early adopters">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold text-primary uppercase tracking-wider mb-2">
              {t("home.early_adopters_badge", { defaultValue: "EARLY ADOPTERS" })}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("home.early_adopters_title", { defaultValue: "Quem já está usando" })}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-primary">{item.metric}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">{item.metricLabel}</span>
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">"{item.quote}"</p>
                <div className="pt-4 border-t border-border">
                  <p className="text-[13px] font-semibold">{item.author}</p>
                  <p className="text-[11px] text-muted-foreground">{item.company}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-6">
            {t("home.early_adopters_disclaimer", { defaultValue: "* Resultados de early adopters em fase beta." })}
          </p>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-20 sm:py-28 px-4" aria-label="Final CTA">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-10 sm:p-16">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                {t("home.final_cta_title_v2", { defaultValue: "Vagas limitadas. Garanta a sua." })}
              </h2>
              <p className="text-[15px] text-muted-foreground max-w-lg mx-auto mb-4 leading-relaxed">
                {t("home.final_cta_desc_v2", { defaultValue: "Os primeiros a entrar ganham acesso antecipado e desconto exclusivo de lançamento." })}
              </p>
              <div className="flex items-center justify-center gap-4 mb-8 text-[13px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary" /> {t("home.final_cta_discount", { defaultValue: "50% OFF launch" })}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {t("home.final_cta_priority", { defaultValue: "Priority access" })}</div>
              </div>
              <Link to="/waitlist">
                <Button size="lg" className="h-12 px-12 gap-2 text-[13px] font-semibold rounded-lg">
                  <Rocket className="h-4 w-4" strokeWidth={1.5} />
                  {t("home.cta_waitlist", { defaultValue: "JOIN THE WAITLIST" })}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
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
