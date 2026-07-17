import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ALL_STEPS,
  computeStepMap,
  STEP_LABELS,
  type ActivationStep,
  type ActivationStepRow,
  type ContractedDepartment,
} from "@/hooks/useActivationSteps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivationCardProps {
  department: ContractedDepartment;
  steps: ActivationStepRow[];
  onRefresh: () => void;
}

const STATUS_ICONS: Record<string, JSX.Element> = {
  done: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  running: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
  failed: <XCircle className="h-5 w-5 text-destructive" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
};

const STATUS_LABELS: Record<string, string> = {
  done: "Concluído",
  running: "Em andamento",
  failed: "Falhou",
  pending: "Aguardando",
};

export function ActivationCard({ department, steps, onRefresh }: ActivationCardProps) {
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState<ActivationStep | null>(null);
  const stepMap = computeStepMap(steps);

  const completedCount = ALL_STEPS.filter((s) => stepMap[s]?.status === "done").length;
  const totalCount = ALL_STEPS.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  const overallFailed = ALL_STEPS.some((s) => stepMap[s]?.status === "failed");
  const overallRunning = ALL_STEPS.some((s) => stepMap[s]?.status === "running");

  const handleRetry = async (step: ActivationStep) => {
    setRetrying(step);
    try {
      const { data, error } = await supabase.functions.invoke("activation-retry", {
        body: { contracted_department_id: department.id, step },
      });
      if (error) throw error;

      if (data?.action === "reopen_activate_modal") {
        toast.info("Reabra o checkout para tentar novamente.");
        navigate(`/dashboard?activate=1&dept=${department.department_id}`);
        return;
      }
      if (data?.action === "open_library") {
        toast.info("Peça a um agente para rodar uma tarefa na sua biblioteca.");
        navigate("/library");
        return;
      }
      if (data?.success) {
        toast.success(`Etapa "${STEP_LABELS[step].title}" reprocessada com sucesso.`);
        onRefresh();
      } else {
        toast.error(data?.message ?? "Não foi possível reprocessar essa etapa.");
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Erro ao reprocessar etapa.");
    } finally {
      setRetrying(null);
    }
  };

  const overallLabel = overallFailed
    ? "Precisa de atenção"
    : overallRunning
      ? "Em andamento"
      : completedCount === totalCount
        ? "Ativo"
        : "Parcial";

  const overallVariant = overallFailed
    ? "destructive"
    : completedCount === totalCount
      ? "default"
      : "secondary";

  return (
    <Card className="p-6 space-y-4">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">
            {department.department_name ?? department.department_id}
          </h3>
          <p className="text-sm text-muted-foreground">
            Contratado em {new Date(department.created_at).toLocaleDateString("pt-BR")}
            {department.agent_count ? ` · ${department.agent_count} agentes` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallVariant as any}>{overallLabel}</Badge>
          <span className="text-sm text-muted-foreground tabular-nums">
            {completedCount}/{totalCount} · {percent}%
          </span>
        </div>
      </header>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            overallFailed ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="space-y-3">
        {ALL_STEPS.map((step, idx) => {
          const row = stepMap[step];
          const status = row?.status ?? "pending";
          const meta = STEP_LABELS[step];
          const canRetry = status === "failed";
          const isRetrying = retrying === step;

          return (
            <li
              key={step}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                status === "failed" && "border-destructive/40 bg-destructive/5",
                status === "done" && "border-green-500/30 bg-green-500/5",
              )}
            >
              <div className="flex flex-col items-center pt-0.5">
                {STATUS_ICONS[status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {idx + 1}. {meta.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </span>
                  {row?.attempts && row.attempts > 1 ? (
                    <span className="text-xs text-muted-foreground">
                      · {row.attempts} tentativas
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {status === "failed" && row?.error_message
                    ? row.error_message
                    : meta.description}
                </p>
              </div>
              {canRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRetry(step)}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Reprocessar
                    </>
                  )}
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/departamento/${department.department_id}`)}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Abrir departamento
        </Button>
      </footer>
    </Card>
  );
}
