import { useState } from "react";
import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Star, FileText, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

const AnalyticsSection = lazy(() => import("./AnalyticsSection"));
const AIQualityDashboard = lazy(() => import("./AIQualityDashboard"));
const ExecutionResultsPanel = lazy(() => import("./ExecutionResultsPanel"));
const LogsSection = lazy(() => import("./LogsSection"));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

interface InsightsHubProps {
  chartData: any[];
  totalExecutions: number;
  recentLogs: any[];
  locale: string;
  onGoToAgents: () => void;
  onNavigate: (id: string) => void;
  defaultTab?: string;
}

const InsightsHub = ({ chartData, totalExecutions, recentLogs, locale, onGoToAgents, onNavigate, defaultTab = "analytics" }: InsightsHubProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { t } = useTranslation();

  const tabs = [
    { id: "analytics", label: t("dashboard.analytics", { defaultValue: "Analytics" }), icon: BarChart3 },
    { id: "results", label: t("dashboard.results", { defaultValue: "Results" }), icon: FileText },
    { id: "ai-quality", label: t("dashboard.ai_quality", { defaultValue: "AI Quality" }), icon: Star },
    { id: "logs", label: t("dashboard.logs", { defaultValue: "Logs" }), icon: Activity },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/30 p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="analytics">
          <Suspense fallback={<SectionLoader />}>
            <AnalyticsSection
              chartData={chartData}
              totalExecutions={totalExecutions}
              recentLogs={recentLogs}
              locale={locale}
              onGoToAgents={onGoToAgents}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="results">
          <Suspense fallback={<SectionLoader />}>
            <ExecutionResultsPanel onNavigate={onNavigate} />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-quality">
          <Suspense fallback={<SectionLoader />}>
            <AIQualityDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs">
          <Suspense fallback={<SectionLoader />}>
            <LogsSection
              recentLogs={recentLogs}
              locale={locale}
              onGoToAgents={onGoToAgents}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsHub;
