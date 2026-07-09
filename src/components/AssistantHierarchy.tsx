import { lazy, Suspense, useEffect, useState } from "react";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";
import RevolutionaryOnboarding from "./onboarding/RevolutionaryOnboarding";

const PlatformUpdatesDialog = lazy(() => import("./PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("./ThorDailyGreeting"));

// Deve bater com CURRENT_VERSION em PlatformUpdatesDialog.tsx.
const CURRENT_UPDATES_VERSION = "2026.07.08";
const UPDATES_STORAGE_KEY = `clauthor-updates-seen-${CURRENT_UPDATES_VERSION}`;

/**
 * Hierarquia de assistentes — só UM canal fala com o usuário por vez.
 *
 * 1º contato (onboarding pendente) → APENAS Thor via RevolutionaryOnboarding.
 * Retornante COM update novo         → APENAS PlatformUpdatesDialog.
 * Retornante SEM update novo         → ThorDailyGreeting.
 * Enquanto carrega o perfil          → silêncio (nada pisca).
 */
export default function AssistantHierarchy() {
  const { isOpen, skip, save, loading, answers } = useGuidedOnboarding();
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") { setHasUnseenUpdate(false); return; }
    try {
      setHasUnseenUpdate(!localStorage.getItem(UPDATES_STORAGE_KEY));
    } catch {
      setHasUnseenUpdate(false);
    }
  }, []);

  if (loading || hasUnseenUpdate === null) return null;

  const firstContact = isOpen || !answers;
  if (firstContact) {
    return (
      <RevolutionaryOnboarding
        isOpen={isOpen}
        onSkip={() => skip()}
        onComplete={() => save({ path: "agent" })}
      />
    );
  }

  // Retornante: nunca abrir dois modais ao mesmo tempo.
  if (hasUnseenUpdate) {
    return (
      <Suspense fallback={null}>
        <PlatformUpdatesDialog />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={null}>
      <ThorDailyGreeting />
    </Suspense>
  );
}
