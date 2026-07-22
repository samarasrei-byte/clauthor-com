import type { OnboardingFlow } from "@/components/onboarding-premium/types";

/**
 * Fluxo especializado · Squad de Gestão de Reputação.
 * Casa quando subjectRef contém "reputa".
 */
export const reputacaoFlow: OnboardingFlow = {
  id: "reputacao",
  subjectType: "squad",
  matchRef: /reputa/i,
  welcome: {
    title: "Vamos ativar sua Squad de Reputação",
    message:
      "Sou o Thor. Em cerca de 8 minutos, sua squad estará monitorando Google, Reclame Aqui e Meta e respondendo por você — com sua aprovação. Vou te mostrar cada botão.",
    estimatedMinutes: 8,
  },
  missions: [
    {
      id: "welcome",
      title: "Conhecer a Squad",
      description:
        "3 agentes trabalham juntos: um monitora avaliações, outro classifica o tom, um terceiro escreve a resposta.",
      action: "confirm",
      ctaLabel: "Entendi",
    },
    {
      id: "connect-google",
      title: "Conectar Google",
      description: "Google Meu Negócio pra capturar avaliações em tempo real.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integration-google']",
      tooltip: "Clique aqui para conectar seu Google.",
      action: "highlight",
      autoNavigate: true,
      completeEvent: "onboarding:google-connected",
    },
    {
      id: "connect-reclame-aqui",
      title: "Conectar Reclame Aqui",
      description: "Ligamos ao Reclame Aqui pra capturar reclamações.",
      target: "[data-onboarding='integration-reclame-aqui']",
      tooltip: "Conecte o Reclame Aqui aqui.",
      action: "highlight",
      completeEvent: "onboarding:reclameaqui-connected",
    },
    {
      id: "connect-meta",
      title: "Conectar Meta",
      description: "Facebook e Instagram pra monitorar comentários e DMs.",
      target: "[data-onboarding='integration-meta']",
      tooltip: "Conecte Facebook e Instagram aqui.",
      action: "highlight",
      completeEvent: "onboarding:meta-connected",
    },
    {
      id: "configure-responses",
      title: "Configurar respostas",
      description: "Ajuste o tom e as regras que a IA vai usar pra responder.",
      route: "/dashboard/agents",
      target: "[data-onboarding='agent-tone']",
      tooltip: "Aqui você ativa respostas automáticas.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "test",
      title: "Fazer um teste",
      description: "Mostro como sua IA responderia a uma avaliação real.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "activate-monitoring",
      title: "Ativar monitoramento",
      description: "Squad no ar. Vou te avisar quando algo precisar da sua atenção.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar",
    },
  ],
  testStep: {
    title: "Como sua IA responderia",
    sampleTitle: "★★★★★ Excelente atendimento",
    sampleBody:
      "Fui muito bem atendido, resolveram meu problema em minutos. Recomendo demais!",
    generatedResponse:
      "Muito obrigado pelo carinho! 💛 Fico feliz demais em saber que a experiência foi boa. Estamos sempre por aqui — conte com a gente!",
  },
  success: {
    title: "Sua Squad de Reputação está ativa",
    summary: [
      "Google conectado",
      "Reclame Aqui conectado",
      "Meta conectado",
      "Tom configurado",
      "Monitoramento ativo",
    ],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
