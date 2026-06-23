// Generates / fetches WhatsApp QR Code via Evolution API for the current tenant.
// Returns base64 QR image so the user can pair their device without manual intervention.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return errorResponse("Unauthorized", 401);

    const evoUrl = Deno.env.get("EVOLUTION_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    const baseInstance = Deno.env.get("EVOLUTION_INSTANCE") || "clauthor";
    if (!evoUrl || !evoKey) return errorResponse("Evolution API não configurada", 500);

    // Per-tenant instance name (isolated session)
    const { data: tm } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const tenantId = tm?.tenant_id || user.id;
    const instance = `${baseInstance}_${String(tenantId).replace(/-/g, "").slice(0, 12)}`;

    const headers = { "Content-Type": "application/json", "apikey": evoKey };

    // 1) Ensure instance exists (idempotent create)
    await fetch(`${evoUrl}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
    }).catch(() => null);

    // 2) Fetch connection state
    const stateRes = await fetch(`${evoUrl}/instance/connectionState/${instance}`, { headers });
    const stateJson = await stateRes.json().catch(() => ({}));
    const state = stateJson?.instance?.state || stateJson?.state;

    if (state === "open") {
      return jsonResponse({ connected: true, instance, state });
    }

    // 3) Request QR
    const qrRes = await fetch(`${evoUrl}/instance/connect/${instance}`, { headers });
    const qrJson = await qrRes.json().catch(() => ({}));
    const qrBase64 = qrJson?.base64 || qrJson?.qrcode?.base64 || qrJson?.qr || null;
    const pairingCode = qrJson?.pairingCode || qrJson?.code || null;

    return jsonResponse({
      connected: false,
      instance,
      state: state || "connecting",
      qr_base64: qrBase64,
      pairing_code: pairingCode,
    });
  } catch (e) {
    return errorResponse(`Erro: ${(e as Error).message}`, 500);
  }
});
