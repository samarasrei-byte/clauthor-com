import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url, text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let contentToAnalyze = "";

    if (action === "scan_url" && url) {
      // Fetch the website content
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ClauthorBot/1.0)" },
          redirect: "follow",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        
        // Strip HTML tags, scripts, styles — keep text content
        contentToAnalyze = html
          .replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, "")
          .replace(/<style[^>]*>[\\s\\S]*?<\\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\\s+/g, " ")
          .trim()
          .slice(0, 8000); // Limit to prevent token overflow
      } catch (fetchErr) {
        return new Response(JSON.stringify({ error: "Não foi possível acessar o site. Verifique a URL." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (action === "analyze_text" && text) {
      contentToAnalyze = text.slice(0, 8000);
    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract structured company info
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um extrator de informações empresariais. Analise o conteúdo fornecido e extraia informações estruturadas da empresa.

Retorne SOMENTE um JSON válido (sem markdown, sem \`\`) com esta estrutura exata:
{
  "companyName": "nome da empresa",
  "industry": "segmento (escolha entre: Saúde / Clínica, Tecnologia / SaaS, E-commerce, Educação, Imobiliário, Jurídico, Financeiro, Alimentação, Beleza / Estética, Varejo, Indústria, Outro)",
  "description": "descrição curta da empresa em 2-3 frases",
  "products": "lista dos principais produtos/serviços com preços se disponíveis",
  "targetAudience": "público-alvo identificado",
  "toneOfVoice": "tom detectado (profissional, amigavel, tecnico ou vendedor)",
  "commonQuestions": "perguntas frequentes identificadas no formato P: / R:",
  "contactInfo": "informações de contato encontradas (endereço, telefone, email, horário)"
}

Se algum campo não puder ser identificado, deixe como string vazia "".`,
          },
          {
            role: "user",
            content: `Analise este conteúdo e extraia as informações da empresa:\\n\\n${contentToAnalyze}`,
          },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    
    // Clean potential markdown wrapping
    const cleaned = rawContent.replace(/```json\\n?/g, "").replace(/```\\n?/g, "").trim();
    
    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      extracted = {};
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[company-scanner] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
