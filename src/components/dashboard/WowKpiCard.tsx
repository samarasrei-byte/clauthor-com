/**
 * WowKpiCard — surfaces InstantWow TTFV + conversion at a glance
 * inside the admin overview; deep-links to /admin/kpis for the full dashboard.
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Zap, ArrowRight, Users } from "lucide-react";

function fmtMs(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

const TARGET_MS = 90_000;

export default function WowKpiCard() {
  const navigate = useNavigate();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: percentiles } = useQuery({
    queryKey: ["wow-kpi-card-percentiles", since],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ttfv_percentiles", { _since: since });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : null) as {
        sample_size: number;
        p50_ms: number | null;
        p90_ms: number | null;
      } | null;
    },
    staleTime: 60_000,
  });

  const { data: funnel } = useQuery({
    queryKey: ["wow-kpi-card-funnel", since],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wow_funnel", { _since: since });
      if (error) throw error;
      return (data ?? []) as Array<{ step: string; unique_users: number }>;
    },
    staleTime: 60_000,
  });

  const map = new Map(funnel?.map((f) => [f.step, f.unique_users]) ?? []);
  const started = map.get("wow_started") ?? 0;
  const approved = map.get("first_wow_approved") ?? 0;
  const conv = started > 0 ? (approved / started) * 100 : 0;

  const p50 = percentiles?.p50_ms ?? null;
  const p90 = percentiles?.p90_ms ?? null;
  const sample = percentiles?.sample_size ?? 0;
  const meetsTarget = p90 != null && p90 <= TARGET_MS;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">KPIs InstantWow</h3>
            <p className="text-[11px] text-muted-foreground">Últimos 7 dias · meta &lt; 90s</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/admin/kpis")}
          className="text-xs"
        >
          Ver detalhes <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            <Timer className="h-3 w-3" /> p50 TTFV
          </div>
          <div className="text-lg font-mono font-semibold">{fmtMs(p50)}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            <Timer className="h-3 w-3" /> p90 TTFV
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-semibold">{fmtMs(p90)}</span>
            {p90 != null && (
              <Badge
                variant={meetsTarget ? "default" : "destructive"}
                className="text-[10px] h-4 px-1.5"
              >
                {meetsTarget ? "✓ meta" : "✗ meta"}
              </Badge>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            <Users className="h-3 w-3" /> Iniciaram
          </div>
          <div className="text-lg font-mono font-semibold">{started}</div>
          <div className="text-[10px] text-muted-foreground">amostra ttfv: {sample}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Conversão → 1º wow</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-semibold">{conv.toFixed(1)}%</span>
            <span className="text-[10px] text-muted-foreground">({approved}/{started})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
