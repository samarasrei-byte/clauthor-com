import { useParams, useSearchParams, Navigate } from "react-router-dom";
import CustomerOnboardingWizard from "@/components/onboarding/CustomerOnboardingWizard";
import type { SubjectType } from "@/hooks/useCustomerOnboarding";

const VALID: SubjectType[] = ["agent", "squad", "department"];

export default function CustomerSetup() {
  const { type, ref } = useParams<{ type: string; ref: string }>();
  const [sp] = useSearchParams();
  const name = sp.get("name") ?? undefined;

  if (!type || !ref || !VALID.includes(type as SubjectType)) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <CustomerOnboardingWizard
      subjectType={type as SubjectType}
      subjectRef={ref}
      subjectName={name}
    />
  );
}
