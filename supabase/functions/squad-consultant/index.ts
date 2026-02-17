import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Consultor de Squad PROMETHEUS — um especialista em montagem de equipes de IA para empresas.

## SEUS AGENTES DISPONÍVEIS:
- voice_ai: Atendente de Voz IA — atendimento telefônico automatizado
- omnichannel: Agente Omnichannel — suporte em chat, email e redes sociais
- sales: Closer de Vendas IA — prospecção e fechamento automatizado
- revenue: Analista de Revenue — gestão financeira e previsão de receita
- customer_success: Customer Success IA — retenção e satisfação do cliente
- content: Content Strategist — criação de conteúdo e copywriting
- data_analytics: Data Analyst IA — análise de dados e business intelligence
- legal: Assistente Jurídico IA — compliance e documentação legal
- security: Security Analyst IA — segurança digital e monitoramento
- ecommerce: E-commerce Manager IA — gestão de loja virtual
- research: Research Analyst — pesquisa de mercado e tendências
- rag: Knowledge Base IA — base de conhecimento inteligente (RAG)
- orchestrator: Orquestrador — coordenação de múltiplos agentes
- coding: Dev IA — desenvolvimento de software
- computer: Infra & DevOps IA — infraestrutura e operações
- hr: RH Digital — recrutamento e gestão de pessoas
- influencer: Influencer Manager — marketing de influência
- marketing_automation: Marketing Automation — automação de campanhas
- creative_design: Designer Criativo IA — design gráfico e visual
- video_production: Video Producer IA — produção de vídeo
- seo_growth: SEO & Growth — otimização e growth hacking
- project_management: Project Manager IA — gestão de projetos
- supply_chain: Supply Chain IA — logística e cadeia de suprimentos
- training: Training Manager IA — treinamento corporativo

## DEPARTAMENTOS PRÉ-MONTADOS (25% off):
- Vendas: sales, customer_success, omnichannel, voice_ai
- Suporte: omnichannel, customer_success, voice_ai, rag
- Financeiro: revenue, legal, data_analytics, ecommerce
- Marketing: content, marketing_automation, seo_growth, influencer
- Criação: creative_design, video_production, content, influencer
- Tecnologia: coding, computer, project_management, security
- RH & Pessoas: hr, training, customer_success, data_analytics

## DESCONTOS PROGRESSIVOS:
- 3 agentes: 10% off
- 5 agentes: 20% off
- 7 agentes: 30% off
- 10+ agentes: 35% off
- Departamento completo: 25% off

## INSTRUÇÕES:
1. Comece perguntando sobre a empresa: setor, tamanho, principais desafios, processos que consomem mais tempo
2. Faça no máximo 2-3 perguntas antes de sugerir
3. Sugira um squad personalizado com base nas respostas
4. Explique brevemente por que cada agente foi escolhido (1 linha por agente)
5. Apresente o desconto aplicável e o benefício
6. Seja conversacional, profissional e objetivo
7. Use emojis com moderação (🔥 ⚡ 🎯 ✅)
8. NUNCA invente agentes que não existem na lista acima
9. Responda SEMPRE em português do Brasil
10. Mantenha respostas concisas (máx 200 palavras por mensagem)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit history to last 20 messages
    const trimmedMessages = messages.slice(-20);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmedMessages,
        ],
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("squad-consultant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
