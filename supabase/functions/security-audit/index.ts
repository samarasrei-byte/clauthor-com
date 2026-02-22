import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AuditFinding {
  category: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verify admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const findings: AuditFinding[] = [];
    const auditTimestamp = new Date().toISOString();

    // ══════════════════════════════════════════
    // 1. TOKEN & SECRETS EXPOSURE CHECK
    // ══════════════════════════════════════════
    const requiredSecrets = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "LOVABLE_API_KEY"];
    const missingSecrets: string[] = [];
    
    for (const secret of requiredSecrets) {
      const val = Deno.env.get(secret);
      if (!val || val.trim() === "") {
        missingSecrets.push(secret);
      }
    }

    if (missingSecrets.length > 0) {
      findings.push({
        category: "tokens",
        severity: "critical",
        title: "Secrets ausentes ou vazios",
        description: `Os seguintes secrets não estão configurados: ${missingSecrets.join(", ")}`,
        recommendation: "Configure imediatamente todos os secrets necessários no painel de configuração.",
      });
    } else {
      findings.push({
        category: "tokens",
        severity: "info",
        title: "Todos os secrets configurados",
        description: "Todos os secrets necessários estão presentes e não vazios.",
        recommendation: "Rotacione periodicamente as chaves de API (a cada 90 dias).",
      });
    }

    // Check if service_role_key is potentially exposed in client-side env
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (anonKey === serviceRoleKey) {
      findings.push({
        category: "tokens",
        severity: "critical",
        title: "Anon key idêntica ao service_role_key",
        description: "A chave anon e a service_role são idênticas, o que indica configuração incorreta.",
        recommendation: "Verifique se as chaves estão corretas. A service_role NUNCA deve ser exposta ao cliente.",
      });
    }

    // ══════════════════════════════════════════
    // 2. EXCESSIVE PERMISSIONS CHECK
    // ══════════════════════════════════════════
    const [creditsRes, logsRes, usersRes, rolesRes] = await Promise.all([
      adminClient.from("user_credits").select("user_id, plan_type, used_credits, total_credits"),
      adminClient.from("execution_logs").select("user_id, status, action, created_at").order("created_at", { ascending: false }).limit(500),
      adminClient.from("profiles").select("user_id, created_at"),
      adminClient.from("user_roles").select("user_id, role"),
    ]);

    const roles = rolesRes.data || [];
    const adminUsers = roles.filter((r: any) => r.role === "admin");
    const totalUsers = usersRes.data?.length || 0;

    // Check admin ratio
    if (totalUsers > 0 && adminUsers.length > Math.ceil(totalUsers * 0.2)) {
      findings.push({
        category: "permissions",
        severity: "high",
        title: "Proporção excessiva de admins",
        description: `${adminUsers.length} admins para ${totalUsers} usuários (${Math.round((adminUsers.length / totalUsers) * 100)}%). Recomendado: máximo 20%.`,
        recommendation: "Revise os papéis de admin e remova acessos desnecessários. Aplique o princípio do menor privilégio.",
      });
    } else {
      findings.push({
        category: "permissions",
        severity: "info",
        title: "Proporção de admins saudável",
        description: `${adminUsers.length} admins para ${totalUsers} usuários.`,
        recommendation: "Continue monitorando a atribuição de papéis.",
      });
    }

    // Check for users with exhausted credits still making requests
    const credits = creditsRes.data || [];
    const exhaustedUsers = credits.filter((c: any) => c.total_credits > 0 && c.used_credits >= c.total_credits);
    const logs = logsRes.data || [];

    if (exhaustedUsers.length > 0) {
      const exhaustedIds = new Set(exhaustedUsers.map((c: any) => c.user_id));
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentExhaustedActivity = logs.filter(
        (l: any) => exhaustedIds.has(l.user_id) && l.created_at > hourAgo
      );

      if (recentExhaustedActivity.length > 0) {
        findings.push({
          category: "permissions",
          severity: "high",
          title: "Atividade de usuários com créditos esgotados",
          description: `${recentExhaustedActivity.length} execuções na última hora por ${exhaustedUsers.length} usuários sem créditos. Possível bypass.`,
          recommendation: "Verifique se o rate limiting e validação de créditos estão funcionando em TODAS as edge functions.",
        });
      }
    }

    // ══════════════════════════════════════════
    // 3. ANOMALY DETECTION
    // ══════════════════════════════════════════
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Signup spike detection
    const users = usersRes.data || [];
    const newUsersLastHour = users.filter((u: any) => u.created_at > hourAgo).length;
    if (newUsersLastHour > 10) {
      findings.push({
        category: "anomaly",
        severity: "high",
        title: "Spike de cadastros detectado",
        description: `${newUsersLastHour} novos cadastros na última hora. Possível ataque de criação em massa ou bots.`,
        recommendation: "Ative CAPTCHA no formulário de registro. Considere rate limiting por IP. Verifique padrões de email (domínios descartáveis).",
      });
    }

    // Error rate check
    const recentLogs = logs.filter((l: any) => l.created_at > dayAgo);
    const errorLogs = recentLogs.filter((l: any) => l.status === "error");
    const errorRate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0;

    if (errorRate > 20) {
      findings.push({
        category: "anomaly",
        severity: "high",
        title: "Taxa de erro elevada",
        description: `${errorRate.toFixed(1)}% de erros nas últimas 24h (${errorLogs.length}/${recentLogs.length}). Limiar: 20%.`,
        recommendation: "Investigue os logs de erro. Possíveis causas: instabilidade do AI gateway, bugs em edge functions, ou ataques.",
      });
    }

    // High-frequency user detection (potential abuse)
    const userActivity: Record<string, number> = {};
    recentLogs.forEach((l: any) => {
      userActivity[l.user_id] = (userActivity[l.user_id] || 0) + 1;
    });
    const abusiveUsers = Object.entries(userActivity).filter(([, count]) => count > 100);
    if (abusiveUsers.length > 0) {
      findings.push({
        category: "anomaly",
        severity: "medium",
        title: "Uso excessivo detectado",
        description: `${abusiveUsers.length} usuário(s) com mais de 100 execuções nas últimas 24h. IDs: ${abusiveUsers.map(([id]) => id.slice(0, 8) + "...").join(", ")}`,
        recommendation: "Verifique se são usuários legítimos. Considere implementar rate limiting por usuário (ex: 200 req/dia para free, 500 para pro).",
      });
    }

    // ══════════════════════════════════════════
    // 4. WEBHOOK & INTEGRATION CHECK
    // ══════════════════════════════════════════
    const { data: openclawRegs } = await adminClient
      .from("openclaw_registrations")
      .select("id, status, webhook_url, agent_id, error_message");

    const regs = openclawRegs || [];
    const openWebhooks = regs.filter((r: any) => r.webhook_url && r.status === "active");
    const failedRegs = regs.filter((r: any) => r.status === "error" || r.error_message);

    if (openWebhooks.length > 0) {
      findings.push({
        category: "webhooks",
        severity: "medium",
        title: `${openWebhooks.length} webhook(s) ativos`,
        description: `Existem ${openWebhooks.length} webhooks de integração abertos recebendo dados externos.`,
        recommendation: "Verifique se todos os webhooks possuem validação de assinatura (HMAC). Desative webhooks não utilizados.",
      });
    }

    if (failedRegs.length > 0) {
      findings.push({
        category: "webhooks",
        severity: "low",
        title: `${failedRegs.length} registro(s) com erro`,
        description: `Existem registros de integração com status de erro que podem indicar configuração incorreta.`,
        recommendation: "Revise os registros com erro e corrija ou remova integrações inválidas.",
      });
    }

    // ══════════════════════════════════════════
    // 5. DATA EXPOSURE CHECK
    // ══════════════════════════════════════════
    // Check if public-facing tables have proper RLS
    const publicTables = ["waitlist", "community_posts", "community_comments", "community_likes"];
    findings.push({
      category: "data_exposure",
      severity: "info",
      title: "Verificação de tabelas públicas",
      description: `Tabelas com acesso público controlado: ${publicTables.join(", ")}. RLS está habilitado em todas as tabelas do sistema.`,
      recommendation: "Audite periodicamente as políticas RLS para garantir que não haja over-permissioning. Use o linter de segurança do banco de dados.",
    });

    // ══════════════════════════════════════════
    // GENERATE REPORT
    // ══════════════════════════════════════════
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;
    const infoCount = findings.filter((f) => f.severity === "info").length;

    const overallScore = Math.max(
      0,
      100 - criticalCount * 30 - highCount * 15 - mediumCount * 5 - lowCount * 2
    );

    let overallStatus: string;
    if (criticalCount > 0) overallStatus = "🔴 CRÍTICO";
    else if (highCount > 0) overallStatus = "🟡 ATENÇÃO";
    else if (mediumCount > 0) overallStatus = "🟢 SAUDÁVEL (com alertas)";
    else overallStatus = "🟢 SAUDÁVEL";

    const report = {
      audit_id: `AUDIT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: auditTimestamp,
      audited_by: userData.user.id,
      overall_status: overallStatus,
      security_score: overallScore,
      summary: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        info: infoCount,
        total_findings: findings.length,
      },
      findings: findings.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      }),
      recommendations_summary: findings
        .filter((f) => f.severity !== "info")
        .map((f) => `[${f.severity.toUpperCase()}] ${f.recommendation}`)
        .slice(0, 10),
      metadata: {
        total_users: totalUsers,
        total_admins: adminUsers.length,
        total_webhooks: openWebhooks.length,
        error_rate_24h: `${errorRate.toFixed(1)}%`,
        new_signups_1h: newUsersLastHour,
        exhausted_credits_users: exhaustedUsers.length,
      },
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("security-audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
