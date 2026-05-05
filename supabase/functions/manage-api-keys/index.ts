import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function err(msg: string, status = 400) { return json({ error: msg }, status); }

function generateApiKey(): { key: string; prefix: string } {
  // 32 bytes random → base64url, prefixed sk_live_
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const key = `sk_live_${b64}`;
  const prefix = key.slice(0, 16); // sk_live_ABCD1234
  return { key, prefix };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Auth: must be a logged-in user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return err("Unauthorized", 401);
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return err("Invalid token", 401);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (req.method === "GET") {
      const { data, error } = await admin
        .from("api_keys")
        .select("id, name, key_prefix, plan, is_active, expires_at, last_used_at, total_calls, created_at, revoked_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return err(error.message, 500);
      return json({ data, count: data?.length || 0 });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body?.name || typeof body.name !== "string" || body.name.length > 100) {
        return err("name is required (string, max 100 chars)");
      }
      const plan = body.plan === "paid" ? "paid" : "free";
      const { key, prefix } = generateApiKey();

      // Hash via DB function for consistency
      const { data: hashData, error: hashErr } = await admin.rpc("hash_api_key", { _key: key });
      if (hashErr) return err("hash failed: " + hashErr.message, 500);

      const { data, error } = await admin.from("api_keys").insert({
        user_id: user.id,
        name: body.name,
        key_prefix: prefix,
        key_hash: hashData,
        plan,
        expires_at: body.expires_at || null,
      }).select("id, name, key_prefix, plan, is_active, expires_at, created_at").single();
      if (error) return err(error.message, 500);

      // Return the FULL key exactly once
      return json({ data: { ...data, key }, warning: "Store this key now. It will not be shown again." }, 201);
    }

    if (req.method === "DELETE" && id) {
      const { error } = await admin
        .from("api_keys")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    return err("Method not allowed", 405);
  } catch (e) {
    console.error("manage-api-keys error", e);
    return err("Internal server error", 500);
  }
});
