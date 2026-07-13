/**
 * departmentRoi · configuração por departamento pro cálculo de ROI mensal.
 *
 * Cada departamento tem um "peso" próprio de economia:
 *   - minutesSavedPerTask: quanto tempo humano cada tarefa entregue poupa.
 *     Departamentos com tarefas mais densas (jurídico, financeiro) poupam
 *     mais minutos por execução do que canais de alto volume (suporte).
 *   - hourlyRateBRL: custo/hora do profissional humano equivalente no Brasil.
 *     Baseado em faixas de mercado de analistas pleno/sênior em SP/RJ (2025).
 *
 * Regras:
 *   - Números conservadores. Melhor subestimar economia do que inflar.
 *   - Sempre existe DEFAULT_ROI_CONFIG como fallback pra departamentos
 *     desconhecidos ou legados.
 *   - Auditável: qualquer alteração aqui muda o card do dashboard sem código.
 */

export interface DepartmentRoiConfig {
  /** Minutos de trabalho humano poupados por tarefa entregue com sucesso. */
  minutesSavedPerTask: number;
  /** Custo/hora do equivalente humano em BRL. */
  hourlyRateBRL: number;
}

/** Fallback pra departamentos sem entrada explícita. */
export const DEFAULT_ROI_CONFIG: DepartmentRoiConfig = {
  minutesSavedPerTask: 12,
  hourlyRateBRL: 80,
};

/**
 * Configuração por department_id (mesmo id usado em contracted_departments).
 * Ajuste conservador — vide docs/audits/AUDITORIA_PRECOS_DEPARTAMENTOS_2026.md.
 */
export const DEPARTMENT_ROI_CONFIG: Record<string, DepartmentRoiConfig> = {
  comercial:    { minutesSavedPerTask: 15, hourlyRateBRL: 90 },
  marketing:    { minutesSavedPerTask: 20, hourlyRateBRL: 95 },
  suporte:      { minutesSavedPerTask: 8,  hourlyRateBRL: 60 },
  tecnologia:   { minutesSavedPerTask: 25, hourlyRateBRL: 140 },
  financeiro:   { minutesSavedPerTask: 18, hourlyRateBRL: 110 },
  prospeccao:   { minutesSavedPerTask: 10, hourlyRateBRL: 75 },
  criacao:      { minutesSavedPerTask: 30, hourlyRateBRL: 100 },
  rh:           { minutesSavedPerTask: 15, hourlyRateBRL: 85 },
  juridico:     { minutesSavedPerTask: 35, hourlyRateBRL: 180 },
  advocacia:    { minutesSavedPerTask: 35, hourlyRateBRL: 180 },
  operacoes:    { minutesSavedPerTask: 15, hourlyRateBRL: 85 },
  produto:      { minutesSavedPerTask: 22, hourlyRateBRL: 130 },
  dados:        { minutesSavedPerTask: 25, hourlyRateBRL: 140 },
  compliance:   { minutesSavedPerTask: 28, hourlyRateBRL: 150 },
};

export function getDepartmentRoiConfig(departmentId?: string | null): DepartmentRoiConfig {
  if (!departmentId) return DEFAULT_ROI_CONFIG;
  return DEPARTMENT_ROI_CONFIG[departmentId] ?? DEFAULT_ROI_CONFIG;
}
