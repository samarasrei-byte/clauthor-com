/**
 * OnboardingPremium · surface completo · monta tudo dentro de um Provider.
 * Uso:
 *   <OnboardingPremium subjectType="squad" subjectRef="reputacao" subjectName="Reputação" />
 */
import type { SubjectType } from "@/hooks/useCustomerOnboarding";
import { OnboardingProvider } from "./OnboardingProvider";
import { WelcomeModal } from "./WelcomeModal";
import { ThorDrawer } from "./ThorDrawer";
import { TourOverlay } from "./TourOverlay";
import { TestStep } from "./TestStep";
import { SuccessAnimation } from "./SuccessAnimation";
import { FloatingThor } from "./FloatingThor";

interface OnboardingPremiumProps {
  subjectType: SubjectType;
  subjectRef: string;
  subjectName?: string;
  children?: React.ReactNode;
}

export function OnboardingPremium({
  subjectType,
  subjectRef,
  subjectName,
  children,
}: OnboardingPremiumProps) {
  return (
    <OnboardingProvider
      subjectType={subjectType}
      subjectRef={subjectRef}
      subjectName={subjectName}
    >
      {children}
      <WelcomeModal />
      <ThorDrawer />
      <TourOverlay />
      <TestStep />
      <SuccessAnimation />
      <FloatingThor />
    </OnboardingProvider>
  );
}

export default OnboardingPremium;
export { useOnboarding, useOnboardingSafe } from "./OnboardingProvider";
export { HelpBubble, useFirstVisit } from "./HelpBubble";
