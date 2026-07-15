import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Módulos premium liberados por contratação de departamento.
 * Chave = módulo, valor = department_ids em `contracted_departments` que liberam.
 */
export const MODULE_UNLOCKS: Record<string, string[]> = {
  video: ["marketing", "comercial"],
  art: ["marketing"],
  contracts: ["juridico", "comercial"],
  carousel: ["marketing"],
};

export interface ModuleAccessState {
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  unlockedBy: string[];        // department_ids ativos que liberam
  requiredDepartments: string[]; // ids necessários
}

export function useModuleAccess(module: keyof typeof MODULE_UNLOCKS): ModuleAccessState {
  const { user } = useAuth();
  const [state, setState] = useState<ModuleAccessState>({
    loading: true,
    hasAccess: false,
    isAdmin: false,
    unlockedBy: [],
    requiredDepartments: MODULE_UNLOCKS[module] ?? [],
  });

  useEffect(() => {
    const required = MODULE_UNLOCKS[module] ?? [];
    if (!user) {
      setState({ loading: false, hasAccess: false, isAdmin: false, unlockedBy: [], requiredDepartments: required });
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: adminData }, { data: deps }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase
          .from("contracted_departments")
          .select("department_id, status")
          .eq("user_id", user.id)
          .eq("status", "active"),
      ]);
      if (cancelled) return;
      const isAdmin = adminData === true;
      const owned = (deps ?? []).map((d: any) => d.department_id as string);
      const unlockedBy = owned.filter((id) => required.includes(id));
      setState({
        loading: false,
        hasAccess: isAdmin || unlockedBy.length > 0,
        isAdmin,
        unlockedBy,
        requiredDepartments: required,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, module]);

  return state;
}
