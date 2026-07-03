// DocuSign Connect webhook receiver
// Verifies HMAC-SHA256 (X-DocuSign-Signature-1 header, base64) and records envelope state.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

async function verifyHmac(body: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  if (expected.length !== header.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const raw = await req.text();
    const secret = Deno.env.get("DOCUSIGN_HMAC_KEY");
    if (secret) {
      const ok = await verifyHmac(raw, req.headers.get("X-DocuSign-Signature-1") ?? req.headers.get("x-docusign-signature-1"), secret);
      if (!ok) return j({ error: "invalid_signature" }, 401);
    }

    const payload = JSON.parse(raw);
    // DocuSign Connect JSON: data.envelopeSummary or event/data
    const env = payload?.data?.envelopeSummary ?? payload?.envelopeSummary ?? payload?.data ?? {};
    const externalId = env?.envelopeId ?? payload?.data?.envelopeId;
    const event = payload?.event ?? env?.status ?? "unknown";
    if (!externalId) return j({ error: "missing_envelope_id" }, 400);

    const statusRaw = String(env?.status ?? event).toLowerCase();
    const status =
      statusRaw.includes("completed") ? "signed"
      : statusRaw.includes("declined") ? "declined"
      : statusRaw.includes("voided") ? "cancelled"
      : "pending";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: existing } = await supabase
      .from("signed_documents")
      .select("id,user_id")
      .eq("provider", "docusign")
      .eq("external_id", String(externalId))
      .maybeSingle();

    await supabase.from("signed_documents").upsert({
      provider: "docusign",
      external_id: String(externalId),
      status,
      document_name: env?.emailSubject ?? null,
      signed_at: status === "signed" ? (env?.completedDateTime ?? new Date().toISOString()) : null,
      payload,
      user_id: existing?.user_id ?? null,
    }, { onConflict: "provider,external_id" });

    if (existing?.user_id && status === "signed") {
      await supabase.from("notifications").insert({
        user_id: existing.user_id,
        type: "document_signed",
        title: "📄 Envelope assinado",
        message: `Envelope ${env?.emailSubject ?? externalId} foi concluído no DocuSign.`,
        metadata: { provider: "docusign", external_id: externalId },
      });
    }

    return j({ received: true, event, status });
  } catch (err) {
    console.error("docusign-webhook error", err);
    return j({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});
