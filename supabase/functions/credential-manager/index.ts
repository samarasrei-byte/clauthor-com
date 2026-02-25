import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, securityHeaders, rateLimitResponse } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Rate limit per user
    const rl = checkRateLimit(`cred:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { action, agent_id, integration_name, credential_key } = await req.json();

    // === CRITICAL: Validate agent belongs to user ===
    if (agent_id) {
      const { data: agent } = await adminClient
        .from("agents")
        .select("id")
        .eq("id", agent_id)
        .eq("user_id", userId)
        .single();

      if (!agent) {
        return new Response(JSON.stringify({ error: "Agent not found or not yours" }), {
          status: 403,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    switch (action) {
      // ── REVOKE: Remove all credentials for an agent+integration ──
      case "revoke": {
        if (!agent_id || !integration_name) {
          return new Response(JSON.stringify({ error: "agent_id and integration_name required" }), {
            status: 400,
            headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: deleted, error } = await adminClient
          .from("agent_credentials")
          .delete()
          .eq("agent_id", agent_id)
          .eq("user_id", userId)
          .eq("integration_name", integration_name)
          .select("credential_key");

        if (error) throw error;

        // Audit log
        for (const cred of deleted || []) {
          await adminClient.from("credential_audit_logs").insert({
            user_id: userId,
            agent_id,
            integration_name,
            credential_key: cred.credential_key,
            action: "revoke",
            ip_address: clientIp,
            user_agent: ua.slice(0, 200),
            metadata: { revoked_at: new Date().toISOString() },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          revoked_count: deleted?.length || 0,
          message: `Credenciais de ${integration_name} revogadas para o agente.`,
        }), {
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      // ── REVOKE ALL: Remove ALL credentials for an agent ──
      case "revoke_all": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
            status: 400,
            headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: deleted, error } = await adminClient
          .from("agent_credentials")
          .delete()
          .eq("agent_id", agent_id)
          .eq("user_id", userId)
          .select("integration_name, credential_key");

        if (error) throw error;

        // Audit log
        for (const cred of deleted || []) {
          await adminClient.from("credential_audit_logs").insert({
            user_id: userId,
            agent_id,
            integration_name: cred.integration_name,
            credential_key: cred.credential_key,
            action: "revoke_all",
            ip_address: clientIp,
            user_agent: ua.slice(0, 200),
          });
        }

        return new Response(JSON.stringify({
          success: true,
          revoked_count: deleted?.length || 0,
          message: `Todas as credenciais do agente foram revogadas.`,
        }), {
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      // ── AUDIT: List access logs for an agent ──
      case "audit": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
            status: 400,
            headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: logs } = await adminClient
          .from("credential_audit_logs")
          .select("*")
          .eq("user_id", userId)
          .eq("agent_id", agent_id)
          .order("created_at", { ascending: false })
          .limit(100);

        return new Response(JSON.stringify({ logs: logs || [] }), {
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      // ── CHECK EXPIRATION: Find expired credentials ──
      case "check_expired": {
        const { data: expired } = await adminClient
          .from("agent_credentials")
          .select("id, agent_id, integration_name, credential_key, expires_at")
          .eq("user_id", userId)
          .not("expires_at", "is", null)
          .lt("expires_at", new Date().toISOString());

        return new Response(JSON.stringify({
          expired_count: expired?.length || 0,
          expired: (expired || []).map(c => ({
            agent_id: c.agent_id,
            integration: c.integration_name,
            key: c.credential_key,
            expired_at: c.expires_at,
          })),
        }), {
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      // ── LIST: Show credentials (masked) for an agent ──
      case "list": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), {
            status: 400,
            headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: creds } = await adminClient
          .from("agent_credentials")
          .select("id, integration_name, credential_key, is_secret, created_at, updated_at, expires_at, last_accessed_at, access_count")
          .eq("agent_id", agent_id)
          .eq("user_id", userId);

        // NEVER return credential values via API
        return new Response(JSON.stringify({
          credentials: (creds || []).map(c => ({
            id: c.id,
            integration: c.integration_name,
            key: c.credential_key,
            is_secret: c.is_secret,
            expires_at: c.expires_at,
            last_accessed_at: c.last_accessed_at,
            access_count: c.access_count,
            created_at: c.created_at,
            // Value is NEVER returned
            value: "••••••••",
          })),
        }), {
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("credential-manager error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
