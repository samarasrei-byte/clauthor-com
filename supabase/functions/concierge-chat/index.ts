import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { checkRateLimit, rateLimitResponse, securityHeaders } from "../_shared/security.ts";
import { createExecutionTracker } from "../_shared/resilience.ts";
import { buildAgentContract, getTierSLA, getAreaLimits, type AgentContract } from "../_shared/agent-contract.ts";
import { validateLimits } from "../_shared/policy-engine.ts";
import { streamAIChat, validateMessages } from "../_shared/streamChat.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse, streamResponse } from "../_shared/cors.ts";

// ── Credential extraction via AI tool-calling ──
const CREDENTIAL_TOOL = {
  type: "function" as const,
  function: {
    name: "save_credentials",
    description: "Save user credentials/access info for an integration (WhatsApp, Email, LinkedIn, etc). Call this when the user provides login details, API keys, passwords, phone numbers, or access tokens for any service.",
    parameters: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID to associate credentials with. Use the first active agent if not specified.",
        },
        credentials: {
          type: "array",
          items: {
            type: "object",
            properties: {
              integration_name: {
                type: "string",
                description: "Service name: whatsapp, email, linkedin, instagram, hubspot, etc.",
              },
              credential_key: {
                type: "string",
                description: "Key name: api_key, password, phone_number, access_token, smtp_host, smtp_user, smtp_password, etc.",
              },
              credential_value: {
                type: "string",
                description: "The actual credential value provided by the user.",
              },
            },
            required: ["integration_name", "credential_key", "credential_value"],
          },
          description: "Array of credentials to save.",
        },
      },
      required: ["credentials"],
    },
  },
};

