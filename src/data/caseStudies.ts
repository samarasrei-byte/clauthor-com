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
  // Adicione casos reais aqui.
];
