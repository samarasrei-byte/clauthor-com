/**
 * Espelha `supabase/functions/agent-chat/limits.ts` (runtime Deno).
 * O arquivo real é `.ts` com imports Deno, então re-implementamos aqui a
 * lógica pura para travar o contrato via Vitest.
 */
import { describe, it, expect } from "vitest";

interface PlanLimits {
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

function getPlanLimits(planType: string): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
}

function applyHistoryWindow<T>(messages: T[], max: number): T[] {
  if (messages.length <= max) return messages;
  const first = messages[0];
  return [first, ...messages.slice(-(max - 1))];
}

function truncateOlderMessages<T extends { content?: string }>(
  messages: T[],
  maxChars = 500,
): T[] {
  if (messages.length <= 2) return messages;
  return messages.map((msg, i) => {
    if (i === 0 || i >= messages.length - 2) return msg;
    if (msg.content && msg.content.length > maxChars) {
      return { ...msg, content: msg.content.slice(0, maxChars) + "... [truncado]" };
    }
    return msg;
  });
}

describe("agent-chat limits", () => {
  describe("getPlanLimits", () => {
    it.each(["free", "starter", "pro", "enterprise"])("returns known plan %s", (p) => {
      expect(getPlanLimits(p).maxHistoryMessages).toBeGreaterThan(0);
    });

    it("falls back to free for unknown plans", () => {
      expect(getPlanLimits("nope")).toEqual(PLAN_LIMITS.free);
    });

    it("higher tiers have strictly higher history caps", () => {
      expect(getPlanLimits("free").maxHistoryMessages)
        .toBeLessThan(getPlanLimits("starter").maxHistoryMessages);
      expect(getPlanLimits("starter").maxHistoryMessages)
        .toBeLessThan(getPlanLimits("pro").maxHistoryMessages);
      expect(getPlanLimits("pro").maxHistoryMessages)
        .toBeLessThan(getPlanLimits("enterprise").maxHistoryMessages);
    });
  });

  describe("applyHistoryWindow", () => {
    it("returns array unchanged when within cap", () => {
      const msgs = [1, 2, 3];
      expect(applyHistoryWindow(msgs, 5)).toEqual([1, 2, 3]);
    });

    it("keeps first message + tail when over cap", () => {
      const msgs = [1, 2, 3, 4, 5, 6, 7, 8];
      const out = applyHistoryWindow(msgs, 4);
      expect(out).toEqual([1, 6, 7, 8]);
      expect(out.length).toBe(4);
    });

    it("edge: max=1 keeps only the anchor", () => {
      expect(applyHistoryWindow([1, 2, 3], 1)).toEqual([1]);
    });
  });

  describe("truncateOlderMessages", () => {
    it("returns short conversations untouched", () => {
      const msgs = [{ content: "hi" }, { content: "hello" }];
      expect(truncateOlderMessages(msgs, 10)).toEqual(msgs);
    });

    it("truncates middle messages exceeding maxChars", () => {
      const long = "x".repeat(600);
      const msgs = [
        { content: "anchor" },
        { content: long },
        { content: long },
        { content: "recent-1" },
        { content: "recent-2" },
      ];
      const out = truncateOlderMessages(msgs, 500);
      expect(out[0].content).toBe("anchor"); // anchor untouched
      expect(out[1].content).toMatch(/\[truncado\]$/); // middle truncated
      expect(out[2].content).toMatch(/\[truncado\]$/);
      expect(out[3].content).toBe("recent-1"); // last two untouched
      expect(out[4].content).toBe("recent-2");
    });

    it("never truncates the last two messages regardless of size", () => {
      const long = "y".repeat(2000);
      const msgs = [
        { content: "anchor" },
        { content: "middle" },
        { content: long },
        { content: long },
      ];
      const out = truncateOlderMessages(msgs, 100);
      // indexes messages.length-2 and messages.length-1 must be untouched
      expect(out[2].content.length).toBe(2000);
      expect(out[3].content.length).toBe(2000);
    });
  });
});
