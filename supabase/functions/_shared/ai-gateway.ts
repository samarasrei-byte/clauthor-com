/**
 * Smart AI Gateway with intelligent routing.
 * 
 * Routing Strategy:
 *   - Simple tasks (FAQ, scheduling, greetings) → OpenClaw VPS (fixed cost, unlimited tokens)
 *   - Complex tasks (analysis, reports, reasoning) → Lovable AI Gateway (Gemini Pro / GPT-5)
 *   - Mutual fallback: if primary fails, the other takes over
 * 
 * Task complexity is determined by:
 *   1. Explicit complexity hint passed by the caller
 *   2. Heuristic analysis of the prompt (length, keywords)
 */

import { withRetry, safeFetch, circuitBreaker } from "./resilience.ts";

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_TIMEOUT_MS = 30000;
const MAX_AI_RETRIES = 2;

export type TaskComplexity = "simple" | "complex" | "auto";

interface FetchAIOptions {
  /** Override automatic routing: "simple" → OpenClaw, "complex" → Lovable AI, "auto" → heuristic */
  complexity?: TaskComplexity;
  /** Extra headers for requests */
  extraHeaders?: Record<string, string>;
}

// Keywords that suggest complex reasoning tasks
const COMPLEX_KEYWORDS = [
  "analise", "análise", "analyze", "analysis",
  "relatório", "report",
  "estratégia", "strategy",
  "compare", "comparar", "comparação",
  "planejamento", "planning",
  "diagnóstico", "diagnostic",
  "auditoria", "audit",
  "previsão", "forecast", "predict",
  "otimizar", "optimize",
  "resumo executivo", "executive summary",
  "multi-step", "step-by-step",
];

// Keywords that suggest simple/routine tasks
const SIMPLE_KEYWORDS = [
  "olá", "oi", "hello", "hi", "hey",
  "obrigado", "thanks", "thank you",
  "agendar", "schedule", "marcar",
  "horário", "hours", "endereço", "address",
  "preço", "price", "valor", "cost",
  "telefone", "phone", "contato", "contact",
  "faq", "pergunta", "question",
  "sim", "não", "yes", "no",
  "ok", "certo", "entendi",
];

/**
 * Determines task complexity from message content using heuristics.
 */
function detectComplexity(body: Record<string, any>): TaskComplexity {
  const messages = body.messages || [];
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
  if (!lastUserMsg) return "simple";

  const content = (lastUserMsg.content || "").toLowerCase();
  const wordCount = content.split(/\s+/).length;

  // Long prompts are likely complex
  if (wordCount > 150) return "complex";

  // Check for complex keywords
  const hasComplexKeyword = COMPLEX_KEYWORDS.some(kw => content.includes(kw));
  if (hasComplexKeyword) return "complex";

  // Check for simple keywords (short messages with simple intent)
  const hasSimpleKeyword = SIMPLE_KEYWORDS.some(kw => content.includes(kw));
  if (hasSimpleKeyword && wordCount < 30) return "simple";

  // Tool calling requests are complex
  if (body.tools && body.tools.length > 0) return "complex";

  // Default: simple for short, complex for longer
  return wordCount > 60 ? "complex" : "simple";
}

/**
 * Calls the Lovable AI Gateway.
 */
async function callLovable(
  body: Record<string, any>,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const cb = circuitBreaker("ai-lovable", 5, 60_000);
  if (cb.isOpen) throw new Error("Lovable circuit breaker OPEN");

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

        if (res.status === 429 || res.status === 402) return res;
        if (!res.ok && res.status >= 500) {
          const err: any = new Error(`Lovable AI ${res.status}`);
          err.status = res.status;
          throw err;
        }
        return res;
      },
      {
        maxRetries: MAX_AI_RETRIES,
        baseDelayMs: 1000,
        onRetry: (attempt) => console.warn(`[AI Router] Lovable retry ${attempt}/${MAX_AI_RETRIES}`),
      }
    );

    cb.recordSuccess();
    return response;
  } catch (e) {
    cb.recordFailure();
    throw e;
  }
}

/**
 * Calls the OpenClaw VPS endpoint.
 */
