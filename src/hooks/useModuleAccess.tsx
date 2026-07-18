import { useQuery } from "@tanstack/react-query";
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

/**
 * Acesso a módulos premium (Video Studio, Art, Contracts, Carousel):
 *  - Admin: acesso irrestrito.
 *  - Usuário comum: só após contratar um departamento que libera o módulo.
 */
const ADMIN_ONLY_TESTING = false;

export interface ModuleAccessState {
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  unlockedBy: string[];
  requiredDepartments: string[];
}

export function useModuleAccess(module: keyof typeof MODULE_UNLOCKS): ModuleAccessState {
  const { user } = useAuth();
  const required = MODULE_UNLOCKS[module] ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["module-access", user?.id, module],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [{ data: adminData }, { data: deps }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" }),
        supabase
          .from("contracted_departments")
          .select("department_id, status")
          .eq("user_id", user!.id)
          .eq("status", "active"),
      ]);
      const isAdmin = adminData === true;
      const owned = (deps ?? []).map((d: any) => d.department_id as string);
      const unlockedBy = owned.filter((id) => required.includes(id));
      return { isAdmin, unlockedBy };
    },
  });

  if (!user) {
    return { loading: false, hasAccess: false, isAdmin: false, unlockedBy: [], requiredDepartments: required };
  }
  if (isLoading || !data) {
    return { loading: true, hasAccess: false, isAdmin: false, unlockedBy: [], requiredDepartments: required };
  }
  const hasAccess = ADMIN_ONLY_TESTING ? data.isAdmin : (data.isAdmin || data.unlockedBy.length > 0);
  return {
    loading: false,
    hasAccess,
    isAdmin: data.isAdmin,
    unlockedBy: data.unlockedBy,
    requiredDepartments: required,
  };
}
