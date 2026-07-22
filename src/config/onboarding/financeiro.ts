import type { OnboardingFlow } from "@/components/onboarding-premium/types";

/**
 * Fluxo especializado · Departamento Financeiro.
 * Casa quando subjectRef contém "financeiro" ou "finance".
 */
export const financeiroFlow: OnboardingFlow = {
  id: "financeiro",
  subjectType: "department",
  matchRef: /financeiro|finance|financas/i,
  welcome: {
    title: "Vamos ativar seu Financeiro",
    message:
      "Sou o Thor. Em ~8 minutos seu Financeiro está conciliando, cobrando e emitindo NF — com aprovação obrigatória em qualquer movimento acima do limite que você definir.",
    estimatedMinutes: 8,
  },
  missions: [
    {
      id: "context",
      title: "Limites e alçadas",
      description: "Defina até quanto a IA pode agir sozinha e o que precisa da sua assinatura.",
      action: "confirm",
    },
    {
      id: "connect-banking",
      title: "Conectar conta bancária",
      description: "Cobanky pra ler extratos e conciliar entradas automaticamente.",
      route: "/dashboard/integrations",
      target: "[data-onboarding='integration-cobanky']",
      tooltip: "Conecte seu banco aqui.",
      action: "highlight",
      autoNavigate: true,
      completeEvent: "onboarding:banking-connected",
    },
    {
      id: "connect-signature",
      title: "Conectar assinatura digital",
      description: "ClickSign ou DocuSign pra formalizar contratos e boletos.",
      target: "[data-onboarding='integration-clicksign']",
      tooltip: "Conecte a assinatura aqui.",
      action: "highlight",
      completeEvent: "onboarding:signature-connected",
    },
    {
      id: "connect-sheets",
      title: "Conectar planilhas",
      description: "Google Sheets pra sincronizar com seu fluxo de caixa atual.",
      target: "[data-onboarding='integration-google_sheets']",
      tooltip: "Conecte suas planilhas aqui.",
      action: "highlight",
      completeEvent: "onboarding:sheets-connected",
    },
    {
      id: "test",
      title: "Ver a IA cobrar",
      description: "Rodamos uma régua de cobrança pra um cliente inadimplente fictício.",
      action: "test",
      ctaLabel: "Rodar teste",
    },
    {
      id: "go-live",
      title: "Ativar Financeiro",
      description: "Departamento no ar. Toda movimentação acima do limite passa por você.",
      route: "/dashboard",
      action: "confirm",
      autoNavigate: true,
      ctaLabel: "Ativar",
    },
  ],
  testStep: {
    title: "Como sua IA cobraria",
    sampleTitle: "Fatura vencida há 5 dias · R$ 2.480,00",
    sampleBody:
      "Cliente Maria Souza, boleto vencido em 17/07. Histórico: paga sempre em até 10 dias de atraso, sem problema.",
    generatedResponse:
      "Oi Maria, tudo bem? Passando aqui só pra lembrar que sua fatura de R$ 2.480 venceu semana passada. Já te envio o boleto atualizado com juros pró-rata — se preferir Pix, também dá. Qualquer coisa me chama.",
  },
  success: {
    title: "Financeiro ativo",
    summary: ["Limites definidos", "Banco conectado", "Assinatura conectada", "Planilhas conectadas", "Teste aprovado"],
    ctaLabel: "Ir para o Dashboard",
    ctaRoute: "/dashboard",
  },
};
