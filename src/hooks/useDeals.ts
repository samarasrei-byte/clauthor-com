import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { toast } from "sonner";

export type DealStage =
  | "novo"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "fechado_ganho"
  | "fechado_perdido";

export interface Deal {
  id: string;
  tenant_id: string;
  owner_id: string;
  lead_id: string | null;
  title: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_company: string | null;
  value_brl: number;
  stage: DealStage;
  source: string | null;
  notes: string | null;
  expected_close_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "bg-muted" },
  { key: "qualificado", label: "Qualificado", color: "bg-primary/10" },
  { key: "proposta", label: "Proposta", color: "bg-primary/20" },
  { key: "negociacao", label: "Negociação", color: "bg-primary/30" },
  { key: "fechado_ganho", label: "Ganho", color: "bg-emerald-500/20" },
  { key: "fechado_perdido", label: "Perdido", color: "bg-destructive/20" },
];

export function useDeals() {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ["deals", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Deal[];
    },
  });

  const createDeal = useMutation({
    mutationFn: async (
      input: Partial<Deal> & { title: string; stage?: DealStage }
    ) => {
      if (!user || !tenantId) throw new Error("no tenant");
      const { data, error } = await supabase
        .from("deals")
        .insert({
          tenant_id: tenantId,
          owner_id: user.id,
          title: input.title,
          contact_name: input.contact_name ?? null,
          contact_email: input.contact_email ?? null,
          contact_company: input.contact_company ?? null,
          value_brl: input.value_brl ?? 0,
          stage: input.stage ?? "novo",
          source: input.source ?? null,
          notes: input.notes ?? null,
          expected_close_date: input.expected_close_date ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", tenantId] });
      toast.success("Deal criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Deal> }) => {
      const { error } = await supabase.from("deals").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["deals", tenantId] });
      const prev = qc.getQueryData<Deal[]>(["deals", tenantId]);
      if (prev) {
        qc.setQueryData<Deal[]>(
          ["deals", tenantId],
          prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["deals", tenantId], ctx.prev);
      toast.error("Falha ao atualizar deal");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["deals", tenantId] }),
  });

  const deleteDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", tenantId] });
      toast.success("Deal removido");
    },
  });

  return { dealsQuery, createDeal, updateDeal, deleteDeal };
}
