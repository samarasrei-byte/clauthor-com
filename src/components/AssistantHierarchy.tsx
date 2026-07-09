import { lazy, Suspense } from "react";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import RevolutionaryOnboarding from "./onboarding/RevolutionaryOnboarding";

const PlatformUpdatesDialog = lazy(() => import("./PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("./ThorDailyGreeting"));

/**
 * Hierarquia de assistentes — só UM canal fala com o usuário por vez.
 *
 * 1º contato (onboarding pendente) → APENAS Thor via RevolutionaryOnboarding.
 * Onboarding concluído → ThorDailyGreeting + PlatformUpdatesDialog liberados.
 * Enquanto carrega o perfil → silêncio (nada pisca).
 */
export default function AssistantHierarchy() {
  const { isOpen, skip, save, loading, answers } = useGuidedOnboarding();

  // Ainda descobrindo se é primeiro acesso — não mostra nada.
  if (loading) return null;

  const firstContact = isOpen || !answers;

  if (firstContact) {
    // Único canal ativo: Thor guiando o onboarding.
    return (
      <RevolutionaryOnboarding
        isOpen={isOpen}
        onSkip={() => skip()}
        onComplete={() => save({ path: "agent" })}
      />
    );
  }

  // Usuário retornante: greeting diário + updates de plataforma.
  return (
    <>
      <Suspense fallback={null}>
        <ThorDailyGreeting />
      </Suspense>
      <Suspense fallback={null}>
        <PlatformUpdatesDialog />
      </Suspense>
    </>
  );
}
