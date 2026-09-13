/**
 * Gateway central de IA do CLAUTHOR.
 *
 * Mantém compatibilidade com Lovable/OpenClaw e adiciona rotas opcionais
 * OpenAI-compatible (LiteLLM, OpenRouter ou gateway próprio). As chaves ficam
 * somente nas Edge Functions. O gateway não tenta descobrir saldo privado do
 * provedor: usa limites locais conservadores e trata 402/429/5xx como sinais
 * para a próxima rota.
 */

import { withRetry, safeFetch, circuitBreaker } from "./resilience.ts";

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENROUTER_GATEWAY = "https://openrouter.ai/api/v1/chat/completions";
const AI_TIMEOUT_MS = 30_000;
const MAX_AI_RETRIES = 2;

export type TaskComplexity = "simple" | "medium" | "complex" | "auto";
export type QualityMode = "max_quality" | "balanced" | "economic";
export type AIProvider = "lovable" | "litellm" | "openrouter" | "openclaw";

interface FetchAIOptions {
  complexity?: TaskComplexity;
  qualityMode?: QualityMode;
  extraHeaders?: Record<string, string>;
}

export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "google/gemini-2.5-flash-lite": { input: 0.075, output: 0.30 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.00 },
};

export function selectModel(complexity: TaskComplexity, qualityMode: QualityMode = "balanced"): string {
  if (qualityMode === "max_quality") return "google/gemini-2.5-pro";
  if (qualityMode === "economic") return "google/gemini-2.5-flash-lite";
  switch (complexity) {
    case "simple": return "google/gemini-2.5-flash-lite";
    case "medium": return "google/gemini-2.5-flash";
    case "complex": return "google/gemini-2.5-pro";
    default: return "google/gemini-3-flash-preview";
  }
}

export function classifyTaskComplexity(message: string): "simple" | "medium" | "complex" {
  if (!message || typeof message !== "string") return "simple";
  const content = message.toLowerCase().trim();
  const wordCount = content.split(/\s+/).length;
  const complexKW = [
    "analise", "análise", "analyze", "analysis", "estratégia", "strategy",
    "compare", "comparar", "crie um plano", "create a plan", "planejamento",
    "diagnóstico", "auditoria", "audit", "previsão", "forecast", "predict",
    "otimizar", "optimize", "multi-step", "step-by-step", "raciocínio",
    "código", "code", "implementar", "implement", "arquitetura", "architecture",
  ];
  const simpleKW = [
    "olá", "oi", "hello", "hi", "hey", "obrigado", "thanks", "sim", "não",
    "yes", "no", "ok", "certo", "entendi", "bom dia", "boa tarde", "boa noite",
  ];
  if (wordCount > 200 || complexKW.some((kw) => content.includes(kw))) return "complex";
  if (wordCount < 50 && (simpleKW.some((kw) => content.includes(kw)) || !complexKW.some((kw) => content.includes(kw)))) return "simple";
  return "medium";
}

function detectComplexity(body: Record<string, any>): TaskComplexity {
  const messages = body.messages || [];
  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
  if (!lastUserMsg) return "simple";
  let rawContent = lastUserMsg.content || "";
  if (Array.isArray(rawContent)) {
    rawContent = rawContent.filter((p: any) => p.type === "text").map((p: any) => p.text || "").join(" " );
  }
  if (typeof rawContent !== "string") rawContent = String(rawContent);
  if (body.tools && body.tools.length > 0) return "complex";
  return classifyTaskComplexity(rawContent);
}

function csvEnv(name: string): string[] {
  return (Deno.env.get(name) || "").split(",").map((value) => value.trim()).filter(Boolean);
}
function configured(name: string): boolean { return Boolean(Deno.env.get(name)); }
function providerOrder(): AIProvider[] {
  const configuredOrder = csvEnv("AI_ROUTER_ORDER") as AIProvider[];
  if (configuredOrder.length > 0) return configuredOrder.filter((p) => ["lovable", "litellm", "openrouter", "openclaw"].includes(p));
  return ["litellm", "openrouter", "openclaw"];
}
function shouldFallback(status: number): boolean { return status === 402 || status === 408 || status === 409 || status === 429 || status >= 500; }
function requestBody(body: Record<string, any>, provider: AIProvider): Record<string, any> {
  const next = { ...body };
  const configuredModel = Deno.env.get(`AI_ROUTER_MODEL_${provider.toUpperCase()}`);
  if (configuredModel) next.model = configuredModel;
  if (provider === "openrouter") {
    const fallbackModels = csvEnv("OPENROUTER_FALLBACK_MODELS");
    if (fallbackModels.length > 0) next.models = [next.model, ...fallbackModels.filter((model) => model !== next.model)];
  }
  return next;
}

async function callOpenAICompatible(provider: "litellm" | "openrouter", body: Record<string, any>, extraHeaders?: Record<string, string>): Promise<Response> {
  const baseUrl = provider === "litellm" ? Deno.env.get("LITELLM_BASE_URL") : Deno.env.get("OPENROUTER_BASE_URL") || OPENROUTER_GATEWAY;
  const apiKey = provider === "litellm" ? Deno.env.get("LITELLM_API_KEY") : Deno.env.get("OPENROUTER_API_KEY");
  if (!baseUrl || !apiKey) throw new Error(`${provider} não configurado`);
  const endpoint = baseUrl.replace(/\/$/, "").endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const cb = circuitBreaker(`ai-${provider}`, 5, 60_000);
  if (cb.isOpen) throw new Error(`${provider} circuit breaker OPEN`);
  try {
    const response = await safeFetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(provider === "openrouter" ? { "HTTP-Referer": "https://clauthor.com", "X-Title": "CLAUTHOR" } : {}), ...extraHeaders }, body: JSON.stringify(requestBody(body, provider)), timeoutMs: AI_TIMEOUT_MS });
    if (response.ok) cb.recordSuccess(); else if (response.status >= 500 || response.status === 429) cb.recordFailure();
    return response;
  } catch (error) { cb.recordFailure(); throw error; }
}

