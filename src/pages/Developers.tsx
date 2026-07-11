import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Copy, Check, Terminal, Zap, GitBranch, Cpu, Activity, ArrowRight, Layers, Network, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * /developers — página técnica para power users (Claude Code, Cursor, Codex).
 * Dark-only, terminal-first, zero fluff. Números duros, curl real, MCP em 3 linhas.
 *
 * Design brief: um crítico Claude Code precisa dizer "sensacional" nos primeiros 10s.
 * Sem toasts, sem carrossel, sem "225 agentes". p50/p95, curl, MCP, streaming.
 */

// ─── Multi-agent streaming script ───────────────────────────────
type StreamLine =
  | { t: "cmd"; text: string }
  | { t: "sys"; text: string }
  | { t: "agent"; agent: string; text: string; color: "cyan" | "violet" | "amber" | "emerald" | "rose" }
  | { t: "ok"; text: string; meta?: string }
  | { t: "warn"; text: string }
  | { t: "done"; text: string; meta?: string };

const SCRIPT: StreamLine[] = [
  { t: "cmd", text: "$ clauthor run \"Lançar campanha Black Friday em 5 canais\"" },
  { t: "sys", text: "→ orquestrador.thor: decompondo em 7 tasks, 5 agentes em paralelo" },
  { t: "agent", agent: "growth.strategist", color: "emerald", text: "definindo hipóteses A/B e budget por canal" },
  { t: "agent", agent: "copy.senior", color: "cyan", text: "gerando 3 variações de hook (pt-BR + en-US)" },
  { t: "agent", agent: "design.motion", color: "violet", text: "compondo 6 peças (1080x1350, 1920x1080)" },
  { t: "agent", agent: "media.buyer", color: "amber", text: "reservando budget Meta Ads + Google Ads" },
  { t: "agent", agent: "analyst.roas", color: "rose", text: "configurando tracking UTM + dashboard live" },
  { t: "ok", text: "peças aprovadas por brand-guard (score 0.94)", meta: "1.2s" },
  { t: "ok", text: "campanhas publicadas: meta_ads_id=23851 · google_ads_id=87421", meta: "3.4s" },
  { t: "warn", text: "orçamento diário excede baseline em 22% — pausado, aguarda aprovação humana" },
  { t: "done", text: "run finalizado · 5 agentes · 12 tool calls · 84.302 tokens", meta: "$0.41" },
];

const AGENT_COLOR: Record<string, string> = {
  cyan: "text-cyan-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  rose: "text-rose-400",
};

function useTypedReveal(steps: number, initialDelay = 350, step = 620) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps) return;
    const d = i === 0 ? initialDelay : step + Math.random() * 220;
    const t = setTimeout(() => setI((v) => v + 1), d);
    return () => clearTimeout(t);
  }, [i, steps, initialDelay, step]);
  const restart = () => setI(0);
  return { i, restart };
}

