// MCP Orquestrador Jurídico — Master Control Program
// Recebe uma solicitação do usuário, valida segurança, classifica intenção
// e roteia para os subagentes MCP especializados via Lovable AI Gateway.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const ROUTER_MODEL = "google/gemini-3-flash-preview";
const SUBAGENT_MODEL = "google/gemini-2.5-flash";

// ────────────────────────────────────────────────────────────
// SYSTEM PROMPT DO ORQUESTRADOR (do prompt do usuário)
// ────────────────────────────────────────────────────────────
const ORCHESTRATOR_SYSTEM_PROMPT = `Você é um SISTEMA OPERACIONAL JURÍDICO baseado em arquitetura MCP (Master Control Program).

Seu papel é atuar como um ORQUESTRADOR INTELIGENTE que gerencia múltiplos agentes especializados dentro de um escritório de advocacia.

OBJETIVO PRINCIPAL:
Garantir segurança, reduzir trabalho operacional e apoiar decisões jurídicas com precisão.

ARQUITETURA:
Você NÃO executa diretamente. Você:
1. Interpreta a solicitação
2. Classifica a intenção
3. Aciona o(s) agente(s) correto(s) via tool calling
4. Consolida a resposta final

AGENTES DISPONÍVEIS:
- AGENTE_SEGURANCA: dados sensíveis, LGPD, permissões, sigilo OAB
- AGENTE_PROCESSUAL: organização, classificação de documentos, fase processual
- AGENTE_PRAZOS: identificação e cálculo de prazos, risco temporal
- AGENTE_REDATOR: criação e revisão de peças jurídicas
- AGENTE_ESTRATEGICO: tese, probabilidade de êxito, análise de risco
- AGENTE_FINANCEIRO: honorários, custas, comunicação financeira

REGRA ABSOLUTA (PRIORIDADE MÁXIMA):
ANTES de qualquer ação concreta, AGENTE_SEGURANCA deve ser consultado.
Se houver risco identificado, BLOQUEAR a operação imediatamente.

LÓGICA DE ROTEAMENTO:
- Dados sensíveis, acesso, permissões → AGENTE_SEGURANCA
- Organização processual, documentos, fases → AGENTE_PROCESSUAL
- Datas, prazos, intimações → AGENTE_PRAZOS
- Criar/revisar peças → AGENTE_REDATOR
- Estratégia, tese, probabilidade → AGENTE_ESTRATEGICO
- Honorários, financeiro, cliente → AGENTE_FINANCEIRO
- Múltiplos contextos → acionar múltiplos agentes

REGRAS GERAIS:
- Nunca inventar informações jurídicas
- Nunca assumir dados sem base
- Sempre indicar nível de confiança
- Priorizar precisão sobre velocidade
- Em dúvida → solicitar mais dados
- Em risco → bloquear

Você deve agir como um sistema profissional de nível global.`;

