import type { OnboardingFlow } from "@/components/onboarding-premium/types";

export const defaultAgentFlow: OnboardingFlow = {
  id: "default-agent",
  subjectType: "agent",
  welcome: {
    title: "Vamos ativar seu Agente",
    message:
      "Sou o Thor. Em cerca de 5 minutos, seu agente estará pronto pra assumir tarefas. Vou te mostrar cada passo.",
    estimatedMinutes: 5,
  },
  missions: [
    {
      id: "personality",
      title: "Definir personalidade",
      description: "Como o agente deve se comunicar com seus clientes.",
      target: "[data-onboarding='agent-tone']",
      tooltip: "Ajuste aqui o tom que o agente vai usar.",
      action: "highlight",
    },
    {
      id: "connect-tool",
      title: "Conectar 1 ferramenta",
      description: "Escolha a ferramenta principal que o agente vai usar.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integrations-list']",
      tooltip: "Conecte aqui a ferramenta principal.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "test",
      title: "Fazer um teste",
      description: "Roda um exemplo real e mostra a resposta gerada.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "activate",
      title: "Ativar",
      description: "Agente ativo. Ele já pode receber tarefas.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar agente",
    },
  ],
  testStep: {
    title: "Teste do agente",
    sampleTitle: "Exemplo",
    sampleBody: "Uma tarefa simples pra validar a resposta do agente.",
    generatedResponse:
      "Feito. Executei a tarefa e deixei o resumo salvo no seu histórico. Quer que eu repita com outros parâmetros?",
  },
  success: {
    title: "Agente ativo",
    summary: ["Personalidade definida", "Ferramenta conectada", "Teste aprovado"],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
