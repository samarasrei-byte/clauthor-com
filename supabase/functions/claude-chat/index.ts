import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { streamAIChat, validateMessages } from "../_shared/streamChat.ts";

/**
 * "claude-chat" — nome legado, agora roteia via Lovable AI Gateway
 * usando o helper _shared/streamChat.ts para transporte SSE + tratamento de erro.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, system, model, max_tokens, temperature } = await req.json();

    const invalid = validateMessages(messages);
    if (invalid) return invalid;

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

    const { response } = await streamAIChat({
      model: selectedModel,
      messages: aiMessages,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens || 4096,
    });

    return response;
  } catch (error) {
    console.error("claude-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
