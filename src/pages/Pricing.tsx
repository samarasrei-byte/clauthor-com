import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check, Zap, Shield, Clock, Bot, ArrowRight, Coins, TrendingUp, Users,
  XCircle, CheckCircle2, DollarSign, Building2, Activity, Sparkles as SparklesIcon,
  Wrench,
} from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import SquadPlans from "@/components/pricing/SquadPlans";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getRegion, formatPrice } from "@/lib/pricing";
import { departments } from "@/data/departmentData";

/**
 * Pricing page — departament-first pricing model.
 *
 * Hierarchy (canonical, see mem://design/messaging-pitch):
 *   1. Departamento = unidade primária de preço
 *   2. Squad customizado = experiência de montagem (secundária)
 *   3. Token top-ups + Enterprise = terciário
 */
const FLAGSHIP_IDS = ["comercial", "prospeccao", "marketing", "suporte", "financeiro", "tecnologia"] as const;

const Pricing = () => {
  const [showTokens, setShowTokens] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const region = getRegion(lang);
  const fp = (amount: number) => formatPrice(amount, lang);

  const flagshipDepartments = FLAGSHIP_IDS
    .map((id) => departments.find((d) => d.id === id))
    .filter((d): d is (typeof departments)[number] => Boolean(d));

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

  return (
    <div className="min-h-dvh pt-24 pb-16 px-4 relative">
      <SEO
        title="Preços — Contrate um departamento inteiro de IA | Clauthor"
        description="20 departamentos. Squads customizáveis. +200 especialistas de IA orquestrados. Preço fixo por departamento, sem taxa por assento."
        path="/pricing"
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* ═════════════ HERO ═════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Preços por departamento
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Contrate um <span className="gradient-text">departamento inteiro</span>.
            <br />
            <span className="text-foreground/70 text-3xl sm:text-4xl lg:text-5xl">Monte seu squad em minutos.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-3">
            20 departamentos. Squads customizáveis. +200 especialistas de IA orquestrados.
            Preço fixo por departamento — sem taxa por assento, sem surpresa.
          </p>
          <p className="text-sm text-foreground/70 font-medium">
            Cada departamento inclui um <span className="text-primary font-bold">squad de especialistas</span>, tokens mensais e execuções auditáveis.
          </p>
        </motion.div>

        {/* ═════════════ DEPARTAMENTOS PRONTOS (unidade primária) ═════════════ */}
        <div className="mb-6 flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Departamentos Prontos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Especialistas de IA já orquestrados. Ative em 60 segundos.
            </p>
          </div>
          <Link to="/departamentos" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Ver todos os 20 departamentos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {flagshipDepartments.map((dept, i) => {
            const DeptIcon = dept.icon;
            const nameKey = `pricing_page.dept_${dept.id}` as const;
            const descKey = `pricing_page.dept_${dept.id}_desc` as const;
            const deptName = t(nameKey, { defaultValue: t(`dashboard.dept_${dept.id}`, { defaultValue: dept.id }) });
            const deptDesc = t(descKey, { defaultValue: t(`dashboard.dept_${dept.id}_desc`, { defaultValue: "" }) });
            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card rounded-2xl p-7 relative overflow-hidden transition-all hover:border-primary/40 ${
                  dept.popular ? "gradient-border" : ""
                }`}
              >
                {dept.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 text-[10px] uppercase tracking-wider">
                      Mais contratado
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <DeptIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-lg leading-tight">{deptName}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{deptDesc}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-bold gradient-text">{fp(dept.clauthorCost)}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground line-through">
                      Equipe CLT: {fp(dept.cltCost)}/mês
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      -{Math.round((1 - dept.clauthorCost / dept.cltCost) * 100)}%
                    </span>
                  </div>
                </div>

                {/* What's inside */}
                <div className="space-y-2.5 mb-6 py-4 border-y border-border/50">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Users className="h-4 w-4 text-primary/70 shrink-0" />
                    <span>
                      <span className="font-semibold text-foreground">{dept.headcount} especialistas</span>
                      <span className="text-muted-foreground"> de IA no squad</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Activity className="h-4 w-4 text-primary/70 shrink-0" />
                    <span>
                      <span className="font-semibold text-foreground">{dept.actions}</span>
                      <span className="text-muted-foreground"> execuções auditáveis/mês</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Coins className="h-4 w-4 text-primary/70 shrink-0" />
                    <span>
                      <span className="font-semibold text-foreground">{dept.tokens}</span>
                      <span className="text-muted-foreground"> tokens/mês incluídos</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                    <span className="text-muted-foreground">Operação 24/7 · 14+ idiomas</span>
                  </div>
                </div>

                <Link
                  to="/auth"
                  state={{ hireIntent: { type: "department", label: deptName, slugs: dept.agents.map((a) => a.key) } }}
                >
                  <Button
                    className={`w-full rounded-xl h-12 font-semibold gap-2 ${dept.popular ? "glow" : ""}`}
                    variant={dept.popular ? "default" : "outline"}
                  >
                    Contratar departamento
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ═════════════ CTA: monte seu squad (secundário) ═════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-10 mb-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-primary/70">
                <Wrench className="h-3.5 w-3.5" />
                Ou personalize
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                Nenhum departamento pronto encaixa? Monte seu squad.
              </h3>
              <p className="text-muted-foreground text-sm max-w-xl">
                Combine especialistas de IA de qualquer departamento. Escolha 3, 5 ou 10 agentes
                e receba descontos progressivos de até 35%.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/team-builder">
                <Button className="glow rounded-xl h-12 px-6 font-semibold gap-2">
                  Montar meu squad <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ═════════════ SQUAD PACKS + BUILDER (mantido, agora secundário) ═════════════ */}
        <SquadPlans />

        {/* ═════════════ CLT vs CLAUTHOR ═════════════ */}
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
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground" />
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
              <Link to="/departamentos">
                <Button className="glow rounded-xl px-8 h-12 font-semibold">
                  <Zap className="h-4 w-4 mr-2" />
                  Ver os 20 departamentos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ═════════════ ENTERPRISE ═════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12 mb-16 relative overflow-hidden border-primary/20"
        >
          <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-[0.2em] text-primary/70">
                <Building2 className="h-3.5 w-3.5" />
                Enterprise
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                Múltiplos departamentos, SSO, SLA 99.9% e modelo privado.
              </h3>
              <p className="text-muted-foreground text-sm max-w-xl">
                Squad dedicado, fine-tuning com seus dados, integração com seu ERP/CRM,
                audit trail criptográfico e suporte white-glove. Preço sob consulta.
              </p>
            </div>
            <Link to="/enterprise">
              <Button variant="outline" className="rounded-xl h-12 px-6 font-semibold gap-2 border-primary/30">
                Falar com vendas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ═════════════ TOKEN TOP-UP (terciário) ═════════════ */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12 mb-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-1 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary/70" />
                Top-up de tokens
              </h2>
              <p className="text-muted-foreground text-sm">
                Passou do incluído no departamento? Compre tokens avulsos, sem alterar seu plano.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowTokens(!showTokens)} className="rounded-xl border-border hover:border-primary/20">
              <Coins className="h-4 w-4 mr-2" />
              {showTokens ? t("pricing_page.hide_packs") : t("pricing_page.show_packs")}
            </Button>
          </div>
          {showTokens && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
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

        {/* ═════════════ TODOS OS DEPARTAMENTOS INCLUEM ═════════════ */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold text-center mb-8">Todos os departamentos incluem</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "Squad de especialistas", desc: "Agentes de IA já orquestrados entre si" },
              { icon: Shield, title: "Auditoria & RLS", desc: "Trilha criptográfica de cada ação executada" },
              { icon: Zap, title: "Execuções ilimitadas*", desc: "*Dentro do envelope de tokens do departamento" },
              { icon: Clock, title: "99.9% uptime", desc: "Operação 24/7 em 14+ idiomas" },
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
