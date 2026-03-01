import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Users, CreditCard, MessageSquare, Bot } from "lucide-react";
import HelpTooltip from "@/components/HelpTooltip";
import AgentSettings from "./AgentSettings";
import UserProfileEditor from "./UserProfileEditor";
import TeamMembers from "./TeamMembers";
import SupportChat from "@/components/SupportChat";

interface SettingsPageProps {
  /** Billing content rendered by parent (needs access to credits/subscriptions state) */
  billingContent: React.ReactNode;
  defaultTab?: string;
}

const SettingsPage = ({ billingContent, defaultTab = "agents" }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = [
    { id: "agents", label: "Agentes", icon: Bot },
    { id: "profile", label: "Meu Perfil", icon: User },
    { id: "team", label: "Equipe", icon: Users },
    { id: "billing", label: "Assinatura", icon: CreditCard },
    { id: "support", label: "Suporte", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações
          <HelpTooltip text="Gerencie seus agentes, perfil, equipe, assinatura e suporte. Use as abas abaixo para navegar entre cada seção." size={14} />
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie agentes, perfil, equipe, assinatura e suporte.
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

        <TabsContent value="profile">
          <UserProfileEditor />
        </TabsContent>

        <TabsContent value="team">
          <TeamMembers />
        </TabsContent>

        <TabsContent value="billing">
          {billingContent}
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
