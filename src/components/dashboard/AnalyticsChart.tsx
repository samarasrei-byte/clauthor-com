import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

const mockData = [
  { name: "Jan", execucoes: 400, sucesso: 380 },
  { name: "Fev", execucoes: 600, sucesso: 580 },
  { name: "Mar", execucoes: 800, sucesso: 770 },
  { name: "Abr", execucoes: 1200, sucesso: 1150 },
  { name: "Mai", execucoes: 1500, sucesso: 1460 },
  { name: "Jun", execucoes: 1800, sucesso: 1750 },
];

const AnalyticsChart = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-border/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">{t("dashboard.analytics", { defaultValue: "Analytics" })}</h2>
            <p className="text-xs text-muted-foreground">{t("dashboard.last_6_months", { defaultValue: "Últimos 6 meses" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">{t("dashboard.executions", { defaultValue: "Execuções" })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-accent-emerald" />
            <span className="text-xs text-muted-foreground">{t("dashboard.success_rate_short", { defaultValue: "Sucesso" })}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id="colorExecucoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSucesso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="execucoes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExecucoes)"
              />
              <Area
                type="monotone"
                dataKey="sucesso"
                stroke="hsl(var(--accent-emerald))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSucesso)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-card/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t("dashboard.this_month", { defaultValue: "Este mês" })}</span>
            </div>
            <p className="font-display text-xl font-bold">1,800</p>
            <p className="text-xs text-primary">+20% {t("dashboard.vs_last_month", { defaultValue: "vs mês anterior" })}</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">{t("dashboard.avg_rate", { defaultValue: "Taxa Média" })}</span>
            </div>
            <p className="font-display text-xl font-bold">97.2%</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.of_success", { defaultValue: "de sucesso" })}</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">{t("dashboard.avg_time", { defaultValue: "Tempo Médio" })}</span>
            </div>
            <p className="font-display text-xl font-bold">1.2s</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.per_execution", { defaultValue: "por execução" })}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsChart;
