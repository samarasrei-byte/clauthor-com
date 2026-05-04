import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ShoppingBag, Zap, ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface GuidedOnboardingProps {
  hasCompanyData: boolean;
  hasAgents: boolean;
  hasSentCommand: boolean;
  onTeach: () => void;
  onHire: () => void;
  onCommand: () => void;
  onDismiss: () => void;
}

const GuidedOnboarding = ({
  hasCompanyData,
  hasAgents,
  hasSentCommand,
  onTeach,
  onHire,
  onCommand,
  onDismiss,
}: GuidedOnboardingProps) => {
  const { t } = useTranslation();
  const completionFlags = [hasCompanyData, hasAgents, hasSentCommand];
  const completedSteps = completionFlags.filter(Boolean).length;

  const steps = [
    {
      id: "teach",
      number: 1,
      icon: Brain,
      title: t("onboarding.step_teach", { defaultValue: "Ensinar" }),
      subtitle: t("onboarding.step_teach_sub", { defaultValue: "Ensine sobre sua empresa" }),
      desc: t("onboarding.step_teach_desc", { defaultValue: "Seus agentes precisam conhecer seu negócio. Cole a URL do site ou envie documentos para dar contexto real." }),
      cta: t("onboarding.step_teach_cta", { defaultValue: "Ensinar agora" }),
    },
    {
      id: "hire",
      number: 2,
      icon: ShoppingBag,
      title: t("onboarding.step_hire", { defaultValue: "Contratar" }),
      subtitle: t("onboarding.step_hire_sub", { defaultValue: "Monte seu time de IA" }),
      desc: t("onboarding.step_hire_desc", { defaultValue: "Escolha agentes especializados na Biblioteca - SDR, Copywriter, Analista, ou squads completos por departamento." }),
      cta: t("onboarding.step_hire_cta", { defaultValue: "Ir à Biblioteca" }),
    },
    {
      id: "command",
      number: 3,
      icon: Zap,
      title: t("onboarding.step_command", { defaultValue: "Comandar" }),
      subtitle: t("onboarding.step_command_sub", { defaultValue: "Dê a primeira missão" }),
      desc: t("onboarding.step_command_desc", { defaultValue: "Use o Command Center para dar tarefas aos agentes. Eles executam, reportam e aprendem com cada interação." }),
      cta: t("onboarding.step_command_cta", { defaultValue: "Abrir Command Center" }),
    },
  ];

  const progress = Math.round((completedSteps / steps.length) * 100);
  const isComplete = completedSteps === steps.length;

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("clauthor_guided_onboarding_dismissed");
    if (stored === "true") setDismissed(true);
  }, []);

  if (dismissed || isComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("clauthor_guided_onboarding_dismissed", "true");
    onDismiss();
  };

  const actions = [onTeach, onHire, onCommand];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent p-5"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold">{t("onboarding.steps_title", { defaultValue: "3 passos para começar" })}</h3>
            <p className="text-[10px] text-muted-foreground">
              {completedSteps}/{steps.length} {t("onboarding.completed", { defaultValue: "concluídos" })} • {isComplete ? `🎉 ${t("onboarding.ready", { defaultValue: "Pronto!" })}` : t("onboarding.continue", { defaultValue: "Continue de onde parou" })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5 mb-5" />

      {/* Steps */}
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, i) => {
          const completed = completionFlags[i];
          const isNext = !completed && completionFlags.slice(0, i).every(Boolean);
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative rounded-xl border p-4 transition-all",
                completed
                  ? "bg-primary/5 border-primary/20"
                  : isNext
                  ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.12)]"
                  : "bg-card/20 border-border/20 opacity-50"
              )}
            >
              {/* Step number */}
              <div className="absolute -top-2.5 -left-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  completed ? "bg-primary text-primary-foreground" : isNext ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.number}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", completed ? "text-primary" : isNext ? "text-foreground" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-bold", completed && "line-through text-primary/70")}>{step.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                
                {!completed && isNext && (
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 mt-1"
                    onClick={actions[i]}
                  >
                    {step.cta} <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                )}
                {completed && (
                  <div className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t("onboarding.done", { defaultValue: "Concluído" })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GuidedOnboarding;
