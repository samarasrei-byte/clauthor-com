/**
 * Testes unitários das regras de validação usadas em edge functions e client.
 * Cobre casos críticos: mensagens malformadas, papéis inválidos, limites de tamanho.
 *
 * Espelha o contrato de `supabase/functions/_shared/streamChat.ts::validateMessages`,
 * mantido aqui como fonte auditável.
 */
import { describe, it, expect } from "vitest";

type Message = { role: string; content: string };

function validateMessages(
  messages: unknown,
  opts: { maxLength?: number } = {},
): { ok: boolean; error?: string } {
  const maxLength = opts.maxLength ?? 8000;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "Messages array is required" };
  }

  for (const msg of messages as Message[]) {
    if (!msg || typeof msg !== "object") {
      return { ok: false, error: "Invalid message format" };
    }
    if (typeof msg.content !== "string" || msg.content.length === 0) {
      return { ok: false, error: "Message content must be a non-empty string" };
    }
    if (msg.content.length > maxLength) {
      return { ok: false, error: `Message exceeds max length (${maxLength})` };
    }
    if (msg.role !== "user" && msg.role !== "assistant" && msg.role !== "system") {
      return { ok: false, error: "Invalid message role" };
    }
  }

  return { ok: true };
}

describe("validateMessages", () => {
  it("rejeita array vazio", () => {
    expect(validateMessages([]).ok).toBe(false);
  });

  it("rejeita undefined/null", () => {
    expect(validateMessages(undefined).ok).toBe(false);
    expect(validateMessages(null).ok).toBe(false);
  });

  it("rejeita não-array", () => {
    expect(validateMessages({ role: "user", content: "hi" }).ok).toBe(false);
  });

  it("rejeita content vazio", () => {
    expect(validateMessages([{ role: "user", content: "" }]).ok).toBe(false);
  });

  it("rejeita content não-string", () => {
    // @ts-expect-error - proposital
    expect(validateMessages([{ role: "user", content: 42 }]).ok).toBe(false);
  });

  it("rejeita role inválido (proteção anti-injection)", () => {
    expect(validateMessages([{ role: "developer", content: "hi" }]).ok).toBe(false);
    expect(validateMessages([{ role: "tool", content: "hi" }]).ok).toBe(false);
  });

  it("aceita user/assistant/system", () => {
    expect(validateMessages([{ role: "user", content: "hi" }]).ok).toBe(true);
    expect(validateMessages([{ role: "assistant", content: "hi" }]).ok).toBe(true);
    expect(validateMessages([{ role: "system", content: "hi" }]).ok).toBe(true);
  });

  it("rejeita content acima de maxLength", () => {
    const big = "a".repeat(9000);
    expect(validateMessages([{ role: "user", content: big }]).ok).toBe(false);
  });

  it("respeita maxLength customizado", () => {
    expect(validateMessages([{ role: "user", content: "hello" }], { maxLength: 3 }).ok).toBe(false);
    expect(validateMessages([{ role: "user", content: "hi" }], { maxLength: 3 }).ok).toBe(true);
  });
});
