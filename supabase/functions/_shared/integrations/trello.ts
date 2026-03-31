/**
 * Trello Integration Handler
 * Actions: create-card, move-card, list-boards, add-comment, archive-card
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.trello.com/1";

export async function handleTrello(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.api_key;
  const token = creds.token;
  if (!apiKey || !token) return { success: false, error: "Missing Trello api_key and token" };

  const auth = `key=${apiKey}&token=${token}`;
  const headers = { "Content-Type": "application/json" };

  switch (action) {
    case "list-boards": {
      const res = await fetch(`${BASE}/members/me/boards?fields=name,url,closed&${auth}`);
      if (!res.ok) return { success: false, error: `Trello error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-card": {
      const { list_id, name, desc, due, labels } = params;
      if (!list_id || !name) return { success: false, error: "list_id and name required" };

      const body: any = { idList: list_id, name };
      if (desc) body.desc = desc;
      if (due) body.due = due;
      if (labels) body.idLabels = labels;

      const res = await fetch(`${BASE}/cards?${auth}`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      if (!res.ok) return { success: false, error: `Trello error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "move-card": {
      const { card_id, list_id } = params;
      if (!card_id || !list_id) return { success: false, error: "card_id and list_id required" };

      const res = await fetch(`${BASE}/cards/${card_id}?${auth}`, {
        method: "PUT", headers, body: JSON.stringify({ idList: list_id }),
      });
      if (!res.ok) return { success: false, error: `Trello error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "add-comment": {
      const { card_id, text } = params;
      if (!card_id || !text) return { success: false, error: "card_id and text required" };

      const res = await fetch(`${BASE}/cards/${card_id}/actions/comments?text=${encodeURIComponent(text)}&${auth}`, {
        method: "POST",
      });
      if (!res.ok) return { success: false, error: `Trello error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "archive-card": {
      const { card_id } = params;
      if (!card_id) return { success: false, error: "card_id required" };

      const res = await fetch(`${BASE}/cards/${card_id}?${auth}`, {
        method: "PUT", headers, body: JSON.stringify({ closed: true }),
      });
      if (!res.ok) return { success: false, error: `Trello error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `Trello action "${action}" not supported` };
  }
}
