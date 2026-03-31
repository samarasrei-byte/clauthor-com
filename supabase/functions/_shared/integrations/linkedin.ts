/**
 * LinkedIn Integration Handler
 * Actions: post-content, get-analytics, search-profiles (limited by API)
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://api.linkedin.com/v2";

export async function handleLinkedin(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token;
  if (!token) return { success: false, error: "Missing LinkedIn access token" };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };

  switch (action) {
    case "post-content": {
      const { text, visibility } = params;
      if (!text) return { success: false, error: "text is required" };

      // First get the user's URN
      const meRes = await fetch(`${BASE}/userinfo`, { headers });
      if (!meRes.ok) return { success: false, error: `LinkedIn profile error (${meRes.status}): ${await meRes.text()}` };
      const me = await meRes.json();
      const authorUrn = `urn:li:person:${me.sub}`;

      const res = await fetch(`${BASE}/ugcPosts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility || "PUBLIC",
          },
        }),
      });

      if (!res.ok) return { success: false, error: `LinkedIn post error (${res.status}): ${await res.text()}` };
      return { success: true, data: { message: "Post published successfully", id: res.headers.get("x-restli-id") } };
    }

    case "get-analytics": {
      // Get basic profile stats
      const res = await fetch(`${BASE}/userinfo`, { headers });
      if (!res.ok) return { success: false, error: `LinkedIn error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "search-profiles":
    case "search-companies":
    case "send-connection":
    case "send-message":
      return { success: false, error: `LinkedIn "${action}" requires LinkedIn Marketing/Sales Navigator API access` };

    default:
      return { success: false, error: `LinkedIn action "${action}" not supported` };
  }
}
