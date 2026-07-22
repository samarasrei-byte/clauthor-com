import type { OnboardingFlow } from "@/components/onboarding-premium/types";

/**
 * Fluxo especializado · Departamento de RH / People.
 * Casa quando subjectRef contém "rh", "people", "recursos-humanos" ou "hr".
 */
export const rhFlow: OnboardingFlow = {
  id: "rh",
  subjectType: "department",
  matchRef: /^(rh|hr)$|people|recursos-?humanos/i,
  welcome: {
    title: "Vamos ativar seu RH",
    message:
      "Sou o Thor. Em ~8 minutos seu RH está triando currículos, agendando entrevistas e onboardando novos contratados — sempre com sua palavra final em decisões de contratação.",
    estimatedMinutes: 8,
  },
  missions: [
    {
      id: "context",
      title: "Cultura e perfil ideal",
      description: "Descrevemos sua cultura e o perfil que a IA deve procurar em cada vaga.",
      action: "confirm",
    },
    {
      id: "connect-linkedin",
      title: "Conectar LinkedIn",
      description: "Fonte principal pra sourcing ativo de candidatos.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integration-linkedin']",
      tooltip: "Conecte o LinkedIn aqui.",
      action: "highlight",
      autoNavigate: true,
      completeEvent: "onboarding:linkedin-connected",
    },
    {
      id: "connect-email",
      title: "Conectar e-mail",
      description: "SendGrid pra convites de entrevista e comunicações oficiais.",
      target: "[data-onboarding='integration-sendgrid']",
      tooltip: "Conecte o e-mail aqui.",
      action: "highlight",
      completeEvent: "onboarding:email-connected",
    },
    {
      id: "connect-notion",
      title: "Conectar Notion",
      description: "Playbook de onboarding e trilhas de capacitação centralizados.",
      target: "[data-onboarding='integration-notion']",
      tooltip: "Conecte o Notion aqui.",
      action: "highlight",
      completeEvent: "onboarding:notion-connected",
    },
    {
      id: "test",
      title: "Ver a IA triar",
      description: "Rodamos uma triagem de currículo real vs. seu perfil ideal.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "go-live",
      title: "Ativar RH",
      description: "Departamento no ar. Decisões de contratação sempre passam por você.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar",
    },
  ],
  testStep: {
    title: "Como sua IA triaria",
    sampleTitle: "Candidato · Pedro Almeida · Full-stack pleno",
    sampleBody:
      "5 anos React/Node, passagem por 3 startups, remoto-first. Portfólio sólido no GitHub. Pretensão: R$ 12k.",
    generatedResponse:
      "Aderência 87% ao perfil ideal. Pontos fortes: stack casa 100%, cultura remota, histórico startup. Atenção: pretensão 15% acima da faixa. Recomendação: entrevista técnica com o CTO na próxima semana. Aguardando aprovação pra agendar.",
  },
  success: {
    title: "RH ativo",
    summary: ["Perfil ideal salvo", "LinkedIn conectado", "E-mail conectado", "Notion conectado", "Teste aprovado"],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
