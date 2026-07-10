import { lazy, Suspense, useEffect, useState } from "react";
import { useGuidedOnboarding } from "@/hooks/useGuidedOnboarding";

const PlatformUpdatesDialog = lazy(() => import("./PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("./ThorDailyGreeting"));

// Deve bater com CURRENT_VERSION em PlatformUpdatesDialog.tsx.
const CURRENT_UPDATES_VERSION = "2026.07.08";
const UPDATES_STORAGE_KEY = `clauthor-updates-seen-${CURRENT_UPDATES_VERSION}`;

/**
 * Hierarquia de assistentes — só UM canal fala com o usuário por vez.
 *
 * O primeiro contato (onboarding pendente) agora vive na rota dedicada
 * `/welcome`, para onde o signup redireciona. Aqui cuidamos apenas de:
 *
 * - Retornante COM update novo   → PlatformUpdatesDialog.
 * - Retornante SEM update novo   → ThorDailyGreeting.
 * - Enquanto carrega o perfil    → silêncio (nada pisca).
 * - Sem onboarding concluído     → silêncio (banner cuida da retomada).
 */
export default function AssistantHierarchy() {
  const { loading, answers } = useGuidedOnboarding();
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

  // Primeiro contato sem respostas: não abre modal aqui — /welcome + banner
  // conduzem a jornada.
  if (!answers) return null;

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

