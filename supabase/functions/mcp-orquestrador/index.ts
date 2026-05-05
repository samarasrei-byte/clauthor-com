// MCP Orquestrador Jurídico — Master Control Program
// Roteia para subagentes especializados via Lovable AI Gateway,
// com human-in-the-loop quando o Agente de Segurança classifica risco CRÍTICO.

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
// SYSTEM PROMPT DO ORQUESTRADOR
// ────────────────────────────────────────────────────────────
const ORCHESTRATOR_SYSTEM_PROMPT = `Você é um SISTEMA OPERACIONAL JURÍDICO baseado em arquitetura MCP (Master Control Program).

Seu papel é atuar como ORQUESTRADOR INTELIGENTE de múltiplos agentes especializados em um escritório de advocacia.

OBJETIVO: garantir segurança, reduzir trabalho operacional, apoiar decisões jurídicas com precisão.

ARQUITETURA: Você NÃO executa diretamente. Você:
1. Interpreta a solicitação
2. Classifica a intenção
3. Aciona o(s) agente(s) correto(s) via tool calling
4. Consolida a resposta final

AGENTES DISPONÍVEIS:
- AGENTE_SEGURANCA: dados sensíveis, LGPD, permissões, sigilo OAB
- AGENTE_PROCESSUAL: organização, classificação documental, fase processual
- AGENTE_PRAZOS: identificação e cálculo de prazos
- AGENTE_REDATOR: criação e revisão de peças
- AGENTE_ESTRATEGICO: tese, probabilidade de êxito, risco
- AGENTE_FINANCEIRO: honorários, custas, comunicação financeira

REGRA ABSOLUTA: ANTES de qualquer ação, AGENTE_SEGURANCA é consultado.
Se houver risco CRÍTICO, BLOQUEAR e exigir aprovação humana.

REGRAS GERAIS:
- Nunca inventar informações jurídicas
- Sempre indicar nível de confiança
- Em dúvida → solicitar mais dados
- Em risco → bloquear`;

