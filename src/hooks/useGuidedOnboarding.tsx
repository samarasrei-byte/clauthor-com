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
        // small delay so it doesn't collide with page load
        setTimeout(() => !cancelled && setIsOpen(true), 900);
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
    await supabase
      .from("profiles")
      .update({
        onboarding_answers: payload as any,
        onboarded_at: new Date().toISOString(),
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    setAnswers(payload);
    setIsOpen(false);
  }, [user]);

  const skip = useCallback(async () => {
    await save(null);
  }, [save]);

  return { isOpen, setIsOpen, answers, loading, save, skip };
}
