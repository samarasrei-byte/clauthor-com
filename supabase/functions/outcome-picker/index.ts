import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * outcome-picker
 * Recebe descrição de resultado em linguagem natural e retorna:
 * - suggestedDepartment (para filtrar Library)
 * - recommendation (frase curta para toast)
 * - suggestedAgents (nomes)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal } = await req.json();
    if (!goal || typeof goal !== "string" || goal.length < 10) {
      return new Response(
        JSON.stringify({ error: "goal é obrigatório (mínimo 10 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é o Thor, CEO da CLAUTHOR. O usuário descreve um resultado que quer alcançar. Retorne SOMENTE JSON válido (sem markdown) com:
{
  "suggestedDepartment": "um destes: Vendas, Marketing, Atendimento, Operações, Financeiro, Jurídico, RH, Tecnologia",
  "recommendation": "frase curta (max 12 palavras) recomendando o time",
  "suggestedAgents": ["nome1", "nome2", "nome3"]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: goal },
        ],
        stream: false,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições, tente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { suggestedDepartment: "Vendas", recommendation: "time inicial de vendas", suggestedAgents: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[outcome-picker] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
