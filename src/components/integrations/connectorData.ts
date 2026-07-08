import {
  Mail, MessageSquare, Globe, Facebook,
  FileSpreadsheet, BookOpen, Trello, BarChart3,
  TrendingUp, Code, Linkedin, Megaphone,
  Instagram, ShoppingCart, CreditCard, Database,
  Phone, Slack, FileSignature, type LucideIcon
} from "lucide-react";

export interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

export type ApiStatus = "live" | "beta" | "soon";

export interface ConnectorData {
  icon: LucideIcon;
  iconUrl?: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: string;
  status: "available" | "soon";
  /** Estado real do backend/API: live = handler pronto e testado; beta = parcial; soon = ainda não implementado. */
  apiStatus: ApiStatus;
  integrationKey: string;
  popularity?: number;
  developer?: string;
  developerUrl?: string;
  fields: CredentialField[];
  tools: string[];
}

export const connectors: ConnectorData[] = [
  {
    icon: Mail,
    name: "Gmail",
    shortDesc: "Rascunhe respostas, resuma threads e pesquise sua caixa de entrada.",
    longDesc: "Integre sua conta Gmail para que os agentes possam ler, responder e gerenciar e-mails automaticamente. Ideal para atendimento ao cliente, follow-ups e organização de comunicações.",
    category: "Comunicação",
    status: "available",
    apiStatus: "live",
    integrationKey: "sendgrid",
    popularity: 1,
    developer: "Clauthor",
    developerUrl: "https://clauthor.com",
    fields: [
      { key: "api_key", label: "API Key (SendGrid)", placeholder: "SG.xxxxxxx...", type: "password", required: true },
      { key: "from_email", label: "E-mail remetente", placeholder: "noreply@suaempresa.com", required: true },
    ],
    tools: ["send-email", "read-inbox", "search-emails", "draft-reply", "summarize-thread", "create-label", "archive"],
  },
  {
    icon: Phone,
    name: "WhatsApp Business",
    shortDesc: "Atenda clientes e envie notificações via WhatsApp.",
    longDesc: "Conecte sua conta WhatsApp Business para que os agentes possam enviar e receber mensagens, automatizar atendimento e enviar notificações em massa com aprovação.",
    category: "Comunicação",
    status: "available",
    apiStatus: "live",
    integrationKey: "whatsapp",
    popularity: 2,
    developer: "Meta",
    developerUrl: "https://developers.facebook.com",
    fields: [
      { key: "phone_id", label: "Phone Number ID", placeholder: "Ex: 1234567890", required: true },
      { key: "access_token", label: "Access Token", placeholder: "Token do Meta Business", type: "password", required: true },
      { key: "business_account_id", label: "Business Account ID", placeholder: "ID da conta business" },
    ],
    tools: ["send-message", "send-template", "read-messages", "send-media", "manage-contacts", "webhook-events"],
  },
  {
    icon: BookOpen,
    name: "Notion",
    shortDesc: "Conecte seu workspace Notion para buscar, atualizar e organizar.",
    longDesc: "O Notion MCP permite conectar ferramentas ao seu workspace Notion, permitindo criar, editar, buscar e organizar conteúdo diretamente. Obtenha assistência contextual e relevante enquanto mantém o conhecimento organizado no Notion.",
    category: "Produtividade",
    status: "available",
    apiStatus: "live",
    integrationKey: "notion",
    popularity: 3,
    developer: "Notion",
    developerUrl: "https://notion.so",
    fields: [
      { key: "api_key", label: "Integration Token", placeholder: "secret_xxxxxxx...", type: "password", required: true },
    ],
    tools: ["search", "fetch", "create-pages", "update-page", "move-pages", "duplicate-page", "create-database", "update-database", "create-comment", "get-comments", "get-users", "get-self", "get-user"],
  },
  {
    icon: Linkedin,
    name: "LinkedIn",
    shortDesc: "Automatize prospecção e networking no LinkedIn.",
    longDesc: "Conecte sua conta LinkedIn para automatizar prospecção, networking e publicação de conteúdo. Os agentes podem buscar leads, enviar conexões e gerenciar seu perfil profissional.",
    category: "Social",
    status: "available",
    apiStatus: "live",
    integrationKey: "linkedin",
    popularity: 4,
    developer: "LinkedIn",
    developerUrl: "https://linkedin.com",
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "Do painel do app", required: true },
      { key: "client_secret", label: "Client Secret", placeholder: "Gerado na aba Auth", type: "password" },
      { key: "access_token", label: "Access Token", placeholder: "Token de acesso", type: "password", required: true },
    ],
    tools: ["search-profiles", "send-connection", "post-content", "get-analytics", "search-companies", "send-message"],
  },
  {
    icon: Slack,
    name: "Slack",
    shortDesc: "Envie mensagens, crie canvases e busque dados do Slack.",
    longDesc: "Integre com seus workspaces Slack para enviar mensagens automatizadas, criar canvases, buscar conversas e reagir a eventos em tempo real.",
    category: "Comunicação",
    status: "available",
    apiStatus: "live",
    integrationKey: "slack",
    popularity: 5,
    developer: "Slack",
    developerUrl: "https://slack.com",
    fields: [
      { key: "webhook_url", label: "Webhook URL", placeholder: "https://hooks.slack.com/...", required: true },
      { key: "bot_token", label: "Bot Token", placeholder: "xoxb-...", type: "password" },
    ],
    tools: ["send-message", "create-canvas", "search-messages", "list-channels", "upload-file", "react-message"],
  },
  {
    icon: Megaphone,
    name: "Meta Ads",
    shortDesc: "Gerencie campanhas no Facebook e Instagram Ads.",
    longDesc: "Conecte sua conta Meta Ads para gerenciar campanhas publicitárias, criar anúncios, monitorar métricas de performance e otimizar seus gastos com publicidade.",
    category: "Ads",
    status: "available",
    apiStatus: "live",
    integrationKey: "meta_ads",
    popularity: 6,
    developer: "Meta",
    developerUrl: "https://developers.facebook.com",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Do Graph API Explorer", type: "password", required: true },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_XXXXXXXXX", required: true },
    ],
    tools: ["create-campaign", "get-insights", "manage-adsets", "create-ad", "get-audiences", "optimize-budget"],
  },
  {
    icon: BarChart3,
    name: "HubSpot",
    shortDesc: "Interaja com seus dados de CRM para insights personalizados.",
    longDesc: "Sincronize leads, deals e contatos com o HubSpot. Os agentes podem criar, atualizar e buscar registros, gerenciar pipeline de vendas e automatizar workflows de marketing.",
    category: "CRM",
    status: "available",
    apiStatus: "live",
    integrationKey: "hubspot",
    popularity: 7,
    developer: "HubSpot",
    developerUrl: "https://hubspot.com",
    fields: [
      { key: "api_key", label: "Private App Token", placeholder: "pat-xxx...", type: "password", required: true },
    ],
    tools: ["get-contacts", "create-contact", "update-deal", "search-records", "get-pipeline", "create-task", "get-analytics"],
  },
  {
    icon: FileSpreadsheet,
    name: "Google Sheets",
    shortDesc: "Leia e escreva dados em planilhas automaticamente.",
    longDesc: "Conecte suas planilhas do Google para automatizar a leitura e escrita de dados. Ideal para relatórios, dashboards e sincronização de dados entre sistemas.",
    category: "Produtividade",
    status: "available",
    apiStatus: "live",
    integrationKey: "google_sheets",
    popularity: 8,
    developer: "Google",
    developerUrl: "https://developers.google.com",
    fields: [
      { key: "api_key", label: "API Key / Service Account", placeholder: "Chave de serviço JSON ou API Key", type: "password", required: true },
    ],
    tools: ["read-sheet", "write-cells", "create-sheet", "format-range", "get-charts", "append-rows"],
  },
  {
    icon: Instagram,
    name: "Instagram",
    shortDesc: "Responda DMs e comentários automaticamente.",
    longDesc: "Integre com o Instagram para gerenciar DMs, comentários e publicações automaticamente. Ideal para engajamento e atendimento ao cliente em redes sociais.",
    category: "Social",
    status: "available",
    apiStatus: "live",
    integrationKey: "instagram",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Mesmo do Meta Business", type: "password", required: true },
      { key: "instagram_account_id", label: "Instagram Account ID", placeholder: "ID da conta IG" },
    ],
    tools: ["reply-dm", "reply-comment", "get-mentions", "post-media", "get-insights"],
  },
  {
    icon: TrendingUp,
    name: "Pipedrive",
    shortDesc: "Gerencie pipeline de vendas automaticamente.",
    longDesc: "Conecte o Pipedrive para automatizar a gestão do pipeline de vendas, criar e atualizar deals, gerenciar contatos e acompanhar métricas de conversão.",
    category: "CRM",
    status: "available",
    apiStatus: "live",
    integrationKey: "pipedrive",
    fields: [
      { key: "api_key", label: "API Token", placeholder: "Token do Pipedrive", type: "password", required: true },
    ],
    tools: ["get-deals", "create-deal", "update-deal", "get-contacts", "create-activity", "get-pipeline"],
  },
  {
    icon: Trello,
    name: "Trello",
    shortDesc: "Crie cards e gerencie boards automaticamente.",
    longDesc: "Integre com o Trello para criar e gerenciar cards, boards e listas. Automatize fluxos de trabalho e mantenha a equipe sincronizada.",
    category: "Produtividade",
    status: "available",
    apiStatus: "live",
    integrationKey: "trello",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Chave da API", type: "password", required: true },
      { key: "token", label: "Token", placeholder: "Token de autorização", type: "password", required: true },
    ],
    tools: ["create-card", "move-card", "list-boards", "add-comment", "create-checklist", "archive-card"],
  },
  {
    icon: FileSignature,
    name: "Cobanky",
    shortDesc: "Crie propostas e contratos com assinatura digital.",
    longDesc: "Integre com a Cobanky para criar propostas comerciais, gerar contratos com signatários e disparar assinaturas automaticamente via API v1.",
    category: "Pagamentos",
    status: "available",
    apiStatus: "live",
    integrationKey: "cobanky",
    developer: "Cobanky",
    developerUrl: "https://cobanky.com.br/api-docs",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "ck_live_...", type: "password", required: true },
    ],
    tools: ["health", "create-proposal", "get-proposal", "create-contract", "get-contract", "send-contract"],
  },
  {
    icon: FileSignature,
    name: "ClickSign",
    shortDesc: "Envie documentos e colete assinaturas eletrônicas.",
    longDesc: "Integre com a ClickSign para criar documentos, adicionar signatários e disparar notificações de assinatura por e-mail, WhatsApp ou SMS.",
    category: "Assinatura",
    status: "available",
    apiStatus: "live",
    integrationKey: "clicksign",
    developer: "ClickSign",
    developerUrl: "https://developers.clicksign.com",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "Token de acesso da API", type: "password", required: true },
      { key: "base_url", label: "Base URL", placeholder: "https://app.clicksign.com/api/v1 (ou sandbox)" },
    ],
    tools: ["create-document", "get-document", "add-signer", "add-signer-to-document", "send-notifications", "cancel-document"],
  },
  {
    icon: FileSignature,
    name: "DocuSign",
    shortDesc: "Crie envelopes e gerencie assinaturas globalmente.",
    longDesc: "Integre com a DocuSign eSignature API para criar envelopes, enviar para signatários, acompanhar status e cancelar quando necessário.",
    category: "Assinatura",
    status: "available",
    apiStatus: "live",
    integrationKey: "docusign",
    developer: "DocuSign",
    developerUrl: "https://developers.docusign.com/docs/esign-rest-api/",
    fields: [
      { key: "access_token", label: "Access Token (OAuth)", placeholder: "Token OAuth 2.0", type: "password", required: true },
      { key: "account_id", label: "Account ID", placeholder: "API Account ID (do userinfo)", required: true },
      { key: "base_uri", label: "Base URI", placeholder: "https://demo.docusign.net/restapi ou https://na3.docusign.net/restapi" },
    ],
    tools: ["create-envelope", "send-envelope", "get-envelope", "list-recipients", "void-envelope"],
  },
  {
    icon: Facebook,
    name: "Facebook",
    shortDesc: "Gerencie mensagens e posts no Facebook.",
    longDesc: "Integre com o Facebook para gerenciar páginas, responder mensagens e publicar conteúdo automaticamente.",
    category: "Social",
    status: "soon",
    apiStatus: "soon",
    integrationKey: "facebook",
    fields: [],
    tools: ["post-content", "reply-message", "get-insights", "manage-page"],
  },
  {
    icon: ShoppingCart,
    name: "Shopify",
    shortDesc: "Integre catálogo, pedidos e atendimento.",
    longDesc: "Conecte sua loja Shopify para gerenciar produtos, processar pedidos e automatizar o atendimento ao cliente.",
    category: "E-commerce",
    status: "soon",
    apiStatus: "soon",
    integrationKey: "shopify",
    fields: [],
    tools: ["get-products", "manage-orders", "update-inventory", "get-customers"],
  },
  {
    icon: CreditCard,
    name: "Stripe",
    shortDesc: "Gerencie pagamentos e assinaturas.",
    longDesc: "Conecte o Stripe para processar pagamentos, gerenciar assinaturas e acompanhar métricas financeiras.",
    category: "Pagamentos",
    status: "soon",
    apiStatus: "soon",
    integrationKey: "stripe",
    fields: [],
    tools: ["create-payment", "manage-subscriptions", "get-invoices", "refund"],
  },
  {
    icon: Database,
    name: "Zapier",
    shortDesc: "Conecte com +5000 apps via automações.",
    longDesc: "Use webhooks do Zapier para conectar seus agentes com mais de 5000 aplicativos e automatizar fluxos complexos.",
    category: "Automação",
    status: "soon",
    apiStatus: "soon",
    integrationKey: "zapier",
    fields: [],
    tools: ["trigger-zap", "webhook-send", "get-history"],
  },
  {
    icon: Code,
    name: "APIs Customizadas",
    shortDesc: "Conecte qualquer API REST ou GraphQL.",
    longDesc: "Integre com qualquer API externa usando credenciais personalizadas. Ideal para sistemas proprietários ou APIs de nicho.",
    category: "Desenvolvimento",
    status: "available",
    apiStatus: "live",
    integrationKey: "custom_api",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Chave da API", type: "password", required: true },
      { key: "base_url", label: "Base URL", placeholder: "https://api.exemplo.com" },
    ],
    tools: ["http-get", "http-post", "http-put", "http-delete", "webhook-receive"],
  },
];

export const categories = ["Todas", "Comunicação", "Social", "Ads", "CRM", "Produtividade", "E-commerce", "Pagamentos", "Assinatura", "Automação", "Desenvolvimento"];
