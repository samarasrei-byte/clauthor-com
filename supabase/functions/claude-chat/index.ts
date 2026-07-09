import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchAI } from "../_shared/ai-gateway.ts";

/**
 * "claude-chat" — nome legado. Agora roteia via Lovable AI Gateway.
 * Mantém o mesmo contrato (messages, system, model, max_tokens, temperature)
 * e o mesmo formato de resposta SSE OpenAI-compatível esperado pelo frontend.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, system, model, max_tokens, temperature } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Modelos Anthropic legados são mapeados para o gateway Lovable.
    const legacyMap: Record<string, string> = {
      "claude-sonnet-4-20250514": "openai/gpt-5.5",
      "claude-3-5-sonnet-20241022": "openai/gpt-5.5",
      "claude-3-opus-20240229": "openai/gpt-5.5",
      "claude-3-haiku-20240307": "google/gemini-2.5-flash",
    };
    const selectedModel = legacyMap[model as string] || model || "openai/gpt-5.5";

    const systemPrompt = system || `Você é o planejador sênior de IA da plataforma CLAUTHOR.
Sua função é raciocínio estratégico, análise complexa e orquestração de alto nível.
Seja conciso, preciso e acionável. Use formatação markdown.
Responda no mesmo idioma do usuário.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    ];

    const response = await fetchAI({
      model: selectedModel,
      messages: aiMessages,
      stream: true,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 4096,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Recarregue seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("claude-chat gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // O gateway Lovable já emite SSE no formato OpenAI — sem necessidade de transformar.
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("claude-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
