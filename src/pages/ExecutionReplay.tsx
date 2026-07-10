import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutionRun } from "@/hooks/useExecutionRun";
import { ReplayHeader } from "@/components/replay/ReplayHeader";
import { ReplayTimeline } from "@/components/replay/ReplayTimeline";
import { trackKpi } from "@/lib/kpiTracker";

const ExecutionReplay = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { run, steps, totals, isLoading, isError } = useExecutionRun(runId);

  useEffect(() => {
    if (runId) trackKpi("replay_opened", { source: "dashboard", run_id: runId });
  }, [runId]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Replay de Execução · CLAUTHOR</title>
        <meta name="description" content="Timeline auditável da execução do agente: passos, ferramentas, fontes, custo e duração." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to="/dashboard">Painel</Link>
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-sm text-destructive">
            Não foi possível carregar esta execução.
          </div>
        )}

        {run && !isLoading && (
          <div className="space-y-5">
            <ReplayHeader run={run} totals={totals} />
            <ReplayTimeline steps={steps} isLive={run.status === "running"} runId={run.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionReplay;
