import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, ExternalLink, FileText, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

// ============================================================
// 1) FONTES E PREMISSAS
// ============================================================
const assumptions = [
  {
    metric: "Estágio Atual",
    badge: "MVP",
    value: "MVP em produção",
    note: "Plataforma 100% funcional com 225 agentes, 20 squads e clientes-piloto B2B onboardados em Q1/2026. Pré-receita recorrente: estamos validando ticket e ICP antes de abrir comercialização em escala.",
    source: "Dashboard interno Clauthor · ambiente de produção",
  },
  {
    metric: "MRR Projetado (12m)",
    badge: "Meta",
    value: "R$ 1,2M",
    note: "Projeção pós-Pré-Seed assumindo 800 tenants pagantes a ticket médio de R$ 150 com 10% em outcome-based pricing. Premissa conservadora vs. benchmark SaaS B2B LATAM.",
    source: "Modelo financeiro interno · cohort top-down + bottom-up",
  },
  {
    metric: "Ticket Médio Alvo",
    badge: "Validando",
    value: "R$ 150/mês",
    note: "Plano Starter + add-ons de squads. Upsell para R$ 280 com outcome-pricing já contratualizado em pilotos.",
    source: "Pilotos pagantes Q1–Q2 2026 (amostra <50 tenants)",
  },
  {
    metric: "CAC Modelado",
    badge: "Premissa",
    value: "R$ 90 blended",
    note: "Custo via G8 Prospect (WhatsApp + email outbound próprio) + tráfego pago LATAM. Margem para subir até R$ 180 mantendo LTV/CAC saudável.",
    source: "Meta Ads + WhatsApp Business API · testes iniciais 60d",
  },
  {
    metric: "LTV Modelado (24m)",
    badge: "Premissa",
    value: "R$ 3.600",
    note: "Churn mensal 4%, NRR 102% com expansion revenue. Modelo a ser recalibrado conforme cohorts maduram pós-Seed.",
    source: "Modelo cohort SaaS benchmark OpenView 2025",
  },
  {
    metric: "Infra Multi-idioma",
    badge: "Pronto",
    value: "14 idiomas",
    note: "Localização nativa via i18next já implementada — destrava expansão EU + LATAM sem refactor.",
    source: "Stack i18n do projeto · src/i18n/locales",
    link: "https://www.openviewpartners.com/2024-saas-benchmarks-report/",
  },
  {
    metric: "TAM — IA Workforce",
    badge: "Mercado",
    value: "US$ 47B em 2030",
    note: "CAGR de 44% para agentic AI segundo Gartner & McKinsey.",
    source: "Gartner Hype Cycle for AI 2025 · McKinsey State of AI 2025",
    link: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
  },
] as Array<{ metric: string; badge: string; value: string; note: string; source: string; link?: string }>;

