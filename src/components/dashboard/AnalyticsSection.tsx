import { BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface AnalyticsSectionProps {
  chartData: { name: string; execucoes: number; sucesso: number }[];
  totalExecutions: number;
  recentLogs: any[];
  locale: string;
  onGoToAgents?: () => void;
}

const AnalyticsSection = ({ chartData, totalExecutions, recentLogs, locale, onGoToAgents }: AnalyticsSectionProps) => {
  const { t } = useTranslation();
  const hasData = chartData.some(d => d.execucoes > 0);

  return (
    <div className="space-y-6">
      
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">{t("dashboard.exec_vs_success")}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-primary" /><span className="text-xs text-muted-foreground">{t("dashboard.executions")}</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-accent-emerald" /><span className="text-xs text-muted-foreground">{t("dashboard.success_rate_short")}</span></div>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-primary/20 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.no_analytics_data", { defaultValue: "Nenhum dado de execução ainda" })}</p>
            <p className="text-xs text-muted-foreground/60 mb-4">{t("dashboard.analytics_hint", { defaultValue: "Os gráficos aparecerão quando seus agentes começarem a trabalhar." })}</p>
            {onGoToAgents && (
              <Button variant="outline" size="sm" onClick={onGoToAgents} className="gap-1.5 text-xs">
                {t("dashboard.view_agents", { defaultValue: "Ver Agentes" })}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cSucc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                  <Area type="monotone" dataKey="execucoes" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#cExec)" />
                  <Area type="monotone" dataKey="sucesso" stroke="hsl(var(--accent-emerald))" strokeWidth={2} fillOpacity={1} fill="url(#cSucc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-card/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("dashboard.this_month")}</p>
                <p className="font-display text-xl font-bold">{totalExecutions.toLocaleString(locale)}</p>
                <p className="text-xs text-primary">{t("dashboard.executions")}</p>
              </div>
              <div className="bg-card/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("dashboard.avg_rate")}</p>
                <p className="font-display text-xl font-bold">{recentLogs.length > 0 ? Math.round((recentLogs.filter((l: any) => l.status === "success").length / recentLogs.length) * 100) : 100}%</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.of_success")}</p>
              </div>
              <div className="bg-card/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{t("dashboard.avg_time")}</p>
                <p className="font-display text-xl font-bold">{recentLogs.length > 0 ? (recentLogs.reduce((a: number, l: any) => a + (l.execution_time_ms || 0), 0) / recentLogs.length / 1000).toFixed(1) : "0"}s</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.per_execution")}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSection;
