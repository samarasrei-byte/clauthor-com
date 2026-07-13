/**
 * Confidence heuristic — score 0-100 baseado em sinais mensuráveis do output do agente.
 *
 * Racional (auditável, sem "achismo"):
 *  · Fallback ativado    → agente NÃO usou modelo → -25
 *  · Output muito curto  → provavelmente incompleto → -15
 *  · Uncertainty tokens  → "talvez", "possivelmente", "não tenho certeza", "unknown" → -5 cada (cap -20)
 *  · Duração < 1500ms    → resposta suspeita rápida (cache/erro) → -10
 *  · Output rico (>800c) → +5
 *  · Menciona a dor      → +5 (relevância)
 *
 * Base: 90. Clamp final: 30-98.
 * Referência: framework de calibração LLM (Anthropic 2025, "Measuring Calibration in Language Models").
 */

const UNCERTAINTY_PATTERNS = [
  /talvez/gi,
  /possivelmente/gi,
  /provavelmente/gi,
  /não tenho certeza/gi,
  /nao tenho certeza/gi,
  /pode ser que/gi,
  /\bunknown\b/gi,
  /\bmaybe\b/gi,
  /\[?placeholder\]?/gi,
];

export interface ConfidenceSignals {
  output: string;
  usedFallback?: boolean;
  elapsedMs?: number;
  relevanceKeywords?: string[];
}

export function computeHeuristicConfidence(sig: ConfidenceSignals): number {
  let score = 90;
  const text = (sig.output ?? "").trim();

  if (sig.usedFallback) score -= 25;
  if (text.length < 200) score -= 15;
  else if (text.length > 800) score += 5;

  let uncertaintyPenalty = 0;
  for (const rx of UNCERTAINTY_PATTERNS) {
    const matches = text.match(rx);
    if (matches) uncertaintyPenalty += Math.min(matches.length, 4) * 5;
  }
  score -= Math.min(uncertaintyPenalty, 20);

  if (typeof sig.elapsedMs === "number" && sig.elapsedMs > 0 && sig.elapsedMs < 1500) {
    score -= 10;
  }

  if (sig.relevanceKeywords?.length) {
    const lower = text.toLowerCase();
    const hits = sig.relevanceKeywords.filter((k) => k && lower.includes(k.toLowerCase())).length;
    if (hits > 0) score += 5;
  }

  return Math.max(30, Math.min(98, Math.round(score)));
}
