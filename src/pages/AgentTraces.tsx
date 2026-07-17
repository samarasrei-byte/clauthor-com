/**
 * AgentTraces.tsx — Observabilidade de Agentes
 *
 * Painel que mostra runs, chamadas LLM, tool calls, latência, custo e eval score.
 * Isso separa "wrapper de LLM" de "plataforma real de agentes".
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Brain,
  Database,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SEO } from "@/components/SEO";

type Trace = {
  id: string;
  run_id: string;
  agent_id: string | null;
  agent_name: string | null;
  span_type: "run" | "llm_call" | "tool_call" | "retrieval" | "decision" | "error";
  name: string;
  status: "ok" | "error" | "pending";
  model: string | null;
  input: any;
  output: any;
  metadata: any;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  latency_ms: number;
  eval_score: number | null;
  started_at: string;
  finished_at: string | null;
};

const SPAN_ICON: Record<Trace["span_type"], any> = {
  run: Activity,
  llm_call: Brain,
  tool_call: Wrench,
  retrieval: Database,
  decision: Sparkles,
  error: AlertCircle,
};

const SPAN_COLOR: Record<Trace["span_type"], string> = {
  run: "text-primary",
  llm_call: "text-blue-500",
  tool_call: "text-amber-500",
  retrieval: "text-purple-500",
  decision: "text-emerald-500",
  error: "text-destructive",
};

export default function AgentTraces() {
  const { user } = useAuth();
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const filterAgent = searchParams.get("agent");
  const filterRun = searchParams.get("run");

  const { data: traces = [], isLoading } = useQuery({
    queryKey: ["agent-traces", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_traces")
        .select("*")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Trace[];
    },
    enabled: !!user,
    refetchInterval: 15_000,
  });

  // Group traces by run_id
  const runs = useMemo(() => {
    const grouped = new Map<string, Trace[]>();
    for (const t of traces) {
      const arr = grouped.get(t.run_id) || [];
      arr.push(t);
      grouped.set(t.run_id, arr);
    }
    return Array.from(grouped.entries())
      .map(([runId, spans]) => {
        const root = spans.find((s) => s.span_type === "run") || spans[0];
        const totalCost = spans.reduce((s, x) => s + Number(x.cost_usd || 0), 0);
        const totalTokens = spans.reduce(
          (s, x) => s + (x.tokens_input || 0) + (x.tokens_output || 0),
          0,
        );
        const totalLatency = spans.reduce((s, x) => s + (x.latency_ms || 0), 0);
        const hasError = spans.some((s) => s.status === "error");
        const evalScores = spans
          .map((s) => s.eval_score)
          .filter((v): v is number => v !== null && v !== undefined);
        const avgEval =
          evalScores.length > 0
            ? evalScores.reduce((a, b) => a + b, 0) / evalScores.length
            : null;
        return {
          runId,
          root,
          spans: spans.sort(
            (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
          ),
          totalCost,
          totalTokens,
          totalLatency,
          hasError,
          avgEval,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.root.started_at).getTime() - new Date(a.root.started_at).getTime(),
      );
  }, [traces]);

  const filteredRuns = useMemo(
    () => (filterAgent ? runs.filter((r) => r.root.agent_id === filterAgent) : runs),
    [runs, filterAgent],
  );

  const selectedRunData = useMemo(
    () => filteredRuns.find((r) => r.runId === selectedRun),
    [filteredRuns, selectedRun],
  );

  // Auto-select run from ?run= or first matching agent run
  useEffect(() => {
    if (selectedRun) return;
    if (filterRun && runs.some((r) => r.runId === filterRun)) {
      setSelectedRun(filterRun);
    } else if (filterAgent && filteredRuns.length > 0) {
      setSelectedRun(filteredRuns[0].runId);
    }
  }, [filterRun, filterAgent, filteredRuns, runs, selectedRun]);


  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalRuns = runs.length;
    const errorRate =
      totalRuns > 0 ? (runs.filter((r) => r.hasError).length / totalRuns) * 100 : 0;
    const totalCostUsd = runs.reduce((s, r) => s + r.totalCost, 0);
    const avgLatency =
      totalRuns > 0 ? runs.reduce((s, r) => s + r.totalLatency, 0) / totalRuns : 0;
    // p95 latency
    const sortedLatencies = runs.map((r) => r.totalLatency).sort((a, b) => a - b);
    const p95 =
      sortedLatencies.length > 0
        ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)]
        : 0;
    return { totalRuns, errorRate, totalCostUsd, avgLatency, p95 };
  }, [runs]);

  return (
    <>
      <SEO
        title="Agent Traces — Observabilidade | Clauthor"
        description="Timeline completa de execuções, latência, custo e qualidade dos seus agentes."
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Agent Traces
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Observabilidade completa de execuções, custos e qualidade
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live · atualiza a cada 15s
          </Badge>
        </div>

        {/* Aggregate metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard icon={Activity} label="Runs (30d)" value={metrics.totalRuns.toString()} />
          <MetricCard
            icon={CheckCircle2}
            label="Taxa de erro"
            value={`${metrics.errorRate.toFixed(1)}%`}
            tone={metrics.errorRate > 5 ? "danger" : "ok"}
          />
          <MetricCard
            icon={Clock}
            label="Latência p95"
            value={metrics.p95 > 0 ? `${(metrics.p95 / 1000).toFixed(1)}s` : "—"}
          />
          <MetricCard
            icon={Zap}
            label="Latência média"
            value={metrics.avgLatency > 0 ? `${(metrics.avgLatency / 1000).toFixed(1)}s` : "—"}
          />
          <MetricCard
            icon={DollarSign}
            label="Custo total"
            value={`$${metrics.totalCostUsd.toFixed(3)}`}
          />
        </div>

        {/* Empty state */}
        {!isLoading && runs.length === 0 && (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">
              Nenhuma execução registrada ainda
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Assim que seus agentes começarem a executar tarefas, você verá aqui a linha do
              tempo completa: cada chamada de LLM, uso de ferramenta, latência, custo e score
              de qualidade.
            </p>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {/* Runs + Timeline split view */}
        {runs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
            {/* Runs list */}
            <Card className="p-2 h-[calc(100vh-320px)]">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Execuções recentes
              </div>
              <ScrollArea className="h-[calc(100%-32px)]">
                <div className="space-y-1 pr-2">
                  {runs.map((run, i) => (
                    <motion.button
                      key={run.runId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedRun(run.runId)}
                      className={`w-full text-left rounded-lg p-3 transition-colors ${
                        selectedRun === run.runId
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate max-w-[220px]">
                          {run.root.agent_name || run.root.name || "Run"}
                        </span>
                        {run.hasError ? (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {(run.totalLatency / 1000).toFixed(1)}s
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5" />${run.totalCost.toFixed(4)}
                        </span>
                        <span>{run.spans.length} spans</span>
                        {run.avgEval !== null && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] h-4 px-1 py-0 ml-auto"
                          >
                            {run.avgEval.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(run.root.started_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Timeline detail */}
            <Card className="p-4 h-[calc(100vh-320px)] overflow-hidden flex flex-col">
              {selectedRunData ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-sm">
                        {selectedRunData.root.agent_name ||
                          selectedRunData.root.name ||
                          "Run"}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {selectedRunData.runId.slice(0, 8)}…
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs tabular-nums">
                      <span>
                        <span className="text-muted-foreground">Latência:</span>{" "}
                        <span className="font-medium">
                          {(selectedRunData.totalLatency / 1000).toFixed(2)}s
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Custo:</span>{" "}
                        <span className="font-medium">
                          ${selectedRunData.totalCost.toFixed(5)}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Tokens:</span>{" "}
                        <span className="font-medium">
                          {selectedRunData.totalTokens.toLocaleString("pt-BR")}
                        </span>
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 pr-3">
                    <div className="space-y-2">
                      {selectedRunData.spans.map((span) => {
                        const Icon = SPAN_ICON[span.span_type];
                        const color = SPAN_COLOR[span.span_type];
                        return (
                          <div
                            key={span.id}
                            className="rounded-lg border bg-card/50 p-3 text-xs"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-medium truncate">{span.name}</span>
                                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground tabular-nums">
                                    {span.model && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] h-4 px-1 py-0 font-mono"
                                      >
                                        {span.model.replace("google/", "").replace("openai/", "")}
                                      </Badge>
                                    )}
                                    <span>{span.latency_ms}ms</span>
                                    {span.cost_usd > 0 && (
                                      <span>${Number(span.cost_usd).toFixed(5)}</span>
                                    )}
                                  </div>
                                </div>
                                {(span.tokens_input > 0 || span.tokens_output > 0) && (
                                  <div className="text-[10px] text-muted-foreground tabular-nums mb-1">
                                    in {span.tokens_input} · out {span.tokens_output}
                                  </div>
                                )}
                                {span.status === "error" && span.output?.error && (
                                  <div className="text-[10px] text-destructive bg-destructive/5 rounded px-2 py-1 mt-1">
                                    {String(span.output.error).slice(0, 200)}
                                  </div>
                                )}
                                {span.output?.preview && (
                                  <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 font-mono bg-muted/30 rounded px-2 py-1">
                                    {String(span.output.preview).slice(0, 240)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <ChevronRight className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Selecione uma execução para ver a timeline
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: any;
  label: string;
  value: string;
  tone?: "ok" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "ok"
        ? "text-emerald-500"
        : "text-foreground";
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`text-xl font-display font-bold tabular-nums ${toneClass}`}>{value}</div>
    </Card>
  );
}
