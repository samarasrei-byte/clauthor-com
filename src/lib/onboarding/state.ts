/**
 * Onboarding state — single source of truth.
 *
 * Persistência canônica em `profiles.onboarding_completed` + `onboarded_at`.
 * Todo fluxo (OnboardingZero, Welcome, ThorOnboarding, Sector) deve chamar
 * `markOnboardingComplete` antes de navegar pro dashboard.
 */
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
}

export async function readOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarded_at")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      completed: Boolean(data?.onboarding_completed || data?.onboarded_at),
      completedAt: (data?.onboarded_at as string | null) ?? null,
    };
  } catch {
    return { completed: false, completedAt: null };
  }
}

export async function markOnboardingComplete(
  userId: string,
  meta?: { source?: string; snapshot?: Record<string, unknown> },
): Promise<void> {
  try {
    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarded_at: new Date().toISOString(),
        ...(meta?.snapshot ? { onboarding_answers: meta.snapshot as never } : {}),
      } as never)
      .eq("user_id", userId);
  } catch {
    /* non-blocking — o gate cliente ainda funciona via flag em sessionStorage */
  }
  try {
    sessionStorage.setItem("clauthor:onboarding-completed", "1");
  } catch { /* ignore */ }
}

export function hasLocalOnboardingFlag(): boolean {
  try {
    return sessionStorage.getItem("clauthor:onboarding-completed") === "1";
  } catch {
    return false;
  }
}
