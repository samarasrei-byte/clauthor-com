import { useState, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import AgentLivePreview from "./library/AgentLivePreview";

const ThorPageTour = lazy(() => import("./ThorPageTour"));
import { FULL_PLATFORM_TOUR } from "@/data/pageTourSteps";

const THOR_HIDDEN_ROUTES = ["/pitch"];

const AppLayout = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);
  const location = useLocation();
  const showThor = !THOR_HIDDEN_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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

      {/* Thor Guide — floating orb (hidden on pitch page) */}
      {showThor && (
        <Suspense fallback={null}>
          <ThorPageTour
            steps={FULL_PLATFORM_TOUR}
            storageKey="clauthor_page_tour_v2"
          />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
