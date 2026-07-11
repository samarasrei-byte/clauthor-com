// log-kpi — persist product analytics events server-side.
// Accepts up to 50 events per request. JWT required. Fire-and-forget from client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EventSchema = z.object({
  event: z.string().trim().min(1).max(80),
  payload: z.record(z.string(), z.unknown()).default({}),
});
const BodySchema = z.object({
  tenantId: z.string().uuid().optional(),
  events: z.array(EventSchema).min(1).max(50),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_input", details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve tenant (best-effort).
    let tenantId = parsed.data.tenantId ?? null;
    if (!tenantId) {
      try {
        const { data } = await supabase.rpc("get_user_tenant_id", { _user_id: user.id });
        if (typeof data === "string") tenantId = data;
      } catch { /* best-effort */ }
    }

    const rows = parsed.data.events.map((e) => ({
      tenant_id: tenantId,
      user_id: user.id,
      event: e.event,
      payload: e.payload as Record<string, unknown>,
    }));

    const { error: insErr } = await supabase.from("kpi_events").insert(rows);
    if (insErr) {
      console.warn("[log-kpi] insert failed:", insErr.message);
      return new Response(JSON.stringify({ error: "insert_failed", message: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[log-kpi] fatal:", (err as Error).message);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
