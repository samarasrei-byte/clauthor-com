import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * document-parser
 * Recebe um documento (PDF, TXT, DOC) em base64 e retorna informações
 * estruturadas da empresa (mesmo schema do company-scanner).
 *
 * Body: { filename: string, mime: string, data_base64: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filename, mime, data_base64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!data_base64 || !mime) {
      return new Response(
        JSON.stringify({ error: "filename, mime e data_base64 são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Limite: 10MB base64 (~7.5MB binário)
    if (data_base64.length > 14_000_000) {
      return new Response(
        JSON.stringify({ error: "Arquivo maior que 10MB. Envie um arquivo menor." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isText = mime.startsWith("text/") || /\.(txt|md|csv)$/i.test(filename || "");
    const isPdf = mime === "application/pdf" || /\.pdf$/i.test(filename || "");
    const isDoc = /officedocument|msword/.test(mime) || /\.(docx?|rtf)$/i.test(filename || "");

    // Prompt de extração (idêntico ao company-scanner)
    const systemPrompt = `Você é um extrator de informações empresariais. Analise o documento fornecido e extraia informações estruturadas da empresa.

Retorne SOMENTE um JSON válido (sem markdown, sem \`\`\`) com esta estrutura exata:
{
  "companyName": "nome da empresa",
  "industry": "segmento (Saúde/Clínica, Tecnologia/SaaS, E-commerce, Educação, Imobiliário, Jurídico, Financeiro, Alimentação, Beleza/Estética, Varejo, Indústria, Outro)",
  "description": "descrição curta em 2-3 frases",
  "products": "lista dos principais produtos/serviços com preços se disponíveis",
  "targetAudience": "público-alvo identificado",
  "toneOfVoice": "tom detectado (profissional, amigavel, tecnico ou vendedor)",
  "commonQuestions": "perguntas frequentes no formato P: / R:",
  "contactInfo": "informações de contato encontradas (endereço, telefone, email, horário)"
}

Se algum campo não puder ser identificado, deixe como string vazia "".`;

    let userContent: any;

    if (isText) {
      // Decodifica base64 → string
      const bytes = Uint8Array.from(atob(data_base64), (c) => c.charCodeAt(0));
      const text = new TextDecoder("utf-8").decode(bytes).slice(0, 8000);
      userContent = `Analise este documento e extraia as informações da empresa:\n\n${text}`;
    } else if (isPdf || isDoc) {
      // Envia PDF/DOC como file part (Gemini processa PDFs nativos)
      userContent = [
        { type: "text", text: "Analise este documento e extraia as informações da empresa em JSON." },
        {
          type: "file",
          file: {
            filename: filename || "document",
            file_data: `data:${mime};base64,${data_base64}`,
          },
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: `Formato não suportado: ${mime}. Use PDF, TXT ou DOC.` }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
          { role: "user", content: userContent },
        ],
        stream: false,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      console.error("[document-parser] AI error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let extracted: Record<string, string> = {};
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      extracted = {};
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[document-parser] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
