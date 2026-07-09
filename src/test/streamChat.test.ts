/**
 * Contrato de erros do helper `streamAIChat`
 * (`supabase/functions/_shared/streamChat.ts`).
 *
 * O arquivo real vive no runtime Deno (imports `.ts`), então espelhamos
 * a lógica pura de mapeamento de status aqui para travar o contrato
 * observável pelo cliente: 429 → rate limit, 402 → créditos + upgrade,
 * demais falhas upstream → 502 genérico.
 */
import { describe, it, expect } from "vitest";

interface UpstreamLike {
  ok: boolean;
  status: number;
  text?: () => Promise<string>;
}

interface MappedError {
  status: number;
  body: { error: string; suggest_upgrade?: boolean };
}

function mapUpstreamError(upstream: UpstreamLike): MappedError | null {
  if (upstream.ok) return null;
  if (upstream.status === 429) {
    return {
      status: 429,
      body: { error: "Rate limit exceeded. Tente novamente em instantes." },
    };
  }
  if (upstream.status === 402) {
    return {
      status: 402,
      body: {
        error: "Créditos esgotados. Recarregue seu workspace.",
        suggest_upgrade: true,
      },
    };
  }
  return { status: 502, body: { error: `AI gateway error: ${upstream.status}` } };
}

describe("streamAIChat error contract", () => {
  it("passes through on ok=true", () => {
    expect(mapUpstreamError({ ok: true, status: 200 })).toBeNull();
  });

  it("maps 429 → 429 rate-limit response", () => {
    const r = mapUpstreamError({ ok: false, status: 429 })!;
    expect(r.status).toBe(429);
    expect(r.body.error).toMatch(/Rate limit/i);
    expect(r.body.suggest_upgrade).toBeUndefined();
  });

  it("maps 402 → 402 credits + suggest_upgrade flag", () => {
    const r = mapUpstreamError({ ok: false, status: 402 })!;
    expect(r.status).toBe(402);
    expect(r.body.suggest_upgrade).toBe(true);
    expect(r.body.error).toMatch(/Cr[eé]ditos/i);
  });

  it("maps 500-class upstream errors → generic 502 (gateway error)", () => {
    for (const status of [500, 502, 503, 504]) {
      const r = mapUpstreamError({ ok: false, status })!;
      expect(r.status).toBe(502);
      expect(r.body.error).toContain(String(status));
    }
  });

  it("maps unexpected 4xx (not 429/402) → generic 502", () => {
    const r = mapUpstreamError({ ok: false, status: 418 })!;
    expect(r.status).toBe(502);
    expect(r.body.error).toContain("418");
  });

  it("never leaks suggest_upgrade for non-402 errors", () => {
    for (const status of [429, 500, 418]) {
      const r = mapUpstreamError({ ok: false, status })!;
      expect(r.body.suggest_upgrade).toBeUndefined();
    }
  });
});
