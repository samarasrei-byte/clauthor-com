import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Store, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AdminMarketplacePanelProps {
  pendingAgents: any[];
  locale: string;
}

export default function AdminMarketplacePanel({ pendingAgents, locale }: AdminMarketplacePanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const approveAgent = async (id: string) => {
    const { error } = await supabase.from("marketplace_agents").update({ is_approved: true }).eq("id", id);
    if (!error) { toast.success(t("dashboard.agent_approved", { defaultValue: "Agente aprovado!" })); queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] }); }
  };

  const rejectAgent = async (id: string) => {
    const { error } = await supabase.from("marketplace_agents").delete().eq("id", id);
    if (!error) { toast.success(t("dashboard.agent_rejected", { defaultValue: "Agente rejeitado." })); queryClient.invalidateQueries({ queryKey: ["admin-pending-marketplace"] }); }
  };

  return (
    <Card className="bg-background/40 backdrop-blur-xl border border-white/[0.08]">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" /> {t("dashboard.marketplace_agents", { defaultValue: "Agentes no Marketplace" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAgents.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">{t("dashboard.marketplace_empty", { defaultValue: "O marketplace será populado quando usuários publicarem seus agentes." })}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAgents.map((agent: any) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/30">
                <div>
                  <p className="font-medium">{agent.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agent.short_description || t("dashboard.no_description", { defaultValue: "Sem descrição" })} • {agent.tier} •{" "}
                    {new Intl.NumberFormat(locale, { style: "currency", currency: locale.startsWith("pt") ? "BRL" : "USD", minimumFractionDigits: 0 }).format(agent.monthly_price / 100)}/{locale.startsWith("pt") ? "mês" : "mo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveAgent(agent.id)} className="gap-1">
                    <CheckCircle className="h-4 w-4" /> {t("dashboard.approve", { defaultValue: "Aprovar" })}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectAgent(agent.id)} className="gap-1">
                    <XCircle className="h-4 w-4" /> {t("dashboard.reject", { defaultValue: "Rejeitar" })}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
