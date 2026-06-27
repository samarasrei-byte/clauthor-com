import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThumbsDown, ThumbsUp, MessageSquare, TrendingDown } from "lucide-react";

type Feedback = {
  id: string;
  agent_id: string | null;
  agent_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Period = "7" | "30" | "90";

export default function FeedbackTrendsPanel() {
  const [period, setPeriod] = useState<Period>("30");
  const [rows, setRows] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - parseInt(period) * 86400_000).toISOString();
      const { data, error } = await supabase
        .from("agent_feedback")
        .select("id, agent_id, agent_name, rating, comment, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!active) return;
      if (!error && data) setRows(data as Feedback[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [period]);

  const stats = useMemo(() => {
    const byAgent = new Map<string, { name: string; up: number; down: number; comments: string[] }>();
    for (const r of rows) {
      const key = r.agent_name || r.agent_id || "—";
      const entry = byAgent.get(key) || { name: key, up: 0, down: 0, comments: [] as string[] };
      if (r.rating === 1) entry.up += 1;
      else entry.down += 1;
      if (r.rating === -1 && r.comment) entry.comments.push(r.comment);
      byAgent.set(key, entry);
    }
    const total = rows.length;
    const down = rows.filter((r) => r.rating === -1).length;
    const rate = total ? Math.round((down / total) * 100) : 0;
    const agents = Array.from(byAgent.values()).sort((a, b) => b.down - a.down);
    return { total, down, rate, agents };
  }, [rows]);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-primary" />
            Tendências de Feedback
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Qualidade percebida das respostas dos agentes.
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Metric icon={<MessageSquare className="h-3.5 w-3.5" />} label="Total" value={stats.total} />
          <Metric icon={<ThumbsDown className="h-3.5 w-3.5 text-destructive" />} label="Negativos" value={stats.down} />
          <Metric icon={<ThumbsUp className="h-3.5 w-3.5 text-primary" />} label="Taxa 👎" value={`${stats.rate}%`} />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : stats.agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem feedback no período.</p>
        ) : (
          <div className="space-y-2">
            {stats.agents.slice(0, 6).map((a) => {
              const tot = a.up + a.down;
              const pct = tot ? Math.round((a.down / tot) * 100) : 0;
              return (
                <div key={a.name} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{a.name}</span>
                    <Badge variant={pct > 30 ? "destructive" : "secondary"}>{pct}% 👎</Badge>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>👍 {a.up}</span>
                    <span>👎 {a.down}</span>
                  </div>
                  {a.comments.slice(0, 2).map((c, i) => (
                    <p key={i} className="mt-1.5 line-clamp-1 text-xs italic text-muted-foreground">"{c}"</p>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
