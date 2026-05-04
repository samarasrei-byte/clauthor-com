import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";

/** Verify HMAC-SHA256 signature from OpenClaw */
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    
    // Validate HMAC signature
    const webhookSecret = Deno.env.get("OPENCLAW_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("x-openclaw-signature");
      const valid = await verifySignature(rawBody, signature, webhookSecret);
      if (!valid) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("OPENCLAW_WEBHOOK_SECRET not set - skipping signature validation");
    }

    const body = JSON.parse(rawBody);
    const { event, agent_id: openclawAgentId, data, timestamp } = body;

    if (!event || !openclawAgentId) {
      return new Response(JSON.stringify({ error: "Missing event or agent_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

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
        if (registration.agents?.id && registration.agents?.user_id) {
          await supabase.from("execution_logs").insert({
            agent_id: registration.agents.id,
            user_id: registration.agents.user_id,
            action: data?.action || "openclaw_execution",
            status: data?.status || "success",
            execution_time_ms: data?.execution_time_ms || null,
            details: data,
          });

          // Use the new RPC
          const { error: rpcError } = await supabase.rpc("increment_agent_executions", { 
            p_agent_id: registration.agents.id 
          });
          if (rpcError) {
            console.error("increment_agent_executions RPC error:", rpcError);
          }
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
