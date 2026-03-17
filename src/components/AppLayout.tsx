import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import CommandBar from "./CommandBar";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import AgentLivePreview from "./library/AgentLivePreview";

const AppLayout = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [testDriveAgent, setTestDriveAgent] = useState<{ key: string; name: string } | null>(null);

  const handleTestDrive = (key: string, name: string) => {
    setTestDriveAgent({ key, name });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
      <CommandBar onOpenTestDrive={handleTestDrive} />
      
      <OnboardingWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
      <AgentLivePreview
        agentName={testDriveAgent?.name || ""}
        agentDesc="Converse com este agente antes de contratar"
        isOpen={!!testDriveAgent}
        onClose={() => setTestDriveAgent(null)}
      />
    </div>
  );
};

export default AppLayout;
