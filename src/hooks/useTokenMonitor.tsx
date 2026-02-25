import { useEffect, useState, useCallback } from "react";
import { useCredits } from "./useCredits";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AlertLevel = "normal" | "caution" | "warning" | "critical";

interface TokenMonitorState {
  alertLevel: AlertLevel;
  usagePercentage: number;
  showUpgradePrompt: boolean;
  lastNotifiedThreshold: number | null;
}

const THRESHOLD_MESSAGES: Record<number, { title: string; description: string; level: AlertLevel }> = {
  80: {
    title: "80% dos tokens utilizados",
    description: "Considere fazer upgrade para evitar interrupções.",
    level: "caution",
  },
  90: {
    title: "90% dos tokens utilizados",
    description: "Seus tokens estão quase esgotados. Faça upgrade agora.",
    level: "warning",
  },
  100: {
    title: "Limite de tokens atingido!",
    description: "Faça upgrade para continuar usando os agentes.",
    level: "critical",
  },
};

export function useTokenMonitor() {
  const { credits, usagePercentage, refetch } = useCredits();
  const { user } = useAuth();
  const [state, setState] = useState<TokenMonitorState>({
    alertLevel: "normal",
    usagePercentage: 0,
    showUpgradePrompt: false,
    lastNotifiedThreshold: null,
  });

  // Determine alert level from usage
  const getAlertLevel = useCallback((pct: number): AlertLevel => {
    if (pct >= 100) return "critical";
    if (pct >= 90) return "warning";
    if (pct >= 80) return "caution";
    return "normal";
  }, []);

  // Show toast when threshold is crossed
  useEffect(() => {
    if (!credits || usagePercentage === 0) return;

    const alertLevel = getAlertLevel(usagePercentage);
    const threshold = usagePercentage >= 100 ? 100 : usagePercentage >= 90 ? 90 : usagePercentage >= 80 ? 80 : 0;

    if (threshold > 0 && threshold !== state.lastNotifiedThreshold) {
      const msg = THRESHOLD_MESSAGES[threshold];
      if (msg) {
        if (threshold >= 100) {
          toast.error(msg.title, { description: msg.description, duration: 10000 });
        } else if (threshold >= 90) {
          toast.warning(msg.title, { description: msg.description, duration: 8000 });
        } else {
          toast.info(msg.title, { description: msg.description, duration: 6000 });
        }
      }

      setState(prev => ({
        ...prev,
        alertLevel,
        usagePercentage,
        showUpgradePrompt: threshold >= 80,
        lastNotifiedThreshold: threshold,
      }));
    } else {
      setState(prev => ({
        ...prev,
        alertLevel,
        usagePercentage,
      }));
    }
  }, [usagePercentage, credits, getAlertLevel, state.lastNotifiedThreshold]);

  // Listen for realtime notifications about token alerts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`token-alerts-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          if (notification.type?.startsWith("token_limit_")) {
            refetch();
            const metadata = notification.metadata || {};
            if (metadata.suggest_upgrade) {
              setState(prev => ({ ...prev, showUpgradePrompt: true }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const dismissUpgradePrompt = useCallback(() => {
    setState(prev => ({ ...prev, showUpgradePrompt: false }));
  }, []);

  return {
    ...state,
    credits,
    remainingCredits: credits ? credits.total_credits - credits.used_credits : 0,
    isAtLimit: usagePercentage >= 100,
    dismissUpgradePrompt,
    refetch,
  };
}
