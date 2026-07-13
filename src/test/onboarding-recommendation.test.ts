import { describe, it, expect } from "vitest";
import { recommend } from "@/lib/onboarding-recommendation";

describe("onboarding-recommendation", () => {
  it("recommends department for larger companies", () => {
    const r = recommend({ pain: "leads_vendas", sector: "SaaS", size: "50+", familiarity: "avancado" });
    expect(r.primary.kind).toBe("department");
    expect(r.primary.href).toContain("/departamentos/");
  });

  it("recommends squad for small teams", () => {
    const r = recommend({ pain: "conteudo", sector: "Agência", size: "2-10", familiarity: "intermediario" });
    expect(r.primary.kind).toBe("squad");
    expect(r.primary.href).toContain("/team-builder");
  });

  it("recommends squad for solo operators", () => {
    const r = recommend({ pain: "atendimento", sector: "E-commerce", size: "solo", familiarity: "iniciante" });
    expect(r.primary.kind).toBe("squad");
    expect(r.primary.pitch).toMatch(/guiada/);
  });

  it("returns 2 alternatives", () => {
    const r = recommend({ pain: "juridico", sector: "Advocacia", size: "11-50", familiarity: "avancado" });
    expect(r.alternatives.length).toBe(2);
  });
});
