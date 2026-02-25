import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchAI } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { message, agentIds } = await req.json();

    if (!message || !agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return new Response(JSON.stringify({ error: "message and agentIds[] are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch ALL active agents for this user in the provided list
    const { data: allAgents, error: agentsError } = await adminClient
      .from("agents")
      .select("id, name, instructions, objective, tier, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("id", agentIds);

    if (agentsError || !allAgents || allAgents.length === 0) {
      return new Response(JSON.stringify({ error: "No active agents found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === SMART ROUTING: Use AI to select relevant agents ===
    let agents = allAgents;
    if (allAgents.length > 1) {
      try {
        const agentList = allAgents.map(a => `- ID: ${a.id} | Nome: ${a.name} | Objetivo: ${a.objective || a.name}`).join("\n");
        const routingResponse = await fetchAI({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `Você é um roteador de mensagens. Dado uma lista de agentes e uma mensagem do usuário, retorne APENAS os IDs dos agentes que são relevantes para responder à mensagem. Retorne um JSON array com os IDs. Se a mensagem for genérica (ex: "bom dia", "status geral"), retorne todos. Se for sobre um tema específico (ex: "melhorar vendas"), retorne apenas agentes daquela área.

Agentes disponíveis:
${agentList}

Responda APENAS com um JSON array de IDs, sem explicação. Ex: ["id1","id2"]`
            },
            { role: "user", content: message },
          ],
          max_tokens: 200,
          stream: false,
        });

        if (routingResponse.ok) {
          const routingData = await routingResponse.json();
          const routingContent = routingData.choices?.[0]?.message?.content || "";
          // Extract JSON array from response
          const match = routingContent.match(/\[[\s\S]*?\]/);
          if (match) {
            const selectedIds: string[] = JSON.parse(match[0]);
            const filtered = allAgents.filter(a => selectedIds.includes(a.id));
            if (filtered.length > 0) {
              agents = filtered;
              console.log(`Smart routing: ${allAgents.length} agents -> ${filtered.length} selected for: "${message.slice(0, 50)}"`);
            }
          }
        }
      } catch (routingErr) {
        console.warn("Smart routing fallback to all agents:", routingErr);
        // fallback: use all agents
      }
    }

    const { data: credits } = await adminClient
      .from("user_credits")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (credits && credits.used_credits >= credits.total_credits) {
      return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch company board data for context
    const { data: boardData } = await adminClient
      .from("company_board")
      .select("category, title, content")
      .eq("user_id", user.id)
      .limit(20);

    let companyContext = "";
    if (boardData && boardData.length > 0) {
      companyContext = "\n\n## INFORMAÇÕES DA EMPRESA DO CLIENTE:\n" +
        boardData.map(b => `[${b.category.toUpperCase()}] ${b.title}: ${b.content}`).join("\n");
    }

    const responses = await Promise.allSettled(
      agents.map(async (agent) => {
        const systemPrompt = `${agent.instructions || "Você é um assistente profissional especializado."}

## CONTEXTO DE REUNIÃO DE DEPARTAMENTO:
Você está em uma reunião de departamento com outros agentes de IA. O CEO/gestor enviou uma mensagem para TODO o time.
- Responda APENAS sobre sua área de especialidade: ${agent.objective || agent.name}
- Seja CONCISO (máximo 3 parágrafos)
- Se o assunto não é da sua alçada, diga brevemente e indique qual colega seria mais adequado (cite o nome exato do agente)
- Responda em português do Brasil
- Comece sua resposta identificando-se brevemente
${companyContext}`;

        const aiResponse = await fetchAI({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 800,
          stream: false,
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "Sem resposta.";
        const tokensUsed = aiData.usage?.total_tokens || 150;

        try {
          await adminClient.from("token_usage").insert({
            user_id: user.id,
            agent_id: agent.id,
            tokens_used: tokensUsed,
            action_type: "squad_chat",
            model: "google/gemini-3-flash-preview",
          });

          await adminClient
            .from("user_credits")
            .update({ used_credits: (credits?.used_credits || 0) + tokensUsed })
            .eq("user_id", user.id);
        } catch {}

        return {
          agentId: agent.id,
          agentName: agent.name,
          tier: agent.tier,
          content,
        };
      })
    );

    const results = responses.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return {
        agentId: agents[i]?.id || "unknown",
        agentName: agents[i]?.name || "Agente",
        tier: agents[i]?.tier || "basic",
        content: "⚠️ Não consegui processar neste momento. Tente novamente.",
      };
    });

    return new Response(JSON.stringify({ responses: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Squad chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
