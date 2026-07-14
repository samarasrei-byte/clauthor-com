/**
 * Catálogo canônico de Squads verticais (produto de entrada Clauthor).
 * Fonte única consumida por:
 *  - /squads (listagem)
 *  - /squads/:slug (página dedicada)
 *
 * Regra editorial:
 *  - Cada squad resolve UMA dor de negócio ponta-a-ponta.
 *  - Preço = tier Growth (deixamos espaço p/ Starter e Pro na página dedicada).
 *  - Nomenclatura em pt-BR; SEO cuida da versão internacional.
 */
import {
  Shield, MessageSquare, Target, Wallet, PenSquare,
  Handshake, Megaphone, ShoppingBag, UserCheck, HeartHandshake, Scale,
  type LucideIcon,
} from "lucide-react";

export type SquadPricingTier = {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
};

export type SquadAgent = {
  name: string;
  role: string;
};

export type SquadFaq = { q: string; a: string };

export type Squad = {
  slug: string;
  icon: LucideIcon;
  name: string;
  category: string;
  tagline: string;
  hero: {
    kicker: string;
    headline: string;
    highlight: string;
    subhead: string;
    bullets: string[];
  };
  price: number;
  agents: number;
  features: string[];
  problems: string[];          // dores concretas que o squad resolve
  deliverables: string[];      // o que a empresa recebe/vê
  channels: string[];          // canais/integrações do squad
  team: SquadAgent[];          // composição do squad
  tiers: SquadPricingTier[];   // Starter / Growth / Pro
  faq: SquadFaq[];
  seoTitle: string;
  seoDescription: string;
  /** Se preenchido, sobrescreve /squads/:slug (ex.: Reputação IA já tem página própria). */
  overrideHref?: string;
  featured?: boolean;
  demand?: "TOP" | "ALTA" | "NOVA"; // sinalização de mercado
};

