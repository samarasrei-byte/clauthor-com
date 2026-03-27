import { lazy, Suspense } from "react";
import { Coins, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import TokenUpgradeDialog from "./TokenUpgradeDialog";
import SectionLoader from "@/components/ui/section-loader";

const PaymentHistoryTable = lazy(() => import("./PaymentHistoryTable"));

interface Props {
  credits: any;
  usagePercentage: number;
  remainingCredits: number;
  subscriptions: { id: string; agent_name: string; monthly_price: number; status: string }[];
  locale: string;
  formatCurrency: (v: number) => string;
}

const SettingsBillingContent = ({ credits, usagePercentage, remainingCredits, subscriptions, locale, formatCurrency }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">{t("dashboard.subscription_credits")}</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">{t("dashboard.credits_label")}</h3>
            <Badge variant="secondary">{credits?.plan_type || "free"}</Badge>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{credits?.used_credits?.toLocaleString(locale) || 0} {t("dashboard.used_label")}</span>
              <span>{credits?.total_credits?.toLocaleString(locale) || 0} {t("dashboard.total_label")}</span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">{t("dashboard.pct_remaining", { pct: 100 - usagePercentage })}</p>
          </div>
          <TokenUpgradeDialog trigger={<Button className="w-full glow">{t("dashboard.token_upgrade")} <ArrowRight className="h-4 w-4 ml-2" /></Button>} />
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">{t("dashboard.active_subscriptions")}</h3>
          </div>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.no_subscriptions")}</p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">{sub.agent_name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(sub.monthly_price)}/{t("dashboard.per_month_short", { defaultValue: "mo" })}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border/10 flex justify-between">
                <span className="text-sm font-medium">{t("dashboard.monthly_total")}</span>
                <span className="font-display font-bold gradient-text">{formatCurrency(subscriptions.reduce((a, s) => a + s.monthly_price, 0))}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <Suspense fallback={<SectionLoader />}><PaymentHistoryTable /></Suspense>
    </div>
  );
};

export default SettingsBillingContent;
