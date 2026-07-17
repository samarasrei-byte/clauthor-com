// video-copilot — Thor conversacional que ajuda o usuário a montar o prompt
// perfeito para geração de vídeo (Veo 3 / Replicate). Streaming SSE.

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { streamAIChat, validateMessages } from "../_shared/streamChat.ts";
import { startRun, logSpan, finishRun } from "../_shared/agent-traces.ts";

interface CopilotBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  step: "intent" | "reference" | "scene" | "mood" | "prompt_review";
  hasImage?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CopilotBody;
    const invalid = validateMessages(body.messages, { maxLength: 4000 });
    if (invalid) return invalid;

    // Fetch DNA da empresa para contextualizar o Thor
    let dnaBlock = "";
    let currentUserId: string | null = null;
    try {
      const supaUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await supaUser.auth.getUser();
      if (userData?.user) {
        currentUserId = userData.user.id;
        const supa = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: dna } = await supa
          .from("company_dna")
          .select("scope, client_label, industry, core_business, brand_colors, pain_points")
          .eq("user_id", userData.user.id)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (dna) {
          const colors = (dna.brand_colors ?? {}) as Record<string, string | null>;
          dnaBlock = [
            "## DNA DA MARCA (respeite essa identidade nas cenas propostas)",
            dna.industry && `- Setor: ${dna.industry}`,
            dna.core_business && `- Core business: ${dna.core_business}`,
            (colors.primary || colors.secondary) &&
              `- Cores da marca: primária=${colors.primary ?? "-"} · secundária=${colors.secondary ?? "-"}`,
            dna.pain_points?.length && `- Dores: ${(dna.pain_points as string[]).join("; ")}`,
          ]
            .filter(Boolean)
            .join("\n");
        }
      }
    } catch (err) {
      console.warn("[video-copilot] DNA fetch skipped:", err);
    }

    const stepPrompt = buildStepPrompt(body.step, body.hasImage ?? false);

    const system = [
      "Você é o **Thor**, diretor de arte cinematográfico e copiloto do Video Studio.",
      "Sua missão: conduzir o usuário em uma conversa curta (máx 6 turnos) para produzir o prompt IDEAL de geração de vídeo com IA (Veo 3 / Replicate).",
      "",
      "REGRAS:",
      "- Responda SEMPRE em português brasileiro, tom próximo e criativo.",
      "- Uma pergunta por vez. Direto ao ponto. Máx 2 frases por resposta.",
      "- Ao final (quando etapa = prompt_review), retorne APENAS o prompt final entre marcadores: <<<PROMPT>>>...<<<END>>>",
      "- O prompt final deve ter 40-120 palavras, em inglês (modelos performam melhor), cinematográfico, com detalhes de câmera, luz, movimento e mood.",
      "- Nunca invente que o usuário disse coisas que não disse.",
      dnaBlock,
      "",
      "ETAPA ATUAL: " + body.step.toUpperCase(),
      stepPrompt,
    ]
      .filter(Boolean)
      .join("\n");

    const modelMessages = [
      { role: "system", content: system },
      ...body.messages,
    ];

    const result = await streamAIChat({
      model: "openai/gpt-5.5",
      messages: modelMessages,
      temperature: 0.8,
      max_tokens: 600,
    });

    return result.response;
  } catch (e) {
    console.error("[video-copilot] fatal:", e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function buildStepPrompt(step: CopilotBody["step"], hasImage: boolean): string {
  switch (step) {
    case "intent":
      return "Pergunte o OBJETIVO do vídeo (ex: anúncio, orgânico, institucional, demo de produto). Ofereça 3 opções curtas.";
    case "reference":
      return hasImage
        ? "O usuário JÁ enviou uma imagem de referência. Agradeça e pergunte que papel ela cumpre (produto? cenário? pessoa? logo?)."
        : "Pergunte se o usuário tem imagem de referência para basear o vídeo. Ofereça 'Sim, vou subir' ou 'Não, gerar do zero'.";
    case "scene":
      return "Pergunte para descrever a CENA em uma frase — o que acontece, onde, com quem.";
    case "mood":
      return "Pergunte pelo MOOD/estilo (ex: cinematográfico, minimalista, energético, aconchegante, corporativo). Ofereça 3 opções.";
    case "prompt_review":
      return [
        "Agora GERE o prompt final. Use o histórico da conversa para montar.",
        "Retorne EXCLUSIVAMENTE no formato:",
        "<<<PROMPT>>>",
        "[prompt em inglês, cinematográfico, 40-120 palavras]",
        "<<<END>>>",
        "Depois do <<<END>>> escreva uma linha curta em português confirmando o prompt e sugerindo clicar Gerar.",
      ].join("\n");
  }
}
