/**
 * HubSpot CRM Integration Handler
 * Actions: get-contacts, create-contact, update-deal, search-records, get-pipeline, create-task
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.hubapi.com";

export async function handleHubspot(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.api_key;
  if (!token) return { success: false, error: "Missing HubSpot API token" };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  switch (action) {
    case "get-contacts": {
      const limit = params.limit || 10;
      const res = await fetch(`${BASE}/crm/v3/objects/contacts?limit=${limit}`, { headers });
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-contact": {
      const { email, firstname, lastname, phone, company } = params;
      if (!email) return { success: false, error: "Email is required to create a contact" };

      const properties: Record<string, string> = { email };
      if (firstname) properties.firstname = firstname;
      if (lastname) properties.lastname = lastname;
      if (phone) properties.phone = phone;
      if (company) properties.company = company;

      const res = await fetch(`${BASE}/crm/v3/objects/contacts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties }),
      });
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "update-deal": {
      const { deal_id, properties } = params;
      if (!deal_id) return { success: false, error: "deal_id is required" };

      const res = await fetch(`${BASE}/crm/v3/objects/deals/${deal_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ properties: properties || {} }),
      });
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "search-records": {
      const { object_type, query } = params;
      const objectType = object_type || "contacts";

      const res = await fetch(`${BASE}/crm/v3/objects/${objectType}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: query || "",
          limit: params.limit || 10,
        }),
      });
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "get-pipeline": {
      const objectType = params.object_type || "deals";
      const res = await fetch(`${BASE}/crm/v3/pipelines/${objectType}`, { headers });
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
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
      if (!res.ok) return { success: false, error: `HubSpot error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `HubSpot action "${action}" not supported` };
  }
}
