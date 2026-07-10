import { Navigate } from "react-router-dom";
import { isFeatureEnabled } from "@/lib/featureFlags";
import type { ReactNode } from "react";

interface FeatureGateProps {
  flag:
    | "hunter"
    | "mcp"
    | "scrum"
    | "neural"
    | "timeline"
    | "architecture"
    | "art_director"
    | "team_builder";
  children: ReactNode;
  /** Rota de fallback quando a feature está desligada. */
  fallback?: string;
}

/**
 * Bloqueia acesso a rotas de módulos em preview. Se o flag estiver desligado,
 * redireciona pro fallback (default: /dashboard para rotas autenticadas, / pra
 * públicas). Uso: <FeatureGate flag="hunter"><HunterDashboard /></FeatureGate>
 */
const FeatureGate = ({ flag, children, fallback = "/dashboard" }: FeatureGateProps) => {
  if (!isFeatureEnabled(flag)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
};

export default FeatureGate;
