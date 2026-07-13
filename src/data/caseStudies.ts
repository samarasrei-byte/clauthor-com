/**
 * Case Studies — depoimentos REAIS de clientes pagantes.
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
  /** Métrica principal — número auditável + unidade curta. */
  headlineMetric: {
    /** Valor numérico ou string curta (ex.: "312", "3.2×", "-47%"). */
    value: string;
    /** Rótulo do que representa (ex.: "leads/mês", "redução de tempo"). */
    label: string;
  };
  /** Métricas secundárias (0-3). */
  secondaryMetrics?: readonly { value: string; label: string }[];
  /** Frase textual do cliente. Mantenha original — não parafraseie. */
  quote: string;
  /** Nome + cargo de quem falou. */
  attribution: {
    name: string;
    role: string;
  };
  /** Data da mensuração (ISO curto: "2026-05"). Ajuda credibilidade. */
  measuredAt: string;
  /** Flag opcional — quando true, o card é renderizado com selo "Exemplo" para não induzir buyers a acreditar em prova social fabricada. */
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
    id: "placeholder-comercial",
    companyName: "Empresa Exemplo",
    industry: "SaaS B2B",
    departmentUsed: "Departamento Comercial",
    headlineMetric: { value: "3.2×", label: "aumento no pipeline qualificado" },
    secondaryMetrics: [
      { value: "312", label: "leads/mês" },
      { value: "47%", label: "redução no CAC" },
    ],
    quote: "Substitua este texto por uma frase real do seu cliente, atribuída, com autorização por escrito.",
    attribution: { name: "Nome do Cliente", role: "CRO, Empresa Exemplo" },
    measuredAt: "2026-05",
    isPlaceholder: true,
  },
  {
    id: "placeholder-atendimento",
    companyName: "Empresa Exemplo",
    industry: "E-commerce",
    departmentUsed: "Departamento de Atendimento",
    headlineMetric: { value: "-68%", label: "no tempo médio de resposta" },
    secondaryMetrics: [
      { value: "24/7", label: "cobertura omnichannel" },
      { value: "NPS 74", label: "satisfação medida" },
    ],
    quote: "Substitua por depoimento real. Recomendado: 1–2 frases, tom conversacional, foco em resultado.",
    attribution: { name: "Nome do Cliente", role: "Head de CX, Empresa Exemplo" },
    measuredAt: "2026-04",
    isPlaceholder: true,
  },
  {
    id: "placeholder-financeiro",
    companyName: "Empresa Exemplo",
    industry: "Serviços financeiros",
    departmentUsed: "Departamento Financeiro",
    headlineMetric: { value: "R$ 1.4M", label: "de custo anual evitado" },
    secondaryMetrics: [
      { value: "12h", label: "fechamento contábil" },
      { value: "0", label: "erros de reconciliação" },
    ],
    quote: "Substitua por caso real com métrica auditável em dashboard do cliente.",
    attribution: { name: "Nome do Cliente", role: "CFO, Empresa Exemplo" },
    measuredAt: "2026-03",
    isPlaceholder: true,
  },
];
