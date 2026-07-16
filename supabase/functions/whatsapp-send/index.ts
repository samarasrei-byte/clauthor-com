/**
 * whatsapp-send · envia mensagem outbound do painel para um contato.
 * Requer sessão autenticada. Valida que o usuário é membro do tenant dono
 * da whatsapp_config antes de despachar via Meta Cloud API.
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
const META_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
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

    const { tenant_id, to, text, conversation_id } = await req.json();
    if (!tenant_id || !to || !text) return json({ error: "missing_fields" }, 400);
    if (!META_ACCESS_TOKEN) return json({ error: "whatsapp_not_configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verifica se é membro do tenant.
    const { data: member } = await admin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenant_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return json({ error: "forbidden" }, 403);

    // Busca a config.
    const { data: cfg } = await admin
      .from("whatsapp_config")
      .select("phone_number_id")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!cfg) return json({ error: "no_config" }, 400);

    // Despacha.
    const res = await fetch(`https://graph.facebook.com/v18.0/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: String(text).slice(0, 4000) },
      }),
    });

    const respBody = await res.text();
    if (!res.ok) {
      console.error("[whatsapp-send] Meta error:", res.status, respBody);
      return json({ error: "meta_error", status: res.status, details: respBody }, res.status);
    }

    const parsed = JSON.parse(respBody);
    const waMessageId: string | undefined = parsed?.messages?.[0]?.id;

    // Garante conversa.
    let convId = conversation_id as string | undefined;
    if (!convId) {
      const { data: existing } = await admin
        .from("whatsapp_conversations")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("contact_phone", to)
        .maybeSingle();
      if (existing) {
        convId = existing.id as string;
      } else {
        const { data: created } = await admin
          .from("whatsapp_conversations")
          .insert({ tenant_id, contact_phone: to })
          .select("id")
          .single();
        convId = created?.id as string;
      }
    }

    if (convId) {
      await admin.from("whatsapp_messages").insert({
        tenant_id,
        conversation_id: convId,
        wa_message_id: waMessageId ?? null,
        direction: "outbound",
        message_type: "text",
        text_body: text,
        status: "sent",
      });
      await admin
        .from("whatsapp_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: String(text).slice(0, 200),
        })
        .eq("id", convId);
    }

    return json({ ok: true, wa_message_id: waMessageId, conversation_id: convId });
  } catch (e) {
    console.error("[whatsapp-send] fatal:", e);
    return json({ error: String(e) }, 500);
  }
});
