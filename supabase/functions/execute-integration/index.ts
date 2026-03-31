import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  executeIntegration,
  getDecryptedCredentials,
  getAvailableIntegrations,
} from "../_shared/integration-router.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { integration_key, action, params, agent_id } = body;

    // List available integrations
    if (action === "list-integrations") {
      return new Response(JSON.stringify({ integrations: getAvailableIntegrations() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration_key || !action || !agent_id) {
      return new Response(JSON.stringify({ error: "integration_key, action, and agent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch credentials from DB
    const credentials = await getDecryptedCredentials(supabaseAdmin, user.id, agent_id, integration_key);
    if (!credentials) {
      return new Response(JSON.stringify({
        error: `No credentials found for integration "${integration_key}". Please configure credentials first.`,
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute the integration
    const result = await executeIntegration({
      integration_key,
      action,
      params: params || {},
      credentials,
    });

    // Log execution
    await supabaseAdmin.from("execution_logs").insert({
      agent_id,
      user_id: user.id,
      action: `${integration_key}/${action}`,
      status: result.success ? "success" : "error",
      details: {
        integration_key,
        action,
        success: result.success,
        error: result.error || null,
      },
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[execute-integration] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
