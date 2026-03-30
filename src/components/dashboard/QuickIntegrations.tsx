import { useState } from "react";
import { motion } from "framer-motion";
import { Plug, MessageCircle, Mail, Hash, CheckCircle2, ArrowRight, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  status: "connected" | "available" | "coming_soon";
  setupTime: string;
}

const QuickIntegrations = ({ onSetupCompany }: { onSetupCompany?: () => void }) => {
  const { t } = useTranslation();

  const integrations: Integration[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-emerald-400",
      bg: "from-emerald-500/15 to-emerald-500/5",
      description: t("integrations.whatsapp_desc", { defaultValue: "Atendimento automático 24/7 via WhatsApp Business" }),
      status: "available",
      setupTime: "2min",
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: Mail,
      color: "text-red-400",
      bg: "from-red-500/15 to-red-500/5",
      description: t("integrations.gmail_desc", { defaultValue: "Respostas inteligentes e triagem automática de e-mails" }),
      status: "available",
      setupTime: "1min",
    },
    {
      id: "slack",
      name: "Slack",
      icon: Hash,
      color: "text-purple-400",
      bg: "from-purple-500/15 to-purple-500/5",
      description: t("integrations.slack_desc", { defaultValue: "Notificações e comandos direto no seu workspace" }),
      status: "available",
      setupTime: "1min",
    },
  ];

  const handleConnect = (integration: Integration) => {
    if (integration.status === "coming_soon") {
      toast.info(t("integrations.coming_soon", { defaultValue: "Em breve!" }));
      return;
    }
    toast.success(t("integrations.connecting", { defaultValue: `Configurando ${integration.name}...` }));
    // Navigate to integrations page
    onSetupCompany?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-bold">
            {t("integrations.quick_title", { defaultValue: "Integrações Rápidas" })}
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {t("integrations.one_click", { defaultValue: "1 clique" })}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {integrations.map((integration, i) => {
          const Icon = integration.icon;
          const isConnected = integration.status === "connected";
          const isSoon = integration.status === "coming_soon";

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "rounded-xl border p-4 transition-all group cursor-pointer",
                isConnected
                  ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
                  : isSoon
                  ? "border-border/10 bg-card/20 opacity-50"
                  : "border-border/20 bg-gradient-to-br hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]",
                integration.bg
              )}
              onClick={() => handleConnect(integration)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-background/60 backdrop-blur border border-border/20 flex items-center justify-center">
                  <Icon className={cn("h-5 w-5", integration.color)} />
                </div>
                {isConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    ~{integration.setupTime}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold mb-1">{integration.name}</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{integration.description}</p>
              <Button
                size="sm"
                variant={isConnected ? "outline" : "default"}
                className="w-full h-7 text-[11px] gap-1"
                disabled={isSoon}
              >
                {isConnected ? (
                  <>{t("integrations.manage", { defaultValue: "Gerenciar" })} <ExternalLink className="h-2.5 w-2.5" /></>
                ) : isSoon ? (
                  t("integrations.soon", { defaultValue: "Em breve" })
                ) : (
                  <>{t("integrations.connect", { defaultValue: "Conectar" })} <ArrowRight className="h-3 w-3" /></>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickIntegrations;
