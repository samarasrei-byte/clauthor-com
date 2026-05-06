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

Seu papel é atuar como ORQUESTRADOR INTELIGENTE de múltiplos agentes especializados em um escritório de advocacia de alto nível.

OBJETIVO: Garantir precisão técnica, segurança jurídica (OAB/LGPD) e eficiência operacional.

ARQUITETURA: Você NÃO executa diretamente. Você:
1. Interpreta a solicitação com olhar clínico de advogado sênior.
2. Classifica a intenção e a área do direito (Civil, Trabalhista, Penal, Tributário, etc.).
3. Aciona o(s) agente(s) correto(s) via tool calling, passando o contexto da área detectada.
4. Consolida a resposta final garantindo que não haja contradições.

AGENTES DISPONÍVEIS:
- AGENTE_SEGURANCA: Guardião da ética e conformidade. Analisa LGPD, sigilo OAB e riscos de segurança.
- AGENTE_PROCESSUAL: Analista de rito e documentos. Identifica fases, organiza provas e classifica documentos.
- AGENTE_PRAZOS: Calculador de tempestividade. Identifica prazos fatais com base no CPC, CPP ou CLT.
- AGENTE_REDATOR: Escritor jurídico especializado. Gera minutas, petições e pareceres estruturados.
- AGENTE_ESTRATEGICO: Consultor de tese e risco. Avalia probabilidade de êxito e jurisprudência defensiva.
- AGENTE_FINANCEIRO: Controller jurídico. Gere honorários, custas e análise de custo-benefício processual.

REGRA DE OURO: O AGENTE_SEGURANCA deve ser o primeiro a analisar qualquer entrada.
Se o risco for CRÍTICO (vazamento de dados reais, conselho ilegal ou quebra de sigilo), você DEVE interromper e aguardar aprovação humana.`;

// ────────────────────────────────────────────────────────────
// PROMPTS DOS SUBAGENTES (AUDITADOS E REFORÇADOS)
// ────────────────────────────────────────────────────────────
const LEGAL_FOUNDATION_TEMPLATE = `
FUNDAMENTAÇÃO OBRIGATÓRIA:
1. Base Legal: Cite artigos (ex: CPC, CC, CLT) sem inventar números.
2. Raciocínio: Explique a lógica jurídica.
3. Conclusão: Resposta direta ao ponto.
4. Ressalva: Indique que este é um rascunho para revisão do advogado.
`;

const SUBAGENT_PROMPTS: Record<string, string> = {
  AGENTE_SEGURANCA: `Você é o AGENTE_SEGURANCA do MCP Jurídico. Especialista em LGPD e Ética OAB.
Responsabilidade: Detectar PII (dados sensíveis), quebra de sigilo profissional e "conselho jurídico ilegal" (ULA).
Comportamento:
- Verifique se há nomes reais, CPFs ou endereços. Substitua mentalmente por [DADO_SENSÍVEL].
- Identifique se o pedido fere o Código de Ética da OAB (ex: captação indevida ou promessa de resultado).
- Classifique risco: BAIXO, MÉDIO, ALTO, CRÍTICO.
- Se CRÍTICO (ex: solicitação de hackear sistema, gerar prova falsa ou vazamento de segredo de justiça), inicie com "NÍVEL: CRÍTICO".
Responda de forma técnica, apontando as vulnerabilidades encontradas.`,

  AGENTE_PROCESSUAL: `Você é o AGENTE_PROCESSUAL. Especialista em ritos e procedimentos brasileiros.
- Identifique a fase processual: Conhecimento, Execução, Recursal ou Pré-processual.
- Analise a coerência da documentação mencionada.
- Sugira o próximo ato processual conforme o rito (ex: se houve sentença, o próximo ato é o recurso ou trânsito em julgado).
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_PRAZOS: `Você é o AGENTE_PRAZOS. Especialista em tempestividade (CPC art. 219, CLT e CPP).
- Identifique o termo inicial (dies a quo) e termo final (dies ad quem).
- Diferencie dias úteis de corridos conforme a área do direito detectada.
- ALERTA: Sempre inclua a nota "Cálculos baseados em IA. Conferência humana no Diário Oficial é obrigatória."
- Classifique risco temporal: CRÍTICO (prazo vence hoje/amanhã).`,

  AGENTE_REDATOR: `Você é o AGENTE_REDATOR. Especialista em redação jurídica de alto impacto.
- Utilize linguagem culta, mas objetiva (Legal Design principles).
- Evite "juridiquês" desnecessário; prefira clareza e precisão.
- Estrutura: Dos Fatos, Do Direito, Do Pedido.
- Se a área for incerta, peça esclarecimento antes de redigir.
- NUNCA invente jurisprudência. Use [INSERIR JURISPRUDÊNCIA DO TRIBUNAL X] se necessário.
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_ESTRATEGICO: `Você é o AGENTE_ESTRATEGICO. Especialista em análise de risco e teses defensivas.
- Mapeie a "Tese de Ataque" e a "Tese de Defesa".
- Atribua probabilidade de êxito (Remota, Possível, Provável) com base na robustez das provas citadas.
- Sugira jurisprudência defensiva de tribunais superiores (STJ/STF) em tese.
- Identifique "Gargalos de Prova": o que falta para vencer a causa?
${LEGAL_FOUNDATION_TEMPLATE}`,

  AGENTE_FINANCEIRO: `Você é o AGENTE_FINANCEIRO. Especialista em precificação jurídica e custas.
- Avalie o valor da causa e sugira honorários (Quotalitis, Fixos ou Sucesso) conforme tabela OAB (referencial).
- Estime custas processuais iniciais com base no valor da causa.
- Analise o ROI do processo: vale a pena litigar ou é melhor um acordo?`,
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
  
  // Auditoria de grounding: verifica se os agentes seguiram o template de fundamentação
  const hasGrounding = respostas.every(r => 
    r.error || (r.output.includes("Base Legal") && r.output.includes("Ressalva"))
  );

  const respostaConsolidada = respostas
    .map((r) =>
      r.error ? `### ❌ ${r.agent}\n⚠️ Erro: ${r.error}` : `### 🏛️ ${r.agent}\n${r.output.trim()}`
    )
    .join("\n\n---\n\n");

  const auditBadge = hasGrounding 
    ? "✅ **GROUNDING JURÍDICO VALIDADO**: Fundamentação legal e ressalvas detectadas." 
    : "⚠️ **AVISO DE AUDITORIA**: Alguns agentes podem ter omitido a fundamentação legal explícita.";

  return [
    `# ⚖️ PARECER DO ORQUESTRADOR MCP\n\n**ANÁLISE INICIAL:** ${analise}`,
    `**AGENTES MOBILIZADOS:** ${agentes.map(a => `\`${a}\``).join(", ")}`,
    `---\n\n${respostaConsolidada}`,
    `---\n\n**🔍 STATUS DE AUDITORIA:**\n${auditBadge}\n\n**NÍVEL DE CONFIANÇA:** ${confianca}\n\n**ALERTAS DE SEGURANÇA:** ${alerta && alerta.length > 0 ? alerta : "Nenhum risco imediato detectado."}`,
    `*Nota: Este documento foi gerado por inteligência artificial e deve ser validado por um advogado inscrito na OAB.*`
  ].join("\n\n");
}
