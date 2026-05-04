// Continuous health-check for the Advocacia squad.
// Validates: required slugs in catalog, OAB prompts integrity, recent execution success rate.
// Emits notifications (type=advocacia_health_alert) to platform admins on failures.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  REQUIRED_LEGAL_SLUGS,
  LEGAL_PROMPTS_VERSION,
  validateLegalPrompts,
} from "../_shared/legal-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  id: string;
  status: "ok" | "warn" | "fail";
  detail: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const checks: CheckResult[] = [];

  // 1. Prompt integrity (in-process, no DB)
  const promptCheck = validateLegalPrompts();
  checks.push({
    id: "prompts_oab",
    status: promptCheck.ok ? "ok" : "fail",
    detail: promptCheck.ok
      ? `Todos os ${REQUIRED_LEGAL_SLUGS.length} prompts OAB-compliant (v${promptCheck.version}).`
      : `Prompts inválidos. Missing=${promptCheck.missingSlugs.join(",")} | NonCompliant=${promptCheck.nonCompliantSlugs.map((n) => n.slug).join(",")}`,
    data: { version: promptCheck.version, ...promptCheck },
  });

  // 2. Catalog slugs present + active
  const { data: catalog, error: catErr } = await supabase
    .from("agents_catalog")
    .select("slug,is_active")
    .in("slug", REQUIRED_LEGAL_SLUGS as unknown as string[]);
  if (catErr) {
    checks.push({ id: "catalog", status: "fail", detail: `Erro consultando agents_catalog: ${catErr.message}` });
  } else {
    const present = new Set((catalog ?? []).filter((c: any) => c.is_active).map((c: any) => c.slug));
    const missing = REQUIRED_LEGAL_SLUGS.filter((s) => !present.has(s));
    checks.push({
      id: "catalog",
      status: missing.length === 0 ? "ok" : "fail",
      detail: missing.length === 0
        ? `${present.size}/${REQUIRED_LEGAL_SLUGS.length} agentes ativos no catálogo.`
        : `Slugs ausentes/inativos: ${missing.join(", ")}`,
      data: { missing },
    });
  }

  // 3. Execution success rate (last 24h on legal agents)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: logs, error: logErr } = await supabase
    .from("execution_logs")
    .select("status,action,created_at,details")
    .gte("created_at", since)
    .like("action", "%juridic%")
    .limit(500);
  if (logErr) {
    checks.push({ id: "executions", status: "warn", detail: `Erro consultando execution_logs: ${logErr.message}` });
  } else {
    const total = logs?.length ?? 0;
    const errors = (logs ?? []).filter((l: any) => l.status === "error").length;
    const rate = total > 0 ? Math.round(((total - errors) / total) * 100) : 100;
    const status: CheckResult["status"] = total === 0 ? "warn" : rate >= 90 ? "ok" : rate >= 70 ? "warn" : "fail";
    checks.push({
      id: "executions",
      status,
      detail: total === 0
        ? "Nenhuma execução jurídica nas últimas 24h."
        : `Sucesso ${rate}% (${total - errors}/${total}) nas últimas 24h.`,
      data: { total, errors, success_rate: rate },
    });
  }

  const overall: "ok" | "warn" | "fail" = checks.some((c) => c.status === "fail")
    ? "fail"
    : checks.some((c) => c.status === "warn") ? "warn" : "ok";

  // 4. Persist run
  await supabase.from("execution_logs").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    agent_id: "00000000-0000-0000-0000-000000000000",
    action: "advocacia_health_check",
    status: overall === "ok" ? "success" : overall === "warn" ? "warning" : "error",
    details: { version: LEGAL_PROMPTS_VERSION, checks },
  });

  // 5. Alert platform admins on failure
  if (overall === "fail") {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const failed = checks.filter((c) => c.status === "fail").map((c) => `${c.id}: ${c.detail}`).join("\n");
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.user_id,
          type: "advocacia_health_alert",
          title: "🚨 Health-Check Squad Jurídica falhou",
          message: failed,
          metadata: { version: LEGAL_PROMPTS_VERSION, checks },
        })),
      );
    }
  }

  return new Response(
    JSON.stringify({ overall, version: LEGAL_PROMPTS_VERSION, checks, timestamp: new Date().toISOString() }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
