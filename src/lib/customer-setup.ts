import type { NavigateFunction } from "react-router-dom";
import type { SubjectType } from "@/hooks/useCustomerOnboarding";

/**
 * Chame logo após confirmar a contratação de um agente, squad ou departamento.
 * Redireciona o cliente para o wizard de setup guiado.
 *
 * @example
 *   startCustomerSetup(navigate, "squad", "growth-engine", "Growth Engine Alpha");
 */
export function startCustomerSetup(
  navigate: NavigateFunction,
  subjectType: SubjectType,
  subjectRef: string,
  subjectName?: string,
) {
  const params = new URLSearchParams();
  if (subjectName) params.set("name", subjectName);
  const query = params.toString();
  navigate(`/setup/${subjectType}/${encodeURIComponent(subjectRef)}${query ? `?${query}` : ""}`);
}