export const SQUADS: Squad[] = [
  {
    slug: "reputacao-ia",
    icon: Shield,
    name: "Reputação IA",
    category: "Marca & Confiança",
    tagline: "Proteja sua marca 24h por dia. IA monitora e responde avaliações no Google, Reclame Aqui, Instagram, Facebook e LinkedIn.",
    hero: {
      kicker: "Squad · Reputação IA",
      headline: "Sua reputação online",
      highlight: "defendida 24 horas por dia",
      subhead: "Um time de IA que monitora Google, Reclame Aqui e redes sociais, responde avaliações no seu tom e alerta você antes que uma crise vire manchete.",
      bullets: ["Resposta em < 3min", "Detecção de crise em tempo real", "Aprovação humana opcional"],
    },
    price: 697,
    agents: 7,
    features: [
      "Google Meu Negócio + Reclame Aqui",
      "Instagram, Facebook e LinkedIn",
      "Detecção de crises em tempo real",
      "Análise de sentimento + BI",
      "Painel unificado de menções",
    ],
    problems: [
      "Avaliações negativas sem resposta há dias",
      "Reclame Aqui derrubando conversão",
      "Comentários hostis em picos de campanha",
      "Nenhuma visibilidade do que dizem da marca",
    ],
    deliverables: [
      "Painel único com todas as menções",
      "Respostas prontas para aprovar (ou automáticas)",
      "Alerta de crise no WhatsApp do gestor",
      "Relatório semanal de sentimento",
    ],
    channels: ["Google Meu Negócio", "Reclame Aqui", "Instagram", "Facebook", "LinkedIn", "TrustPilot"],
    team: [
      { name: "Monitor", role: "Varredura contínua de menções" },
      { name: "Analista de Sentimento", role: "Classifica gravidade e intenção" },
      { name: "Redator", role: "Gera resposta no tom da marca" },
      { name: "Curador", role: "Aprova ou escala para humano" },
      { name: "Publisher", role: "Publica nos canais de origem" },
      { name: "Analista de Crise", role: "Aciona playbook em picos" },
      { name: "BI", role: "Consolida NPS reputacional" },
    ],
    tiers: [
      { name: "Starter", price: 597, tagline: "Até 400 menções/mês", features: ["1 canal (Google ou Reclame Aqui)", "Respostas em 1 idioma", "Suporte por e-mail"] },
      { name: "Growth", price: 697, tagline: "Até 1.500 menções/mês", features: ["Todos os canais principais", "Aprovação humana opcional", "Alertas WhatsApp", "Relatório semanal"], highlighted: true },
      { name: "Pro", price: 1497, tagline: "Volume ilimitado + multi-marca", features: ["Multi-loja / multi-marca", "Integração CRM", "Playbook de crise dedicado", "CSM dedicado"] },
    ],
    faq: [
      { q: "A IA responde sozinha ou preciso aprovar?", a: "Você escolhe. No Starter tudo passa por aprovação. No Growth e Pro dá pra automatizar por categoria (ex.: elogios respondem sozinhos, crítica grave escala pra você)." },
      { q: "Vocês assumem o Reclame Aqui?", a: "Sim. Configuramos o acesso e o squad responde no prazo, negocia solução e trabalha o índice de resposta pra manter selo verde." },
      { q: "E se a IA errar o tom da marca?", a: "Cada squad passa por 5 dias de calibração com exemplos reais seus antes de entrar em produção." },
    ],
    seoTitle: "Reputação IA — Squad que gerencia Google, Reclame Aqui e redes sociais 24h | Clauthor",
    seoDescription: "Contrate um squad de IA que monitora e responde avaliações no Google, Reclame Aqui, Instagram e Facebook — no tom da sua marca, 24h por dia. A partir de R$ 597/mês.",
    overrideHref: "/reputacao-ia",
    featured: true,
    demand: "TOP",
  },
  {
    slug: "atendimento-24h",
    icon: MessageSquare,
    name: "Atendimento IA 24h",
    category: "Suporte & CX",
    tagline: "Time de IA que responde clientes no WhatsApp, Instagram DM e chat do site — sem escala humana, sem cliente esperando.",
    hero: {
      kicker: "Squad · Atendimento 24h",
      headline: "Nunca mais deixe um cliente",
      highlight: "esperando no WhatsApp",
      subhead: "Um squad de IA que atende no WhatsApp, Instagram e chat do site em segundos, resolve o que dá pra resolver e escala pra você só o que precisa de humano.",
      bullets: ["Resposta em < 30s", "Multi-canal unificado", "Escala p/ humano quando precisa"],
    },
    price: 797,
    agents: 5,
    features: [
      "WhatsApp Business + Instagram DM",
      "Chat do site + e-mail",
      "Roteirização por intenção",
      "Escalação para humano quando preciso",
      "Histórico unificado por cliente",
    ],
    problems: [
      "Cliente perguntando às 22h e ninguém responde",
      "Time de atendimento com fila de 4 horas",
      "Perdas de venda no WhatsApp por demora",
      "Zero histórico entre canais (cliente repete tudo)",
    ],
    deliverables: [
      "Inbox único WhatsApp + Instagram + site",
      "Base de conhecimento treinada com seus produtos/FAQ",
      "Métricas: tempo de resposta, resolução, CSAT",
      "Handoff transparente pro humano quando necessário",
    ],
    channels: ["WhatsApp Business", "Instagram DM", "Facebook Messenger", "Chat do site", "E-mail"],
    team: [
      { name: "Triagem", role: "Classifica intenção e prioridade" },
      { name: "Atendente 1ª linha", role: "Resolve FAQ e pedidos comuns" },
      { name: "Especialista Produto", role: "Consulta base técnica" },
      { name: "Vendedor Inbound", role: "Fecha venda quando é comercial" },
      { name: "Supervisor", role: "Escala pra humano com contexto" },
    ],
    tiers: [
      { name: "Starter", price: 697, tagline: "Até 3.000 conversas/mês", features: ["WhatsApp OU site", "Horário comercial", "1 idioma"] },
      { name: "Growth", price: 797, tagline: "Até 10.000 conversas/mês", features: ["WhatsApp + Instagram + site", "24h/7", "Handoff humano", "CSAT tracking"], highlighted: true },
      { name: "Pro", price: 1697, tagline: "Volume ilimitado + multi-idioma", features: ["Todos os canais", "Multi-idioma", "Integração CRM/ERP", "SLA dedicado"] },
    ],
    faq: [
      { q: "Substitui meu SAC humano?", a: "Substitui a 1ª linha (70–85% dos tickets). O que precisa de humano chega pro seu time com contexto completo — atendente respondendo mais rápido, com menos gente." },
      { q: "Funciona no WhatsApp oficial?", a: "Sim, via WhatsApp Business API oficial. Zero risco de banimento." },
      { q: "Aprende com nossa base?", a: "Sim. Nos primeiros 5 dias treinamos com sua FAQ, catálogo e conversas antigas. Depois disso ele evolui sozinho a cada semana." },
    ],
    seoTitle: "Atendimento IA 24h — Squad de WhatsApp, Instagram e chat automatizado | Clauthor",
    seoDescription: "Squad de IA que atende no WhatsApp, Instagram DM e chat do site em segundos. Resolve 80% dos tickets, escala pro humano só quando precisa. A partir de R$ 697/mês.",
    demand: "TOP",
  },
  {
    slug: "sdr-hunter",
    icon: Target,
    name: "SDR IA (Hunter)",
    category: "Vendas B2B · Topo",
    tagline: "Prospecção outbound automatizada no LinkedIn e e-mail. ICP, cadência, follow-up e reunião marcada — sem SDR humano.",
    hero: {
      kicker: "Squad · SDR IA (Hunter)",
      headline: "Reuniões qualificadas na agenda,",
      highlight: "sem contratar um SDR",
      subhead: "Um squad que prospecta seu ICP no LinkedIn e por e-mail, personaliza cada abordagem, faz follow-up de 5 toques e entrega reunião marcada direto no seu Google Calendar.",
      bullets: ["500+ prospects/mês por conta", "Copy personalizada por lead", "Reunião no seu Calendar"],
    },
    price: 997,
    agents: 6,
    features: [
      "Prospecção LinkedIn (multi-conta)",
      "E-mail cadência 5 toques",
      "Enriquecimento de lead (Hunter/Apollo)",
      "Qualificação automática",
      "Agendamento direto no Calendar",
    ],
    problems: [
      "Pipeline seco toda semana",
      "SDR humano caro (R$ 4-8k) e alta rotatividade",
      "Copy genérica gerando 0,5% de resposta",
      "Sem previsibilidade de leads qualificados",
    ],
    deliverables: [
      "ICP validado + lista contínua de contas",
      "Cadências ativas LinkedIn + e-mail",
      "Leads qualificados no seu CRM",
      "Reunião marcada direto no Calendar",
    ],
    channels: ["LinkedIn (multi-conta)", "E-mail (SPF/DKIM configurado)", "HubSpot / RD / Pipedrive", "Google Calendar", "Slack"],
    team: [
      { name: "ICP Builder", role: "Descobre e valida perfil ideal" },
      { name: "List Miner", role: "Enriquece e limpa leads" },
      { name: "Copywriter", role: "Personaliza cada mensagem" },
      { name: "Cadence Runner", role: "Executa toques LinkedIn + e-mail" },
      { name: "Qualificador BANT", role: "Filtra respostas por intenção" },
      { name: "Scheduler", role: "Marca reunião no Calendar" },
    ],
    tiers: [
      { name: "Starter", price: 797, tagline: "1 conta LinkedIn · 300 leads/mês", features: ["Só LinkedIn", "1 cadência", "Report mensal"] },
      { name: "Growth", price: 997, tagline: "3 contas · 800 leads/mês", features: ["LinkedIn + e-mail", "Cadência de 5 toques", "Integração CRM", "Reunião no Calendar"], highlighted: true },
      { name: "Pro", price: 2497, tagline: "10+ contas · volume alto", features: ["Multi-vertical", "A/B testing contínuo", "CSM dedicado", "Playbook customizado"] },
    ],
    faq: [
      { q: "Vocês usam minha conta do LinkedIn?", a: "Sim, com automação segura (limites diários humanos, IP dedicado). Zero risco de banimento em 12 meses de operação." },
      { q: "Que tipo de resultado eu posso esperar?", a: "Média dos clientes: 8-25 reuniões qualificadas/mês por conta ativa. Depende do ICP e ticket." },
      { q: "E se meu ICP estiver errado?", a: "O squad testa 3 hipóteses de ICP nas primeiras 4 semanas e ajusta baseado em taxa de resposta real." },
    ],
    seoTitle: "SDR IA — Squad de prospecção outbound no LinkedIn e e-mail | Clauthor",
    seoDescription: "Squad de IA que prospecta seu ICP no LinkedIn e e-mail, personaliza cada abordagem e entrega reunião marcada no Calendar. Sem contratar SDR. A partir de R$ 797/mês.",
    demand: "TOP",
  },
  {
    slug: "vendas-closer",
    icon: Handshake,
    name: "Vendas IA (Closer)",
    category: "Vendas B2C/B2B · Fundo",
    tagline: "Squad que assume o funil de fechamento: qualifica lead quente, envia proposta, negocia por WhatsApp e fecha venda.",
    hero: {
      kicker: "Squad · Vendas IA",
      headline: "Feche mais vendas",
      highlight: "sem depender do vendedor humano",
      subhead: "Da qualificação BANT ao envio de proposta, negociação por WhatsApp e assinatura de contrato — o squad de vendas conduz o lead até o pagamento.",
      bullets: ["Follow-up automático 24/7", "Proposta gerada em segundos", "Recuperação de lead frio"],
    },
    price: 1197,
    agents: 6,
    features: [
      "Qualificação BANT automática",
      "Geração de proposta personalizada",
      "Negociação por WhatsApp",
      "Recuperação de leads frios",
      "Integração com contrato/assinatura digital",
    ],
    problems: [
      "Vendedor esquece follow-up e lead esfria",
      "Proposta demora 2 dias pra sair",
      "Sem playbook consistente de negociação",
      "Time comercial só trabalha em horário comercial",
    ],
    deliverables: [
      "Funil comercial automatizado do MQL ao ganho",
      "Templates de proposta dinâmicos",
      "Métricas: taxa de conversão por etapa, ciclo médio",
      "Recuperação semanal de leads parados",
    ],
    channels: ["WhatsApp", "E-mail", "HubSpot / RD / Pipedrive", "ClickSign / D4Sign", "Stripe / Pagar.me"],
    team: [
      { name: "Qualificador BANT", role: "Confirma orçamento, autoridade, necessidade, prazo" },
      { name: "Proposta Bot", role: "Monta proposta personalizada em 30s" },
      { name: "Negociador", role: "Conduz objeções e desconto autorizado" },
      { name: "Fechador", role: "Envia contrato e link de pagamento" },
      { name: "Recuperador", role: "Retoma leads frios com nova abordagem" },
      { name: "Analista Comercial", role: "Report semanal de funil e forecast" },
    ],
    tiers: [
      { name: "Starter", price: 597, tagline: "Até 100 leads/mês", features: ["1 canal", "Proposta padrão", "Report básico"] },
      { name: "Growth", price: 1197, tagline: "Até 500 leads/mês", features: ["WhatsApp + e-mail", "Proposta customizada", "Recuperação de frios", "Integração CRM"], highlighted: true },
      { name: "Pro", price: 2497, tagline: "Volume ilimitado + multi-time", features: ["Multi-produto / multi-time", "Assinatura digital", "Forecast automatizado", "CSM dedicado"] },
    ],
    faq: [
      { q: "Substitui meu vendedor?", a: "Substitui o transacional (proposta, follow-up, fechamento simples). Vendedor humano fica focado em conta grande e negociação complexa." },
      { q: "Ele dá desconto sozinho?", a: "Só dentro da faixa que você autorizar. Acima disso escala pra você em segundos com contexto." },
      { q: "Funciona pro meu ticket alto?", a: "Sim, com adaptação. Ticket alto usa o squad como pré-fechamento e handoff pra humano na reunião final." },
    ],
    seoTitle: "Vendas IA — Squad closer que fecha vendas no WhatsApp | Clauthor",
    seoDescription: "Squad de IA que qualifica, envia proposta, negocia por WhatsApp e fecha venda. Automatiza follow-up e recupera lead frio. A partir de R$ 597/mês.",
    demand: "TOP",
  },
  {
    slug: "trafego-pago",
    icon: Megaphone,
    name: "Tráfego Pago IA",
    category: "Marketing · Aquisição",
    tagline: "Substitui o gestor de tráfego: cria criativos, sobe campanha em Meta e Google, otimiza CPA e escala o que funciona.",
    hero: {
      kicker: "Squad · Tráfego Pago",
      headline: "Um gestor de tráfego sênior",
      highlight: "que trabalha 24 horas por dia",
      subhead: "Squad que gera criativos, sobe campanhas em Meta Ads e Google Ads, monitora CPA hora-a-hora, corta o que não performa e escala o que traz retorno.",
      bullets: ["Criativos gerados por IA", "Otimização a cada 60min", "Report diário no WhatsApp"],
    },
    price: 1497,
    agents: 6,
    features: [
      "Meta Ads (Facebook + Instagram)",
      "Google Ads (Search + Performance Max)",
      "Geração de criativos com IA",
      "Otimização de CPA em tempo real",
      "Dashboard consolidado + report diário",
    ],
    problems: [
      "Gestor de tráfego custa R$ 5-15k e vira gargalo",
      "Criativo demora 3-7 dias pra sair da agência",
      "Ninguém olhando a campanha no fim de semana",
      "CPA subindo silenciosamente e ninguém percebe",
    ],
    deliverables: [
      "Pilhas de criativos testadas semanalmente",
      "Campanhas ativas Meta + Google",
      "Alerta no WhatsApp quando CPA passa do limite",
      "Report diário com ROI consolidado",
    ],
    channels: ["Meta Ads Manager", "Google Ads", "TikTok Ads", "GA4 / GTM", "Shopify / Nuvemshop / VTEX"],
    team: [
      { name: "Estrategista", role: "Define hipótese e verba" },
      { name: "Criativo IA", role: "Gera imagens, copies e vídeos curtos" },
      { name: "Media Buyer Meta", role: "Sobe e otimiza campanhas Facebook/IG" },
      { name: "Media Buyer Google", role: "Sobe e otimiza Search + PMax" },
      { name: "Otimizador CPA", role: "Corta anúncio ruim, escala vencedor" },
      { name: "Analista", role: "Report diário + análise semanal" },
    ],
    tiers: [
      { name: "Starter", price: 697, tagline: "Verba até R$ 5k/mês", features: ["Meta OU Google", "5 criativos/semana", "Report semanal"] },
      { name: "Growth", price: 1497, tagline: "Verba até R$ 30k/mês", features: ["Meta + Google", "15 criativos/semana", "Otimização diária", "WhatsApp de alerta"], highlighted: true },
      { name: "Pro", price: 2997, tagline: "Verba R$ 100k+/mês", features: ["Meta + Google + TikTok", "Criativo ilimitado", "Otimização hora-a-hora", "CSM dedicado"] },
    ],
    faq: [
      { q: "Preciso pagar a verba de mídia à parte?", a: "Sim. A verba vai direto pro Meta e Google no seu cartão — nós só operamos. Nossa mensalidade é a operação e os criativos." },
      { q: "Ele substitui minha agência?", a: "Substitui a operação. Se você usa agência só pra estratégia + branding, dá pra combinar." },
      { q: "Como sei que está performando?", a: "Report diário no WhatsApp com ROAS, CPA e verba gasta + dashboard 24/7." },
    ],
    seoTitle: "Tráfego Pago IA — Squad que gerencia Meta Ads e Google Ads | Clauthor",
    seoDescription: "Squad de IA que substitui o gestor de tráfego: gera criativos, sobe campanhas Meta e Google, otimiza CPA e escala o que funciona. A partir de R$ 697/mês.",
    demand: "TOP",
  },
  {
    slug: "conteudo",
    icon: PenSquare,
    name: "Conteúdo IA",
    category: "Marketing · Orgânico",
    tagline: "Time completo de marketing de conteúdo: posts sociais, artigos de blog e SEO — no seu tom, na sua frequência.",
    hero: {
      kicker: "Squad · Conteúdo",
      headline: "Um time editorial completo",
      highlight: "publicando no seu ritmo",
      subhead: "Squad que produz posts para Instagram, LinkedIn, artigos de blog otimizados para SEO e roteiros de vídeo curto — semanalmente, no tom da sua marca.",
      bullets: ["Calendário editorial mensal", "Aprovação antes de publicar", "SEO-first em blog"],
    },
    price: 697,
    agents: 6,
    features: [
      "Instagram + LinkedIn + Facebook",
      "Blog SEO (2–4 posts/semana)",
      "Calendário editorial",
      "Roteiros de vídeo curto",
      "Aprovação antes de publicar",
    ],
    problems: [
      "Post no Instagram parou há 3 semanas",
      "Blog abandonado sem tráfego orgânico",
      "Sem consistência de tom entre canais",
      "Freelancer some ou entrega tarde",
    ],
    deliverables: [
      "Calendário editorial mensal aprovado",
      "8-16 posts sociais/mês",
      "2-4 artigos de blog/semana com SEO",
      "Métricas: alcance, engajamento, ranking",
    ],
    channels: ["Instagram", "LinkedIn", "Facebook", "TikTok (roteiro)", "WordPress / Webflow / Ghost"],
    team: [
      { name: "Estrategista de Conteúdo", role: "Define pauta mensal e clusters SEO" },
      { name: "Copywriter Social", role: "Escreve legendas e carrosséis" },
      { name: "Redator SEO", role: "Produz artigos otimizados 1500-2500 palavras" },
      { name: "Designer IA", role: "Gera imagens no visual da marca" },
      { name: "Roteirista Vídeo", role: "Cria scripts de Reels/Shorts" },
      { name: "Publisher", role: "Agenda e publica após aprovação" },
    ],
    tiers: [
      { name: "Starter", price: 697, tagline: "2 canais sociais", features: ["10 posts/mês", "Sem blog", "Aprovação por e-mail"] },
      { name: "Growth", price: 697, tagline: "Social + blog SEO", features: ["16 posts/mês", "2 artigos SEO/semana", "Calendário mensal", "Aprovação em painel"], highlighted: true },
      { name: "Pro", price: 1497, tagline: "Alto volume + multi-idioma", features: ["Volume ilimitado", "Multi-idioma", "Cluster SEO estratégico", "CSM dedicado"] },
    ],
    faq: [
      { q: "Vocês publicam ou só entregam?", a: "Você escolhe. No Growth publicamos após aprovação em painel. No Pro dá pra automatizar publicação por categoria." },
      { q: "Como funciona o tom da marca?", a: "5 dias de calibração inicial com 20-30 conteúdos seus como referência. Depois cada peça passa por revisor de tom." },
      { q: "SEO dá resultado em quanto tempo?", a: "Primeiros posicionamentos em 60-90 dias. Tráfego orgânico consistente a partir do 4º mês." },
    ],
    seoTitle: "Conteúdo IA — Squad de posts sociais, blog SEO e roteiros | Clauthor",
    seoDescription: "Squad de IA que produz posts para Instagram, LinkedIn, artigos de blog otimizados para SEO e roteiros de vídeo — no tom da sua marca. A partir de R$ 697/mês.",
    demand: "ALTA",
  },
  {
    slug: "ecommerce",
    icon: ShoppingBag,
    name: "E-commerce IA",
    category: "Varejo Digital",
    tagline: "Squad que cuida da loja: ficha de produto, recuperação de carrinho, atendimento pós-venda e reviews.",
    hero: {
      kicker: "Squad · E-commerce",
      headline: "Sua loja vendendo mais,",
      highlight: "sem você viver dentro dela",
      subhead: "Do cadastro de produto ao pós-venda: um squad que otimiza fichas com SEO, recupera carrinho abandonado, atende dúvidas de compra e responde reviews.",
      bullets: ["Ficha de produto otimizada", "Recuperação de carrinho automática", "Atendimento pré e pós-venda"],
    },
    price: 897,
    agents: 6,
    features: [
      "Ficha de produto SEO",
      "Recuperação de carrinho (WhatsApp + e-mail)",
      "Atendimento pré-venda (dúvidas do produto)",
      "Pós-venda + solicitação de review",
      "Integração Shopify / VTEX / Nuvemshop",
    ],
    problems: [
      "Loja com 500 produtos e descrição preguiçosa",
      "60% de carrinho abandonado sem recuperação",
      "Dúvida no produto virando venda perdida",
      "Zero review = zero prova social",
    ],
    deliverables: [
      "Ficha de produto reescrita com SEO",
      "Fluxo de recuperação de carrinho ativo",
      "Chat de dúvidas conectado ao catálogo",
      "Solicitação automática de review pós-entrega",
    ],
    channels: ["Shopify", "VTEX", "Nuvemshop", "WooCommerce", "WhatsApp", "Klaviyo / RD Station"],
    team: [
      { name: "Redator de Produto", role: "Reescreve ficha com SEO" },
      { name: "Merchandiser", role: "Sugere combos e cross-sell" },
      { name: "Recuperador Carrinho", role: "Aciona WhatsApp + e-mail" },
      { name: "Atendente Pré-venda", role: "Tira dúvida técnica de produto" },
      { name: "Pós-venda", role: "Acompanha entrega e resolve NF" },
      { name: "Review Hunter", role: "Solicita e organiza avaliações" },
    ],
    tiers: [
      { name: "Starter", price: 797, tagline: "Até 300 SKUs", features: ["Ficha de produto", "Recuperação por e-mail", "1 canal de atendimento"] },
      { name: "Growth", price: 897, tagline: "Até 2.000 SKUs", features: ["Todos os fluxos ativos", "WhatsApp + e-mail", "Integração plataforma", "Review pós-entrega"], highlighted: true },
      { name: "Pro", price: 1997, tagline: "Volume ilimitado + multi-loja", features: ["Multi-marca", "Multi-idioma", "Custom fluxos", "CSM dedicado"] },
    ],
    faq: [
      { q: "Funciona com minha plataforma?", a: "Integramos nativamente com Shopify, VTEX, Nuvemshop e WooCommerce. Outras plataformas via API/webhook." },
      { q: "Substitui minha agência de e-com?", a: "Substitui a operação diária (ficha, carrinho, atendimento). Agência fica pra estratégia e branding." },
      { q: "Quanto recupero de carrinho?", a: "Média de mercado: 8-15% do carrinho abandonado convertido. Nossos clientes tiram entre 12-22% com o squad ativo." },
    ],
    seoTitle: "E-commerce IA — Squad que cuida da loja: ficha, carrinho, atendimento | Clauthor",
    seoDescription: "Squad de IA para e-commerce: otimiza ficha de produto, recupera carrinho abandonado, atende pré e pós-venda. Integra Shopify, VTEX, Nuvemshop. A partir de R$ 797/mês.",
    demand: "ALTA",
  },
  {
    slug: "rh-recrutamento",
    icon: UserCheck,
    name: "RH IA (Recrutamento)",
    category: "Pessoas · Contratação",
    tagline: "Squad de recrutamento: publica vaga, tria currículo, entrevista por chat/vídeo e entrega shortlist pronto.",
    hero: {
      kicker: "Squad · RH & Recrutamento",
      headline: "Contrate 5× mais rápido,",
      highlight: "sem pagar recrutadora",
      subhead: "Um squad que redige a vaga, publica em LinkedIn/Vagas.com, tria currículos, faz entrevista inicial por chat/vídeo e te entrega os 5 melhores candidatos.",
      bullets: ["Triagem em minutos", "Entrevista por chat/vídeo", "Shortlist pronto pra você"],
    },
    price: 997,
    agents: 5,
    features: [
      "Descrição de vaga otimizada",
      "Publicação em LinkedIn + Vagas + Gupy",
      "Triagem de currículo com IA",
      "Entrevista inicial (chat ou vídeo assíncrono)",
      "Shortlist com scoring + notas",
    ],
    problems: [
      "Vaga aberta há 2 meses sem finalista",
      "Recebe 500 currículos e ninguém olha",
      "Recrutadora custa 1-3× salário do candidato",
      "Contratação demora e time sofre",
    ],
    deliverables: [
      "Vaga publicada em múltiplos portais",
      "Triagem completa em até 48h",
      "Entrevista inicial gravada de cada finalista",
      "Shortlist Top 5 com scoring técnico e cultural",
    ],
    channels: ["LinkedIn Jobs", "Vagas.com", "Gupy", "InfoJobs", "Google Meet", "Notion / Sheets"],
    team: [
      { name: "Job Designer", role: "Escreve descrição de vaga otimizada" },
      { name: "Publisher", role: "Distribui em portais" },
      { name: "Triador", role: "Filtra CV por requisito hard/soft" },
      { name: "Entrevistador", role: "Conduz 1ª entrevista por chat/vídeo" },
      { name: "Curador", role: "Monta shortlist com fit cultural" },
    ],
    tiers: [
      { name: "Starter", price: 797, tagline: "2 vagas/mês", features: ["3 portais", "Triagem básica", "Shortlist Top 3"] },
      { name: "Growth", price: 997, tagline: "Até 5 vagas/mês", features: ["Todos os portais", "Entrevista por chat", "Shortlist Top 5", "Fit cultural"], highlighted: true },
      { name: "Pro", price: 2497, tagline: "Volume alto + entrevista vídeo", features: ["Vagas ilimitadas", "Entrevista vídeo assíncrona", "Teste técnico integrado", "CSM dedicado"] },
    ],
    faq: [
      { q: "Substitui minha recrutadora?", a: "Substitui a operação (triagem + 1ª entrevista). Você entra na entrevista final e na proposta." },
      { q: "Como funciona a entrevista por IA?", a: "Candidato responde 5-8 perguntas por chat (Growth) ou grava vídeo curto (Pro). A IA classifica e você vê só os melhores." },
      { q: "Serve pra vaga técnica?", a: "Sim. Integramos teste técnico (frontend/backend/data) e a IA analisa código antes de te entregar." },
    ],
    seoTitle: "RH IA — Squad de recrutamento que tria, entrevista e entrega shortlist | Clauthor",
    seoDescription: "Squad de IA de recrutamento: publica vaga em LinkedIn e Gupy, tria currículos, faz entrevista inicial e entrega shortlist pronto. A partir de R$ 797/mês.",
    demand: "ALTA",
  },
  {
    slug: "sucesso-cliente",
    icon: HeartHandshake,
    name: "Sucesso do Cliente IA",
    category: "Retenção · CS",
    tagline: "Squad que reduz churn: onboarding, health-score, alerta de risco e ativação de contas frias.",
    hero: {
      kicker: "Squad · Customer Success",
      headline: "Reduza churn em 40%",
      highlight: "sem contratar mais CSM",
      subhead: "Squad que conduz onboarding do novo cliente, calcula health-score em tempo real, alerta antes do cancelamento e reativa conta fria antes de virar churn.",
      bullets: ["Health-score automático", "Alerta antes de cancelar", "Playbook de reativação"],
    },
    price: 897,
    agents: 5,
    features: [
      "Onboarding guiado (checklist ativo)",
      "Health-score em tempo real",
      "Alerta de risco de churn",
      "Ativação de conta fria",
      "QBR automatizado",
    ],
    problems: [
      "Cliente cancela e você descobre depois",
      "Onboarding perdido = churn nos 90 dias",
      "CSM humano só cuida de conta grande",
      "Sem visibilidade de qual cliente está em risco",
    ],
    deliverables: [
      "Health-score de todos os clientes atualizado diário",
      "Playbook automático por faixa de risco",
      "Onboarding com checklist e nudges",
      "QBR (revisão trimestral) gerado automático",
    ],
    channels: ["HubSpot / Pipedrive / Salesforce", "Intercom / Zendesk", "Mixpanel / Amplitude", "Slack / WhatsApp", "Google Sheets"],
    team: [
      { name: "Onboarder", role: "Conduz primeiro 30 dias com checklist" },
      { name: "Analista Health-Score", role: "Calcula risco por sinais de uso" },
      { name: "Alerta Bot", role: "Aciona ação por faixa de risco" },
      { name: "Reativador", role: "Reengaja conta fria com playbook" },
      { name: "QBR Bot", role: "Monta revisão trimestral" },
    ],
    tiers: [
      { name: "Starter", price: 797, tagline: "Até 300 clientes", features: ["Health-score básico", "Alerta por e-mail", "Onboarding padrão"] },
      { name: "Growth", price: 897, tagline: "Até 2.000 clientes", features: ["Onboarding customizado", "Playbook por segmento", "QBR trimestral", "Integração CRM"], highlighted: true },
      { name: "Pro", price: 1997, tagline: "Volume alto + multi-produto", features: ["Multi-produto / multi-plano", "CSM humano incluído", "Custom playbooks", "CSM dedicado"] },
    ],
    faq: [
      { q: "Como calcula o health-score?", a: "Combinamos uso do produto, engajamento com suporte, NPS e ciclo de billing. Cada indústria tem calibração diferente." },
      { q: "Ele fala com o cliente sozinho?", a: "Sim, no Growth e Pro. Você define quais mensagens são automáticas e quais precisam de aprovação do CSM humano." },
      { q: "Vale a pena pra SaaS pequeno?", a: "Sim. Empresas com 50+ clientes já veem redução de churn no 2º mês." },
    ],
    seoTitle: "Sucesso do Cliente IA — Squad que reduz churn e faz onboarding | Clauthor",
    seoDescription: "Squad de IA para Customer Success: onboarding guiado, health-score, alerta de churn e ativação de conta fria. Reduza churn em 40%. A partir de R$ 797/mês.",
    demand: "ALTA",
  },
  {
    slug: "financeiro",
    icon: Wallet,
    name: "Financeiro IA",
    category: "Financeiro · Cobrança",
    tagline: "Cobrança automatizada, conciliação bancária e follow-up de inadimplentes. Reduza inadimplência sem pisar em cliente.",
    hero: {
      kicker: "Squad · Financeiro",
      headline: "Receba mais, cobre menos,",
      highlight: "sem constranger cliente",
      subhead: "Squad que faz régua de cobrança, envia lembretes por WhatsApp/e-mail no tom certo, concilia banco automaticamente e entrega relatório de inadimplência.",
      bullets: ["Régua customizável", "Cobrança educada e efetiva", "Conciliação bancária"],
    },
    price: 597,
    agents: 4,
    features: [
      "Cobrança automática (WhatsApp + e-mail)",
      "Régua de cobrança customizável",
      "Conciliação bancária",
      "Emissão de boletos e Pix",
      "Relatório de inadimplência",
    ],
    problems: [
      "Inadimplência acima de 15% e sem controle",
      "Cobrar cliente é chato e todo mundo empurra",
      "Conciliação bancária consumindo dias do time",
      "Boleto vencido esquecido virando prejuízo",
    ],
    deliverables: [
      "Régua ativa: 3 dias antes, no vencimento, +3, +7, +15",
      "Boleto / Pix gerado e enviado sozinho",
      "Conciliação automática com extrato",
      "Report semanal de inadimplência",
    ],
    channels: ["WhatsApp", "E-mail", "Asaas / Iugu / Pagar.me", "Omie / ContaAzul / Bling", "Open Finance"],
    team: [
      { name: "Régua de Cobrança", role: "Dispara lembrete no timing certo" },
      { name: "Redator Empático", role: "Escreve mensagem no tom da marca" },
      { name: "Conciliador", role: "Bate extrato com contas a receber" },
      { name: "Analista Inadimplência", role: "Report e priorização" },
    ],
    tiers: [
      { name: "Starter", price: 597, tagline: "Até 400 cobranças/mês", features: ["1 canal", "Régua básica", "Report mensal"] },
      { name: "Growth", price: 597, tagline: "Até 2.000 cobranças/mês", features: ["WhatsApp + e-mail", "Régua customizada", "Conciliação bancária", "Report semanal"], highlighted: true },
      { name: "Pro", price: 1297, tagline: "Volume alto + multi-CNPJ", features: ["Multi-empresa", "Integração ERP", "Cobrança jurídica escalada", "CSM dedicado"] },
    ],
    faq: [
      { q: "Integra com meu ERP?", a: "Sim. Nativo com Omie, ContaAzul e Bling. Outros ERPs via API." },
      { q: "A cobrança é chata ou empática?", a: "Empática por padrão. Você define o tom nos 5 dias de calibração." },
      { q: "Quanto reduz de inadimplência?", a: "Média dos clientes: -30% a -55% em 90 dias." },
    ],
    seoTitle: "Financeiro IA — Squad de cobrança automatizada e conciliação | Clauthor",
    seoDescription: "Squad de IA financeiro: cobrança por WhatsApp e e-mail, conciliação bancária, emissão de boleto/Pix. Reduza inadimplência em até 55%. A partir de R$ 597/mês.",
    demand: "ALTA",
  },
  {
    slug: "juridico",
    icon: Scale,
    name: "Jurídico IA",
    category: "Contratos & Compliance",
    tagline: "Squad jurídico: revisão de contrato, geração de minuta, cláusula de risco e monitoramento de prazos.",
    hero: {
      kicker: "Squad · Jurídico",
      headline: "Um jurídico completo",
      highlight: "sem contratar advogado full-time",
      subhead: "Squad que revisa contrato em minutos, gera minuta padrão, aponta cláusula de risco e monitora prazos de assinatura, notificação e vencimento.",
      bullets: ["Revisão de contrato em minutos", "Geração de minuta", "Alerta de prazo automático"],
    },
    price: 1197,
    agents: 5,
    features: [
      "Revisão de contrato com apontamento de risco",
      "Geração de minuta padrão",
      "Biblioteca de cláusulas versionada",
      "Assinatura digital (ClickSign / D4Sign)",
      "Monitoramento de prazos",
    ],
    problems: [
      "Contrato parado 2 semanas esperando revisão",
      "Cláusula perigosa passando batido",
      "Advogado externo cobra por hora e trava fluxo",
      "Prazo de contrato vencendo sem ninguém saber",
    ],
    deliverables: [
      "Contratos revisados com risco classificado",
      "Minutas padrão prontas por tipo (NDA, prestação, SaaS...)",
      "Fluxo de assinatura digital ativo",
      "Alerta de prazos crítico",
    ],
    channels: ["ClickSign", "D4Sign", "DocuSign", "Google Drive / Dropbox", "Slack / WhatsApp"],
    team: [
      { name: "Revisor de Contrato", role: "Aponta risco e sugere ajuste" },
      { name: "Minutador", role: "Gera contrato padrão parametrizado" },
      { name: "Biblioteca de Cláusulas", role: "Versiona e sugere trechos aprovados" },
      { name: "Assinatura Bot", role: "Envia, acompanha e arquiva" },
      { name: "Guardião de Prazos", role: "Alerta vencimento e notificação" },
    ],
    tiers: [
      { name: "Starter", price: 597, tagline: "Até 20 contratos/mês", features: ["Revisão + minuta padrão", "Biblioteca fechada", "Alerta por e-mail"] },
      { name: "Growth", price: 1197, tagline: "Até 100 contratos/mês", features: ["Todos os tipos", "Biblioteca customizada", "Assinatura digital", "Alerta WhatsApp"], highlighted: true },
      { name: "Pro", price: 2497, tagline: "Escritório completo + M&A", features: ["Volume ilimitado", "M&A e societário", "Advogado humano incluído", "CSM dedicado"] },
    ],
    faq: [
      { q: "Substitui meu advogado?", a: "Substitui o operacional (revisão de rotina, minuta). Advogado humano fica pro estratégico, litígio e M&A." },
      { q: "É seguro? Vaza dado do contrato?", a: "Não. Processamos com modelos que não retêm seus dados. Contratos ficam criptografados no seu ambiente." },
      { q: "Serve pra escritório de advocacia?", a: "Sim. Temos vertical dedicada (Clauthor Advocacia) com painel específico pra escritório." },
    ],
    seoTitle: "Jurídico IA — Squad que revisa contrato e gera minuta | Clauthor",
    seoDescription: "Squad de IA jurídico: revisa contrato em minutos, gera minuta, aponta cláusula de risco e monitora prazos. A partir de R$ 597/mês.",
    demand: "NOVA",
  },
];

export const getSquadBySlug = (slug: string): Squad | undefined =>
  SQUADS.find((s) => s.slug === slug);
