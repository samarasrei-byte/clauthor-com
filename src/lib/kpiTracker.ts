/**
 * KPI Tracker · Fase 2 metrics for Departamentos Prontos funnel.
 *
 * Emits events to:
 *  1. `window.dataLayer` (GTM/GA4 compatible · zero backend required)
 *  2. `logger.info` in dev for immediate observability
 *  3. `sessionStorage` ring buffer (`kpi_events`, last 100) for debugging
 *
 * Zero cost, zero migration. Consumers can bolt on GA4/PostHog later by
 * subscribing to `window.dataLayer.push` · no code changes needed here.
 *
 * The 4 Fase 2 KPIs:
 *  - `department_demo_click`        · user clicked "Ver funcionando (60s)"
 *  - `department_demo_completed`    · user watched the 60s demo to the end
 *  - `department_hire_click`        · user clicked "Contratar" (card or demo)
 *  - `onboarding_department_picked` · user picked a department in onboarding
 */
import logger from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

export type KpiEventName =
  | "department_demo_click"
  | "department_demo_completed"
  | "department_hire_click"
  | "onboarding_department_picked"
  | "diagnosis_recap_activate"
  | "diagnosis_recap_talk_thor"
  | "thor_guide_section_play"
  | "thor_guide_section_replay"
  | "thor_guide_mute_toggle"
  | "replay_opened"
  | "replay_step_expanded"
  | "replay_completed_view"
  | "replay_action"
  | "replay_explained"
  | "wow_started"
  | "wow_form_submitted"
  | "wow_output_ready"
  | "wow_output_failed"
  | "first_wow_approved"
  | "wow_regenerated"
  | "wow_skipped"
  | "wow_variant_assigned"
  | "wow_voice_started"
  | "wow_voice_transcribed"
  | "wow_voice_failed"
  | "time_to_first_value";


export interface KpiEventPayload {
  department_id?: string;
  department_name?: string;
  source?: "landing" | "onboarding" | "dashboard" | "live_demo" | "departamentos_page" | "diagnosis_recap" | "thor_guide" | "replay" | "approvals" | "activity" | "task" | "instant_wow";
  price_monthly?: number;
  duration_ms?: number;
  pain?: string;
  has_briefing?: boolean;
  has_site_summary?: boolean;
  section?: string;
  is_first_visit?: boolean;
  muted?: boolean;
  persisted?: boolean;
  run_id?: string;
  step_type?: string;
  steps_count?: number;
  action?: "approve" | "reject" | "open" | "close";
  pain_category?: string;
  agent_slug?: string;
  company?: string;
  used_fallback?: boolean;
  ttfv_ms?: number;
  ttfv_signup_to_form_ms?: number;
  ttfv_form_to_output_ms?: number;
  ttfv_output_to_approve_ms?: number;
  output_chars?: number;
  variant?: "form" | "voice";
  duration_recorded_ms?: number;
  chars?: number;
  cached?: boolean;
}




declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const RING_BUFFER_KEY = "kpi_events";
const RING_BUFFER_MAX = 100;

// Server-side persistence: buffer events and flush in batches.
// Only events named in PERSIST_SET are sent to the backend to keep noise low.
const PERSIST_SET = new Set<KpiEventName>([
  "wow_started",
  "wow_form_submitted",
  "wow_output_ready",
  "wow_output_failed",
  "first_wow_approved",
  "wow_regenerated",
  "wow_skipped",
  "wow_variant_assigned",
  "wow_voice_started",
  "wow_voice_transcribed",
  "wow_voice_failed",
  "time_to_first_value",
]);

interface PendingEvent { event: string; payload: Record<string, unknown> }
const pendingQueue: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushQueue() {
  flushTimer = null;
  if (pendingQueue.length === 0) return;
  const batch = pendingQueue.splice(0, pendingQueue.length);
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return; // No auth: skip persistence (still tracked client-side).
    await supabase.functions.invoke("log-kpi", { body: { events: batch } });
  } catch (err) {
    logger.warn("[kpi] server flush failed:", err);
  }
}

function schedulePersist(event: KpiEventName, payload: KpiEventPayload) {
  if (!PERSIST_SET.has(event)) return;
  pendingQueue.push({ event, payload: payload as Record<string, unknown> });
  if (!flushTimer) flushTimer = setTimeout(flushQueue, 1500);
}

/** Fire-and-forget: never throws, never blocks the UI. */
export function trackKpi(event: KpiEventName, payload: KpiEventPayload): void {
  try {
    const enriched = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // 1. GTM/GA4 layer
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(enriched);

      // 2. Session ring buffer for debugging
      try {
        const raw = window.sessionStorage.getItem(RING_BUFFER_KEY);
        const arr: unknown[] = raw ? JSON.parse(raw) : [];
        arr.push(enriched);
        if (arr.length > RING_BUFFER_MAX) arr.splice(0, arr.length - RING_BUFFER_MAX);
        window.sessionStorage.setItem(RING_BUFFER_KEY, JSON.stringify(arr));
      } catch {
        /* sessionStorage quota / privacy mode · ignore */
      }
    }

    // 3. Dev logger
    logger.info("[kpi]", event, payload);

    // 4. Server-side persistence (auth users only, batched).
    schedulePersist(event, payload);
  } catch (err) {
    // Tracking must never break UX.
    logger.error("[kpi] tracking failed", err);
  }
}


/** Read the ring buffer · useful for smoke tests and internal dashboards. */
export function readKpiBuffer(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RING_BUFFER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
