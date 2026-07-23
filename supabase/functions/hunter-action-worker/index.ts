// Worker: executes ONE hunter_action_jobs row.
// - Like / Comment: dispatched to PhantomBuster (stubbed when creds missing)
// - crm_push: HubSpot & Pipedrive via connector gateway; Salesforce/Zoho/RD Station stubbed
// - On failure: increments attempt, schedules exponential backoff, re-queues.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
const PIPEDRIVE_API_KEY = Deno.env.get("PIPEDRIVE_API_KEY");
const PHANTOMBUSTER_API_KEY = Deno.env.get("PHANTOMBUSTER_API_KEY");

interface Job {
  id: string;
  user_id: string;
  lead_id: string;
  action: "like" | "comment" | "crm_push";
  provider: string;
  attempt: number;
  max_attempts: number;
  payload: Record<string, unknown>;
}

interface Lead {
  id: string;
  nome_completo: string;
  cargo: string;
  empresa: string;
  linkedin_url: string;
}

async function runLike(lead: Lead): Promise<Record<string, unknown>> {
  if (!PHANTOMBUSTER_API_KEY) {
    // No creds yet — simulate success so pipeline is testable end-to-end
    return { simulated: true, note: "PhantomBuster credentials not configured", target: lead.linkedin_url };
  }
  const res = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Phantombuster-Key": PHANTOMBUSTER_API_KEY },
    body: JSON.stringify({
      id: Deno.env.get("PHANTOMBUSTER_LIKE_AGENT_ID") ?? "",
      argument: { profileUrl: lead.linkedin_url },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PhantomBuster ${res.status}: ${text}`);
  return { status: res.status, response: text.slice(0, 500) };
}

async function runComment(lead: Lead, comment: string | null): Promise<Record<string, unknown>> {
  if (!PHANTOMBUSTER_API_KEY) {
    return { simulated: true, note: "PhantomBuster credentials not configured", comment, target: lead.linkedin_url };
  }
  const res = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Phantombuster-Key": PHANTOMBUSTER_API_KEY },
    body: JSON.stringify({
      id: Deno.env.get("PHANTOMBUSTER_COMMENT_AGENT_ID") ?? "",
      argument: { profileUrl: lead.linkedin_url, comment: comment ?? "" },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PhantomBuster ${res.status}: ${text}`);
  return { status: res.status, response: text.slice(0, 500) };
}

async function pushHubspot(lead: Lead): Promise<Record<string, unknown>> {
  if (!LOVABLE_API_KEY || !HUBSPOT_API_KEY) {
    throw new Error("HubSpot connector não configurado — conecte em Integrações");
  }
  const [firstname, ...rest] = (lead.nome_completo || "").split(" ");
  const res = await fetch("https://connector-gateway.lovable.dev/hubspot/crm/v3/objects/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": HUBSPOT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        firstname: firstname || lead.nome_completo,
        lastname: rest.join(" "),
        company: lead.empresa,
        jobtitle: lead.cargo,
        website: lead.linkedin_url,
        lifecyclestage: "lead",
        hs_lead_status: "NEW",
      },
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${body}`);
  const json = JSON.parse(body);
  return { crmId: json.id, provider: "hubspot" };
}

async function pushPipedrive(lead: Lead): Promise<Record<string, unknown>> {
  if (!LOVABLE_API_KEY || !PIPEDRIVE_API_KEY) {
    throw new Error("Pipedrive connector não configurado — conecte em Integrações");
  }
  const res = await fetch("https://connector-gateway.lovable.dev/pipedrive/persons", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": PIPEDRIVE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: lead.nome_completo,
      org_name: lead.empresa,
      job_title: lead.cargo,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Pipedrive ${res.status}: ${body}`);
  const json = JSON.parse(body);
  return { crmId: json?.data?.id, provider: "pipedrive" };
}

async function pushCrmStub(provider: string, lead: Lead): Promise<Record<string, unknown>> {
  // Salesforce / Zoho / RD Station: connectors need per-user OAuth or provider API key.
  // Until the client wires them up, we simulate success and mark for follow-up config.
  return {
    simulated: true,
    provider,
    note: `${provider} connector requires setup in Integrações`,
    lead: lead.nome_completo,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const service = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { jobId } = (await req.json()) as { jobId?: string };
    if (!jobId) throw new Error("jobId required");

    const { data: job, error: jobErr } = await service
      .from("hunter_action_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle<Job>();
    if (jobErr || !job) throw new Error(`Job não encontrado: ${jobId}`);

    // Mark running
    await service
      .from("hunter_action_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", jobId);

    const { data: lead, error: leadErr } = await service
      .from("hunter_leads")
      .select("id, nome_completo, cargo, empresa, linkedin_url")
      .eq("id", job.lead_id)
      .maybeSingle<Lead>();
    if (leadErr || !lead) throw new Error(`Lead não encontrado: ${job.lead_id}`);

    let result: Record<string, unknown>;
    try {
      if (job.action === "like") {
        result = await runLike(lead);
        await service.from("hunter_leads").update({ liked_at: new Date().toISOString() }).eq("id", lead.id);
      } else if (job.action === "comment") {
        result = await runComment(lead, (job.payload.comment as string) ?? null);
        await service.from("hunter_leads").update({ commented_at: new Date().toISOString() }).eq("id", lead.id);
      } else {
        const provider = job.provider;
        if (provider === "hubspot") result = await pushHubspot(lead);
        else if (provider === "pipedrive") result = await pushPipedrive(lead);
        else result = await pushCrmStub(provider, lead);

        // Persist sent_to_crm on the lead
        const { data: current } = await service
          .from("hunter_leads")
          .select("sent_to_crm")
          .eq("id", lead.id)
          .maybeSingle<{ sent_to_crm: Record<string, unknown> }>();
        const merged = {
          ...(current?.sent_to_crm ?? {}),
          [provider]: { id: result.crmId ?? null, at: new Date().toISOString() },
        };
        await service.from("hunter_leads").update({ sent_to_crm: merged }).eq("id", lead.id);
      }

      await service
        .from("hunter_action_jobs")
        .update({
          status: "success",
          result,
          finished_at: new Date().toISOString(),
          error: null,
        })
        .eq("id", jobId);

      await service.from("hunter_logs").insert({
        user_id: job.user_id,
        level: "info",
        message: `${job.action} · ${job.provider} · ${lead.nome_completo}`,
      });

      return new Response(JSON.stringify({ ok: true, jobId, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (execErr) {
      const message = execErr instanceof Error ? execErr.message : String(execErr);
      const nextAttempt = job.attempt + 1;
      const shouldRetry = nextAttempt <= job.max_attempts;
      const backoffMinutes = Math.pow(2, job.attempt); // 2, 4, 8

      await service
        .from("hunter_action_jobs")
        .update({
          status: shouldRetry ? "queued" : "failed",
          attempt: nextAttempt,
          error: message.slice(0, 500),
          finished_at: shouldRetry ? null : new Date().toISOString(),
          next_retry_at: shouldRetry
            ? new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()
            : null,
        })
        .eq("id", jobId);

      await service.from("hunter_logs").insert({
        user_id: job.user_id,
        level: shouldRetry ? "warn" : "error",
        message: `${job.action} falhou (tentativa ${job.attempt}/${job.max_attempts}): ${message.slice(0, 300)}`,
      });

      return new Response(JSON.stringify({ ok: false, jobId, error: message, willRetry: shouldRetry }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("worker fatal", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
