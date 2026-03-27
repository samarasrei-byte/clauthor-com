import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse, streamResponse } from "../_shared/cors.ts";

// All available agents with their metadata for AI matching
const AGENT_CATALOG = [
  { key: "voice_ai", name: "Voice AI Agent", category: "Atendimento", keywords: ["telefone", "ligação", "voz", "call center", "telemarketing", "whatsapp", "atendimento telefônico"] },
  { key: "orchestrator", name: "Orchestrator Agent", category: "Automação", keywords: ["automação", "workflow", "processos", "multi-agente", "orquestração"] },
  { key: "research", name: "Deep Research Agent", category: "Pesquisa", keywords: ["pesquisa", "análise", "relatório", "dados", "mercado", "estudo"] },
  { key: "coding", name: "Coding Agent", category: "Tecnologia", keywords: ["programação", "código", "software", "desenvolvimento", "devops", "github"] },
  { key: "omnichannel", name: "Omnichannel Agent", category: "Atendimento", keywords: ["atendimento", "chat", "suporte", "sac", "cliente", "instagram", "whatsapp", "email"] },
  { key: "revenue", name: "Revenue Agent", category: "Finanças", keywords: ["financeiro", "cobrança", "receita", "faturamento", "pix", "boleto"] },
  { key: "sales", name: "Sales Agent", category: "Vendas", keywords: ["vendas", "comercial", "prospecção", "crm", "pipeline", "leads", "outbound"] },
  { key: "rag", name: "RAG Knowledge Agent", category: "Conhecimento", keywords: ["documentos", "knowledge base", "wiki", "compliance", "base de conhecimento"] },
  { key: "computer", name: "Computer Use Agent", category: "Automação", keywords: ["rpa", "automação", "erp", "sistemas legados", "robô"] },
  { key: "content", name: "Content Agent", category: "Marketing", keywords: ["conteúdo", "social media", "blog", "posts", "marketing de conteúdo", "copywriting"] },
  { key: "security", name: "Security Agent", category: "Segurança", keywords: ["segurança", "lgpd", "cibersegurança", "proteção", "compliance", "auditoria"] },
  { key: "hr", name: "HR Agent", category: "RH", keywords: ["rh", "recrutamento", "seleção", "pessoas", "onboarding", "funcionários", "colaboradores"] },
  { key: "customer_success", name: "Customer Success Agent", category: "Sucesso do Cliente", keywords: ["churn", "retenção", "nps", "satisfação", "customer success", "cs"] },
  { key: "data_analytics", name: "Data Analytics Agent", category: "Dados", keywords: ["bi", "analytics", "dashboard", "indicadores", "kpi", "relatórios", "dados"] },
  { key: "legal", name: "Legal Agent", category: "Jurídico", keywords: ["jurídico", "contratos", "legal", "advocacia", "compliance", "lgpd"] },
  { key: "ecommerce", name: "E-commerce Agent", category: "E-commerce", keywords: ["loja virtual", "ecommerce", "e-commerce", "marketplace", "shopify", "mercado livre", "produtos"] },
  { key: "influencer", name: "Influencer Agent", category: "Marketing", keywords: ["influencer", "creators", "influenciador", "ugc", "parceria"] },
  { key: "marketing_automation", name: "Marketing Automation Agent", category: "Marketing", keywords: ["funil", "automação marketing", "email marketing", "lead", "nurturing", "growth"] },
  { key: "creative_design", name: "Creative Design Agent", category: "Design", keywords: ["design", "criativo", "banner", "visual", "marca", "branding", "arte"] },
  { key: "video_production", name: "Video Production Agent", category: "Conteúdo", keywords: ["vídeo", "reels", "shorts", "youtube", "edição", "thumbnail"] },
  { key: "seo_growth", name: "SEO Growth Agent", category: "Marketing", keywords: ["seo", "google", "tráfego orgânico", "palavras-chave", "link building"] },
  { key: "project_management", name: "Project Management Agent", category: "Gestão", keywords: ["projetos", "gestão", "agile", "scrum", "pmo", "sprint", "timeline"] },
  { key: "supply_chain", name: "Supply Chain Agent", category: "Logística", keywords: ["logística", "estoque", "fornecedores", "supply chain", "entregas", "cadeia"] },
  { key: "training", name: "Training Agent", category: "Educação", keywords: ["treinamento", "curso", "educação", "capacitação", "onboarding", "lms"] },
  { key: "concierge", name: "Concierge AI", category: "Produtividade", keywords: ["assistente", "produtividade", "agenda", "pessoal", "organização"] },
  { key: "ceo", name: "CEO AI", category: "Estratégia", keywords: ["ceo", "estratégia", "c-level", "diretoria", "tomada de decisão", "board"] },
  { key: "startup_creator", name: "Startup Creator", category: "Empreendedorismo", keywords: ["startup", "mvp", "empreendedorismo", "pitch", "validação", "negócio novo"] },
  { key: "paid_traffic", name: "Paid Traffic Manager", category: "Tráfego", keywords: ["tráfego pago", "meta ads", "google ads", "facebook ads", "anúncios", "roas", "mídia paga"] },
  { key: "influencer_liveshop", name: "Influencer & LiveShop", category: "Vendas", keywords: ["live", "live commerce", "shopee", "tiktok shop", "transmissão", "ao vivo"] },
  { key: "podcast_manager", name: "Podcast Manager", category: "Conteúdo", keywords: ["podcast", "áudio", "episódio", "entrevista", "spotify"] },
  { key: "affiliate_manager", name: "Affiliate Manager", category: "Vendas", keywords: ["afiliado", "hotmart", "comissão", "infoproduto", "produto digital"] },
  { key: "community_mgr", name: "Community Manager", category: "Comunidade", keywords: ["comunidade", "discord", "telegram", "grupo", "moderação", "engajamento"] },
  { key: "whatsapp_commerce", name: "WhatsApp Commerce", category: "Vendas", keywords: ["whatsapp", "vendas whatsapp", "catálogo", "carrinho", "pix", "comércio"] },
  { key: "ai_cfo", name: "AI CFO", category: "Finanças", keywords: ["cfo", "dre", "fluxo de caixa", "contabilidade", "tributário", "fiscal", "controller"] },
  { key: "scheduler", name: "Appointment Scheduler", category: "Agendamento", keywords: ["agendamento", "agenda", "consulta", "clínica", "salão", "barbearia", "marcação"] },
  { key: "reputation", name: "Reputation Manager", category: "Reputação", keywords: ["reputação", "reviews", "avaliações", "reclame aqui", "google reviews", "crise"] },
  { key: "proposal_gen", name: "Proposal Generator", category: "Vendas", keywords: ["proposta", "orçamento", "cotação", "pdf", "contrato", "precificação"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Query too short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const catalogSummary = AGENT_CATALOG.map(
      (a) => `- ${a.key}: ${a.name} (${a.category}) — ${a.keywords.join(", ")}`
    ).join("\n");

    const systemPrompt = `You are the PROMETHEUS AI Concierge — the world's most intelligent consultant for AI agent recommendations.

Given the agent catalog below, analyze the user's description and return EXACTLY a JSON array with the 3-5 most relevant agents, ordered by relevance.

CATALOG:
${catalogSummary}

RULES:
1. Return ONLY valid JSON, no markdown, no explanation
2. Format: [{"key":"agent_key","reason":"Short and impactful reason in English","match":95}]
3. "match" is the compatibility percentage (60-99)
4. "reason" should be specific to the user's context, maximum 15 words
5. Always return between 3 and 5 agents
6. If the query doesn't make sense, return the 3 most popular with low match`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", errText);
      throw new Error("AI Gateway failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle potential markdown wrapping)
    let recommendations;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback: return top popular agents
      recommendations = [
        { key: "omnichannel", reason: "Agente mais popular para atendimento", match: 70 },
        { key: "sales", reason: "Ideal para equipes comerciais", match: 65 },
        { key: "content", reason: "Perfeito para marketing digital", match: 60 },
      ];
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Concierge error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
