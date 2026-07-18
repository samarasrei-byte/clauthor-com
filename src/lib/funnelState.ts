// Persistência da jornada "escolheu squad → pagou".
// Frontend-only: localStorage guarda o passo atual e o contexto do
// departamento/squad escolhido para permitir retomar exatamente onde parou.

export type FunnelStep = "squad" | "empresa" | "conta" | "pagar" | "done";

export const FUNNEL_STEPS: { id: FunnelStep; label: string; short: string }[] = [
  { id: "squad", label: "Escolher time", short: "Squad" },
  { id: "empresa", label: "Sua empresa", short: "Empresa" },
  { id: "conta", label: "Criar conta", short: "Conta" },
  { id: "pagar", label: "Ativar", short: "Pagar" },
];

export interface FunnelState {
  step: FunnelStep;
  departmentId?: string;
  departmentLabel?: string;
  entry?: "squad" | "thor";
  updatedAt: number;
}

const KEY = "clauthor:funnel";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

export function readFunnel(): FunnelState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FunnelState;
    if (!parsed?.step || Date.now() - (parsed.updatedAt ?? 0) > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeFunnel(patch: Partial<FunnelState>): FunnelState {
  const current = readFunnel() ?? { step: "squad" as FunnelStep, updatedAt: Date.now() };
  const next: FunnelState = { ...current, ...patch, updatedAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore quota */ }
  return next;
}

export function clearFunnel() {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function stepIndex(step: FunnelStep): number {
  const idx = FUNNEL_STEPS.findIndex((s) => s.id === step);
  return idx === -1 ? 0 : idx;
}

export function nextStepRoute(step: FunnelStep, deptId?: string): string {
  switch (step) {
    case "squad": return deptId ? `/contratar/${deptId}` : "/departamentos";
    case "empresa": return "/onboarding-zero";
    case "conta": return "/auth?signup=1";
    case "pagar": return "/dashboard?activate=1";
    default: return "/dashboard";
  }
}
