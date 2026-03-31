/**
 * Slack Integration Handler
 * Actions: send-message, list-channels, search-messages
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://slack.com/api";

export async function handleSlack(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.bot_token || creds.webhook_url;
  if (!token) return { success: false, error: "Missing Slack bot_token or webhook_url" };

  switch (action) {
    case "send-message": {
      const { channel, text, blocks } = params;
      if (!text && !blocks) return { success: false, error: "text or blocks required" };

      // If webhook URL, use simple POST
      if (token.startsWith("https://hooks.slack.com")) {
        const res = await fetch(token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, channel, blocks }),
        });
        return res.ok
          ? { success: true, data: { message: "Message sent via webhook" } }
          : { success: false, error: `Slack webhook error (${res.status})` };
      }

      // Bot token
      const res = await fetch(`${BASE}/chat.postMessage`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channel: channel || "#general", text, blocks }),
      });
      const data = await res.json();
      return data.ok
        ? { success: true, data }
        : { success: false, error: `Slack API error: ${data.error}` };
    }

    case "list-channels": {
      if (token.startsWith("https://")) return { success: false, error: "list-channels requires a bot token" };
      const res = await fetch(`${BASE}/conversations.list?limit=100&types=public_channel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.ok
        ? { success: true, data: { channels: data.channels?.map((c: any) => ({ id: c.id, name: c.name })) } }
        : { success: false, error: `Slack API error: ${data.error}` };
    }

    case "react-message": {
      if (token.startsWith("https://")) return { success: false, error: "react-message requires a bot token" };
      const { channel, timestamp, emoji } = params;
      if (!channel || !timestamp || !emoji) return { success: false, error: "channel, timestamp, emoji required" };

      const res = await fetch(`${BASE}/reactions.add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channel, timestamp, name: emoji }),
      });
      const data = await res.json();
      return data.ok ? { success: true, data } : { success: false, error: `Slack error: ${data.error}` };
    }

    default:
      return { success: false, error: `Slack action "${action}" not supported` };
  }
}
