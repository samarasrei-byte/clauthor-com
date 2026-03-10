import { motion } from "framer-motion";
import { CreditCard, Calendar, Receipt, ArrowUpRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCredits } from "@/hooks/useCredits";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import { useTranslation } from "react-i18next";

interface Subscription {
  id: string;
  agent_name: string;
  monthly_price: number;
  status: string;
  current_period_end: string | null;
}

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
}

const SubscriptionManager = ({ subscriptions }: SubscriptionManagerProps) => {
  const { credits, usagePercentage } = useCredits();
  const { i18n, t } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : (i18n.language || "en");
  const currency = locale.startsWith("pt") ? "BRL" : "USD";
  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(v / 100);

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.monthly_price, 0);
  const nextBilling = subscriptions[0]?.current_period_end
    ? new Date(subscriptions[0].current_period_end)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">{t("subscription.title", { defaultValue: "Subscription & Credits" })}</h2>
            <p className="text-xs text-muted-foreground">{t("subscription.subtitle", { defaultValue: "Manage your plan" })}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Credit Usage */}
        <div className="bg-white/[0.02] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t("subscription.credit_usage", { defaultValue: "Credit Usage" })}</span>
            <span className="text-xs text-muted-foreground">
              {credits?.used_credits?.toLocaleString(locale) || 0} / {credits?.total_credits?.toLocaleString(locale) || 0}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {100 - usagePercentage}% {t("subscription.remaining", { defaultValue: "remaining this month" })}
          </p>
        </div>

        {/* Billing Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("subscription.monthly_total", { defaultValue: "Monthly Total" })}</span>
            </div>
            <p className="font-display text-xl font-bold">
              {fmt(totalMonthly)}
            </p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("subscription.next_billing", { defaultValue: "Next Billing" })}</span>
            </div>
            <p className="font-display text-xl font-bold">
              {nextBilling
                ? nextBilling.toLocaleDateString(locale, { day: "2-digit", month: "short" })
                : "—"}
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("subscription.active", { defaultValue: "Active Subscriptions" })}</h3>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("subscription.none", { defaultValue: "No active subscriptions" })}
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">{sub.agent_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {fmt(sub.monthly_price)}/{t("dashboard.month_short", { defaultValue: "mês" })}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px]">
                      Ativo
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="pt-4 border-t border-white/5">
          <h3 className="text-sm font-medium mb-3">Método de Pagamento</h3>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
            <Globe className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">PayPal</p>
              <p className="text-[10px] text-muted-foreground">Cobrança recorrente mensal</p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-blue-500/10 text-blue-400 text-[10px]">
              Ativo
            </Badge>
          </div>
        </div>

        {/* Upgrade Button */}
        <TokenUpgradeDialog trigger={
          <Button className="w-full glow group">
            Upgrade de Plano
            <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        } />
      </div>
    </motion.div>
  );
};

export default SubscriptionManager;
