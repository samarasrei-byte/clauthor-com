import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Users, ShieldCheck } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import SEO from "@/components/SEO";

type MetricKey =
  | "leads_per_week"
  | "reply_rate"
  | "meetings_booked"
  | "posts_approved"
  | "approval_time_hours"
  | "time_to_first_value_seconds"
  | "revenue_attributed"
  | "tasks_completed";

const METRICS: { key: MetricKey; label: string; unit: string; lowerIsBetter?: boolean }[] = [
  { key: "leads_per_week", label: "Leads por semana", unit: "leads" },
  { key: "reply_rate", label: "Taxa de resposta", unit: "%" },
  { key: "meetings_booked", label: "Reuniões agendadas", unit: "/mês" },
  { key: "posts_approved", label: "Posts aprovados", unit: "/sem" },
  { key: "approval_time_hours", label: "Tempo de aprovação", unit: "h", lowerIsBetter: true },
  { key: "tasks_completed", label: "Tarefas concluídas", unit: "/sem" },
];

interface PercentileRow {
  metric_key: string;
  sample_size: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  avg_value: number;
}

interface MyMetricRow {
  metric_key: string;
  metric_value: number;
}

const formatValue = (v: number, unit: string) => {
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "h") return `${v.toFixed(1)}h`;
  return `${Math.round(v).toLocaleString("pt-BR")} ${unit}`;
};

const BenchmarksPanel = () => {
  const [industry, setIndustry] = useState<string>("all");

  const { data: benchmarks, isLoading } = useQuery({
    queryKey: ["benchmarks", industry],
    queryFn: async () => {
      const results: Record<string, PercentileRow | null> = {};
      await Promise.all(
        METRICS.map(async (m) => {
          const { data } = await supabase.rpc("get_benchmark_percentiles", {
            _metric_key: m.key,
            _industry: industry === "all" ? null : industry,
            _company_size: null,
          });
          results[m.key] = (data?.[0] as PercentileRow) ?? null;
        })
      );
      return results;
    },
    staleTime: 5 * 60_000,
  });

  const { data: myMetrics } = useQuery({
    queryKey: ["my-benchmarks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("benchmark_metrics")
        .select("metric_key, metric_value")
        .order("created_at", { ascending: false })
        .limit(50);
      const latest: Record<string, number> = {};
      (data as MyMetricRow[] | null)?.forEach((row) => {
        if (latest[row.metric_key] === undefined) latest[row.metric_key] = Number(row.metric_value);
      });
      return latest;
    },
    staleTime: 60_000,
  });

  const renderDelta = (metricKey: MetricKey, my: number | undefined, p50: number | undefined, lowerIsBetter?: boolean) => {
    if (my === undefined || p50 === undefined || p50 === 0) {
      return <Badge variant="outline" className="gap-1"><Minus className="h-3 w-3" /> Sem dado seu</Badge>;
    }
    const diff = ((my - p50) / p50) * 100;
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    const Icon = better ? TrendingUp : TrendingDown;
    return (
      <Badge variant={better ? "default" : "destructive"} className="gap-1">
        <Icon className="h-3 w-3" />
        {diff > 0 ? "+" : ""}{diff.toFixed(0)}% vs mediana
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      <SEO
        title="Benchmarks Anônimos — Clauthor"
        description="Compare a performance dos seus agentes IA com o mercado de forma anônima e segura."
      />

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Anonimato preservado (k≥5)
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Benchmarks da Rede Clauthor</h1>
        <p className="text-muted-foreground max-w-2xl">
          Veja como seus agentes performam em comparação com centenas de outras empresas usando Clauthor.
          Dados agregados, anônimos e atualizados em tempo real.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filtrar por indústria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              <SelectItem value="saas">SaaS / Tech</SelectItem>
              <SelectItem value="agency">Agências</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="services">Serviços</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="legal">Jurídico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => {
          const row = benchmarks?.[m.key];
          const my = myMetrics?.[m.key];
          return (
            <Card key={m.key} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{m.label}</span>
                  {isLoading ? <Skeleton className="h-5 w-16" /> : renderDelta(m.key, my, row?.p50, m.lowerIsBetter)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : row ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Você</span>
                        <span>Mediana do mercado</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold tabular-nums">
                          {my !== undefined ? formatValue(my, m.unit) : "—"}
                        </span>
                        <span className="text-lg text-muted-foreground tabular-nums">
                          {formatValue(row.p50, m.unit)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <div>p25<br /><span className="text-foreground font-medium">{formatValue(row.p25, m.unit)}</span></div>
                      <div>p50<br /><span className="text-foreground font-medium">{formatValue(row.p50, m.unit)}</span></div>
                      <div>p75<br /><span className="text-foreground font-medium">{formatValue(row.p75, m.unit)}</span></div>
                      <div>p90<br /><span className="text-foreground font-medium">{formatValue(row.p90, m.unit)}</span></div>
                    </div>

                    <div className="text-[11px] text-muted-foreground pt-1 border-t">
                      Amostra anônima: {row.sample_size} empresas
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Aguardando massa crítica (mínimo 5 empresas)
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Como protegemos sua privacidade
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Métricas agregadas — nenhum nome, e-mail ou conteúdo é compartilhado.</li>
            <li>Mínimo de 5 empresas por agregação (k-anonymity).</li>
            <li>Você pode desativar a contribuição em Configurações &gt; Privacidade.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BenchmarksPanel;
