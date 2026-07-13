/**
 * AdminKpiDashboard · percentis de Time-To-First-Value + funil InstantWow.
 * Acesso restrito a admin (has_role check nas funções SQL).
 */
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { Loader2, ArrowLeft, Activity, Timer, Users, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

type Range = "24h" | "7d" | "30d" | "90d";
const RANGE_HOURS: Record<Range, number> = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 };

function fmtMs(ms: number | null | undefined) {
  if (ms == null) return "·";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

function fmtPct(numerator: number, denominator: number) {
  if (!denominator) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default function AdminKpiDashboard() {
  const { verified } = useAdminGuard();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("30d");

  const since = useMemo(
    () => new Date(Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000).toISOString(),
    [range],
  );

  const { data: percentiles, isLoading: pLoading } = useQuery({
    enabled: verified,
    queryKey: ["ttfv-percentiles", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ttfv_percentiles", { _since: since });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : null) as {
        sample_size: number;
        p50_ms: number | null; p75_ms: number | null; p90_ms: number | null; p95_ms: number | null;
        avg_ms: number | null; min_ms: number | null; max_ms: number | null;
      } | null;
    },
  });

  const { data: daily } = useQuery({
    enabled: verified,
    queryKey: ["ttfv-daily", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ttfv_daily", { _since: since });
      if (error) throw error;
      return (data ?? []) as Array<{ day: string; sample_size: number; p50_ms: number; p90_ms: number }>;
    },
  });

  const { data: funnel } = useQuery({
    enabled: verified,
    queryKey: ["wow-funnel", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wow_funnel", { _since: since });
      if (error) throw error;
      return (data ?? []) as Array<{ step: string; unique_users: number; events: number }>;
    },
  });

  const { data: variantStats } = useQuery({
    enabled: verified,
    queryKey: ["wow-variant-significance", range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wow_variant_significance", { _since: since });
      if (error) throw error;
      return (data ?? []) as Array<{
        variant: string;
        assigned: number;
        approved: number;
        conversion_rate: number;
        chi_square: number;
        p_lt_0_05: boolean;
        winner: string;
      }>;
    },
  });


  if (!verified) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const funnelMap = new Map(funnel?.map((f) => [f.step, f]) ?? []);
  const started = funnelMap.get("wow_started")?.unique_users ?? 0;
  const submitted = funnelMap.get("wow_form_submitted")?.unique_users ?? 0;
  const ready = funnelMap.get("wow_output_ready")?.unique_users ?? 0;
  const approved = funnelMap.get("first_wow_approved")?.unique_users ?? 0;
  const skipped = funnelMap.get("wow_skipped")?.unique_users ?? 0;

  const p50 = percentiles?.p50_ms ?? null;
  const p90 = percentiles?.p90_ms ?? null;
  const target = 90_000; // 90s TTFV target
  const p90Off = p90 != null ? ((p90 - target) / target) * 100 : null;

  return (
    <>
      <Helmet>
        <title>KPIs · Time-To-First-Value | Clauthor Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-dvh bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Admin
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Time-To-First-Value</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Meta &lt; 90s do signup ao primeiro output aprovado
                </p>
              </div>
            </div>
            <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/30">
              {(["24h", "7d", "30d", "90d"] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded-md transition-colors ${
                    range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {pLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Percentile cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "p50 (mediana)", value: p50, hint: "50% dos users" },
                  { label: "p75", value: percentiles?.p75_ms, hint: "75%" },
                  { label: "p90", value: p90, hint: "90%" },
                  { label: "p95", value: percentiles?.p95_ms, hint: "95%" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-border bg-card p-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="text-2xl md:text-3xl font-semibold mt-1 text-foreground">
                      {fmtMs(c.value)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{c.hint}</div>
                  </div>
                ))}
              </div>

              {/* Meta / gap */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Meta 90 segundos
                      </div>
                      <div className="text-lg font-semibold">
                        p90: {fmtMs(p90)}{" "}
                        <span className={`text-sm font-normal ${p90Off != null && p90Off > 0 ? "text-destructive" : "text-emerald-500"}`}>
                          {p90Off != null && (p90Off > 0 ? `+${p90Off.toFixed(0)}%` : `${p90Off.toFixed(0)}%`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs md:text-sm">
                    <div>
                      <div className="text-muted-foreground">Amostra</div>
                      <div className="font-semibold">{percentiles?.sample_size ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Média</div>
                      <div className="font-semibold">{fmtMs(percentiles?.avg_ms)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min / Max</div>
                      <div className="font-semibold">{fmtMs(percentiles?.min_ms)} / {fmtMs(percentiles?.max_ms)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily trend */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Tendência diária</h2>
                </div>
                {(daily?.length ?? 0) === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    Sem dados no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border/60">
                          <th className="py-2 pr-4">Data</th>
                          <th className="py-2 pr-4">Amostra</th>
                          <th className="py-2 pr-4">p50</th>
                          <th className="py-2 pr-4">p90</th>
                          <th className="py-2 pr-4">Meta 90s</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daily?.map((d) => (
                          <tr key={d.day} className="border-b border-border/30">
                            <td className="py-2 pr-4 font-mono">{d.day}</td>
                            <td className="py-2 pr-4">{d.sample_size}</td>
                            <td className="py-2 pr-4">{fmtMs(d.p50_ms)}</td>
                            <td className="py-2 pr-4">{fmtMs(d.p90_ms)}</td>
                            <td className="py-2 pr-4">
                              <span className={d.p90_ms <= target ? "text-emerald-500" : "text-destructive"}>
                                {d.p90_ms <= target ? "✓" : "✗"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Funnel */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Funil InstantWow</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Iniciaram", count: started, base: started },
                    { label: "Preencheram formulário", count: submitted, base: started },
                    { label: "Viram output pronto", count: ready, base: started },
                    { label: "Aprovaram (first wow)", count: approved, base: started },
                    { label: "Skiparam", count: skipped, base: started },
                  ].map((row) => {
                    const pct = row.base > 0 ? (row.count / row.base) * 100 : 0;
                    return (
                      <div key={row.label} className="flex items-center gap-3">
                        <div className="w-48 text-xs md:text-sm">{row.label}</div>
                        <div className="flex-1 h-6 rounded bg-muted/40 overflow-hidden relative">
                          <div
                            className="h-full bg-primary/40"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-2 text-[11px] font-mono">
                            {row.count} • {fmtPct(row.count, row.base)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Base do funil: usuários únicos que iniciaram o InstantWow.
                </p>
              </div>

              {/* A/B: form vs voice with chi-square significance */}
              {variantStats && variantStats.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-primary rotate-180" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider">A/B Form vs Voz</h2>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      {(() => {
                        const total = variantStats.reduce((s, v) => s + Number(v.assigned || 0), 0);
                        const sig = variantStats[0]?.p_lt_0_05;
                        const winner = variantStats[0]?.winner;
                        const chi = variantStats[0]?.chi_square ?? 0;
                        if (total < 100) {
                          return (
                            <span className="px-2 py-1 rounded-full border border-border bg-muted/30 font-mono">
                              coletando amostras: {total}/100
                            </span>
                          );
                        }
                        if (sig && winner !== "inconclusive") {
                          return (
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                              ✓ significante · vencedor: <strong className="uppercase">{winner}</strong> · χ²={chi}
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-1 rounded-full border border-border bg-muted/30 font-mono">
                            sem diferença significante · χ²={chi} · p ≥ 0.05
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {variantStats.map((v) => {
                      const isWinner =
                        v.p_lt_0_05 &&
                        v.winner === v.variant &&
                        v.winner !== "inconclusive";
                      return (
                        <div
                          key={v.variant}
                          className={`rounded-lg border p-3 ${
                            isWinner
                              ? "border-emerald-500/50 bg-emerald-500/5"
                              : "border-border/60 bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase tracking-wider font-semibold">
                              {v.variant === "voice" ? "🎙️ Voz" : "📝 Formulário"}
                            </span>
                            {isWinner && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                                Vencedor
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-mono font-semibold">
                            {(Number(v.conversion_rate) * 100).toFixed(1)}%
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                            {v.approved} aprovaram / {v.assigned} atribuídos
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Teste chi-square com correção de Yates (df=1, p&lt;0.05 quando χ² &gt; 3.841). Amostra mínima recomendada: 100 usuários atribuídos.
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
