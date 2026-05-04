import type { TourStep } from "@/components/ThorGuidedTour";

/**
 * Tour steps for the Landing Page
 */
export const LANDING_TOUR_STEPS: TourStep[] = [
  {
    label: "Bem-vindo à CLAUTHOR",
    speech:
      "E aí! Eu sou o Thor, CEO e orquestrador de toda a equipe autônoma da CLAUTHOR. Vou te mostrar como funciona essa plataforma que vai transformar seu negócio. Vem comigo!",
  },
  {
    label: "Sua equipe de IA",
    speech:
      "Aqui é onde tudo começa. A CLAUTHOR te dá acesso a mais de 200 agentes de IA especializados - de SDR a CFO, de copywriter a analista de segurança. Cada um é treinado para uma função específica do seu negócio.",
  },
  {
    label: "Como funciona",
    speech:
      "O processo é simples: primeiro você ensina seus agentes sobre sua empresa, depois contrata os que precisa, e eu orquestro tudo automaticamente. É como ter uma equipe inteira trabalhando 24 horas por dia!",
  },
  {
    label: "Resultados reais",
    speech:
      "Nossos clientes economizam em média 85% comparado com equipes tradicionais, com agentes que nunca dormem, nunca faltam e melhoram com o tempo. Quer ver como isso funciona na prática?",
  },
  {
    label: "Próximos passos",
    speech:
      "Clica em 'Começar Grátis' pra criar sua conta. Eu vou te guiar pessoalmente no setup - vamos montar sua equipe de IA em menos de 2 minutos. Te espero lá dentro!",
  },
];

/**
 * Tour steps for the Client Dashboard
 */
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    label: "Central de Comando",
    speech:
      "Bem-vindo ao seu painel de controle! Aqui é o coração da operação. Eu sou o Thor e vou te guiar por cada seção pra você dominar tudo rapidinho.",
  },
  {
    selector: '[data-tour="sidebar"]',
    label: "Menu lateral",
    speech:
      "Esse é seu menu principal. Aqui você navega entre seus agentes, operações, inteligência e configurações. Tudo organizado por grupos pra facilitar sua vida.",
  },
  {
    selector: '[data-tour="overview"]',
    label: "Visão geral",
    speech:
      "Na visão geral você vê tudo de relance: quantos agentes estão ativos, execuções realizadas, seus créditos e as métricas mais importantes do dia.",
  },
  {
    selector: '[data-tour="thor-chat"]',
    label: "Fale comigo!",
    speech:
      "Aqui é onde você fala diretamente comigo! Pode me pedir qualquer coisa: criar tarefas, analisar dados, enviar emails, ou simplesmente tirar dúvidas. Eu orquestro tudo com os agentes certos.",
  },
  {
    selector: '[data-tour="agents"]',
    label: "Seus agentes",
    speech:
      "Na seção de agentes você vê todos que foram contratados, pode conversar com cada um individualmente e acompanhar o desempenho deles em tempo real.",
  },
  {
    selector: '[data-tour="operations"]',
    label: "Operações",
    speech:
      "A área de operações é onde o trabalho acontece! Empresa, tarefas no kanban, pipeline de conteúdo, entregas e até transcrição de chamadas comerciais. Tudo automatizado.",
  },
  {
    selector: '[data-tour="intelligence"]',
    label: "Inteligência",
    speech:
      "Na inteligência você monitora tudo: insights em tempo real, timeline de atividades, Control Tower e Mission Control. É o olho que tudo vê!",
  },
  {
    selector: '[data-tour="settings"]',
    label: "Configurações",
    speech:
      "E por último, nas configurações você ajusta credenciais, conexões com plataformas, perfil da equipe e plano de assinatura. Tudo num lugar só.",
  },
  {
    label: "Pronto pra começar!",
    speech:
      "Agora você sabe onde tudo fica! Minha dica: comece ensinando sobre sua empresa no Company Board, depois contrate seus primeiros agentes. E lembra - estou sempre aqui pra te ajudar. É só me chamar!",
  },
];