export const SourcesSection = () => (
  <section id="fontes" className="py-32 px-6">
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Transparência</div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Fontes & Premissas</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Todo número apresentado nesta página tem origem rastreável. Auditoria aberta para due diligence.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {assumptions.map((a, i) => (
          <motion.div
            key={a.metric}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: (i % 2) * 0.08 }}
            className="p-6 rounded-2xl border border-border/60 bg-card/30 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{a.metric}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary">
                    {a.badge}
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">{a.value}</div>
              </div>
              <FileText className="h-4 w-4 text-primary mt-1 shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{a.note}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-border/40">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
                Fonte: {a.source}
              </span>
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors"
                  aria-label={`Abrir fonte de ${a.metric}`}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================================
// 2) GRÁFICOS DE UNIT ECONOMICS & PROJEÇÃO MRR/ARR
// ============================================================
const mrrSeries = [
  { m: "M1", mrr: 45, arr: 540 },
  { m: "M3", mrr: 75, arr: 900 },
  { m: "M6", mrr: 375, arr: 4500 },
  { m: "M9", mrr: 850, arr: 10200 },
  { m: "M12", mrr: 2250, arr: 27000 },
  { m: "M15", mrr: 4200, arr: 50400 },
  { m: "M18", mrr: 6750, arr: 81000 },
  { m: "M21", mrr: 10500, arr: 126000 },
  { m: "M24", mrr: 15000, arr: 180000 },
];

const ticketSeries = [
  { m: "M1", ticket: 150 },
  { m: "M6", ticket: 175 },
  { m: "M12", ticket: 210 },
  { m: "M18", ticket: 250 },
  { m: "M24", ticket: 280 },
];

const ltvCacSeries = [
  { name: "Clauthor", value: 40, fill: "hsl(var(--primary))" },
  { name: "SaaS Top Quartile", value: 5, fill: "hsl(var(--muted-foreground))" },
  { name: "SaaS Mediana", value: 3, fill: "hsl(var(--muted-foreground) / 0.5)" },
];

const paybackSeries = [
  { name: "Clauthor", months: 0.6, fill: "hsl(var(--primary))" },
  { name: "SaaS Top Quartile", months: 12, fill: "hsl(var(--muted-foreground))" },
  { name: "SaaS Mediana", months: 18, fill: "hsl(var(--muted-foreground) / 0.5)" },
];

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--foreground))" },
};

