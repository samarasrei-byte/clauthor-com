/**
 * Shared AI Gateway with fallback support.
 * Primary: Lovable AI Gateway
 * Fallback: EXTERNAL_AI_ENDPOINT (user-provided)
 */

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function fetchAI(
  body: Record<string, any>,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const EXTERNAL_AI_ENDPOINT = Deno.env.get("EXTERNAL_AI_ENDPOINT");

  // Try Lovable AI Gateway first
  if (LOVABLE_API_KEY) {
    try {
      const response = await fetch(LOVABLE_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      });

      // Return directly for success, rate limit, or payment errors (don't fallback)
      if (response.ok || response.status === 429 || response.status === 402) {
        return response;
      }

      console.warn(`[AI Gateway] Lovable failed (${response.status}), trying external fallback...`);
    } catch (e) {
      console.warn("[AI Gateway] Lovable error, trying external fallback...", e);
    }
  }

  // Fallback to external endpoint
  if (EXTERNAL_AI_ENDPOINT) {
    console.log("[AI Gateway] Using external fallback endpoint");
    const response = await fetch(EXTERNAL_AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response;
  }

  throw new Error("No AI endpoint available. Configure LOVABLE_API_KEY or EXTERNAL_AI_ENDPOINT.");
}
