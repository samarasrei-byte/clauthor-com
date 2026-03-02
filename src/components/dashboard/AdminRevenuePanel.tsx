import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface AdminRevenuePanelProps {
  revenueData: { name: string; receita: number }[];
  totalRevenue: number;
  allSubscriptions: any[];
  locale: string;
}

export default function AdminRevenuePanel({ revenueData, totalRevenue, allSubscriptions, locale }: AdminRevenuePanelProps) {
  const { t } = useTranslation();
  const fmt = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(v);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-background/40 backdrop-blur-xl border border-white/[0.08]">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> {t("dashboard.revenue_evolution", { defaultValue: "Evolução da Receita" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
        <CardHeader><CardTitle className="font-display text-lg">{t("dashboard.summary", { defaultValue: "Resumo" })}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">MRR</p>
            <p className="font-display text-2xl font-bold gradient-text">{fmt(totalRevenue / 100)}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">ARR</p>
            <p className="font-display text-2xl font-bold">{fmt((totalRevenue * 12) / 100)}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("dashboard.active_subscriptions", { defaultValue: "Assinaturas Ativas" })}</p>
            <p className="font-display text-2xl font-bold">{allSubscriptions.length}</p>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("dashboard.avg_ticket", { defaultValue: "Ticket Médio" })}</p>
            <p className="font-display text-2xl font-bold">{allSubscriptions.length > 0 ? fmt((totalRevenue / allSubscriptions.length) / 100) : fmt(0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
