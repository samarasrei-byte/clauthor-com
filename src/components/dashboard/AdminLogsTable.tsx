import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdminLogsTableProps {
  executionLogs: any[];
  locale: string;
}

export default function AdminLogsTable({ executionLogs, locale }: AdminLogsTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "success" | "error">("all");

  const filtered = executionLogs
    .filter(l => filter === "all" || l.status === filter)
    .filter(l =>
      (l.agent?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> {t("dashboard.execution_logs", { defaultValue: "Logs de Execução" })} ({executionLogs.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "success", "error"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {f === "all" ? t("dashboard.filter_all", { defaultValue: "Todos" }) : f === "success" ? t("dashboard.filter_success", { defaultValue: "Sucesso" }) : t("dashboard.filter_error", { defaultValue: "Erro" })}
                </button>
              ))}
            </div>
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={t("dashboard.search", { defaultValue: "Buscar..." })} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background/90 backdrop-blur">
              <tr className="border-b border-white/[0.08]">
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.agent", { defaultValue: "Agente" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.action", { defaultValue: "Ação" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.time", { defaultValue: "Tempo" })}</th>
                <th className="text-left p-3 text-muted-foreground font-medium">{t("dashboard.date", { defaultValue: "Data" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: any) => (
                <tr key={log.id} className="border-b border-white/[0.05] hover:bg-accent/20">
                  <td className="p-3 font-medium">{log.agent?.name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{log.action}</td>
                  <td className="p-3"><Badge variant="secondary" className={log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : log.status === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary/80"}>{log.status}</Badge></td>
                  <td className="p-3 text-muted-foreground">{log.execution_time_ms ? `${log.execution_time_ms}ms` : "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">{t("dashboard.no_results", { defaultValue: "Nenhum resultado encontrado." })}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
