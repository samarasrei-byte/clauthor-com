import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Fetch user's agents
    const { data: agents } = await adminClient
      .from("agents")
      .select("id, name, description, tier, status, instructions, objective")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const activeAgents = (agents || []).filter((a: any) => a.status === "active");

    // Build agent context for the concierge
    const agentsList = activeAgents.map((a: any, i: number) => {
      const examples: Record<string, string[]> = {
        sales: ["'Encontre 10 leads de SaaS em São Paulo'", "'Mande email de prospecção para o lead X'", "'Crie um pipeline de vendas para este mês'"],
        omnichannel: ["'Responda os tickets pendentes'", "'Crie um template de resposta para dúvidas de preço'", "'Analise o sentimento dos últimos 50 atendimentos'"],
        content: ["'Crie 5 posts para Instagram sobre nosso produto'", "'Escreva um blog post sobre tendências do setor'", "'Gere um calendário editorial para o mês'"],
        revenue: ["'Gere o DRE deste mês'", "'Quais clientes estão com pagamento atrasado?'", "'Projete o faturamento para o próximo trimestre'"],
        coding: ["'Revise este código e sugira melhorias'", "'Crie uma API REST para gerenciar usuários'", "'Automatize o deploy com CI/CD'"],
        hr: ["'Crie uma descrição de vaga para desenvolvedor'", "'Analise os currículos recebidos'", "'Monte um programa de onboarding'"],
        security: ["'Faça uma auditoria de segurança'", "'Verifique conformidade com LGPD'", "'Analise vulnerabilidades do sistema'"],
        marketing_automation: ["'Crie um funil de email para novos leads'", "'Automatize o nurturing dos leads frios'", "'Analise as taxas de conversão do funil'"],
        data_analytics: ["'Crie um dashboard com os KPIs do mês'", "'Analise as tendências de vendas'", "'Compare o desempenho dos últimos 3 meses'"],
        customer_success: ["'Quais clientes estão em risco de churn?'", "'Envie pesquisa NPS para os clientes ativos'", "'Crie um playbook de retenção'"],
        ai_cfo: ["'Gere o fluxo de caixa projetado'", "'Analise as despesas por categoria'", "'Qual o break-even point atual?'"],
        seo_growth: ["'Analise o SEO do nosso site'", "'Encontre palavras-chave de oportunidade'", "'Crie meta descriptions otimizadas'"],
        creative_design: ["'Crie um conceito visual para a campanha'", "'Sugira paletas de cores para o rebranding'", "'Gere ideias de banner para redes sociais'"],
        project_management: ["'Crie um sprint para as próximas 2 semanas'", "'Quais tarefas estão atrasadas?'", "'Monte um cronograma para o lançamento'"],
      };

      // Try to match agent name to examples
      const nameKey = Object.keys(examples).find(k => 
        a.name.toLowerCase().includes(k.replace("_", " ")) || 
        a.name.toLowerCase().includes(k)
      );
      const agentExamples = nameKey ? examples[nameKey] : ["'Me ajude com uma tarefa'", "'Gere um relatório'", "'Analise estes dados'"];

      return `${i + 1}. **${a.name}** (${a.tier}) — ${a.objective || a.description || "Agente especializado"}
   Exemplos de uso: ${agentExamples.join(", ")}`;
    }).join("\n");

    const systemPrompt = `Você é o **CLAUTHOR Concierge** — o guia pessoal mais simpático e eficiente do mundo para novos clientes da plataforma CLAUTHOR.

## SUA MISSÃO:
Dar as boas-vindas ao cliente, mostrar o que seus agentes contratados podem fazer e guiá-lo para a primeira interação com confiança.

## AGENTES DO CLIENTE (${activeAgents.length} ativos):
${agentsList || "Nenhum agente ativo ainda."}

## REGRAS DE COMPORTAMENTO:
1. **Seja caloroso e entusiasta** — Use emojis com moderação (2-3 por mensagem). Fale como um concierge 5 estrelas.
2. **Na primeira mensagem**, apresente-se brevemente e liste os agentes do cliente com 1-2 exemplos práticos de cada.
3. **Ofereça demos interativas** — Sugira que o cliente experimente um comando exemplo ali mesmo.
4. **Guie para o próximo passo** — Sempre termine com uma sugestão clara de ação (ex: "Quer que eu te mostre como usar o Sales Agent?").
5. **Seja ULTRA conciso** — Máximo 80 palavras por resposta. Use frases curtas e diretas.
6. **Se o cliente não tiver agentes**, oriente para a Biblioteca (/library) para contratar.
7. **Explique as seções do dashboard**: Command Center (visão geral), Meus Agentes (gerenciar), Reunião (falar com todos), Chat (falar com um agente), Analytics, Logs.
8. **Responda em português do Brasil**.

## SEÇÕES DO DASHBOARD:
- **Command Center**: Visão geral com KPIs, economia estimada, consumo de tokens
- **Meus Agentes**: Lista de agentes contratados, clique para conversar
- **Reunião**: Chat simultâneo com todos os agentes ativos (como uma reunião de diretoria)
- **Assistente IA**: Chat 1-a-1 com um agente específico
- **Analytics**: Gráficos de execuções e performance
- **Configurações**: Personalizar instruções, canais e integrações de cada agente
- **Equipe**: Gerenciar membros do workspace
- **Logs**: Histórico de todas as ações executadas pelos agentes

## TOOL USE:
Os agentes podem executar ações reais: enviar emails, criar tarefas, gerar relatórios, buscar leads, agendar reuniões e analisar dados. Mencione isso como diferencial!`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || [{ role: "user", content: "Olá! Acabei de chegar." }]),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: apiMessages,
        stream: true,
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      throw new Error("AI Gateway failed");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Concierge error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
