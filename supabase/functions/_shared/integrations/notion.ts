/**
 * Notion Integration Handler
 * Actions: search, fetch, create-pages, update-page
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

export async function handleNotion(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.integration_token || creds.api_key;
  if (!token) return { success: false, error: "Missing Notion integration token" };

  const headers = notionHeaders(token);

  switch (action) {
    case "search": {
      const res = await fetch(`${BASE}/search`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: params.query || "",
          page_size: params.limit || 10,
          ...(params.filter ? { filter: params.filter } : {}),
        }),
      });
      if (!res.ok) return { success: false, error: `Notion error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "fetch": {
      const { page_id, block_id } = params;
      const id = page_id || block_id;
      if (!id) return { success: false, error: "page_id or block_id required" };

      const endpoint = block_id ? `${BASE}/blocks/${id}` : `${BASE}/pages/${id}`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) return { success: false, error: `Notion error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-pages": {
      const { parent_id, database_id, title, content, properties, data } = params;
      const pid = database_id || parent_id;
      if (!pid) return { success: false, error: "parent_id or database_id required" };

      const parentObj = database_id ? { database_id } : { page_id: pid };
      const body: any = {
        parent: parentObj,
        properties: data || properties || {
          title: { title: [{ text: { content: title || "Untitled" } }] },
        },
      };

      if (content) {
        body.children = [
          {
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [{ type: "text", text: { content } }] },
          },
        ];
      }

      const res = await fetch(`${BASE}/pages`, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) return { success: false, error: `Notion error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "update-page": {
      const { page_id, properties, archived } = params;
      if (!page_id) return { success: false, error: "page_id required" };

      const body: any = {};
      if (properties) body.properties = properties;
      if (archived !== undefined) body.archived = archived;

      const res = await fetch(`${BASE}/pages/${page_id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
      if (!res.ok) return { success: false, error: `Notion error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-comment": {
      const { page_id, text } = params;
      if (!page_id || !text) return { success: false, error: "page_id and text required" };

      const res = await fetch(`${BASE}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { page_id },
          rich_text: [{ type: "text", text: { content: text } }],
        }),
      });
      if (!res.ok) return { success: false, error: `Notion error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `Notion action "${action}" not supported` };
  }
}
