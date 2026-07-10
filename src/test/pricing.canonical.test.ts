import { describe, it, expect } from "vitest";
import { getRegion, regionalPricing } from "@/lib/pricing";
import { CANONICAL } from "@/lib/canonical-copy";

/**
 * Trava contra regressão dos preços âncora canônicos.
 * Se estes valores divergirem, landing/ROIBenchmark/planos ficam desalinhados.
 */
describe("pricing — canonical anchor", () => {
  it("pt (BRL) starter = CANONICAL.agent.monthly.BRL", () => {
    const r = getRegion("pt");
    expect(r.plans.starter).toBe(CANONICAL.agent.monthly.BRL);
    expect(r.comparison.agentStarting).toBe(CANONICAL.agent.monthly.BRL);
    expect(r.comparison.avgSalary).toBe(CANONICAL.clt.monthly.BRL);
  });

  it("en (USD) starter = CANONICAL.agent.monthly.USD", () => {
    const r = getRegion("en");
    expect(r.plans.starter).toBe(CANONICAL.agent.monthly.USD);
    expect(r.comparison.agentStarting).toBe(CANONICAL.agent.monthly.USD);
    expect(r.comparison.avgSalary).toBe(CANONICAL.clt.monthly.USD);
  });

  it("es (USD) espelha en", () => {
    expect(getRegion("es").plans.starter).toBe(CANONICAL.agent.monthly.USD);
  });

  it("todos os locales: agentStarting == plans.starter (anchor premium)", () => {
    for (const [lang, r] of Object.entries(regionalPricing)) {
      expect(
        r.comparison.agentStarting,
        `${lang}: agentStarting deve == plans.starter`,
      ).toBe(r.plans.starter);
    }
  });

  it("todos os locales: agentYear3 == agentStarting * 36", () => {
    for (const [lang, r] of Object.entries(regionalPricing)) {
      expect(
        r.comparison.agentYear3,
        `${lang}: agentYear3 deve == agentStarting * 36`,
      ).toBe(r.comparison.agentStarting * 36);
    }
  });

  it("todos os locales: growth > starter (upsell coerente)", () => {
    for (const [lang, r] of Object.entries(regionalPricing)) {
      expect(r.plans.growth, `${lang}`).toBeGreaterThan(r.plans.starter);
    }
  });
});
