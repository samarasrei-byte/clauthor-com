import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import RevolutionaryOnboarding from "./RevolutionaryOnboarding";

export default function RevolutionaryOnboardingGate() {
  const { isOpen, skip, save } = useGuidedOnboarding();

  return (
    <RevolutionaryOnboarding
      isOpen={isOpen}
      onSkip={() => skip()}
      onComplete={() => save({ path: "agent" })}
    />
  );
}
