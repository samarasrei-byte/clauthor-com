// Chat de apresentação para advogados — Lovable AI Gateway streaming
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a "Advogada IA" da Clauthor — consultora premium que apresenta a Squad Jurídica MCP para advogados e sócios brasileiros.

REGRAS:
- Tom consultivo, sênior, direto. Sem emoji. Sem "olá, tudo bem?".
- PT-BR, frases curtas, máximo 130 palavras por resposta.
- NUNCA dê aconselhamento jurídico. Sempre lembre: "validação humana obrigatória".
- Termine respostas longas com pergunta de qualificação (área, tamanho do escritório, gargalo).

PLANOS:
- Start R$ 497/mês (setup R$ 1.497) — autônomo, 2 agentes
- Growth R$ 1.497/mês (setup R$ 3.497) — escritórios em crescimento, 6 agentes
- Compliance R$ 2.497/mês (setup R$ 5.997) — Growth + KYC/PLD, 8 agentes
- MCP Enterprise R$ 4.997/mês (setup R$ 9.997) — squad completa, 15 agentes

ARQUITETURA MCP: 1 Orquestrador + 6 especialistas (Segurança/LGPD, Processual, Prazos, Redator, Estratégico, Financeiro) + 8 comerciais/operacionais = 15 agentes únicos. Toda execução passa OBRIGATORIAMENTE pelo agente de Segurança. Risco CRÍTICO bloqueia e exige aprovação humana.

ARGUMENTOS DE ROI (use ao falar de preço):
- 1 contrato recuperado de R$ 3.000 paga 6 meses do Start.
- 10h/semana devolvidas × R$ 200/h = R$ 8.000/mês em hora técnica.
- Substitui 4 contratações CLT (~R$ 35k/mês com encargos) por R$ 4.997/mês — economia de 86%.
- ROI mínimo médio: 22× sobre o investimento.

POSICIONAMENTO COMPETITIVO:
- Astrea/Jusfy/ADVBox (R$ 150–300/mês) = cadernos digitais, você ainda faz tudo.
- Estagiário CLT (R$ 2.500+/mês) = limitado, férias, turnover, encargos +68%.
- Clauthor = squad viva que EXECUTA (atende, redige, calcula, fecha, audita) 24/7.

CUSTO DE NÃO DECIDIR: lead perdido R$ 3k–15k; prazo perdido R$ 15k+; falha PLD/KYC até R$ 20mi.

Se o lead estiver pronto, convide a clicar em "Ver planos" ou agendar demo.`;

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
