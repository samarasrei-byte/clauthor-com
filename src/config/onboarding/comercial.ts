import type { OnboardingFlow } from "@/components/onboarding-premium/types";

/**
 * Fluxo especializado · Departamento Comercial.
 * Casa quando subjectRef contém "comercial" ou "vendas".
 */
export const comercialFlow: OnboardingFlow = {
  id: "comercial",
  subjectType: "department",
  matchRef: /comercial|vendas|sales/i,
  welcome: {
    title: "Vamos ativar seu Comercial",
    message:
      "Sou o Thor. Em ~10 minutos seu Comercial está prospectando, qualificando e agendando reuniões — com sua aprovação em cada passo crítico.",
    estimatedMinutes: 10,
  },
  missions: [
    {
      id: "context",
      title: "ICP e proposta",
      description: "Confirmo quem é seu cliente ideal e a proposta de valor que a IA vai usar em cada abordagem.",
      action: "confirm",
    },
    {
      id: "connect-linkedin",
      title: "Conectar LinkedIn",
      description: "Base pra prospecção outbound automatizada.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integration-linkedin']",
      tooltip: "Conecte o LinkedIn aqui.",
      action: "highlight",
      autoNavigate: true,
      completeEvent: "onboarding:linkedin-connected",
    },
    {
      id: "connect-whatsapp",
      title: "Conectar WhatsApp",
      description: "Canal principal de conversão no Brasil.",
      target: "[data-onboarding='integration-whatsapp']",
      tooltip: "Conecte o WhatsApp Business aqui.",
      action: "highlight",
      completeEvent: "onboarding:whatsapp-connected",
    },
    {
      id: "connect-crm",
      title: "Conectar CRM",
      description: "HubSpot ou Pipedrive pra sincronizar leads e negócios.",
      target: "[data-onboarding='integration-hubspot']",
      tooltip: "Conecte seu CRM aqui.",
      action: "highlight",
      completeEvent: "onboarding:crm-connected",
    },
    {
      id: "test",
      title: "Ver a IA prospectar",
      description: "Rodamos uma abordagem real pra um lead do seu ICP.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "go-live",
      title: "Ativar Comercial",
      description: "Squad no ar. Você aprova cada envio até confiar 100%.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar",
    },
  ],
  testStep: {
    title: "Como sua IA prospectaria",
    sampleTitle: "Lead qualificado · Diretor Comercial · SaaS 50-200 fun.",
    sampleBody:
      "Ana Silva, CCO na Nexus Health. Baixou nosso whitepaper de outbound outbound-ready ontem.",
    generatedResponse:
      "Oi Ana, vi que você baixou o guia de outbound e reparei que a Nexus tá escalando o time comercial. A gente ajuda operações do tamanho da sua a fechar 3x mais em 90 dias sem contratar mais SDR. Tem 15 min quinta às 14h pra eu te mostrar como?",
  },
  success: {
    title: "Comercial ativo",
    summary: ["ICP salvo", "LinkedIn conectado", "WhatsApp conectado", "CRM conectado", "Teste aprovado"],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
