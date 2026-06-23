import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingUp, Receipt, Clock } from "lucide-react";

interface OutcomeEvent {
  id: string;
  outcome_type: string;
  agent_slug: string | null;
  value_brl: number;
  computed_charge_brl: number;
  status: string;
  reference_id: string | null;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  billed: "secondary",
  paid: "default",
  disputed: "destructive",
  voided: "outline",
};

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const OutcomeBilling = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<OutcomeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("outcome_events")
        .select("id, outcome_type, agent_slug, value_brl, computed_charge_brl, status, reference_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (mounted) {
        setEvents((data as OutcomeEvent[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pending = events.filter((e) => e.status === "pending");
    const paid = events.filter((e) => e.status === "paid");
    const mrr = events
      .filter((e) => {
        const d = new Date(e.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + Number(e.computed_charge_brl), 0);
    return {
      pendingValue: pending.reduce((s, e) => s + Number(e.computed_charge_brl), 0),
      paidValue: paid.reduce((s, e) => s + Number(e.computed_charge_brl), 0),
      totalEvents: events.length,
      mrr,
    };
  }, [events]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label={t("outcomes.mrr", { defaultValue: "Receita do mês" })}
          value={formatBRL(stats.mrr)}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          label={t("outcomes.pending", { defaultValue: "A cobrar" })}
          value={formatBRL(stats.pendingValue)}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
          label={t("outcomes.paid", { defaultValue: "Recebido" })}
          value={formatBRL(stats.paidValue)}
        />
        <StatCard
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          label={t("outcomes.events", { defaultValue: "Eventos" })}
          value={String(stats.totalEvents)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("outcomes.timeline", { defaultValue: "Linha do tempo de resultados" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Carregando..." })}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("outcomes.empty", {
                defaultValue:
                  "Nenhum resultado registrado ainda. Configure regras de preço em Configurações → Cobrança.",
              })}
            </p>
          ) : (
            <ScrollArea className="h-[480px] pr-3">
              <ul className="space-y-2">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-md border bg-card/50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {t(`outcomes.type.${e.outcome_type}`, { defaultValue: e.outcome_type })}
                        </span>
                        {e.agent_slug && (
                          <Badge variant="outline" className="text-[10px]">
                            {e.agent_slug}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("pt-BR")}
                        {e.reference_id && ` · ${e.reference_id}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatBRL(Number(e.computed_charge_brl))}</p>
                      <Badge variant={STATUS_VARIANT[e.status] ?? "outline"} className="text-[10px]">
                        {t(`outcomes.status.${e.status}`, { defaultValue: e.status })}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

export default OutcomeBilling;
