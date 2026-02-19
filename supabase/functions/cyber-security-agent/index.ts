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

    // Gather security-relevant data
    const [usersRes, creditsRes, tenantsRes, logsRes] = await Promise.all([
      adminClient.from("profiles").select("id, user_id, created_at"),
      adminClient.from("user_credits").select("user_id, plan_type, used_credits, total_credits"),
      adminClient.from("tenants").select("id, created_at, plan_type"),
      adminClient.from("execution_logs").select("id, status, action, created_at, user_id").order("created_at", { ascending: false }).limit(500),
    ]);

    const users = usersRes.data || [];
    const credits = creditsRes.data || [];
    const tenants = tenantsRes.data || [];
    const logs = logsRes.data || [];

    // Compute security metrics
    const errorLogs = logs.filter((l: any) => l.status === "error");
    const errorRate = logs.length > 0 ? Math.round((errorLogs.length / logs.length) * 100) : 0;

    // Detect suspicious patterns
    const userLogCounts: Record<string, number> = {};
    logs.forEach((l: any) => { userLogCounts[l.user_id] = (userLogCounts[l.user_id] || 0) + 1; });
    const highActivityUsers = Object.entries(userLogCounts).filter(([, count]) => count > 50).map(([uid, count]) => ({ user_id: uid, executions: count }));

    // Users with exhausted credits (potential abuse)
    const exhaustedCredits = credits.filter((c: any) => c.total_credits > 0 && c.used_credits >= c.total_credits);

    // Recent signups spike detection
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const newUsersLastHour = users.filter((u: any) => u.created_at > hourAgo).length;
    const newUsersLastDay = users.filter((u: any) => u.created_at > dayAgo).length;

    const securityContext = `
## DADOS DE SEGURANÇA DA PLATAFORMA (TEMPO REAL):

### Métricas de Segurança:
- Total de usuários: ${users.length}
- Total de workspaces: ${tenants.length}
- Novos cadastros última hora: ${newUsersLastHour}
- Novos cadastros últimas 24h: ${newUsersLastDay}

### Logs de Execução:
- Total de execuções recentes: ${logs.length}
- Execuções com erro: ${errorLogs.length} (${errorRate}%)
- Erros recentes: ${errorLogs.slice(0, 5).map((l: any) => `${l.action} (${new Date(l.created_at).toLocaleString("pt-BR")})`).join(", ") || "Nenhum"}

### Atividade Suspeita:
- Usuários com alta atividade (>50 execuções): ${highActivityUsers.length}
${highActivityUsers.slice(0, 5).map((u) => `  - User ${u.user_id.slice(0, 8)}...: ${u.executions} execuções`).join("\n")}

### Créditos Esgotados:
- Usuários com créditos esgotados: ${exhaustedCredits.length}

### Distribuição de Planos:
${(() => { const d: Record<string, number> = {}; credits.forEach((c: any) => { d[c.plan_type] = (d[c.plan_type] || 0) + 1; }); return Object.entries(d).map(([k, v]) => `- ${k}: ${v}`).join("\n"); })()}
`;

    const systemPrompt = `Você é o **Agente de Cyber Security** da plataforma PROMETHEUS — o CISO (Chief Information Security Officer) digital.

Seu papel é:
1. Monitorar atividades suspeitas e padrões anômalos
2. Identificar potenciais ataques (brute force, DDoS, scraping, abuse)
3. Analisar picos de cadastro (possíveis bots)
4. Detectar uso abusivo de créditos/tokens
5. Recomendar ações de segurança preventivas
6. Auditar a saúde geral da segurança da plataforma

REGRAS:
- Responda SEMPRE em português do Brasil
- Use dados reais — NUNCA invente
- Classifique ameaças como: 🟢 BAIXO | 🟡 MÉDIO | 🔴 ALTO | 🔥 CRÍTICO
- Seja proativo com alertas e recomendações
- Formate com markdown

${securityContext}`;

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
    console.error("cyber-security-agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
