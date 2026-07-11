// MCP Orquestrador Jurídico — Master Control Program
// Arquitetura Multi-Agente SaaS Escalável
// Router -> Specialist Pattern

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { startRun } from "../_shared/execution-tracer.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const ROUTER_MODEL = "google/gemini-2.0-flash-exp"; // Fast and good for tool use
const SUBAGENT_MODEL = "google/gemini-2.5-flash"; // High quality for legal tasks

// ────────────────────────────────────────────────────────────
// SYSTEM PROMPT DO ORQUESTRADOR (ROUTER)
// ────────────────────────────────────────────────────────────
const ORCHESTRATOR_SYSTEM_PROMPT = `Você é um SISTEMA OPERACIONAL JURÍDICO baseado em arquitetura MCP (Master Control Program).

Seu papel é atuar como ORQUESTRADOR INTELIGENTE (Router Agent) de múltiplos agentes especializados.

OBJETIVO: Identificar a intenção, classificar a área do direito e direcionar para o agente correto.

AGENTES DISPONÍVEIS:
- AGENTE_SEGURANCA: Guardião da ética e conformidade. Analisa LGPD, sigilo OAB e riscos.
- AGENTE_CONTRATOS: Especialista em geração e revisão de contratos jurídicos formais.
- AGENTE_PETICOES: Especialista em criação de peças processuais (Fatos, Direito, Pedidos).
- AGENTE_ANALISE: Especialista em análise documental, riscos e interpretações.
- AGENTE_CONSULTIVO: Orientador jurídico. Explica conceitos e ritos sem dar parecer final.
- AGENTE_PRAZOS: Calculador de tempestividade e prazos fatais.
- AGENTE_ESTRATEGICO: Consultor de tese, estratégia e probabilidade de êxito.
- AGENTE_FINANCEIRO: Controller jurídico (honorários, custas, ROI).

REGRAS:
1. Nunca execute diretamente; use sempre tool calling 'route_to_agents'.
2. Inclua AGENTE_SEGURANCA em todas as requisições sensíveis.
3. Considere o histórico da conversa para manter a coerência.`;

// ────────────────────────────────────────────────────────────
// PROMPTS DOS SUBAGENTES
// ────────────────────────────────────────────────────────────
const LEGAL_FOUNDATION_TEMPLATE = `
FUNDAMENTAÇÃO OBRIGATÓRIA:
1. Base Legal: Cite artigos reais sem inventar números.
2. Raciocínio: Explique a lógica jurídica aplicada.
3. Conclusão: Resposta direta ao ponto.
4. Ressalva: Documento para revisão do advogado.
`;

