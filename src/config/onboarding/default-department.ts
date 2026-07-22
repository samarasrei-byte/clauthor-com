import type { OnboardingFlow } from "@/components/onboarding-premium/types";

export const defaultDepartmentFlow: OnboardingFlow = {
  id: "default-department",
  subjectType: "department",
  welcome: {
    title: "Vamos ativar seu Departamento",
    message:
      "Sou o Thor. Em cerca de 10 minutos, seu departamento estará operando com aprovações inteligentes. Vou te guiar passo a passo.",
    estimatedMinutes: 10,
  },
  missions: [
    {
      id: "context",
      title: "Contexto da empresa",
      description: "Confirme os dados da sua empresa que a IA vai usar.",
      action: "confirm",
    },
    {
      id: "integrations",
      title: "Conectar ferramentas",
      description: "Ligamos CRM, e-mail, WhatsApp e o que mais o depto precisar.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integrations-list']",
      tooltip: "Conecte aqui as ferramentas do departamento.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "approvals",
      title: "Regras de aprovação",
      description: "Você decide o que a IA pode fazer sozinha e o que precisa passar por você.",
      route: "/dashboard/approvals",
      target: "[data-onboarding='approvals-settings']",
      tooltip: "Aqui você define o nível de autonomia da IA.",
      action: "highlight",
      autoNavigate: true,
    },
    {
      id: "test",
      title: "Ver a IA em ação",
      description: "Rodamos um cenário real pra você validar a resposta.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "go-live",
      title: "Colocar em produção",
      description: "Departamento ativo. A partir daqui você comanda, a IA executa.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar departamento",
    },
  ],
  testStep: {
    title: "Teste do departamento",
    sampleTitle: "Cenário real",
    sampleBody:
      "Um lead qualificado acabou de entrar pelo site. Como o departamento reage?",
    generatedResponse:
      "Lead recebido. Registrei no CRM, enviei um e-mail de boas-vindas personalizado com base no que ele pesquisou, e agendei um follow-up pra amanhã 10h. Aguardando sua aprovação pra disparar.",
  },
  success: {
    title: "Departamento ativo",
    summary: [
      "Contexto salvo",
      "Ferramentas conectadas",
      "Aprovações configuradas",
      "Teste validado",
    ],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
