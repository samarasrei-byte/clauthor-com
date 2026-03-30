import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { agent_id, tenant_id, action_type, action_description, model_used } = body;

    // Validate required fields
    if (!agent_id || typeof agent_id !== "string" || agent_id.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid agent_id" }), { status: 400, headers: corsHeaders });
    }
    if (!tenant_id || typeof tenant_id !== "string" || tenant_id.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid tenant_id" }), { status: 400, headers: corsHeaders });
    }
    if (action_description && typeof action_description === "string" && action_description.length > 500) {
      return new Response(JSON.stringify({ error: "action_description too long (max 500)" }), { status: 400, headers: corsHeaders });
    }

    const { data, error } = await supabase.from("agent_activity_log").insert({
      agent_id,
      user_id: userId,
      tenant_id,
      action_type: (action_type || "task").slice(0, 50),
      action_description: (action_description || "").slice(0, 500),
      model_used: (model_used || "unknown").slice(0, 100),
    }).select("id").single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