export const ChartsSection = () => (
  <section id="graficos" className="py-32 px-6 bg-card/30 border-y border-border/40">
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Visualização</div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">A Tese em Gráficos</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Por que R$ 200K por 10% é o melhor risco-retorno do mercado de IA brasileira.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* MRR / ARR */}
        <motion.div {...fadeUp} className="p-6 rounded-2xl border border-border/60 bg-background">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Projeção 24 meses</div>
            <h3 className="text-xl font-bold">MRR & ARR (R$ mil)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mrrSeries}>
              <defs>
                <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip {...chartTooltip} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#mrrFill)" name="MRR" />
              <Area type="monotone" dataKey="arr" stroke="hsl(var(--foreground))" strokeWidth={1} fillOpacity={0} name="ARR" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ticket médio */}
        <motion.div {...fadeUp} className="p-6 rounded-2xl border border-border/60 bg-background">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Expansão de receita</div>
            <h3 className="text-xl font-bold">Ticket Médio (R$/mês)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RLineChart data={ticketSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip {...chartTooltip} />
              <Line type="monotone" dataKey="ticket" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5 }} />
            </RLineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* LTV / CAC */}
        <motion.div {...fadeUp} className="p-6 rounded-2xl border border-border/60 bg-background">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Eficiência de capital</div>
            <h3 className="text-xl font-bold">LTV / CAC (x)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ltvCacSeries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {ltvCacSeries.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payback */}
        <motion.div {...fadeUp} className="p-6 rounded-2xl border border-border/60 bg-background">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Recuperação de CAC</div>
            <h3 className="text-xl font-bold">Payback (meses)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={paybackSeries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="months" radius={[0, 8, 8, 0]}>
                {paybackSeries.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  </section>
);

// ============================================================
// 3) TABELA DETALHADA DE CONCORRÊNCIA
// ============================================================
const detailedCompetitors = [
  {
    name: "Clauthor",
    ticket: "R$ 150–280",
    markets: "BR, AR, MX, CO, CL, PT, ES, IT, FR, DE, UK, US",
    langs: 14,
    valueProp: "Squads completos de 225 agentes com outcome pricing e audit criptográfico.",
    highlight: true,
  },
  {
    name: "Lindy AI",
    ticket: "US$ 49–299",
    markets: "US, UK, CA",
    langs: 1,
    valueProp: "Agentes isolados de automação, foco em workflows simples no-code.",
  },
  {
    name: "Relevance AI",
    ticket: "US$ 19–599",
    markets: "US, UK, AU",
    langs: 2,
    valueProp: "Templates de agentes com marketplace; fraco em compliance e LATAM.",
  },
  {
    name: "MultiOn",
    ticket: "US$ 20",
    markets: "US",
    langs: 1,
    valueProp: "Agente único de navegação web; sem orquestração de equipes.",
  },
  {
    name: "Adept",
    ticket: "Enterprise",
    markets: "US",
    langs: 1,
    valueProp: "Action model para empresas; preço alto e implementação longa.",
  },
  {
    name: "Cognosys",
    ticket: "US$ 15–99",
    markets: "US, EU",
    langs: 1,
    valueProp: "Workflows agentic personalizáveis; sem squads especializados.",
  },
  {
    name: "Cresta",
    ticket: "Enterprise",
    markets: "US, UK",
    langs: 3,
    valueProp: "AI para contact center; vertical único, sem multi-departamento.",
  },
];

export const CompetitorDetailSection = () => (
  <section id="concorrencia-detalhe" className="py-32 px-6">
    <div className="max-w-7xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Concorrência Detalhada</div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Clauthor vs 6 Players Globais</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ticket médio, mercados, idiomas e proposta de valor em uma única tabela.
        </p>
      </motion.div>

      <motion.div {...fadeUp} className="overflow-x-auto rounded-2xl border border-border/60 bg-card/30">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-card/60 border-b border-border/60">
            <tr className="text-left">
              <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Player</th>
              <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Ticket Médio</th>
              <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Mercados Atendidos</th>
              <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground text-center">Idiomas</th>
              <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Proposta de Valor</th>
            </tr>
          </thead>
          <tbody>
            {detailedCompetitors.map((c) => (
              <tr
                key={c.name}
                className={`border-b border-border/40 last:border-0 align-top ${c.highlight ? "bg-primary/5" : ""}`}
              >
                <td className={`p-4 font-semibold whitespace-nowrap ${c.highlight ? "text-primary" : ""}`}>
                  {c.name}
                  {c.highlight && " ⚡"}
                </td>
                <td className="p-4 text-foreground whitespace-nowrap">{c.ticket}</td>
                <td className="p-4 text-muted-foreground">{c.markets}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full text-xs font-bold ${c.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {c.langs}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground max-w-md">{c.valueProp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  </section>
);

// ============================================================
// 4) CALCULADORA DE FINANCIAMENTO
// ============================================================
const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const FundingCalculator = () => {
  const [preSeed, setPreSeed] = useState(200); // R$ mil
  const [equity, setEquity] = useState(10); // %
  const [cac, setCac] = useState(90); // R$
  const [initialMrr, setInitialMrr] = useState(45); // R$ mil
  const [growthRate, setGrowthRate] = useState(22); // % ao mês
  const [avgTicket, setAvgTicket] = useState(150); // R$
  const [churn, setChurn] = useState(4); // %

  const calc = useMemo(() => {
    const valuationPre = (preSeed / equity) * 100; // R$ mil
    const valuationPost = valuationPre + preSeed;
    const grossMargin = 0.82;
    const ltv = avgTicket / (churn / 100); // simples LTV
    const ltvCac = ltv / cac;
    const paybackMonths = cac / (avgTicket * grossMargin);

    const projection: { m: number; mrr: number; users: number }[] = [];
    let mrr = initialMrr * 1000;
    for (let m = 1; m <= 24; m++) {
      mrr = mrr * (1 + growthRate / 100);
      projection.push({
        m,
        mrr: Math.round(mrr),
        users: Math.round(mrr / avgTicket),
      });
    }
    const finalMrr = projection[projection.length - 1].mrr;
    const finalUsers = projection[projection.length - 1].users;
    const arr = finalMrr * 12;

    return {
      valuationPre,
      valuationPost,
      ltv,
      ltvCac,
      paybackMonths,
      projection,
      finalMrr,
      finalUsers,
      arr,
    };
  }, [preSeed, equity, cac, initialMrr, growthRate, avgTicket, churn]);

  return (
    <section id="calculadora" className="py-32 px-6 bg-card/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp} className="text-center mb-16">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Interativo</div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Calculadora de Financiamento</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ajuste pré-seed, equity, CAC e MRR payback e projeção de 24 meses recalculam em tempo real.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Controles */}
          <motion.div {...fadeUp} className="lg:col-span-2 p-6 rounded-2xl border border-border/60 bg-background space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Variáveis</h3>
            </div>

            {/* Pré-seed */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">Pré-seed</Label>
                <span className="font-mono text-sm text-primary">R$ {preSeed}K</span>
              </div>
              <Slider value={[preSeed]} onValueChange={(v) => setPreSeed(v[0])} min={100} max={1000} step={50} />
            </div>

            {/* Equity */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">% de Equity</Label>
                <span className="font-mono text-sm text-primary">{equity}%</span>
              </div>
              <Slider value={[equity]} onValueChange={(v) => setEquity(v[0])} min={5} max={25} step={1} />
            </div>

            {/* CAC */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">CAC</Label>
                <span className="font-mono text-sm text-primary">R$ {cac}</span>
              </div>
              <Slider value={[cac]} onValueChange={(v) => setCac(v[0])} min={20} max={500} step={10} />
            </div>

            {/* MRR inicial */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">MRR inicial</Label>
                <span className="font-mono text-sm text-primary">R$ {initialMrr}K</span>
              </div>
              <Slider value={[initialMrr]} onValueChange={(v) => setInitialMrr(v[0])} min={10} max={500} step={5} />
            </div>

            {/* Growth */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">Crescimento mensal</Label>
                <span className="font-mono text-sm text-primary">{growthRate}%</span>
              </div>
              <Slider value={[growthRate]} onValueChange={(v) => setGrowthRate(v[0])} min={5} max={40} step={1} />
            </div>

            {/* Ticket médio */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">Ticket médio</Label>
                <span className="font-mono text-sm text-primary">R$ {avgTicket}</span>
              </div>
              <Slider value={[avgTicket]} onValueChange={(v) => setAvgTicket(v[0])} min={50} max={1000} step={10} />
            </div>

            {/* Churn */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <Label className="text-sm">Churn mensal</Label>
                <span className="font-mono text-sm text-primary">{churn}%</span>
              </div>
              <Slider value={[churn]} onValueChange={(v) => setChurn(v[0])} min={1} max={15} step={1} />
            </div>
          </motion.div>

          {/* Resultados */}
          <motion.div {...fadeUp} className="lg:col-span-3 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { l: "Valuation pré", v: formatBRL(calc.valuationPre * 1000) },
                { l: "Valuation pós", v: formatBRL(calc.valuationPost * 1000) },
                { l: "Payback", v: `${calc.paybackMonths.toFixed(1)} m` },
                { l: "LTV / CAC", v: `${calc.ltvCac.toFixed(1)}x` },
              ].map((k) => (
                <div key={k.l} className="p-4 rounded-xl border border-border/60 bg-background">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{k.l}</div>
                  <div className="text-lg font-bold text-primary">{k.v}</div>
                </div>
              ))}
            </div>

            {/* Projeção 24m */}
            <div className="p-6 rounded-2xl border border-border/60 bg-background">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-1">Projeção 24 meses</div>
                  <h3 className="text-lg font-bold">MRR & Usuários</h3>
                </div>
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={calc.projection}>
                  <defs>
                    <linearGradient id="calcFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    {...chartTooltip}
                    formatter={(value: number, name) =>
                      name === "mrr" ? [formatBRL(value), "MRR"] : [value.toLocaleString("pt-BR"), "Usuários"]
                    }
                    labelFormatter={(l) => `Mês ${l}`}
                  />
                  <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#calcFill)" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">MRR M24</div>
                  <div className="text-xl font-bold">{formatBRL(calc.finalMrr)}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">ARR M24</div>
                  <div className="text-xl font-bold">{formatBRL(calc.arr)}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Usuários M24</div>
                  <div className="text-xl font-bold">{calc.finalUsers.toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
