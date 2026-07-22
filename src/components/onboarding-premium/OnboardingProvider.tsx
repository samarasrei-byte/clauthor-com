/**
 * OnboardingProvider · estado global do onboarding premium.
 *
 * Fluxo:
 *   1. Provider recebe subjectType + subjectRef; resolve o OnboardingFlow.
 *   2. Persiste progresso em customer_onboarding (best-effort).
 *   3. Expõe start/next/back/markComplete/skip/finish/end via context.
 *
 * Consome-se via `useOnboarding()` em qualquer componente descendente.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { resolveOnboardingFlow } from "@/config/onboarding";
import type { SubjectType } from "@/hooks/useCustomerOnboarding";
import { useCustomerOnboarding } from "@/hooks/useCustomerOnboarding";
import { trackKpi } from "@/lib/kpiTracker";
import type {
  OnboardingContextValue,
  OnboardingFlow,
  OnboardingStatus,
  MissionStepConfig,
} from "./types";

const Ctx = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  subjectType: SubjectType;
  subjectRef: string;
  subjectName?: string;
  children: ReactNode;
  /** Se true, abre em welcome quando não completado; senão fica idle. */
  autoOpen?: boolean;
}

export function OnboardingProvider({
  subjectType,
  subjectRef,
  subjectName,
  children,
  autoOpen = true,
}: OnboardingProviderProps) {
  const navigate = useNavigate();
  const { row, goToStep, complete, skip: persistSkip } = useCustomerOnboarding({
    subjectType,
    subjectRef,
    subjectName,
  });

  const flow: OnboardingFlow = useMemo(
    () => resolveOnboardingFlow(subjectType, subjectRef),
    [subjectType, subjectRef],
  );

  const [status, setStatus] = useState<OnboardingStatus>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  // Bootstrap: se persistência já está completada, pular; senão abrir welcome.
  useEffect(() => {
    if (!row) return;
    if (row.status === "completed") {
      setStatus("success");
      setCompleted(flow.missions.map((m) => m.id));
      setCurrentIndex(flow.missions.length - 1);
      return;
    }
    if (row.status === "skipped") {
      setStatus("skipped");
      return;
    }
    const prior = (row.steps_completed ?? []).filter((s) =>
      flow.missions.some((m) => m.id === s),
    );
    setCompleted(prior);
    const nextIdx = Math.min(prior.length, flow.missions.length - 1);
    setCurrentIndex(nextIdx);
    if (autoOpen && status === "idle") setStatus("welcome");
  }, [row, flow, autoOpen, status]);

  const currentStep: MissionStepConfig | null =
    status === "running" ? flow.missions[currentIndex] ?? null : null;

  const progress = useMemo(() => {
    const total = flow.missions.length + (flow.testStep ? 1 : 0);
    return Math.round((completed.length / total) * 100);
  }, [completed, flow]);

  const start = useCallback(() => {
    setStatus("running");
    setCurrentIndex((idx) => Math.max(idx, 0));
    trackKpi("onboarding_premium_started", { flow_id: flow.id } as never);
  }, [flow.id]);

  const markComplete = useCallback(
    (stepId: string) => {
      setCompleted((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
      trackKpi("onboarding_premium_step", { flow_id: flow.id, step_id: stepId } as never);
    },
    [flow.id],
  );

  const next = useCallback(() => {
    const step = flow.missions[currentIndex];
    if (!step) return;
    markComplete(step.id);
    void goToStep(step.id as never, {});

    const isLast = currentIndex >= flow.missions.length - 1;
    if (isLast) {
      if (flow.testStep) setStatus("test");
      else setStatus("success");
      return;
    }
    const nextStep = flow.missions[currentIndex + 1];
    setCurrentIndex(currentIndex + 1);
    if (nextStep?.route && nextStep.autoNavigate !== false) {
      navigate(nextStep.route);
    }
  }, [flow, currentIndex, goToStep, markComplete, navigate]);

  const back = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToTest = useCallback(() => {
    setStatus("test");
  }, []);

  const finish = useCallback(() => {
    setStatus("success");
    if (flow.testStep) markComplete("__test__");
    void complete({});
    trackKpi("onboarding_premium_completed", { flow_id: flow.id } as never);
  }, [flow, complete, markComplete]);

  const skip = useCallback(() => {
    setStatus("skipped");
    void persistSkip();
    trackKpi("onboarding_premium_skipped", { flow_id: flow.id } as never);
  }, [flow.id, persistSkip]);

  const end = useCallback(() => {
    setStatus("idle");
  }, []);

  // Listener global de completeEvent: qualquer página pode disparar
  // window.dispatchEvent(new CustomEvent("onboarding:google-connected"))
  useEffect(() => {
    const handlers: Array<{ event: string; fn: () => void }> = [];
    flow.missions.forEach((m) => {
      if (!m.completeEvent) return;
      const fn = () => markComplete(m.id);
      window.addEventListener(m.completeEvent, fn);
      handlers.push({ event: m.completeEvent, fn });
    });
    return () => handlers.forEach((h) => window.removeEventListener(h.event, h.fn));
  }, [flow, markComplete]);

  const value: OnboardingContextValue = {
    flow,
    status,
    currentIndex,
    currentStep,
    completed,
    progress,
    start,
    next,
    back,
    markComplete,
    goToTest,
    finish,
    skip,
    end,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}

export function useOnboardingSafe(): OnboardingContextValue | null {
  return useContext(Ctx);
}
