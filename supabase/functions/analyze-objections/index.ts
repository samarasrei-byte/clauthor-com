import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  agentSlug: string;
  contexts: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { agentSlug, contexts }: Body = await req.json();
    if (!agentSlug || !Array.isArray(contexts) || contexts.length === 0) {
      return new Response(JSON.stringify({ error: "agentSlug and contexts[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = contexts.slice(0, 40).map((c) => c.slice(0, 500));
    const prompt = `Você é analista de pré-venda. Abaixo estão ${trimmed.length} descrições de negócio de usuários que SIMULARAM o agente "${agentSlug}" mas NÃO contrataram. Identifique padrões, objeções implícitas e recomende 3 ajustes concretos de pitch, preço ou posicionamento. Retorne JSON válido no formato exato:
{
  "patterns": [{"label": string, "count": number, "examples": string[]}],
  "objections": [string],
  "recommendations": [{"title": string, "action": string, "impact": "alto"|"médio"|"baixo"}]
}

Contextos:
${trimmed.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você retorna APENAS JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: "gateway error", detail: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { patterns: [], objections: [], recommendations: [], raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
