/**
 * WhatsApp Business Integration Handler (Meta Cloud API)
 * Actions: send-message, send-template, send-media
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://graph.facebook.com/v19.0";

export async function handleWhatsapp(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token;
  const phoneId = creds.phone_id;
  if (!token) return { success: false, error: "Missing WhatsApp access token" };
  if (!phoneId) return { success: false, error: "Missing WhatsApp Phone Number ID" };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const url = `${BASE}/${phoneId}/messages`;

  switch (action) {
    case "send-message": {
      const { to, text } = params;
      if (!to || !text) return { success: false, error: "to and text required" };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });
      if (!res.ok) return { success: false, error: `WhatsApp error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "send-template": {
      const { to, template_name, language, components } = params;
      if (!to || !template_name) return { success: false, error: "to and template_name required" };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template_name,
            language: { code: language || "pt_BR" },
            components: components || [],
          },
        }),
      });
      if (!res.ok) return { success: false, error: `WhatsApp error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "send-media": {
      const { to, media_type, media_url, caption } = params;
      if (!to || !media_type || !media_url) {
        return { success: false, error: "to, media_type, and media_url required" };
      }

      const body: any = {
        messaging_product: "whatsapp",
        to,
        type: media_type, // image, video, document, audio
        [media_type]: { link: media_url },
      };
      if (caption && ["image", "video", "document"].includes(media_type)) {
        body[media_type].caption = caption;
      }

      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) return { success: false, error: `WhatsApp error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `WhatsApp action "${action}" not supported` };
  }
}
