/**
 * Shared AI Gateway with fallback, retry, and timeout support.
 * Primary: Lovable AI Gateway
 * Fallback: EXTERNAL_AI_ENDPOINT (user-provided)
 */

import { withRetry, safeFetch, circuitBreaker } from "./resilience.ts";

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_TIMEOUT_MS = 30000; // 30s timeout per request
const MAX_AI_RETRIES = 2;

export async function fetchAI(
  body: Record<string, any>,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const EXTERNAL_AI_ENDPOINT = Deno.env.get("EXTERNAL_AI_ENDPOINT");

  const cb = circuitBreaker("ai-gateway", 5, 60_000);

  // Try Lovable AI Gateway first (with retry + timeout)
  if (LOVABLE_API_KEY && !cb.isOpen) {
    try {
      const response = await withRetry(
        async () => {
          const res = await safeFetch(LOVABLE_GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
              ...extraHeaders,
            },
            body: JSON.stringify(body),
            timeoutMs: AI_TIMEOUT_MS,
          });

          // Don't retry on auth/payment/rate-limit errors
          if (res.status === 429 || res.status === 402) {
            return res;
          }

          // Retry on server errors
          if (!res.ok && res.status >= 500) {
            const err: any = new Error(`AI Gateway ${res.status}`);
            err.status = res.status;
            throw err;
          }

          return res;
        },
        {
          maxRetries: MAX_AI_RETRIES,
          baseDelayMs: 1000,
          onRetry: (attempt) => {
            console.warn(`[AI Gateway] Retry attempt ${attempt}/${MAX_AI_RETRIES}`);
          },
        }
      );

      cb.recordSuccess();

      // Return directly for success, rate limit, or payment errors
      if (response.ok || response.status === 429 || response.status === 402) {
        return response;
      }

      console.warn(`[AI Gateway] Lovable failed (${response.status}), trying external fallback...`);
      cb.recordFailure();
    } catch (e) {
      cb.recordFailure();
      console.warn("[AI Gateway] Lovable error, trying external fallback...", e);
    }
  } else if (cb.isOpen) {
    console.warn("[AI Gateway] Circuit breaker OPEN, skipping Lovable gateway");
  }

  // Fallback to external endpoint (with timeout)
  if (EXTERNAL_AI_ENDPOINT) {
    console.log("[AI Gateway] Using external fallback endpoint");
    const response = await safeFetch(EXTERNAL_AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: AI_TIMEOUT_MS,
    });
    return response;
  }

  throw new Error("No AI endpoint available. Configure LOVABLE_API_KEY or EXTERNAL_AI_ENDPOINT.");
}