async function handleCredentialSave(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  agentId: string,
  credentials: Array<{ integration_name: string; credential_key: string; credential_value: string }>,
  supabaseUrl: string,
  authHeader: string,
): Promise<{ saved: string[]; errors: string[] }> {
  const saved: string[] = [];
  const errors: string[] = [];

  for (const cred of credentials) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/credential-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          action: "save",
          agent_id: agentId,
          integration_name: cred.integration_name.toLowerCase(),
          credential_key: cred.credential_key.toLowerCase(),
          credential_value: cred.credential_value,
          is_secret: true,
        }),
      });

      if (res.ok) {
        saved.push(`${cred.integration_name}/${cred.credential_key}`);
      } else {
        const err = await res.json().catch(() => ({}));
        errors.push(`${cred.integration_name}/${cred.credential_key}: ${err.error || "failed"}`);
      }
    } catch (e) {
      errors.push(`${cred.integration_name}/${cred.credential_key}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return { saved, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`concierge:${clientIP}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    const tracker = createExecutionTracker();
    const authStep = tracker.step("auth");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    authStep.done();

    const { messages, language } = await req.json();

    // Input validation
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (!msg.content || typeof msg.content !== "string" || msg.content.length > 4000) {
          return new Response(JSON.stringify({ error: "Invalid message format" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      if (messages.length > 50) {
        return new Response(JSON.stringify({ error: "Too many messages" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === CREDIT VALIDATION via Policy Engine ===
    const creditStep = tracker.step("credit_validation");
    const { data: credits } = await adminClient
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (credits) {
      const creditCheck = validateLimits(credits.used_credits, credits.total_credits);
      if (!creditCheck.allowed) {
        creditStep.done("blocked");
        return new Response(JSON.stringify({ error: creditCheck.reason, suggest_upgrade: true }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    creditStep.done();

    // === BUILD CONCIERGE CONTRACT ===
    const contract: AgentContract = {
      agentId: "concierge",
      agentName: "CLAUTHOR Concierge",
      tenantId: "client",
      userId: user.id,
      tier: credits?.plan_type === "enterprise" ? "enterprise" : credits?.plan_type === "pro" ? "advanced" : "basic",
      planType: credits?.plan_type || "free",
      area: "concierge",
      objective: "Guiar o cliente pela plataforma e demonstrar o valor dos agentes contratados",
      limits: getAreaLimits("concierge"),
      sla: getTierSLA(credits?.plan_type === "enterprise" ? "enterprise" : "basic"),
    };
    const contractPrompt = buildAgentContract(contract);

    const langMap: Record<string, string> = {
      pt: "português do Brasil", en: "English", es: "español", fr: "français",
      de: "Deutsch", it: "italiano", ja: "日本語", zh: "中文",
      ar: "العربية", hi: "हिन्दी", ru: "русский", ko: "한국어", tr: "Türkçe",
    };
    const userLang = langMap[language] || langMap["pt"];

    const { data: agents } = await adminClient
      .from("agents")
      .select("id, name, description, tier, status, instructions, objective")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const activeAgents = (agents || []).filter((a: any) => a.status === "active");

    const agentsList = activeAgents.map((a: any, i: number) => {
      return `${i + 1}. **${a.name}** (${a.tier}) [ID: ${a.id}] - ${a.objective || a.description || "Agente especializado"}`;
    }).join("\n");

    // Check if user seems to be providing credentials
    const lastUserMsg = (messages || []).filter((m: any) => m.role === "user").pop()?.content || "";
    const credentialIntent = /senha|password|api.?key|token|acesso|login|credencial|chave|phone|telefone|whatsapp|smtp|e-?mail.*acesso|linkedin.*senha/i.test(lastUserMsg);

    const systemPrompt = `${contractPrompt}

Você é o **CLAUTHOR Concierge** - o guia pessoal mais simpático e eficiente para novos clientes.

## AGENTES DO CLIENTE (${activeAgents.length} ativos):
${agentsList || "Nenhum agente ativo ainda."}

## REGRAS:
1. Seja caloroso e entusiasta (2-3 emojis por mensagem)
2. Na primeira mensagem, apresente-se e liste os agentes
3. Sugira demos interativas
4. Sempre termine com sugestão de ação
5. Máximo 80 palavras
6. Se sem agentes, oriente para /library
7. **IDIOMA: ${userLang}**

## SEÇÕES DO DASHBOARD:
- Command Center, Meus Agentes, Reunião, Assistente IA, Analytics, Logs

## DIFERENCIAL:
Os agentes executam ações REAIS: emails, tarefas, relatórios, leads, reuniões.

## COLETA DE CREDENCIAIS:
Quando o usuário fornecer dados de acesso (senhas, tokens, API keys, telefones, etc.) para integrar com WhatsApp, E-mail, LinkedIn, ou qualquer serviço:
1. Use a ferramenta **save_credentials** para salvar IMEDIATAMENTE no cofre criptografado
2. Se o usuário não especificar qual agente, use o primeiro agente ativo: ${activeAgents[0]?.id || "nenhum"}
3. Confirme que salvou com sucesso e que os dados estão protegidos com criptografia AES-256
4. NUNCA repita os valores das credenciais na sua resposta - apenas confirme que foram salvas
5. Se o usuário quiser passar várias credenciais de uma vez, colete todas e salve em uma chamada
6. Integrações suportadas: whatsapp, email, linkedin, instagram, hubspot, apollo, slack, google, meta_ads`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [{ role: "user", content: "Olá! Acabei de chegar." }]),
    ];

    const aiStep = tracker.step("ai_call");

    // If credential intent detected, use tool-calling (non-streaming) first
    if (credentialIntent && activeAgents.length > 0) {
      const toolResponse = await fetchAI({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: false,
        max_tokens: 500,
        temperature: 0.3,
        tools: [CREDENTIAL_TOOL],
        tool_choice: "auto",
      });

      if (!toolResponse.ok) {
        aiStep.fail(`HTTP ${toolResponse.status}`);
        throw new Error("AI Gateway failed");
      }

      const toolData = await toolResponse.json();
      const choice = toolData.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // Process tool calls
        const toolResults: any[] = [];
        for (const tc of toolCalls) {
          if (tc.function.name === "save_credentials") {
            const args = JSON.parse(tc.function.arguments);
            const agentId = args.agent_id || activeAgents[0]?.id;
            
            if (!agentId) {
              toolResults.push({
                role: "tool",
                tool_call_id: tc.id,
                content: JSON.stringify({ error: "Nenhum agente ativo para associar credenciais." }),
              });
              continue;
            }

            const result = await handleCredentialSave(
              adminClient, user.id, agentId, args.credentials,
              supabaseUrl, authHeader,
            );

            toolResults.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({
                success: result.saved.length > 0,
                saved: result.saved,
                errors: result.errors,
                agent_id: agentId,
                agent_name: activeAgents.find((a: any) => a.id === agentId)?.name || "Agente",
              }),
            });
          }
        }

        // Get final response with tool results (streaming)
        const finalMessages = [
          ...apiMessages,
          choice.message,
          ...toolResults,
        ];

        const finalResponse = await fetchAI({
          model: "google/gemini-2.5-flash",
          messages: finalMessages,
          stream: true,
          max_tokens: 300,
          temperature: 0.6,
        });

        if (!finalResponse.ok) {
          throw new Error("AI final response failed");
        }

        aiStep.done();

        // Log
        try {
          await adminClient.from("execution_logs").insert({
            user_id: user.id,
            agent_id: "00000000-0000-0000-0000-000000000005",
            action: "concierge_credential_save",
            status: "success",
            execution_time_ms: tracker.summary().totalMs,
            details: { credentials_saved: true, tool_calls: toolCalls.length },
          });
        } catch {}

        return new Response(finalResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // No tool call - fall through to normal streaming with the content
      if (choice?.message?.content) {
        aiStep.done();
        // Convert to SSE format
        const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: choice.message.content } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sseData, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // Normal streaming response (no credential intent) — via shared helper
    const stream = await streamAIChat({
      model: "google/gemini-2.5-flash-lite",
      messages: apiMessages,
      max_tokens: 300,
      temperature: 0.6,
    });

    if (!stream.ok) {
      aiStep.fail(`gateway_error`);
      return stream.response;
    }
    aiStep.done();

    // Log execution + token usage
    try {
      const estimatedTokens = (messages || []).reduce((sum: number, m: any) => sum + Math.ceil((m.content?.length || 0) / 4), 0) + 75;
      await Promise.all([
        adminClient.from("execution_logs").insert({
          user_id: user.id,
          agent_id: "00000000-0000-0000-0000-000000000005",
          action: "concierge_chat",
          status: "success",
          execution_time_ms: tracker.summary().totalMs,
          details: { contract_applied: true, area: "concierge", agents_count: activeAgents.length },
        }),
        adminClient.from("token_usage").insert({
          user_id: user.id,
          agent_id: null,
          tokens_used: estimatedTokens,
          action_type: "concierge_chat",
          model: "google/gemini-2.5-flash-lite",
        }),
      ]);
    } catch {}

    return stream.response;
  } catch (error) {
    console.error("Concierge error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
