/**
 * Integration Router — Routes agent tool calls to real external APIs.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleSendgrid } from "./integrations/sendgrid.ts";
import { handleHubspot } from "./integrations/hubspot.ts";
import { handleSlack } from "./integrations/slack.ts";
import { handleNotion } from "./integrations/notion.ts";
import { handleLinkedin } from "./integrations/linkedin.ts";
import { handleGoogleSheets } from "./integrations/google-sheets.ts";
import { handleWhatsapp } from "./integrations/whatsapp.ts";
import { handleMetaAds } from "./integrations/meta-ads.ts";
import { handleInstagram } from "./integrations/instagram.ts";
import { handlePipedrive } from "./integrations/pipedrive.ts";
import { handleTrello } from "./integrations/trello.ts";
import { handleCustomApi } from "./integrations/custom-api.ts";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface IntegrationRequest {
  integration_key: string;
  action: string;
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

// ── Handler type ────────────────────────────────────────────────────────────

type IntegrationHandler = (
  action: string,
  params: Record<string, any>,
  credentials: Record<string, string>,
) => Promise<IntegrationResponse>;

// ── Handler registry ────────────────────────────────────────────────────────

const handlers: Record<string, IntegrationHandler> = {
  gmail:         handleSendgrid,
  sendgrid:      handleSendgrid,
  hubspot:       handleHubspot,
  slack:         handleSlack,
  linkedin:      handleLinkedin,
  google_sheets: handleGoogleSheets,
  notion:        handleNotion,
  pipedrive:     handlePipedrive,
  trello:        handleTrello,
  instagram:     handleInstagram,
  meta_ads:      handleMetaAds,
  whatsapp:      handleWhatsapp,
  custom_api:    handleCustomApi,
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

// ── Available integrations list ─────────────────────────────────────────────

export function getAvailableIntegrations(): string[] {
  return Object.keys(handlers);
}
