#!/usr/bin/env node
/**
 * CLAUTHOR — Stress test da orquestração Thor + agentes.
 *
 * Uso:
 *   USER_JWT=<seu access_token> node scripts/stress-thor.mjs \
 *     --vus=20 --duration=30 --scenario=orchestration
 *
 * Flags:
 *   --vus         Usuários virtuais concorrentes (default 10)
 *   --duration    Duração em segundos (default 20)
 *   --scenario    orchestration | agent-chat | mixed  (default mixed)
 *
 * Requer USER_JWT (login válido) para invocar edge functions autenticadas.
 * Sem JWT, roda em modo "smoke" contra rotas públicas apenas.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ihzfwkiqkwbgbgjjbeih.supabase.co";
const ANON = process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloemZ3a2lxa3diZ2JnampiZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjA0MjcsImV4cCI6MjA4NjE5NjQyN30.G9Hq_yHllqZI-NzkDiJCDC6V_UZAoDxzWGeRrwQR8ms";
const JWT = process.env.USER_JWT;

// ─── args ───
const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true])
);
const VUS = Number(args.vus ?? 10);
const DURATION_MS = Number(args.duration ?? 20) * 1000;
const SCENARIO = String(args.scenario ?? "mixed");

// ─── cenários ───
const PROMPTS = {
  orchestration: [
    "Thor, coordene um squad de 3 agentes para gerar um plano de lançamento de produto SaaS em 5 passos.",
    "Orquestre: SDR levanta 5 leads, Copywriter cria 3 mensagens, CFO valida ROI. Consolide o plano.",
    "Rode uma missão end-to-end: pesquisar mercado, gerar copy, calcular CAC, e entregar relatório.",
  ],
  "agent-chat": [
    "Escreva uma copy curta para LinkedIn sobre automação com IA.",
    "Liste 5 KPIs para acompanhar um SDR de IA.",
    "Resuma o conceito de outcome-based pricing em 3 bullets.",
  ],
};

const ENDPOINTS = {
  orchestration: "/functions/v1/omnix-chat",
  "agent-chat": "/functions/v1/agent-chat",
};

// ─── métricas ───
class Stats {
  constructor() { this.samples = []; this.ok = 0; this.fail = 0; this.errors = {}; }
  record(ms, ok, err) {
    this.samples.push(ms);
    if (ok) this.ok++; else { this.fail++; if (err) this.errors[err] = (this.errors[err] || 0) + 1; }
  }
  pct(p) {
    if (!this.samples.length) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  }
  summary() {
    const total = this.ok + this.fail;
    return {
      total, ok: this.ok, fail: this.fail,
      errorRate: total ? (this.fail / total * 100).toFixed(2) + "%" : "0%",
      p50: this.pct(0.5), p95: this.pct(0.95), p99: this.pct(0.99),
      avg: this.samples.length ? (this.samples.reduce((a, b) => a + b, 0) / this.samples.length).toFixed(0) : 0,
      errors: this.errors,
    };
  }
}

async function callAgent(scenario, stats) {
  const prompts = PROMPTS[scenario] || PROMPTS["agent-chat"];
  const message = prompts[Math.floor(Math.random() * prompts.length)];
  const endpoint = ENDPOINTS[scenario] || ENDPOINTS["agent-chat"];

  const started = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON,
        "Authorization": `Bearer ${JWT || ANON}`,
      },
      body: JSON.stringify({ message, messages: [{ role: "user", content: message }] }),
    });
    const elapsed = Date.now() - started;
    if (!res.ok) {
      stats.record(elapsed, false, `HTTP_${res.status}`);
      return;
    }
    // Drena o body (pode ser SSE)
    await res.text();
    stats.record(elapsed, true);
  } catch (e) {
    stats.record(Date.now() - started, false, e.code || e.name || "NET_ERR");
  }
}

async function worker(id, scenario, stats, deadline) {
  while (Date.now() < deadline) {
    const s = SCENARIO === "mixed"
      ? (Math.random() < 0.5 ? "orchestration" : "agent-chat")
      : scenario;
    await callAgent(s, stats);
  }
}

(async () => {
  console.log("\n═══ CLAUTHOR STRESS TEST ═══");
  console.log(`  cenário: ${SCENARIO}`);
  console.log(`  VUs:     ${VUS}`);
  console.log(`  dur:     ${DURATION_MS / 1000}s`);
  console.log(`  auth:    ${JWT ? "JWT" : "ANON (funções protegidas vão retornar 401)"}\n`);

  const stats = new Stats();
  const deadline = Date.now() + DURATION_MS;
  const ticker = setInterval(() => {
    process.stdout.write(`  … ${stats.ok + stats.fail} req (${stats.fail} err)\r`);
  }, 1000);

  await Promise.all(Array.from({ length: VUS }, (_, i) => worker(i, SCENARIO, stats, deadline)));
  clearInterval(ticker);

  const s = stats.summary();
  console.log("\n\n═══ RESULTADO ═══");
  console.log(`  total:      ${s.total}`);
  console.log(`  ok / fail:  ${s.ok} / ${s.fail}`);
  console.log(`  error rate: ${s.errorRate}`);
  console.log(`  latência:   avg ${s.avg}ms · p50 ${s.p50}ms · p95 ${s.p95}ms · p99 ${s.p99}ms`);
  console.log(`  throughput: ${(s.total / (DURATION_MS / 1000)).toFixed(1)} req/s`);
  if (Object.keys(s.errors).length) {
    console.log("  errors:");
    for (const [k, v] of Object.entries(s.errors)) console.log(`    ${k}: ${v}`);
  }
  console.log("");

  // Portão de qualidade
  const errRateNum = parseFloat(s.errorRate);
  if (errRateNum > 5) { console.error("❌ Error rate > 5%"); process.exit(1); }
  if (s.p95 > 15000) { console.error("❌ p95 > 15s"); process.exit(1); }
  console.log("✅ Qualidade dentro dos limites (err<5%, p95<15s).\n");
})();
