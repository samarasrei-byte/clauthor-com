import { motion } from "framer-motion";
import { Building2, Sparkles, ArrowRight, Clock, Bot, Globe, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface CompanyBoardGateProps {
  agentName: string;
  onSetupCompany: () => void;
  onSkip: () => void;
}

/**
 * Gate shown when a user tries to chat with an agent but hasn't set up Company Board.
 * Prevents generic/empty responses by requiring company context first.
 */
export default function CompanyBoardGate({ agentName, onSetupCompany, onSkip }: CompanyBoardGateProps) {
  const { t } = useTranslation();

  const methods = [
    {
      icon: Globe,
      title: t("gate.method_url", { defaultValue: "Cole a URL do site" }),
      desc: t("gate.method_url_desc", { defaultValue: "A IA extrai tudo automaticamente" }),
      time: "~30s",
    },
    {
      icon: ClipboardPaste,
      title: t("gate.method_paste", { defaultValue: "Cole um texto" }),
      desc: t("gate.method_paste_desc", { defaultValue: "Sobre sua empresa ou serviço" }),
      time: "~1min",
    },
  ];

  return (
    <div className="h-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Icon cluster */}
        <div className="flex justify-center">
          <div className="relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center"
            >
              <Building2 className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-accent-emerald/15 border border-accent-emerald/20 flex items-center justify-center"
            >
              <Bot className="h-3.5 w-3.5 text-accent-emerald" />
            </motion.div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold">
            {t("gate.title_enhanced", { defaultValue: "Personalize {{agent}} para seu negócio", agent: agentName })}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {t("gate.description_enhanced", {
              defaultValue: "Com informações da sua empresa, os agentes dão respostas 10x mais relevantes e específicas."
            })}
          </p>
        </div>

        {/* Methods preview */}
        <div className="grid grid-cols-2 gap-2">
          {methods.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-3 rounded-xl bg-muted/30 border border-border/30 text-center space-y-1.5"
            >
              <m.icon className="h-4 w-4 text-primary/70 mx-auto" strokeWidth={1.5} />
              <p className="text-xs font-medium text-foreground">{m.title}</p>
              <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">{m.time}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onSetupCompany} className="w-full h-11 gap-2 glow rounded-xl">
            <Sparkles className="h-4 w-4" />
            {t("gate.setup_button", { defaultValue: "Configurar minha empresa" })}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full text-xs text-muted-foreground hover:text-foreground">
            {t("gate.skip_enhanced", { defaultValue: "Pular por agora — configurar depois" })}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