async function callOpenClaw(body: Record<string, any>): Promise<Response> {
  const EXTERNAL_AI_ENDPOINT = Deno.env.get("EXTERNAL_AI_ENDPOINT");
  if (!EXTERNAL_AI_ENDPOINT) throw new Error("EXTERNAL_AI_ENDPOINT not configured");

  const OPENCLAW_API_KEY = Deno.env.get("OPENCLAW_API_KEY");

  const cb = circuitBreaker("ai-openclaw", 5, 60_000);
  if (cb.isOpen) throw new Error("OpenClaw circuit breaker OPEN");

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (OPENCLAW_API_KEY) {
      headers["Authorization"] = `Bearer ${OPENCLAW_API_KEY}`;
    }

    const response = await safeFetch(EXTERNAL_AI_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      timeoutMs: AI_TIMEOUT_MS,
    });

    cb.recordSuccess();
    return response;
  } catch (e) {
    cb.recordFailure();
    throw e;
  }
}

/**
 * Main entry point — smart routing with mutual fallback.
 */
export async function fetchAI(
  body: Record<string, any>,
  extraHeadersOrOptions?: Record<string, string> | FetchAIOptions
): Promise<Response> {
  // Support both old signature (extraHeaders) and new (options)
  let complexity: TaskComplexity = "auto";
  let extraHeaders: Record<string, string> | undefined;

  if (extraHeadersOrOptions) {
    if ("complexity" in extraHeadersOrOptions) {
      const opts = extraHeadersOrOptions as FetchAIOptions;
      complexity = opts.complexity || "auto";
      extraHeaders = opts.extraHeaders;
    } else {
      extraHeaders = extraHeadersOrOptions as Record<string, string>;
    }
  }

  // Determine routing
  const resolved = complexity === "auto" ? detectComplexity(body) : complexity;
  const primaryIsOpenClaw = resolved === "simple";

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const EXTERNAL_AI_ENDPOINT = Deno.env.get("EXTERNAL_AI_ENDPOINT");

  const hasLovable = !!LOVABLE_API_KEY;
  const hasOpenClaw = !!EXTERNAL_AI_ENDPOINT;

  console.log(`[AI Router] Complexity: ${resolved} | Primary: ${primaryIsOpenClaw ? "OpenClaw" : "Lovable"} | Lovable: ${hasLovable} | OpenClaw: ${hasOpenClaw}`);

  // Route: Simple → OpenClaw first, Lovable fallback
  if (primaryIsOpenClaw && hasOpenClaw) {
    try {
      const response = await callOpenClaw(body);
      if (response.ok) {
        console.log("[AI Router] ✅ OpenClaw handled simple task");
        return response;
      }
      console.warn(`[AI Router] OpenClaw returned ${response.status}, falling back to Lovable`);
    } catch (e) {
      console.warn("[AI Router] OpenClaw failed, falling back to Lovable:", e);
    }

    // Fallback to Lovable
    if (hasLovable) {
      try {
        return await callLovable(body, extraHeaders);
      } catch (e) {
        console.error("[AI Router] Both OpenClaw and Lovable failed:", e);
        throw new Error("All AI endpoints failed");
      }
    }
    throw new Error("OpenClaw failed and Lovable not configured");
  }

  // Route: Complex → Lovable first, OpenClaw fallback
  if (hasLovable) {
    try {
      const response = await callLovable(body, extraHeaders);
      if (response.ok || response.status === 429 || response.status === 402) {
        if (response.ok) console.log("[AI Router] ✅ Lovable handled complex task");
        return response;
      }
      console.warn(`[AI Router] Lovable returned ${response.status}, falling back to OpenClaw`);
    } catch (e) {
      console.warn("[AI Router] Lovable failed, falling back to OpenClaw:", e);
    }

    // Fallback to OpenClaw
    if (hasOpenClaw) {
      try {
        const response = await callOpenClaw(body);
        console.log("[AI Router] ✅ OpenClaw handled as fallback");
        return response;
      } catch (e) {
        console.error("[AI Router] Both Lovable and OpenClaw failed:", e);
        throw new Error("All AI endpoints failed");
      }
    }
    throw new Error("Lovable failed and OpenClaw not configured");
  }

  // Only OpenClaw available
  if (hasOpenClaw) {
    return await callOpenClaw(body);
  }

  throw new Error("No AI endpoint available. Configure LOVABLE_API_KEY or EXTERNAL_AI_ENDPOINT.");
}
