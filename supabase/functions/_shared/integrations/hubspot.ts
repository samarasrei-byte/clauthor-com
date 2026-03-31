/**
 * HubSpot CRM Integration Handler
 * Actions: get-contacts, create-contact, update-deal, search-records, get-pipeline, create-task
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.hubapi.com";

function hubspotError(status: number, body: string): IntegrationResponse {
  if (status === 401) return { success: false, error: "Token HubSpot inválido ou expirado. Reconfigure suas credenciais." };
  if (status === 429) return { success: false, error: "Rate limit HubSpot atingido. Tente novamente em alguns minutos." };
  return { success: false, error: `HubSpot error (${status}): ${body}` };
}

export async function handleHubspot(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token || creds.api_key;
  if (!token) return { success: false, error: "Missing HubSpot access_token" };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  switch (action) {
    case "get-contacts": {
      if (params.query) {
        const res = await fetch(`${BASE}/crm/v3/objects/contacts/search`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: params.query, limit: params.limit || 10 }),
        });
        if (!res.ok) return hubspotError(res.status, await res.text());
        return { success: true, data: await res.json() };
      }
      const limit = params.limit || 10;
      const res = await fetch(
        `${BASE}/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company`,
        { headers },
      );
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "create-contact": {
      const properties = params.data || {};
      if (params.email) properties.email = params.email;
      if (params.firstname) properties.firstname = params.firstname;
      if (params.lastname) properties.lastname = params.lastname;
      if (params.phone) properties.phone = params.phone;
      if (params.company) properties.company = params.company;

      if (!properties.email) return { success: false, error: "Email is required to create a contact" };

      const res = await fetch(`${BASE}/crm/v3/objects/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "get-deals": {
      const limit = params.limit || 10;
      const res = await fetch(`${BASE}/crm/v3/objects/deals?limit=${limit}`, { headers });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "create-deal": {
      const properties = params.data || {};
      if (!properties.dealname) return { success: false, error: "dealname is required to create a deal" };

      const res = await fetch(`${BASE}/crm/v3/objects/deals`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "update-deal": {
      const { deal_id } = params;
      if (!deal_id) return { success: false, error: "deal_id is required" };
      const properties = params.data || params.properties || {};

      const res = await fetch(`${BASE}/crm/v3/objects/deals/${deal_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "search-records": {
      const objectType = params.object_type || "contacts";
      const res = await fetch(`${BASE}/crm/v3/objects/${objectType}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: params.query || "", limit: params.limit || 10 }),
      });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "get-pipeline": {
      const objectType = params.object_type || "deals";
      const res = await fetch(`${BASE}/crm/v3/pipelines/${objectType}`, { headers });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    case "create-task": {
      const { subject, body, due_date, owner_id } = params;
      const properties: Record<string, string> = {
        hs_task_subject: subject || "New Task",
        hs_task_body: body || "",
        hs_task_status: "NOT_STARTED",
      };
      if (due_date) properties.hs_timestamp = new Date(due_date).getTime().toString();
      if (owner_id) properties.hubspot_owner_id = owner_id;

      const res = await fetch(`${BASE}/crm/v3/objects/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return hubspotError(res.status, await res.text());
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `HubSpot action "${action}" not supported` };
  }
}
