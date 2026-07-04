import { lazy, Suspense } from "react";
import SectionLoader from "@/components/ui/section-loader";

const AgentLiveTimeline = lazy(() => import("./AgentLiveTimeline"));
const HolographicMeetingRoom = lazy(() => import("./HolographicMeetingRoom"));
const Library = lazy(() => import("@/pages/Library"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const ComingSoonSection = lazy(() => import("./ComingSoonSection"));
const OperationsCenter = lazy(() => import("./OperationsCenter"));
const InsightsHub = lazy(() => import("./InsightsHub"));
const KanbanBoard = lazy(() => import("./KanbanBoard"));
const CompanyHub = lazy(() => import("./CompanyHub"));
const ContentPipelinePanel = lazy(() => import("./ContentPipelinePanel"));
const DeliverablesHub = lazy(() => import("./DeliverablesHub"));
const SalesCallTranscriber = lazy(() => import("./SalesCallTranscriber"));
const SquadManager = lazy(() => import("./SquadManager"));
const BulkAgentProvisioner = lazy(() => import("./BulkAgentProvisioner"));
const AgentNeuralNetwork = lazy(() => import("@/pages/AgentNeuralNetwork"));
const ScrumBoard = lazy(() => import("@/pages/ScrumBoard"));
const AgentsSection = lazy(() => import("./AgentsSection"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const PaymentHistoryTable = lazy(() => import("./PaymentHistoryTable"));
const UnifiedInbox = lazy(() => import("./UnifiedInbox"));
const AgentReplay = lazy(() => import("./AgentReplay"));
const PredictiveDashboard = lazy(() => import("./PredictiveDashboard"));
const AgentDNA = lazy(() => import("./AgentDNA"));
const MissionComposer = lazy(() => import("./MissionComposer"));
const WarRoomLive = lazy(() => import("./WarRoomLive"));
const IntelligenceHub = lazy(() => import("./IntelligenceHub"));
const ApprovalsCenter = lazy(() => import("./ApprovalsCenter"));
const FilesLibrary = lazy(() => import("./FilesLibrary"));
const BenchmarksPanel = lazy(() => import("./BenchmarksPanel"));
const WorkspaceHub = lazy(() => import("./WorkspaceHub"));

interface Props {
  activeSection: string;
  realChartData: any[];
  totalExecutions: number;
  recentLogs: any[];
  locale: string;
  agents: any[];
  loadingAgents: boolean;
  nameToSlug: Record<string, string>;
  tierColors: any;
  formatCurrency: (v: number) => string;
  billingContent: React.ReactNode;
  onNavigate: (id: string) => void;
  onSetActiveSection: (s: string) => void;
  onSelectAgent: (agent: { id: string; name: string }) => void;
  onSetupCompany: () => void;
}

const DashboardSectionRenderer = ({
  activeSection, realChartData, totalExecutions, recentLogs, locale,
  agents, loadingAgents, nameToSlug, tierColors, formatCurrency,
  billingContent, onNavigate, onSetActiveSection, onSelectAgent, onSetupCompany,
}: Props) => {
  return (
    <>
      {activeSection === "integrations" && <Suspense fallback={<SectionLoader />}><Integrations /></Suspense>}

      {(activeSection === "insights" || activeSection === "intelligence-hub" ||
        activeSection === "war-room-live" || activeSection === "predictive" ||
        activeSection === "neural-network" || activeSection === "agent-replay" ||
        activeSection === "agent-dna" || activeSection === "benchmarks") && (
        <Suspense fallback={<SectionLoader />}>
          <IntelligenceHub
            chartData={realChartData}
            totalExecutions={totalExecutions}
            recentLogs={recentLogs}
            locale={locale}
            onGoToAgents={() => onSetActiveSection("agents")}
            onNavigate={onNavigate}
            defaultTab={
              activeSection === "war-room-live" ? "war-room" :
              activeSection === "predictive" ? "predictive" :
              activeSection === "neural-network" ? "neural-network" :
              activeSection === "agent-replay" ? "agent-replay" :
              activeSection === "agent-dna" ? "agent-dna" :
              activeSection === "benchmarks" ? "benchmarks" : "reports"
            }
          />
        </Suspense>
      )}

      {(activeSection === "workspace" || activeSection === "inbox" ||
        activeSection === "squads" || activeSection === "kanban" ||
        activeSection === "files" || activeSection === "approvals" ||
        activeSection === "mission-composer") && (
        <Suspense fallback={<SectionLoader />}>
          <WorkspaceHub
            defaultTab={
              activeSection === "workspace" ? "inbox" :
              (activeSection as any)
            }
            onNavigate={onNavigate}
            onSelectAgent={onSelectAgent}
          />
        </Suspense>
      )}


      {activeSection === "settings" && (
        <Suspense fallback={<SectionLoader />}>
          <SettingsPage billingContent={billingContent} />
        </Suspense>
      )}

      {activeSection === "library" && <Suspense fallback={<SectionLoader />}><Library /></Suspense>}


      {activeSection === "agents" && (
        <Suspense fallback={<SectionLoader />}>
          <AgentsSection
            agents={agents}
            isLoading={loadingAgents}
            nameToSlug={nameToSlug}
            tierColors={tierColors}
            formatCurrency={formatCurrency}
            onOpenLibrary={() => onSetActiveSection("library")}
            onOpenThor={() => onSetActiveSection("omnix")}
            onOpenChat={onSelectAgent}
          />
        </Suspense>
      )}

      {activeSection === "empresa" && (
        <Suspense fallback={<SectionLoader />}>
          <CompanyHub
            agents={agents}
            nameToSlug={nameToSlug}
            onNavigate={onNavigate}
            onOpenAgent={onSelectAgent}
            onSetupCompany={onSetupCompany}
          />
        </Suspense>
      )}

      {activeSection === "content-pipeline" && <Suspense fallback={<SectionLoader />}><ContentPipelinePanel /></Suspense>}
      {activeSection === "deliverables" && <Suspense fallback={<SectionLoader />}><DeliverablesHub onNavigate={onNavigate} /></Suspense>}
      {activeSection === "call-transcriber" && <Suspense fallback={<SectionLoader />}><SalesCallTranscriber /></Suspense>}
      {activeSection === "operations-center" && <Suspense fallback={<SectionLoader />}><OperationsCenter onNavigate={onNavigate} /></Suspense>}

      {/* Legacy routes kept accessible via internal navigation */}
      {activeSection === "war-room" && <Suspense fallback={<SectionLoader />}><HolographicMeetingRoom /></Suspense>}
      {activeSection === "live-timeline" && <Suspense fallback={<SectionLoader />}><AgentLiveTimeline /></Suspense>}
      {activeSection === "bulk-deploy" && <Suspense fallback={<SectionLoader />}><BulkAgentProvisioner /></Suspense>}
      {activeSection === "scrum" && <Suspense fallback={<SectionLoader />}><ScrumBoard /></Suspense>}

      {["agent-memory", "autonomous-goals", "voice-first", "marketplace-p2p"].includes(activeSection) && (
        <ComingSoonSection feature={activeSection} />
      )}
    </>
  );
};

export default DashboardSectionRenderer;
