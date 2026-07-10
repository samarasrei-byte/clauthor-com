// Execution Tracer — unifica o registro de "runs" (mcp_executions) e "steps"
// (execution_steps) para qualquer edge function que execute agentes.
//
// Uso típico:
//   const tracer = await startRun(supabase, {
//     tenantId, userId, runType: "mcp", agents: ["sales-hunter"]
//   });
//   await tracer.step("thought", { title: "Analisando pedido" });
//   await tracer.step("tool_call", { title: "Buscar leads", tool_name: "hunter_search", content: { args } });
//   await tracer.step("tool_result", { title: "3 leads encontrados", content: { output }, duration_ms: 1240 });
//   await tracer.finish({ status: "completed", summary: "Prospecção concluída" });
//
// Regras:
//  - Todos os writes são best-effort: falhas NÃO derrubam a execução real do agente.
//  - Content é sanitizado antes de gravar (PII whitelist).
//  - step_index é auto-incrementado localmente para evitar race no banco.

// deno-lint-ignore-file no-explicit-any
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type StepType =
  | "thought"
  | "tool_call"
  | "tool_result"
  | "decision"
  | "delegation"
  | "final_output"
  | "error"
  | "system";

export type RunType =
  | "mcp"
  | "agent_task"
  | "approval_action"
  | "agent_execute"
  | "hunter"
  | "linkedin"
  | "other";

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export interface StartRunInput {
  tenantId: string;
  userId: string;
  runType: RunType;
  agents?: string[];
  parentTaskId?: string | null;
  message?: string; // input inicial do usuário/sistema
}

export interface StepInput {
  title: string;
  content?: Record<string, unknown>;
  tool_name?: string | null;
  sources?: Array<{ type?: string; url?: string; title?: string; snippet?: string }> | null;
  tokens_in?: number;
  tokens_out?: number;
  cost_credits?: number;
  duration_ms?: number;
  agent_slug?: string | null;
}

export interface FinishInput {
  status: RunStatus;
  summary?: string;
  total_ms?: number;
  results?: Record<string, unknown>;
}

// Chaves cujo valor NUNCA deve ser gravado — substituídas por "[redacted]".
const PII_KEYS = new Set([
  "password",
  "pwd",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "secret",
  "authorization",
  "cpf",
  "cnpj",
  "credit_card",
  "card_number",
  "cvv",
]);

const MAX_STRING = 4000;
const MAX_DEPTH = 6;

function sanitize(input: unknown, depth = 0): unknown {
  if (input == null) return input;
  if (depth > MAX_DEPTH) return "[max_depth]";
  if (typeof input === "string") {
    return input.length > MAX_STRING ? input.slice(0, MAX_STRING) + "…" : input;
  }
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) return input.slice(0, 50).map((v) => sanitize(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = "[redacted]";
    } else {
      out[k] = sanitize(v, depth + 1);
    }
  }
  return out;
}

export interface Tracer {
  runId: string;
  step: (type: StepType, input: StepInput) => Promise<void>;
  finish: (input: FinishInput) => Promise<void>;
}

export async function startRun(
  supabase: SupabaseClient,
  input: StartRunInput,
): Promise<Tracer> {
  const startedAt = Date.now();
  let stepIndex = 0;
  let finished = false;

  const { data, error } = await supabase
    .from("mcp_executions")
    .insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      run_type: input.runType,
      parent_task_id: input.parentTaskId ?? null,
      message: input.message ?? null,
      selected_agents: input.agents ?? [],
      triggered_agents: input.agents ?? [],
      status: "running",
    })
    .select("id")
    .single();

  if (error || !data) {
    // Fallback: retorna um tracer "no-op" para nunca quebrar o caller.
    console.warn("[execution-tracer] failed to start run:", error?.message);
    return {
      runId: "00000000-0000-0000-0000-000000000000",
      step: async () => {},
      finish: async () => {},
    };
  }

  const runId = data.id as string;

  const step = async (type: StepType, s: StepInput): Promise<void> => {
    if (finished) return;
    try {
      const idx = stepIndex++;
      await supabase.from("execution_steps").insert({
        run_id: runId,
        tenant_id: input.tenantId,
        user_id: input.userId,
        step_index: idx,
        step_type: type,
        title: s.title.slice(0, 240),
        content: sanitize(s.content ?? {}) as Record<string, unknown>,
        tool_name: s.tool_name ?? null,
        sources: s.sources ? (sanitize(s.sources) as unknown) : null,
        tokens_in: s.tokens_in ?? 0,
        tokens_out: s.tokens_out ?? 0,
        cost_credits: s.cost_credits ?? 0,
        duration_ms: s.duration_ms ?? 0,
        agent_slug: s.agent_slug ?? null,
      });
    } catch (err) {
      console.warn("[execution-tracer] step insert failed:", (err as Error).message);
    }
  };

  const finish = async (f: FinishInput): Promise<void> => {
    if (finished) return;
    finished = true;
    const totalMs = f.total_ms ?? Date.now() - startedAt;
    try {
      await supabase
        .from("mcp_executions")
        .update({
          status: f.status,
          summary: f.summary ?? null,
          total_ms: totalMs,
          results: f.results ? (sanitize(f.results) as Record<string, unknown>) : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId);
    } catch (err) {
      console.warn("[execution-tracer] finish failed:", (err as Error).message);
    }
  };

  return { runId, step, finish };
}
