// Dispatch Hunter engagement actions (like / comment / crm_push).
// - Validates ownership of leads
// - Deduplicates crm_push per provider using hunter_leads.sent_to_crm
// - Creates one hunter_action_jobs row per lead
// - Fires the worker in the background (fire-and-forget)
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

type Action = "like" | "comment" | "crm_push";
type CrmProvider = "hubspot" | "pipedrive" | "salesforce" | "zoho" | "rdstation";

interface DispatchBody {
  leadIds: string[];
  action: Action;
  params?: {
    comment?: string;
    crmProvider?: CrmProvider;
  };
}

function validate(body: unknown): { ok: true; data: DispatchBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Corpo inválido" };
  const b = body as Record<string, unknown>;
  const leadIds = Array.isArray(b.leadIds) ? b.leadIds.filter((x) => typeof x === "string") as string[] : [];
  if (leadIds.length === 0) return { ok: false, error: "leadIds vazio" };
  if (leadIds.length > 100) return { ok: false, error: "Máximo 100 leads por dispatch" };
  const action = b.action as Action;
  if (!["like", "comment", "crm_push"].includes(action)) {
    return { ok: false, error: "action inválida" };
  }
  const params = (b.params ?? {}) as DispatchBody["params"];
  if (action === "crm_push") {
    const valid: CrmProvider[] = ["hubspot", "pipedrive", "salesforce", "zoho", "rdstation"];
    if (!params?.crmProvider || !valid.includes(params.crmProvider)) {
      return { ok: false, error: "crmProvider obrigatório para crm_push" };
    }
  }
  return { ok: true, data: { leadIds, action, params } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const parsed = validate(await req.json());
    if (!parsed.ok) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { leadIds, action, params } = parsed.data;

    const service = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: leads, error: leadsErr } = await service
      .from("hunter_leads")
      .select("id, user_id, campaign_id, linkedin_url, sent_to_crm")
      .in("id", leadIds);

    if (leadsErr) {
      console.error("Failed to load leads:", leadsErr);
      return new Response(JSON.stringify({ error: "Falha ao carregar leads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const owned = (leads ?? []).filter((l) => l.user_id === userId);
    if (owned.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum lead válido" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = action === "crm_push" ? params!.crmProvider! : "phantombuster";
    const jobsPayload = owned.map((lead) => {
      const alreadyInCrm =
        action === "crm_push" &&
        lead.sent_to_crm &&
        typeof lead.sent_to_crm === "object" &&
        (lead.sent_to_crm as Record<string, unknown>)[provider];
      return {
        user_id: userId,
        lead_id: lead.id,
        campaign_id: lead.campaign_id,
        action,
        provider,
        status: alreadyInCrm ? "skipped_duplicate" : "queued",
        payload: {
          linkedin_url: lead.linkedin_url,
          comment: params?.comment ?? null,
          crm_provider: action === "crm_push" ? provider : null,
        },
        finished_at: alreadyInCrm ? new Date().toISOString() : null,
        result: alreadyInCrm ? { skipped: true, reason: "already_in_crm" } : null,
      };
    });

    const { data: jobs, error: insertErr } = await service
      .from("hunter_action_jobs")
      .insert(jobsPayload)
      .select("id, status, lead_id");

    if (insertErr) {
      console.error("Failed to insert jobs:", insertErr);
      return new Response(JSON.stringify({ error: "Falha ao criar jobs" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire worker for queued jobs (fire-and-forget)
    const queuedIds = (jobs ?? []).filter((j) => j.status === "queued").map((j) => j.id);
    for (const jobId of queuedIds) {
      // Do not await — worker runs in background
      fetch(`${SUPABASE_URL}/functions/v1/hunter-action-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch((err) => console.error("worker dispatch failed", jobId, err));
    }

    return new Response(
      JSON.stringify({
        jobs: jobs ?? [],
        queued: queuedIds.length,
        skipped: (jobs?.length ?? 0) - queuedIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("dispatch error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