// ────────────────────────────────────────────────────────────
// PROMPTS DOS SUBAGENTES
// ────────────────────────────────────────────────────────────
const SUBAGENT_PROMPTS: Record<string, string> = {
  AGENTE_SEGURANCA: `Você é o AGENTE_SEGURANCA do MCP Jurídico.
Responsabilidade: LGPD, sigilo profissional OAB, classificação de dados sensíveis, validação de permissões.
Comportamento:
- Identifique se a solicitação envolve dados pessoais, segredo de justiça ou informação sigilosa
- Classifique nível de risco: BAIXO, MÉDIO, ALTO, CRÍTICO
- Se ALTO ou CRÍTICO, recomende BLOQUEAR a operação e explique por quê
- Liste medidas de mitigação concretas
Responda em até 200 palavras, técnico e direto.`,

  AGENTE_PROCESSUAL: `Você é o AGENTE_PROCESSUAL do MCP Jurídico.
Responsabilidade: organização do processo, classificação documental, identificação de fase processual.
Comportamento:
- Classifique documentos mencionados (petição inicial, contestação, decisão, despacho, sentença, recurso)
- Identifique a fase processual provável quando houver elementos
- Sugira próximos passos com base no rito
- Aponte inconsistências ou lacunas documentais
Responda em até 250 palavras, com bullets quando útil.`,

  AGENTE_PRAZOS: `Você é o AGENTE_PRAZOS do MCP Jurídico.
Responsabilidade: identificação e cálculo de prazos processuais.
Comportamento:
- Identifique prazos mencionados (em dias úteis ou corridos)
- Considere feriados forenses e suspensões quando aplicável (CPC art. 219)
- Classifique risco: CRÍTICO (<3 dias), ALTO (<7), MÉDIO (<15), BAIXO (>15)
- NUNCA assuma datas sem base — se faltar info, peça
Responda em até 200 palavras, com data alvo quando possível.`,

  AGENTE_REDATOR: `Você é o AGENTE_REDATOR do MCP Jurídico.
Responsabilidade: produção e revisão de peças jurídicas.
Comportamento:
- Gere minutas, parágrafos ou esboços conforme pedido
- Use linguagem técnica precisa, sem floreios
- Cite fundamentação legal quando apropriado
- Marque com [VERIFICAR] qualquer afirmação que dependa de dados não fornecidos
Responda com a peça/trecho diretamente, sem preâmbulo longo.`,

  AGENTE_ESTRATEGICO: `Você é o AGENTE_ESTRATEGICO do MCP Jurídico.
Responsabilidade: análise estratégica, teses, probabilidade de êxito.
Comportamento:
- Sugira teses jurídicas aplicáveis
- Estime probabilidade de êxito de forma calibrada (Baixa/Média/Alta) com justificativa
- Mapeie riscos e contra-argumentos previsíveis
- Proponha alternativas táticas
Responda em até 300 palavras, estruturado.`,

  AGENTE_FINANCEIRO: `Você é o AGENTE_FINANCEIRO do MCP Jurídico.
Responsabilidade: honorários, custas, comunicação financeira com cliente.
Comportamento:
- Sugira modelos de honorários (fixo, êxito, híbrido) adequados ao caso
- Calcule estimativas quando houver dados suficientes
- Redija comunicações claras e profissionais para clientes quando solicitado
- Sinalize quando informações financeiras estão incompletas
Responda em até 250 palavras.`,
};

const VALID_AGENTS = Object.keys(SUBAGENT_PROMPTS);

