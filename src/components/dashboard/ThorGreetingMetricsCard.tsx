import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, X, TrendingUp, Zap } from "lucide-react";

type EventRow = {
  event_type: "impression" | "cta_click" | "dismiss";
  level: "ok" | "low" | "critical" | null;
  is_admin: boolean;
  created_at: string;
};

const WINDOW_DAYS = 30;

function pct(numerator: number, denominator: number): string {
  if (!denominator) return "0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default function ThorGreetingMetricsCard() {
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - WINDOW_DAYS);
    return d.toISOString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["thor-greeting-metrics", since],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("thor_greeting_events")
        .select("event_type,level,is_admin,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const rows = data ?? [];
    const impressions = rows.filter((r) => r.event_type === "impression").length;
    const clicks = rows.filter((r) => r.event_type === "cta_click").length;
    const dismisses = rows.filter((r) => r.event_type === "dismiss").length;
    const criticalImpr = rows.filter(
      (r) => r.event_type === "impression" && r.level === "critical",
    ).length;
    const nonAdminImpr = rows.filter(
      (r) => r.event_type === "impression" && !r.is_admin,
    ).length;
    return { impressions, clicks, dismisses, criticalImpr, nonAdminImpr };
  }, [data]);

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Popup diário do Thor — últimos {WINDOW_DAYS} dias
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {isLoading ? "…" : `${stats.impressions} impressões`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Impressões"
            value={stats.impressions}
            hint={`${stats.nonAdminImpr} de clientes`}
          />
          <Stat
            icon={<MousePointerClick className="h-3.5 w-3.5 text-primary" />}
            label="Cliques no CTA"
            value={stats.clicks}
            hint="→ /pricing"
            highlight
          />
          <Stat
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
            label="CTR"
            value={pct(stats.clicks, stats.nonAdminImpr)}
            hint="clique / impressão (clientes)"
          />
          <Stat
            icon={<X className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Fechados"
            value={stats.dismisses}
            hint={`${stats.criticalImpr} em nível crítico`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border/40 bg-background/40")
      }
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="font-display font-bold text-xl mt-1">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}
