import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

/** Fetch with exponential backoff retry */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // Only retry on 5xx or network errors
      if (response.ok || response.status < 500) return response;
      if (attempt === maxRetries) return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(r => setTimeout(r, delay));
    console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${url}`);
  }
  throw new Error("Unreachable");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return new Response(JSON.stringify({ error: "agentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Fetch agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("user_id", userId)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit checks
    const audit = {
      has_instructions: !!agent.instructions && agent.instructions.length > 10,
      has_name: !!agent.name,
      has_tier: !!agent.tier,
      status_valid: agent.status === "active",
      actions_configured: Array.isArray(agent.actions) && agent.actions.length > 0,
    };

    const auditPassed = audit.has_instructions && audit.has_name && audit.status_valid;

    if (!auditPassed) {
      const issues = [];
      if (!audit.has_instructions) issues.push("Instruções do agente estão vazias ou muito curtas");
      if (!audit.has_name) issues.push("Nome do agente não definido");
      if (!audit.status_valid) issues.push("Status do agente não é 'active'");

      return new Response(JSON.stringify({ 
        error: "Auditoria falhou", 
        audit,
        issues,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENCLAW_API_KEY = Deno.env.get("OPENCLAW_API_KEY");
    const OPENCLAW_BASE_URL = Deno.env.get("OPENCLAW_BASE_URL") || "https://api.openclaw.ai";

    if (!OPENCLAW_API_KEY) {
      // No API key - register as pending
      const { data: registration, error: regError } = await supabase
        .from("openclaw_registrations")
        .insert({
          agent_id: agentId,
          user_id: userId,
          status: "pending",
          metadata: {
            audit,
            agent_config: {
              name: agent.name,
              tier: agent.tier,
              instructions_length: agent.instructions?.length || 0,
              channels: agent.channels,
              integrations: agent.integrations,
              actions: agent.actions,
            },
          },
        })
        .select()
        .single();

      if (regError) {
        console.error("Registration insert error:", regError);
        throw new Error("Failed to create registration record");
      }

      return new Response(JSON.stringify({
        success: true,
        status: "pending",
        message: "Auditoria aprovada. Agente registrado como pendente (API OpenClaw não configurada).",
        audit,
        registration_id: registration.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch decrypted credentials for execution bridge
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    let agentCredentials: Record<string, Record<string, string>> = {};
    try {
      const credRes = await fetch(
        `${supabaseUrl}/functions/v1/credential-manager`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            action: "decrypt_for_execution",
            agent_id: agentId,
          }),
        }
      );
      if (credRes.ok) {
        const credData = await credRes.json();
        agentCredentials = credData.credentials || {};
      }
    } catch (e) {
      console.warn("Could not fetch agent credentials:", e);
    }

    // Register with OpenClaw API (with retry)
    const webhookUrl = `${supabaseUrl}/functions/v1/openclaw-webhook`;
    
    const openclawPayload = {
      name: agent.name,
      description: agent.description || "",
      system_prompt: agent.instructions,
      tier: agent.tier,
      channels: agent.channels || [],
      integrations: agent.integrations || [],
      actions: agent.actions || [],
      credentials: agentCredentials,
      webhook_url: webhookUrl,
      metadata: {
        clauthor_agent_id: agentId,
        clauthor_user_id: userId,
      },
    };

    const openclawResponse = await fetchWithRetry(
      `${OPENCLAW_BASE_URL}/v1/agents/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENCLAW_API_KEY}`,
        },
        body: JSON.stringify(openclawPayload),
      },
      3
    );

    const openclawData = await openclawResponse.json();

    if (!openclawResponse.ok) {
      await supabase.from("openclaw_registrations").insert({
        agent_id: agentId,
        user_id: userId,
        status: "error",
        error_message: openclawData.error || `OpenClaw API error: ${openclawResponse.status}`,
        metadata: { audit, openclaw_response: openclawData },
      });

      return new Response(JSON.stringify({
        error: "Falha ao registrar no OpenClaw",
        details: openclawData.error || "Unknown error",
        audit,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: registration, error: regError } = await supabase
      .from("openclaw_registrations")
      .insert({
        agent_id: agentId,
        user_id: userId,
        openclaw_agent_id: openclawData.agent_id || openclawData.id,
        status: "registered",
        webhook_url: webhookUrl,
        metadata: {
          audit,
          openclaw_response: openclawData,
        },
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration insert error:", regError);
    }

    return new Response(JSON.stringify({
      success: true,
      status: "registered",
      message: "Agente registrado no OpenClaw com sucesso! 🚀",
      audit,
      openclaw_agent_id: openclawData.agent_id || openclawData.id,
      registration_id: registration?.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("openclaw-register error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
