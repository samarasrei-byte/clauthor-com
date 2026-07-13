/**
 * AdminRoiConfig · edição das taxas de ROI por departamento.
 *
 * Somente `admin` (app_role) enxerga essa rota — proteção via ProtectedRoute
 * requireAdmin no App.tsx. As policies da tabela `department_roi_config` já
 * bloqueiam writes pra qualquer outro role, então mesmo se alguém chegasse
 * na URL sem ser admin, o INSERT/UPDATE retornaria 403.
 *
 * O que o admin faz aqui:
 *   - Ajusta `minutes_saved_per_task` e `hourly_rate_brl` por departamento.
 *   - Edita nota justificando a mudança (auditoria futura).
 *   - Desativa uma linha (soft delete via is_active=false).
 *
 * O `MonthlyROICard` lê essa tabela em tempo real (staleTime=60s), então a
 * mudança do admin aparece no card do cliente em até 1 minuto. Sem deploy.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Save, Loader2, ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RoiRow {
  id: string;
  department_id: string;
  minutes_saved_per_task: number;
  hourly_rate_brl: number;
  notes: string | null;
  is_active: boolean;
  updated_at: string;
}

interface DraftPatch {
  minutes_saved_per_task?: number;
  hourly_rate_brl?: number;
  notes?: string | null;
  is_active?: boolean;
}

export default function AdminRoiConfig() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, DraftPatch>>({});

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-roi-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_roi_config")
        .select("*")
        .order("department_id", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RoiRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DraftPatch }) => {
      const { error } = await supabase
        .from("department_roi_config")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-roi-config"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-roi"] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      toast({ title: "Salvo", description: "A configuração de ROI foi atualizada." });
    },
    onError: (err: Error) => {
      toast({
        title: "Falha ao salvar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const patchDraft = (id: string, patch: DraftPatch) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSave = (row: RoiRow) => {
    const patch = drafts[row.id];
    if (!patch) return;
    saveMutation.mutate({ id: row.id, patch });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          ROI · configuração por departamento
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Estas taxas alimentam o card "ROI do mês" no dashboard do cliente. Cada
          departamento tem seu próprio tempo poupado por tarefa e custo/hora do
          equivalente humano. Alterações refletem em ~60s no cliente, sem deploy.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" strokeWidth={1.5} />
          <p>
            Seja conservador. É melhor subestimar economia e superentregar do que
            inflar números e queimar credibilidade. Documente cada mudança na nota.
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const draft = drafts[row.id] ?? {};
            const isDirty = Object.keys(draft).length > 0;
            const isSaving =
              saveMutation.isPending && saveMutation.variables?.id === row.id;

            return (
              <div
                key={row.id}
                className={cn(
                  "rounded-xl border p-4 sm:p-5 transition-colors",
                  isDirty
                    ? "border-primary/50 bg-primary/[0.02]"
                    : "border-border/60 bg-card/50",
                  !row.is_active && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground capitalize">
                      {row.department_id}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                      Atualizado {new Date(row.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ativo</span>
                    <Switch
                      checked={draft.is_active ?? row.is_active}
                      onCheckedChange={(v) => patchDraft(row.id, { is_active: v })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Minutos por tarefa
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      value={draft.minutes_saved_per_task ?? row.minutes_saved_per_task}
                      onChange={(e) =>
                        patchDraft(row.id, {
                          minutes_saved_per_task: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      R$/hora do humano equivalente
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={2000}
                      step="0.01"
                      value={draft.hourly_rate_brl ?? row.hourly_rate_brl}
                      onChange={(e) =>
                        patchDraft(row.id, {
                          hourly_rate_brl: Number(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </label>
                </div>

                <label className="block mb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Notas (justificativa)
                  </span>
                  <Textarea
                    rows={2}
                    value={draft.notes ?? row.notes ?? ""}
                    onChange={(e) => patchDraft(row.id, { notes: e.target.value })}
                    placeholder="Ex.: ajuste após benchmark do 3T25 vs. salários pleno em SP."
                    className="mt-1 resize-none"
                  />
                </label>

                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    disabled={!isDirty || isSaving}
                    onClick={() => handleSave(row)}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-2" />
                    )}
                    Salvar alterações
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
