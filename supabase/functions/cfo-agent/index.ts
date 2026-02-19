import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather financial data
    const [subsRes, creditsRes, tokenRes, usersRes, waitlistRes] = await Promise.all([
      adminClient.from("subscriptions").select("*").eq("status", "active"),
      adminClient.from("user_credits").select("*"),
      adminClient.from("token_usage").select("tokens_used, action_type, created_at").order("created_at", { ascending: false }).limit(1000),
      adminClient.from("profiles").select("id, created_at"),
      adminClient.from("waitlist").select("id, status"),
    ]);

    const subs = subsRes.data || [];
    const credits = creditsRes.data || [];
    const tokenUsage = tokenRes.data || [];
    const users = usersRes.data || [];
    const waitlist = waitlistRes.data || [];

    const totalRevenue = subs.reduce((a: number, s: any) => a + (s.monthly_price || 0), 0);
    const totalTokens = tokenUsage.reduce((a: number, t: any) => a + (t.tokens_used || 0), 0);
    const avgTicket = subs.length > 0 ? totalRevenue / subs.length : 0;

    // Token cost estimation (approximate)
    const estimatedTokenCostBRL = (totalTokens / 1000) * 0.002; // rough estimate

    // Plan distribution
    const planDist: Record<string, { count: number; revenue: number }> = {};
    credits.forEach((c: any) => {
      if (!planDist[c.plan_type]) planDist[c.plan_type] = { count: 0, revenue: 0 };
      planDist[c.plan_type].count++;
    });

    // Churn risk
    const highUsage = credits.filter((c: any) => c.total_credits > 0 && (c.used_credits / c.total_credits) > 0.8);
    const exhausted = credits.filter((c: any) => c.total_credits > 0 && c.used_credits >= c.total_credits);

    // Growth metrics
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newUsersWeek = users.filter((u: any) => u.created_at > weekAgo).length;
    const newUsersMonth = users.filter((u: any) => u.created_at > monthAgo).length;

    // Token usage by day (last 7 days)
    const dailyTokens: Record<string, number> = {};
    tokenUsage.forEach((t: any) => {
      const day = t.created_at.slice(0, 10);
      dailyTokens[day] = (dailyTokens[day] || 0) + t.tokens_used;
    });

    const financialContext = `
## DADOS FINANCEIROS DA PLATAFORMA (TEMPO REAL):

### Receita:
- MRR (receita mensal recorrente): R$ ${(totalRevenue / 100).toFixed(2)}
- ARR (receita anual projetada): R$ ${((totalRevenue * 12) / 100).toFixed(2)}
- Assinaturas ativas: ${subs.length}
- Ticket médio: R$ ${(avgTicket / 100).toFixed(2)}

### Custos Estimados de IA:
- Total tokens consumidos: ${totalTokens.toLocaleString()}
- Custo estimado de tokens: R$ ${estimatedTokenCostBRL.toFixed(2)}
- Margem bruta estimada: R$ ${((totalRevenue / 100) - estimatedTokenCostBRL).toFixed(2)}

### Consumo de Tokens por Dia (últimos 7 dias):
${Object.entries(dailyTokens).slice(0, 7).map(([day, tokens]) => `- ${day}: ${tokens.toLocaleString()} tokens`).join("\n")}

### Distribuição de Planos:
${Object.entries(planDist).map(([k, v]) => `- ${k}: ${v.count} usuários`).join("\n")}

### Risco de Churn Financeiro:
- Usuários com >80% créditos usados: ${highUsage.length}
- Usuários com créditos esgotados: ${exhausted.length}
- Potencial perda de receita (churn): R$ ${((exhausted.length * avgTicket) / 100).toFixed(2)}

### Crescimento:
- Novos usuários última semana: ${newUsersWeek}
- Novos usuários último mês: ${newUsersMonth}
- Total na waitlist: ${waitlist.length} (${waitlist.filter((w: any) => w.status === "waiting").length} aguardando)
- Conversão potencial waitlist: R$ ${((waitlist.filter((w: any) => w.status === "waiting").length * avgTicket) / 100).toFixed(2)}
`;

    const systemPrompt = `Você é o **Agente CFO** da plataforma PROMETHEUS — o Diretor Financeiro digital.

Seu papel é:
1. Analisar receita (MRR/ARR), custos e margem operacional
2. Projetar crescimento financeiro e fazer previsões
3. Monitorar custos de infraestrutura (tokens de IA) vs receita
4. Identificar oportunidades de upsell e cross-sell
5. Calcular ROI de cada plano e sugerir otimizações de pricing
6. Alertar sobre riscos financeiros (churn, custos crescentes)
7. Gerar DRE simplificado e fluxo de caixa projetado

REGRAS:
- Responda SEMPRE em português do Brasil
- Use dados reais — NUNCA invente números
- Formate valores em R$ com 2 casas decimais
- Use tabelas markdown para comparativos financeiros
- Seja proativo com alertas e recomendações de otimização
- Classifique saúde financeira como: 🟢 SAUDÁVEL | 🟡 ATENÇÃO | 🔴 CRÍTICO

${financialContext}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente novamente." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("cfo-agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
