/**
 * useWowFlow — state machine do momento "uau" pós-signup.
 * Estados: idle → capturing → generating → ready → approved | error
 * Streaming direto da Edge Function wow-generate; fallback para template
 * pré-gerado se algo falhar. Zero espera desnecessária pro usuário.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { getPainOption, type PainCategory } from "@/lib/wow-router";
import { WOW_FALLBACKS } from "@/data/wowTemplates";
import { trackKpi } from "@/lib/kpiTracker";
import logger from "@/lib/logger";

type WowState = "idle" | "generating" | "ready" | "approved" | "error";

interface Timings {
  signupAt: number;
  formSubmittedAt?: number;
  outputReadyAt?: number;
  approvedAt?: number;
}

const STORAGE_KEY = "wow-draft-v1";

interface Draft {
  company: string;
  pain: string;
  painCategory: PainCategory;
  output: string;
  usedFallback: boolean;
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch { return null; }
}
function saveDraft(d: Draft) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* quota */ }
}
function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function useWowFlow() {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();

  const initialDraft = useMemo(() => loadDraft(), []);
  const [state, setState] = useState<WowState>(initialDraft ? "ready" : "idle");
  const [company, setCompany] = useState(initialDraft?.company ?? "");
  const [pain, setPain] = useState(initialDraft?.pain ?? "");
  const [painCategory, setPainCategory] = useState<PainCategory>(initialDraft?.painCategory ?? "vendas_b2b");
  const [output, setOutput] = useState(initialDraft?.output ?? "");
  const [usedFallback, setUsedFallback] = useState(initialDraft?.usedFallback ?? false);
  const [error, setError] = useState<string | null>(null);

  const timingsRef = useRef<Timings>({ signupAt: Date.now() });
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    trackKpi("wow_started", { source: "instant_wow" });
  }, []);

  const generate = useCallback(
    async (opts: { company: string; pain: string; painCategory: PainCategory }) => {
      setCompany(opts.company);
      setPain(opts.pain);
      setPainCategory(opts.painCategory);
      setError(null);
      setOutput("");
      setUsedFallback(false);
      setState("generating");

      timingsRef.current.formSubmittedAt = Date.now();
      trackKpi("wow_form_submitted", {
        source: "instant_wow",
        pain_category: opts.painCategory,
        company: opts.company.slice(0, 60),
        ttfv_signup_to_form_ms: Date.now() - timingsRef.current.signupAt,
      });

      const option = getPainOption(opts.painCategory);
      const controller = new AbortController();
      abortRef.current = controller;
      // Cap total gen at 20s → fallback
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

      let accumulated = "";
      let didStream = false;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const projectId = (import.meta as unknown as { env?: { VITE_SUPABASE_PROJECT_ID?: string } }).env?.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/wow-generate`;

        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            company: opts.company,
            pain: opts.pain,
            painCategory: opts.painCategory,
            systemPrompt: option.systemPrompt,
            userPrompt: option.userPromptTemplate(opts.company, opts.pain),
          }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) throw new Error(`gateway_${resp.status}`);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                accumulated += delta;
                didStream = true;
                setOutput(accumulated);
              }
            } catch { /* keep-alive or partial chunk */ }
          }
        }
      } catch (err) {
        logger.warn("[wow] streaming failed, using fallback:", err);
      } finally {
        clearTimeout(timeoutId);
        abortRef.current = null;
      }

      // Fallback if nothing streamed or empty
      if (!didStream || accumulated.trim().length < 40) {
        accumulated = WOW_FALLBACKS[opts.painCategory](opts.company);
        setOutput(accumulated);
        setUsedFallback(true);
      }

      timingsRef.current.outputReadyAt = Date.now();
      const formMs = timingsRef.current.outputReadyAt - (timingsRef.current.formSubmittedAt ?? timingsRef.current.outputReadyAt);
      trackKpi("wow_output_ready", {
        source: "instant_wow",
        pain_category: opts.painCategory,
        agent_slug: option.agentSlug,
        used_fallback: !didStream || accumulated.trim().length < 40,
        ttfv_form_to_output_ms: formMs,
        output_chars: accumulated.length,
      });

      saveDraft({
        company: opts.company,
        pain: opts.pain,
        painCategory: opts.painCategory,
        output: accumulated,
        usedFallback: !didStream,
      });
      setState("ready");
    },
    [],
  );

  const regenerate = useCallback(async () => {
    if (!company || !pain) return;
    trackKpi("wow_regenerated", { source: "instant_wow", pain_category: painCategory });
    await generate({ company, pain, painCategory });
  }, [company, pain, painCategory, generate]);

  const approve = useCallback(async () => {
    if (!user || state !== "ready") return { ok: false as const };
    timingsRef.current.approvedAt = Date.now();
    const option = getPainOption(painCategory);

    // Persist as approved delivery. Best-effort: even if DB fails, UX segue.
    try {
      if (tenantId) {
        await supabase.from("approvals").insert({
          tenant_id: tenantId,
          title: `${option.outputLabel} — ${company}`.slice(0, 240),
          delivery_type: "document",
          status: "approved",
          content: {
            markdown: output,
            company,
            pain,
            pain_category: painCategory,
            agent_slug: option.agentSlug,
            source: "instant_wow",
            used_fallback: usedFallback,
          },
          created_by: user.id,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      logger.warn("[wow] approval insert failed:", err);
    }

    const t = timingsRef.current;
    const ttfvMs = t.approvedAt - t.signupAt;
    trackKpi("first_wow_approved", {
      source: "instant_wow",
      pain_category: painCategory,
      agent_slug: option.agentSlug,
      used_fallback: usedFallback,
      output_chars: output.length,
      ttfv_ms: ttfvMs,
      ttfv_output_to_approve_ms: t.approvedAt - (t.outputReadyAt ?? t.approvedAt),
    });
    trackKpi("time_to_first_value", {
      source: "instant_wow",
      ttfv_ms: ttfvMs,
      ttfv_signup_to_form_ms: (t.formSubmittedAt ?? t.signupAt) - t.signupAt,
      ttfv_form_to_output_ms: (t.outputReadyAt ?? t.signupAt) - (t.formSubmittedAt ?? t.signupAt),
      ttfv_output_to_approve_ms: t.approvedAt - (t.outputReadyAt ?? t.approvedAt),
    });

    clearDraft();
    setState("approved");
    return { ok: true as const };
  }, [user, state, painCategory, output, company, pain, tenantId, usedFallback]);

  const skip = useCallback(() => {
    trackKpi("wow_skipped", { source: "instant_wow" });
    clearDraft();
  }, []);

  return {
    state,
    company, pain, painCategory, output, usedFallback, error,
    start, generate, regenerate, approve, skip,
    setCompany, setPain, setPainCategory,
  };
}
