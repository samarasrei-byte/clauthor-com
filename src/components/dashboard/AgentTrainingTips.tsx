import { motion } from "framer-motion";
import { BookOpen, Database, MessageSquareText, Brain, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface AgentTrainingTipsProps {
  onNavigate?: (section: string) => void;
}

const AgentTrainingTips = ({ onNavigate }: AgentTrainingTipsProps) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("clauthor_training_tips_dismissed") === "true";
  });

  if (dismissed) return null;

  const tips = [
    {
      icon: Database,
      title: t("training.tip1_title", { defaultValue: "Preencha o Company Board" }),
      description: t("training.tip1_desc", { defaultValue: "Adicione produtos, FAQ, processos e tom de voz da sua empresa. Quanto mais informação, mais inteligente o agente." }),
      action: t("training.tip1_action", { defaultValue: "Abrir Board" }),
      route: "board",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: MessageSquareText,
      title: t("training.tip2_title", { defaultValue: "Escreva boas instruções" }),
      description: t("training.tip2_desc", { defaultValue: "Cada agente tem um campo 'Instruções'. Defina regras, limites e comportamentos. Ex: 'Nunca dê desconto acima de 10%.'" }),
      action: t("training.tip2_action", { defaultValue: "Ver agentes" }),
      route: "agents",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Brain,
      title: t("training.tip3_title", { defaultValue: "Converse para ele aprender" }),
      description: t("training.tip3_desc", { defaultValue: "A cada conversa, o agente salva um resumo na memória. Com o tempo, ele aprende padrões e melhora as respostas automaticamente." }),
      action: t("training.tip3_action", { defaultValue: "Abrir chat" }),
      route: "chat",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 space-y-4 border border-primary/10 relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">
              {t("training.title", { defaultValue: "Como treinar seus agentes" })}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {t("training.subtitle", { defaultValue: "Sem código, sem datasets - apenas informação da sua empresa" })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] h-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("clauthor_training_tips_dismissed", "true");
          }}
        >
          {t("training.dismiss", { defaultValue: "Entendi" })}
        </Button>
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-3 gap-3 relative">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border/20 bg-white/[0.02] p-4 space-y-3 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${tip.bgColor} flex items-center justify-center`}>
                <tip.icon className={`h-4 w-4 ${tip.color}`} />
              </div>
              <span className="text-[11px] font-semibold text-foreground">{tip.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {tip.description}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[10px] text-primary hover:text-primary hover:bg-primary/5 gap-1"
              onClick={() => onNavigate?.(tip.route)}
            >
              {tip.action} <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2 relative">
        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {t("training.footer_bold", { defaultValue: "Dica:" })}
          </span>{" "}
          {t("training.footer_text", { defaultValue: "Preencher o Company Board é como fazer o onboarding de um funcionário. Quanto mais contexto, melhor o desempenho do agente." })}
        </p>
      </div>
    </motion.div>
  );
};

export default AgentTrainingTips;
