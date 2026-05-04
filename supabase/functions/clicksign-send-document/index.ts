// Clicksign envelope sender (Advocacia squad).
// - Loads user-scoped CLICKSIGN_API_TOKEN from agent_credentials when available,
//   falls back to project secret CLICKSIGN_API_TOKEN.
// - Logs every attempt to execution_logs (action='clicksign_send_document').
// - Fails soft when token is missing so the wizard can show "configure first".
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface Signer {
  name: string;
  email: string;
  documentation?: string;
  birthday?: string;
}

interface Body {
  template_id?: string;
  document_url?: string;
  document_name?: string;
  signers: Signer[];
  message?: string;
  deadline_days?: number;
}

const CLICKSIGN_BASE = "https://app.clicksign.com/api/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const j = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Authenticate caller
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return j({ error: "unauthorized" }, 401);

  let body: Body;
  try { body = await req.json(); } catch { return j({ error: "invalid_json" }, 400); }

  if (!body?.signers?.length) return j({ error: "signers_required" }, 400);
  if (!body.template_id && !body.document_url) return j({ error: "template_id_or_document_url_required" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Resolve token: per-user credential → fallback project secret
  let token = Deno.env.get("CLICKSIGN_API_TOKEN") ?? "";
  const { data: userCred } = await admin
    .from("agent_credentials")
    .select("credential_value")
    .eq("user_id", user.id)
    .eq("integration_name", "clicksign")
    .eq("credential_key", "api_token")
    .maybeSingle();
  if (userCred?.credential_value && userCred.credential_value !== "••••••••") {
    token = userCred.credential_value;
  }

  if (!token) {
    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: "00000000-0000-0000-0000-000000000000",
      action: "clicksign_send_document",
      status: "failed",
      details: { reason: "missing_token" },
    });
    return j({ error: "clicksign_token_not_configured", hint: "Configure CLICKSIGN_API_TOKEN no painel ou em agent_credentials." }, 412);
  }

  const startedAt = Date.now();
  try {
    // 1) Create envelope
    const envRes = await fetch(`${CLICKSIGN_BASE}/envelopes?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        envelope: {
          name: body.document_name ?? "Contrato de honorários - Clauthor",
          locale: "pt-BR",
          deadline_at: new Date(Date.now() + (body.deadline_days ?? 14) * 86400000).toISOString(),
          remind_interval: 3,
          auto_close: true,
        },
      }),
    });
    if (!envRes.ok) throw new Error(`envelope_create_failed: ${await envRes.text()}`);
    const envelope = await envRes.json();
    const envelopeId = envelope?.data?.id;

    // 2) Attach document (template OR url)
    if (body.template_id) {
      await fetch(`${CLICKSIGN_BASE}/envelopes/${envelopeId}/templates?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: body.template_id }),
      });
    } else if (body.document_url) {
      await fetch(`${CLICKSIGN_BASE}/envelopes/${envelopeId}/documents?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: { content_url: body.document_url } }),
      });
    }

    // 3) Add signers
    for (const s of body.signers) {
      await fetch(`${CLICKSIGN_BASE}/envelopes/${envelopeId}/signers?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer: {
            name: s.name, email: s.email,
            documentation: s.documentation, birthday: s.birthday,
            has_documentation: !!s.documentation,
            communicate_events: { document_signed: "email", signature_request: "email", signature_reminder: "email" },
          },
        }),
      });
    }

    // 4) Activate (send)
    const sendRes = await fetch(`${CLICKSIGN_BASE}/envelopes/${envelopeId}?access_token=${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envelope: { status: "running" } }),
    });
    if (!sendRes.ok) throw new Error(`envelope_activate_failed: ${await sendRes.text()}`);

    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: "00000000-0000-0000-0000-000000000000",
      action: "clicksign_send_document",
      status: "success",
      execution_time_ms: Date.now() - startedAt,
      details: { envelope_id: envelopeId, signers: body.signers.length },
    });

    return j({ success: true, envelope_id: envelopeId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: "00000000-0000-0000-0000-000000000000",
      action: "clicksign_send_document",
      status: "failed",
      execution_time_ms: Date.now() - startedAt,
      details: { error: msg },
    });
    return j({ error: "clicksign_request_failed", message: msg }, 502);
  }
});
