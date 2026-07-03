/**
 * Cobanky Integration Handler
 * Docs: https://cobanky.com.br/api-docs
 * Actions:
 *   - health
 *   - create-proposal   { title, client_name, client_email, total_value, ... }
 *   - get-proposal      { id }
 *   - create-contract   { ...contract payload }
 *   - get-contract      { id }
 *   - send-contract     { id }
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE_URL = "https://trlpecrchszqouflukwa.supabase.co/functions/v1/api-v1";

async function call(
  method: string,
  path: string,
  apiKey: string,
  body?: unknown,
): Promise<IntegrationResponse> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("json") ? await res.json() : await res.text();
    return {
      success: res.ok,
      data: { status: res.status, body: data },
      ...(res.ok ? {} : { error: (data as any)?.error || `HTTP ${res.status}` }),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function handleCobanky(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.api_key;
  if (!apiKey && action !== "health") {
    return { success: false, error: "Missing api_key (ck_live_... from Cobanky /developers)" };
  }

  switch (action) {
    case "health":
      return call("GET", "/v1/health", apiKey || "");

    case "create-proposal": {
      const { title, client_name, client_email, total_value, ...rest } = params;
      if (!title || !client_name || !client_email || total_value == null) {
        return { success: false, error: "title, client_name, client_email, total_value required" };
      }
      return call("POST", "/v1/proposals", apiKey, {
        title, client_name, client_email, total_value, ...rest,
      });
    }

    case "get-proposal": {
      if (!params.id) return { success: false, error: "id required" };
      return call("GET", `/v1/proposals/${encodeURIComponent(params.id)}`, apiKey);
    }

    case "create-contract":
      return call("POST", "/v1/contracts", apiKey, params);

    case "get-contract": {
      if (!params.id) return { success: false, error: "id required" };
      return call("GET", `/v1/contracts/${encodeURIComponent(params.id)}`, apiKey);
    }

    case "send-contract": {
      if (!params.id) return { success: false, error: "id required" };
      return call("POST", `/v1/contracts/${encodeURIComponent(params.id)}/send`, apiKey, params.body || {});
    }

    default:
      return { success: false, error: `Unknown Cobanky action: ${action}` };
  }
}
