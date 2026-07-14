import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Radio, Orbit } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const InsightsHub = lazy(() => import("./InsightsHub"));
const WarRoomLive = lazy(() => import("./WarRoomLive"));
const AgentNeuralNetwork = lazy(() => import("@/pages/AgentNeuralNetwork"));

export type IntelligenceTab = "reports" | "war-room" | "neural-network";

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
  onNavigate, onGoToAgents, defaultTab = "reports",
}: IntelligenceHubProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1 flex-wrap h-auto">
          <TabsTrigger value="reports" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_reports", { defaultValue: "Relatórios" })}
          </TabsTrigger>
          <TabsTrigger value="war-room" className="gap-1.5 text-xs">
            <Radio className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_war_room", { defaultValue: "War Room" })}
          </TabsTrigger>
          <TabsTrigger value="neural-network" className="gap-1.5 text-xs">
            <Orbit className="h-3.5 w-3.5" /> Rede Neural
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <InsightsHub
              chartData={chartData}
              totalExecutions={totalExecutions}
              recentLogs={recentLogs}
              locale={locale}
              onGoToAgents={onGoToAgents}
              onNavigate={onNavigate}
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
