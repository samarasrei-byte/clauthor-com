/**
 * AdminSimulationsPanel — Funil simulação → contratação por agente.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, PlayCircle, Target } from "lucide-react";

interface Row {
  agent_slug: string;
  agent_name: string | null;
  total: number;
  hired: number;
  rate: number;
}

const AdminSimulationsPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-simulations-funnel"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("simulations")
        .select("agent_slug, agent_name, converted_to_hire")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const map = new Map<string, Row>();
      for (const r of data ?? []) {
        const key = r.agent_slug;
        const cur = map.get(key) ?? { agent_slug: key, agent_name: r.agent_name, total: 0, hired: 0, rate: 0 };
        cur.total += 1;
        if (r.converted_to_hire) cur.hired += 1;
        map.set(key, cur);
      }
      const rows = Array.from(map.values()).map((r) => ({
        ...r,
        rate: r.total > 0 ? (r.hired / r.total) * 100 : 0,
      }));
      return rows.sort((a, b) => b.total - a.total);
    },
  });

  const totals = data?.reduce(
    (acc, r) => ({ total: acc.total + r.total, hired: acc.hired + r.hired }),
    { total: 0, hired: 0 },
  );
  const overallRate = totals && totals.total > 0 ? (totals.hired / totals.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" /> Simulações totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Convertidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totals?.hired ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Taxa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overallRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Funil por agente</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma simulação ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Simulações</TableHead>
                  <TableHead className="text-right">Contratações</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r) => (
                  <TableRow key={r.agent_slug}>
                    <TableCell className="font-medium">
                      {r.agent_name || r.agent_slug}
                      <span className="block text-[10px] text-muted-foreground font-mono">{r.agent_slug}</span>
                    </TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right">{r.hired}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.rate >= 20 ? "default" : "outline"}>
                        {r.rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSimulationsPanel;
