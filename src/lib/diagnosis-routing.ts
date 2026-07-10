/**
 * Mapa dor → departamento recomendado.
 * Usado pelo LandingDiagnosisDialog para rotear o visitante ao lugar certo
 * antes de entrar na plataforma.
 */

export type PainId = "leads" | "ops" | "content" | "support" | "legal" | "other";
export type DeliveryMode = "department" | "squad";

export interface DiagnosisAnswers {
  pain: PainId;
  freeText?: string;
  company?: string;
  website?: string;
  delivery?: DeliveryMode;
  createdAt: string;
}

export interface Recommendation {
  departmentLabel: string;
  tagline: string;
  route: string;
  ctaLabel: string;
  /** Bullets do que o departamento faz — mostrado no passo final. */
  does: string[];
  /** Economia estimada (BRL/mês) vs custo CLT equivalente. */
  monthlySavings: number;
  /** Tempo estimado até primeira ação executada. */
  timeToValue: string;
}

export const PAIN_TO_RECOMMENDATION: Record<PainId, Recommendation> = {
  leads: {
    departmentLabel: "Vendas & Prospecção",
    tagline: "Squad que capta, qualifica e agenda leads no LinkedIn e WhatsApp — 24/7.",
    route: "/departamentos#comercial",
    ctaLabel: "Ativar departamento de Vendas",
    does: [
      "Prospecta contas no LinkedIn com ICP customizado",
      "Envia sequência multicanal (InMail + e-mail + WhatsApp)",
      "Qualifica com BANT e agenda direto no seu Google Calendar",
      "CRM sincronizado — cada lead com histórico completo",
    ],
    monthlySavings: 51500,
    timeToValue: "24h",
  },
  ops: {
    departmentLabel: "Operações",
    tagline: "Automatiza cobrança, follow-up, relatórios e tarefas repetitivas do dia a dia.",
    route: "/departamentos#tecnologia",
    ctaLabel: "Ativar departamento de Operações",
    does: [
      "Cobrança recorrente com régua inteligente",
      "Relatórios semanais no seu e-mail sem input humano",
      "Integrações via API com seu ERP e planilhas",
      "SLA e alertas quando algo sai do trilho",
    ],
    monthlySavings: 94500,
    timeToValue: "48h",
  },
  content: {
    departmentLabel: "Marketing & Conteúdo",
    tagline: "Produz posts, artigos e roteiros com a voz da sua marca — em escala.",
    route: "/departamentos#marketing",
    ctaLabel: "Ativar departamento de Marketing",
    does: [
      "Calendário editorial mensal aprovado por você",
      "Copy SEO-otimizado por Copywriter Sênior",
      "Roteiros de vídeo, threads e newsletters",
      "Media buyer roda campanhas Meta/Google",
    ],
    monthlySavings: 42000,
    timeToValue: "24h",
  },
  support: {
    departmentLabel: "Atendimento",
    tagline: "Responde clientes por WhatsApp, e-mail e chat sem depender de time humano.",
    route: "/departamentos#atendimento",
    ctaLabel: "Ativar departamento de Atendimento",
    does: [
      "Atendimento 24/7 em WhatsApp, e-mail e chat",
      "Handoff inteligente para humano só no essencial",
      "Base de conhecimento aprende com cada ticket",
      "CSAT e NPS medidos automaticamente",
    ],
    monthlySavings: 38000,
    timeToValue: "24h",
  },
  legal: {
    departmentLabel: "Squad Jurídica",
    tagline: "6 agentes que captam, qualificam e assinam contratos com clientes do seu escritório.",
    route: "/advocacia",
    ctaLabel: "Ver Squad Jurídica",
    does: [
      "Captação de casos qualificados via mídia paga",
      "Triagem automática por área do direito",
      "Redação de peças e contratos em minutos",
      "Assinatura eletrônica e onboarding do cliente",
    ],
    monthlySavings: 68000,
    timeToValue: "72h",
  },
  other: {
    departmentLabel: "Time recomendado por Thor",
    tagline: "Nosso orquestrador monta o time ideal a partir do resultado que você descreveu.",
    route: "/outcomes",
    ctaLabel: "Falar com Thor agora",
    does: [
      "Thor analisa seu site e sua descrição",
      "Monta um squad customizado com agentes específicos",
      "Você aprova ou ajusta antes de ativar",
      "Time entra em operação no mesmo dia",
    ],
    monthlySavings: 45000,
    timeToValue: "mesmo dia",
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
