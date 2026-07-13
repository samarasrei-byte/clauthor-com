/**
 * Onboarding recommendation · pure, deterministic.
 * Maps (pain, companySize, sector, familiarity) → recommendation card(s).
 */

export type Pain =
  | "leads_vendas"
  | "atendimento"
  | "conteudo"
  | "operacoes"
  | "juridico"
  | "explorar";

export type CompanySize = "solo" | "2-10" | "11-50" | "50+";
export type Familiarity = "iniciante" | "intermediario" | "avancado";

export type RecommendationKind = "department" | "squad" | "agent";

export interface OnboardingInput {
  pain: Pain;
  sector: string;
  size: CompanySize;
  familiarity: Familiarity;
}

export interface Recommendation {
  kind: RecommendationKind;
  /** department slug when kind=department; squad/agent id otherwise */
  targetId: string;
  title: string;
  pitch: string;
  cta: string;
  href: string;
}

export interface RecommendationResult {
  primary: Recommendation;
  alternatives: Recommendation[];
  empathyLine: string;
}

const painToDept: Record<Pain, string> = {
  leads_vendas: "comercial",
  atendimento: "suporte",
  conteudo: "marketing",
  operacoes: "operacoes",
  juridico: "juridico",
  explorar: "comercial",
};

const deptLabel: Record<string, string> = {
  comercial: "Comercial & Vendas",
  suporte: "Atendimento & Sucesso",
  marketing: "Marketing & Conteúdo",
  operacoes: "Operações",
  juridico: "Jurídico",
  criacao: "Criação & Design",
  prospeccao: "Prospecção Outbound",
  rh: "Pessoas & RH",
  financeiro: "Financeiro",
};

const empathyByPain: Record<Pain, string> = {
  leads_vendas: "Vender mais sem contratar mais é a dor #1 de quem escala.",
  atendimento: "Cliente esperando resposta é receita evaporando · resolvemos isso.",
  conteudo: "Produzir conteúdo consistente sem depender de agência é possível.",
  operacoes: "Processo manual repetido é o imposto invisível da operação.",
  juridico: "Compliance e contratos travam o time · seus agentes destravam.",
  explorar: "Sem pressa · vamos te mostrar o que faz mais sentido.",
};

export function recommend(input: OnboardingInput): RecommendationResult {
  const deptId = painToDept[input.pain];
  const size = input.size;
  const goDepartment = size === "11-50" || size === "50+";

  const departmentRec: Recommendation = {
    kind: "department",
    targetId: deptId,
    title: `Departamento de ${deptLabel[deptId] ?? deptId}`,
    pitch:
      "Uma operação completa · 6 a 9 agentes coordenados, entrega desde o primeiro dia, a partir de R$ 1.700/mês.",
    cta: "Ativar departamento",
    href: `/departamentos/${deptId}`,
  };

  const squadRec: Recommendation = {
    kind: "squad",
    targetId: deptId,
    title: `Squad enxuta de ${deptLabel[deptId] ?? deptId}`,
    pitch:
      "3 a 4 agentes essenciais · a versão certa para times pequenos que precisam de resultado sem overhead.",
    cta: "Montar squad",
    href: `/team-builder?preset=${deptId}`,
  };

  const agentRec: Recommendation = {
    kind: "agent",
    targetId: deptId,
    title: `Especialista solo de ${deptLabel[deptId] ?? deptId}`,
    pitch:
      "Um único agente focado · ideal para testar o método antes de escalar.",
    cta: "Contratar agente",
    href: `/library?dept=${deptId}`,
  };

  const primary = goDepartment ? departmentRec : squadRec;
  const alternatives = goDepartment
    ? [squadRec, agentRec]
    : [departmentRec, agentRec];

  // Adjust pitch language for beginners
  if (input.familiarity === "iniciante") {
    primary.pitch = primary.pitch + " Configuração guiada · você não precisa saber de IA.";
  }

  return {
    primary,
    alternatives,
    empathyLine: empathyByPain[input.pain],
  };
}
