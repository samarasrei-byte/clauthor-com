import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

type OutcomeType =
  | "lead_qualified"
  | "meeting_booked"
  | "contract_signed"
  | "sale_closed"
  | "document_generated"
  | "task_completed"
  | "custom";

interface Rule {
  id: string;
  outcome_type: OutcomeType;
  agent_slug: string | null;
  price_brl: number;
  percentage: number;
  min_charge_brl: number;
  max_charge_brl: number | null;
  is_active: boolean;
}

const OUTCOME_TYPES: OutcomeType[] = [
  "lead_qualified",
  "meeting_booked",
  "contract_signed",
  "sale_closed",
  "document_generated",
  "task_completed",
  "custom",
];

const OutcomePricingRules = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Rule>>({
    outcome_type: "lead_qualified",
    price_brl: 0,
    percentage: 0,
    min_charge_brl: 0,
    agent_slug: "",
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    const { data: tm } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!tm) {
      setLoading(false);
      return;
    }
    setTenantId(tm.tenant_id);
    const { data } = await supabase
      .from("outcome_pricing_rules")
      .select("id, outcome_type, agent_slug, price_brl, percentage, min_charge_brl, max_charge_brl, is_active")
      .eq("tenant_id", tm.tenant_id)
      .order("created_at", { ascending: false });
    setRules((data as Rule[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!tenantId || !draft.outcome_type) return;
    setSaving(true);
    const { error } = await supabase.from("outcome_pricing_rules").insert({
      tenant_id: tenantId,
      outcome_type: draft.outcome_type as OutcomeType,
      agent_slug: draft.agent_slug?.trim() ? draft.agent_slug.trim() : null,
      price_brl: Number(draft.price_brl) || 0,
      percentage: Number(draft.percentage) || 0,
      min_charge_brl: Number(draft.min_charge_brl) || 0,
      is_active: draft.is_active ?? true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("outcomes.rule_created", { defaultValue: "Regra criada" }));
    setDraft({ outcome_type: "lead_qualified", price_brl: 0, percentage: 0, min_charge_brl: 0, agent_slug: "", is_active: true });
    void load();
  };

  const handleToggle = async (rule: Rule) => {
    const { error } = await supabase
      .from("outcome_pricing_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("outcome_pricing_rules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("outcomes.rule_deleted", { defaultValue: "Regra removida" }));
    void load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {t("outcomes.rules_title", { defaultValue: "Regras de cobrança por resultado" })}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("outcomes.rules_subtitle", {
            defaultValue:
              "Defina quanto cobrar por cada resultado entregue pelos seus agentes (lead qualificado, reunião, contrato, etc.).",
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Create form */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 rounded-lg border bg-muted/20">
          <div className="md:col-span-2">
            <Label className="text-xs">{t("outcomes.field_type", { defaultValue: "Tipo" })}</Label>
            <Select
              value={draft.outcome_type}
              onValueChange={(v) => setDraft({ ...draft, outcome_type: v as OutcomeType })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTCOME_TYPES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {t(`outcomes.type.${o}`, { defaultValue: o })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("outcomes.field_agent_slug", { defaultValue: "Agente (slug)" })}</Label>
            <Input
              placeholder="hunter"
              value={draft.agent_slug ?? ""}
              onChange={(e) => setDraft({ ...draft, agent_slug: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">{t("outcomes.field_price", { defaultValue: "Fixo (R$)" })}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.price_brl ?? 0}
              onChange={(e) => setDraft({ ...draft, price_brl: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">{t("outcomes.field_percentage", { defaultValue: "% do valor" })}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.percentage ?? 0}
              onChange={(e) => setDraft({ ...draft, percentage: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">{t("outcomes.field_min", { defaultValue: "Mínimo" })}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.min_charge_brl ?? 0}
              onChange={(e) => setDraft({ ...draft, min_charge_brl: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <Button size="sm" onClick={handleCreate} disabled={saving || !tenantId}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t("outcomes.add_rule", { defaultValue: "Adicionar regra" })}
            </Button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Carregando..." })}</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("outcomes.rules_empty", { defaultValue: "Nenhuma regra configurada." })}
          </p>
        ) : (
          <ul className="space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border bg-card/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {t(`outcomes.type.${r.outcome_type}`, { defaultValue: r.outcome_type })}
                    </span>
                    {r.agent_slug && (
                      <Badge variant="outline" className="text-[10px]">{r.agent_slug}</Badge>
                    )}
                    {!r.is_active && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("outcomes.inactive", { defaultValue: "Inativa" })}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    R$ {Number(r.price_brl).toFixed(2)} + {Number(r.percentage).toFixed(2)}%
                    {r.min_charge_brl > 0 && ` · min R$ ${Number(r.min_charge_brl).toFixed(2)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={r.is_active} onCheckedChange={() => handleToggle(r)} />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default OutcomePricingRules;
