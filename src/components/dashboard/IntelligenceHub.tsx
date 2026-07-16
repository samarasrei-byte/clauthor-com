/**
 * IntelligenceHub · Consolidado (7 → 4 tabs).
 *
 * Antes: Ao Vivo / Analytics / Resultados / Qualidade IA / Logs / War Room / Rede Neural.
 * Depois:
 *   1. Ao Vivo (Execuções + War Room + IA Live + Rede Neural via SubNav)
 *   2. Analytics (Métricas + Resultados via SubNav)
 *   3. Qualidade IA
 *   4. Logs
 *
 * SubNav usa ToggleGroup para não aninhar Tabs (ARIA correto).
 */
import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, FileText, Star, Activity, Radio, Orbit, Eye, Brain, Zap } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const AnalyticsSection = lazy(() => import("./AnalyticsSection"));
const ExecutionResultsPanel = lazy(() => import("./ExecutionResultsPanel"));
const AIQualityDashboard = lazy(() => import("./AIQualityDashboard"));
const LogsSection = lazy(() => import("./LogsSection"));
const WarRoomLive = lazy(() => import("./WarRoomLive"));
const AgentNeuralNetwork = lazy(() => import("@/pages/AgentNeuralNetwork"));
const LiveExecutionPanel = lazy(() => import("./LiveExecutionPanel"));
const AIWorkspace = lazy(() => import("./AIWorkspace"));

export type IntelligenceTab =
  | "live"
  | "analytics"
  | "results"
  | "ai-quality"
  | "logs"
  | "war-room"
  | "neural-network"
  | "reports";

// Legacy → nova tab + sub-view
const LEGACY_MAP: Record<string, { tab: string; view?: string }> = {
  live: { tab: "live", view: "executions" },
  "war-room": { tab: "live", view: "war-room" },
  "neural-network": { tab: "live", view: "neural" },
  "ai-live": { tab: "live", view: "ai-live" },
  analytics: { tab: "analytics", view: "metrics" },
  results: { tab: "analytics", view: "results" },
  reports: { tab: "analytics", view: "metrics" },
  "ai-quality": { tab: "ai-quality" },
  logs: { tab: "logs" },
};

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
  onNavigate, onGoToAgents, defaultTab = "live",
}: IntelligenceHubProps) => {
  const { t } = useTranslation();
  const legacy = LEGACY_MAP[defaultTab] || { tab: "live", view: "executions" };

  const [tab, setTab] = useState<string>(legacy.tab);
  const [liveView, setLiveView] = useState<"executions" | "war-room" | "ai-live" | "neural">(
    (["war-room", "ai-live", "neural"].includes(legacy.view || "") ? legacy.view : "executions") as any
  );
  const [analyticsView, setAnalyticsView] = useState<"metrics" | "results">(
    legacy.view === "results" ? "results" : "metrics"
  );

  const tabs = [
    { id: "live", label: "Ao Vivo", icon: Eye },
    { id: "analytics", label: t("dashboard.analytics", { defaultValue: "Analytics" }), icon: BarChart3 },
    { id: "ai-quality", label: t("dashboard.ai_quality", { defaultValue: "Qualidade IA" }), icon: Star },
    { id: "logs", label: t("dashboard.logs", { defaultValue: "Logs" }), icon: Activity },
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

        <TabsContent value="live" className="mt-4 space-y-4">
          <SubNav
            value={liveView}
            onValueChange={(v) => v && setLiveView(v as any)}
            items={[
              { value: "executions", icon: Zap, label: "Execuções" },
              { value: "war-room", icon: Radio, label: "War Room" },
              { value: "ai-live", icon: Brain, label: "IA Live" },
              { value: "neural", icon: Orbit, label: "Rede Neural" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {liveView === "executions" && <LiveExecutionPanel />}
            {liveView === "war-room" && <WarRoomLive />}
            {liveView === "ai-live" && <AIWorkspace onNavigate={onNavigate} />}
            {liveView === "neural" && <AgentNeuralNetwork />}
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <SubNav
            value={analyticsView}
            onValueChange={(v) => v && setAnalyticsView(v as any)}
            items={[
              { value: "metrics", icon: BarChart3, label: "Métricas" },
              { value: "results", icon: FileText, label: "Resultados" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {analyticsView === "metrics" ? (
              <AnalyticsSection
                chartData={chartData}
                totalExecutions={totalExecutions}
                recentLogs={recentLogs}
                locale={locale}
                onGoToAgents={onGoToAgents}
              />
            ) : (
              <ExecutionResultsPanel onNavigate={onNavigate} />
            )}
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
      </Tabs>
    </div>
  );
};

interface SubNavProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
}

const SubNav = ({ value, onValueChange, items }: SubNavProps) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={onValueChange}
    className="inline-flex rounded-lg border border-border/50 bg-muted/20 p-0.5 flex-wrap"
  >
    {items.map(({ value: v, icon: Icon, label }) => (
      <ToggleGroupItem
        key={v}
        value={v}
        aria-label={label}
        className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        <Icon className="h-3.5 w-3.5" /> {label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export default IntelligenceHub;
