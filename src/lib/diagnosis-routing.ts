/**
 * Mapa dor → departamento recomendado.
 * Usado pelo LandingDiagnosisDialog para rotear o visitante ao lugar certo
 * antes de entrar na plataforma.
 */

export type PainId = "leads" | "ops" | "content" | "support" | "legal" | "other";
export type CompanySize = "solo" | "small" | "mid";

export interface DiagnosisAnswers {
  pain: PainId;
  freeText?: string;
  niche?: string;
  size?: CompanySize;
  createdAt: string;
}

export interface Recommendation {
  departmentLabel: string;
  tagline: string;
  route: string;
  ctaLabel: string;
}

export const PAIN_TO_RECOMMENDATION: Record<PainId, Recommendation> = {
  leads: {
    departmentLabel: "Vendas & Prospecção",
    tagline: "Squad que capta, qualifica e agenda leads no LinkedIn e WhatsApp 24/7.",
    route: "/departamentos#vendas",
    ctaLabel: "Ver departamento de Vendas",
  },
  ops: {
    departmentLabel: "Operações",
    tagline: "Automatiza cobrança, follow-up, relatórios e tarefas repetitivas do dia a dia.",
    route: "/departamentos#operacoes",
    ctaLabel: "Ver departamento de Operações",
  },
  content: {
    departmentLabel: "Marketing & Conteúdo",
    tagline: "Produz posts, artigos e roteiros com a voz da sua marca em escala.",
    route: "/departamentos#marketing",
    ctaLabel: "Ver departamento de Marketing",
  },
  support: {
    departmentLabel: "Atendimento",
    tagline: "Responde clientes por WhatsApp, e-mail e chat sem depender de time humano.",
    route: "/departamentos#atendimento",
    ctaLabel: "Ver departamento de Atendimento",
  },
  legal: {
    departmentLabel: "Squad Jurídica",
    tagline: "6 agentes que captam, qualificam e assinam contratos com clientes do seu escritório.",
    route: "/advocacia",
    ctaLabel: "Ver Squad Jurídica",
  },
  other: {
    departmentLabel: "Time recomendado por Thor",
    tagline: "Nosso orquestrador monta o time ideal a partir do resultado que você descreveu.",
    route: "/outcomes",
    ctaLabel: "Falar com Thor",
  },
};

const STORAGE_KEY = "clauthor:diagnosis";
const SEEN_KEY = "clauthor:diagnosis:seen";

export function saveDiagnosis(answers: DiagnosisAnswers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* localStorage indisponível */
  }
}

export function loadDiagnosis(): DiagnosisAnswers | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiagnosisAnswers) : null;
  } catch {
    return null;
  }
}

export function hasSeenDiagnosis(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markDiagnosisSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* noop */
  }
}
