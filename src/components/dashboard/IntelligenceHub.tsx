import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Radio, TrendingUp, DollarSign } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const InsightsHub = lazy(() => import("./InsightsHub"));
const WarRoomLive = lazy(() => import("./WarRoomLive"));
const PredictiveDashboard = lazy(() => import("./PredictiveDashboard"));
const OutcomeBilling = lazy(() => import("./OutcomeBilling"));

interface IntelligenceHubProps {
  chartData: any[];
  totalExecutions: number;
  recentLogs: any[];
  locale: string;
  onNavigate: (id: string) => void;
  onGoToAgents: () => void;
  defaultTab?: "reports" | "war-room" | "predictive" | "outcomes";
}

/**
 * IntelligenceHub — consolidates Relatórios, War Room and Preditivo into a
 * single tabbed surface, replacing three separate sidebar items.
 */
const IntelligenceHub = ({
  chartData, totalExecutions, recentLogs, locale,
  onNavigate, onGoToAgents, defaultTab = "reports",
}: IntelligenceHubProps) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <div className="space-y-4">


      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="reports" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_reports", { defaultValue: "Relatórios" })}
          </TabsTrigger>
          <TabsTrigger value="war-room" className="gap-1.5 text-xs">
            <Radio className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_war_room", { defaultValue: "War Room" })}
          </TabsTrigger>
          <TabsTrigger value="predictive" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_predictive", { defaultValue: "Preditivo" })}
          </TabsTrigger>
          <TabsTrigger value="outcomes" className="gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5" />
            {t("dashboard.intelligence_tab_outcomes", { defaultValue: "Receita por Resultado" })}
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
          <Suspense fallback={<SectionLoader />}>
            <WarRoomLive />
          </Suspense>
        </TabsContent>

        <TabsContent value="predictive" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <PredictiveDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <OutcomeBilling />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligenceHub;
