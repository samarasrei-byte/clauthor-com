import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, securityHeaders, rateLimitResponse } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Server-side AES-256-GCM encryption ──
const ALGO = "AES-GCM";
const IV_LENGTH = 12;
const ENC_PREFIX = "senc:v1:"; // server-encrypted prefix

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("clauthor-server-credential-salt-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function encryptValue(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return `${ENC_PREFIX}${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
}

async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted.startsWith(ENC_PREFIX)) return encrypted; // legacy plaintext
  const payload = encrypted.slice(ENC_PREFIX.length);
  const [ivB64, cipherB64] = payload.split(":");
  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv: new Uint8Array(base64ToArrayBuffer(ivB64)) },
    key,
    base64ToArrayBuffer(cipherB64)
  );
  return new TextDecoder().decode(plaintext);
}

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
    const rl = checkRateLimit(`cred:${userId}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter!, corsHeaders);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action, agent_id, integration_name, credential_key, credential_value, is_secret, expires_at } = body;

    // Validate agent ownership
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
    const headers = { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" };

    switch (action) {
      // ── SAVE: Encrypt and store a credential ──
      case "save": {
        if (!agent_id || !integration_name || !credential_key || !credential_value) {
          return new Response(JSON.stringify({ error: "agent_id, integration_name, credential_key, and credential_value required" }), {
            status: 400, headers,
          });
        }

        const encryptedValue = await encryptValue(credential_value);

        const { error } = await adminClient
          .from("agent_credentials")
          .upsert({
            agent_id,
            user_id: userId,
            integration_name,
            credential_key,
            credential_value: encryptedValue,
            is_secret: is_secret !== false,
            expires_at: expires_at || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "agent_id,credential_key",
          });

        if (error) throw error;

        await adminClient.from("credential_audit_logs").insert({
          user_id: userId,
          agent_id,
          integration_name,
          credential_key,
          action: "save",
          ip_address: clientIp,
          user_agent: ua.slice(0, 200),
          metadata: { encrypted: true, version: "senc:v1" },
        });

        return new Response(JSON.stringify({
          success: true,
          message: `Credencial ${credential_key} salva com criptografia AES-256-GCM.`,
        }), { headers });
      }

      // ── REVOKE ──
      case "revoke": {
        if (!agent_id || !integration_name) {
          return new Response(JSON.stringify({ error: "agent_id and integration_name required" }), {
            status: 400, headers,
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

        for (const cred of deleted || []) {
          await adminClient.from("credential_audit_logs").insert({
            user_id: userId, agent_id, integration_name,
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
          message: `Credenciais de ${integration_name} revogadas.`,
        }), { headers });
      }

      // ── REVOKE ALL ──
      case "revoke_all": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), { status: 400, headers });
        }

        const { data: deleted, error } = await adminClient
          .from("agent_credentials")
          .delete()
          .eq("agent_id", agent_id)
          .eq("user_id", userId)
          .select("integration_name, credential_key");

        if (error) throw error;

        for (const cred of deleted || []) {
          await adminClient.from("credential_audit_logs").insert({
            user_id: userId, agent_id,
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
        }), { headers });
      }

      // ── AUDIT ──
      case "audit": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), { status: 400, headers });
        }

        const { data: logs } = await adminClient
          .from("credential_audit_logs")
          .select("*")
          .eq("user_id", userId)
          .eq("agent_id", agent_id)
          .order("created_at", { ascending: false })
          .limit(100);

        return new Response(JSON.stringify({ logs: logs || [] }), { headers });
      }

      // ── CHECK EXPIRED ──
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
        }), { headers });
      }

      // ── LIST ALL (user's credentials across all agents) ──
      case "list_all": {
        const { data: allCreds } = await adminClient
          .from("agent_credentials")
          .select("id, agent_id, integration_name, credential_key, is_secret, created_at, updated_at, expires_at, last_accessed_at, access_count")
          .eq("user_id", userId)
          .order("integration_name");

        return new Response(JSON.stringify({
          credentials: (allCreds || []).map(c => ({
            id: c.id,
            agent_id: c.agent_id,
            integration_name: c.integration_name,
            key: c.credential_key,
            is_secret: c.is_secret,
            expires_at: c.expires_at,
            last_accessed_at: c.last_accessed_at,
            access_count: c.access_count,
            created_at: c.created_at,
            value: "••••••••",
          })),
        }), { headers });
      }

      // ── LIST (masked, never returns values) ──
      case "list": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), { status: 400, headers });
        }

        const { data: creds } = await adminClient
          .from("agent_credentials")
          .select("id, integration_name, credential_key, is_secret, created_at, updated_at, expires_at, last_accessed_at, access_count")
          .eq("agent_id", agent_id)
          .eq("user_id", userId);

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
            value: "••••••••",
          })),
        }), { headers });
      }

      // ── DECRYPT FOR EXECUTION (internal use — agent execution bridge) ──
      // Hybrid model: client credentials override platform defaults
      case "decrypt_for_execution": {
        if (!agent_id) {
          return new Response(JSON.stringify({ error: "agent_id required" }), { status: 400, headers });
        }

        // 1. Fetch client-specific credentials
        const { data: clientCreds } = await adminClient
          .from("agent_credentials")
          .select("integration_name, credential_key, credential_value")
          .eq("agent_id", agent_id)
          .eq("user_id", userId);

        // 2. Fetch platform-level default credentials (fallback)
        const { data: platformCreds } = await adminClient
          .from("platform_credentials")
          .select("integration_name, credential_key, credential_value")
          .eq("is_active", true);

        // 3. Build merged map: platform first, then client overrides
        const decrypted: Record<string, Record<string, string>> = {};

        // Platform defaults
        for (const cred of platformCreds || []) {
          try {
            const value = await decryptValue(cred.credential_value);
            if (!decrypted[cred.integration_name]) decrypted[cred.integration_name] = {};
            decrypted[cred.integration_name][cred.credential_key] = value;
          } catch (e) {
            console.warn(`Failed to decrypt platform ${cred.credential_key}:`, e);
          }
        }

        // Client overrides (takes precedence)
        for (const cred of clientCreds || []) {
          try {
            const value = await decryptValue(cred.credential_value);
            if (!decrypted[cred.integration_name]) decrypted[cred.integration_name] = {};
            decrypted[cred.integration_name][cred.credential_key] = value;
          } catch (e) {
            console.warn(`Failed to decrypt client ${cred.credential_key}:`, e);
          }
        }

        // Update access tracking
        if (clientCreds && clientCreds.length > 0) {
          await adminClient
            .from("agent_credentials")
            .update({ last_accessed_at: new Date().toISOString() })
            .eq("agent_id", agent_id)
            .eq("user_id", userId);
        }

        await adminClient.from("credential_audit_logs").insert({
          user_id: userId,
          agent_id,
          integration_name: "all",
          credential_key: "execution_decrypt",
          action: "decrypt_for_execution",
          ip_address: clientIp,
          user_agent: ua.slice(0, 200),
          metadata: {
            integrations_decrypted: Object.keys(decrypted),
            sources: {
              platform: (platformCreds || []).length,
              client: (clientCreds || []).length,
            },
          },
        });

        return new Response(JSON.stringify({ credentials: decrypted }), { headers });
      }

      // ── SAVE PLATFORM CREDENTIAL (admin only) ──
      case "save_platform": {
        // Check admin role
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers });
        }

        if (!integration_name || !credential_key || !credential_value) {
          return new Response(JSON.stringify({ error: "integration_name, credential_key, and credential_value required" }), { status: 400, headers });
        }

        const encryptedPlatformValue = await encryptValue(credential_value);

        const { error: platError } = await adminClient
          .from("platform_credentials")
          .upsert({
            integration_name,
            credential_key,
            credential_value: encryptedPlatformValue,
            is_active: true,
            description: body.description || "",
            updated_at: new Date().toISOString(),
          }, { onConflict: "integration_name,credential_key" });

        if (platError) throw platError;

        return new Response(JSON.stringify({
          success: true,
          message: `Credencial de plataforma ${integration_name}/${credential_key} salva.`,
        }), { headers });
      }

      // ── LIST PLATFORM CREDENTIALS (all authenticated users — masked values only) ──
      case "list_platform": {
        const { data: platCreds } = await adminClient
          .from("platform_credentials")
          .select("id, integration_name, credential_key, is_active, description, created_at, updated_at")
          .order("integration_name");

        return new Response(JSON.stringify({
          credentials: (platCreds || []).map(c => ({ ...c, value: "••••••••" })),
        }), { headers });
      }

      // ── DELETE PLATFORM CREDENTIAL (admin only) ──
      case "delete_platform": {
        const { data: roleCheck2 } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        if (!roleCheck2) {
          return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers });
        }

        if (!body.credential_id) {
          return new Response(JSON.stringify({ error: "credential_id required" }), { status: 400, headers });
        }

        const { error: delErr } = await adminClient
          .from("platform_credentials")
          .delete()
          .eq("id", body.credential_id);

        if (delErr) throw delErr;

        return new Response(JSON.stringify({ success: true, message: "Credencial removida." }), { headers });
      }

      // ── SAVE USER INTEGRATION (any authenticated user can store their own integration creds) ──
      case "save_user_integration": {
        if (!integration_name || !credential_key || !credential_value) {
          return new Response(JSON.stringify({ error: "integration_name, credential_key, and credential_value required" }), { status: 400, headers });
        }

        const encryptedUserValue = await encryptValue(credential_value);

        // Use a deterministic "virtual agent" ID per user+integration to avoid needing a real agent
        // Store in platform_credentials-like structure but scoped to user via agent_credentials
        // First, check if user has any agent — if not, create a system placeholder
        let targetAgentId = body.agent_id;
        
        if (!targetAgentId) {
          // Find or create a system "integrations" agent for this user
          const { data: existingAgent } = await adminClient
            .from("agents")
            .select("id")
            .eq("user_id", userId)
            .eq("name", "__integrations__")
            .maybeSingle();
          
          if (existingAgent) {
            targetAgentId = existingAgent.id;
          } else {
            const { data: newAgent } = await adminClient
              .from("agents")
              .insert({
                user_id: userId,
                name: "__integrations__",
                description: "Sistema interno para armazenar credenciais de integrações",
                status: "active",
                tier: "basic",
              })
              .select("id")
              .single();
            targetAgentId = newAgent?.id;
          }
        }

        if (!targetAgentId) {
          return new Response(JSON.stringify({ error: "Failed to resolve agent for credentials" }), { status: 500, headers });
        }

        const { error: saveErr } = await adminClient
          .from("agent_credentials")
          .upsert({
            agent_id: targetAgentId,
            user_id: userId,
            integration_name,
            credential_key,
            credential_value: encryptedUserValue,
            is_secret: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "agent_id,credential_key" });

        if (saveErr) throw saveErr;

        await adminClient.from("credential_audit_logs").insert({
          user_id: userId,
          agent_id: targetAgentId,
          integration_name,
          credential_key,
          action: "save_user_integration",
          ip_address: clientIp,
          user_agent: ua.slice(0, 200),
          metadata: { encrypted: true, version: "senc:v1" },
        });

        return new Response(JSON.stringify({
          success: true,
          message: `Credencial ${credential_key} de ${integration_name} salva com sucesso.`,
        }), { headers });
      }

      // ── LIST USER INTEGRATIONS (user's own integration credentials, masked) ──
      case "list_user_integrations": {
        const { data: userCreds } = await adminClient
          .from("agent_credentials")
          .select("id, integration_name, credential_key, created_at, updated_at")
          .eq("user_id", userId)
          .order("integration_name");

        return new Response(JSON.stringify({
          credentials: (userCreds || []).map(c => ({
            ...c,
            value: "••••••••",
          })),
        }), { headers });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers });
    }
  } catch (error) {
    console.error("credential-manager error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
