import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { resolveDepartmentPromptForAgent } from "../_shared/department-prompts.ts";

/**
 * simulate-agent
 * Projeta 30 dias de operação do agente dado o contexto do negócio.
 * Retorna JSON: { headline, actionsPerDay, outcomesPerMonth, savings_brl, confidence, assumptions[], risks[] }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentSlug, agentName, context } = await req.json();
    if (!agentName || !context || context.length < 20) {
      return new Response(
        JSON.stringify({ error: "agentName e context (mín. 20 chars) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um analista de ROI da CLAUTHOR. Dado um agente e o contexto de negócio, projete 30 dias de operação com números realistas e conservadores.

Retorne SOMENTE JSON válido (sem markdown, sem \`\`\`) com:
{
  "headline": "frase impactante de 1 linha com o ganho principal",
  "actionsPerDay": <número inteiro>,
  "outcomesPerMonth": "descrição curta do resultado mensal (ex: '~45 leads qualificados')",
  "savings_brl": "R$ X.XXX/mês economizados ou gerados",
  "confidence": "baixa" | "média" | "alta",
  "assumptions": ["premissa 1", "premissa 2", "premissa 3"],
  "risks": ["risco 1", "risco 2"]
}

Seja conservador nos números. Use "média" ou "baixa" quando o contexto for vago.`;

    const userMsg = `Agente: ${agentName} (slug: ${agentSlug})\n\nContexto do negócio:\n${context}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
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
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        headline: "Projeção conservadora com base no seu contexto",
        actionsPerDay: 20,
        outcomesPerMonth: "resultados iniciais mensuráveis",
        savings_brl: "R$ 2.000/mês",
        confidence: "baixa",
        assumptions: ["Dados limitados fornecidos"],
        risks: ["Precisa de mais contexto para precisão"],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[simulate-agent] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
