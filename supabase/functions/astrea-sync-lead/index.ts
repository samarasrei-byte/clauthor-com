// Astrea CRM lead sync (Advocacia).
// - Loads ASTREA_API_KEY from project secret.
// - Maps CAPTACAO_JURIDICA payload → Astrea contact + matter.
// - Logs to execution_logs (action='astrea_sync_lead').
// - Returns 412 with friendly hint when secret missing.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface Body {
  name: string;
  phone?: string;
  email?: string;
  practice_area?: string;     // Trabalhista / Cível / Família / Criminal etc.
  description?: string;
  source?: string;            // "whatsapp" / "site" / "indicacao"
  agent_id?: string;
}

const ASTREA_BASE = "https://api.astrea.com.br/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const j = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return j({ error: "unauthorized" }, 401);

  let body: Body;
  try { body = await req.json(); } catch { return j({ error: "invalid_json" }, 400); }
  if (!body?.name) return j({ error: "name_required" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);

  // Per-user override → fallback project secret
  let token = Deno.env.get("ASTREA_API_KEY") ?? "";
  const { data: userCred } = await admin
    .from("agent_credentials")
    .select("credential_value")
    .eq("user_id", user.id)
    .eq("integration_name", "astrea")
    .eq("credential_key", "api_key")
    .maybeSingle();
  if (userCred?.credential_value && userCred.credential_value !== "••••••••") token = userCred.credential_value;

  if (!token) {
    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: body.agent_id ?? "00000000-0000-0000-0000-000000000000",
      action: "astrea_sync_lead",
      status: "failed",
      details: { reason: "missing_token", lead_name: body.name },
    });
    return j({
      error: "astrea_token_not_configured",
      hint: "Configure ASTREA_API_KEY no painel ou em agent_credentials (integration='astrea', key='api_key').",
    }, 412);
  }

  const startedAt = Date.now();
  try {
    // 1) Create contact
    const contactRes = await fetch(`${ASTREA_BASE}/contatos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: body.name,
        telefone: body.phone ?? "",
        email: body.email ?? "",
        observacao: `[Clauthor / agente captacao_juridica] Origem: ${body.source ?? "n/d"}`,
      }),
    });
    if (!contactRes.ok) throw new Error(`contact_failed: ${await contactRes.text()}`);
    const contact = await contactRes.json();

    // 2) Create matter (processo/atendimento)
    if (body.practice_area || body.description) {
      await fetch(`${ASTREA_BASE}/atendimentos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contato_id: contact?.id ?? contact?.data?.id,
          area: body.practice_area ?? "Geral",
          descricao: body.description ?? "Lead captado via Clauthor",
          status: "novo",
        }),
      });
    }

    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: body.agent_id ?? "00000000-0000-0000-0000-000000000000",
      action: "astrea_sync_lead",
      status: "success",
      execution_time_ms: Date.now() - startedAt,
      details: { contact_id: contact?.id ?? contact?.data?.id, name: body.name, area: body.practice_area },
    });

    return j({ success: true, contact_id: contact?.id ?? contact?.data?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from("execution_logs").insert({
      user_id: user.id,
      agent_id: body.agent_id ?? "00000000-0000-0000-0000-000000000000",
      action: "astrea_sync_lead",
      status: "failed",
      execution_time_ms: Date.now() - startedAt,
      details: { error: msg, lead_name: body.name },
    });
    return j({ error: "astrea_request_failed", message: msg }, 502);
  }
});
