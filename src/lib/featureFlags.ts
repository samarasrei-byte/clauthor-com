/**
 * Feature flags · controlled via VITE_FEATURE_* env vars.
 * Default = false para superfícies experimentais/incompletas, evitando expor
 * módulos que ainda não estão em GA. Setar VITE_FEATURE_<NAME>=1 no .env local
 * ou em produção para reativar.
 *
 * Filosofia: reduzir a superfície do produto para foco em Marketplace de
 * Agentes + Departamentos (core). Módulos em preview ficam ocultos até GA.
 */

type FlagKey =
  | "hunter"       // Hunter LinkedIn suite (7 rotas)
  | "mcp"          // MCP Server marketing page
  | "scrum"        // ScrumBoard interno
  | "neural"       // AgentNeuralNetwork visualization
  | "timeline"     // ProjectTimeline
  | "architecture" // Architecture page
  | "art_director" // ArtDirector standalone
  | "team_builder";// TeamBuilder standalone

const DEFAULTS: Record<FlagKey, boolean> = {
  hunter: false,
  mcp: false,
  scrum: false,
  neural: false,
  timeline: false,
  architecture: false,
  art_director: false,
  team_builder: false,
};

function readEnv(key: FlagKey): boolean | null {
  const envKey = `VITE_FEATURE_${key.toUpperCase()}`;
  const raw = (import.meta.env as Record<string, string | undefined>)[envKey];
  if (raw === undefined) return null;
  return raw === "1" || raw === "true";
}

export function isFeatureEnabled(key: FlagKey): boolean {
  const fromEnv = readEnv(key);
  if (fromEnv !== null) return fromEnv;
  return DEFAULTS[key];
}

export const FEATURE_FLAGS: Record<FlagKey, boolean> = Object.fromEntries(
  (Object.keys(DEFAULTS) as FlagKey[]).map((k) => [k, isFeatureEnabled(k)])
) as Record<FlagKey, boolean>;
