import { Activity, Bot, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface LogsSectionProps {
  recentLogs: any[];
  locale: string;
  onGoToAgents?: () => void;
}

const LogsSection = ({ recentLogs, locale, onGoToAgents }: LogsSectionProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");

  const filteredLogs = recentLogs.filter(l => filter === "all" || l.status === filter);

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "error") return <Activity className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{t("dashboard.execution_logs")} ({recentLogs.length})</h2>
        <div className="flex items-center gap-1.5">
          {(["all", "success", "error"] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              className="text-xs h-7"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t("dashboard.filter_all", { defaultValue: "Todos" })
                : f === "success" ? t("dashboard.filter_success", { defaultValue: "Sucesso" })
                : t("dashboard.filter_error", { defaultValue: "Erro" })}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">{t("dashboard.no_logs_found")}</p>
            <p className="text-xs text-muted-foreground/60">
              {t("dashboard.logs_hint", { defaultValue: "Os logs aparecerão aqui quando seus agentes começarem a executar ações." })}
            </p>
            {onGoToAgents && (
              <Button variant="outline" size="sm" onClick={onGoToAgents} className="mt-2 gap-1.5">
                <Bot className="h-3.5 w-3.5" /> {t("dashboard.view_agents", { defaultValue: "Ver Agentes" })}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="text-sm font-medium">{log.agent_name}</p>
                    <p className="text-xs text-muted-foreground">{log.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className={`text-[10px] ${log.status === "success" ? "bg-emerald-500/10 text-emerald-500" : log.status === "error" ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {log.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsSection;
