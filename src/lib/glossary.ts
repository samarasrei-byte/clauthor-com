/**
 * Glossário canônico da Clauthor (P1 — foco/consolidação).
 *
 * Fonte única para os 4 conceitos que o usuário final vê. Todo o resto
 * (Squad, Workforce, Command Center, Control Tower, Neural Network,
 * Execution/Run, Approval) existe internamente, mas some da UX pública.
 *
 * Uso:
 *   import { GLOSSARY } from "@/lib/glossary";
 *   <h1>{GLOSSARY.departamento.plural}</h1>
 */

export const GLOSSARY = {
  departamento: {
    singular: "Departamento",
    plural: "Departamentos",
    // Substitui: Squad, Workforce (no discurso público).
    aliases: ["Squad", "Workforce"] as const,
    definition:
      "Unidade contratável da Clauthor. Um departamento chega pronto com todos os agentes especializados necessários para operar sozinho.",
  },
  agente: {
    singular: "Agente",
    plural: "Agentes",
    aliases: ["Specialist", "AI Worker"] as const,
    definition:
      "Especialista de IA que executa um papel dentro de um departamento (SDR, redator, analista jurídico, etc.).",
  },
  tarefa: {
    singular: "Tarefa",
    plural: "Tarefas",
    // Substitui: Execution, Run.
    aliases: ["Execution", "Run"] as const,
    definition:
      "Cada trabalho que um agente executa. Toda tarefa tem status, custo e replay auditável.",
  },
  aprovacao: {
    singular: "Aprovação",
    plural: "Aprovações",
    aliases: ["Approval", "Review"] as const,
    definition:
      "Ponto onde o humano aprova, ajusta ou rejeita uma entrega do agente antes dela sair pra produção.",
  },
  painel: {
    singular: "Painel",
    plural: "Painéis",
    // Substitui, no discurso público: Command Center, Control Tower, Neural Network.
    aliases: ["Command Center", "Control Tower", "Neural Network"] as const,
    definition:
      "Onde você comanda seus departamentos, aprova entregas e vê resultados em tempo real.",
  },
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;