// ────────────────────────────────────────────────────────────
// Tool schema para roteamento
// ────────────────────────────────────────────────────────────
const ROUTER_TOOLS = [
  {
    type: "function",
    function: {
      name: "route_to_agents",
      description:
        "Classifica a solicitação e seleciona quais subagentes MCP devem ser acionados.",
      parameters: {
        type: "object",
        properties: {
          analise: {
            type: "string",
            description:
              "Resumo curto (1-2 frases) do entendimento da solicitação.",
          },
          agentes: {
            type: "array",
            description:
              "Lista de agentes a acionar. SEMPRE inclua AGENTE_SEGURANCA primeiro se houver risco/dado sensível.",
            items: {
              type: "string",
              enum: VALID_AGENTS,
            },
            minItems: 1,
            maxItems: 6,
          },
          tarefa_por_agente: {
            type: "object",
            description:
              "Mapa { nome_do_agente: tarefa específica e curta }. Cada tarefa deve ser autossuficiente.",
            additionalProperties: { type: "string" },
          },
          alerta: {
            type: "string",
            description:
              "Alerta de risco ou necessidade de validação humana. Vazio se não houver.",
          },
        },
        required: ["analise", "agentes", "tarefa_por_agente"],
        additionalProperties: false,
      },
    },
  },
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
async function callLovableAI(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const resp = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return resp;
}

function jsonResp(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Roda um subagente e retorna seu output como string
async function runSubagent(
  apiKey: string,
  agentName: string,
  task: string,
  contexto: string,
): Promise<{ agent: string; output: string; ms: number; error?: string }> {
  const start = Date.now();
  const systemPrompt = SUBAGENT_PROMPTS[agentName];
  if (!systemPrompt) {
    return {
      agent: agentName,
      output: "",
      ms: 0,
      error: `Subagente desconhecido: ${agentName}`,
    };
  }

  const userMessage = contexto
    ? `Contexto da solicitação original:\n${contexto}\n\nSua tarefa: ${task}`
    : `Sua tarefa: ${task}`;

  try {
    const resp = await callLovableAI(apiKey, {
      model: SUBAGENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return {
        agent: agentName,
        output: "",
        ms: Date.now() - start,
        error: `${resp.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = await resp.json();
    const output = data?.choices?.[0]?.message?.content ?? "";
    return { agent: agentName, output, ms: Date.now() - start };
  } catch (e) {
    return {
      agent: agentName,
      output: "",
      ms: Date.now() - start,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}

// ────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResp({ error: "Method not allowed" }, 405);
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return jsonResp({ error: "LOVABLE_API_KEY não configurada" }, 500);
  }

  let body: { message?: string; userId?: string; contexto?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "Body inválido" }, 400);
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length > 4000) {
    return jsonResp(
      { error: "message é obrigatório e deve ter até 4000 caracteres" },
      400,
    );
  }

  const overallStart = Date.now();

  // ── PASSO 1: Roteamento via tool calling ──
  let routingDecision: {
    analise: string;
    agentes: string[];
    tarefa_por_agente: Record<string, string>;
    alerta?: string;
  };

  try {
    const routerResp = await callLovableAI(LOVABLE_API_KEY, {
      model: ROUTER_MODEL,
      messages: [
        { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Solicitação do usuário: """${message}"""\n\nClassifique e roteie via a ferramenta route_to_agents. Lembre: se houver qualquer suspeita de dado sensível, inclua AGENTE_SEGURANCA primeiro.`,
        },
      ],
      tools: ROUTER_TOOLS,
      tool_choice: { type: "function", function: { name: "route_to_agents" } },
    });

    if (routerResp.status === 429) {
      return jsonResp(
        { error: "Limite de requisições atingido. Tente novamente em instantes." },
        429,
      );
    }
    if (routerResp.status === 402) {
      return jsonResp(
        { error: "Créditos esgotados. Adicione créditos ao workspace Lovable AI." },
        402,
      );
    }
    if (!routerResp.ok) {
      const t = await routerResp.text();
      console.error("Router error:", routerResp.status, t);
      return jsonResp({ error: "Falha na classificação" }, 500);
    }

    const routerData = await routerResp.json();
    const toolCall =
      routerData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

    if (!toolCall) {
      return jsonResp(
        { error: "Roteador não retornou decisão estruturada" },
        500,
      );
    }

    routingDecision = JSON.parse(toolCall);
  } catch (e) {
    console.error("Routing exception:", e);
    return jsonResp(
      { error: e instanceof Error ? e.message : "Erro de roteamento" },
      500,
    );
  }

  // Sanitiza lista de agentes
  const agentes = (routingDecision.agentes ?? []).filter((a) =>
    VALID_AGENTS.includes(a),
  );

  if (agentes.length === 0) {
    return jsonResp({
      response: formatFinalResponse({
        analise: routingDecision.analise || "Não foi possível classificar.",
        agentes: [],
        respostas: [],
        confianca: "Baixa",
        alerta:
          "Nenhum subagente apropriado identificado. Reformule a solicitação.",
      }),
      raw: { routing: routingDecision, results: [], totalMs: Date.now() - overallStart },
    });
  }

  // ── PASSO 2: Garante AGENTE_SEGURANCA primeiro ──
  if (!agentes.includes("AGENTE_SEGURANCA")) {
    agentes.unshift("AGENTE_SEGURANCA");
    routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] =
      routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] ||
      "Avalie rapidamente se a solicitação envolve dado sensível, sigilo ou risco LGPD.";
  } else if (agentes[0] !== "AGENTE_SEGURANCA") {
    const idx = agentes.indexOf("AGENTE_SEGURANCA");
    agentes.splice(idx, 1);
    agentes.unshift("AGENTE_SEGURANCA");
  }

  // ── PASSO 3: Executa segurança primeiro (sequencial) ──
  const securityResult = await runSubagent(
    LOVABLE_API_KEY,
    "AGENTE_SEGURANCA",
    routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] ??
      "Avalie risco de segurança/LGPD da solicitação.",
    message,
  );

  const securityBlocks = /CR[ÍI]TICO|BLOQUE/i.test(securityResult.output);

  const results: Array<{ agent: string; output: string; ms: number; error?: string }> = [
    securityResult,
  ];

  // Se segurança bloqueou, pula os demais
  if (!securityBlocks) {
    const otherAgents = agentes.filter((a) => a !== "AGENTE_SEGURANCA");
    const parallel = await Promise.all(
      otherAgents.map((a) =>
        runSubagent(
          LOVABLE_API_KEY,
          a,
          routingDecision.tarefa_por_agente[a] ?? message,
          message,
        ),
      ),
    );
    results.push(...parallel);
  }

  // ── PASSO 4: Consolida resposta ──
  const confianca = securityBlocks
    ? "Alta"
    : results.some((r) => r.error)
    ? "Média"
    : "Alta";

  const alerta = securityBlocks
    ? `🔒 OPERAÇÃO BLOQUEADA pelo AGENTE_SEGURANCA. ${securityResult.output.slice(0, 300)}`
    : routingDecision.alerta || "";

  const finalText = formatFinalResponse({
    analise: routingDecision.analise,
    agentes: results.map((r) => r.agent),
    respostas: results,
    confianca,
    alerta,
  });

  // ── PASSO 5: Log de execução (best-effort) ──
  if (body.userId) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("execution_logs").insert({
        agent_id: "00000000-0000-0000-0000-000000000000",
        user_id: body.userId,
        action: "mcp_orquestrador",
        status: securityBlocks ? "blocked" : "success",
        execution_time_ms: Date.now() - overallStart,
        details: {
          agentes_acionados: results.map((r) => r.agent),
          analise: routingDecision.analise,
          security_blocked: securityBlocks,
        },
      });
    } catch (e) {
      console.error("Log error (non-fatal):", e);
    }
  }

  return jsonResp({
    response: finalText,
    raw: {
      routing: routingDecision,
      results,
      security_blocked: securityBlocks,
      totalMs: Date.now() - overallStart,
    },
  });
});

// ────────────────────────────────────────────────────────────
// Formatação final no formato definido pelo prompt
// ────────────────────────────────────────────────────────────
function formatFinalResponse(args: {
  analise: string;
  agentes: string[];
  respostas: Array<{ agent: string; output: string; error?: string }>;
  confianca: string;
  alerta?: string;
}): string {
  const { analise, agentes, respostas, confianca, alerta } = args;

  const respostaConsolidada = respostas
    .map((r) => {
      if (r.error) return `**${r.agent}** — ⚠️ ${r.error}`;
      return `**${r.agent}**\n${r.output.trim()}`;
    })
    .join("\n\n---\n\n");

  return [
    `[ANÁLISE]\n${analise}`,
    `[AGENTES ACIONADOS]\n${agentes.join(", ")}`,
    `[RESPOSTA]\n${respostaConsolidada}`,
    `[CONFIANÇA]\n${confianca}`,
    `[ALERTA]\n${alerta && alerta.length > 0 ? alerta : "Nenhum"}`,
  ].join("\n\n");
}
