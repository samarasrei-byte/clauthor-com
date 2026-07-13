/**
 * useThorTouchpoints · fonte única para saber se o Thor já abordou o usuário
 * em determinado contexto (welcome inicial, alerta de tokens, recomendação
 * consultiva, etc.). Persiste no banco (`thor_touchpoints`) para durar entre
 * dispositivos e limpezas de cache, com fallback silencioso em localStorage
 * quando não houver sessão.
 */
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ThorContext =
  | "first_touch_dashboard"
  | "token_alert_80"
  | "token_alert_90"
  | "token_alert_100"
  | "consultant_recommendation"
  | "ambient_high_severity";

export interface ThorTouchpoint {
  id: string;
  context: string;
  seen_at: string;
  dismissed_at: string | null;
  cta_taken: boolean;
  metadata: Record<string, unknown>;
}

const LS_PREFIX = "clauthor-thor-tp";

export function useThorTouchpoints() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: touchpoints = [], isLoading } = useQuery({
    queryKey: ["thor-touchpoints", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thor_touchpoints")
        .select("id, context, seen_at, dismissed_at, cta_taken, metadata")
        .eq("user_id", user!.id)
        .order("seen_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ThorTouchpoint[];
    },
  });

  const byContext = useMemo(() => {
    const map = new Map<string, ThorTouchpoint>();
    touchpoints.forEach((tp) => {
      if (!map.has(tp.context)) map.set(tp.context, tp);
    });
    return map;
  }, [touchpoints]);

  const hasSeen = useCallback(
    (context: ThorContext | string): boolean => {
      if (byContext.has(context)) return true;
      // Fallback local (rede offline / anônimo)
      try {
        return typeof window !== "undefined" && !!localStorage.getItem(`${LS_PREFIX}-${context}`);
      } catch {
        return false;
      }
    },
    [byContext],
  );

  const markSeen = useCallback(
    async (
      context: ThorContext | string,
      opts: { ctaTaken?: boolean; metadata?: Record<string, unknown> } = {},
    ) => {
      // Local fallback imediato
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`${LS_PREFIX}-${context}`, new Date().toISOString());
        }
      } catch { /* ignore */ }

      if (!user) return;
      const payload = {
        user_id: user.id,
        context,
        seen_at: new Date().toISOString(),
        cta_taken: !!opts.ctaTaken,
        metadata: (opts.metadata ?? {}) as never,
      };
      const { error } = await supabase
        .from("thor_touchpoints")
        .upsert(payload, { onConflict: "user_id,context" });
      if (!error) {
        qc.invalidateQueries({ queryKey: ["thor-touchpoints", user.id] });
      }
    },
    [user, qc],
  );

  const markDismissed = useCallback(
    async (context: ThorContext | string) => {
      if (!user) return;
      await supabase
        .from("thor_touchpoints")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("context", context);
      qc.invalidateQueries({ queryKey: ["thor-touchpoints", user.id] });
    },
    [user, qc],
  );

  return { touchpoints, hasSeen, markSeen, markDismissed, isLoading };
}
