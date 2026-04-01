import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, Users, TrendingDown, Sparkles, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ROIBenchmark = () => {
  const { t, i18n } = useTranslation();
  const [employees, setEmployees] = useState(5);

  const locale = i18n.language === "pt" ? "pt-BR" : (i18n.language || "en");
  const currency = i18n.language === "pt" ? "BRL" : "USD";
  const avgSalary = currency === "BRL" ? 8500 : 5500;
  const agentCost = currency === "BRL" ? 697 : 139;

  const data = useMemo(() => {
    const cltMonthly = employees * avgSalary;
    const cltAnnual = cltMonthly * 12;
    const cltWithOverhead = cltMonthly * 1.8; // taxes, benefits, office
    const aiMonthly = employees * agentCost;
    const aiAnnual = aiMonthly * 12;
    const savings = cltWithOverhead - aiMonthly;
    const savingsPct = Math.round((savings / cltWithOverhead) * 100);
    return { cltMonthly, cltAnnual, cltWithOverhead, aiMonthly, aiAnnual, savings, savingsPct };
  }, [employees, avgSalary, agentCost]);

  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(v);

  return (
    <section className="py-16 sm:py-24 px-4 relative" aria-label="ROI Calculator" data-thor-trigger="roi_section">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">
              {t("home.roi_section_badge", { defaultValue: "CALCULADORA DE ROI" })}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
            {t("home.roi_title", { defaultValue: "Quanto você" })} <span className="gradient-text">{t("home.roi_title_hl", { defaultValue: "economizaria?" })}</span>
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {t("home.roi_subtitle", { defaultValue: "Compare o custo de funcionários tradicionais vs. agentes de IA autônomos." })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-6 sm:p-10"
        >
          {/* Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary/70" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("home.roi_employees_label", { defaultValue: "Funcionários a substituir" })}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <span className="font-display text-lg font-bold text-primary">{employees}</span>
              </div>
            </div>
            <Slider
              value={[employees]}
              onValueChange={([v]) => setEmployees(v)}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-muted-foreground/50">1</span>
              <span className="font-mono text-[10px] text-muted-foreground/50">50</span>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Traditional */}
            <div className="rounded-xl border border-border/50 bg-card/20 p-5 opacity-70">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  {t("home.roi_traditional", { defaultValue: "CONTRATAÇÃO TRADICIONAL" })}
                </span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-muted-foreground line-through mb-1">
                {fmt(data.cltWithOverhead)}<span className="text-sm font-normal">/mês</span>
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/60">
                {t("home.roi_includes_overhead", { defaultValue: "Incl. impostos, benefícios, escritório (~80% encargos)" })}
              </p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("home.roi_base_salary", { defaultValue: "Salário base" })}</span>
                  <span>{fmt(data.cltMonthly)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("home.roi_overhead", { defaultValue: "Encargos (80%)" })}</span>
                  <span>{fmt(data.cltWithOverhead - data.cltMonthly)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("home.roi_annual", { defaultValue: "Custo anual" })}</span>
                  <span>{fmt(data.cltAnnual * 1.8)}</span>
                </div>
              </div>
            </div>

            {/* AI Agents */}
            <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-accent-emerald" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">CLAUTHOR AI</span>
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-primary mb-1">
                {fmt(data.aiMonthly)}<span className="text-sm font-normal text-primary/60">/mês</span>
              </p>
              <p className="font-mono text-[10px] text-primary/60">
                {t("home.roi_ai_desc", { defaultValue: "24/7, sem encargos, escala instantânea" })}
              </p>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("home.roi_per_agent", { defaultValue: "Por agente" })}</span>
                  <span className="text-primary">{fmt(agentCost)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("home.roi_availability", { defaultValue: "Disponibilidade" })}</span>
                  <span className="text-primary">24/7/365</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("home.roi_annual", { defaultValue: "Custo anual" })}</span>
                  <span className="text-primary">{fmt(data.aiAnnual)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Banner */}
          <motion.div
            key={employees}
            initial={{ scale: 0.98, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-5 sm:p-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                {t("home.roi_your_savings", { defaultValue: "SUA ECONOMIA MENSAL" })}
              </span>
            </div>
            <p className="font-display text-3xl sm:text-5xl font-bold gradient-text mb-1">
              {fmt(data.savings)}
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-accent-emerald" />
              <span className="font-mono text-xs text-accent-emerald font-bold">{data.savingsPct}% {t("home.roi_less_cost", { defaultValue: "mais barato" })}</span>
            </div>
            <div className="mt-4">
              <Link to="/waitlist">
                <Button className="glow rounded-xl h-11 px-8 gap-2 font-display font-bold text-xs uppercase tracking-wider">
                  {t("home.roi_cta", { defaultValue: "COMECE A ECONOMIZAR" })}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ROIBenchmark;
