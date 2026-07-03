/**
 * ClickSign Integration Handler
 * Docs: https://developers.clicksign.com
 * Base: https://app.clicksign.com/api/v1 (or sandbox)
 */
import type { IntegrationResponse } from "../integration-router.ts";

async function call(method: string, path: string, token: string, base: string, body?: unknown): Promise<IntegrationResponse> {
  try {
    const url = `${base.replace(/\/$/, "")}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, data: { status: res.status, body: data }, ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function handleClicksign(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token || creds.api_key;
  const base = creds.base_url || "https://app.clicksign.com/api/v1";
  if (!token) return { success: false, error: "Missing access_token" };

  switch (action) {
    case "create-document":
      return call("POST", "/documents", token, base, { document: params });
    case "get-document":
      if (!params.key) return { success: false, error: "key required" };
      return call("GET", `/documents/${encodeURIComponent(params.key)}`, token, base);
    case "add-signer":
      return call("POST", "/signers", token, base, { signer: params });
    case "add-signer-to-document":
      return call("POST", "/lists", token, base, { list: params });
    case "send-notifications":
      if (!params.request_signature_key) return { success: false, error: "request_signature_key required" };
      return call("POST", "/notifications", token, base, { request_signature_key: params.request_signature_key, message: params.message });
    case "cancel-document":
      if (!params.key) return { success: false, error: "key required" };
      return call("PATCH", `/documents/${encodeURIComponent(params.key)}/cancel`, token, base);
    default:
      return { success: false, error: `Unknown ClickSign action: ${action}` };
  }
}