async function callLovable(body: Record<string, any>, extraHeaders?: Record<string, string>): Promise<Response> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const cb = circuitBreaker("ai-lovable", 5, 60_000);
  if (cb.isOpen) throw new Error("Lovable circuit breaker OPEN");
  try {
    const response = await withRetry(() => safeFetch(LOVABLE_GATEWAY, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extraHeaders }, body: JSON.stringify(body), timeoutMs: AI_TIMEOUT_MS }), { maxRetries: MAX_AI_RETRIES, baseDelayMs: 1000, onRetry: (attempt) => console.warn(`[AI Router] Lovable retry ${attempt}/${MAX_AI_RETRIES}`) });
    if (response.ok) cb.recordSuccess(); else if (response.status >= 500 || response.status === 429) cb.recordFailure();
    return response;
  } catch (error) { cb.recordFailure(); throw error; }
}

async function callOpenClaw(body: Record<string, any>): Promise<Response> {
  const endpoint = Deno.env.get("EXTERNAL_AI_ENDPOINT");
  if (!endpoint) throw new Error("EXTERNAL_AI_ENDPOINT not configured");
  const key = Deno.env.get("OPENCLAW_API_KEY");
  const cb = circuitBreaker("ai-openclaw", 3, 300_000);
  if (cb.isOpen) throw new Error("OpenClaw circuit breaker OPEN");
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await safeFetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), timeoutMs: AI_TIMEOUT_MS });
    if (response.ok) cb.recordSuccess(); else if (response.status >= 500 || response.status === 429) cb.recordFailure();
    return response;
  } catch (error) { cb.recordFailure(); throw error; }
}

async function callProvider(provider: AIProvider, body: Record<string, any>, extraHeaders?: Record<string, string>): Promise<Response> {
  const prepared = requestBody(body, provider);
  if (provider === "lovable") return callLovable(prepared, extraHeaders);
  if (provider === "litellm") return callOpenAICompatible(provider, prepared, extraHeaders);
  if (provider === "openrouter") return callOpenAICompatible(provider, prepared, extraHeaders);
  return callOpenClaw(prepared);
}
function providerConfigured(provider: AIProvider): boolean {
  if (provider === "lovable") return configured("LOVABLE_API_KEY");
  if (provider === "litellm") return configured("LITELLM_BASE_URL") && configured("LITELLM_API_KEY");
  if (provider === "openrouter") return configured("OPENROUTER_API_KEY");
  return configured("EXTERNAL_AI_ENDPOINT");
}

export async function fetchAI(body: Record<string, any>, extraHeadersOrOptions?: Record<string, string> | FetchAIOptions): Promise<Response> {
  let complexity: TaskComplexity = "auto"; let qualityMode: QualityMode = "balanced"; let extraHeaders: Record<string, string> | undefined;
  if (extraHeadersOrOptions) {
    if ("complexity" in extraHeadersOrOptions || "qualityMode" in extraHeadersOrOptions) { const options = extraHeadersOrOptions as FetchAIOptions; complexity = options.complexity || "auto"; qualityMode = options.qualityMode || "balanced"; extraHeaders = options.extraHeaders; }
    else extraHeaders = extraHeadersOrOptions as Record<string, string>;
  }
  const resolved = complexity === "auto" ? detectComplexity(body) : complexity;
  const request = { ...body };
  if (!request.model || request.model === "google/gemini-3-flash-preview") request.model = selectModel(resolved, qualityMode);
  const available = providerOrder().filter(providerConfigured);
  if (available.length === 0) throw new Error("Nenhum provedor de IA configurado.");
  console.log(`[AI Router] complexity=${resolved} order=${available.join(",")}`);
  let lastStatus = 503; let lastError = "";
  for (const provider of available) {
    try {
      const response = await callProvider(provider, request, extraHeaders);
      if (response.ok) { console.log(`[AI Router] provider=${provider} status=200 model=${requestBody(request, provider).model}`); return response; }
      lastStatus = response.status;
      if (!shouldFallback(response.status)) return response;
      const detail = await response.text().catch(() => "");
      console.warn(`[AI Router] provider=${provider} fallback status=${response.status} detail=${detail.slice(0, 240)}`);
    } catch (error) { lastError = error instanceof Error ? error.message : String(error); console.warn(`[AI Router] provider=${provider} unavailable: ${lastError}`); }
  }
  if (lastError) throw new Error(`Todos os provedores de IA falharam: ${lastError}`);
  return new Response(JSON.stringify({ error: "Todos os provedores de IA estão indisponíveis.", last_status: lastStatus }), { status: lastStatus, headers: { "Content-Type": "application/json" } });
}

export function getConfiguredProviders(): AIProvider[] { return providerOrder().filter(providerConfigured); }
export function isFallbackStatus(status: number): boolean { return shouldFallback(status); }
