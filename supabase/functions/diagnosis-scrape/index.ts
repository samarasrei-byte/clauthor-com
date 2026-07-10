// Diagnosis-scrape: takes the landing quiz answers, uses Firecrawl to fetch
// the company website in `summary` format, then asks Lovable AI to produce a
// compact "Thor briefing" the panel will consume on first entry.
//
// Fire-and-forget from the client. Always returns 200 with { briefing, siteSummary? }.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1";

interface Payload {
  website?: string;
  company?: string;
  pain?: string;
  freeText?: string;
  departmentLabel?: string;
}

function normalizeUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // basic sanity — must contain a dot
  if (!/[.]/.test(trimmed)) return null;
  return `https://${trimmed}`;
}

async function firecrawlSummary(url: string, apiKey: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["summary", "markdown"],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Firecrawl failed [${res.status}]: ${txt}`);
      return null;
    }
    const data = await res.json();
    // v2 may nest under data.*
    const payload = data?.data ?? data;
    const summary: string | undefined = payload?.summary;
    const md: string | undefined = payload?.markdown;
    if (summary && summary.trim().length > 40) return summary.trim();
    if (md) return md.slice(0, 4000);
    return null;
  } catch (err) {
    console.error("Firecrawl scrape error:", err);
    return null;
  }
}

async function generateThorBriefing(
  input: Payload,
  siteSummary: string | null,
  apiKey: string,
): Promise<string> {
  const systemPrompt =
    "Você é Thor, CEO e orquestrador dos agentes Clauthor. Escreva em português do Brasil, tom executivo e caloroso, sem clichês. Máximo 4 parágrafos curtos.";

  const userPrompt = [
    `A pessoa acabou de completar o diagnóstico na landing e entrou no painel.`,
    input.company ? `Empresa: ${input.company}` : null,
    input.website ? `Site: ${input.website}` : null,
    input.pain ? `Dor principal escolhida: ${input.pain}` : null,
    input.departmentLabel ? `Departamento recomendado: ${input.departmentLabel}` : null,
    input.freeText ? `O que ela contou em texto livre: "${input.freeText}"` : null,
    siteSummary ? `\nResumo do site (Firecrawl):\n${siteSummary.slice(0, 2500)}` : null,
    "",
    `Tarefas:`,
    `1) Cumprimente pelo nome da empresa e mostre que você entendeu o negócio (cite 1 detalhe concreto do site se houver).`,
    `2) Confirme em 1 frase o departamento pré-ativado e por que ele resolve a dor.`,
    `3) Explique em 2 bullets muito curtos: (a) próximo passo dentro do painel (aprovar/customizar), (b) que o pagamento acontece dentro do painel quando ela decidir ativar.`,
    `4) Pergunte se ela quer começar agora. Sem promessas de tempo, sem valores, sem emojis exagerados.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`${AI_GATEWAY}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const txt = await res.text();
      console.error(`AI gateway failed [${res.status}]: ${txt}`);
      return fallbackBriefing(input);
    }
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    return text?.trim() || fallbackBriefing(input);
  } catch (err) {
    console.error("AI briefing error:", err);
    return fallbackBriefing(input);
  }
}

function fallbackBriefing(input: Payload): string {
  const company = input.company || "sua empresa";
  const dept = input.departmentLabel || "o departamento recomendado";
  return `Bem-vindo. Sou o Thor, orquestrador dos agentes Clauthor.\n\nJá registrei o contexto de ${company} e pré-ativei ${dept} pra você. O próximo passo é aqui mesmo no painel: você revisa o time, ajusta se quiser e ativa quando estiver pronto — o pagamento acontece dentro da própria plataforma, sem sair daqui.\n\nQuer que eu comece agora?`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    const url = normalizeUrl(body.website);

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let siteSummary: string | null = null;
    if (url && firecrawlKey) {
      siteSummary = await firecrawlSummary(url, firecrawlKey);
    }

    let briefing = fallbackBriefing(body);
    if (lovableKey) {
      briefing = await generateThorBriefing(body, siteSummary, lovableKey);
    }

    return new Response(
      JSON.stringify({ briefing, siteSummary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("diagnosis-scrape unhandled:", err);
    return new Response(
      JSON.stringify({ briefing: fallbackBriefing({}), siteSummary: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
