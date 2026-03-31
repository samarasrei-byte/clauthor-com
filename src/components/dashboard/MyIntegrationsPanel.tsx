import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { connectors } from "@/components/integrations/connectorData";

interface Props {
  onNavigate: (id: string) => void;
}

const MyIntegrationsPanel = ({ onNavigate }: Props) => {
  const { user } = useAuth();

  const { data: connectedCreds = [] } = useQuery({
    queryKey: ["my-integrations-status", user?.id],
    queryFn: async () => {
      const [userRes, platformRes] = await Promise.all([
        supabase.functions.invoke("credential-manager", {
          body: { action: "list_user_integrations" },
        }),
        supabase.functions.invoke("credential-manager", {
          body: { action: "list_platform" },
        }),
      ]);
      const userCreds = userRes.data?.credentials || [];
      const platformCreds = platformRes.data?.credentials || [];
      return [...userCreds, ...platformCreds];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const connectedMap = connectedCreds.reduce((acc: Record<string, Set<string>>, c: any) => {
    if (!acc[c.integration_name]) acc[c.integration_name] = new Set();
    acc[c.integration_name].add(c.credential_key);
    return acc;
  }, {} as Record<string, Set<string>>);

  const isConnected = (integrationKey: string, fields: { key: string; required?: boolean }[]) => {
    const keys = connectedMap[integrationKey];
    if (!keys || keys.size === 0) return false;
    const required = fields.filter(f => f.required);
    if (required.length === 0) return keys.size > 0;
    return required.every(f => keys.has(f.key));
  };

  const availableConnectors = connectors.filter(c => c.status === "available");
  const connectedCount = availableConnectors.filter(c => isConnected(c.integrationKey, c.fields)).length;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Minhas Integrações</h3>
            <p className="text-xs text-muted-foreground">
              {connectedCount} de {availableConnectors.length} conectadas
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 border-border/30"
          onClick={() => onNavigate("integrations")}
        >
          Gerenciar
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {availableConnectors.slice(0, 8).map((connector) => {
          const connected = isConnected(connector.integrationKey, connector.fields);
          return (
            <button
              key={connector.integrationKey}
              onClick={() => onNavigate("integrations")}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 hover:bg-muted/10 ${
                connected
                  ? "border-primary/25 bg-primary/[0.03]"
                  : "border-border/20 bg-card/30"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                connected ? "bg-primary/15" : "bg-muted/15"
              }`}>
                {connector.iconUrl ? (
                  <img src={connector.iconUrl} alt={connector.name} className="w-4 h-4 rounded" />
                ) : (
                  <connector.icon className={`h-3.5 w-3.5 ${connected ? "text-primary" : "text-muted-foreground"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium block truncate">{connector.name}</span>
              </div>
              {connected ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {availableConnectors.length > 8 && (
        <button
          onClick={() => onNavigate("integrations")}
          className="text-xs text-primary/70 hover:text-primary transition-colors w-full text-center"
        >
          +{availableConnectors.length - 8} mais integrações disponíveis
        </button>
      )}
    </div>
  );
};

export default MyIntegrationsPanel;
