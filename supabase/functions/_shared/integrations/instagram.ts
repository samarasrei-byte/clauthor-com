/**
 * Instagram Integration Handler (via Meta Graph API)
 * Actions: reply-dm, reply-comment, get-mentions, get-insights
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://graph.facebook.com/v19.0";

export async function handleInstagram(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token;
  if (!token) return { success: false, error: "Missing Instagram access token" };
  const igAccountId = creds.instagram_account_id;

  const authParam = `access_token=${token}`;

  switch (action) {
    case "reply-comment": {
      const { comment_id, message } = params;
      if (!comment_id || !message) return { success: false, error: "comment_id and message required" };

      const res = await fetch(`${BASE}/${comment_id}/replies?${authParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) return { success: false, error: `Instagram error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "reply-dm": {
      const { recipient_id, message } = params;
      if (!recipient_id || !message) return { success: false, error: "recipient_id and message required" };
      if (!igAccountId) return { success: false, error: "instagram_account_id required for DMs" };

      const res = await fetch(`${BASE}/${igAccountId}/messages?${authParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: { id: recipient_id }, message: { text: message } }),
      });
      if (!res.ok) return { success: false, error: `Instagram error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "get-mentions": {
      if (!igAccountId) return { success: false, error: "instagram_account_id required" };
      const url = `${BASE}/${igAccountId}/tags?fields=id,caption,media_type,timestamp,permalink&${authParam}`;
      const res = await fetch(url);
      if (!res.ok) return { success: false, error: `Instagram error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "get-insights": {
      if (!igAccountId) return { success: false, error: "instagram_account_id required" };
      const metrics = params.metrics || "impressions,reach,profile_views";
      const period = params.period || "day";
      const url = `${BASE}/${igAccountId}/insights?metric=${metrics}&period=${period}&${authParam}`;
      const res = await fetch(url);
      if (!res.ok) return { success: false, error: `Instagram error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `Instagram action "${action}" not supported` };
  }
}
