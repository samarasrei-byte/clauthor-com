/**
 * Onboarding Premium · types
 * Config-driven mission flows executed by the Thor specialist drawer.
 */
import type { SubjectType } from "@/hooks/useCustomerOnboarding";

export type MissionActionKind =
  | "navigate"          // muda de rota
  | "highlight"         // spotlight num seletor CSS
  | "external"          // abre URL externa (OAuth etc)
  | "confirm"           // apenas checkbox / avançar manual
  | "test";             // teste final da IA

export interface MissionStepConfig {
  id: string;
  title: string;
  description: string;
  /** Roteamento interno · se definido, `next()` navega */
  route?: string;
  /** CSS selector do elemento a destacar na tela (spotlight) */
  target?: string;
  /** Texto do tooltip ancorado ao alvo */
  tooltip?: string;
  /** Direção do tooltip · default "bottom" */
  tooltipSide?: "top" | "bottom" | "left" | "right";
  /** Tipo de ação */
  action?: MissionActionKind;
  /** Evento global (window CustomEvent) que marca o step como completo */
  completeEvent?: string;
  /** Se true, `next()` navega automaticamente sem esperar clique */
  autoNavigate?: boolean;
  /** Rótulo do CTA principal (default "Próximo") */
  ctaLabel?: string;
}

export interface OnboardingTestStep {
  title: string;
  sampleTitle: string;
  sampleBody: string;
  generatedResponse: string;
}

export interface OnboardingFlow {
  id: string;
  subjectType: SubjectType;
  matchRef?: string | RegExp;                 // opcional, se quiser casar por ref
  welcome: {
    title: string;
    message: string;
    estimatedMinutes: number;
  };
  missions: MissionStepConfig[];
  testStep?: OnboardingTestStep;
  success: {
    title: string;
    summary: string[];
    ctaLabel: string;
    ctaRoute: string;
  };
}

export type OnboardingStatus = "idle" | "welcome" | "running" | "test" | "success" | "skipped";

export interface OnboardingContextValue {
  flow: OnboardingFlow | null;
  status: OnboardingStatus;
  currentIndex: number;
  currentStep: MissionStepConfig | null;
  completed: string[];
  progress: number;                            // 0..100
  start: () => void;
  next: () => void;
  back: () => void;
  markComplete: (stepId: string) => void;
  goToTest: () => void;
  finish: () => void;
  skip: () => void;
  end: () => void;
}
