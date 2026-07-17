/**
 * Guarda-corpo pré-deploy: garante que `src/lib/pricing.ts` (fonte da UI)
 * está 100% sincronizado com `supabase/functions/_shared/plan-catalog.ts`
 * (fonte de verdade do checkout no edge function).
 *
 * Qualquer divergência = falha de build/CI · previne o erro
 * `price_mismatch` em produção.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { regionalPricing } from "@/lib/pricing";

/** Extrai DEPARTMENT_CATALOG do plan-catalog.ts server sem executar o arquivo (é Deno). */
function loadServerCatalog(): Record<string, { amount: number; currency: string }> {
  const filePath = path.resolve(
    __dirname,
    "../../supabase/functions/_shared/plan-catalog.ts",
  );
  const src = fs.readFileSync(filePath, "utf8");
  const match = src.match(/DEPARTMENT_CATALOG[^=]*=\s*\{([\s\S]*?)^};/m);
  if (!match) throw new Error("DEPARTMENT_CATALOG block not found in plan-catalog.ts");
  const body = match[1];
  const entries: Record<string, { amount: number; currency: string }> = {};
  const re =
    /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{\s*amount:\s*(\d+)\s*,\s*currency:\s*"([A-Z]{3})"/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    entries[m[1]] = { amount: Number(m[2]), currency: m[3] };
  }
  return entries;
}

describe("pricing catalog sync · client ↔ server", () => {
  const server = loadServerCatalog();
  const clientBRL = regionalPricing.pt.departments;

  it("server catalog carrega e contém as chaves mínimas esperadas", () => {
    expect(Object.keys(server).length).toBeGreaterThanOrEqual(8);
    // Sanity: chaves core precisam existir
    for (const key of ["tecnologia", "comercial", "marketing", "atendimento", "financeiro", "juridico", "rh"]) {
      expect(server[key], `server catalog está sem '${key}'`).toBeDefined();
      expect(server[key].currency).toBe("BRL");
    }
  });

  // Testa cada chave do cliente contra o servidor (source of truth p/ checkout).
  const clientKeys = Object.keys(clientBRL) as Array<keyof typeof clientBRL>;
  it.each(clientKeys)(
    "cliente BRL '%s' bate com o catálogo do servidor",
    (key) => {
      const clientPrice = clientBRL[key];
      const serverEntry = server[key as string];
      // Chaves só-cliente (aliases legados como 'criacao', 'suporte') podem
      // não existir no servidor · nesse caso, o checkout usa outro slug e
      // não há como divergir. Pulamos a comparação nesse caso.
      if (!serverEntry) return;
      expect(
        clientPrice,
        `Mismatch para '${key}': cliente=${clientPrice} servidor=${serverEntry.amount}. ` +
          "Corrija src/lib/pricing.ts OU supabase/functions/_shared/plan-catalog.ts.",
      ).toBe(serverEntry.amount);
    },
  );

  it("alias 'atendimento' == 'suporte' no cliente (mesmo departamento)", () => {
    expect(clientBRL.atendimento).toBe(clientBRL.suporte);
  });

  it("todas as chaves do cliente que existem no servidor usam a mesma moeda (BRL)", () => {
    for (const key of clientKeys) {
      const serverEntry = server[key as string];
      if (!serverEntry) continue;
      expect(serverEntry.currency, `'${key}' deveria ser BRL no servidor`).toBe("BRL");
    }
  });
});
