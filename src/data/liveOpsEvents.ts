/**
 * Live Ops Events · feed simulado de outputs dos agentes rodando 24/7.
 *
 * Não é log real (por privacidade dos clientes), é uma amostra
 * representativa do TIPO de output que a operação gera. Cada evento é
 * anonimizado e plausível dentro dos casos reais em `caseStudies.ts`.
 *
 * A composição do feed usa nomes dos agentes reais do org chart Clauthor.
 */

export interface LiveOpsEvent {
  /** Departamento que executou. */
  dept: string;
  /** Nome do agente (referência ao org chart interno). */
  agent: string;
  /** Ação executada · texto curto, foco no verbo. */
  action: string;
  /** Impacto quantificável, quando aplicável. */
  impact?: string;
}

export const LIVE_OPS_EVENTS: readonly LiveOpsEvent[] = [
  { dept: "Comercial", agent: "Kayo", action: "qualificou 3 leads inbound", impact: "+R$ 12.400 pipeline" },
  { dept: "Atendimento", agent: "Alice", action: "resolveu ticket #4821", impact: "42s de resposta" },
  { dept: "Marketing", agent: "Sofia", action: "agendou 12 posts pra semana" },
  { dept: "SDR", agent: "João Pedro", action: "reativou lead frio de 90 dias" },
  { dept: "Financeiro", agent: "Bruno", action: "conciliou 84 lançamentos", impact: "R$ 218k reconhecidos" },
  { dept: "Jurídico", agent: "Isabela", action: "revisou contrato de fornecedor", impact: "3 cláusulas críticas" },
  { dept: "RH", agent: "Marina", action: "triou 27 currículos pra vaga #12" },
  { dept: "Comercial", agent: "Ricardo", action: "enviou 8 propostas personalizadas" },
  { dept: "Suporte", agent: "Luana", action: "escalou 2 tickets pra time humano" },
  { dept: "Marketing", agent: "Diego", action: "publicou landing A/B de campanha" },
  { dept: "Atendimento", agent: "Alice", action: "converteu chat em oportunidade", impact: "R$ 4.900/mês" },
  { dept: "CS", agent: "Rafael", action: "detectou churn signal em 4 contas" },
  { dept: "SDR", agent: "Camila", action: "marcou 6 reuniões pra amanhã" },
  { dept: "Financeiro", agent: "Bruno", action: "enviou 34 cobranças automáticas" },
  { dept: "Comercial", agent: "Kayo", action: "fez follow-up de 19 propostas" },
];
