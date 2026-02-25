import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TokenAlert {
  user_id: string;
  usage_pct: number;
  threshold: number;
  plan_type: string;
  used_credits: number;
  total_credits: number;
  tenant_id?: string;
}

const UPGRADE_SUGGESTIONS: Record<string, { plan: string; message: string }> = {
  free: { plan: "Starter", message: "Upgrade para Starter (5M tokens/mês) por R$ 3.997/mês e elimine interrupções." },
  starter: { plan: "Profissional", message: "Upgrade para Profissional (25M tokens/mês) por R$ 9.997/mês com agentes ilimitados." },
  pro: { plan: "Enterprise", message: "Fale com nosso time para Enterprise (100M+ tokens) com SLA dedicado." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action || "batch_check";

    if (action === "batch_check") {
      // Batch check all users' token usage
      const { data: allCredits, error } = await supabase
        .from("user_credits")
        .select("*");

      if (error) throw error;

      const alerts: TokenAlert[] = [];
      const thresholds = [80, 90, 100];

      for (const credit of allCredits || []) {
        if (credit.total_credits === 0) continue;
        const pct = Math.round((credit.used_credits / credit.total_credits) * 100);

        for (const t of thresholds) {
          if (pct >= t) {
            alerts.push({
              user_id: credit.user_id,
              usage_pct: pct,
              threshold: t,
              plan_type: credit.plan_type,
              used_credits: credit.used_credits,
              total_credits: credit.total_credits,
            });
            break; // Only highest threshold
          }
        }
      }

      // Log summary
      console.log(`Token monitor: ${alerts.length} alerts from ${allCredits?.length || 0} users`);

      return new Response(JSON.stringify({
        success: true,
        total_users: allCredits?.length || 0,
        alerts_count: alerts.length,
        alerts: alerts.map(a => ({
          user_id: a.user_id,
          usage_pct: a.usage_pct,
          threshold: a.threshold,
          plan_type: a.plan_type,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "user_status") {
      // Get detailed status for a specific user
      const userId = body.user_id;
      if (!userId) throw new Error("user_id required");

      const { data: credits } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!credits) throw new Error("No credits found");

      const pct = Math.round((credits.used_credits / credits.total_credits) * 100);
      const suggestion = UPGRADE_SUGGESTIONS[credits.plan_type] || UPGRADE_SUGGESTIONS.free;

      // Get per-agent breakdown
      const { data: agentUsage } = await supabase
        .from("token_usage")
        .select("agent_id, tokens_used")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Aggregate by agent
      const agentMap: Record<string, number> = {};
      for (const row of agentUsage || []) {
        const key = row.agent_id || "unknown";
        agentMap[key] = (agentMap[key] || 0) + row.tokens_used;
      }

      return new Response(JSON.stringify({
        success: true,
        usage: {
          used: credits.used_credits,
          total: credits.total_credits,
          remaining: credits.total_credits - credits.used_credits,
          percentage: pct,
          plan_type: credits.plan_type,
          resets_at: credits.credits_reset_at,
        },
        by_agent: agentMap,
        upgrade_suggestion: pct >= 70 ? suggestion : null,
        alert_level: pct >= 100 ? "critical" : pct >= 90 ? "warning" : pct >= 80 ? "caution" : "normal",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // org_status: aggregate by tenant
    if (action === "org_status") {
      const tenantId = body.tenant_id;
      if (!tenantId) throw new Error("tenant_id required");

      const { data: members } = await supabase
        .from("tenant_members")
        .select("user_id")
        .eq("tenant_id", tenantId);

      if (!members?.length) throw new Error("No members found");

      const userIds = members.map(m => m.user_id);
      const { data: credits } = await supabase
        .from("user_credits")
        .select("*")
        .in("user_id", userIds);

      const totalUsed = (credits || []).reduce((s, c) => s + c.used_credits, 0);
      const totalLimit = (credits || []).reduce((s, c) => s + c.total_credits, 0);
      const orgPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

      return new Response(JSON.stringify({
        success: true,
        org_usage: {
          total_used: totalUsed,
          total_limit: totalLimit,
          percentage: orgPct,
          member_count: members.length,
          alert_level: orgPct >= 100 ? "critical" : orgPct >= 90 ? "warning" : orgPct >= 80 ? "caution" : "normal",
        },
        members: (credits || []).map(c => ({
          user_id: c.user_id,
          used: c.used_credits,
          total: c.total_credits,
          pct: Math.round((c.used_credits / c.total_credits) * 100),
          plan: c.plan_type,
        })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Token monitor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
