/**
 * Matriz de integrações por departamento.
 *
 * Categorias:
 * - oauth      🟢 1-clique (login social autorizando escopos)
 * - api_key    🟡 Cole a API key (2 min, manual)
 * - scraping   🔵 Automático via Firecrawl/scraper interno (sem input do cliente)
 * - roadmap    🔴 Em breve · mostra transparência de o que ainda falta
 *
 * IMPORTANTE: essa matriz é a fonte da verdade exibida ANTES da compra.
 * Não prometer 1-clique aqui se o OAuth não estiver realmente implementado.
 */
export type IntegrationStatus = "oauth" | "api_key" | "scraping" | "roadmap";

export interface IntegrationItem {
  /** Nome comercial (ex.: "Google Sheets"). */
  name: string;
  /** Status atual da integração. */
  status: IntegrationStatus;
  /** Uma frase curta explicando o que o agente faz com essa integração. */
  purpose: string;
}

export interface DepartmentIntegrations {
  /** id do departamento (bate com departmentPackages.ts). */
  departmentId: string;
  /** Lista ordenada · as mais críticas primeiro. */
  items: readonly IntegrationItem[];
}

export const STATUS_META: Record<
  IntegrationStatus,
  { label: string; dot: string; tone: string; description: string }
> = {
  oauth: {
    label: "1-clique",
    dot: "bg-emerald-400",
    tone: "text-emerald-300",
    description: "Login com sua conta autorizando os agentes · sem colar chave.",
  },
  api_key: {
    label: "Cole API key",
    dot: "bg-amber-400",
    tone: "text-amber-300",
    description: "Você cola uma chave da plataforma (2 min, tutorial dentro do app).",
  },
  scraping: {
    label: "Automático",
    dot: "bg-sky-400",
    tone: "text-sky-300",
    description: "Coleta pública sem login · o agente já vem sabendo ler.",
  },
  roadmap: {
    label: "Em breve",
    dot: "bg-white/30",
    tone: "text-white/50",
    description: "Ainda não disponível · no roadmap dos próximos 60 dias.",
  },
};

export const INTEGRATION_MATRIX: readonly DepartmentIntegrations[] = [
  {
    departmentId: "comercial",
    items: [
      { name: "Google Sheets", status: "oauth", purpose: "Ler ICP e escrever leads qualificados na sua planilha." },
      { name: "Gmail", status: "oauth", purpose: "Enviar cold emails e ler respostas dos prospects." },
      { name: "Google Calendar", status: "oauth", purpose: "Agendar reuniões automaticamente com quem responde." },
      { name: "LinkedIn (Hunter)", status: "scraping", purpose: "Prospecção via automação white-label · sem colar cookie." },
      { name: "WhatsApp Business", status: "api_key", purpose: "Follow-up por WhatsApp quando o lead responde." },
      { name: "HubSpot / Pipedrive", status: "roadmap", purpose: "Sync bidirecional com CRM externo." },
    ],
  },
  {
    departmentId: "atendimento",
    items: [
      { name: "WhatsApp Business", status: "api_key", purpose: "Responder tickets do cliente 24/7." },
      { name: "Gmail", status: "oauth", purpose: "Responder tickets vindos por e-mail." },
      { name: "Reclame Aqui", status: "scraping", purpose: "Monitorar reclamações e responder em até 1h." },
      { name: "Google Meu Negócio", status: "oauth", purpose: "Responder reviews e monitorar reputação." },
      { name: "Instagram DM", status: "roadmap", purpose: "Responder DMs de clientes." },
    ],
  },
  {
    departmentId: "marketing",
    items: [
      { name: "YouTube", status: "oauth", purpose: "Publicar vídeos e ler analytics do canal." },
      { name: "Instagram / Facebook", status: "oauth", purpose: "Publicar posts, reels e ler métricas." },
      { name: "TikTok", status: "oauth", purpose: "Publicar vídeos verticais." },
      { name: "Google Analytics", status: "oauth", purpose: "Ler tráfego e ajustar copy do site." },
      { name: "Meta Ads / Google Ads", status: "api_key", purpose: "Rodar campanhas com budget que você aprova." },
      { name: "Site do cliente", status: "scraping", purpose: "Extrair DNA de marca automaticamente." },
    ],
  },
  {
    departmentId: "juridico",
    items: [
      { name: "Google Drive", status: "oauth", purpose: "Ler contratos e salvar peças revisadas." },
      { name: "Gmail", status: "oauth", purpose: "Receber intimações e responder prazos." },
      { name: "JusBrasil", status: "scraping", purpose: "Monitorar processos e movimentações públicas." },
      { name: "PJe / Projudi (Tribunais)", status: "roadmap", purpose: "Peticionamento eletrônico automatizado." },
    ],
  },
  {
    departmentId: "financeiro",
    items: [
      { name: "Google Sheets", status: "oauth", purpose: "Consolidar DRE, fluxo de caixa e cobrança." },
      { name: "Gmail", status: "oauth", purpose: "Enviar cobranças e ler comprovantes." },
      { name: "PayPal", status: "oauth", purpose: "Ler pagamentos recebidos e conciliar." },
      { name: "Receita Federal (CNPJ)", status: "scraping", purpose: "Consultar situação cadastral de clientes/fornecedores." },
      { name: "Stripe / Mercado Pago", status: "roadmap", purpose: "Conciliar recebíveis multi-adquirente." },
    ],
  },
  {
    departmentId: "rh",
    items: [
      { name: "Gmail", status: "oauth", purpose: "Receber currículos e responder candidatos." },
      { name: "Google Calendar", status: "oauth", purpose: "Agendar entrevistas automaticamente." },
      { name: "LinkedIn (Hunter)", status: "scraping", purpose: "Sourcing de candidatos passivos." },
      { name: "Gupy / Kenoby", status: "roadmap", purpose: "Sync com ATS externo." },
    ],
  },
] as const;

export const getIntegrationsForDepartment = (
  departmentId: string,
): readonly IntegrationItem[] => {
  return INTEGRATION_MATRIX.find((d) => d.departmentId === departmentId)?.items ?? [];
};

export const summarizeIntegrations = (items: readonly IntegrationItem[]) => {
  const counts: Record<IntegrationStatus, number> = {
    oauth: 0,
    api_key: 0,
    scraping: 0,
    roadmap: 0,
  };
  for (const it of items) counts[it.status] += 1;
  return counts;
};