// ────────────────────────────────────────────────────────────
// PROMPTS DOS SUBAGENTES
// ────────────────────────────────────────────────────────────
const SUBAGENT_PROMPTS: Record<string, string> = {
  AGENTE_SEGURANCA: `Você é o AGENTE_SEGURANCA do MCP Jurídico.
Responsabilidade: LGPD, sigilo profissional OAB, classificação de dados sensíveis, validação de permissões.
Comportamento:
- Identifique se a solicitação envolve dados pessoais, segredo de justiça ou informação sigilosa
- Classifique nível de risco: BAIXO, MÉDIO, ALTO, CRÍTICO
- Se CRÍTICO, escreva exatamente "NÍVEL: CRÍTICO" na primeira linha e explique o risco
- Se ALTO, escreva "NÍVEL: ALTO" e recomende mitigação
- Se MÉDIO/BAIXO, escreva "NÍVEL: MÉDIO" ou "NÍVEL: BAIXO"
- Liste medidas de mitigação concretas
Responda em até 200 palavras, técnico e direto.`,

  AGENTE_PROCESSUAL: `Você é o AGENTE_PROCESSUAL do MCP Jurídico.
Responsabilidade: organização do processo, classificação documental, identificação de fase processual.
- Classifique documentos (petição inicial, contestação, decisão, despacho, sentença, recurso)
- Identifique a fase processual provável
- Sugira próximos passos com base no rito
- Aponte inconsistências documentais
Até 250 palavras, com bullets.`,

  AGENTE_PRAZOS: `Você é o AGENTE_PRAZOS do MCP Jurídico.
- Identifique prazos mencionados (dias úteis ou corridos)
- Considere feriados forenses e suspensões (CPC art. 219)
- Classifique risco temporal: CRÍTICO (<3d), ALTO (<7d), MÉDIO (<15d), BAIXO (>15d)
- NUNCA assuma datas sem base — peça
Até 200 palavras, com data alvo quando possível.`,

  AGENTE_REDATOR: `Você é o AGENTE_REDATOR do MCP Jurídico.
- Gere minutas, parágrafos ou esboços conforme pedido
- Linguagem técnica precisa
- Cite fundamentação legal quando apropriado
- Marque [VERIFICAR] em afirmações dependentes de dados não fornecidos
Resposta direta com a peça/trecho.`,

  AGENTE_ESTRATEGICO: `Você é o AGENTE_ESTRATEGICO do MCP Jurídico.
- Sugira teses jurídicas aplicáveis
- Estime probabilidade de êxito calibrada (Baixa/Média/Alta) com justificativa
- Mapeie riscos e contra-argumentos previsíveis
- Proponha alternativas táticas
Até 300 palavras, estruturado.`,

  AGENTE_FINANCEIRO: `Você é o AGENTE_FINANCEIRO do MCP Jurídico.
- Sugira modelos de honorários (fixo, êxito, híbrido)
- Calcule estimativas quando houver dados
- Redija comunicações claras para clientes
- Sinalize informações financeiras incompletas
Até 250 palavras.`,
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
      description: "Classifica a solicitação e seleciona quais subagentes acionar.",
      parameters: {
        type: "object",
        properties: {
          analise: { type: "string", description: "Resumo (1-2 frases) do entendimento." },
          agentes: {
            type: "array",
            description: "Agentes a acionar. AGENTE_SEGURANCA é sempre incluído.",
            items: { type: "string", enum: VALID_AGENTS },
            minItems: 1,
            maxItems: 6,
          },
          tarefa_por_agente: {
            type: "object",
            additionalProperties: { type: "string" },
          },
          alerta: { type: "string" },
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
  contexto: string,
) {
  const start = Date.now();
  const systemPrompt = SUBAGENT_PROMPTS[agentName];
  if (!systemPrompt) {
    return { agent: agentName, output: "", ms: 0, error: `Desconhecido: ${agentName}` };
  }
  const userMessage = contexto
    ? `Contexto da solicitação:\n${contexto}\n\nSua tarefa: ${task}`
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
      error: e instanceof Error ? e.message : "Erro",
    };
  }
}

function detectSecurityLevel(output: string): "BAIXO" | "MÉDIO" | "ALTO" | "CRÍTICO" {
  const upper = output.toUpperCase();
  if (/CR[ÍI]TICO/.test(upper)) return "CRÍTICO";
  if (/N[ÍI]VEL:\s*ALTO|\bALTO\b/.test(upper)) return "ALTO";
  if (/M[ÉE]DIO/.test(upper)) return "MÉDIO";
  return "BAIXO";
}

