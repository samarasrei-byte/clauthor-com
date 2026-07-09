import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

// Classifies user need into agent/squad/department and returns a specific recommendation.
serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;

  try {
    const { url, text, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let context = "";
    if (url) {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ClauthorBot/1.0)" },
          redirect: "follow",
        });
        const html = await r.text();
        context += "SITE:\n" + html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 6000);
      } catch {
        context += `SITE_URL: ${url} (não foi possível acessar)\n`;
      }
    }
    if (text) context += "\n\nTEXTO:\n" + String(text).slice(0, 6000);
    if (description) context += "\n\nDOR/OBJETIVO:\n" + String(description).slice(0, 2000);

    if (!context.trim()) {
      return new Response(JSON.stringify({ error: "Contexto vazio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `Você é o Thor, orquestrador da CLAUTHOR — uma plataforma com 20 departamentos e 225 agentes de IA especializados.
Sua missão: entender profundamente o negócio e a DOR real do usuário e recomendar EXATAMENTE o que ele precisa: um agente único, um squad (3-6 agentes) ou um departamento completo.

Departamentos disponíveis: Marketing, Vendas, Atendimento, Financeiro, Jurídico, RH, TI, Produto, Operações, Logística, Compras, Dados, Growth, Design, Conteúdo, Sucesso do Cliente, Estratégia, Compliance, Inovação, Executivo.

Regras:
- "agent" quando a dor é 1 função específica e recorrente (ex: escrever posts de LinkedIn).
- "squad" quando é um objetivo tático que precisa de 3-6 especialistas coordenados (ex: lançar um produto).
- "department" quando é uma área inteira precisando de operação contínua (ex: automatizar todo o marketing).

Responda APENAS com JSON válido, sem markdown, seguindo estritamente este schema:
{
  "business_summary": "1 frase sobre o negócio",
  "detected_pain": "a dor real detectada, em 1 frase específica",
  "need_type": "agent" | "squad" | "department",
  "recommendation_name": "nome específico do agente/squad/departamento recomendado",
  "recommendation_pitch": "por que este é o match perfeito, 2 frases persuasivas",
  "agents": ["Nome Agente 1", "Nome Agente 2", ...],
  "expected_outcome": "resultado tangível em 30 dias, 1 frase",
  "confidence": 0.0-1.0
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI error", detail: errTxt }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { business_summary: "", detected_pain: "", need_type: "agent", recommendation_name: "Agente Especialista", recommendation_pitch: content.slice(0, 240), agents: [], expected_outcome: "", confidence: 0.6 };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
