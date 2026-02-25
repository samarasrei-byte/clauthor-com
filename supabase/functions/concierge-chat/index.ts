import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";
import { checkRateLimit, rateLimitResponse, securityHeaders } from "../_shared/security.ts";
import { createExecutionTracker } from "../_shared/resilience.ts";
import { buildAgentContract, getTierSLA, getAreaLimits, type AgentContract } from "../_shared/agent-contract.ts";
import { validateLimits } from "../_shared/policy-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return `${i + 1}. **${a.name}** (${a.tier}) — ${a.objective || a.description || "Agente especializado"}`;
    }).join("\n");

    const systemPrompt = `${contractPrompt}

Você é o **CLAUTHOR Concierge** — o guia pessoal mais simpático e eficiente para novos clientes.

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
Os agentes executam ações REAIS: emails, tarefas, relatórios, leads, reuniões.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [{ role: "user", content: "Olá! Acabei de chegar." }]),
    ];

    const aiStep = tracker.step("ai_call");
    const response = await fetchAI({
      model: "google/gemini-2.5-flash-lite",
      messages: apiMessages,
      stream: true,
      max_tokens: 300,
      temperature: 0.6,
    });

    if (!response.ok) {
      aiStep.fail(`HTTP ${response.status}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI Gateway failed");
    }
    aiStep.done();

    // Log execution
    try {
      await adminClient.from("execution_logs").insert({
        user_id: user.id,
        agent_id: "00000000-0000-0000-0000-000000000005",
        action: "concierge_chat",
        status: "success",
        execution_time_ms: tracker.summary().totalMs,
        details: { contract_applied: true, area: "concierge", agents_count: activeAgents.length },
      });
    } catch {}

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Concierge error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
