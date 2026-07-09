// ─── Tool → external integration mapping for agent-chat ───
// Bridges internal tool names to the Integration Router (SendGrid, HubSpot,
// Trello, Notion, Google Sheets, WhatsApp, Slack, Meta Ads, Pipedrive).
// Kept as pure data + pure functions so it can be unit-tested and swapped
// without touching the request handler.

import {
  executeIntegration,
  getDecryptedCredentials,
  type IntegrationResponse,
} from "../_shared/integration-router.ts";

export interface ToolIntegrationMapping {
  integration_key: string;
  action: string;
  altKey?: string;
  altAction?: string;
}

export const TOOL_INTEGRATION_MAP: Record<string, ToolIntegrationMapping> = {
  send_email:        { integration_key: "sendgrid",      action: "send-email" },
  search_leads:      { integration_key: "hubspot",       action: "get-contacts" },
  create_task:       { integration_key: "trello",        action: "create-card", altKey: "notion", altAction: "create-pages" },
  schedule_meeting:  { integration_key: "google_sheets", action: "append-rows" },
  search_crm:        { integration_key: "hubspot",       action: "get-contacts", altKey: "pipedrive", altAction: "get-deals" },
  create_crm_record: { integration_key: "hubspot",       action: "create-contact", altKey: "pipedrive", altAction: "create-deal" },
  update_crm_record: { integration_key: "hubspot",       action: "update-contact", altKey: "pipedrive", altAction: "update-deal" },
  send_message:      { integration_key: "whatsapp",      action: "send-message", altKey: "slack", altAction: "send-message" },
  read_spreadsheet:  { integration_key: "google_sheets", action: "read-cells" },
  write_spreadsheet: { integration_key: "google_sheets", action: "write-cells" },
  manage_campaign:   { integration_key: "meta_ads",      action: "get-insights" },
  manage_project:    { integration_key: "trello",        action: "create-card", altKey: "notion", altAction: "create-pages" },
  send_bulk_message: { integration_key: "sendgrid",      action: "send-email", altKey: "whatsapp", altAction: "send-message" },
  // analyze_data, generate_report, delegate_to_agent, search_web - no external integration
};

/**
 * Convert a tool call payload into the shape expected by a specific
 * integration+action combo. Pure — no I/O, no side effects.
 */
export function mapToolArgsToIntegrationParams(
  toolName: string,
  args: any,
  integrationKey: string,
  action: string,
): Record<string, any> {
  // Tool-specific mappings first
  switch (toolName) {
    case "send_message":
      if (integrationKey === "whatsapp") return { to: args.to, text: args.message };
      if (integrationKey === "slack") return { channel: args.to, text: args.message };
      return { to: args.to, text: args.message };
    case "search_crm":
      return { limit: args.limit || 10, query: args.query };
    case "create_crm_record":
      if (integrationKey === "hubspot") {
        if (args.type === "contact") return { email: args.data?.email, firstname: args.data?.firstname || args.data?.name, lastname: args.data?.lastname, ...args.data };
        return args.data || {};
      }
      return args.data || {};
    case "update_crm_record":
      return { id: args.record_id, ...args.data };
    case "read_spreadsheet":
      return { spreadsheet_id: args.spreadsheet_id, range: args.range };
    case "write_spreadsheet":
      return { spreadsheet_id: args.spreadsheet_id, range: args.range, values: args.values };
    case "manage_campaign":
      if (action === "get-insights") return { campaign_id: args.campaign_data?.campaign_id, ...args.campaign_data };
      return args.campaign_data || {};
    case "manage_project":
      if (integrationKey === "trello") return { list_id: args.data?.list_id, name: args.data?.title, desc: args.data?.description };
      if (integrationKey === "notion") return { parent_id: args.data?.parent_id, title: args.data?.title, content: args.data?.description };
      return args.data || {};
    case "send_bulk_message":
      // Will be called once per recipient in executeTool
      return args;
  }

  // Generic integration-level mappings
  switch (`${integrationKey}/${action}`) {
    case "sendgrid/send-email":
      return { to: args.to, subject: args.subject, body: args.body };
    case "hubspot/get-contacts":
      return { limit: args.max_results || 10 };
    case "trello/create-card":
      return { list_id: args.list_id, name: args.title, desc: args.description };
    case "notion/create-pages":
      return { parent_id: args.parent_id, title: args.title, content: args.description };
    case "google_sheets/append-rows":
      return {
        spreadsheet_id: args.spreadsheet_id,
        values: [[args.title, args.date, args.time, args.duration_minutes?.toString() || "30", (args.participants || []).join(", ")]],
      };
    default:
      return args;
  }
}

/**
 * Attempt to route a tool call through a configured external integration.
 * Returns null if no credentials are configured for either the primary or
 * alternate integration — the caller should then fall back to the built-in
 * simulation.
 */
export async function tryExternalIntegration(
  toolName: string,
  args: any,
  adminClient: any,
  userId: string,
  agentId: string,
): Promise<IntegrationResponse | null> {
  const mapping = TOOL_INTEGRATION_MAP[toolName];
  if (!mapping) return null;

  let creds = await getDecryptedCredentials(adminClient, userId, agentId, mapping.integration_key);
  let key = mapping.integration_key;
  let action = mapping.action;

  if (!creds && mapping.altKey) {
    creds = await getDecryptedCredentials(adminClient, userId, agentId, mapping.altKey);
    if (creds) {
      key = mapping.altKey;
      action = mapping.altAction || mapping.action;
    }
  }

  if (!creds) return null;

  const params = mapToolArgsToIntegrationParams(toolName, args, key, action);

  console.log(`[IntegrationBridge] Routing ${toolName} → ${key}/${action}`);
  return await executeIntegration({ integration_key: key, action, params, credentials: creds });
}
