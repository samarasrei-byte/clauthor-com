import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/**
 * THOR OS — Sistema Operacional Empresarial (v1 · LLM-only / simulado).
 *
 * Recebe um objetivo em linguagem natural e:
 *   1) PLANNER (THOR) decompõe em fases {departamento, agente, tarefa}
 *   2) AGENTES ESPECIALISTAS executam em paralelo (chamadas LLM independentes)
 *   3) INTEGRADOR consolida tudo em uma entrega final acionável
 *
 * Body:
 *   { objective: string, context?: string }
 *
 * Response:
 *   { ok, plan, outputs: [{phase, department, role, task, output, latency_ms}],
 *     delivery, total_ms }
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3.5-flash"; // rápido + barato p/ orquestração paralela

const DEPARTMENTS = [
  "Presidência", "Estratégia", "Comercial", "Marketing", "Produto",
  "Tecnologia", "IA", "Financeiro", "Jurídico", "RH", "Operações",
  "Design", "Copy", "SEO", "Tráfego", "Social", "CRM", "Analytics",
  "Suporte", "Documentação",
];

const THOR_PLANNER_SYSTEM = `Você é o THOR — o Sistema Operacional Empresarial. Você NÃO é um chatbot e NÃO executa tarefas você mesmo.

Sua missão: transformar um objetivo em um PLANO DE EXECUÇÃO decomposto em fases claras, cada fase delegada a um departamento e um papel especialista.

DEPARTAMENTOS DISPONÍVEIS: ${DEPARTMENTS.join(", ")}.

Princípios:
- Pense como CEO antes de responder.
- Decomponha o objetivo em 4 a 8 fases sequenciais ou paralelas (paralelo quando possível).
- Cada fase = 1 departamento + 1 papel especialista + 1 instrução clara e acionável.
- Evite generalidades. Cada tarefa deve produzir um artefato tangível (texto, plano, script, análise, checklist).
- Elimine trabalho humano: escolha o caminho de maior ROI para a empresa.

Responda SEMPRE em JSON estrito neste schema:
{
  "objective_understanding": "resumo em 1 frase do que o CEO realmente quer",
  "strategy": "abordagem escolhida em 2-3 frases",
  "phases": [
    {
      "id": "F1",
      "department": "um dos departamentos disponíveis",
      "role": "papel específico (ex: 'Copywriter Sênior', 'Arquiteto de Software', 'CFO', 'Head de Growth')",
      "task": "instrução direta e acionável para o especialista, em 1-3 frases",
      "expected_artifact": "o que este agente deve entregar",
      "parallel_group": "A|B|C — fases no mesmo grupo rodam em paralelo"
    }
  ]
}`;

const AGENT_SYSTEM = (dept: string, role: string) =>
  `Você é um(a) ${role} do departamento de ${dept} de uma empresa de alto crescimento.

Você recebe UMA tarefa específica do THOR OS e entrega o artefato pedido. Sem preâmbulos, sem "vou fazer" — entrega direta, prática, no padrão do que um especialista sênior produziria.

Regras:
- Máximo 400 palavras.
- Sem meta-comentários ("como especialista, eu…").
- Formato markdown quando fizer sentido (listas, headings h3, tabelas curtas).
- Se a tarefa exigir dados que você não tem, ASSUMA valores realistas e sinalize as premissas em 1 linha no fim.`;

const INTEGRATOR_SYSTEM = `Você é o INTEGRADOR do THOR OS. Recebeu os artefatos de vários agentes especialistas e precisa entregar UM resultado consolidado para o CEO.

Seu output:
1. **Sumário executivo** (3-5 bullets do que foi produzido).
2. **Entrega Final** — o artefato consolidado que o CEO pode usar imediatamente (documento, plano, checklist, roadmap — o que fizer sentido para o objetivo original).
3. **Próximos passos** (3 ações concretas com responsável sugerido).

Formato markdown, direto, sem enrolação. Máximo 900 palavras.`;

interface Phase {
  id: string;
  department: string;
  role: string;
  task: string;
  expected_artifact: string;
  parallel_group: string;
}

interface PlanJson {
  objective_understanding: string;
  strategy: string;
  phases: Phase[];
}

class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callGateway(
  apiKey: string,
  system: string,
  user: string,
  jsonMode = false,
): Promise<string> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GatewayError(res.status, `Gateway ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? "");
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return errorResponse("LOVABLE_API_KEY ausente", 500);

    const body = await req.json().catch(() => ({}));
    const objective = String(body?.objective || "").trim();
    const context = String(body?.context || "").trim();
    if (objective.length < 6) return errorResponse("objective muito curto (mínimo 6 caracteres)", 400);

    const started = Date.now();

    // ────────── 1) PLANNER (THOR) ──────────
    const planRaw = await callGateway(
      apiKey,
      THOR_PLANNER_SYSTEM,
      `OBJETIVO DO CEO:\n${objective}${context ? `\n\nCONTEXTO ADICIONAL:\n${context}` : ""}`,
      true,
    );
    let plan: PlanJson;
    try {
      plan = JSON.parse(planRaw) as PlanJson;
    } catch {
      return jsonResponse({ ok: false, error: "Planner retornou JSON inválido", raw: planRaw.slice(0, 800) }, 200);
    }
    if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
      return jsonResponse({ ok: false, error: "Planner não gerou fases", plan }, 200);
    }
    // Limita a 8 fases pra proteger custo/latência
    plan.phases = plan.phases.slice(0, 8);

    // ────────── 2) AGENTES em paralelo ──────────
    const outputs = await Promise.all(
      plan.phases.map(async (ph) => {
        const t0 = Date.now();
        try {
          const output = await callGateway(
            apiKey,
            AGENT_SYSTEM(ph.department, ph.role),
            `TAREFA: ${ph.task}\n\nARTEFATO ESPERADO: ${ph.expected_artifact}\n\nCONTEXTO GERAL DO OBJETIVO: ${objective}`,
            false,
          );
          return {
            phase: ph.id,
            department: ph.department,
            role: ph.role,
            task: ph.task,
            expected_artifact: ph.expected_artifact,
            parallel_group: ph.parallel_group,
            output,
            status: "ok" as const,
            latency_ms: Date.now() - t0,
          };
        } catch (e) {
          return {
            phase: ph.id,
            department: ph.department,
            role: ph.role,
            task: ph.task,
            expected_artifact: ph.expected_artifact,
            parallel_group: ph.parallel_group,
            output: `⚠️ Falha do agente: ${(e as Error).message}`,
            status: "failed" as const,
            latency_ms: Date.now() - t0,
          };
        }
      }),
    );

    // ────────── 3) INTEGRADOR ──────────
    const integratorInput = [
      `OBJETIVO ORIGINAL: ${objective}`,
      `ESTRATÉGIA THOR: ${plan.strategy}`,
      "",
      "ARTEFATOS DOS AGENTES:",
      ...outputs.map(
        (o) => `\n### ${o.phase} · ${o.department} — ${o.role}\n${o.output}`,
      ),
    ].join("\n");

    const delivery = await callGateway(apiKey, INTEGRATOR_SYSTEM, integratorInput, false);

    return jsonResponse({
      ok: true,
      plan,
      outputs,
      delivery,
      total_ms: Date.now() - started,
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: (e as Error).message || "Erro interno" }, 200);
  }
});
