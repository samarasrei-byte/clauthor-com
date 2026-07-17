import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActivationStep =
  | "checkout"
  | "subscription"
  | "provisioning"
  | "deploy"
  | "first_execution";

export type ActivationStatus = "pending" | "running" | "done" | "failed";

export interface ActivationStepRow {
  id: string;
  contracted_department_id: string;
  user_id: string;
  step: ActivationStep;
  status: ActivationStatus;
  attempts: number;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractedDepartment {
  id: string;
  department_id: string;
  department_name: string | null;
  status: string;
  created_at: string;
  agent_count: number | null;
  monthly_price_cents: number | null;
  currency: string | null;
}

export const ALL_STEPS: ActivationStep[] = [
  "checkout",
  "subscription",
  "provisioning",
  "deploy",
  "first_execution",
];

export const STEP_LABELS: Record<ActivationStep, { title: string; description: string }> = {
  checkout: {
    title: "Pagamento",
    description: "Confirmação da assinatura PayPal.",
  },
  subscription: {
    title: "Assinatura ativa",
    description: "Registro do plano recorrente na sua conta.",
  },
  provisioning: {
    title: "Provisionamento",
    description: "Criação dos agentes do departamento.",
  },
  deploy: {
    title: "Deploy",
    description: "Liberação de créditos e ativação do departamento.",
  },
  first_execution: {
    title: "Primeira execução",
    description: "Um agente rodou sua primeira tarefa.",
  },
};

interface UseActivationStepsResult {
  departments: ContractedDepartment[];
  stepsByDept: Record<string, ActivationStepRow[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useActivationSteps(): UseActivationStepsResult {
  const [departments, setDepartments] = useState<ContractedDepartment[]>([]);
  const [stepsByDept, setStepsByDept] = useState<Record<string, ActivationStepRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setDepartments([]);
        setStepsByDept({});
        return;
      }

      const { data: deps, error: depErr } = await supabase
        .from("contracted_departments")
        .select("id, department_id, department_name, status, created_at, agent_count, monthly_price_cents, currency")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (depErr) throw depErr;

      const list = (deps ?? []) as ContractedDepartment[];
      setDepartments(list);

      if (list.length === 0) {
        setStepsByDept({});
        return;
      }

      const ids = list.map((d) => d.id);
      const { data: steps, error: stepErr } = await supabase
        .from("department_activation_steps")
        .select("*")
        .in("contracted_department_id", ids);
      if (stepErr) throw stepErr;

      const grouped: Record<string, ActivationStepRow[]> = {};
      (steps ?? []).forEach((row) => {
        const r = row as ActivationStepRow;
        (grouped[r.contracted_department_id] ??= []).push(r);
      });
      setStepsByDept(grouped);
    } catch (e) {
      setError((e as Error).message ?? "Falha ao carregar status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription for step changes on this user's rows.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`activation-steps-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "department_activation_steps",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return { departments, stepsByDept, loading, error, refresh: load };
}

export function computeStepMap(rows: ActivationStepRow[]): Record<ActivationStep, ActivationStepRow | null> {
  const map = Object.fromEntries(ALL_STEPS.map((s) => [s, null])) as Record<
    ActivationStep,
    ActivationStepRow | null
  >;
  rows.forEach((r) => {
    map[r.step] = r;
  });
  return map;
}
