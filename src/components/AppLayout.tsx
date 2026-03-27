import { useState, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import AgentLivePreview from "./library/AgentLivePreview";

const ThorGreeter = lazy(() => import("./ThorGreeter"));

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

      {/* Thor — immersive AI greeter & persistent guide (hidden on pitch page) */}
      {showThor && (
        <Suspense fallback={null}>
          <ThorGreeter />
        </Suspense>
      )}
    </div>
  );
};

export default AppLayout;