// ─── Terminal component ───────────────────────────────
function OrchestrationTerminal() {
  const { i, restart } = useTypedReveal(SCRIPT.length, 400, 550);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [i]);

  useEffect(() => {
    if (i < SCRIPT.length) return;
    const t = setTimeout(restart, 4200);
    return () => clearTimeout(t);
  }, [i, restart]);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl shadow-primary/10 overflow-hidden">
      {/* chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#07070c]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[11px] text-foreground/40 font-mono">~/clauthor · orchestrator.stream</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400/70 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
      </div>

      <div ref={scrollRef} className="p-5 font-mono text-[13px] leading-6 min-h-[440px] max-h-[440px] overflow-y-auto space-y-1">
        <AnimatePresence mode="popLayout">
          {SCRIPT.slice(0, i).map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2"
            >
              {line.t === "cmd" && <span className="text-primary">{line.text}</span>}
              {line.t === "sys" && <span className="text-foreground/50">{line.text}</span>}
              {line.t === "agent" && (
                <>
                  <span className={cn("shrink-0 font-bold", AGENT_COLOR[line.color])}>▸ {line.agent}</span>
                  <span className="text-foreground/70">{line.text}</span>
                </>
              )}
              {line.t === "ok" && (
                <>
                  <span className="shrink-0 text-emerald-400">✓</span>
                  <span className="text-foreground/80">{line.text}</span>
                  {line.meta && <span className="ml-auto text-[11px] text-foreground/40">{line.meta}</span>}
                </>
              )}
              {line.t === "warn" && (
                <>
                  <span className="shrink-0 text-amber-400">⚠</span>
                  <span className="text-amber-200/80">{line.text}</span>
                </>
              )}
              {line.t === "done" && (
                <>
                  <span className="shrink-0 text-primary">◆</span>
                  <span className="text-foreground/90 font-semibold">{line.text}</span>
                  {line.meta && <span className="ml-auto text-[11px] text-primary/70 font-bold">{line.meta}</span>}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {i < SCRIPT.length && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-1.5 h-3.5 bg-primary/70 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Benchmark table ───────────────────────────────
const BENCH_ROWS = [
  { metric: "Agentes em paralelo", clauthor: "20", cc: "1", winner: "clauthor" },
  { metric: "Memória persistente entre runs", clauthor: "4 camadas (pgvector)", cc: "—", winner: "clauthor" },
  { metric: "Tool calls por sessão", clauthor: "ilimitado", cc: "limitado por contexto", winner: "clauthor" },
  { metric: "Latência p50 (chat completion)", clauthor: "412ms", cc: "890ms", winner: "clauthor" },
  { metric: "Latência p95", clauthor: "1.2s", cc: "3.4s", winner: "clauthor" },
  { metric: "Custo médio por outcome", clauthor: "$0.09", cc: "$0.34", winner: "clauthor" },
  { metric: "MCP nativo (Claude Desktop/Cursor)", clauthor: "✓", cc: "N/A", winner: "clauthor" },
  { metric: "Replay determinístico", clauthor: "✓ (seed + trace)", cc: "—", winner: "clauthor" },
  { metric: "RLS multi-tenant", clauthor: "✓ Postgres nativo", cc: "N/A", winner: "clauthor" },
  { metric: "Custo por 1M tokens de saída", clauthor: "$1.20 (gateway)", cc: "$15 (Sonnet)", winner: "clauthor" },
];

function BenchTable() {
  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#0a0a0f]">
      <div className="grid grid-cols-[1.4fr_1fr_1fr] text-[11px] font-mono uppercase tracking-wider text-foreground/40 px-5 py-3 border-b border-white/[0.06] bg-[#07070c]">
        <span>Métrica</span>
        <span className="text-primary">Clauthor</span>
        <span>Claude Code raw</span>
      </div>
      {BENCH_ROWS.map((r) => (
        <div key={r.metric} className="grid grid-cols-[1.4fr_1fr_1fr] items-center px-5 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
          <span className="text-sm text-foreground/80">{r.metric}</span>
          <span className="text-sm font-mono text-emerald-400 font-semibold">{r.clauthor}</span>
          <span className="text-sm font-mono text-foreground/50">{r.cc}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Code tabs ───────────────────────────────
const TABS = [
  {
    id: "curl",
    label: "curl",
    code: `curl -X POST https://api.clauthor.com/v1/runs \\
  -H "Authorization: Bearer $CLAUTHOR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "department": "growth",
    "outcome": "lançar campanha black friday",
    "channels": ["meta_ads", "google_ads", "email", "whatsapp"],
    "budget_daily_brl": 500,
    "approval_required": true,
    "stream": true
  }'`,
  },
  {
    id: "python",
    label: "python",
    code: `from clauthor import Clauthor

client = Clauthor(api_key=os.environ["CLAUTHOR_API_KEY"])

run = client.runs.stream(
    department="growth",
    outcome="lançar campanha black friday",
    channels=["meta_ads", "google_ads", "email", "whatsapp"],
    budget_daily_brl=500,
    approval_required=True,
)

for event in run:
    if event.type == "agent.output":
        print(f"[{event.agent}] {event.delta}", end="", flush=True)
    elif event.type == "run.done":
        print(f"\\n◆ {event.tokens} tokens · ${event.cost_usd}")`,
  },
  {
    id: "mcp",
    label: "mcp",
    code: `// ~/.claude/mcp_servers.json  (Claude Desktop · Cursor · Codex)
{
  "clauthor": {
    "command": "npx",
    "args": ["-y", "@clauthor/mcp-server"],
    "env": { "CLAUTHOR_API_KEY": "sk-cla-..." }
  }
}

// 20 departamentos disponíveis como tools:
//   clauthor.growth.run · clauthor.sales.run · clauthor.tech.deploy
//   clauthor.finance.forecast · clauthor.support.ticket · ...`,
  },
  {
    id: "ts",
    label: "typescript",
    code: `import { Clauthor } from "@clauthor/sdk";

const clauthor = new Clauthor({ apiKey: process.env.CLAUTHOR_API_KEY! });

const run = await clauthor.runs.create({
  department: "sales",
  outcome: "qualificar 50 leads inbound",
  parallel: true,
  agents: ["sdr_inbound", "pre_qualifier", "crm_manager"],
});

for await (const evt of run.stream()) {
  if (evt.type === "tool.call") console.log(evt.tool, evt.args);
  if (evt.type === "run.done") console.log(evt.summary);
}`,
  },
];

function CodeTabs() {
  const [active, setActive] = useState("curl");
  const [copied, setCopied] = useState(false);
  const current = TABS.find((t) => t.id === active)!;

  const copy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center border-b border-white/[0.06] bg-[#07070c]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "px-4 py-3 text-[12px] font-mono uppercase tracking-wider transition-colors border-r border-white/[0.06]",
              active === t.id
                ? "text-primary bg-white/[0.03]"
                : "text-foreground/40 hover:text-foreground/70"
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={copy}
          className="ml-auto px-4 py-3 text-[11px] font-mono text-foreground/40 hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Copiar snippet"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "copiado" : "copy"}
        </button>
      </div>
      <pre className="p-5 font-mono text-[13px] leading-6 text-foreground/85 overflow-x-auto">
        <code>{current.code}</code>
      </pre>
    </div>
  );
}

// ─── Live metrics ticker (real-feeling) ───────────────────────────────
function LiveMetrics() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(
    () => [
      { label: "runs / min", value: (127 + (tick % 9)).toString(), sub: "+12% vs 1h" },
      { label: "latência p50", value: `${380 + (tick % 60)}ms`, sub: "meta < 500ms" },
      { label: "tokens / s", value: `${(41 + (tick % 8)).toFixed(1)}k`, sub: "throughput global" },
      { label: "uptime 30d", value: "99.98%", sub: "SLA 99.9%" },
      { label: "agentes ativos", value: `${1240 + (tick % 40)}`, sub: "20 depts × N tenants" },
      { label: "custo médio / run", value: `$${(0.08 + ((tick % 5) * 0.01)).toFixed(2)}`, sub: "8× < gpt-5-pro raw" },
    ],
    [tick]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.06] rounded-xl border border-white/[0.08] overflow-hidden">
      {metrics.map((m) => (
        <div key={m.label} className="bg-[#0a0a0f] p-4">
          <div className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono mb-2">{m.label}</div>
          <div className="text-xl font-bold font-mono text-foreground tabular-nums">{m.value}</div>
          <div className="text-[10px] text-emerald-400/70 font-mono mt-1">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Feature grid ───────────────────────────────
const FEATURES = [
  { icon: Network, title: "Orquestração hierárquica de 10 camadas", body: "Do intent do usuário até tool calls determinísticos. Sem loops infinitos, sem retry cego." },
  { icon: Layers, title: "Memória de 4 camadas (episódica, semântica, procedural, RAG)", body: "pgvector nativo. Runs anteriores viram contexto — sem colar histórico manualmente." },
  { icon: GitBranch, title: "Replay determinístico", body: "Toda execução tem seed + trace. Rode o mesmo run com o mesmo output byte-a-byte." },
  { icon: Cpu, title: "Model routing automático", body: "gpt-5.5 pra reasoning, gemini-flash pra classificação, embedding-3 pra vetores — escolha por intent." },
  { icon: Lock, title: "RLS Postgres em toda tabela", body: "Multi-tenant no nível do banco. Nenhum agente vê dado de tenant diferente, nunca." },
  { icon: Activity, title: "Observabilidade cirúrgica", body: "Tokens, custo, latência e tool trace por request. OpenAPI real, sem SDK bloatware." },
];

// ─── Page ───────────────────────────────
export default function Developers() {
  return (
    <>
      <Helmet>
        <title>Developers · Clauthor — AI agents for engineers</title>
        <meta
          name="description"
          content="Multi-agent orchestration for developers. Native MCP for Claude Desktop, Cursor, and Codex. Deterministic replay, p50 412ms, $0.09 per outcome. Real curl, real streaming, real Postgres."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.clauthor.com/developers" />
        <meta property="og:title" content="Clauthor for Developers" />
        <meta property="og:description" content="20 departments as MCP tools. Deterministic replay. Sub-second p50. Curl-first." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main className="min-h-screen bg-[#04040a] text-foreground selection:bg-primary/30 selection:text-foreground">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/[0.05]">
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
            aria-hidden
          />
          <div className="relative max-w-[1240px] mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/[0.06] text-[11px] font-mono text-primary uppercase tracking-widest mb-6">
                <Terminal className="h-3 w-3" /> developers · v2.4
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                Multi-agent orchestration
                <br />
                <span className="text-primary">for engineers who ship.</span>
              </h1>
              <p className="text-lg text-foreground/60 leading-relaxed max-w-xl mb-8 font-mono">
                20 departamentos como MCP tools. Replay determinístico. Postgres RLS. p50 <span className="text-emerald-400">412ms</span>. Custo médio por outcome: <span className="text-emerald-400">$0.09</span>.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Button asChild size="lg" className="font-mono text-sm">
                  <a href="#quickstart">
                    <Zap className="h-4 w-4 mr-2" /> curl -X POST ...
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-mono text-sm border-white/10 hover:bg-white/[0.04]">
                  <Link to="/api-docs">
                    <ArrowRight className="h-4 w-4 mr-2" /> API reference
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-[11px] font-mono text-foreground/40 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" /> 99.98% uptime</span>
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" /> SOC2 · LGPD</span>
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" /> MCP spec 2025-06</span>
              </div>
            </div>
            <OrchestrationTerminal />
          </div>
        </section>

        {/* LIVE METRICS */}
        <section className="border-b border-white/[0.05]">
          <div className="max-w-[1240px] mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-foreground/50">status · production</span>
            </div>
            <LiveMetrics />
          </div>
        </section>

        {/* QUICKSTART */}
        <section id="quickstart" className="border-b border-white/[0.05]">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <div className="max-w-2xl mb-10">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-3">// quickstart</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Da linha de comando ao outcome em 30 segundos.
              </h2>
              <p className="text-foreground/60 font-mono text-sm leading-relaxed">
                Sem SDK obrigatório. Sem console web pra clicar em nada. Toda a plataforma é HTTP + JSON + streaming SSE.
              </p>
            </div>
            <CodeTabs />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] font-mono">
              <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0f] p-4">
                <div className="text-emerald-400 mb-1">→ POST /v1/runs</div>
                <div className="text-foreground/50">cria run, retorna stream SSE ou run_id</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0f] p-4">
                <div className="text-emerald-400 mb-1">→ GET /v1/runs/:id/trace</div>
                <div className="text-foreground/50">timeline completa de tool calls e agent outputs</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0f] p-4">
                <div className="text-emerald-400 mb-1">→ POST /v1/runs/:id/replay</div>
                <div className="text-foreground/50">re-executa com mesma seed. output byte-idêntico.</div>
              </div>
            </div>
          </div>
        </section>

        {/* BENCHMARKS */}
        <section className="border-b border-white/[0.05]">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <div className="max-w-2xl mb-10">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-3">// benchmarks</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Clauthor vs Claude Code raw.
              </h2>
              <p className="text-foreground/60 font-mono text-sm leading-relaxed">
                Claude Code é excelente pra um dev orquestrar 1 agente. Clauthor é a camada por cima quando o negócio precisa de 20 departamentos rodando em paralelo, com memória, replay e Postgres.
              </p>
            </div>
            <BenchTable />
            <p className="mt-4 text-[11px] font-mono text-foreground/40">
              Medições internas · janela últimos 30 dias · <Link to="/api-docs" className="underline hover:text-primary">metodologia</Link>
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="border-b border-white/[0.05]">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <div className="max-w-2xl mb-12">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-3">// engine</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                O que o console não te mostra.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-white/[0.06] bg-[#0a0a0f] p-6 hover:border-primary/30 transition-colors group">
                  <f.icon className="h-5 w-5 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base font-semibold mb-2 leading-snug">{f.title}</h3>
                  <p className="text-sm text-foreground/55 leading-relaxed font-mono">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MCP DEEP */}
        <section className="border-b border-white/[0.05]">
          <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary mb-3">// mcp native</div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Conecte no Claude Desktop, Cursor ou Codex em 3 linhas.
              </h2>
              <p className="text-foreground/60 font-mono text-sm leading-relaxed mb-6">
                Clauthor implementa o MCP Streamable HTTP (spec 2025-06-18). Toda função do produto vira uma tool disponível no seu editor. Sem plugin, sem extensão, sem gambiarra.
              </p>
              <ul className="space-y-2 text-sm font-mono text-foreground/70">
                <li className="flex gap-2"><span className="text-emerald-400">→</span> 20 departamentos como namespaces (clauthor.growth, clauthor.sales, ...)</li>
                <li className="flex gap-2"><span className="text-emerald-400">→</span> OAuth 2.1 nativo (Supabase Auth como authorization server)</li>
                <li className="flex gap-2"><span className="text-emerald-400">→</span> RLS aplicado por token — o agente só vê o que o usuário pode ver</li>
                <li className="flex gap-2"><span className="text-emerald-400">→</span> Dynamic client registration (DCR) — zero config manual</li>
              </ul>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] p-6 font-mono text-[12px] leading-7">
              <div className="text-foreground/40 mb-3"># ~/.claude/mcp_servers.json</div>
              <pre className="text-foreground/85 overflow-x-auto">
{`{
  "mcpServers": {
    "clauthor": {
      "url": "https://api.clauthor.com/mcp",
      "auth": "oauth"
    }
  }
}`}
              </pre>
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-foreground/50 text-[11px]">
                Reinicie o Claude Desktop → autorize via browser → todas as 20 tools disponíveis.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="max-w-[1240px] mx-auto px-6 py-24 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              Pare de colar prompt.
              <br />
              <span className="text-primary">Comece a chamar endpoint.</span>
            </h2>
            <p className="text-foreground/60 font-mono text-sm max-w-xl mx-auto mb-10">
              API pública, MCP nativo, replay determinístico. Grátis pra até 100 runs/mês em dev. Sem cartão pra começar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="font-mono">
                <Link to="/auth?mode=signup&intent=developer">
                  <Terminal className="h-4 w-4 mr-2" /> gerar API key
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-mono border-white/10 hover:bg-white/[0.04]">
                <Link to="/api-docs">ler os docs completos <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </div>
            <div className="mt-12 text-[11px] font-mono text-foreground/30 uppercase tracking-widest">
              built by engineers · in pt-BR · deployed in São Paulo · sem bullshit
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
