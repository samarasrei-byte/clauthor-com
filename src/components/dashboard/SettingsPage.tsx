import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Users, CreditCard, MessageSquare, Bot, Link2, Database, Plug } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import AgentSettings from "./AgentSettings";
import UserProfileEditor from "./UserProfileEditor";
import TeamMembers from "./TeamMembers";
import SupportChat from "@/components/SupportChat";
import { CouponRedeemer } from "./CouponRedeemer";
import CredentialsHub from "./CredentialsHub";
import OutcomePricingRules from "./OutcomePricingRules";
import { useTranslation } from "react-i18next";

const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const Integrations = lazy(() => import("@/pages/Integrations"));
import SectionLoader from "@/components/ui/section-loader";

interface SettingsPageProps {
  billingContent: React.ReactNode;
  defaultTab?: string;
}

const SettingsPage = ({ billingContent, defaultTab = "agents" }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { t } = useTranslation();

  const tabs = [
    { id: "agents", label: t("settings.tab_agents", { defaultValue: "Configurações" }), icon: Bot },
    { id: "credentials", label: t("settings.tab_credentials", { defaultValue: "Conexões" }), icon: Link2 },
    { id: "integrations", label: t("dashboard.integrations", { defaultValue: "Integrações" }), icon: Plug },
    { id: "knowledge", label: t("dashboard.knowledge_base", { defaultValue: "Knowledge Base" }), icon: Database },
    { id: "profile", label: t("settings.tab_profile", { defaultValue: "Meu Perfil" }), icon: User },
    { id: "team", label: t("settings.tab_team", { defaultValue: "Equipe" }), icon: Users },
    { id: "billing", label: t("settings.tab_billing", { defaultValue: "Assinatura" }), icon: CreditCard },
    { id: "support", label: t("settings.tab_support", { defaultValue: "Suporte" }), icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          {t("settings.title", { defaultValue: "Central de Comando" })}
          <HelpTooltip id="settings-intro" text={t("settings.help", { defaultValue: "Gerencie seus agentes, conexões, perfil, equipe e assinatura." })} size={14} />
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.subtitle", { defaultValue: "O sistema operacional da sua equipe de IA." })}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/30 p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="agents">
          <AgentSettings />
        </TabsContent>

        <TabsContent value="credentials">
          <CredentialsHub />
        </TabsContent>

        <TabsContent value="integrations">
          <Suspense fallback={<SectionLoader />}>
            <Integrations />
          </Suspense>
        </TabsContent>

        <TabsContent value="knowledge">
          <Suspense fallback={<SectionLoader />}>
            <KnowledgeBase />
          </Suspense>
        </TabsContent>

        <TabsContent value="profile">
          <UserProfileEditor />
        </TabsContent>

        <TabsContent value="team">
          <TeamMembers />
        </TabsContent>

        <TabsContent value="billing">
          <div className="space-y-4">
            {billingContent}
            <CouponRedeemer />
          </div>
        </TabsContent>

        <TabsContent value="support">
          <div className="h-[calc(100vh-20rem)] rounded-2xl overflow-hidden border border-border/10">
            <SupportChat area="client" embedded />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
