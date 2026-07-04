import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radar, Settings } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const OperationsCenter = lazy(() => import("./OperationsCenter"));
const SettingsPage = lazy(() => import("./SettingsPage"));

export type SystemTab = "operations" | "settings";

interface Props {
  defaultTab?: SystemTab;
  billingContent: React.ReactNode;
  onNavigate: (id: string) => void;
}

const SystemHub = ({ defaultTab = "operations", billingContent, onNavigate }: Props) => {
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="operations" className="gap-1.5 text-xs">
            <Radar className="h-3.5 w-3.5" /> Operações
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" /> Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="mt-4">
          <Suspense fallback={<SectionLoader />}><OperationsCenter onNavigate={onNavigate} /></Suspense>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Suspense fallback={<SectionLoader />}><SettingsPage billingContent={billingContent} /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHub;
