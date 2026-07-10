import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type OnboardingPath = "team" | "department" | "agent";

export interface OnboardingAnswers {
  path: OnboardingPath;
  department?: string;
  companySize?: string;
  tokenBudget?: string;
  teamGoal?: string;
  processMaturity?: string;
  agentArea?: string;
  usageFrequency?: string;
  completedAt: string;
}

export function useGuidedOnboarding() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at, onboarding_answers")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_answers) {
        setAnswers(data.onboarding_answers as unknown as OnboardingAnswers);
      }
      if (!data?.onboarded_at) {
        // Auto-abertura desativada: /welcome é a rota dedicada e o
        // OnboardingResumeBanner cobre retomadas. Mantemos `isOpen=false`
        // para não colidir com o dashboard nem com o Thor greeter.
        setIsOpen(false);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = useCallback(async (partial: Omit<OnboardingAnswers, "completedAt"> | null) => {
    if (!user) return;
    const payload: OnboardingAnswers | null = partial
      ? { ...partial, completedAt: new Date().toISOString() }
      : null;
    // Only persist "completed" when we have real answers. Skip stays reopenable.
    const update: { onboarding_answers: any; onboarded_at?: string; onboarding_completed?: boolean } = { onboarding_answers: payload as any };
    if (payload) {
      update.onboarded_at = new Date().toISOString();
      update.onboarding_completed = true;
    }
    await supabase.from("profiles").update(update).eq("user_id", user.id);

    try {
      await supabase.from("user_activity_stream").insert({
        user_id: user.id,
        event_type: payload ? "onboarding_completed" : "onboarding_skipped",
        title: payload ? `Onboarding: ${payload.path}` : "Onboarding pulado",
        entity_type: "onboarding",
        metadata: (payload ?? {}) as any,
      });
    } catch (e) {
      console.warn("[onboarding] failed to log analytics event", e);
    }

    setAnswers(payload);
    setIsOpen(false);
  }, [user]);

  const skip = useCallback(async () => {
    // Skip = fechar sem marcar como concluído. Volta a aparecer na próxima sessão.
    if (user) {
      try {
        await supabase.from("user_activity_stream").insert({
          user_id: user.id,
          event_type: "onboarding_skipped",
          title: "Onboarding pulado",
          entity_type: "onboarding",
          metadata: {} as any,
        });
      } catch {}
    }
    setIsOpen(false);
  }, [user]);

  return { isOpen, setIsOpen, answers, loading, save, skip };
}
