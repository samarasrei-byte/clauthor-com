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

export type TaskComplexity = "simple" | "medium" | "complex" | "auto";
export type QualityMode = "max_quality" | "balanced" | "economic";

interface FetchAIOptions {
  /** Override automatic routing: "simple" → OpenClaw, "complex" → Lovable AI, "auto" → heuristic */
  complexity?: TaskComplexity;
  /** Agent quality mode override */
  qualityMode?: QualityMode;
  /** Extra headers for requests */
  extraHeaders?: Record<string, string>;
}

// Model costs per 1M tokens (USD) for cost estimation
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash-lite": { input: 0.075, output: 0.30 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.00 },
};

/**
 * Selects the optimal model based on complexity and quality mode.
 */
export function selectModel(complexity: TaskComplexity, qualityMode: QualityMode = "balanced"): string {
  if (qualityMode === "max_quality") return "google/gemini-2.5-pro";
  if (qualityMode === "economic") return "google/gemini-2.5-flash-lite";
  
  // Balanced mode: route by complexity
  switch (complexity) {
    case "simple": return "google/gemini-2.5-flash-lite";
    case "medium": return "google/gemini-2.5-flash";
    case "complex": return "google/gemini-2.5-pro";
    default: return "google/gemini-3-flash-preview";
  }
}

/**
 * Classifies task complexity into 3 tiers: simple, medium, complex.
 */
export function classifyTaskComplexity(message: string): "simple" | "medium" | "complex" {
  if (!message || typeof message !== "string") return "simple";
  const content = message.toLowerCase().trim();
  const wordCount = content.split(/\s+/).length;

  // Complex keywords
  const complexKW = [
    "analise", "análise", "analyze", "analysis", "estratégia", "strategy",
    "compare", "comparar", "crie um plano", "create a plan", "planejamento",
    "diagnóstico", "auditoria", "audit", "previsão", "forecast", "predict",
    "otimizar", "optimize", "multi-step", "step-by-step", "raciocínio",
    "código", "code", "implementar", "implement", "arquitetura", "architecture",
  ];
  
  // Simple patterns
  const simpleKW = [
    "olá", "oi", "hello", "hi", "hey", "obrigado", "thanks",
    "sim", "não", "yes", "no", "ok", "certo", "entendi",
    "bom dia", "boa tarde", "boa noite",
  ];

  // Over 200 words or complex keywords → complex
  if (wordCount > 200) return "complex";
  if (complexKW.some(kw => content.includes(kw))) return "complex";
  
  // Under 50 words with simple keywords → simple
  if (wordCount < 50 && simpleKW.some(kw => content.includes(kw))) return "simple";
  if (wordCount < 50 && !complexKW.some(kw => content.includes(kw))) return "simple";
  
  // 50-200 words → medium
  return "medium";
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
 * Determines task complexity from message content using heuristics (legacy compat).
 */
function detectComplexity(body: Record<string, any>): TaskComplexity {
  const messages = body.messages || [];
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
  if (!lastUserMsg) return "simple";

  let rawContent = lastUserMsg.content || "";
  if (Array.isArray(rawContent)) {
    rawContent = rawContent.filter((p: any) => p.type === "text").map((p: any) => p.text || "").join(" ");
  }
  if (typeof rawContent !== "string") rawContent = String(rawContent);

  // Tool calling requests are complex
  if (body.tools && body.tools.length > 0) return "complex";

  return classifyTaskComplexity(rawContent);
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

  const cb = circuitBreaker("ai-openclaw", 3, 300_000); // 5min cooldown
  if (cb.isOpen) {
    // Don't throw - return a signal so the router silently skips to fallback
    throw new Error("OpenClaw circuit breaker OPEN - skipping");
  }

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
 * Main entry point - smart routing with mutual fallback.
 */
export async function fetchAI(
  body: Record<string, any>,
  extraHeadersOrOptions?: Record<string, string> | FetchAIOptions
): Promise<Response> {
  // Support both old signature (extraHeaders) and new (options)
  let complexity: TaskComplexity = "auto";
  let qualityMode: QualityMode = "balanced";
  let extraHeaders: Record<string, string> | undefined;

  if (extraHeadersOrOptions) {
    if ("complexity" in extraHeadersOrOptions || "qualityMode" in extraHeadersOrOptions) {
      const opts = extraHeadersOrOptions as FetchAIOptions;
      complexity = opts.complexity || "auto";
      qualityMode = opts.qualityMode || "balanced";
      extraHeaders = opts.extraHeaders;
    } else {
      extraHeaders = extraHeadersOrOptions as Record<string, string>;
    }
  }

  // Determine routing
  const resolved = complexity === "auto" ? detectComplexity(body) : complexity;
  
  // Apply smart model selection if no model is explicitly set
  if (!body.model || body.model === "google/gemini-3-flash-preview") {
    body.model = selectModel(resolved, qualityMode);
  }
  
  const primaryIsOpenClaw = resolved === "simple" && qualityMode !== "max_quality";

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
      // Silent fallback - OpenClaw is down, just use Lovable
      console.warn("[AI Router] OpenClaw unavailable, using Lovable");
    }

    // Fallback to Lovable
    if (hasLovable) {
      return await callLovable(body, extraHeaders);
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
