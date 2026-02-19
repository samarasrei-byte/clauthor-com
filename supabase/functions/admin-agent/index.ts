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
    const { messages } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather platform metrics in parallel
    const [
      usersRes, agentsRes, subsRes, waitlistRes, creditsRes, logsRes, tokenRes, tenantsRes
    ] = await Promise.all([
      adminClient.from("profiles").select("*", { count: "exact", head: false }),
      adminClient.from("agents").select("id, name, status, tier, monthly_price, total_executions, created_at"),
      adminClient.from("subscriptions").select("*").eq("status", "active"),
      adminClient.from("waitlist").select("*"),
      adminClient.from("user_credits").select("*"),
      adminClient.from("execution_logs").select("id, status, created_at").order("created_at", { ascending: false }).limit(500),
      adminClient.from("token_usage").select("tokens_used, created_at, action_type").order("created_at", { ascending: false }).limit(500),
      adminClient.from("tenants").select("id, plan_type, created_at"),
    ]);

    const users = usersRes.data || [];
    const agents = agentsRes.data || [];
    const subs = subsRes.data || [];
    const waitlist = waitlistRes.data || [];
    const credits = creditsRes.data || [];
    const logs = logsRes.data || [];
    const tokenUsage = tokenRes.data || [];
    const tenants = tenantsRes.data || [];

    // Compute metrics
    const totalRevenue = subs.reduce((a: number, s: any) => a + (s.monthly_price || 0), 0);
    const activeAgents = agents.filter((a: any) => a.status === "active").length;
    const totalTokens = tokenUsage.reduce((a: number, t: any) => a + (t.tokens_used || 0), 0);
    const successLogs = logs.filter((l: any) => l.status === "success").length;
    const successRate = logs.length > 0 ? Math.round((successLogs / logs.length) * 100) : 0;
    const waitingCount = waitlist.filter((w: any) => w.status === "waiting").length;

    // Plan distribution
    const planDist: Record<string, number> = {};
    credits.forEach((c: any) => { planDist[c.plan_type] = (planDist[c.plan_type] || 0) + 1; });

    // Churn signals: users with >80% credit usage
    const highUsage = credits.filter((c: any) => c.total_credits > 0 && (c.used_credits / c.total_credits) > 0.8);

    // Recent growth (users created in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newUsersWeek = users.filter((u: any) => u.created_at > weekAgo).length;

    const platformContext = `
## DADOS DA PLATAFORMA PROMETHEUS (TEMPO REAL):

### Métricas Gerais:
- Total de usuários: ${users.length}
- Novos usuários últimos 7 dias: ${newUsersWeek}
- Agentes cadastrados: ${agents.length} (${activeAgents} ativos)
- MRR (receita mensal recorrente): R$ ${(totalRevenue / 100).toFixed(2)}
- ARR (receita anual): R$ ${((totalRevenue * 12) / 100).toFixed(2)}
- Assinaturas ativas: ${subs.length}
- Ticket médio: R$ ${subs.length > 0 ? ((totalRevenue / subs.length) / 100).toFixed(2) : "0"}

### Tokens e Execuções:
- Total tokens consumidos: ${totalTokens.toLocaleString()}
- Execuções recentes: ${logs.length}
- Taxa de sucesso: ${successRate}%

### Waitlist:
- Total na waitlist: ${waitlist.length}
- Aguardando: ${waitingCount}

### Distribuição de Planos:
${Object.entries(planDist).map(([k, v]) => `- ${k}: ${v} usuários`).join("\n")}

### Sinais de Churn:
- Usuários com >80% créditos usados: ${highUsage.length}

### Tenants:
- Total de workspaces: ${tenants.length}

### Top 5 Agentes por execuções:
${agents.sort((a: any, b: any) => b.total_executions - a.total_executions).slice(0, 5).map((a: any) => `- ${a.name}: ${a.total_executions} execuções (${a.status})`).join("\n")}
`;

    const systemPrompt = `Você é o **Agente Operador Master** da plataforma PROMETHEUS — o assistente de IA exclusivo do administrador/CEO.

Seu papel é ser um COO (Chief Operating Officer) digital que:
1. Analisa dados da plataforma em tempo real e fornece insights acionáveis
2. Identifica padrões de churn, crescimento e oportunidades de revenue
3. Sugere ações estratégicas baseadas em dados concretos
4. Monitora saúde operacional (taxa de sucesso, consumo de tokens, performance)
5. Alerta sobre riscos e anomalias
6. Recomenda quando escalar infraestrutura ou fazer upgrades

REGRAS:
- Responda SEMPRE em português do Brasil, de forma executiva e concisa
- Use dados reais da plataforma (fornecidos abaixo) — NUNCA invente números
- Formate com markdown: use **negrito** para KPIs, tabelas quando apropriado
- Seja proativo: sugira ações mesmo que não perguntado
- Priorize insights de revenue, churn e crescimento
- Quando não souber algo, diga claramente

${platformContext}`;

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
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("admin-agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
