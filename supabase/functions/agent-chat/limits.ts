// ─── Per-plan runtime limits and message pre-processing for agent-chat ───
// Pure functions only — safe to unit-test and reason about in isolation.

export interface PlanLimits {
  maxHistoryMessages: number;
  maxResponseTokens: number;
  creditWarningThreshold: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:       { maxHistoryMessages: 10, maxResponseTokens: 512,  creditWarningThreshold: 0.8 },
  starter:    { maxHistoryMessages: 20, maxResponseTokens: 1024, creditWarningThreshold: 0.8 },
  pro:        { maxHistoryMessages: 30, maxResponseTokens: 2048, creditWarningThreshold: 0.8 },
  enterprise: { maxHistoryMessages: 50, maxResponseTokens: 4096, creditWarningThreshold: 0.9 },
};

export function getPlanLimits(planType: string): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
}

/**
 * Keep the first message (usually system/anchor) and the most recent tail.
 * The window is inclusive of the anchor, so a `maxMessages` of 20 keeps
 * 1 anchor + 19 recent messages.
 */
export function applyHistoryWindow<T>(messages: T[], maxMessages: number): T[] {
  if (messages.length <= maxMessages) return messages;
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-(maxMessages - 1));
  return [firstMessage, ...recentMessages];
}

/**
 * Truncate the content of older messages (everything except the anchor and
 * the last two turns) to `maxChars` characters. Reduces prompt cost while
 * preserving conversational recency.
 */
export function truncateOlderMessages<T extends { content?: string }>(
  messages: T[],
  maxChars: number = 500,
): T[] {
  if (messages.length <= 2) return messages;
  return messages.map((msg, index) => {
    if (index === 0 || index >= messages.length - 2) return msg;
    if (msg.content && msg.content.length > maxChars) {
      return { ...msg, content: msg.content.slice(0, maxChars) + "... [truncado]" };
    }
    return msg;
  });
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Strict input contract for /agent-chat. Rejects malformed payloads early so
 * the model never sees garbage and we never spend credits on invalid calls.
 */
export function validateInput(messages: ChatMessage[]): ValidationResult {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Messages array is required." };
  }
  if (messages.length > 50) {
    return { valid: false, error: "Too many messages. Please start a new conversation." };
  }
  for (const msg of messages) {
    if (!msg.content || typeof msg.content !== "string") {
      return { valid: false, error: "Invalid message format." };
    }
    if (msg.content.length > 4000) {
      return { valid: false, error: "Message too long. Maximum 4000 characters." };
    }
    if (!["user", "assistant"].includes(msg.role)) {
      return { valid: false, error: "Invalid message role." };
    }
  }
  return { valid: true };
}
