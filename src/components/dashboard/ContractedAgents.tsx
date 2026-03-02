import { motion } from "framer-motion";
import { Bot, MessageSquare, Sparkles, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ContractedAgent {
  id: string;
  agent_name: string;
  monthly_price: number;
  status: string;
  current_period_end: string | null;
}

interface ContractedAgentsProps {
  subscriptions: ContractedAgent[];
  onSelectAgent?: (agentId: string, agentName: string) => void;
}

const ContractedAgents = ({ subscriptions, onSelectAgent }: ContractedAgentsProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-display font-semibold">{t("dashboard.contracted_agents", { defaultValue: "Agentes Contratados" })}</h2>
            <p className="text-xs text-muted-foreground">
              {subscriptions.length} {t("dashboard.active_count", { defaultValue: "ativo", count: subscriptions.length })}{subscriptions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link to="/library">
          <Button size="sm" variant="outline" className="gap-1 border-white/10">
            <ShoppingCart className="h-3.5 w-3.5" />
            {t("dashboard.hire", { defaultValue: "Contratar" })}
          </Button>
        </Link>
      </div>

      <div className="p-4">
        {subscriptions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display font-semibold mb-1 text-sm">{t("dashboard.no_contracted", { defaultValue: "Nenhum agente contratado" })}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("dashboard.explore_hire_cta", { defaultValue: "Explore nossa biblioteca e contrate seu primeiro funcionário de IA" })}
            </p>
            <Link to="/library">
              <Button size="sm" className="glow">
                {t("dashboard.view_available", { defaultValue: "Ver Agentes Disponíveis" })}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="font-medium text-sm">{sub.agent_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500">
                        {t("dashboard.active_label", { defaultValue: "Ativo" })}
                      </Badge>
                      {sub.current_period_end && (
                        <span className="text-[10px] text-muted-foreground">
                          {t("dashboard.until", { defaultValue: "até" })} {new Date(sub.current_period_end).toLocaleDateString(locale, { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(sub.monthly_price / 100)}
                    <span className="text-xs text-muted-foreground">/{t("dashboard.month_short", { defaultValue: "mês" })}</span>
                  </p>
                  {onSelectAgent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onSelectAgent(sub.id, sub.agent_name)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContractedAgents;
