import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-openclaw-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { event, agent_id: openclawAgentId, data, timestamp } = body;

    if (!event || !openclawAgentId) {
      return new Response(JSON.stringify({ error: "Missing event or agent_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS (webhook has no user context)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find the registration by openclaw_agent_id
    const { data: registration, error: regError } = await supabase
      .from("openclaw_registrations")
      .select("*, agents(id, user_id, name)")
      .eq("openclaw_agent_id", openclawAgentId)
      .single();

    if (regError || !registration) {
      console.error("Registration not found for openclaw_agent_id:", openclawAgentId);
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different webhook events
    switch (event) {
      case "agent.activated": {
        await supabase
          .from("openclaw_registrations")
          .update({ 
            status: "active", 
            last_webhook_at: new Date().toISOString(),
            metadata: { ...registration.metadata, activation: data },
          })
          .eq("id", registration.id);
        break;
      }

      case "agent.execution": {
        // Log the execution
        if (registration.agents?.id && registration.agents?.user_id) {
          await supabase.from("execution_logs").insert({
            agent_id: registration.agents.id,
            user_id: registration.agents.user_id,
            action: data?.action || "openclaw_execution",
            status: data?.status || "success",
            execution_time_ms: data?.execution_time_ms || null,
            details: data,
          });

          // Increment total_executions
          await supabase.rpc("increment_agent_executions", { 
            p_agent_id: registration.agents.id 
          }).catch(() => {
            // Fallback if RPC doesn't exist yet
            console.log("increment_agent_executions RPC not available, skipping");
          });
        }

        await supabase
          .from("openclaw_registrations")
          .update({ last_webhook_at: new Date().toISOString() })
          .eq("id", registration.id);
        break;
      }

      case "agent.error": {
        await supabase
          .from("openclaw_registrations")
          .update({
            status: "error",
            error_message: data?.error || "Unknown OpenClaw error",
            last_webhook_at: new Date().toISOString(),
          })
          .eq("id", registration.id);
        break;
      }

      case "agent.deactivated": {
        await supabase
          .from("openclaw_registrations")
          .update({ 
            status: "registered", 
            last_webhook_at: new Date().toISOString(),
          })
          .eq("id", registration.id);
        break;
      }

      default:
        console.log("Unknown webhook event:", event);
    }

    return new Response(JSON.stringify({ received: true, event }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("openclaw-webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
