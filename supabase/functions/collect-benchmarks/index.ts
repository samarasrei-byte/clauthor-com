// Weekly benchmark collector - aggregates per-tenant metrics anonymously
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tenants, error: tErr } = await supabase
      .from("tenants")
      .select("id, industry, company_size");
    if (tErr) throw tErr;

    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const since = new Date(weekStart.getTime() - 7 * 86400_000).toISOString();

    let inserted = 0;

    for (const t of tenants ?? []) {
      const tenantId = (t as any).id as string;
      const industry = (t as any).industry ?? null;
      const companySize = (t as any).company_size ?? null;

      // Leads per week
      const { count: leadsCount } = await supabase
        .from("hunter_leads")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", since);

      // Reply rate (replied / sent)
      const { count: sentCount } = await supabase
        .from("hunter_messages")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", since);
      const { count: repliedCount } = await supabase
        .from("hunter_messages_inbox")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", since);
      const replyRate = sentCount && sentCount > 0 ? ((repliedCount ?? 0) / sentCount) * 100 : null;

      // Posts approved
      const { count: postsApproved } = await supabase
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .gte("created_at", since);

      // Tasks completed
      const { count: tasksCompleted } = await supabase
        .from("agent_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("created_at", since);

      const rows = [
        { key: "leads_per_week", value: leadsCount ?? 0 },
        { key: "posts_approved", value: postsApproved ?? 0 },
        { key: "tasks_completed", value: tasksCompleted ?? 0 },
        ...(replyRate !== null ? [{ key: "reply_rate", value: replyRate }] : []),
      ].filter((r) => r.value > 0);

      if (rows.length === 0) continue;

      const { error: insErr } = await supabase.from("benchmark_metrics").insert(
        rows.map((r) => ({
          tenant_id: tenantId,
          metric_key: r.key,
          metric_value: r.value,
          period_start: weekStart.toISOString(),
          industry,
          company_size: companySize,
        }))
      );
      if (!insErr) inserted += rows.length;
    }

    return new Response(
      JSON.stringify({ ok: true, tenants: tenants?.length ?? 0, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
