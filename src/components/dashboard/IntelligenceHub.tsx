/**
 * IntelligenceHub · Consolidado (7 → 4 tabs, sem duplicidade).
 *
 * Estrutura minimalista:
 *   1. Ao Vivo    — Execuções (feed operacional) + Rede Neural (mapa)
 *   2. Analytics  — Métricas agregadas (sem sub-nav)
 *   3. Qualidade IA
 *   4. Logs       — Eventos brutos + Resultados detalhados (histórico)
 *
 * War Room e IA Live foram unificados dentro de "Execuções" (mesmo domínio:
 * o que está acontecendo agora). Resultados saiu de Analytics porque é
 * histórico, não agregado — vive em Logs junto com os eventos.
 *
 * SubNav usa ToggleGroup para não aninhar Tabs (ARIA correto).
 */
import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, FileText, Star, Activity, Orbit, Eye, Zap, ScrollText } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const AnalyticsSection = lazy(() => import("./AnalyticsSection"));
const ExecutionResultsPanel = lazy(() => import("./ExecutionResultsPanel"));
const AIQualityDashboard = lazy(() => import("./AIQualityDashboard"));
const LogsSection = lazy(() => import("./LogsSection"));
const AgentNeuralNetwork = lazy(() => import("@/pages/AgentNeuralNetwork"));
const LiveExecutionPanel = lazy(() => import("./LiveExecutionPanel"));

export type IntelligenceTab =
  | "live"
  | "analytics"
  | "results"
  | "ai-quality"
  | "logs"
  | "war-room"
  | "neural-network"
  | "reports";

// Legacy → nova tab. Rede Neural agora é tab própria (usabilidade: usuário
// vê e clica sem precisar entrar dentro de "Ao Vivo").
const LEGACY_MAP: Record<string, { tab: string; view?: string }> = {
  live: { tab: "live", view: "executions" },
  "war-room": { tab: "live", view: "executions" },
  "ai-live": { tab: "live", view: "executions" },
  "neural-network": { tab: "neural" },
  analytics: { tab: "analytics" },
  reports: { tab: "analytics" },
  results: { tab: "logs", view: "results" },
  "ai-quality": { tab: "ai-quality" },
  logs: { tab: "logs", view: "events" },
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
  const [liveView, setLiveView] = useState<"executions" | "neural">(
    legacy.view === "neural" ? "neural" : "executions"
  );
  const [logsView, setLogsView] = useState<"events" | "results">(
    legacy.view === "results" ? "results" : "events"
  );

  // Ordem canônica pedida: Ao Vivo → Analytics → Rede Neural → Qualidade IA → Logs
  const tabs = [
    { id: "live", label: "Ao Vivo", icon: Eye },
    { id: "analytics", label: t("dashboard.analytics", { defaultValue: "Analytics" }), icon: BarChart3 },
    { id: "neural", label: "Rede Neural", icon: Orbit },
    { id: "ai-quality", label: t("dashboard.ai_quality", { defaultValue: "Qualidade IA" }), icon: Star },
    { id: "logs", label: t("dashboard.logs", { defaultValue: "Logs" }), icon: Activity },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto lg:overflow-visible -mx-1 px-1 scrollbar-thin">
          <TabsList className="bg-muted/30 p-1 gap-1 lg:flex-wrap h-auto inline-flex lg:flex whitespace-nowrap">
            {tabs.map((tb) => (
              <TabsTrigger key={tb.id} value={tb.id} className="gap-1.5 text-xs shrink-0">
                <tb.icon className="h-3.5 w-3.5" />
                {tb.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>


        <TabsContent value="live" className="mt-4 space-y-4">
          <Suspense fallback={<SectionLoader />}>
            <LiveExecutionPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="neural" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <AgentNeuralNetwork />
          </Suspense>
        </TabsContent>

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

        <TabsContent value="ai-quality" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <AIQualityDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="logs" className="mt-4 space-y-4">
          <SubNav
            value={logsView}
            onValueChange={(v) => v && setLogsView(v as "events" | "results")}
            items={[
              { value: "events", icon: ScrollText, label: "Eventos" },
              { value: "results", icon: FileText, label: "Resultados" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {logsView === "events" ? (
              <LogsSection
                recentLogs={recentLogs}
                locale={locale}
                onGoToAgents={onGoToAgents}
              />
            ) : (
              <ExecutionResultsPanel onNavigate={onNavigate} />
            )}
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
