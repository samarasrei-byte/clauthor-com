import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/**
 * Art Director — dupla de agentes:
 *   1) "Diretor de Conteúdo" (google/gemini-3-flash-preview via chat completions)
 *      Conversa com o usuário, refina o briefing e retorna JSON estruturado
 *      { message, suggested_prompt, style, aspect_ratio, ready_to_generate }.
 *   2) "Artista" — /v1/images/generations com openai/gpt-image-2 (non-streaming)
 *      recebe o prompt final e devolve b64_json.
 *
 * Body:
 *   { action: "chat", messages: [{role, content}, ...] }
 *   { action: "generate", prompt: string, size?: "1024x1024"|"1024x1536"|"1536x1024", quality?: "low"|"medium"|"high" }
 */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

interface Msg { role: "system" | "user" | "assistant"; content: string }

const DIRECTOR_SYSTEM = `Você é o "Diretor de Conteúdo" do CLAUTHOR — um diretor de arte experiente que colabora com o usuário para criar imagens excepcionais.

Sua missão:
1. Entender a intenção do usuário (objetivo, público, sentimento, uso final).
2. Refinar o briefing fazendo perguntas curtas e objetivas SE faltarem elementos essenciais (sujeito, estilo, atmosfera, formato).
3. Quando o briefing tiver o suficiente, montar um prompt visual detalhado em INGLÊS (modelos de imagem funcionam melhor em inglês), rico em detalhes: sujeito, composição, iluminação, paleta, estilo (fotográfico/ilustrativo/3D/etc.), câmera/lente quando aplicável, mood.
4. Sugerir aspect ratio adequado ao uso (1024x1024 quadrado / 1024x1536 vertical / 1536x1024 horizontal).
5. Ser conciso, direto e proativo — não fique perguntando indefinidamente. Após 1-2 rodadas de refinamento, sinalize ready_to_generate=true.

Responda SEMPRE em JSON válido com este schema exato:
{
  "message": "sua resposta ao usuário em pt-BR, curta e prática",
  "suggested_prompt": "prompt final em inglês, detalhado — string vazia se ainda não estiver pronto",
  "style": "photorealistic | illustration | 3d_render | anime | oil_painting | watercolor | vector | cinematic | minimalist | other",
  "aspect_ratio": "1024x1024 | 1024x1536 | 1536x1024",
  "ready_to_generate": true | false,
  "reasoning": "por que este prompt (1 frase)"
}`;

async function callDirector(apiKey: string, messages: Msg[]): Promise<Record<string, unknown>> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: DIRECTOR_SYSTEM }, ...messages],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Director ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(raw); } catch { return { message: raw, ready_to_generate: false, suggested_prompt: "", style: "other", aspect_ratio: "1024x1024" }; }
}

async function callArtist(apiKey: string, prompt: string, size: string, quality: string): Promise<{ b64_json: string }> {
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt,
      size,
      quality,
      n: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Bubble up moderation / rate-limit / credit errors with context
    throw new Error(`Artist ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Artist retornou resposta sem imagem");
  return { b64_json: b64 };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return errorResponse("LOVABLE_API_KEY ausente no servidor", 500);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "chat");

    if (action === "chat") {
      const messages = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
      if (messages.length === 0) return errorResponse("messages vazio", 400);
      // Guardrails: manter só role/content e limitar tamanho
      const clean = messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }));
      const parsed = await callDirector(apiKey, clean);
      return jsonResponse({
        ok: true,
        message: String(parsed.message ?? ""),
        suggested_prompt: String(parsed.suggested_prompt ?? ""),
        style: String(parsed.style ?? "other"),
        aspect_ratio: String(parsed.aspect_ratio ?? "1024x1024"),
        ready_to_generate: Boolean(parsed.ready_to_generate),
        reasoning: String(parsed.reasoning ?? ""),
      });
    }

    if (action === "generate") {
      const prompt = String(body?.prompt || "").trim();
      if (prompt.length < 4) return errorResponse("prompt muito curto", 400);
      const size = ["1024x1024", "1024x1536", "1536x1024"].includes(body?.size) ? body.size : "1024x1024";
      const quality = ["low", "medium", "high"].includes(body?.quality) ? body.quality : "low";
      const started = Date.now();
      const { b64_json } = await callArtist(apiKey, prompt, size, quality);
      return jsonResponse({
        ok: true,
        b64_json,
        prompt,
        size,
        quality,
        latency_ms: Date.now() - started,
      });
    }

    return errorResponse("action inválida (use 'chat' ou 'generate')", 400);
  } catch (e) {
    const msg = (e as Error).message || "Erro interno";
    return jsonResponse({ ok: false, error: msg }, 200);
  }
});
