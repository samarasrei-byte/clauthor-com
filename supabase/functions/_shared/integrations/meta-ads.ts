/**
 * Meta Ads Integration Handler
 * Actions: get-insights, create-campaign, get-audiences, manage-adsets
 */

import type { IntegrationResponse } from "../integration-router.ts";

const BASE = "https://graph.facebook.com/v19.0";

export async function handleMetaAds(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const token = creds.access_token;
  const adAccountId = creds.ad_account_id;
  if (!token) return { success: false, error: "Missing Meta Ads access token" };
  if (!adAccountId) return { success: false, error: "Missing Ad Account ID" };

  const headers = { "Content-Type": "application/json" };
  const authParam = `access_token=${token}`;

  switch (action) {
    case "get-insights": {
      const { date_preset, level, fields } = params;
      const insightFields = fields || "impressions,clicks,spend,cpc,cpm,ctr,actions";
      const preset = date_preset || "last_7d";
      const insightLevel = level || "account";

      const url = `${BASE}/${adAccountId}/insights?fields=${insightFields}&date_preset=${preset}&level=${insightLevel}&${authParam}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { success: false, error: `Meta Ads error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "create-campaign": {
      const { name, objective, status, special_ad_categories } = params;
      if (!name || !objective) return { success: false, error: "name and objective required" };

      const res = await fetch(`${BASE}/${adAccountId}/campaigns?${authParam}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          objective, // e.g. OUTCOME_LEADS, OUTCOME_SALES
          status: status || "PAUSED",
          special_ad_categories: special_ad_categories || [],
        }),
      });
      if (!res.ok) return { success: false, error: `Meta Ads error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "get-audiences": {
      const url = `${BASE}/${adAccountId}/customaudiences?fields=name,approximate_count,subtype&${authParam}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { success: false, error: `Meta Ads error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    case "manage-adsets": {
      const { adset_id, updates } = params;
      if (adset_id && updates) {
        // Update existing adset
        const res = await fetch(`${BASE}/${adset_id}?${authParam}`, {
          method: "POST",
          headers,
          body: JSON.stringify(updates),
        });
        if (!res.ok) return { success: false, error: `Meta Ads error (${res.status}): ${await res.text()}` };
        return { success: true, data: await res.json() };
      }
      // List adsets
      const url = `${BASE}/${adAccountId}/adsets?fields=name,status,daily_budget,targeting&${authParam}`;
      const res = await fetch(url, { headers });
      if (!res.ok) return { success: false, error: `Meta Ads error (${res.status}): ${await res.text()}` };
      return { success: true, data: await res.json() };
    }

    default:
      return { success: false, error: `Meta Ads action "${action}" not supported` };
  }
}
