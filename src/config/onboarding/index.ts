import type { OnboardingFlow } from "@/components/onboarding-premium/types";
import type { SubjectType } from "@/hooks/useCustomerOnboarding";
import { defaultSquadFlow } from "./default-squad";
import { defaultDepartmentFlow } from "./default-department";
import { defaultAgentFlow } from "./default-agent";
import { reputacaoFlow } from "./reputacao";
import { comercialFlow } from "./comercial";
import { financeiroFlow } from "./financeiro";
import { rhFlow } from "./rh";

const SPECIALIZED: OnboardingFlow[] = [
  reputacaoFlow,
  comercialFlow,
  financeiroFlow,
  rhFlow,
];

const DEFAULTS: Record<SubjectType, OnboardingFlow> = {
  squad: defaultSquadFlow,
  department: defaultDepartmentFlow,
  agent: defaultAgentFlow,
};

/**
 * Resolve o fluxo de onboarding pelo subjectType + subjectRef.
 * Especializados batem primeiro (por matchRef); senão cai no default do type.
 */
export function resolveOnboardingFlow(
  subjectType: SubjectType,
  subjectRef: string,
): OnboardingFlow {
  const match = SPECIALIZED.find((f) => {
    if (f.subjectType !== subjectType) return false;
    if (!f.matchRef) return false;
    if (typeof f.matchRef === "string") return f.matchRef === subjectRef;
    return f.matchRef.test(subjectRef);
  });
  return match ?? DEFAULTS[subjectType];
}

export {
  defaultSquadFlow,
  defaultDepartmentFlow,
  defaultAgentFlow,
  reputacaoFlow,
  comercialFlow,
  financeiroFlow,
  rhFlow,
};
