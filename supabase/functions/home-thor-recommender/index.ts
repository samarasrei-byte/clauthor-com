/**
 * home-thor-recommender — endpoint público de streaming para o hero conversacional.
 *
 * Recebe uma dor em pt-BR e devolve, via SSE, uma recomendação curta (3-4 linhas)
 * terminada com `DEPT:<id>` para o client destacar o departamento sugerido.
 * Sem auth; rate-limit best-effort por IP.
 */
import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";

const DEPARTMENTS = [
  { id: "comercial",   name: "Departamento Comercial",     when: "quer mais leads, pipeline, vendas, prospecção, SDR, closer, LinkedIn outbound." },
  { id: "atendimento", name: "Departamento de Atendimento", when: "quer reduzir tempo de resposta, suporte 24/7, chat, WhatsApp, NPS, retenção." },
  { id: "marketing",   name: "Departamento de Marketing",   when: "quer ROAS, mídia paga, conteúdo, SEO, social, tráfego, branding." },
  { id: "juridico",    name: "Departamento Jurídico",       when: "quer contratos, LGPD, compliance, regulatório, trabalhista, tributário." },
  { id: "financeiro",  name: "Departamento Financeiro",     when: "quer DRE, fluxo de caixa, contas a pagar/receber, precificação, CFO." },
  { id: "rh",          name: "Departamento de Pessoas",     when: "quer contratar, reduzir turnover, employer branding, onboarding, engajamento." },
];

const SYSTEM_PROMPT = `Você é o Thor, orquestrador da Clauthor. O usuário descreveu uma dor de negócio em pt-BR.
Recomende UM único departamento da lista abaixo com base na dor.

Departamentos disponíveis:
${DEPARTMENTS.map((d) => `- ${d.id} · ${d.name} — quando o usuário ${d.when}`).join("\n")}

Regras de resposta (obrigatórias):
- Escreva em pt-BR, tom direto, humano, sem jargão corporativo.
- 3 a 4 linhas curtas. Sem markdown, sem bullets, sem emojis.
- Estrutura: (1) valide a dor em 1 linha; (2) diga qual departamento resolve e por quê em 1-2 linhas; (3) diga o outcome esperado em 1 linha.
- Termine SEMPRE com uma última linha isolada exatamente no formato: DEPT:<id>
  onde <id> é um dos: comercial, atendimento, marketing, juridico, financeiro, rh.
- Nunca invente outro id. Se a dor for ambígua, escolha o mais próximo.`;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;
const ipHits = new Map<string, number[]>();

function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    return { ok: false, retryAfter: Math.ceil((RATE_WINDOW_MS - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  ipHits.set(ip, arr);
  return { ok: true, retryAfter: 0 };
}

Deno.serve(async (req) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "rate_limited", retry_after: rl.retryAfter }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter) },
      },
    );
  }

  let prompt = "";
  try {
    const body = await req.json();
    prompt = String(body?.prompt ?? "").trim().slice(0, 500);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }
  if (!prompt) return errorResponse("Missing 'prompt'", 400);

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return errorResponse("LOVABLE_API_KEY not configured", 500);

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return errorResponse(`gateway ${upstream.status}: ${t.slice(0, 200)}`, 502);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              send({ type: "done" });
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json?.choices?.[0]?.delta?.content;
              if (delta) send({ type: "delta", text: delta });
            } catch {
              /* ignore */
            }
          }
        }
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
});
