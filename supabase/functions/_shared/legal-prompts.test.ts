// Deno tests - run pre-deploy to guarantee OAB-compliant prompts.
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  LEGAL_AGENT_PROMPTS,
  REQUIRED_LEGAL_SLUGS,
  OAB_REQUIRED_MARKERS,
  LEGAL_PROMPTS_VERSION,
  getLegalPrompt,
  validateLegalPrompts,
} from "./legal-prompts.ts";

Deno.test("All required legal slugs have a prompt registered", () => {
  for (const slug of REQUIRED_LEGAL_SLUGS) {
    assert(
      typeof LEGAL_AGENT_PROMPTS[slug] === "string" && LEGAL_AGENT_PROMPTS[slug].length > 200,
      `Missing or too-short prompt for slug: ${slug}`,
    );
  }
});

Deno.test("Every legal prompt contains all OAB required markers", () => {
  for (const slug of REQUIRED_LEGAL_SLUGS) {
    const prompt = LEGAL_AGENT_PROMPTS[slug];
    for (const marker of OAB_REQUIRED_MARKERS) {
      assert(
        prompt.includes(marker),
        `Slug "${slug}" missing OAB marker: "${marker}"`,
      );
    }
  }
});

Deno.test("Legal prompts must NOT contain forbidden promise phrases", () => {
  // Sanity: prompts may QUOTE these as forbidden, so we only fail if the phrase
  // appears OUTSIDE a "NÃO" / "NUNCA" / proibido context (rough heuristic).
  const forbidden = ["garantimos vitória", "100% de sucesso"];
  for (const slug of REQUIRED_LEGAL_SLUGS) {
    const prompt = LEGAL_AGENT_PROMPTS[slug].toLowerCase();
    for (const f of forbidden) {
      assert(!prompt.includes(f), `Slug "${slug}" contains forbidden phrase: "${f}"`);
    }
  }
});

Deno.test("getLegalPrompt returns null for unknown slugs", () => {
  assertEquals(getLegalPrompt(null), null);
  assertEquals(getLegalPrompt(""), null);
  assertEquals(getLegalPrompt("not_a_legal_agent"), null);
});

Deno.test("getLegalPrompt returns full prompt for every required slug", () => {
  for (const slug of REQUIRED_LEGAL_SLUGS) {
    const p = getLegalPrompt(slug);
    assert(p && p.includes("CÓDIGO DE ÉTICA OAB"), `getLegalPrompt failed for ${slug}`);
  }
});

Deno.test("validateLegalPrompts() reports OK for current bundle", () => {
  const r = validateLegalPrompts();
  assertEquals(r.missingSlugs, []);
  assertEquals(r.nonCompliantSlugs, []);
  assertEquals(r.ok, true);
  assert(r.version === LEGAL_PROMPTS_VERSION);
});
