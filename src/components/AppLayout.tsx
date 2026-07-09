import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import AgentLivePreview from "./library/AgentLivePreview";
import { supabase } from "@/integrations/supabase/client";
const ThorGreeter = lazy(() => import("./ThorGreeter"));
const SocialProofToasts = lazy(() => import("./SocialProofToasts"));
const ExitIntentCapture = lazy(() => import("./ExitIntentCapture"));
const JourneyProgressBar = lazy(() => import("./JourneyProgressBar"));
const SoundWaveIntro = lazy(() => import("./intro/SoundWaveIntro"));
const PlatformUpdatesDialog = lazy(() => import("./PlatformUpdatesDialog"));
const ThorDailyGreeting = lazy(() => import("./ThorDailyGreeting"));
const RevolutionaryOnboarding = lazy(() => import("./onboarding/RevolutionaryOnboarding"));

const THOR_HIDDEN_ROUTES = ["/pitch"];

const AppLayout = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const showThor = !THOR_HIDDEN_ROUTES.includes(location.pathname);
  const isHomePage = location.pathname === "/";

  // Cinematic intro disabled for now
  const showIntro = false;
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Cinematic intro overlay */}
      {/* Intro desativada temporariamente */}
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      
      <OnboardingWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
      <AgentLivePreview
        agentName={testDriveAgent?.name || ""}
        agentDesc="Converse com este agente antes de contratar"
        isOpen={!!testDriveAgent}
        onClose={() => setTestDriveAgent(null)}
      />

      {/* Platform updates + token info popup (once per version, authenticated users) */}
      <Suspense fallback={null}>
        <PlatformUpdatesDialog />
      </Suspense>

      {/* Revolutionary first-interaction experience */}
      <Suspense fallback={null}>
        <RevolutionaryOnboardingGate />
      </Suspense>

      {/* Thor daily greeting with token balance and top-up nudge */}
      <Suspense fallback={null}>
        <ThorDailyGreeting />
      </Suspense>

      {/* Thor greeter removido a pedido — estava sobrepondo o chat Ana - Atendimento */}



    </div>
  );
};

export default AppLayout;
