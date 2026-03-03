import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Filter, AlertTriangle, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface LogEntry {
  id: string;
  agent_name?: string;
  action?: string;
  status: string;
  execution_time_ms?: number;
  created_at: string;
}

interface SmartActivityFeedProps {
  logs: LogEntry[];
  agents: { id: string; name: string }[];
}

const SmartActivityFeed = ({ logs, agents }: SmartActivityFeedProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt" ? "pt-BR" : i18n.language;
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState(false);

  const filtered = logs.filter((log) => {
    if (filter !== "all" && log.status !== filter) return false;
    if (agentFilter !== "all" && log.agent_name !== agentFilter) return false;
    return true;
  });

  const needsAttention = filtered.filter((l) => l.status === "error");
  const displayLogs = expanded ? filtered.slice(0, 20) : filtered.slice(0, 6);

  // Group by relative time
  const groupByTime = (log: LogEntry) => {
    const diff = Date.now() - new Date(log.created_at).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return t("dashboard.feed_now", { defaultValue: "Agora" });
    if (hours < 24) return t("dashboard.feed_today", { defaultValue: "Hoje" });
    if (hours < 48) return t("dashboard.feed_yesterday", { defaultValue: "Ontem" });
    return t("dashboard.feed_earlier", { defaultValue: "Anteriores" });
  };

  const grouped: Record<string, LogEntry[]> = {};
  displayLogs.forEach((log) => {
    const key = groupByTime(log);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  const uniqueAgentNames = [...new Set(logs.map((l) => l.agent_name).filter(Boolean))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border border-border/40 bg-card/60"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {t("dashboard.activity_feed", { defaultValue: "Atividade" })}
          </span>
          {needsAttention.length > 0 && (
            <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />
              {needsAttention.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {(["all", "success", "error"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            className={`h-7 px-2.5 text-[10px] ${filter === f ? "" : "text-muted-foreground"}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && t("dashboard.filter_all", { defaultValue: "Todos" })}
            {f === "success" && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                {t("dashboard.filter_success", { defaultValue: "Sucesso" })}
              </span>
            )}
            {f === "error" && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                {t("dashboard.filter_errors", { defaultValue: "Erros" })}
              </span>
            )}
          </Button>
        ))}

        {uniqueAgentNames.length > 1 && (
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-7 px-2 text-[10px] rounded-md border border-border/40 bg-transparent text-foreground"
          >
            <option value="all">{t("dashboard.filter_all_agents", { defaultValue: "Todos agentes" })}</option>
            {uniqueAgentNames.map((name) => (
              <option key={name} value={name!}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {t("dashboard.no_activity", { defaultValue: "Nenhuma atividade encontrada" })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(grouped).map(([timeGroup, groupLogs]) => (
              <div key={timeGroup}>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5 px-1">
                  {timeGroup}
                </p>
                <div className="space-y-1">
                  {groupLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        log.status === "error"
                          ? "bg-destructive/5 border border-destructive/10 hover:bg-destructive/8"
                          : "bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          log.status === "success" ? "bg-emerald-500" : "bg-destructive animate-pulse"
                        }`}
                      />
                      <span className="text-xs font-medium flex-1 truncate">{log.agent_name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {log.action}
                      </span>
                      {log.execution_time_ms && (
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {log.execution_time_ms}ms
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(log.created_at).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>

          {filtered.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] text-muted-foreground gap-1"
              onClick={() => setExpanded(!expanded)}
            >
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded
                ? t("dashboard.show_less", { defaultValue: "Mostrar menos" })
                : t("dashboard.show_more", { defaultValue: `Ver mais ${filtered.length - 6} itens` })}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SmartActivityFeed;
