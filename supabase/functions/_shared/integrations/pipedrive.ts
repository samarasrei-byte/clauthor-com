/**
 * Pipedrive CRM Integration Handler
 * Actions: get-deals, create-deal, update-deal, get-contacts, create-activity
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.pipedrive.com/v1";

export async function handlePipedrive(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.api_token || creds.api_key;
  if (!token) return { success: false, error: "Missing Pipedrive API token" };

  const authParam = `api_token=${token}`;
  const headers = { "Content-Type": "application/json" };

  switch (action) {
    case "get-deals": {
      const limit = params.limit || 10;
      const status = params.status || "open";
      const res = await fetch(`${BASE}/deals?status=${status}&limit=${limit}&${authParam}`);
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    case "create-deal": {
      const { title, value, currency, person_id, org_id, stage_id } = params;
      if (!title) return { success: false, error: "title required" };

      const body: any = { title };
      if (value) body.value = value;
      if (currency) body.currency = currency;
      if (person_id) body.person_id = person_id;
      if (org_id) body.org_id = org_id;
      if (stage_id) body.stage_id = stage_id;

      const res = await fetch(`${BASE}/deals?${authParam}`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    case "update-deal": {
      const { deal_id, ...updates } = params;
      if (!deal_id) return { success: false, error: "deal_id required" };

      const res = await fetch(`${BASE}/deals/${deal_id}?${authParam}`, {
        method: "PUT", headers, body: JSON.stringify(updates),
      });
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    case "get-contacts": {
      const limit = params.limit || 10;
      const res = await fetch(`${BASE}/persons?limit=${limit}&${authParam}`);
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    case "create-activity": {
      const { subject, type, due_date, deal_id, person_id, note } = params;
      if (!subject || !type) return { success: false, error: "subject and type required" };

      const body: any = { subject, type };
      if (due_date) body.due_date = due_date;
      if (deal_id) body.deal_id = deal_id;
      if (person_id) body.person_id = person_id;
      if (note) body.note = note;

      const res = await fetch(`${BASE}/activities?${authParam}`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    case "get-pipeline": {
      const res = await fetch(`${BASE}/pipelines?${authParam}`);
      if (!res.ok) return { success: false, error: `Pipedrive error (${res.status}): ${await res.text()}` };
      const data = await res.json();
      return { success: data.success, data: data.data };
    }

    default:
      return { success: false, error: `Pipedrive action "${action}" not supported` };
  }
}
