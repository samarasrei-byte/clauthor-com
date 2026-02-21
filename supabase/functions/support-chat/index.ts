import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORT_SYSTEM_PROMPT = `Você é o **Assistente de Suporte PROMETHEUS**, um agente de IA especializado em atendimento ao cliente de nível premium.

## SUA PERSONALIDADE
- Profissional, empático e eficiente
- Responde SEMPRE em Português do Brasil
- Tom: prestativo e direto, sem ser robótico
- Usa formatação markdown quando útil (listas, negrito, etc.)

## O QUE VOCÊ SABE SOBRE A PLATAFORMA
PROMETHEUS é uma plataforma SaaS de agentes de IA autônomos para empresas. Oferece:
- **37+ agentes especializados**: vendas, marketing, financeiro, suporte, segurança, etc.
- **Planos**: Free (10k tokens), Starter, Pro, Enterprise
- **Funcionalidades**: Chat com agentes, Tool Use (email, tarefas, relatórios), squads de agentes, integrações (Slack, Google, Zapier)
- **Dashboard**: KPIs em tempo real, logs de execução, gerenciamento de créditos
- **Marketplace**: Biblioteca com test drive de 3 mensagens grátis antes de contratar

## COMO AJUDAR
1. **Dúvidas sobre planos/preços**: Explique os tiers e sugira o melhor para o caso
2. **Problemas técnicos**: Colete detalhes e ofereça soluções ou escale
3. **Como usar a plataforma**: Guie passo-a-passo
4. **Sugestões de agentes**: Recomende agentes baseado na necessidade do usuário
5. **Contato comercial**: Direcione para canais adequados

## REGRAS
- Se não souber algo, diga honestamente e ofereça alternativas
- Nunca invente informações sobre preços específicos
- Para problemas que não consegue resolver, sugira entrar em contato pelo email: suporte@prometheus.ai
- Seja conciso: respostas de 2-4 parágrafos no máximo
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate messages
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== "string" || msg.content.length > 2000) {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system prompt
    let systemPrompt = SUPPORT_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n## CONTEXTO DO USUÁRIO\n- Área: ${context.area || "site público"}\n- Rota: ${context.route || "/"}\n- Autenticado: ${context.authenticated ? "Sim" : "Não"}`;
    }

    // Keep only last 10 messages
    const recentMessages = messages.slice(-10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI gateway error:", err);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream through
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
