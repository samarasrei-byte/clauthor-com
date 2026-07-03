// ClickSign webhook receiver
// Verifies HMAC-SHA256 (Content-Hmac header) and records signed documents.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

async function verifyHmac(body: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const signature = header.replace(/^sha256=/, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const j = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const raw = await req.text();
    const secret = Deno.env.get("CLICKSIGN_HMAC_SECRET");
    if (secret) {
      const ok = await verifyHmac(raw, req.headers.get("Content-Hmac") ?? req.headers.get("content-hmac"), secret);
      if (!ok) return j({ error: "invalid_signature" }, 401);
    }

    const payload = JSON.parse(raw);
    const event = payload?.event?.name ?? payload?.event ?? "unknown";
    const doc = payload?.document ?? payload?.data?.document ?? {};
    const externalId = doc?.key ?? doc?.id ?? payload?.data?.id;
    if (!externalId) return j({ error: "missing_document_id" }, 400);

    const status =
      event === "auto_close" || event === "document.signed" || event === "close" ? "signed"
      : event === "cancel" ? "cancelled"
      : event === "deadline" ? "expired"
      : "pending";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Try to find owner via prior insert
    const { data: existing } = await supabase
      .from("signed_documents")
      .select("id,user_id")
      .eq("provider", "clicksign")
      .eq("external_id", String(externalId))
      .maybeSingle();

    await supabase.from("signed_documents").upsert({
      provider: "clicksign",
      external_id: String(externalId),
      status,
      document_name: doc?.filename ?? doc?.name ?? null,
      signed_at: status === "signed" ? new Date().toISOString() : null,
      payload,
      user_id: existing?.user_id ?? null,
    }, { onConflict: "provider,external_id" });

    if (existing?.user_id && status === "signed") {
      await supabase.from("notifications").insert({
        user_id: existing.user_id,
        type: "document_signed",
        title: "📄 Documento assinado",
        message: `Documento ${doc?.filename ?? externalId} foi assinado no ClickSign.`,
        metadata: { provider: "clicksign", external_id: externalId },
      });
    }

    return j({ received: true, event, status });
  } catch (err) {
    console.error("clicksign-webhook error", err);
    return j({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});
