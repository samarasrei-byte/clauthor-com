/**
 * AdminSimulationsPanel — Funil simulação → contratação por agente + drill-down.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, PlayCircle, Target, Eye, AlertTriangle, Lightbulb, Check, Wand2 } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Period = "7d" | "30d" | "90d" | "all";

interface Row {
  agent_slug: string;
  agent_name: string | null;
  total: number;
  hired: number;
  rate: number;
}

interface Simulation {
  id: string;
  agent_slug: string;
  agent_name: string | null;
  context: string;
  projection: any;
  converted_to_hire: boolean;
  created_at: string;
}

const PERIOD_DAYS: Record<Period, number | null> = { "7d": 7, "30d": 30, "90d": 90, all: null };

interface Analysis {
  patterns?: { label: string; count: number; examples: string[] }[];
  objections?: string[];
  recommendations?: { title: string; action: string; impact: string }[];
}

const AdminSimulationsPanel = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [drillSlug, setDrillSlug] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [appliedIdx, setAppliedIdx] = useState<Set<number>>(new Set());

  const applyRecommendation = async (idx: number, rec: NonNullable<Analysis["recommendations"]>[number]) => {
    if (!drillSlug) return;
    setApplyingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("apply-recommendation", {
        body: { agentSlug: drillSlug, recommendation: rec },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Recomendação aplicada · v${data.version}`);
      setAppliedIdx((s) => new Set(s).add(idx));
    } catch (e) {
      console.error(e);
      toast.error("Falha ao aplicar recomendação.");
    } finally {
      setApplyingIdx(null);
    }
  };

  const runAnalysis = async (force = false) => {
    if (!drillSlug || !drillRows || drillRows.length < 2) return;
    setAnalyzing(true);
    if (force) setAnalysis(null);

    // Try cache first
    if (!force) {
      const { data: cached } = await supabase
        .from("simulation_insights")
        .select("analysis, updated_at")
        .eq("agent_slug", drillSlug)
        .eq("period", period)
        .maybeSingle();
      if (cached) {
        setAnalysis(cached.analysis as Analysis);
        setCachedAt(cached.updated_at);
        setAnalyzing(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke("analyze-objections", {
        body: { agentSlug: drillSlug, contexts: drillRows.map((r) => r.context) },
      });
      if (error) throw error;
      setAnalysis(data);
      setCachedAt(new Date().toISOString());
      await supabase.from("simulation_insights").upsert(
        {
          agent_slug: drillSlug,
          period,
          analysis: data,
          sample_size: drillRows.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "agent_slug,period" },
      );
    } catch (e) {
      console.error(e);
      toast.error("Análise falhou. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const sinceIso = (() => {
    const d = PERIOD_DAYS[period];
    if (!d) return null;
    return new Date(Date.now() - d * 86400_000).toISOString();
  })();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-simulations-funnel", period],
    queryFn: async (): Promise<Row[]> => {
      let q = supabase
        .from("simulations")
        .select("agent_slug, agent_name, converted_to_hire")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (sinceIso) q = q.gte("created_at", sinceIso);
      const { data, error } = await q;
      if (error) throw error;
      const map = new Map<string, Row>();
      for (const r of data ?? []) {
        const cur = map.get(r.agent_slug) ?? {
          agent_slug: r.agent_slug,
          agent_name: r.agent_name,
          total: 0,
          hired: 0,
          rate: 0,
        };
        cur.total += 1;
        if (r.converted_to_hire) cur.hired += 1;
        map.set(r.agent_slug, cur);
      }
      return Array.from(map.values())
        .map((r) => ({ ...r, rate: r.total > 0 ? (r.hired / r.total) * 100 : 0 }))
        .sort((a, b) => b.total - a.total);
    },
  });

  const { data: drillRows, isLoading: drillLoading } = useQuery({
    queryKey: ["admin-simulations-drill", drillSlug, period],
    enabled: !!drillSlug,
    queryFn: async (): Promise<Simulation[]> => {
      let q = supabase
        .from("simulations")
        .select("id, agent_slug, agent_name, context, projection, converted_to_hire, created_at")
        .eq("agent_slug", drillSlug!)
        .eq("converted_to_hire", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (sinceIso) q = q.gte("created_at", sinceIso);
      const { data, error } = await q;
      if (error) throw error;
      return data as Simulation[];
    },
  });

  // Auto-load cache when drill opens; auto-regenerate if stale (>7d) or sample size drifted (>20%)
  useEffect(() => {
    if (!drillSlug) {
      setAnalysis(null);
      setCachedAt(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("simulation_insights")
        .select("analysis, updated_at, sample_size")
        .eq("agent_slug", drillSlug)
        .eq("period", period)
        .maybeSingle();
      if (data) {
        setAnalysis(data.analysis as Analysis);
        setCachedAt(data.updated_at);
        const ageDays = (Date.now() - new Date(data.updated_at).getTime()) / 86400_000;
        const currentSize = drillRows?.length ?? 0;
        const drift = data.sample_size > 0
          ? Math.abs(currentSize - data.sample_size) / data.sample_size
          : 0;
        if (currentSize >= 2 && (ageDays > 7 || drift > 0.2)) {
          runAnalysis(true);
        }
      } else {
        setAnalysis(null);
        setCachedAt(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillSlug, period, drillRows?.length]);


  const totals = data?.reduce(
    (acc, r) => ({ total: acc.total + r.total, hired: acc.hired + r.hired }),
    { total: 0, hired: 0 },
  );
  const overallRate = totals && totals.total > 0 ? (totals.hired / totals.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Funil de Simulações</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs">7d</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs">90d</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" /> Simulações
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{totals?.total ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Convertidas
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-primary">{totals?.hired ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Taxa
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{overallRate.toFixed(1)}%</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Por agente</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma simulação no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Sim.</TableHead>
                  <TableHead className="text-right">Contr.</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Objeções</TableHead>
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
                      <Badge variant={r.rate >= 20 ? "default" : "outline"}>{r.rate.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.total - r.hired > 0 && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setDrillSlug(r.agent_slug)}>
                          <Eye className="h-3 w-3" /> {r.total - r.hired}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={!!drillSlug}
        onOpenChange={(v) => {
          if (!v) {
            setDrillSlug(null);
            setAnalysis(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-6 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">Drill-down · Não convertidas</p>
            <SheetTitle className="flex items-center justify-between gap-3 mt-1">
              <span className="font-mono text-sm truncate">{drillSlug}</span>
              {drillRows && drillRows.length >= 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-primary/30 text-primary shrink-0"
                  disabled={analyzing}
                  onClick={() => runAnalysis(!!analysis)}
                >
                  {analyzing ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando…</>
                  ) : analysis ? (
                    <><Sparkles className="h-3.5 w-3.5" /> Refazer análise</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Analisar objeções</>
                  )}
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 py-5 space-y-5">
            {analysis && (
              <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent p-4 space-y-4">
                {cachedAt && (
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Cache · {new Date(cachedAt).toLocaleString("pt-BR")}
                  </p>
                )}
                {analysis.patterns && analysis.patterns.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Padrões
                    </p>
                    <ul className="space-y-1 text-sm">
                      {analysis.patterns.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Badge variant="outline" className="text-[10px]">{p.count}</Badge>
                          <span>{p.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.objections && analysis.objections.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Objeções
                    </p>
                    <ul className="space-y-1 text-sm list-disc list-inside marker:text-muted-foreground/50">
                      {analysis.objections.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3 w-3" /> Recomendações
                    </p>
                    <ul className="space-y-2 text-sm">
                      <AnimatePresence initial={true}>
                        {analysis.recommendations.map((r, i) => {
                          const impact = (r.impact || "").toLowerCase();
                          const borderColor =
                            impact === "alto" ? "border-l-primary"
                            : impact === "médio" || impact === "medio" ? "border-l-amber-500"
                            : "border-l-muted-foreground/30";
                          return (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.06, duration: 0.25 }}
                              className={`rounded-r-lg border-l-2 ${borderColor} bg-background/70 pl-3 pr-2 py-2.5`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-semibold truncate">{r.title}</span>
                                  <Badge variant="outline" className="text-[9px] capitalize shrink-0 uppercase tracking-wider">{r.impact}</Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant={appliedIdx.has(i) ? "outline" : "default"}
                                  className="h-7 gap-1 shrink-0"
                                  disabled={applyingIdx !== null || appliedIdx.has(i)}
                                  onClick={() => applyRecommendation(i, r)}
                                >
                                  {applyingIdx === i ? (
                                    <><Loader2 className="h-3 w-3 animate-spin" /> Aplicando…</>
                                  ) : appliedIdx.has(i) ? (
                                    <><Check className="h-3 w-3" /> Aplicada</>
                                  ) : (
                                    <><Wand2 className="h-3 w-3" /> Aplicar</>
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{r.action}</p>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Registros
              </p>
              {drillLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : !drillRows || drillRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sem registros.</p>
              ) : (
                <div className="space-y-2">
                  {drillRows.map((s) => (
                    <div key={s.id} className="rounded-lg border border-border/40 p-3 text-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(s.created_at).toLocaleString("pt-BR")}
                        </span>
                        {s.projection?.confidence && (
                          <Badge variant="outline" className="text-[10px]">Conf.: {s.projection.confidence}</Badge>
                        )}
                      </div>
                      <p className="text-foreground/90 whitespace-pre-wrap">{s.context}</p>
                      {s.projection?.headline && (
                        <p className="text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">
                          Projeção: {s.projection.headline}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminSimulationsPanel;
