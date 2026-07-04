import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageSquare, Settings, Bot, ArrowRight, X, Building2 } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface Step {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  action?: string;
  actionRoute?: string;
}

interface GettingStartedGuideProps {
  hasAgents: boolean;
  hasSentMessage: boolean;
  hasConfiguredAgent: boolean;
  onNavigate?: (section: string) => void;
  onDismiss?: () => void;
}

const GettingStartedGuide = ({
  hasAgents,
  hasSentMessage,
  hasConfiguredAgent,
  onNavigate,
  onDismiss,
}: GettingStartedGuideProps) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("clauthor_guide_dismissed");
    if (stored === "true") setDismissed(true);
  }, []);

  const steps: Step[] = [
    {
      id: "company",
      icon: Building2,
      label: t("dashboard.guide_step0", { defaultValue: "Configure sua empresa" }),
      description: t("dashboard.guide_step0_desc", { defaultValue: "Seus agentes dão respostas 10x melhores com contexto." }),
      action: t("dashboard.guide_step0_action", { defaultValue: "Configurar" }),
      actionRoute: "company",
    },
    {
      id: "agents",
      icon: Bot,
      label: t("dashboard.guide_step1", { defaultValue: "Conheça seus agentes" }),
      description: t("dashboard.guide_step1_desc", { defaultValue: "Veja quais agentes estão ativos e o que cada um faz." }),
      action: t("dashboard.guide_step1_action", { defaultValue: "Ver agentes" }),
      actionRoute: "agents",
    },
    {
      id: "message",
      icon: MessageSquare,
      label: t("dashboard.guide_step2", { defaultValue: "Envie sua primeira mensagem" }),
      description: t("dashboard.guide_step2_desc", { defaultValue: "Converse com um agente e veja a IA em ação." }),
      action: t("dashboard.guide_step2_action", { defaultValue: "Abrir chat" }),
      actionRoute: "omnix",
    },
    {
      id: "configure",
      icon: Settings,
      label: t("dashboard.guide_step3", { defaultValue: "Configure integrações" }),
      description: t("dashboard.guide_step3_desc", { defaultValue: "Conecte canais e personalize as instruções do agente." }),
      action: t("dashboard.guide_step3_action", { defaultValue: "Configurar" }),
      actionRoute: "settings",
    },
  ];

  // Company step counts as the first one (always true if they have agents)
  const completionFlags = [true, hasAgents, hasSentMessage, hasConfiguredAgent];
  const completedSteps = completionFlags.filter(Boolean).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const isComplete = completedSteps === steps.length;

  if (dismissed || isComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("clauthor_guide_dismissed", "true");
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-2xl p-5 border border-primary/10 bg-gradient-to-r from-primary/[0.03] to-transparent relative overflow-hidden"
    >
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {t("dashboard.guide_title", { defaultValue: "Primeiros passos" })}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {completedSteps}/{steps.length} {t("dashboard.guide_completed", { defaultValue: "concluídos" })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5 mb-4" />

      <div className="space-y-2">
        {steps.map((step, i) => {
          const completed = completionFlags[i];
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                completed
                  ? "bg-accent-emerald/5 border border-accent-emerald/10"
                  : "bg-muted/20 border border-border/30 hover:bg-muted/40 cursor-pointer"
              }`}
              onClick={() => !completed && step.actionRoute && onNavigate?.(step.actionRoute)}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                completed ? "bg-accent-emerald/15" : "bg-muted/50"
              }`}>
                {completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" />
                ) : (
                  <step.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${completed ? "text-accent-emerald line-through opacity-70" : ""}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
              </div>
              {!completed && step.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-6 px-2 text-primary shrink-0 gap-1"
                  onClick={(e) => { e.stopPropagation(); onNavigate?.(step.actionRoute || ""); }}
                >
                  {step.action}
                  <ArrowRight className="h-2.5 w-2.5" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GettingStartedGuide;
