/**
 * Case Studies · depoimentos REAIS de clientes pagantes.
 *
 * REGRA DE OURO: só entra aqui o que for verificável.
 * - Nome do cliente/empresa: nome real, com autorização por escrito.
 * - Métrica: número auditável (print, dashboard, contrato). Nada de estimativa.
 * - Quote: frase textual do cliente, atribuída (nome + cargo).
 * - Logo: arquivo em src/assets/case-logos/ (ou URL absoluta autorizada).
 *
 * Se você não tem um caso real com autorização, MANTENHA O ARRAY VAZIO.
 * A landing esconde a seção automaticamente quando `CASE_STUDIES.length === 0`.
 *
 * Fabricar caso = risco reputacional. Enterprise buyers checam.
 */

export interface CaseStudy {
  /** Identificador estável, kebab-case. */
  id: string;
  /** Nome oficial da empresa cliente. */
  companyName: string;
  /** Vertical / setor (ex.: "Advocacia empresarial", "SaaS B2B"). */
  industry: string;
  /** URL ou path do logo (SVG/PNG). Deixe undefined para omitir. */
  logoUrl?: string;
  /** Departamento contratado (opcional, ex.: "Vendas Autônomas"). */
  departmentUsed?: string;
  /** Métrica principal · número auditável + unidade curta. */
  headlineMetric: {
    /** Valor numérico ou string curta (ex.: "312", "3.2×", "-47%"). */
    value: string;
    /** Rótulo do que representa (ex.: "leads/mês", "redução de tempo"). */
    label: string;
  };
  /** Métricas secundárias (0-3). */
  secondaryMetrics?: readonly { value: string; label: string }[];
  /** Frase textual do cliente. Mantenha original · não parafraseie. */
  quote: string;
  /** Nome + cargo de quem falou. */
  attribution: {
    name: string;
    role: string;
  };
  /** Data da mensuração (ISO curto: "2026-05"). Ajuda credibilidade. */
  measuredAt: string;
  /** Flag opcional · quando true, o card é renderizado com selo "Exemplo" para não induzir buyers a acreditar em prova social fabricada. */
  isPlaceholder?: boolean;
}

/**
 * VAZIO POR PADRÃO. Preencha só com casos reais autorizados.
 *
 * Exemplo (comente para ativar assim que tiver o primeiro caso real):
 *
 * {
 *   id: "acme-vendas-2026-05",
 *   companyName: "Acme Ltda",
 *   industry: "Distribuição industrial",
 *   departmentUsed: "Vendas Autônomas",
 *   headlineMetric: { value: "312", label: "leads qualificados / mês" },
 *   secondaryMetrics: [
 *     { value: "3.2×", label: "aumento no pipeline" },
 *     { value: "R$ 1.4M", label: "receita influenciada" },
 *   ],
 *   quote: "Em 60 dias, o departamento de vendas da Clauthor gerou mais pipeline qualificado do que nosso time interno em 6 meses.",
 *   attribution: { name: "Fulano Silva", role: "CRO, Acme" },
 *   measuredAt: "2026-05",
 * }
 */
export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    id: "elefante-de-peso-whatsapp-2026",
    companyName: "Elefante de Peso",
    industry: "Agência de marketing",
    departmentUsed: "Squad de WhatsApp + Comercial",
    headlineMetric: { value: "R$ 34 mil", label: "de MRR novo em 2 meses" },
    secondaryMetrics: [
      { value: "2 meses", label: "do zero ao resultado" },
      { value: "WhatsApp", label: "canal principal da campanha" },
    ],
    quote: "Em dois meses de campanha via WhatsApp com os agentes da Clauthor, adicionamos cerca de R$ 34 mil em receita recorrente ao nosso MRR.",
    attribution: { name: "Time Elefante de Peso", role: "Agência · cliente Clauthor" },
    measuredAt: "2026-05",
  },
  {
    id: "cobank-aquisicao-2026",
    companyName: "CoBank",
    industry: "Fintech",
    departmentUsed: "Departamento Comercial + Aquisição",
    headlineMetric: { value: "3.000+", label: "novos usuários em 4 meses" },
    secondaryMetrics: [
      { value: "4 meses", label: "janela de aquisição" },
      { value: "Clauthor", label: "orquestrando a operação" },
    ],
    quote: "Em quatro meses operando com a Clauthor, trouxemos mais de 3 mil novos usuários para a base do CoBank.",
    attribution: { name: "Time CoBank", role: "Fintech · cliente Clauthor" },
    measuredAt: "2026-06",
  },
];

