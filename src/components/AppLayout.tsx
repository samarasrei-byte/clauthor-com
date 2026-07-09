import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
// OnboardingWizard legado removido.
import AgentLivePreview from "./library/AgentLivePreview";
import { supabase } from "@/integrations/supabase/client";
const ThorGreeter = lazy(() => import("./ThorGreeter"));
const SocialProofToasts = lazy(() => import("./SocialProofToasts"));
const ExitIntentCapture = lazy(() => import("./ExitIntentCapture"));
const JourneyProgressBar = lazy(() => import("./JourneyProgressBar"));
const SoundWaveIntro = lazy(() => import("./intro/SoundWaveIntro"));
const PlatformUpdatesDialog = lazy(() => import("./PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("./ThorDailyGreeting"));
const RevolutionaryOnboardingGate = lazy(() => import("./onboarding/RevolutionaryOnboardingGate"));

const THOR_HIDDEN_ROUTES = ["/pitch"];

const AppLayout = () => {
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const showThor = !THOR_HIDDEN_ROUTES.includes(location.pathname);
  const isHomePage = location.pathname === "/";

  // Adiar hidratação de add-ons não-críticos (dialogs, greeter, gate) até o
  // browser sinalizar idle — libera o LCP da rota atual primeiro.
  const [addonsReady, setAddonsReady] = useState(false);
  useEffect(() => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setAddonsReady(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setAddonsReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>

      <AgentLivePreview
        agentName={testDriveAgent?.name || ""}
        agentDesc="Converse com este agente antes de contratar"
        isOpen={!!testDriveAgent}
        onClose={() => setTestDriveAgent(null)}
      />

      {addonsReady && (
        <>
          {/* Platform updates + token info popup (uma vez por versão, autenticados) */}
          <Suspense fallback={null}>
            <PlatformUpdatesDialog />
          </Suspense>

          {/* Revolutionary first-interaction experience */}
          <Suspense fallback={null}>
            <RevolutionaryOnboardingGate />
          </Suspense>

          {/* Thor daily greeting com saldo de tokens e top-up nudge */}
          <Suspense fallback={null}>
            <ThorDailyGreeting />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default AppLayout;
