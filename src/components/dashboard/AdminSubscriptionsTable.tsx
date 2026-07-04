import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { useTranslation } from "react-i18next";

interface AdminSubscriptionsTableProps {
  allSubscriptions: any[];
  locale: string;
}

export default function AdminSubscriptionsTable({ allSubscriptions, locale }: AdminSubscriptionsTableProps) {
  const { t } = useTranslation();
  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(v);

  return (
    <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> {t("dashboard.active_subscriptions", { defaultValue: "Assinaturas Ativas" })} ({allSubscriptions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allSubscriptions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">{t("dashboard.no_subscriptions", { defaultValue: "Nenhuma assinatura ativa." })}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.agent", { defaultValue: "Agente" })}</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.value", { defaultValue: "Valor" })}</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.period", { defaultValue: "Período" })}</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {allSubscriptions.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                    <td className="p-3 font-medium">{sub.agent?.name || (sub.agent_id ? sub.agent_id.slice(0, 8) : "-")}</td>
                    <td className="p-3">{fmt(sub.monthly_price / 100)}/{locale.startsWith("pt") ? "mês" : "mo"}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString(locale) : "-"} → {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString(locale) : "-"}
                    </td>
                    <td className="p-3"><Badge variant="secondary" className="bg-primary/20 text-primary">{sub.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
