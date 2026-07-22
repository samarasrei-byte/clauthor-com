import { Activity, Bot, CheckCircle, Clock, Search, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LogsSectionProps {
  recentLogs: any[];
  locale: string;
  onGoToAgents?: () => void;
}

type StatusFilter = "all" | "success" | "error";
type TimeFilter = "24h" | "7d" | "30d" | "all";

const TIME_WINDOWS: Record<TimeFilter, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  all: Infinity,
};

const LogsSection = ({ recentLogs, locale, onGoToAgents }: LogsSectionProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [timeframe, setTimeframe] = useState<TimeFilter>("7d");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const now = Date.now();
    const window = TIME_WINDOWS[timeframe];
    const q = query.trim().toLowerCase();
    return recentLogs.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (window !== Infinity && now - new Date(l.created_at).getTime() > window) return false;
      if (q) {
        const hay = `${l.agent_name ?? ""} ${l.action ?? ""} ${l.status ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recentLogs, status, timeframe, query]);

  const counts = useMemo(() => ({
    success: recentLogs.filter((l) => l.status === "success").length,
    error: recentLogs.filter((l) => l.status === "error").length,
  }), [recentLogs]);

  const getStatusIcon = (s: string) => {
    if (s === "success") return <CheckCircle className="h-3.5 w-3.5 text-success" />;
    if (s === "error") return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl tracking-[-0.02em]">Auditoria de execuções</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {filtered.length} de {recentLogs.length} · <span className="text-success">{counts.success} sucesso</span> · <span className="text-destructive">{counts.error} erros</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar agente ou ação…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-xs w-52"
            />
          </div>
          <div className="flex gap-0.5 bg-muted/30 rounded-md p-0.5">
            {(["24h", "7d", "30d", "all"] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded transition-colors",
                  timeframe === tf ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tf === "all" ? "Tudo" : tf}
              </button>
            ))}
          </div>
          {(["all", "success", "error"] as StatusFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={status === f ? "default" : "ghost"}
              className="text-xs h-8"
              onClick={() => setStatus(f)}
            >
              {f === "all" ? "Todos" : f === "success" ? "Sucesso" : "Erros"}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <p className="text-muted-foreground font-medium">
              {recentLogs.length === 0 ? t("dashboard.no_logs_found") : "Nenhum log corresponde aos filtros."}
            </p>
            {onGoToAgents && recentLogs.length === 0 && (
              <Button variant="outline" size="sm" onClick={onGoToAgents} className="mt-2 gap-1.5">
                <Bot className="h-3.5 w-3.5" /> {t("dashboard.view_agents", { defaultValue: "Ver Agentes" })}
              </Button>
            )}
          </div>
        ) : (
          <div className="relative max-h-[600px] overflow-y-auto">
            {/* Vertical rail */}
            <span className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent pointer-events-none" />
            <div className="divide-y divide-border/10">
              {filtered.map((log: any) => (
                <div key={log.id} className="relative p-4 pl-12 hover:bg-card/50 transition-colors">
                  <span className={cn(
                    "absolute left-[22px] top-5 h-2.5 w-2.5 rounded-full border-2 border-background",
                    log.status === "success" ? "bg-success" : log.status === "error" ? "bg-destructive" : "bg-muted-foreground",
                  )} />
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <p className="text-sm font-medium truncate">{log.agent_name || "Agente"}</p>
                        {log.execution_time_ms ? (
                          <span className="text-[10px] text-muted-foreground">{log.execution_time_ms}ms</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.action}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary" className={cn(
                        "text-[10px]",
                        log.status === "success" ? "bg-success/10 text-success" :
                        log.status === "error" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground",
                      )}>
                        {log.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsSection;
