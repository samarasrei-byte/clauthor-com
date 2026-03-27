import { motion } from "framer-motion";
import { Check, X, Crown, Bot, Workflow, Shield, BarChart3, MessageSquare, KanbanSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

const CompetitiveMoat = () => {
  const { t } = useTranslation();

  const features = [
    { label: t("home.moat_orchestration", { defaultValue: "Orquestração Agente-a-Agente" }), icon: Workflow, clauthor: true, chatgpt: false, crewai: "partial", autogen: "partial" },
    { label: t("home.moat_departments", { defaultValue: "Departamentos Corporativos (7)" }), icon: BarChart3, clauthor: true, chatgpt: false, crewai: false, autogen: false },
    { label: t("home.moat_squads", { defaultValue: "Squads Inteligentes (37)" }), icon: Bot, clauthor: true, chatgpt: false, crewai: "partial", autogen: false },
    { label: t("home.moat_kanban", { defaultValue: "Mission Board Integrado" }), icon: KanbanSquare, clauthor: true, chatgpt: false, crewai: false, autogen: false },
    { label: t("home.moat_meeting", { defaultValue: "Sala de Reunião IA" }), icon: MessageSquare, clauthor: true, chatgpt: false, crewai: false, autogen: false },
    { label: t("home.moat_security", { defaultValue: "Segurança Enterprise & RLS" }), icon: Shield, clauthor: true, chatgpt: false, crewai: false, autogen: false },
    { label: t("home.moat_cfo", { defaultValue: "Agente CFO com Dados em Tempo Real" }), icon: BarChart3, clauthor: true, chatgpt: false, crewai: false, autogen: false },
    { label: t("home.moat_event", { defaultValue: "Event-Driven (margem de 96%)" }), icon: Crown, clauthor: true, chatgpt: false, crewai: false, autogen: "partial" },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) return <Check className="h-4 w-4 text-accent-emerald mx-auto" />;
    if (value === "partial") return <span className="font-mono text-[10px] text-amber-400 mx-auto block text-center">~</span>;
    return <X className="h-3.5 w-3.5 text-destructive/40 mx-auto" />;
  };

  return (
    <section className="py-16 sm:py-24 px-4 relative border-y border-border/30" aria-label="Competitive comparison">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            <span className="font-mono text-[11px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/60">
              {t("home.moat_badge", { defaultValue: "POR QUE SOMOS DIFERENTES" })}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-center">
            {t("home.moat_title", { defaultValue: "Não é só mais uma ferramenta de IA." })}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-3 max-w-xl mx-auto">
            {t("home.moat_subtitle", { defaultValue: "Clauthor é um Sistema Operacional de IA completo. Veja como nos comparamos." })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-5 gap-0 border-b border-border/50">
            <div className="p-4 sm:p-5 col-span-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">{t("home.moat_feature", { defaultValue: "RECURSO" })}</span>
            </div>
            <div className="p-3 sm:p-5 text-center border-l border-border/30 bg-primary/[0.04]">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Crown className="h-3 w-3 text-primary" />
              </div>
              <span className="font-display text-[10px] sm:text-xs font-bold text-primary">CLAUTHOR</span>
            </div>
            <div className="p-3 sm:p-5 text-center border-l border-border/30">
              <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/60">ChatGPT</span>
            </div>
            <div className="p-3 sm:p-5 text-center border-l border-border/30">
              <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/60">CrewAI</span>
            </div>
            <div className="p-3 sm:p-5 text-center border-l border-border/30">
              <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground/60">AutoGen</span>
            </div>
          </div>

          {/* Rows */}
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-5 gap-0 border-b border-border/20 last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/5"}`}
            >
              <div className="p-3 sm:p-4 col-span-1 flex items-center gap-2">
                <f.icon className="h-3.5 w-3.5 text-primary/50 shrink-0 hidden sm:block" />
                <span className="font-mono text-[10px] sm:text-xs text-muted-foreground leading-tight">{f.label}</span>
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-border/30 bg-primary/[0.02]">{renderCell(f.clauthor)}</div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-border/30">{renderCell(f.chatgpt)}</div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-border/30">{renderCell(f.crewai)}</div>
              <div className="p-3 sm:p-4 flex items-center justify-center border-l border-border/30">{renderCell(f.autogen)}</div>
            </motion.div>
          ))}
        </motion.div>

        <p className="font-mono text-[9px] text-muted-foreground/30 text-center mt-4 uppercase tracking-wider">
          {t("home.moat_disclaimer", { defaultValue: "* Comparação baseada em funcionalidades públicas disponíveis em março de 2026." })}
        </p>
      </div>
    </section>
  );
};

export default CompetitiveMoat;