const SUBAGENT_PROMPTS: Record<string, string> = {
  AGENTE_SEGURANCA: `Você é o AGENTE_SEGURANCA do MCP Jurídico. Especialista em LGPD e Ética OAB.
Responsabilidade: Detectar PII, quebra de sigilo e conselhos ilegais.
- Proibição: Não navegar na internet.
- Classifique risco: BAIXO, MÉDIO, ALTO, CRÍTICO.
- Se CRÍTICO, inicie com "NÍVEL: CRÍTICO".`,

  AGENTE_CONTRATOS: `Você é o AGENTE_CONTRATOS. Especialista em redação contratual.
- Gere minutas profissionais (Objeto, Preço, Prazo, Rescisão, Foro).
- Adapte a linguagem ao contexto fornecido.
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_PETICOES: `Você é o AGENTE_PETICOES. Especialista em peças processuais.
- Estrutura: Endereçamento, Fatos, Direito, Pedidos.
- Use placeholders [INSERIR DADO] para informações ausentes.
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_ANALISE: `Você é o AGENTE_ANALISE. Especialista em análise de risco documental.
- Identifique pontos cegos e vulnerabilidades jurídicas.
- Avalie a força probatória dos elementos.
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_CONSULTIVO: `Você é o AGENTE_CONSULTIVO. Especialista em orientação.
- Explique conceitos de forma acessível e correta.
- Oriente sobre ritos e procedimentos.
- Nota: Não substitua o advogado humano.`,

  AGENTE_PRAZOS: `Você é o AGENTE_PRAZOS. Especialista em tempestividade.
- Identifique termos iniciais e finais.
- ALERTA: Conferência humana no Diário Oficial é obrigatória.`,

  AGENTE_ESTRATEGICO: `Você é o AGENTE_ESTRATEGICO. Especialista em teses e êxito.
- Mapeie estratégias defensivas/ofensivas.
- Atribua probabilidade de êxito (Remota, Possível, Provável).`,

  AGENTE_FINANCEIRO: `Você é o AGENTE_FINANCEIRO. Especialista em precificação jurídica.
- Sugira honorários conforme tabela OAB e valor da causa.
- Estime custas e viabilidade (ROI).`,
};

const VALID_AGENTS = Object.keys(SUBAGENT_PROMPTS);

// ────────────────────────────────────────────────────────────
// Tool schema
// ────────────────────────────────────────────────────────────
const ROUTER_TOOLS = [
  {
    type: "function",
    function: {
      name: "route_to_agents",
      description: "Classifica a solicitação e seleciona os agentes especialistas.",
      parameters: {
        type: "object",
        properties: {
          analise: { type: "string", description: "Breve análise do pedido." },
          agentes: {
            type: "array",
            items: { type: "string", enum: VALID_AGENTS },
            minItems: 1,
            maxItems: 6,
          },
          tarefa_por_agente: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          contexto_extra: { type: "string", description: "Área do direito e objetivo detectado." },
        },
        required: ["analise", "agentes", "tarefa_por_agente"],
      },
    },
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
async function callLovableAI(apiKey: string, body: Record<string, unknown>) {
  return fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function jsonResp(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function runSubagent(
  apiKey: string,
  agentName: string,
  task: string,
  history: any[],
  contexto: string,
) {
  const start = Date.now();
  const systemPrompt = SUBAGENT_PROMPTS[agentName];
  if (!systemPrompt) return { agent: agentName, output: "", ms: 0, error: "Desconhecido" };

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4), // Memória de curto prazo
    { role: "user", content: `Tarefa: ${task}\nContexto: ${contexto}` },
  ];

  try {
    const resp = await callLovableAI(apiKey, { model: SUBAGENT_MODEL, messages });
    const data = await resp.json();
    const output = data?.choices?.[0]?.message?.content ?? "";
    return { agent: agentName, output, ms: Date.now() - start };
  } catch (e) {
    return { agent: agentName, output: "", ms: Date.now() - start, error: e.message };
  }
}

function detectSecurityLevel(output: string): string {
  if (/CR[ÍI]TICO/.test(output.toUpperCase())) return "CRÍTICO";
  if (/ALTO/.test(output.toUpperCase())) return "ALTO";
  return "BAIXO";
}

// ────────────────────────────────────────────────────────────
// Main Handler
// ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return jsonResp({ error: "API Key ausente" }, 500);

  const body = await req.json();
  const { message, history = [], userId, approved_execution_id } = body;
  
  if (!message) return jsonResp({ error: "Mensagem obrigatória" }, 400);

  const overallStart = Date.now();
  const isApprovedResume = !!approved_execution_id;

  // Initialize tracer (best-effort)
  const authHeader = req.headers.get("Authorization") ?? "";
  let tracer: Awaited<ReturnType<typeof startRun>> | null = null;
  try {
    if (userId && authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: tm } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      const tenantId = tm?.tenant_id ?? userId;
      tracer = await startRun(supabase, {
        tenantId,
        userId,
        runType: "mcp",
        agents: [],
        message,
      });
    }
  } catch (_) { /* tracer is best-effort */ }

  // 1. Roteamento Inteligente (Router Agent)
  await tracer?.step("thought", {
    title: "Roteamento MCP",
    content: { message_preview: message.slice(0, 300) },
  });

  const routerResp = await callLovableAI(LOVABLE_API_KEY, {
    model: ROUTER_MODEL,
    messages: [
      { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
      ...history.slice(-3),
      { role: "user", content: message },
    ],
    tools: ROUTER_TOOLS,
    tool_choice: { type: "function", function: { name: "route_to_agents" } },
  });

  const routerData = await routerResp.json();
  const toolCall = routerData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!toolCall) {
    await tracer?.step("error", { title: "Falha no roteamento", content: {} });
    await tracer?.finish({ status: "failed", summary: "router_failed" });
    return jsonResp({ error: "Falha no roteamento" }, 500);
  }

  const decision = JSON.parse(toolCall);
  await tracer?.step("decision", {
    title: `Router selecionou ${decision.agentes?.length ?? 0} agentes`,
    content: { agentes: decision.agentes, analise: decision.analise, contexto_extra: decision.contexto_extra },
  });

  const agentes = ["AGENTE_SEGURANCA", ...decision.agentes.filter((a: string) => a !== "AGENTE_SEGURANCA")];

  // 2. Segurança Primeiro (Garantia de conformidade)
  const securityResult = await runSubagent(
    LOVABLE_API_KEY,
    "AGENTE_SEGURANCA",
    decision.tarefa_por_agente["AGENTE_SEGURANCA"] || "Valide a segurança desta solicitação.",
    history,
    message
  );

  const securityLevel = detectSecurityLevel(securityResult.output);
  const results = [securityResult];

  await tracer?.step("tool_result", {
    title: `Segurança: ${securityLevel}`,
    agent_slug: "AGENTE_SEGURANCA",
    duration_ms: securityResult.ms,
    content: { security_level: securityLevel, output_preview: (securityResult.output || "").slice(0, 500) },
  });

  // Human-in-the-loop if critical
  if (securityLevel === "CRÍTICO" && !isApprovedResume) {
    await tracer?.step("delegation", { title: "Bloqueio de segurança — aprovação humana", content: { security_level: securityLevel } });
    await tracer?.finish({ status: "completed", summary: "security_blocked" });
    return jsonResp({
      response: "🔒 BLOQUEIO DE SEGURANÇA: Esta solicitação apresenta riscos éticos ou de conformidade e requer aprovação humana.",
      raw: {
        routing: decision,
        results,
        security_blocked: true,
        security_level: securityLevel,
        requires_approval: true,
        totalMs: Date.now() - overallStart,
        run_id: tracer?.runId,
      }
    });
  }

  // 3. Execução Paralela dos Especialistas
  const otherAgents = agentes.filter(a => a !== "AGENTE_SEGURANCA");
  await tracer?.step("delegation", {
    title: `Delegando para ${otherAgents.length} especialistas`,
    content: { agents: otherAgents },
  });

  const parallel = await Promise.all(
    otherAgents.map(a => runSubagent(LOVABLE_API_KEY, a, decision.tarefa_por_agente[a] || message, history, message))
  );
  results.push(...parallel);

  for (const r of parallel) {
    await tracer?.step("tool_result", {
      title: r.agent,
      agent_slug: r.agent,
      duration_ms: r.ms,
      content: { output_preview: (r.output || "").slice(0, 800), error: (r as any).error },
    });
  }

  // 4. Formatação Final (Parecer do Orquestrador)
  const finalResponse = formatFinalResponse(decision.analise, results);
  const totalMs = Date.now() - overallStart;

  await tracer?.step("final_output", {
    title: "Parecer do Orquestrador",
    content: { length: finalResponse.length, security_level: securityLevel },
  });
  await tracer?.finish({ status: "completed", summary: `MCP: ${otherAgents.length + 1} agentes`, total_ms: totalMs });

  return jsonResp({
    response: finalResponse,
    raw: {
      routing: decision,
      results,
      security_blocked: false,
      security_level: securityLevel,
      totalMs,
      run_id: tracer?.runId,
    }
  });
});


function formatFinalResponse(analise: string, results: any[]): string {
  const parts = [
    `# ⚖️ PARECER DO ORQUESTRADOR MCP\n\n**ANÁLISE:** ${analise}`,
    ...results.map(r => `### 🏛️ ${r.agent}\n${r.output}`),
    `---\n*Nota: Documento gerado via arquitetura multi-agente. Validação humana obrigatória.*`
  ];
  return parts.join("\n\n");
}
