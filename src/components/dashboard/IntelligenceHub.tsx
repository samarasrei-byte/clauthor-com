import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, Star, Activity, Radio, Orbit } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const AnalyticsSection = lazy(() => import("./AnalyticsSection"));
const ExecutionResultsPanel = lazy(() => import("./ExecutionResultsPanel"));
const AIQualityDashboard = lazy(() => import("./AIQualityDashboard"));
const LogsSection = lazy(() => import("./LogsSection"));
const WarRoomLive = lazy(() => import("./WarRoomLive"));
const AgentNeuralNetwork = lazy(() => import("@/pages/AgentNeuralNetwork"));

export type IntelligenceTab =
  | "analytics"
  | "results"
  | "ai-quality"
  | "logs"
  | "war-room"
  | "neural-network"
  // Aliases legados
  | "reports";

interface IntelligenceHubProps {
  chartData: any[];
  totalExecutions: number;
  recentLogs: any[];
  locale: string;
  onNavigate: (id: string) => void;
  onGoToAgents: () => void;
  defaultTab?: IntelligenceTab;
}

const IntelligenceHub = ({
  chartData, totalExecutions, recentLogs, locale,
  onNavigate, onGoToAgents, defaultTab = "analytics",
}: IntelligenceHubProps) => {
  const { t } = useTranslation();
  // "reports" era o wrapper antigo — aponta para analytics por padrão
  const initial = defaultTab === "reports" ? "analytics" : defaultTab;
  const [tab, setTab] = useState<string>(initial);

  const tabs = [
    { id: "analytics", label: t("dashboard.analytics", { defaultValue: "Analytics" }), icon: BarChart3 },
    { id: "results", label: t("dashboard.results", { defaultValue: "Resultados" }), icon: FileText },
    { id: "ai-quality", label: t("dashboard.ai_quality", { defaultValue: "Qualidade IA" }), icon: Star },
    { id: "logs", label: t("dashboard.logs", { defaultValue: "Logs" }), icon: Activity },
    { id: "war-room", label: t("dashboard.intelligence_tab_war_room", { defaultValue: "War Room" }), icon: Radio },
    { id: "neural-network", label: "Rede Neural", icon: Orbit },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1 flex-wrap h-auto gap-1">
          {tabs.map((tb) => (
            <TabsTrigger key={tb.id} value={tb.id} className="gap-1.5 text-xs">
              <tb.icon className="h-3.5 w-3.5" />
              {tb.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
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

        <TabsContent value="results" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <ExecutionResultsPanel onNavigate={onNavigate} />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-quality" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <AIQualityDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <LogsSection
              recentLogs={recentLogs}
              locale={locale}
              onGoToAgents={onGoToAgents}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="war-room" className="mt-4">
          <Suspense fallback={<SectionLoader />}><WarRoomLive /></Suspense>
        </TabsContent>

        <TabsContent value="neural-network" className="mt-4">
          <Suspense fallback={<SectionLoader />}><AgentNeuralNetwork /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligenceHub;
