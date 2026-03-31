/**
 * Custom API Integration Handler
 * Actions: http-get, http-post, http-put, http-delete
 */

import type { IntegrationResponse } from "../integration-router.ts";

export async function handleCustomApi(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.api_key;
  const baseUrl = creds.base_url;

  const { url, path, headers: customHeaders, body, query } = params;

  const targetUrl = url || (baseUrl ? `${baseUrl.replace(/\/$/, "")}${path || ""}` : null);
  if (!targetUrl) return { success: false, error: "url or base_url + path required" };

  // Build URL with query params
  const finalUrl = new URL(targetUrl);
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      finalUrl.searchParams.set(k, String(v));
    }
  }

  // Build headers
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders || {}),
  };
  if (apiKey) {
    reqHeaders["Authorization"] = `Bearer ${apiKey}`;
  }

  const method = action.replace("http-", "").toUpperCase();
  if (!["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return { success: false, error: `Unsupported HTTP method: ${method}` };
  }

  try {
    const res = await fetch(finalUrl.toString(), {
      method,
      headers: reqHeaders,
      ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("json") ? await res.json() : await res.text();

    return {
      success: res.ok,
      data: { status: res.status, body: data },
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}
