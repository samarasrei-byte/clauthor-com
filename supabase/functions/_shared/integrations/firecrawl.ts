import { IntegrationResponse } from "../integration-router.ts";

export async function handleFirecrawl(
  action: string,
  params: Record<string, any>,
  creds: Record<string, string>,
): Promise<IntegrationResponse> {
  const apiKey = creds.api_key;
  if (!apiKey) return { success: false, error: "Missing Firecrawl api_key" };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    switch (action) {
      case "scrape": {
        if (!params.url) return { success: false, error: "url is required for scrape" };
        const res = await fetch("https://api.firecrawl.dev/v0/scrape", {
          method: "POST",
          headers,
          body: JSON.stringify({ url: params.url }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || `Firecrawl ${res.status}` };
        return { success: true, data };
      }

      case "search": {
        if (!params.query) return { success: false, error: "query is required for search" };
        const res = await fetch("https://api.firecrawl.dev/v0/search", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: params.query,
            limit: params.max_results || 5,
          }),
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error || `Firecrawl ${res.status}` };
        return { success: true, data };
      }

      default:
        return { success: false, error: `Unknown Firecrawl action: ${action}` };
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Firecrawl request failed" };
  }
}
