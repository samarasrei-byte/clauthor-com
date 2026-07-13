import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Zap, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { regionalPricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Admin panel: unit economics per department.
 * Shows revenue vs AI cost (Claude Sonnet 4 + Haiku 3.5), infra, profit and margin %.
 * Interactive: adjust FX rate, Sonnet routing %, infra cost.
 */

interface DeptRow {
  key: keyof typeof regionalPricing.pt.departments;
  label: string;
  actionsPerMonth: number;
  /** Avg tokens per action, blended */
  avgInputTokens: number;
  avgOutputTokens: number;
}

// Realistic per-department profile based on typical workload
const DEPTS: DeptRow[] = [
  { key: "tecnologia", label: "Tecnologia",  actionsPerMonth: 8000,  avgInputTokens: 3500, avgOutputTokens: 1400 },
  { key: "comercial",  label: "Comercial",   actionsPerMonth: 12000, avgInputTokens: 1200, avgOutputTokens: 500 },
  { key: "financeiro", label: "Financeiro",  actionsPerMonth: 6000,  avgInputTokens: 1800, avgOutputTokens: 600 },
  { key: "marketing",  label: "Marketing",   actionsPerMonth: 11000, avgInputTokens: 1500, avgOutputTokens: 700 },
  { key: "criacao",    label: "Criação",     actionsPerMonth: 8000,  avgInputTokens: 2000, avgOutputTokens: 1200 },
  { key: "rh",         label: "RH",          actionsPerMonth: 5000,  avgInputTokens: 1200, avgOutputTokens: 500 },
  { key: "suporte",    label: "Suporte",     actionsPerMonth: 15000, avgInputTokens: 800,  avgOutputTokens: 350 },
];

// Model prices per 1M tokens (USD)
const SONNET = { input: 3, output: 15 };
const HAIKU  = { input: 0.8, output: 4 };

const AdminMarginAnalysis = () => {
  const [sonnetPct, setSonnetPct] = useState(30);   // % de tarefas roteadas para Sonnet
  const [fx, setFx] = useState(5.2);                // R$ por USD
  const [infra, setInfra] = useState(80);           // R$ infra fixa por cliente
  const [region, setRegion] = useState("pt");

  const rows = useMemo(() => {
    const pricing = regionalPricing[region] || regionalPricing.pt;
    const s = sonnetPct / 100;
    const h = 1 - s;

    return DEPTS.map((d) => {
      const price = pricing.departments[d.key];
      const inputTokensTotal = d.actionsPerMonth * d.avgInputTokens;   // total input tokens/mês
      const outputTokensTotal = d.actionsPerMonth * d.avgOutputTokens;

      // Custo USD com roteamento sonnet/haiku
      const costUSD =
        (inputTokensTotal / 1_000_000) * (s * SONNET.input + h * HAIKU.input) +
        (outputTokensTotal / 1_000_000) * (s * SONNET.output + h * HAIKU.output);

      const aiCostBRL = costUSD * fx;
      const totalCost = aiCostBRL + infra;
      const profit = price - totalCost;
      const margin = price > 0 ? (profit / price) * 100 : 0;

      // Custo se rodasse 100% Sonnet
      const worstCostUSD =
        (inputTokensTotal / 1_000_000) * SONNET.input +
        (outputTokensTotal / 1_000_000) * SONNET.output;
      const worstMargin = ((price - worstCostUSD * fx - infra) / price) * 100;

      return { ...d, price, aiCostBRL, totalCost, profit, margin, worstMargin, symbol: pricing.symbol };
    });
  }, [sonnetPct, fx, infra, region]);

  const totals = useMemo(() => {
    const revenue = rows.reduce((a, r) => a + r.price, 0);
    const cost = rows.reduce((a, r) => a + r.totalCost, 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, cost, profit, margin };
  }, [rows]);

  const symbol = rows[0]?.symbol || "R$";
  const fmt = (n: number) => `${symbol} ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

  const marginColor = (m: number) =>
    m >= 70 ? "text-emerald-500" : m >= 55 ? "text-amber-500" : "text-red-500";
  const marginBg = (m: number) =>
    m >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : m >= 55 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Análise de Margem por Departamento</h2>
          <Badge variant="outline" className="text-[10px]">Unit Economics</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Base para precificação. Ajuste os parâmetros para simular cenários de custo de IA vs receita mensal.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Receita total (1 cliente/depto)</div>
          <div className="text-xl font-bold">{fmt(totals.revenue)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Custo total</div>
          <div className="text-xl font-bold text-muted-foreground">{fmt(totals.cost)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Lucro</div>
          <div className="text-xl font-bold text-emerald-500">{fmt(totals.profit)}</div>
        </CardContent></Card>
        <Card className={cn("border", marginBg(totals.margin))}><CardContent className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Margem média</div>
          <div className={cn("text-xl font-bold", marginColor(totals.margin))}>{totals.margin.toFixed(1)}%</div>
        </CardContent></Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Parâmetros da simulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={region} onValueChange={setRegion}>
            <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto">
              {Object.keys(regionalPricing).slice(0, 8).map((r) => (
                <TabsTrigger key={r} value={r} className="text-[10px] uppercase">{r}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">% Sonnet 4 (vs Haiku 3.5)</label>
                <span className="text-xs font-mono text-primary">{sonnetPct}%</span>
              </div>
              <Slider value={[sonnetPct]} onValueChange={(v) => setSonnetPct(v[0])} min={0} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground">Roteamento: {sonnetPct}% tarefas complexas → Sonnet, resto → Haiku (5-6x mais barato)</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Câmbio R$/USD</label>
                <span className="text-xs font-mono text-primary">R$ {fx.toFixed(2)}</span>
              </div>
              <Slider value={[fx * 100]} onValueChange={(v) => setFx(v[0] / 100)} min={400} max={700} step={5} />
              <p className="text-[10px] text-muted-foreground">Usado para converter custo de tokens USD → moeda local</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Infra fixa/cliente</label>
                <span className="text-xs font-mono text-primary">{fmt(infra)}</span>
              </div>
              <Slider value={[infra]} onValueChange={(v) => setInfra(v[0])} min={0} max={300} step={10} />
              <p className="text-[10px] text-muted-foreground">Supabase, storage, embeddings, edge functions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Detalhamento por departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left py-2 pr-3">Depto</th>
                  <th className="text-right py-2 px-2">Preço</th>
                  <th className="text-right py-2 px-2">Ações/mês</th>
                  <th className="text-right py-2 px-2">Custo IA</th>
                  <th className="text-right py-2 px-2">Custo total</th>
                  <th className="text-right py-2 px-2">Lucro</th>
                  <th className="text-right py-2 px-2">Margem</th>
                  <th className="text-right py-2 pl-2">Pior caso*</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-3 font-medium">{r.label}</td>
                    <td className="text-right py-3 px-2 tabular-nums">{fmt(r.price)}</td>
                    <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">{r.actionsPerMonth.toLocaleString("pt-BR")}</td>
                    <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">{fmt(r.aiCostBRL)}</td>
                    <td className="text-right py-3 px-2 tabular-nums text-muted-foreground">{fmt(r.totalCost)}</td>
                    <td className="text-right py-3 px-2 tabular-nums text-emerald-500 font-semibold">{fmt(r.profit)}</td>
                    <td className="text-right py-3 px-2">
                      <span className={cn("font-bold tabular-nums", marginColor(r.margin))}>{r.margin.toFixed(1)}%</span>
                    </td>
                    <td className="text-right py-3 pl-2">
                      <span className={cn("text-[10px] tabular-nums", marginColor(r.worstMargin))}>{r.worstMargin.toFixed(0)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/30 font-bold">
                  <td className="py-3 pr-3">Total</td>
                  <td className="text-right py-3 px-2 tabular-nums">{fmt(totals.revenue)}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right py-3 px-2 tabular-nums">{fmt(totals.cost)}</td>
                  <td className="text-right py-3 px-2 tabular-nums text-emerald-500">{fmt(totals.profit)}</td>
                  <td className="text-right py-3 px-2">
                    <span className={cn("tabular-nums", marginColor(totals.margin))}>{totals.margin.toFixed(1)}%</span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            *Pior caso = margem se 100% das ações fossem roteadas para Sonnet 4 (sem Haiku). Serve como piso de segurança em picos de uso.
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-500">Regras para preservar margem</p>
            <ul className="space-y-0.5 text-muted-foreground list-disc list-inside">
              <li>Departamentos com margem &lt; 55% (vermelho) precisam de rate limit + overage transparente.</li>
              <li>Roteamento inteligente (Sonnet apenas para tarefas complexas) é obrigatório · sem isso, Suporte e Criação viram prejuízo.</li>
              <li>Alerta ao cliente ao atingir 80% do consumo evita surpresa e churn.</li>
              <li>Cache semântico + contexto comprimido reduzem input tokens em 40-60%.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <DollarSign className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            Preços vêm de <code className="bg-muted px-1 rounded">src/lib/pricing.ts</code> · edite lá para ver o impacto aqui em tempo real.
            Perfis de uso (tokens/ação) são estimativas médias por depto; ajuste em <code className="bg-muted px-1 rounded">AdminMarginAnalysis.tsx</code> conforme dados reais forem coletados de <code className="bg-muted px-1 rounded">token_usage</code>.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminMarginAnalysis;
