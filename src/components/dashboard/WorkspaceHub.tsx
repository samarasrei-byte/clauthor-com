/**
 * WorkspaceHub · Consolidado (7 → 4 tabs).
 *
 * Antes: Empresa / Inbox / Squads / Kanban / Files / Approvals / Composer.
 * Depois:
 *   1. Empresa
 *   2. Comunicação (Inbox + Aprovações via ToggleGroup interno)
 *   3. Orquestração (Squads + Composer)
 *   4. Execução (Tarefas + Arquivos)
 *
 * A sub-navegação usa `ToggleGroup` shadcn · NÃO Tabs aninhadas · para
 * evitar duplicação de semântica ARIA. O deep-link `?view=<key>` mantém
 * compatibilidade com links antigos e permite abrir uma sub-view direto.
 */
import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Inbox, Layers3, KanbanSquare, FolderOpen, CheckSquare, Workflow, Building2, MessageSquare, Cog, Rocket } from "lucide-react";
import SectionLoader from "@/components/ui/section-loader";

const UnifiedInbox = lazy(() => import("./UnifiedInbox"));
const SquadManager = lazy(() => import("./SquadManager"));
const KanbanBoard = lazy(() => import("./KanbanBoard"));
const FilesLibrary = lazy(() => import("./FilesLibrary"));
const ApprovalsCenter = lazy(() => import("./ApprovalsCenter"));
const MissionComposer = lazy(() => import("./MissionComposer"));
const CompanyHub = lazy(() => import("./CompanyHub"));

// Legacy tab keys (mantidos para compat com deep-links existentes) → nova tab consolidada.
const LEGACY_TAB_MAP: Record<string, { tab: WorkspaceTab; view?: string }> = {
  empresa: { tab: "empresa" },
  inbox: { tab: "comunicacao", view: "inbox" },
  approvals: { tab: "comunicacao", view: "approvals" },
  squads: { tab: "orquestracao", view: "squads" },
  "mission-composer": { tab: "orquestracao", view: "composer" },
  kanban: { tab: "execucao", view: "kanban" },
  files: { tab: "execucao", view: "files" },
};

export type WorkspaceTab = "empresa" | "comunicacao" | "orquestracao" | "execucao";

interface Props {
  defaultTab?: string;
  agents: any[];
  nameToSlug: Record<string, string>;
  onNavigate: (id: string) => void;
  onSelectAgent: (agent: { id: string; name: string }) => void;
  onSetupCompany: () => void;
}

const WorkspaceHub = ({ defaultTab, agents, nameToSlug, onNavigate, onSelectAgent, onSetupCompany }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve tab + view iniciais a partir de defaultTab (legado) e ?view.
  const initial = (() => {
    const legacyKey = defaultTab && LEGACY_TAB_MAP[defaultTab];
    if (legacyKey) return { tab: legacyKey.tab, view: legacyKey.view };
    const viewParam = searchParams.get("view");
    if (viewParam && LEGACY_TAB_MAP[viewParam]) {
      return { tab: LEGACY_TAB_MAP[viewParam].tab, view: LEGACY_TAB_MAP[viewParam].view };
    }
    return { tab: "empresa" as WorkspaceTab, view: undefined as string | undefined };
  })();

  const [tab, setTab] = useState<string>(initial.tab);
  const [commView, setCommView] = useState<"inbox" | "approvals">(
    initial.view === "approvals" ? "approvals" : "inbox"
  );
  const [orchView, setOrchView] = useState<"squads" | "composer">(
    initial.view === "composer" ? "composer" : "squads"
  );
  const [execView, setExecView] = useState<"kanban" | "files">(
    initial.view === "files" ? "files" : "kanban"
  );

  // Persiste view no querystring para deep-linking.
  useEffect(() => {
    const currentView = tab === "comunicacao" ? commView : tab === "orquestracao" ? orchView : tab === "execucao" ? execView : null;
    const params = new URLSearchParams(searchParams);
    if (currentView) params.set("view", currentView); else params.delete("view");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, commView, orchView, execView]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/30 p-1 flex-wrap h-auto">
          <TabsTrigger value="empresa" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="comunicacao" className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" /> Comunicação
          </TabsTrigger>
          <TabsTrigger value="orquestracao" className="gap-1.5 text-xs">
            <Cog className="h-3.5 w-3.5" /> Orquestração
          </TabsTrigger>
          <TabsTrigger value="execucao" className="gap-1.5 text-xs">
            <Rocket className="h-3.5 w-3.5" /> Execução
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

        <TabsContent value="comunicacao" className="mt-4 space-y-4">
          <SubNav
            value={commView}
            onValueChange={(v) => v && setCommView(v as "inbox" | "approvals")}
            items={[
              { value: "inbox", icon: Inbox, label: "Inbox" },
              { value: "approvals", icon: CheckSquare, label: "Aprovações" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {commView === "inbox" ? <UnifiedInbox onOpenChat={onSelectAgent} /> : <ApprovalsCenter />}
          </Suspense>
        </TabsContent>

        <TabsContent value="orquestracao" className="mt-4 space-y-4">
          <SubNav
            value={orchView}
            onValueChange={(v) => v && setOrchView(v as "squads" | "composer")}
            items={[
              { value: "squads", icon: Layers3, label: "Squads" },
              { value: "composer", icon: Workflow, label: "Composer" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {orchView === "squads" ? <SquadManager onNavigate={onNavigate} /> : <MissionComposer />}
          </Suspense>
        </TabsContent>

        <TabsContent value="execucao" className="mt-4 space-y-4">
          <SubNav
            value={execView}
            onValueChange={(v) => v && setExecView(v as "kanban" | "files")}
            items={[
              { value: "kanban", icon: KanbanSquare, label: "Tarefas" },
              { value: "files", icon: FolderOpen, label: "Arquivos" },
            ]}
          />
          <Suspense fallback={<SectionLoader />}>
            {execView === "kanban" ? <KanbanBoard /> : <FilesLibrary />}
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/** Sub-nav em pill · ToggleGroup evita nested Tabs ARIA. */
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
    className="inline-flex rounded-lg border border-border/50 bg-muted/20 p-0.5"
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

export default WorkspaceHub;
