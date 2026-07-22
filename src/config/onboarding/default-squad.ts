import type { OnboardingFlow } from "@/components/onboarding-premium/types";

export const defaultSquadFlow: OnboardingFlow = {
  id: "default-squad",
  subjectType: "squad",
  welcome: {
    title: "Vamos ativar sua Squad",
    message:
      "Sou o Thor, seu especialista de implantação. Em cerca de 8 minutos sua Squad estará configurada e trabalhando pra sua empresa. Vou te mostrar exatamente onde clicar.",
    estimatedMinutes: 8,
  },
  missions: [
    {
      id: "welcome",
      title: "Conhecer a Squad",
      description: "Um tour rápido pelos agentes que compõem essa squad.",
      action: "confirm",
      ctaLabel: "Entendi",
    },
    {
      id: "connect-integrations",
      title: "Conectar integrações",
      description: "Ligamos as ferramentas que a squad precisa pra operar.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integrations-list']",
      tooltip: "Conecte aqui as ferramentas que sua squad vai usar.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "configure-behavior",
      title: "Configurar tom e respostas",
      description: "Definimos o tom de voz e as regras que a IA vai seguir.",
      route: "/dashboard/agents",
      target: "[data-onboarding='agent-tone']",
      tooltip: "Ajuste aqui a personalidade que sua IA vai usar.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "test-run",
      title: "Fazer um teste",
      description: "Vamos simular uma situação real e ver a IA respondendo.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "activate-monitoring",
      title: "Ativar monitoramento",
      description: "A partir daqui a squad opera sozinha, com aprovações inteligentes.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar",
    },
  ],
  testStep: {
    title: "Teste rápido",
    sampleTitle: "Cenário",
    sampleBody:
      "Um cliente entrou em contato pedindo status do pedido. Veja como sua squad responderia.",
    generatedResponse:
      "Olá! Localizei seu pedido — ele saiu para entrega hoje pela manhã. Assim que o motoboy confirmar, te aviso por aqui. Alguma outra dúvida?",
  },
  success: {
    title: "Sua Squad está ativa",
    summary: [
      "Integrações conectadas",
      "Tom e regras configurados",
      "Teste aprovado",
      "Monitoramento ativo",
    ],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
