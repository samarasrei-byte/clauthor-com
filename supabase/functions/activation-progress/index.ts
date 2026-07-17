// Upsert an activation step for a contracted department.
// Called by the frontend after each transition and by other edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Step = "checkout" | "subscription" | "provisioning" | "deploy" | "first_execution";
type Status = "pending" | "running" | "done" | "failed";

const VALID_STEPS: Step[] = ["checkout", "subscription", "provisioning", "deploy", "first_execution"];
const VALID_STATUS: Status[] = ["pending", "running", "done", "failed"];

function bad(msg: string, code = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status: code,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Auth: use the caller's JWT to identify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return bad("unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const {
      contracted_department_id,
      step,
      status,
      error_message,
      metadata,
    } = body ?? {};

    if (!contracted_department_id || typeof contracted_department_id !== "string") {
      return bad("contracted_department_id required");
    }
    if (!VALID_STEPS.includes(step)) return bad("invalid step");
    if (!VALID_STATUS.includes(status)) return bad("invalid status");

    // Service-role client for writes; we already verified ownership below.
    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm the department belongs to this user
    const { data: dept, error: deptErr } = await admin
      .from("contracted_departments")
      .select("id, user_id")
      .eq("id", contracted_department_id)
      .maybeSingle();
    if (deptErr) return bad(deptErr.message, 500);
    if (!dept || dept.user_id !== user.id) return bad("not_found", 404);

    const now = new Date().toISOString();
    const started_at = status === "running" ? now : null;
    const completed_at = status === "done" ? now : null;

    // Upsert (unique on contracted_department_id + step)
    const { data: existing } = await admin
      .from("department_activation_steps")
      .select("id, attempts, started_at")
      .eq("contracted_department_id", contracted_department_id)
      .eq("step", step)
      .maybeSingle();

    if (existing) {
      const patch: Record<string, unknown> = { status };
      if (status === "failed") patch.error_message = error_message ?? "Falha desconhecida";
      if (status !== "failed") patch.error_message = null;
      if (metadata && typeof metadata === "object") patch.metadata = metadata;
      if (status === "running") {
        patch.started_at = existing.started_at ?? now;
      }
      if (status === "done") patch.completed_at = now;

      const { error: updErr } = await admin
        .from("department_activation_steps")
        .update(patch)
        .eq("id", existing.id);
      if (updErr) return bad(updErr.message, 500);
    } else {
      const { error: insErr } = await admin.from("department_activation_steps").insert({
        contracted_department_id,
        user_id: user.id,
        step,
        status,
        error_message: status === "failed" ? (error_message ?? "Falha desconhecida") : null,
        metadata: metadata ?? {},
        started_at,
        completed_at,
      });
      if (insErr) return bad(insErr.message, 500);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return bad((e as Error).message ?? "unexpected", 500);
  }
});
