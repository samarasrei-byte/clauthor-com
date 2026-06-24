import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Shield, Clock, Bot, ArrowRight, Sparkles, Coins, TrendingUp, Users, XCircle, CheckCircle2, DollarSign } from "lucide-react";
import SquadPlans from "@/components/pricing/SquadPlans";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getRegion, formatPrice } from "@/lib/pricing";

const Pricing = () => {
  const [showTokens, setShowTokens] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const region = getRegion(lang);
  const fp = (amount: number) => formatPrice(amount, lang);

  const plans = [
    {
      name: t("pricing_page.starter_name"), description: t("pricing_page.starter_desc"),
      price: fp(region.plans.starter), tokens: t("pricing_page.starter_tokens"),
      popular: false, equivalent: t("pricing_page.starter_equivalent"),
      cltCost: t("pricing_page.starter_cost"), savings: t("pricing_page.starter_savings"),
      features: [t("pricing_page.starter_f1"), t("pricing_page.starter_f2"), t("pricing_page.starter_f3"), t("pricing_page.starter_f4"), t("pricing_page.starter_f5"), t("pricing_page.starter_f6")],
    },
    {
      name: t("pricing_page.pro_name"), description: t("pricing_page.pro_desc"),
      price: fp(region.plans.growth), tokens: t("pricing_page.pro_tokens"),
      popular: true, equivalent: t("pricing_page.pro_equivalent"),
      cltCost: t("pricing_page.pro_cost"), savings: t("pricing_page.pro_savings"),
      features: [t("pricing_page.pro_f1"), t("pricing_page.pro_f2"), t("pricing_page.pro_f3"), t("pricing_page.pro_f4"), t("pricing_page.pro_f5"), t("pricing_page.pro_f6"), t("pricing_page.pro_f7")],
    },
    {
      name: t("pricing_page.ent_name"), description: t("pricing_page.ent_desc"),
      price: t("pricing_page.ent_price"), tokens: t("pricing_page.ent_tokens"),
      popular: false, equivalent: t("pricing_page.ent_equivalent"),
      cltCost: t("pricing_page.ent_cost"), savings: t("pricing_page.ent_savings"),
      features: [t("pricing_page.ent_f1"), t("pricing_page.ent_f2"), t("pricing_page.ent_f3"), t("pricing_page.ent_f4"), t("pricing_page.ent_f5"), t("pricing_page.ent_f6"), t("pricing_page.ent_f7"), t("pricing_page.ent_f8")],
    },
  ];

  const tokenPacks = [
    { amount: t("pricing_page.token_pack1"), price: fp(region.tokenPacks.pack5m), discount: null },
    { amount: t("pricing_page.token_pack2"), price: fp(region.tokenPacks.pack15m), discount: "11% off" },
    { amount: t("pricing_page.token_pack3"), price: fp(region.tokenPacks.pack50m), discount: "20% off" },
    { amount: t("pricing_page.token_pack4"), price: fp(region.tokenPacks.pack100m), discount: "33% off" },
  ];

  const cltComparison = [
    { label: t("pricing_page.clt_row1"), clt: `${fp(region.comparison.avgSalary)}/${t("pricing_page.per_month").replace("/", "")}`, apex: `${t("pricing_page.replaces").toLowerCase().includes("from") ? "" : t("pricing_page.clt_row1_apex").split(" ")[0] + " "}${fp(region.comparison.agentStarting)}/${t("pricing_page.per_month").replace("/", "")}` },
    { label: t("pricing_page.clt_row2"), clt: t("pricing_page.clt_row2_clt"), apex: t("pricing_page.clt_row2_apex") },
    { label: t("pricing_page.clt_row3"), clt: t("pricing_page.clt_row3_clt"), apex: t("pricing_page.clt_row3_apex") },
    { label: t("pricing_page.clt_row4"), clt: t("pricing_page.clt_row4_clt"), apex: t("pricing_page.clt_row4_apex") },
    { label: t("pricing_page.clt_row5"), clt: t("pricing_page.clt_row5_clt"), apex: t("pricing_page.clt_row5_apex") },
    { label: t("pricing_page.clt_row6"), clt: t("pricing_page.clt_row6_clt"), apex: t("pricing_page.clt_row6_apex") },
    { label: t("pricing_page.clt_row7"), clt: t("pricing_page.clt_row7_clt"), apex: t("pricing_page.clt_row7_apex") },
    { label: t("pricing_page.clt_row8"), clt: fp(region.comparison.avgSalaryYear3) + "+", apex: fp(region.comparison.agentYear3) },
  ];

  const isOnRequest = (price: string) => price === t("pricing_page.on_request") || price === "Sob consulta" || price === "On request";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <SEO title="Pricing — AI Workforce Plans | Clauthor" description="Hire entire AI departments from R$345/mo. Transparent pricing, no per-seat fees, pay only for outcomes." path="/pricing" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            {t("pricing_page.badge")}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {t("pricing_page.title")} <span className="gradient-text">{t("pricing_page.title_hl")}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-2">{t("pricing_page.subtitle")}</p>
          <p className="text-sm text-foreground/70 font-medium">
            {t("pricing_page.tip")} <span className="text-primary font-bold">{t("pricing_page.tip_hl")}</span> {t("pricing_page.tip_rest")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass-card rounded-2xl p-8 relative overflow-hidden ${plan.popular ? "gradient-border" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">{t("pricing_page.most_popular")}</Badge>
                </div>
              )}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] opacity-0 hover:opacity-100 transition-opacity" />
              <div className="text-center mb-6">
                <h3 className="font-display font-bold text-2xl mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold gradient-text">{plan.price}</span>
                  {!isOnRequest(plan.price) && <span className="text-muted-foreground">{t("pricing_page.per_month")}</span>}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <Coins className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-medium text-primary/80">{plan.tokens} {t("pricing_page.tokens_month")}</span>
                </div>
              </div>
              <div className="mb-6 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400">{t("pricing_page.replaces")} {plan.equivalent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{t("pricing_page.equivalent_cost")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">{plan.cltCost}</span>
                    <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">-{plan.savings}</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary/70 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" state={{ hireIntent: { type: "agent", label: plan.name, slugs: [] } }}>
                <Button className={`w-full rounded-xl h-12 font-semibold ${plan.popular ? "glow" : ""}`} variant={plan.popular ? "default" : "outline"}>
                  {isOnRequest(plan.price) ? t("pricing_page.contact_sales") : t("pricing_page.start_now")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Squad Plans */}
        <SquadPlans />

        {/* CLT vs CLAUTHOR Comparison */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-4 py-2">
                <DollarSign className="h-4 w-4 mr-2" />
                {t("pricing_page.comparison_badge")}
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                {t("pricing_page.comparison_title_1")} <span className="text-muted-foreground">{t("pricing_page.comparison_vs")}</span> <span className="gradient-text">{t("pricing_page.comparison_title_2")}</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("pricing_page.comparison_desc")} <span className="text-primary font-bold">80%</span>.
              </p>
            </div>
            <div className="space-y-0">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground"></div>
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {t("pricing_page.clt_header_traditional")}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    CLAUTHOR
                  </span>
                </div>
              </div>
              {cltComparison.map((row, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 hover:bg-white/[0.01] transition-colors">
                  <div className="text-sm font-medium text-foreground/80">{row.label}</div>
                  <div className="text-center text-sm text-muted-foreground">{row.clt}</div>
                  <div className="text-center text-sm font-semibold text-cyan-400">{row.apex}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t("pricing_page.comparison_footer1")} <span className="text-foreground font-bold">{fp(region.comparison.avgSalary * 1.68)}/{t("pricing_page.per_month").replace("/", "")}</span> {t("pricing_page.comparison_footer2")}
                <br />
                {t("pricing_page.comparison_footer3")} <span className="text-cyan-400 font-bold">{fp(region.comparison.agentStarting)}/{t("pricing_page.per_month").replace("/", "")}</span>.
              </p>
              <Link to="/auth" state={{ hireIntent: { type: "agent", label: "Plano CLAUTHOR", slugs: [] } }}>
                <Button className="glow rounded-xl px-8 h-12 font-semibold">
                  <Zap className="h-4 w-4 mr-2" />
                  {t("pricing_page.save_now")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Token Upgrade */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12 mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-primary/70" />
                {t("pricing_page.token_upgrade")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("pricing_page.token_desc")}</p>
            </div>
            <Button variant="outline" onClick={() => setShowTokens(!showTokens)} className="rounded-xl border-border hover:border-primary/20">
              <Coins className="h-4 w-4 mr-2" />
              {showTokens ? t("pricing_page.hide_packs") : t("pricing_page.show_packs")}
            </Button>
          </div>
          {showTokens && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tokenPacks.map((pack, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-6 text-center glass-hover relative">
                  {pack.discount && (
                    <div className="absolute -top-2 right-3">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{pack.discount}</span>
                    </div>
                  )}
                  <Coins className="h-6 w-6 text-primary/60 mx-auto mb-3" />
                  <p className="font-display font-bold text-lg mb-1">{pack.amount}</p>
                  <p className="text-xs text-muted-foreground mb-3">{t("pricing_page.tokens")}</p>
                  <p className="font-display font-bold text-xl gradient-text">{pack.price}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* All plans include */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold text-center mb-8">{t("pricing_page.all_plans_include")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: t("pricing_page.plan_feature_agents"), desc: t("pricing_page.plan_feature_agents_desc") },
              { icon: Shield, title: t("pricing_page.plan_feature_security"), desc: t("pricing_page.plan_feature_security_desc") },
              { icon: Zap, title: t("pricing_page.plan_feature_execution"), desc: t("pricing_page.plan_feature_execution_desc") },
              { icon: Clock, title: t("pricing_page.plan_feature_uptime"), desc: t("pricing_page.plan_feature_uptime_desc") },
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
      </div>
    </div>
  );
};

export default Pricing;
