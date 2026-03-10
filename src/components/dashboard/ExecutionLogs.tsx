import { motion } from "framer-motion";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ExecutionLog {
  id: string;
  agent_name: string;
  action: string;
  status: string;
  execution_time_ms: number | null;
  created_at: string;
  details?: any;
}

interface ExecutionLogsProps {
  logs: ExecutionLog[];
  isLoading?: boolean;
}

const ExecutionLogs = ({ logs, isLoading }: ExecutionLogsProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-primary/10 text-primary";
      case "error":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return t("dashboard.filter_success", { defaultValue: "Sucesso" });
      case "error":
        return t("dashboard.filter_error", { defaultValue: "Erro" });
      default:
        return t("logs.pending", { defaultValue: "Pendente" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-border/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold">{t("dashboard.execution_logs", { defaultValue: "Logs de Execução" })}</h2>
            <p className="text-xs text-muted-foreground">{filteredLogs.length} {t("logs.records", { defaultValue: "registros" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs"
          >
            {t("dashboard.filter_all", { defaultValue: "Todos" })}
          </Button>
          <Button
            variant={filter === "success" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("success")}
            className="text-xs"
          >
            {t("dashboard.filter_success", { defaultValue: "Sucesso" })}
          </Button>
          <Button
            variant={filter === "error" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("error")}
            className="text-xs"
          >
            {t("dashboard.filter_error", { defaultValue: "Erro" })}
          </Button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            {t("logs.loading", { defaultValue: "Carregando logs..." })}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t("dashboard.no_logs_found", { defaultValue: "Nenhum log encontrado" })}
          </div>
        ) : (
          <div className="divide-y divide-border/10">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium text-sm">{log.agent_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.action}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${getStatusBadge(log.status)}`}
                    >
                      {getStatusLabel(log.status)}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {log.execution_time_ms && (
                      <p className="text-[10px] text-muted-foreground">
                        {log.execution_time_ms}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ExecutionLogs;
