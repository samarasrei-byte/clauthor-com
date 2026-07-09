import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubjectType = "agent" | "squad" | "department";

export interface SetupAnswers {
  primary_goal?: string;
  urgency?: "low" | "medium" | "high";
  main_channels?: string[];
  budget_range?: string;
  success_metric?: string;
  first_task?: string;
  extra_pain?: string;
  [k: string]: unknown;
}

export interface CustomerOnboardingRow {
  id: string;
  user_id: string;
  tenant_id: string | null;
  subject_type: SubjectType;
  subject_ref: string;
  subject_name: string | null;
  current_step: string;
  steps_completed: string[];
  answers: SetupAnswers;
  status: "in_progress" | "completed" | "skipped";
  started_at: string;
  completed_at: string | null;
}

export const SETUP_STEPS = [
  "welcome",
  "diagnostic",
  "credentials",
  "kpis",
  "first_action",
] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export const STEP_LABELS: Record<SetupStep, string> = {
  welcome: "Boas-vindas",
  diagnostic: "Diagnóstico",
  credentials: "Conexões",
  kpis: "Metas",
  first_action: "Ativação",
};

interface UseCustomerOnboardingArgs {
  subjectType: SubjectType;
  subjectRef: string;
  subjectName?: string;
}

export function useCustomerOnboarding({ subjectType, subjectRef, subjectName }: UseCustomerOnboardingArgs) {
  const { user } = useAuth();
  const [row, setRow] = useState<CustomerOnboardingRow | null>(null);
  const [prefill, setPrefill] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load or bootstrap the row + pull prior signal from profiles.onboarding_answers
  useEffect(() => {
    if (!user || !subjectRef) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: existing }, { data: profile }] = await Promise.all([
        supabase
          .from("customer_onboarding")
          .select("*")
          .eq("user_id", user.id)
          .eq("subject_type", subjectType)
          .eq("subject_ref", subjectRef)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("onboarding_answers")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      if (profile?.onboarding_answers) {
        setPrefill(profile.onboarding_answers as Record<string, unknown>);
      }

      if (existing) {
        setRow(existing as unknown as CustomerOnboardingRow);
      } else {
        const { data: created, error } = await supabase
          .from("customer_onboarding")
          .insert({
            user_id: user.id,
            subject_type: subjectType,
            subject_ref: subjectRef,
            subject_name: subjectName ?? null,
            current_step: "welcome",
            steps_completed: [],
            answers: {},
            status: "in_progress",
          })
          .select("*")
          .single();
        if (!error && created) setRow(created as unknown as CustomerOnboardingRow);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, subjectType, subjectRef, subjectName]);

  const progress = useMemo(() => {
    if (!row) return 0;
    return Math.round((row.steps_completed.length / SETUP_STEPS.length) * 100);
  }, [row]);

  const goToStep = useCallback(
    async (step: SetupStep, patch?: Partial<SetupAnswers>) => {
      if (!row) return;
      setSaving(true);
      const nextCompleted = Array.from(new Set([...(row.steps_completed ?? []), row.current_step])).filter(
        (s) => SETUP_STEPS.includes(s as SetupStep),
      );
      const nextAnswers = { ...(row.answers ?? {}), ...(patch ?? {}) };
      const { data, error } = await supabase
        .from("customer_onboarding")
        .update({
          current_step: step,
          steps_completed: nextCompleted,
          answers: nextAnswers as never,
        })
        .eq("id", row.id)
        .select("*")
        .single();

      if (!error && data) setRow(data as unknown as CustomerOnboardingRow);
      setSaving(false);
    },
    [row],
  );

  const complete = useCallback(
    async (patch?: Partial<SetupAnswers>) => {
      if (!row) return;
      setSaving(true);
      const nextCompleted = Array.from(new Set([...(row.steps_completed ?? []), row.current_step]));
      const nextAnswers = { ...(row.answers ?? {}), ...(patch ?? {}) };
      const { data, error } = await supabase
        .from("customer_onboarding")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          steps_completed: nextCompleted,
          answers: nextAnswers,
        })
        .eq("id", row.id)
        .select("*")
        .single();
      if (!error && data) setRow(data as unknown as CustomerOnboardingRow);

      // best-effort activity log
      try {
        await supabase.from("user_activity_stream").insert({
          user_id: user?.id,
          event_type: "customer_onboarding_completed",
          title: `Setup concluído · ${row.subject_name ?? row.subject_ref}`,
          entity_type: "customer_onboarding",
          entity_id: row.id,
          metadata: { subject_type: row.subject_type, subject_ref: row.subject_ref } as unknown as Record<string, unknown>,
        } as never);
      } catch { /* silent */ }
      setSaving(false);
    },
    [row, user?.id],
  );

  const skip = useCallback(async () => {
    if (!row) return;
    setSaving(true);
    await supabase
      .from("customer_onboarding")
      .update({ status: "skipped", completed_at: new Date().toISOString() })
      .eq("id", row.id);
    setSaving(false);
  }, [row]);

  return { row, prefill, loading, saving, progress, goToStep, complete, skip };
}
