import { motion } from "framer-motion";
import { Building2, Sparkles, ArrowRight, ShieldAlert, Bot } from "lucide-react";
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
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold">
            {t("gate.title", { defaultValue: "Antes de conversar com {{agent}}", agent: agentName })}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {t("gate.description", {
              defaultValue: "Seus agentes precisam conhecer sua empresa para dar respostas realmente úteis. Configure em 30 segundos — cole a URL do seu site e a IA preenche tudo automaticamente."
            })}
          </p>
        </div>

        {/* Warning card */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {t("gate.warning", {
              defaultValue: "Sem informações da empresa, os agentes responderão de forma genérica e não personalizada para o seu negócio."
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onSetupCompany} className="w-full gap-2 glow">
            <Sparkles className="h-4 w-4" />
            {t("gate.setup_button", { defaultValue: "Configurar minha empresa" })}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full text-xs text-muted-foreground hover:text-foreground">
            {t("gate.skip", { defaultValue: "Conversar mesmo assim (respostas genéricas)" })}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
