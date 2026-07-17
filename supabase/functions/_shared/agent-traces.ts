/**
 * agent-traces.ts — Helper para gravar traces de observabilidade
 *
 * Uso em edge functions:
 *   import { startRun, logSpan, finishRun } from "../_shared/agent-traces.ts";
 *   const run = await startRun({ userId, agentId, agentName, name: "prospect-lead" });
 *   await logSpan(run, { spanType: "llm_call", name: "extract-intent", model: "google/gemini-2.5-flash", tokensInput: 240, tokensOutput: 80, latencyMs: 1240, costUsd: 0.00012 });
 *   await finishRun(run, { status: "ok" });
 *
 * Nunca lança erro — falhas de logging não devem quebrar a execução do agente.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const admin = SUPABASE_URL && SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;

export type SpanType = "run" | "llm_call" | "tool_call" | "retrieval" | "decision" | "error";
export type SpanStatus = "ok" | "error" | "pending";

export interface RunHandle {
  runId: string;
  userId: string;
  agentId?: string | null;
  agentName?: string | null;
  rootId: string;
  startedAt: number;
}

export interface SpanInput {
  spanType: SpanType;
  name: string;
  status?: SpanStatus;
  model?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  latencyMs?: number;
  evalScore?: number | null;
}

/**
 * Estima o custo em USD para modelos Lovable Gateway.
 * Valores conservadores baseados no pricing público de 2026.
 */
export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const m = (model || "").toLowerCase();
  // per 1M tokens (input, output)
  const table: Record<string, [number, number]> = {
    "google/gemini-2.5-flash": [0.075, 0.30],
    "google/gemini-3-flash-preview": [0.10, 0.40],
    "google/gemini-2.5-pro": [1.25, 5.00],
    "openai/gpt-5.5": [2.50, 10.00],
    "openai/gpt-4o-mini": [0.15, 0.60],
  };
  for (const [key, [inCost, outCost]] of Object.entries(table)) {
    if (m.includes(key.toLowerCase())) {
      return (tokensIn * inCost + tokensOut * outCost) / 1_000_000;
    }
  }
  // fallback conservador
  return (tokensIn * 0.15 + tokensOut * 0.60) / 1_000_000;
}

export async function startRun(params: {
  userId: string;
  agentId?: string | null;
  agentName?: string | null;
  name: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<RunHandle> {
  const runId = crypto.randomUUID();
  const rootId = crypto.randomUUID();
  const startedAt = Date.now();
  const handle: RunHandle = {
    runId,
    userId: params.userId,
    agentId: params.agentId ?? null,
    agentName: params.agentName ?? null,
    rootId,
    startedAt,
  };

  if (!admin) return handle;
  try {
    await admin.from("agent_traces").insert({
      id: rootId,
      user_id: params.userId,
      agent_id: params.agentId ?? null,
      agent_name: params.agentName ?? null,
      run_id: runId,
      span_type: "run",
      name: params.name,
      status: "pending",
      input: params.input ?? null,
      metadata: params.metadata ?? {},
      started_at: new Date(startedAt).toISOString(),
    });
  } catch (e) {
    console.warn("[agent-traces] startRun failed:", e);
  }
  return handle;
}

export async function logSpan(run: RunHandle, span: SpanInput): Promise<void> {
  if (!admin) return;
  const tokensIn = span.tokensInput ?? 0;
  const tokensOut = span.tokensOutput ?? 0;
  const cost =
    span.costUsd ?? (span.model ? estimateCost(span.model, tokensIn, tokensOut) : 0);
  try {
    await admin.from("agent_traces").insert({
      user_id: run.userId,
      agent_id: run.agentId,
      agent_name: run.agentName,
      run_id: run.runId,
      parent_span_id: run.rootId,
      span_type: span.spanType,
      name: span.name,
      status: span.status ?? "ok",
      model: span.model ?? null,
      input: span.input ?? null,
      output: span.output ?? null,
      metadata: span.metadata ?? {},
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      cost_usd: cost,
      latency_ms: span.latencyMs ?? 0,
      eval_score: span.evalScore ?? null,
      finished_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[agent-traces] logSpan failed:", e);
  }
}

export async function finishRun(
  run: RunHandle,
  opts: { status?: SpanStatus; output?: unknown; evalScore?: number | null } = {},
): Promise<void> {
  if (!admin) return;
  const latency = Date.now() - run.startedAt;
  try {
    await admin
      .from("agent_traces")
      .update({
        status: opts.status ?? "ok",
        output: opts.output ?? null,
        eval_score: opts.evalScore ?? null,
        latency_ms: latency,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.rootId);
  } catch (e) {
    console.warn("[agent-traces] finishRun failed:", e);
  }
}
