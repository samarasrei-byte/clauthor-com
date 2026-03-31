/**
 * SendGrid (Gmail) Integration Handler
 * Actions: send-email, read-inbox, search-emails
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.sendgrid.com/v3";

export async function handleSendgrid(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.api_key;
  if (!apiKey) return { success: false, error: "Missing SendGrid API key" };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  switch (action) {
    case "send-email": {
      const { to, subject, body, from_email } = params;
      if (!to || !subject || !body) {
        return { success: false, error: "Missing required fields: to, subject, body" };
      }
      const fromEmail = from_email || creds.from_email || "noreply@clauthor.com";

      const res = await fetch(`${BASE}/mail/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail },
          subject,
          content: [{ type: "text/html", value: body }],
        }),
      });

      if (res.status === 202 || res.status === 200) {
        return { success: true, data: { message: "Email sent successfully", to, subject } };
      }
      const err = await res.text();
      return { success: false, error: `SendGrid error (${res.status}): ${err}` };
    }

    case "draft-reply":
    case "summarize-thread": {
      // These are AI-assisted actions — return guidance for the AI planner
      return {
        success: true,
        data: {
          action_type: "ai_assisted",
          message: `Action "${action}" should be handled by the AI planner using email context.`,
        },
      };
    }

    default:
      return { success: false, error: `SendGrid action "${action}" not supported` };
  }
}
