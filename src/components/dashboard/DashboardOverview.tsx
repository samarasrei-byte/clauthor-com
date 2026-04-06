import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Bot, Brain, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import ErrorBoundary from "@/components/ErrorBoundary";
import SectionLoader from "@/components/ui/section-loader";
import GuidedOnboarding from "./GuidedOnboarding";
import DashboardWelcome from "@/components/DashboardWelcome";

const CompanyBoardAlert = lazy(() => import("./CompanyBoardAlert"));
const ROIDashboard = lazy(() => import("./ROIDashboard"));
const ExecutionHealthBanner = lazy(() => import("./ExecutionHealthBanner"));
const MarketplaceReviews = lazy(() => import("./MarketplaceReviews"));
const QuickIntegrations = lazy(() => import("./QuickIntegrations"));
const MyIntegrationsPanel = lazy(() => import("./MyIntegrationsPanel"));
const ThorDailyBriefing = lazy(() => import("./ThorDailyBriefing"));
const QuickWins = lazy(() => import("./QuickWins"));
const TaskRequestPanel = lazy(() => import("./TaskRequestPanel"));
const PendingActionsPanel = lazy(() => import("./PendingActionsPanel").then(m => ({ default: m.PendingActionsPanel })));
const ClientCommandCenter = lazy(() => import("./ClientCommandCenter"));
const DashboardSkeleton = lazy(() => import("./DashboardSkeleton"));

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

  return (
    <>
      {loadingAgents && (
        <Suspense fallback={<SectionLoader />}><DashboardSkeleton /></Suspense>
      )}

      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <div className="space-y-5">
            <DashboardWelcome
              hasAgents={agents.length > 0}
              hasIntegration={false}
              hasExecution={recentLogs.length > 0}
            />
            <GuidedOnboarding
              hasCompanyData={boardCount > 0}
              hasAgents={agents.length > 0}
              hasSentCommand={recentLogs.length > 0}
              onTeach={onTeach}
              onHire={onHire}
              onCommand={onCommand}
              onDismiss={() => {}}
            />

            {/* Hero action card for new users */}
            {agents.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-8 text-center space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold">{t("dashboard.hero_title", { defaultValue: "Seu time de IA começa aqui" })}</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {t("dashboard.hero_desc", { defaultValue: "Contrate agentes especializados que trabalham 24/7. SDR, Copywriter, Analista e muito mais — prontos em minutos." })}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button size="lg" className="glow gap-2 px-6" onClick={() => onSetActiveSection("library")}>
                    <Bot className="h-4 w-4" />
                    {t("dashboard.hero_cta", { defaultValue: "Contratar Agentes" })}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 border-border/30" onClick={() => onSetActiveSection("omnix")}>
                    <Brain className="h-4 w-4" />
                    {t("dashboard.hero_cta2", { defaultValue: "Falar com Thor" })}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Advanced panels — only when user has agents */}
            {agents.length > 0 && (
              <>
                <CompanyBoardAlert onSetup={onTeach} />

                <ThorDailyBriefing
                  data={{ activeAgents, totalExecutions, recentLogs, remainingCredits, usagePercentage }}
                  onGoToThor={() => onSetActiveSection("omnix")}
                  onDismiss={() => {}}
                />

                <QuickWins
                  activeAgents={activeAgents}
                  totalExecutions={totalExecutions}
                  recentLogs={recentLogs}
                  hasCompanyData={boardCount > 0}
                  remainingCredits={remainingCredits}
                  onNavigate={onNavigate}
                />

                <TaskRequestPanel
                  contractedAgentSlugs={agents.map(a => nameToSlug[a.name]).filter(Boolean)}
                  onSubmitTask={onSubmitTask}
                  onSelectAgent={onSelectAgentBySlug}
                />

                <ROIDashboard
                  agents={agents}
                  totalExecutions={totalExecutions}
                  totalTokensUsed={totalTokensUsed}
                  estimatedSavings={estimatedSavings}
                />

                <QuickIntegrations onSetupCompany={() => onSetActiveSection("integrations")} />

                <MyIntegrationsPanel onNavigate={onSetActiveSection} />

                <MarketplaceReviews compact />

                <PendingActionsPanel />
                <ClientCommandCenter
                  activeAgents={activeAgents} totalExecutions={totalExecutions} totalTokensUsed={totalTokensUsed}
                  usagePercentage={usagePercentage} estimatedSavings={estimatedSavings} credits={credits}
                  remainingCredits={remainingCredits} agents={agents} subscriptions={subscriptions}
                  recentLogs={recentLogs} tokenUsage={tokenUsage} onNavigate={onNavigate}
                />
              </>
            )}
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default DashboardOverview;
