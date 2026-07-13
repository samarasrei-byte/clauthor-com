import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Brain, ArrowRight, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "@/components/ErrorBoundary";
import SectionLoader from "@/components/ui/section-loader";
// GuidedOnboarding legado removido · RevolutionaryOnboardingGate global cobre esse fluxo.
import HeroBriefing from "@/components/dashboard/HeroBriefing";
import NextStepsCard from "@/components/dashboard/NextStepsCard";
import MonthlyROICard from "@/components/dashboard/MonthlyROICard";
// FirstTimeTour removido · ThorLiveGuide já cobre onboarding em 5 passos.

const CompanyBoardAlert = lazy(() => import("./CompanyBoardAlert"));
const ROIDashboard = lazy(() => import("./ROIDashboard"));
const ExecutionHealthBanner = lazy(() => import("./ExecutionHealthBanner"));
const MarketplaceReviews = lazy(() => import("./MarketplaceReviews"));
const QuickIntegrations = lazy(() => import("./QuickIntegrations"));
const MyIntegrationsPanel = lazy(() => import("./MyIntegrationsPanel"));
const ReferralsPanel = lazy(() => import("./ReferralsPanel"));
const TrustCenterPanel = lazy(() => import("./TrustCenterPanel"));
const FeedbackTrendsPanel = lazy(() => import("./FeedbackTrendsPanel"));
const ThorDailyBriefing = lazy(() => import("./ThorDailyBriefing"));
const QuickWins = lazy(() => import("./QuickWins"));
const TaskRequestPanel = lazy(() => import("./TaskRequestPanel"));
const PlatformStatsBanner = lazy(() => import("@/components/PlatformStatsBanner"));
const PendingActionsPanel = lazy(() => import("./PendingActionsPanel").then(m => ({ default: m.PendingActionsPanel })));
const ClientCommandCenter = lazy(() => import("./ClientCommandCenter"));
const DashboardSkeleton = lazy(() => import("./DashboardSkeleton"));
const LiveActivityFeed = lazy(() => import("./LiveActivityFeed").then(m => ({ default: m.LiveActivityFeed })));
const ContractedDepartments = lazy(() => import("./ContractedDepartments"));
const FirstDeliveryCard = lazy(() => import("./FirstDeliveryCard"));


interface Props {
  loadingAgents: boolean;
  boardCount: number;
  agents: any[];
  activeAgents: number;
  totalExecutions: number;
  totalTokensUsed: number;
  usagePercentage: number;
  estimatedSavings: number;
  credits: any;
  remainingCredits: number;
  subscriptions: any[];
  recentLogs: any[];
  tokenUsage: any[];
  nameToSlug: Record<string, string>;
  activeSection: string;
  onNavigate: (id: string) => void;
  onSetActiveSection: (s: string) => void;
  onTeach: () => void;
  onHire: () => void;
  onCommand: () => void;
  onSubmitTask: (task: string, mode: string) => void;
  onSelectAgentBySlug: (slug: string) => void;
}

const DashboardOverview = ({
  loadingAgents, boardCount, agents, activeAgents, totalExecutions, totalTokensUsed,
  usagePercentage, estimatedSavings, credits, remainingCredits, subscriptions,
  recentLogs, tokenUsage, nameToSlug, activeSection,
  onNavigate, onSetActiveSection, onTeach, onHire, onCommand, onSubmitTask, onSelectAgentBySlug,
}: Props) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);


  return (
    <>

      {loadingAgents && (
        <Suspense fallback={<SectionLoader />}><DashboardSkeleton /></Suspense>
      )}

      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <div className="space-y-5">
            {/* PRIMEIRA DOBRA · P2 · ROI do mês em destaque · prova visível */}
            <MonthlyROICard onCTA={() => onSetActiveSection("omnix")} />

            <HeroBriefing
              agentsCount={agents.length}
              activeAgents={activeAgents}
              totalExecutions={totalExecutions}
              remainingCredits={remainingCredits}
              recentLogs={recentLogs}
              onOpenLibrary={() => onSetActiveSection("library")}
              onOpenWarRoom={() => onSetActiveSection("warroom")}
              onFocusTaskInput={() => {
                const el = document.getElementById("task-request-input");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  (el as HTMLElement).focus?.();
                } else {
                  onSetActiveSection("omnix");
                }
              }}
            />

            {/* Momento "uau" pós-signup · destaca o primeiro entregável aprovado (7 dias). */}
            <FirstDeliveryCard onOpenApprovals={() => onSetActiveSection("approvals")} />

            {/* Guia de configuração da conta (progressive disclosure) */}
            <NextStepsCard />



            {/* Advanced panels - only when user has agents */}
            {agents.length > 0 && (
              <>
                <ContractedDepartments
                  onExplore={() => onSetActiveSection("library")}
                />

                <TaskRequestPanel
                  contractedAgentSlugs={agents.map(a => nameToSlug[a.name]).filter(Boolean)}
                  onSubmitTask={onSubmitTask}
                  onSelectAgent={onSelectAgentBySlug}
                />
                <div className="flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 py-1">
                  <span>Força de trabalho digital</span>
                  <span className="text-muted-foreground/20">·</span>
                  <span>Squads especializados</span>
                  <span className="text-muted-foreground/20">·</span>
                  <span>99.9% uptime</span>
                </div>

                <ExecutionHealthBanner onGoToWarRoom={() => onSetActiveSection("warroom")} />

                <CompanyBoardAlert onSetup={onTeach} />

                <ThorDailyBriefing
                  data={{ activeAgents, totalExecutions, recentLogs, remainingCredits, usagePercentage }}
                  onGoToThor={() => onSetActiveSection("omnix")}
                  onDismiss={() => {}}
                />

                <LiveActivityFeed />

                {/* Progressive disclosure · reduces first-render noise */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/[0.02] text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    aria-expanded={showAdvanced}
                  >
                    {showAdvanced ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Ocultar painéis avançados
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Ver painéis avançados (ROI, integrações, indicações)
                      </>
                    )}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-5 pt-2">
                        <QuickWins
                          activeAgents={activeAgents}
                          totalExecutions={totalExecutions}
                          recentLogs={recentLogs}
                          hasCompanyData={boardCount > 0}
                          remainingCredits={remainingCredits}
                          onNavigate={onNavigate}
                        />
                        <ROIDashboard
                          agents={agents}
                          totalExecutions={totalExecutions}
                          totalTokensUsed={totalTokensUsed}
                          estimatedSavings={estimatedSavings}
                        />
                        <QuickIntegrations onSetupCompany={() => onSetActiveSection("integrations")} />
                        <MyIntegrationsPanel onNavigate={onSetActiveSection} />
                        <ReferralsPanel />
                        <TrustCenterPanel />
                        <FeedbackTrendsPanel />
                        <MarketplaceReviews compact />
                        <PendingActionsPanel />
                        <ClientCommandCenter
                          activeAgents={activeAgents} totalExecutions={totalExecutions} totalTokensUsed={totalTokensUsed}
                          usagePercentage={usagePercentage} estimatedSavings={estimatedSavings} credits={credits}
                          remainingCredits={remainingCredits} agents={agents} subscriptions={subscriptions}
                          recentLogs={recentLogs} tokenUsage={tokenUsage} onNavigate={onNavigate}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default DashboardOverview;
