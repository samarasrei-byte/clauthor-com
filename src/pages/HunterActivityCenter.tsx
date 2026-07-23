import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity, ThumbsUp, MessageCircle, Database, RefreshCw, AlertCircle,
  CheckCircle2, Clock, XCircle, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useHunterActionJobs, HunterActionJob } from "@/hooks/useHunterActionJobs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_META: Record<HunterActionJob["action"], { label: string; Icon: typeof ThumbsUp; color: string }> = {
  like: { label: "Curtir", Icon: ThumbsUp, color: "text-info" },
  comment: { label: "Comentar", Icon: MessageCircle, color: "text-primary" },
  crm_push: { label: "Enviar ao CRM", Icon: Database, color: "text-success" },
};

const STATUS_META: Record<HunterActionJob["status"], { label: string; Icon: typeof Clock; cls: string }> = {
  queued: { label: "Na fila", Icon: Clock, cls: "bg-muted text-muted-foreground" },
  running: { label: "Executando", Icon: RefreshCw, cls: "bg-info/10 text-info" },
  success: { label: "Sucesso", Icon: CheckCircle2, cls: "bg-success/10 text-success" },
  failed: { label: "Falhou", Icon: XCircle, cls: "bg-destructive/10 text-destructive" },
  skipped_duplicate: { label: "Já enviado", Icon: AlertCircle, cls: "bg-warning/10 text-warning" },
};

function toCsv(rows: HunterActionJob[]): string {
  const header = ["created_at", "action", "provider", "status", "attempt", "lead_id", "error"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.created_at,
      r.action,
      r.provider,
      r.status,
      `${r.attempt}/${r.max_attempts}`,
      r.lead_id ?? "",
      (r.error ?? "").replace(/[",\n]/g, " ").slice(0, 200),
    ].map((v) => `"${v}"`).join(","));
  }
  return lines.join("\n");
}

const HunterActivityCenter = () => {
  const { jobs, retryJob, loading } = useHunterActionJobs({ limit: 300 });
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inspecting, setInspecting] = useState<HunterActionJob | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (actionFilter !== "all" && j.action !== actionFilter) return false;
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      return true;
    });
  }, [jobs, actionFilter, statusFilter]);

  const kpi = useMemo(() => {
    const today = new Date().toDateString();
    const todays = jobs.filter((j) => new Date(j.created_at).toDateString() === today);
    const success = todays.filter((j) => j.status === "success").length;
    const failed = todays.filter((j) => j.status === "failed").length;
    const retrying = jobs.filter((j) => j.status === "queued" && (j.attempt ?? 1) > 1).length;
    const successRate = todays.length ? Math.round((success / todays.length) * 100) : 0;
    return { total: todays.length, success, failed, retrying, successRate };
  }, [jobs]);

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hunter-atividade-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const handleRetry = async (id: string) => {
    try {
      await retryJob(id);
      toast.success("Job reenviado");
    } catch (e) {
      toast.error("Falha ao reenviar: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="dash-h1 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Atividade do Hunter
          </h1>
          <p className="dash-body text-muted-foreground mt-1">
            Trilha de auditoria em tempo real de todas as ações no LinkedIn e envios ao CRM.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Ações hoje" value={kpi.total} />
        <KpiCard label="Sucesso hoje" value={kpi.success} accent="text-success" />
        <KpiCard label="Falhas hoje" value={kpi.failed} accent="text-destructive" />
        <KpiCard label="Taxa sucesso" value={`${kpi.successRate}%`} accent="text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Linha do tempo · {filtered.length} eventos</CardTitle>
          <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ações</SelectItem>
                <SelectItem value="like">Curtir</SelectItem>
                <SelectItem value="comment">Comentar</SelectItem>
                <SelectItem value="crm_push">CRM</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="queued">Na fila</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="skipped_duplicate">Duplicados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma ação ainda. Dispare curtidas, comentários ou envios ao CRM no wizard de Post Engagers.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((job) => {
                  const A = ACTION_META[job.action];
                  const S = STATUS_META[job.status];
                  return (
                    <li key={job.id} className="p-4 hover:bg-muted/20 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center ${A.color}`}>
                        <A.Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{A.label}</span>
                          <Badge variant="outline" className="text-[10px]">{job.provider}</Badge>
                          <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${S.cls}`}>
                            <S.Icon className={`h-3 w-3 ${job.status === "running" ? "animate-spin" : ""}`} />
                            {S.label}
                          </span>
                          {job.attempt > 1 && (
                            <span className="text-[10px] text-muted-foreground">tentativa {job.attempt}/{job.max_attempts}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                          {job.error && <span className="text-destructive ml-2">· {job.error.slice(0, 80)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {job.status === "failed" && (
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
                            onClick={() => handleRetry(job.id)}>
                            <RefreshCw className="h-3 w-3" /> Repetir
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setInspecting(job)}>
                          Ver detalhes
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Sheet open={!!inspecting} onOpenChange={(o) => !o && setInspecting(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do job</SheetTitle>
          </SheetHeader>
          {inspecting && (
            <div className="space-y-4 mt-4 text-sm">
              <Field label="ID" value={inspecting.id} mono />
              <Field label="Ação" value={`${inspecting.action} · ${inspecting.provider}`} />
              <Field label="Status" value={`${inspecting.status} (tentativa ${inspecting.attempt}/${inspecting.max_attempts})`} />
              <Field label="Criado" value={new Date(inspecting.created_at).toLocaleString("pt-BR")} />
              {inspecting.started_at && <Field label="Iniciado" value={new Date(inspecting.started_at).toLocaleString("pt-BR")} />}
              {inspecting.finished_at && <Field label="Finalizado" value={new Date(inspecting.finished_at).toLocaleString("pt-BR")} />}
              {inspecting.next_retry_at && <Field label="Próxima tentativa" value={new Date(inspecting.next_retry_at).toLocaleString("pt-BR")} />}
              {inspecting.error && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Erro</div>
                  <pre className="text-xs bg-destructive/5 border border-destructive/20 p-2 rounded whitespace-pre-wrap">{inspecting.error}</pre>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payload</div>
                <pre className="text-xs bg-muted/40 p-2 rounded whitespace-pre-wrap overflow-x-auto">{JSON.stringify(inspecting.payload, null, 2)}</pre>
              </div>
              {inspecting.result && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Resultado</div>
                  <pre className="text-xs bg-muted/40 p-2 rounded whitespace-pre-wrap overflow-x-auto">{JSON.stringify(inspecting.result, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</div>
    </div>
  );
}

export default HunterActivityCenter;
