/**
 * Integration Router — Routes agent tool calls to real external APIs.
 *
 * Each integration_key maps to a handler that performs the actual HTTP call.
 * Handlers start as stubs and are implemented incrementally.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface IntegrationRequest {
  integration_key: string;   // e.g. "hubspot", "gmail", "slack"
  action: string;            // e.g. "get-contacts", "send-email"
  params: Record<string, any>;
  credentials: Record<string, string>;
}

export interface IntegrationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// ── Timeout helper ──────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Integration timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// ── Stub handler factory ────────────────────────────────────────────────────

const stub = (name: string) =>
  async (_action: string, _params: Record<string, any>, _creds: Record<string, string>): Promise<IntegrationResponse> => ({
    success: false,
    error: `Integration "${name}" not yet implemented`,
  });

// ── Handler type ────────────────────────────────────────────────────────────

type IntegrationHandler = (
  action: string,
  params: Record<string, any>,
  credentials: Record<string, string>,
) => Promise<IntegrationResponse>;

// ── Handler registry ────────────────────────────────────────────────────────

const handlers: Record<string, IntegrationHandler> = {
  gmail:         stub("gmail"),
  hubspot:       stub("hubspot"),
  slack:         stub("slack"),
  linkedin:      stub("linkedin"),
  google_sheets: stub("google_sheets"),
  notion:        stub("notion"),
  pipedrive:     stub("pipedrive"),
  trello:        stub("trello"),
  instagram:     stub("instagram"),
  meta_ads:      stub("meta_ads"),
  whatsapp:      stub("whatsapp"),
};

// ── Main router ─────────────────────────────────────────────────────────────

export async function executeIntegration(
  request: IntegrationRequest,
): Promise<IntegrationResponse> {
  const { integration_key, action, params, credentials } = request;

  const handler = handlers[integration_key];
  if (!handler) {
    return { success: false, error: `Unknown integration: ${integration_key}` };
  }

  try {
    return await withTimeout(handler(action, params, credentials), 30_000);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown execution error";
    // Log without credentials
    console.error(`[IntegrationRouter] ${integration_key}/${action} failed:`, message);
    return { success: false, error: message };
  }
}

// ── Credential helper ───────────────────────────────────────────────────────

export async function getDecryptedCredentials(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  agentId: string,
  integrationKey: string,
): Promise<Record<string, string> | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("agent_credentials")
      .select("credential_key, credential_value")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .eq("integration_name", integrationKey);

    if (error || !data || data.length === 0) return null;

    const creds: Record<string, string> = {};
    for (const row of data) {
      creds[row.credential_key] = row.credential_value;
    }
    return creds;
  } catch (err) {
    console.error("[IntegrationRouter] Failed to fetch credentials:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}
