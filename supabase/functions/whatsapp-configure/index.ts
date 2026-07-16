/**
 * whatsapp-configure · salva/atualiza a whatsapp_config do tenant.
 * Somente admin/owner do tenant. Gera verify_token automaticamente.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "invalid_session" }, 401);
    const userId = userRes.user.id;

    const { tenant_id, phone_number_id, waba_id, display_phone_number } = await req.json();
    if (!tenant_id || !phone_number_id) return json({ error: "missing_fields" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Confirma admin/owner
    const { data: member } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenant_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member || !["owner", "admin"].includes(String(member.role))) {
      return json({ error: "forbidden" }, 403);
    }

    // Verifica se já existe.
    const { data: existing } = await admin
      .from("whatsapp_config")
      .select("id, verify_token")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    const verify_token = existing?.verify_token ?? randomToken();

    if (existing) {
      const { error } = await admin
        .from("whatsapp_config")
        .update({ phone_number_id, waba_id, display_phone_number, is_active: true })
        .eq("id", existing.id);
      if (error) return json({ error: error.message }, 500);
    } else {
      const { error } = await admin.from("whatsapp_config").insert({
        tenant_id,
        phone_number_id,
        waba_id,
        display_phone_number,
        verify_token,
        created_by: userId,
      });
      if (error) return json({ error: error.message }, 500);
    }

    const webhookUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/whatsapp-webhook`;
    return json({ ok: true, verify_token, webhook_url: webhookUrl });
  } catch (e) {
    console.error("[whatsapp-configure] fatal:", e);
    return json({ error: String(e) }, 500);
  }
});
