/**
 * Shared resilience utilities: retry, timeout, circuit breaker, alerting.
 * Used across all edge functions for guaranteed execution.
 */

// === RETRY WITH EXPONENTIAL BACKOFF ===
export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 8000,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt >= maxRetries) break;

      // Don't retry auth/payment/validation errors
      const status = error?.status || error?.response?.status;
      if (status && [400, 401, 402, 403, 404, 422].includes(status)) {
        throw error;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = delay * 0.2 * Math.random();

      onRetry?.(attempt + 1, error);
      console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay + jitter)}ms:`, error?.message || error);

      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }

  throw lastError;
}

// === TIMEOUT WRAPPER ===
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 25000,
  label: string = "operation"
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`));
        });
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

// === CIRCUIT BREAKER ===
interface CircuitState {
  failures: number;
  lastFailure: number;
  state: "closed" | "open" | "half-open";
}

const circuits = new Map<string, CircuitState>();

export function circuitBreaker(
  name: string,
  failureThreshold: number = 5,
  resetTimeMs: number = 60_000
): { isOpen: boolean; recordSuccess: () => void; recordFailure: () => void } {
  let circuit = circuits.get(name);

  if (!circuit) {
    circuit = { failures: 0, lastFailure: 0, state: "closed" };
    circuits.set(name, circuit);
  }

  // Check if circuit should reset
  if (circuit.state === "open" && Date.now() - circuit.lastFailure > resetTimeMs) {
    circuit.state = "half-open";
    circuit.failures = 0;
  }

  return {
    isOpen: circuit.state === "open",
    recordSuccess: () => {
      circuit!.failures = 0;
      circuit!.state = "closed";
    },
    recordFailure: () => {
      circuit!.failures++;
      circuit!.lastFailure = Date.now();
      if (circuit!.failures >= failureThreshold) {
        circuit!.state = "open";
        console.error(`[CircuitBreaker] ${name} OPENED after ${failureThreshold} failures`);
      }
    },
  };
}

// === FAILURE ALERTING ===
export async function alertFailure(
  adminClient: any,
  userId: string,
  agentId: string,
  action: string,
  error: string,
  metadata?: Record<string, any>
) {
  try {
    // Log to execution_logs with error status
    await adminClient.from("execution_logs").insert({
      user_id: userId,
      agent_id: agentId,
      action: `failure:${action}`,
      status: "error",
      details: {
        error,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      execution_time_ms: 0,
    });

    // Create notification for user
    await adminClient.from("notifications").insert({
      user_id: userId,
      title: "⚠️ Falha na execução do agente",
      message: `Ação "${action}" falhou: ${error.slice(0, 200)}. O sistema tentou recuperar automaticamente.`,
      type: "agent_failure",
      metadata: { agent_id: agentId, action, error: error.slice(0, 500) },
    });
  } catch (e) {
    console.error("[AlertFailure] Failed to log alert:", e);
  }
}

// === SAFE FETCH WITH TIMEOUT ===
export async function safeFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 25000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// === EXECUTION TRACKER ===
export function createExecutionTracker() {
  const startTime = Date.now();
  let steps: { name: string; durationMs: number; status: string }[] = [];

  return {
    step(name: string) {
      const stepStart = Date.now();
      return {
        done: (status: string = "success") => {
          steps.push({ name, durationMs: Date.now() - stepStart, status });
        },
        fail: (error?: string) => {
          steps.push({ name, durationMs: Date.now() - stepStart, status: `error: ${error || "unknown"}` });
        },
      };
    },
    summary() {
      return {
        totalMs: Date.now() - startTime,
        steps,
        hasErrors: steps.some(s => s.status.startsWith("error")),
      };
    },
  };
}
