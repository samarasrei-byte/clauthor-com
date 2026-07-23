import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  token: string;
  answers?: Record<string, unknown>;
  client_name?: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  complete?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Payload;
    if (!body?.token) {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const patch: Record<string, unknown> = {
      status: body.complete ? "completed" : "in_progress",
    };
    if (body.answers !== undefined) patch.answers = body.answers;
    if (body.client_name !== undefined) patch.client_name = body.client_name;
    if (body.company_name !== undefined) patch.company_name = body.company_name;
    if (body.contact_email !== undefined) patch.contact_email = body.contact_email;
    if (body.contact_phone !== undefined) patch.contact_phone = body.contact_phone;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.complete) patch.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("client_intakes")
      .update(patch)
      .eq("token", body.token)
      .select("id, status")
      .maybeSingle();
    if (error) throw error;
    if (!data) return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    return new Response(JSON.stringify({ ok: true, ...data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