// ────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "Method not allowed" }, 405);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return jsonResp({ error: "LOVABLE_API_KEY ausente" }, 500);

  let body: {
    message?: string;
    userId?: string;
    selected_agents?: string[];
    approved_execution_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "Body inválido" }, 400);
  }

  const message = (body.message ?? "").trim();
  if (!message || message.length > 4000) {
    return jsonResp({ error: "message obrigatório (até 4000 chars)" }, 400);
  }

  const supaAdmin = body.userId
    ? createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      )
    : null;

  // Sanitiza seleção do usuário (subset de VALID_AGENTS)
  const userSelection = (body.selected_agents ?? []).filter((a) =>
    VALID_AGENTS.includes(a),
  );

  // Caso de retomada após aprovação humana
  const isApprovedResume = !!body.approved_execution_id;

  const overallStart = Date.now();

  // ── PASSO 1: Roteamento ──
  let routingDecision: {
    analise: string;
    agentes: string[];
    tarefa_por_agente: Record<string, string>;
    alerta?: string;
  };

  try {
    const userInstruction = userSelection.length > 0
      ? `Solicitação: """${message}"""\n\nO usuário pré-selecionou estes agentes: ${userSelection.join(", ")}. Use-os como base, adicione AGENTE_SEGURANCA se ausente. Crie tarefa específica para cada um.`
      : `Solicitação: """${message}"""\n\nClassifique e roteie. Inclua AGENTE_SEGURANCA primeiro se houver suspeita de dado sensível.`;

    const routerResp = await callLovableAI(LOVABLE_API_KEY, {
      model: ROUTER_MODEL,
      messages: [
        { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
        { role: "user", content: userInstruction },
      ],
      tools: ROUTER_TOOLS,
      tool_choice: { type: "function", function: { name: "route_to_agents" } },
    });

    if (routerResp.status === 429)
      return jsonResp({ error: "Limite de requisições. Tente em instantes." }, 429);
    if (routerResp.status === 402)
      return jsonResp({ error: "Créditos esgotados no workspace Lovable AI." }, 402);
    if (!routerResp.ok) {
      const t = await routerResp.text();
      console.error("Router:", routerResp.status, t);
      return jsonResp({ error: "Falha na classificação" }, 500);
    }

    const routerData = await routerResp.json();
    const toolCall =
      routerData?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolCall) return jsonResp({ error: "Sem decisão estruturada" }, 500);
    routingDecision = JSON.parse(toolCall);
  } catch (e) {
    console.error("Routing exc:", e);
    return jsonResp({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }

  // Se usuário pré-selecionou, sobrepõe a seleção do roteador (mantendo AGENTE_SEGURANCA)
  let agentes = userSelection.length > 0
    ? Array.from(new Set(["AGENTE_SEGURANCA", ...userSelection]))
    : (routingDecision.agentes ?? []).filter((a) => VALID_AGENTS.includes(a));

  if (agentes.length === 0) {
    return jsonResp({
      response: formatFinalResponse({
        analise: routingDecision.analise || "Sem classificação.",
        agentes: [],
        respostas: [],
        confianca: "Baixa",
        alerta: "Nenhum subagente apropriado. Reformule.",
      }),
      raw: { routing: routingDecision, results: [], totalMs: Date.now() - overallStart },
    });
  }

  // Garante AGENTE_SEGURANCA no início
  if (!agentes.includes("AGENTE_SEGURANCA")) {
    agentes.unshift("AGENTE_SEGURANCA");
    routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] =
      routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] ||
      "Avalie risco LGPD/sigilo da solicitação.";
  } else if (agentes[0] !== "AGENTE_SEGURANCA") {
    agentes = ["AGENTE_SEGURANCA", ...agentes.filter((a) => a !== "AGENTE_SEGURANCA")];
  }

  // ── PASSO 2: Segurança primeiro ──
  const securityResult = await runSubagent(
    LOVABLE_API_KEY,
    "AGENTE_SEGURANCA",
    routingDecision.tarefa_por_agente["AGENTE_SEGURANCA"] ??
      "Avalie risco LGPD/sigilo.",
    message,
  );

  const securityLevel = detectSecurityLevel(securityResult.output);
  const securityCritical = securityLevel === "CRÍTICO";
  const requiresApproval = securityCritical && !isApprovedResume;

  const results: Array<{ agent: string; output: string; ms: number; error?: string }> = [
    securityResult,
  ];

  // ── PASSO 3a: Risco crítico SEM aprovação → para e pede aprovação humana ──
  if (requiresApproval) {
    let executionId: string | null = null;
    if (supaAdmin && body.userId) {
      const { data, error } = await supaAdmin
        .from("mcp_executions")
        .insert({
          user_id: body.userId,
          message,
          selected_agents: agentes,
          triggered_agents: ["AGENTE_SEGURANCA"],
          routing: routingDecision,
          results,
          security_blocked: true,
          security_level: securityLevel,
          security_output: securityResult.output,
          total_ms: Date.now() - overallStart,
          approval_status: "pending",
          status: "awaiting_approval",
        })
        .select("id")
        .single();
      if (error) console.error("Insert exec:", error);
      else executionId = data?.id ?? null;

      // Log também em execution_logs para auditoria centralizada
      await supaAdmin.from("execution_logs").insert({
        agent_id: "00000000-0000-0000-0000-000000000000",
        user_id: body.userId,
        action: "mcp_orquestrador_blocked",
        status: "blocked",
        execution_time_ms: Date.now() - overallStart,
        details: {
          mcp_execution_id: executionId,
          security_level: securityLevel,
          agentes_planejados: agentes,
          security_output: securityResult.output.slice(0, 500),
        },
      });
    }

    return jsonResp({
      response: formatFinalResponse({
        analise: routingDecision.analise,
        agentes: ["AGENTE_SEGURANCA"],
        respostas: results,
        confianca: "Alta",
        alerta: `🔒 RISCO CRÍTICO detectado. Aprovação humana obrigatória antes de continuar.\n\n${securityResult.output.slice(0, 400)}`,
      }),
      raw: {
        routing: routingDecision,
        results,
        security_blocked: true,
        security_level: securityLevel,
        requires_approval: true,
        execution_id: executionId,
        planned_agents: agentes,
        totalMs: Date.now() - overallStart,
      },
    });
  }

  // ── PASSO 3b: Executa demais agentes em paralelo ──
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

  // ── PASSO 4: Consolida ──
  const confianca = results.some((r) => r.error) ? "Média" : "Alta";
  const alerta =
    securityLevel === "ALTO"
      ? `⚠️ Risco ALTO identificado pelo Agente de Segurança. Revise mitigações antes de agir.`
      : routingDecision.alerta || "";

  const finalText = formatFinalResponse({
    analise: routingDecision.analise,
    agentes: results.map((r) => r.agent),
    respostas: results,
    confianca,
    alerta,
  });

  // ── PASSO 5: Persiste auditoria ──
  let executionId: string | null = null;
  if (supaAdmin && body.userId) {
    try {
      const { data } = await supaAdmin
        .from("mcp_executions")
        .insert({
          user_id: body.userId,
          message,
          selected_agents: agentes,
          triggered_agents: results.map((r) => r.agent),
          routing: routingDecision,
          results,
          security_blocked: false,
          security_level: securityLevel,
          security_output: securityResult.output,
          total_ms: Date.now() - overallStart,
          approval_status: isApprovedResume ? "approved" : "not_required",
          approved_at: isApprovedResume ? new Date().toISOString() : null,
          approved_by: isApprovedResume ? body.userId : null,
          status: "completed",
        })
        .select("id")
        .single();
      executionId = data?.id ?? null;

      await supaAdmin.from("execution_logs").insert({
        agent_id: "00000000-0000-0000-0000-000000000000",
        user_id: body.userId,
        action: isApprovedResume ? "mcp_orquestrador_approved_resume" : "mcp_orquestrador",
        status: "success",
        execution_time_ms: Date.now() - overallStart,
        details: {
          mcp_execution_id: executionId,
          agentes_acionados: results.map((r) => r.agent),
          security_level: securityLevel,
          analise: routingDecision.analise,
        },
      });
    } catch (e) {
      console.error("Persist:", e);
    }
  }

  return jsonResp({
    response: finalText,
    raw: {
      routing: routingDecision,
      results,
      security_blocked: false,
      security_level: securityLevel,
      execution_id: executionId,
      totalMs: Date.now() - overallStart,
    },
  });
});

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
    .map((r) =>
      r.error ? `**${r.agent}** — ⚠️ ${r.error}` : `**${r.agent}**\n${r.output.trim()}`,
    )
    .join("\n\n---\n\n");

  return [
    `[ANÁLISE]\n${analise}`,
    `[AGENTES ACIONADOS]\n${agentes.join(", ")}`,
    `[RESPOSTA]\n${respostaConsolidada}`,
    `[CONFIANÇA]\n${confianca}`,
    `[ALERTA]\n${alerta && alerta.length > 0 ? alerta : "Nenhum"}`,
  ].join("\n\n");
}
