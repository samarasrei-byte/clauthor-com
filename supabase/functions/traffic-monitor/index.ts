import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check execution logs in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentExecutions, error: countError } = await supabase
      .from("execution_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneHourAgo);

    if (countError) throw countError;

    // Check active agents
    const { count: activeAgents } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Check total users (from profiles)
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const execCount = recentExecutions || 0;
    const threshold = 100; // high traffic threshold per hour
    const isHighTraffic = execCount >= threshold;

    // If high traffic, notify all admins
    if (isHighTraffic) {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.user_id,
          type: "high_traffic",
          title: "🔥 Alto Tráfego Detectado",
          message: `${execCount} execuções na última hora. ${activeAgents || 0} agentes ativos processando. Monitore a performance.`,
          metadata: {
            executions_last_hour: execCount,
            active_agents: activeAgents || 0,
            total_users: totalUsers || 0,
            detected_at: new Date().toISOString(),
          },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        status: isHighTraffic ? "high_traffic" : "normal",
        metrics: {
          executions_last_hour: execCount,
          active_agents: activeAgents || 0,
          total_users: totalUsers || 0,
          threshold,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Traffic monitor error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
