/**
 * pain-analyzer · Onboarding Zero salto #1
 *
 * Recebe a dor bruta digitada pelo usuário e devolve:
 *  - paraphrase: paráfrase empática curta (1 frase, ≤18 palavras)
 *  - focus:      "comercial" | "atendimento" | "marketing" | "financeiro"
 *  - confidence: 0-100
 *
 * Elimina a etapa QuickPicks quando confidence ≥ 60.
 */
import { corsHeaders } from "../_shared/cors.ts";

const ALLOWED_FOCUS = ["comercial", "atendimento", "marketing", "financeiro"] as const;
type Focus = (typeof ALLOWED_FOCUS)[number];

const SYSTEM_PROMPT = `Você é o Thor, consultor empático de PMEs brasileiras. Um empresário te contou uma dor.
Sua missão:
1) Parafrasear a dor dele em UMA frase curta (máx. 18 palavras), empática, começando por verbo ou "Você" — sem repetir palavra por palavra.
2) Inferir qual departamento resolve entre estes 4:
   - "comercial"    → vender mais, prospectar, fechar, gerar leads, funil de vendas
   - "atendimento"  → SAC, WhatsApp, tempo de resposta, dúvidas repetidas, suporte
   - "marketing"    → conteúdo, redes sociais, posts, campanhas, tráfego, presença digital
   - "financeiro"   → contas, fluxo de caixa, cobrança, DRE, organização financeira
3) Sua confiança de 0 a 100 (seja honesto — se a dor for genérica, use ≤ 50).

Responda APENAS um JSON válido no formato:
{"paraphrase":"...","focus":"comercial","confidence":85}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const pain = typeof body?.pain === "string" ? body.pain.trim() : "";
    if (pain.length < 3) {
      return new Response(JSON.stringify({ error: "invalid_pain" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: pain.slice(0, 800) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const details = await res.text().catch(() => "");
      console.error(`[pain-analyzer] gateway ${res.status}: ${details}`);
      // Fallback silencioso — deixa o front cair pra QuickPicks manual.
      return new Response(
        JSON.stringify({
          paraphrase: "Entendi. Já sei por onde começar.",
          focus: "comercial",
          confidence: 0,
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { paraphrase?: unknown; focus?: unknown; confidence?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const focus: Focus =
      typeof parsed.focus === "string" && (ALLOWED_FOCUS as readonly string[]).includes(parsed.focus)
        ? (parsed.focus as Focus)
        : "comercial";
    const paraphrase =
      typeof parsed.paraphrase === "string" && parsed.paraphrase.trim().length > 0
        ? parsed.paraphrase.trim().slice(0, 240)
        : "Você está com uma dor real e eu já sei por onde começar.";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
        : 60;

    return new Response(
      JSON.stringify({ paraphrase, focus, confidence, fallback: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[pain-analyzer] fatal:", e);
    return new Response(
      JSON.stringify({
        paraphrase: "Entendi. Já sei por onde começar.",
        focus: "comercial",
        confidence: 0,
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
