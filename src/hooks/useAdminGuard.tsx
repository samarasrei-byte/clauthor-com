import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * useAdminGuard — Camada extra de RBAC no cliente.
 *
 * `ProtectedRoute requireAdmin` já bloqueia navegação; este hook adiciona uma
 * revalidação SERVER-SIDE via `has_role(auth.uid(), 'admin')` no momento em
 * que a rota admin monta. Se o flag `isAdmin` do contexto (localStorage/state)
 * tiver sido adulterado, o servidor recusa e redirecionamos.
 *
 * Uso: `useAdminGuard()` em qualquer página/rota admin sensível.
 */
export function useAdminGuard(redirectTo: string = "/dashboard") {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState<null | boolean>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    let cancel = false;
    (async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (cancel) return;
      if (error || data !== true) {
        toast.error("Acesso restrito — permissão de administrador necessária.");
        navigate(redirectTo, { replace: true });
        setVerified(false);
      } else {
        setVerified(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, isLoading, navigate, redirectTo]);

  return { verified, isLoading };
}
