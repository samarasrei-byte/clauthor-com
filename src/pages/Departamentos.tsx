import { useState, useEffect, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CheckoutSummaryDialog, { type CheckoutSummaryData } from "@/components/dashboard/CheckoutSummaryDialog";
import type { HireIntent } from "./Auth";
import {
  Building2, ArrowRight, Flame, Bot, Zap,
  CheckCircle2, TrendingUp, Network, Lightbulb, ThumbsUp, Send,
  Loader2, Clock, Users, Shield, Rocket, X, Filter
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SquadConsultant from "@/components/pricing/SquadConsultant";
import { supabase } from "@/integrations/supabase/client";
import { createPayPalPlan, handleInlineApproval } from "@/lib/paypal-helpers";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { getRegion, formatPrice } from "@/lib/pricing";
import {
  departments, totalClauthorCost, totalCltCost, totalTokens,
  totalAgents, totalSavingsPercent
} from "@/data/departmentData";

// Category definitions for filters
const getCategoryLabels = (t: any) => [
  { id: "all", label: t("departments_page.cat_all"), icon: Filter },
  { id: "popular", label: t("departments_page.cat_popular"), icon: Flame },
  { id: "tech", label: t("departments_page.cat_tech"), ids: ["tecnologia", "qualidade"] },
  { id: "vendas", label: t("departments_page.cat_sales"), ids: ["comercial", "prospeccao", "ecommerce_growth"] },
  { id: "ops", label: t("departments_page.cat_ops"), ids: ["operacoes", "logistica", "compras"] },
  { id: "criativo", label: t("departments_page.cat_creative"), ids: ["marketing", "criacao", "comunicacao"] },
  { id: "corp", label: t("departments_page.cat_corp"), ids: ["financeiro", "juridico", "rh", "suporte"] },
];

const Departamentos = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language?.split("-")[0] || "pt";
  const [hiringDeptId, setHiringDeptId] = useState<string | null>(null);
  const [suggestionName, setSuggestionName] = useState("");
  const [suggestionReason, setSuggestionReason] = useState("");
  const [suggestionEmail, setSuggestionEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ department_name: string; votes: number }[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [checkoutData, setCheckoutData] = useState<CheckoutSummaryData | null>(null);
  const categories = getCategoryLabels(t);
  const [searchParams] = useSearchParams();

  // Pre-select category from onboarding (?dept=marketing)
  // With `&auto=1` (from landing "Contratar"), auto-fires the checkout.
  useEffect(() => {
    const dept = searchParams.get("dept");
    if (!dept) return;
    const deptToCategory: Record<string, string> = {
      marketing: "criativo",
      vendas: "vendas",
      comercial: "vendas",
      suporte: "corp",
      atendimento: "corp",
      financeiro: "corp",
      juridico: "corp",
      rh: "corp",
    };
    const cat = deptToCategory[dept];
    if (cat) setActiveFilter(cat);

    if (searchParams.get("auto") === "1") {
      const target = departments.find((d) => d.id === dept);
      if (target) {
        // Defer to next tick so `user`/region are resolved.
        setTimeout(() => handleHireDepartment(target), 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const region = getRegion(lang);

  // Filter departments based on active category
  const filteredDepartments = departments.filter((dept) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "popular") return dept.popular;
    const cat = categories.find((c) => c.id === activeFilter);
    if (cat && "ids" in cat) return cat.ids.includes(dept.id);
    return true;
  });

  const handleHireDepartment = useCallback(async (dept: typeof departments[0]) => {
    const hireIntent: HireIntent = {
      type: "department",
      label: t(`squads.dept_${dept.id}`),
      departmentId: dept.id,
      slugs: dept.agents.map(a => a.key),
    };

    if (!user) {
      navigate("/auth", { state: { hireIntent, signup: true } });
      return;
    }

    // Logged in → show checkout summary
    const deptPrice = (region.departments as Record<string, number>)[dept.id] || dept.clauthorCost;

    const checkoutInfo: CheckoutSummaryData = {
      label: t(`squads.dept_${dept.id}`),
      slugs: dept.agents.map(a => a.key),
      isDepartment: true,
      departmentId: dept.id,
      price: deptPrice,
      currency: region.currency,
      lang,
    };
    setCheckoutData(checkoutInfo);

    // Create PayPal plan for inline checkout
    createPayPalPlan(`dept-${dept.id}`, `Departamento ${checkoutInfo.label}`, deptPrice, region.currency).then((planId) => {
      setCheckoutData((prev) => prev ? { ...prev, planId } : prev);
    });
  }, [user, navigate, t, lang, region]);

  const handleApproveCheckout = useCallback((subscriptionId: string) => {
    if (!checkoutData) return;
    handleInlineApproval(subscriptionId, checkoutData, {
      price_tier: "mid",
    });
  }, [checkoutData]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from("department_suggestions")
        .select("department_name, votes")
        .order("votes", { ascending: false })
        .limit(10);
      if (data) {
        const map = new Map<string, number>();
        data.forEach((s) => {
          const name = s.department_name.toLowerCase().trim();
          map.set(name, (map.get(name) || 0) + s.votes);
        });
        setSuggestions(
          Array.from(map.entries())
            .map(([department_name, votes]) => ({ department_name, votes }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5)
        );
      }
    };
    fetchSuggestions();
  }, []);

  const handleSuggestionSubmit = async () => {
    if (!suggestionName.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("department_suggestions").insert({
      department_name: suggestionName.trim().slice(0, 100),
      reason: suggestionReason.trim().slice(0, 500) || null,
      email: suggestionEmail.trim().slice(0, 255) || null,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(t("departments_page.suggest_error"));
    } else {
      toast.success(t("departments_page.suggest_success"));
      setSuggestionName("");
      setSuggestionReason("");
      setSuggestionEmail("");
      const { data } = await supabase
        .from("department_suggestions")
        .select("department_name, votes")
        .order("votes", { ascending: false })
        .limit(10);
      if (data) {
        const map = new Map<string, number>();
        data.forEach((s) => {
          const name = s.department_name.toLowerCase().trim();
          map.set(name, (map.get(name) || 0) + s.votes);
        });
        setSuggestions(
          Array.from(map.entries())
            .map(([department_name, votes]) => ({ department_name, votes }))
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 5)
        );
      }
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 relative">
      <SEO title="AI Departments — Pre-built Squads | Clauthor" description="Explore 20 ready-made AI departments: Sales, Marketing, Legal, Finance, HR, Support and more. Deploy in minutes." path="/departamentos" />
      <div className="max-w-7xl mx-auto relative mb-6">
      </div>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Hero Header - compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-5 py-2.5">
            <Network className="h-4 w-4 mr-2" />
            {t("departments_page.badge")}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            {t("departments_page.title1")}<br />
            <span className="gradient-text">{t("departments_page.title2")}</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto mb-4">
            {t("departments_page.subtitle", { deptCount: departments.length, agentCount: totalAgents })} <span className="text-primary font-bold">{t("departments_page.subtitle_highlight")}</span>.
          </p>

          {/* Hero Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {[
              { icon: Bot, value: String(totalAgents), label: t("departments_page.stat_agents") },
              { icon: Building2, value: String(departments.length), label: t("departments_page.stat_departments") },
              { icon: Zap, value: "24/7", label: t("departments_page.stat_operation") },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/30 border border-border text-sm">
                <stat.icon className="h-3.5 w-3.5 text-primary/70" />
                <span className="font-display font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeFilter === cat.id
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
                  : "bg-card/40 border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat.label}
              {cat.id !== "all" && cat.id !== "popular" && "ids" in cat && (
                <span className="ml-1.5 text-xs opacity-60">({cat.ids.length})</span>
              )}
            </button>
          ))}
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Department Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
          {filteredDepartments.map((dept, i) => {
            const DeptIcon = dept.icon;
            const deptPrice = (region.departments as Record<string, number>)[dept.id] || dept.clauthorCost;
            const deptClt = (region.departmentClt as Record<string, number>)[dept.id] || dept.cltCost;
            const savings = deptClt - deptPrice;
            const savingsPercent = deptClt > 0 ? Math.round((savings / deptClt) * 100) : 0;
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)] ${
                  dept.popular 
                    ? "border-primary/40 bg-primary/[0.03] ring-2 ring-primary/20 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.2)] md:scale-[1.03] md:-my-2 z-10" 
                    : "border-border bg-card/20 hover:border-primary/30"
                }`}
              >
                {dept.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                )}
                {dept.popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="rounded-lg bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]">
                      ⚡ {t("departments_page.best_seller")}
                    </Badge>
                  </div>
                )}

                <div className={`relative p-5 bg-gradient-to-br ${dept.gradient}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${dept.iconBg} flex items-center justify-center`}>
                      <DeptIcon className={`h-6 w-6 ${dept.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg">{t(`squads.dept_${dept.id}`)}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {dept.headcount} {t("departments_page.agents_label")} · {dept.actions} {t("departments_page.actions_month")} · 24/7
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-display font-bold text-2xl text-foreground">
                      {formatPrice(deptPrice, lang)}
                    </span>
                    <span className="text-sm text-muted-foreground mb-0.5">{t("departments_page.month")}</span>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] font-bold ml-auto">
                      -{dept.discount}% {t("departments_page.pack_discount")}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">
                    {t("departments_page.included_agents")}
                  </p>
                  {dept.agents.slice(0, 4).map((agent, idx) => {
                    const AgentIcon = agent.icon;
                    return (
                      <Link
                        key={`${dept.id}-${agent.key}-${idx}`}
                        to={`/agente/${agent.key}`}
                        className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-transparent hover:border-primary/20 transition-colors group/agent"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <AgentIcon className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate group-hover/agent:text-primary transition-colors">
                            {t(`library_page.agents.${agent.key}_title`)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {t("departments_page.replaces", { role: agent.role })}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  {dept.agents.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      {t("departments_page.more_agents", { count: dept.agents.length - 4 })}
                    </p>
                  )}
                </div>

                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div>
                     <p className="text-[10px] text-muted-foreground">{t("departments_page.vs_clt")}</p>
                      <p className="text-sm font-bold text-emerald-400">
                        -{savingsPercent}% {t("departments_page.savings")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground line-through">
                        {formatPrice(deptClt, lang)}{t("departments_page.month")}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleHireDepartment(dept)}
                    disabled={hiringDeptId === dept.id}
                    className="group relative w-full h-14 rounded-2xl font-display font-bold text-base uppercase tracking-widest overflow-hidden transition-all duration-500 hover:scale-[1.04] active:scale-[0.96] cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary bg-[length:200%_100%] animate-gradient-shift rounded-2xl" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/60 via-primary-glow/60 to-primary/60 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/[0.15] group-hover:border-white/[0.3] transition-colors duration-500" />
                    <span className="relative z-10 flex items-center justify-center gap-3 text-primary-foreground font-bold text-[14px] drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]">
                      {hiringDeptId === dept.id ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> {t("departments_page.processing")}</>
                      ) : (
                        <><Flame className="h-5 w-5 animate-pulse" /> {formatPrice(deptPrice, lang)}/{t("departments_page.month")} <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" /></>
                      )}
                    </span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-16 mb-16">
            <p className="text-muted-foreground">{t("departments_page.no_dept_found")}</p>
            <Button variant="outline" className="mt-4" onClick={() => setActiveFilter("all")}>
              {t("departments_page.view_all")}
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SECTION: CLT vs CLAUTHOR Comparison Table
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/30 overflow-hidden mb-16"
        >
          <div className="text-center p-8 pb-4">
            <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2">
              {t("departments_page.clt_vs_title")} <span className="text-muted-foreground">vs</span> <span className="gradient-text">CLAUTHOR</span>
            </h2>
            <p className="text-sm text-muted-foreground">{t("departments_page.clt_vs_subtitle")}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border">
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium">{t("departments_page.criteria")}</th>
                  <th className="px-6 py-4 text-muted-foreground font-medium text-center">{t("departments_page.clt_team")}</th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-primary font-bold">CLAUTHOR</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { criteria: t("departments_page.clt_cost"), clt: formatPrice(Math.round(totalCltCost / 3), lang), clauthor: formatPrice(Math.round(totalClauthorCost / 3), lang), highlight: true },
                  { criteria: t("departments_page.clt_availability"), clt: t("departments_page.clt_availability_val"), clauthor: t("departments_page.clauthor_availability"), highlight: false },
                  { criteria: t("departments_page.clt_onboarding"), clt: t("departments_page.clt_onboarding_val"), clauthor: t("departments_page.clauthor_onboarding"), highlight: false },
                  { criteria: t("departments_page.clt_scale"), clt: t("departments_page.clt_scale_val"), clauthor: t("departments_page.clauthor_scale"), highlight: false },
                  { criteria: t("departments_page.clt_charges"), clt: t("departments_page.clt_charges_val"), clauthor: t("departments_page.clauthor_charges"), highlight: true },
                  { criteria: t("departments_page.clt_benefits"), clt: t("departments_page.clt_benefits_val"), clauthor: t("departments_page.clauthor_benefits"), highlight: false },
                  { criteria: t("departments_page.clt_risk"), clt: t("departments_page.clt_risk_val"), clauthor: t("departments_page.clauthor_risk"), highlight: false },
                  { criteria: t("departments_page.clt_quality"), clt: t("departments_page.clt_quality_val"), clauthor: t("departments_page.clauthor_quality"), highlight: false },
                ].map((row) => (
                  <tr key={row.criteria} className={row.highlight ? "bg-primary/[0.03]" : ""}>
                    <td className="px-6 py-3.5 font-medium text-foreground">{row.criteria}</td>
                    <td className="px-6 py-3.5 text-center text-muted-foreground">{row.clt}</td>
                    <td className="px-6 py-3.5 text-center font-semibold text-emerald-400">{row.clauthor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════
            SECTION: Why hire entire departments
            ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/30 p-8 md:p-12 mb-16"
        >
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            {t("departments_page.why_title")} <span className="gradient-text">{t("departments_page.why_title_highlight")}</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: t("departments_page.why_cheaper", { percent: totalSavingsPercent }), desc: t("departments_page.why_cheaper_desc") },
              { icon: Clock, title: t("departments_page.why_247"), desc: t("departments_page.why_247_desc") },
              { icon: Network, title: t("departments_page.why_orchestrated"), desc: t("departments_page.why_orchestrated_desc") },
              { icon: Rocket, title: t("departments_page.why_setup"), desc: t("departments_page.why_setup_desc") },
            ].map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-6 w-6 text-primary/70" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Full Company CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 mb-16"
        >
          <Flame className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl sm:text-3xl mb-3">
            {t("departments_page.full_cta_title")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
            {t("departments_page.full_cta_subtitle", { deptCount: departments.length, agentCount: totalAgents })}
          </p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">{t("departments_page.clt_total")}</p>
              <p className="font-display font-bold text-xl line-through text-muted-foreground">
                {formatPrice(totalCltCost, lang)}{t("departments_page.month")}
              </p>
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-medium">CLAUTHOR</p>
              <p className="font-display font-bold text-xl text-emerald-400">
                {formatPrice(totalClauthorCost, lang)}{t("departments_page.month")}
              </p>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 font-bold text-sm px-3 py-1">
              -{totalSavingsPercent}%
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button 
              className="glow rounded-xl px-10 h-14 font-semibold gap-2 text-lg"
              onClick={() => {
                toast.info(t("departments_page.consultant_toast"), { duration: 5000 });
              }}
            >
              {t("departments_page.talk_consultant")}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Link to="/pricing">
              <Button variant="outline" className="rounded-xl px-8 h-14 font-semibold gap-2">
                {t("departments_page.view_individual")}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* AI Consultant */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/30 p-8 md:p-12 relative overflow-hidden mb-16"
        >
          <div className="absolute top-0 left-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold mb-2 flex items-center justify-center gap-3">
                <Bot className="h-6 w-6 text-primary" />
                {t("departments_page.ai_consultant_title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("departments_page.ai_consultant_desc")}</p>
            </div>
            <SquadConsultant />
          </div>
        </motion.div>

        {/* Suggest New Departments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/30 p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">
              {t("departments_page.suggest_title")} <span className="gradient-text">{t("departments_page.suggest_title_highlight")}</span>?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {t("departments_page.suggest_desc")}
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-4">
            <Input
              placeholder={t("departments_page.suggest_name_placeholder")}
              value={suggestionName}
              onChange={(e) => setSuggestionName(e.target.value)}
              maxLength={100}
              className="bg-card/40 border-border"
            />
            <Textarea
              placeholder={t("departments_page.suggest_reason_placeholder")}
              value={suggestionReason}
              onChange={(e) => setSuggestionReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="bg-card/40 border-border resize-none"
            />
            <Input
              type="email"
              placeholder={t("departments_page.suggest_email_placeholder")}
              value={suggestionEmail}
              onChange={(e) => setSuggestionEmail(e.target.value)}
              maxLength={255}
              className="bg-card/40 border-border"
            />
            <Button
              onClick={handleSuggestionSubmit}
              disabled={!suggestionName.trim() || isSubmitting}
              className="w-full h-12 gap-2 text-sm font-bold"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? t("departments_page.suggest_submitting") : t("departments_page.suggest_submit")}
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold text-center mb-4">
                {t("departments_page.most_voted")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((s) => (
                  <button
                    key={s.department_name}
                    onClick={() => setSuggestionName(s.department_name)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-sm capitalize">{s.department_name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {s.votes}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Checkout Summary Dialog for logged-in users */}
      <CheckoutSummaryDialog
        data={checkoutData}
        onApprove={handleApproveCheckout}
        onCancel={() => { setCheckoutData(null); setHiringDeptId(null); }}
      />

      <Footer />
    </div>
  );
};

export default Departamentos;
