import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Brain, Bot, Zap, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface QuickStartWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onTeach: () => void;
  onHire: () => void;
  onCommand: () => void;
}

const QuickStartWizard = ({ isOpen, onClose, onTeach, onHire, onCommand }: QuickStartWizardProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: Brain,
      title: t("quickstart.step1_title", { defaultValue: "Ensine sua empresa" }),
      desc: t("quickstart.step1_desc", { defaultValue: "Cole a URL do seu site ou descreva seu negócio em uma frase. Seus agentes usarão isso como contexto." }),
      time: "15s",
      color: "from-blue-500/20 to-cyan-500/10",
      action: () => { onTeach(); onClose(); },
      cta: t("quickstart.step1_cta", { defaultValue: "Ensinar agora" }),
    },
    {
      icon: Bot,
      title: t("quickstart.step2_title", { defaultValue: "Contrate seu 1º agente" }),
      desc: t("quickstart.step2_desc", { defaultValue: "Escolha um agente pronto - SDR, Copywriter ou Analista. Ele já vem configurado e treinado." }),
      time: "20s",
      color: "from-primary/20 to-accent/10",
      action: () => { onHire(); onClose(); },
      cta: t("quickstart.step2_cta", { defaultValue: "Ir à Biblioteca" }),
    },
    {
      icon: Zap,
      title: t("quickstart.step3_title", { defaultValue: "Dê a primeira missão" }),
      desc: t("quickstart.step3_desc", { defaultValue: "Envie um comando simples como 'Crie 3 posts para Instagram sobre meu produto'. Veja a mágica acontecer." }),
      time: "25s",
      color: "from-emerald-500/20 to-green-500/10",
      action: () => { onCommand(); onClose(); },
      cta: t("quickstart.step3_cta", { defaultValue: "Comandar agente" }),
    },
  ];

  const progress = Math.round(((step + 1) / steps.length) * 100);
  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-primary/20">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-sm">
                {t("quickstart.title", { defaultValue: "Ativar em 60 segundos" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              ~{current.time}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
          <div className="flex gap-1 mt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            <div className={cn("rounded-xl bg-gradient-to-br p-5 mb-4", current.color)}>
              <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur border border-border/30 flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} className="flex-1">
                  {t("quickstart.back", { defaultValue: "Voltar" })}
                </Button>
              )}
              <Button size="sm" className="flex-1 gap-1.5" onClick={current.action}>
                {current.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {step < steps.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground mt-3 transition-colors"
              >
                {t("quickstart.skip", { defaultValue: "Pular para o próximo →" })}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default QuickStartWizard;
