import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Layers3, KanbanSquare, FolderOpen, CheckSquare, Workflow, Building2 } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const UnifiedInbox = lazy(() => import("./UnifiedInbox"));
const SquadManager = lazy(() => import("./SquadManager"));
const KanbanBoard = lazy(() => import("./KanbanBoard"));
const FilesLibrary = lazy(() => import("./FilesLibrary"));
const ApprovalsCenter = lazy(() => import("./ApprovalsCenter"));
const MissionComposer = lazy(() => import("./MissionComposer"));
const CompanyHub = lazy(() => import("./CompanyHub"));

export type WorkspaceTab = "empresa" | "inbox" | "squads" | "kanban" | "files" | "approvals" | "mission-composer";

interface Props {
  defaultTab?: WorkspaceTab;
  agents: any[];
  nameToSlug: Record<string, string>;
  onNavigate: (id: string) => void;
  onSelectAgent: (agent: { id: string; name: string }) => void;
  onSetupCompany: () => void;
}

const WorkspaceHub = ({ defaultTab = "empresa", agents, nameToSlug, onNavigate, onSelectAgent, onSetupCompany }: Props) => {
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1 flex-wrap h-auto">
          <TabsTrigger value="empresa" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5 text-xs">
            <Inbox className="h-3.5 w-3.5" /> Inbox
          </TabsTrigger>
          <TabsTrigger value="squads" className="gap-1.5 text-xs">
            <Layers3 className="h-3.5 w-3.5" /> Squads
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5 text-xs">
            <KanbanSquare className="h-3.5 w-3.5" /> Tarefas
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5 text-xs">
            <FolderOpen className="h-3.5 w-3.5" /> Arquivos
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5 text-xs">
            <CheckSquare className="h-3.5 w-3.5" /> Aprovações
          </TabsTrigger>
          <TabsTrigger value="mission-composer" className="gap-1.5 text-xs">
            <Workflow className="h-3.5 w-3.5" /> Composer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Suspense fallback={<SectionLoader />}>
            <CompanyHub
              agents={agents}
              nameToSlug={nameToSlug}
              onNavigate={onNavigate}
              onOpenAgent={onSelectAgent}
              onSetupCompany={onSetupCompany}
            />
          </Suspense>
        </TabsContent>
        <TabsContent value="inbox" className="mt-4">
          <Suspense fallback={<SectionLoader />}><UnifiedInbox onOpenChat={onSelectAgent} /></Suspense>
        </TabsContent>
        <TabsContent value="squads" className="mt-4">
          <Suspense fallback={<SectionLoader />}><SquadManager onNavigate={onNavigate} /></Suspense>
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <Suspense fallback={<SectionLoader />}><KanbanBoard /></Suspense>
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <Suspense fallback={<SectionLoader />}><FilesLibrary /></Suspense>
        </TabsContent>
        <TabsContent value="approvals" className="mt-4">
          <Suspense fallback={<SectionLoader />}><ApprovalsCenter /></Suspense>
        </TabsContent>
        <TabsContent value="mission-composer" className="mt-4">
          <Suspense fallback={<SectionLoader />}><MissionComposer /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkspaceHub;
