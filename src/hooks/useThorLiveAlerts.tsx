/**
 * useThorLiveAlerts — canal global do Thor.
 *
 * Escuta em tempo real:
 *  - notifications: token_limit_100 (crítico) e token_limit_90 (aviso)
 *  - ambient_signals: severidade critical
 *
 * Emite toasts persistentes com CTA para abrir o Centro do Thor, mesmo que
 * o usuário não esteja na aba do dashboard onde o alerta seria visível.
 * Rodar uma única vez, em nível de layout logado.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Options {
  onOpenThorCenter?: () => void;
}

export function useThorLiveAlerts({ onOpenThorCenter }: Options = {}) {
  const { user } = useAuth();
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`thor-live-alerts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { id?: string; type?: string; title?: string; message?: string };
          if (!row?.id || seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);

          if (row.type === "token_limit_100") {
            toast.error(row.title ?? "Cofre de tokens zerado", {
              description: row.message ?? "Seus agentes vão parar. Renove agora.",
              duration: 15000,
              action: onOpenThorCenter
                ? { label: "Abrir Centro do Thor", onClick: onOpenThorCenter }
                : undefined,
            });
          } else if (row.type === "token_limit_90") {
            toast.warning(row.title ?? "Tokens quase acabando", {
              description: row.message ?? "Você passou dos 90%. Considere fazer upgrade.",
              duration: 10000,
              action: onOpenThorCenter
                ? { label: "Ver detalhes", onClick: onOpenThorCenter }
                : undefined,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ambient_signals", filter: `created_by=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { id?: string; severity?: string; title?: string };
          if (!row?.id || seenIds.current.has(row.id)) return;
          if (row.severity !== "critical") return;
          seenIds.current.add(row.id);

          toast.error(row.title ?? "Sinal crítico detectado", {
            description: "O Thor detectou algo que exige sua atenção.",
            duration: 12000,
            action: onOpenThorCenter
              ? { label: "Abrir Centro do Thor", onClick: onOpenThorCenter }
              : undefined,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, onOpenThorCenter]);
}
