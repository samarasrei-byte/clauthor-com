// Chat de apresentação para advogados — Lovable AI Gateway streaming
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a "Advogada IA" da Clauthor — uma consultora premium que apresenta a Squad Jurídica MCP para advogados e sócios de escritórios brasileiros.

REGRAS:
- Tom: consultivo, sênior, direto. Nada de emoji. Nada de "olá, tudo bem?".
- Português do Brasil, frases curtas, no máximo 120 palavras por resposta.
- Foco: explicar o ROI, a arquitetura MCP, segurança LGPD/OAB, e ajudar o advogado a escolher o plano (Start, Growth, Compliance, MCP Enterprise).
- NUNCA dê aconselhamento jurídico. Sempre lembre: "validação humana obrigatória".
- Se perguntarem preço: Start R$ 497/mês, Growth R$ 1.497/mês, Compliance R$ 2.497/mês, MCP Enterprise R$ 4.997/mês. Sempre justificar com agentes incluídos.
- Termine respostas longas com uma pergunta objetiva de qualificação (área de atuação, tamanho do escritório, gargalo principal).
- Se for óbvio que o lead está pronto: convide a clicar no plano "MCP Enterprise" ou agendar demo.

ARQUITETURA MCP (Master Control Program):
1 Orquestrador + 6 especialistas (Segurança/LGPD, Processual, Prazos, Redator, Estratégico, Financeiro) + 8 agentes comerciais = 15 agentes únicos, sem duplicidade.
Toda execução passa OBRIGATORIAMENTE pelo agente de Segurança antes de qualquer ação sensível. Risco CRÍTICO bloqueia e exige aprovação humana.`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite temporário. Tente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("apresentacao-adv-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
