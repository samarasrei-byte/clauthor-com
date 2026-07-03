/**
 * DocuSign Integration Handler (eSignature REST API v2.1)
 * Docs: https://developers.docusign.com/docs/esign-rest-api/
 * Requires OAuth access token + account_id + base_uri (from userinfo).
 */
import type { IntegrationResponse } from "../integration-router.ts";

async function call(method: string, path: string, token: string, base: string, body?: unknown): Promise<IntegrationResponse> {
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, data: { status: res.status, body: data }, ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function handleDocusign(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token;
  const accountId = creds.account_id;
  const base = (creds.base_uri || "https://demo.docusign.net/restapi").replace(/\/$/, "");
  if (!token || !accountId) return { success: false, error: "Missing access_token or account_id" };

  const acct = `/v2.1/accounts/${encodeURIComponent(accountId)}`;

  switch (action) {
    case "create-envelope":
      return call("POST", `${acct}/envelopes`, token, base, params);
    case "send-envelope":
      return call("POST", `${acct}/envelopes`, token, base, { ...params, status: "sent" });
    case "get-envelope":
      if (!params.envelope_id) return { success: false, error: "envelope_id required" };
      return call("GET", `${acct}/envelopes/${encodeURIComponent(params.envelope_id)}`, token, base);
    case "list-recipients":
      if (!params.envelope_id) return { success: false, error: "envelope_id required" };
      return call("GET", `${acct}/envelopes/${encodeURIComponent(params.envelope_id)}/recipients`, token, base);
    case "void-envelope":
      if (!params.envelope_id) return { success: false, error: "envelope_id required" };
      return call("PUT", `${acct}/envelopes/${encodeURIComponent(params.envelope_id)}`, token, base, {
        status: "voided",
        voidedReason: params.reason || "Cancelled by user",
      });
    default:
      return { success: false, error: `Unknown DocuSign action: ${action}` };
  }
}
