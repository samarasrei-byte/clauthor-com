import { useState, lazy, Suspense } from "react";
import { Radar, Orbit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ControlTowerSection = lazy(() => import("@/pages/ControlTower"));
const MissionControl = lazy(() => import("@/components/dashboard/MissionControl"));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

interface OperationsCenterProps {
  onNavigate?: (id: string) => void;
  defaultTab?: "tower" | "mission";
}

const OperationsCenter = ({ onNavigate, defaultTab = "tower" }: OperationsCenterProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-muted/10 border border-border/10 h-9">
          <TabsTrigger value="tower" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Radar className="h-3.5 w-3.5" />
            Control Tower
          </TabsTrigger>
          <TabsTrigger value="mission" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Orbit className="h-3.5 w-3.5" />
            Mission Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tower" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <ControlTowerSection onNavigate={onNavigate} />
          </Suspense>
        </TabsContent>

        <TabsContent value="mission" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <MissionControl onNavigate={onNavigate} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsCenter;
