/**
 * Catálogo de tutoriais de integração — versão frontend.
 * ESPELHO de supabase/functions/_shared/integrationTutorials.ts.
 * Mantenha os dois arquivos em sync.
 */

export type TutorialDifficulty = "fácil" | "média";

export interface TutorialStep {
  title: string;
  description: string;
  screenshot_hint?: string;
}

export interface IntegrationTutorial {
  slug: string;
  name: string;
  category: "social" | "mensageria" | "produtividade" | "vendas" | "comercio" | "pagamento" | "automacao";
  difficulty: TutorialDifficulty;
  est_minutes: number;
  summary: string;
  prereq: string[];
  steps: TutorialStep[];
  cta: { label: string; href: string };
  stub?: boolean;
}

const TUTORIALS: IntegrationTutorial[] = [
  {
    slug: "facebook",
    name: "Facebook",
    category: "social",
    difficulty: "fácil",
    est_minutes: 5,
    summary: "Conecte a página da sua empresa para o Thor responder mensagens e publicar posts.",
    prereq: [
      "Você precisa ser administrador da página no Facebook.",
      "Ter o login e a senha da conta que administra a página em mãos.",
    ],
    steps: [
      { title: "Abrir a tela de conexões da Clauthor", description: "Aqui dentro da Clauthor, clique no botão azul **'Abrir integração agora'** logo abaixo. Vamos abrir uma nova aba pra você." },
      { title: "Clicar em 'Conectar Facebook'", description: "Você vai ver um botão azul com o logo do Facebook. Clique nele — o Facebook vai abrir pedindo sua permissão." },
      { title: "Autorizar a Clauthor", description: "Faça login no Facebook (se já não estiver logado) e clique em **'Continuar como [seu nome]'**. Depois clique em **'Sim, conceder acesso'**." },
      { title: "Escolher a página", description: "Marque a caixinha da página da sua empresa e clique em **'Avançar'**." },
      { title: "Voltar para a Clauthor", description: "A tela vai voltar sozinha para cá com uma mensagem verde de sucesso. Pronto — o Thor já está conectado." },
    ],
    cta: { label: "Abrir integração agora", href: "/settings/connections?open=facebook" },
  },
  {
    slug: "instagram",
    name: "Instagram",
    category: "social",
    difficulty: "fácil",
    est_minutes: 6,
    summary: "Conecte o Instagram da empresa para responder DMs, comentários e agendar publicações.",
    prereq: [
      "A conta do Instagram precisa ser **conta comercial** ou **conta de criador**. Contas pessoais não funcionam.",
      "Ela precisa estar vinculada a uma página do Facebook.",
      "Se ainda não é comercial, entra no app do Instagram → Configurações → Conta → **Mudar para conta profissional**.",
    ],
    steps: [
      { title: "Abrir a tela de conexões", description: "Clique em **'Abrir integração agora'** aqui em baixo." },
      { title: "Clicar em 'Conectar Instagram'", description: "Botão gradiente laranja/rosa com o logo do Instagram." },
      { title: "Fazer login com Facebook", description: "O Instagram usa o Facebook por baixo dos panos. Entre com a mesma conta que administra a página conectada." },
      { title: "Escolher a conta do Instagram", description: "Marque a caixinha da conta da sua empresa e clique em **'Avançar'**." },
      { title: "Confirmar permissões", description: "Deixe todas as permissões marcadas e clique em **'Concluir'**." },
    ],
    cta: { label: "Abrir integração agora", href: "/settings/connections?open=instagram" },
  },
  {
    slug: "whatsapp",
    name: "WhatsApp Business",
    category: "mensageria",
    difficulty: "média",
    est_minutes: 12,
    summary: "Conecte o WhatsApp Business para o Thor atender clientes 24/7.",
    prereq: [
      "Você precisa ter uma conta **WhatsApp Business** (não é o WhatsApp normal).",
      "Um número de telefone que **não esteja** ativo em nenhum WhatsApp.",
      "Uma conta comercial no Meta Business Manager.",
    ],
    steps: [
      { title: "Abrir a tela de conexões", description: "Clique em **'Abrir integração agora'** logo abaixo." },
      { title: "Iniciar cadastro guiado", description: "Clique no botão verde **'Conectar WhatsApp'**. Uma janela do Meta vai abrir." },
      { title: "Escolher a conta comercial", description: "Escolha uma conta existente ou clique em **'Criar nova conta'** e preencha nome da empresa e e-mail." },
      { title: "Cadastrar o número de telefone", description: "Digite com DDI, ex: **+55 11 91234-5678**. O Meta envia um código por SMS — digite os 6 dígitos que chegarem." },
      { title: "Escolher o nome do remetente", description: "Nome que aparece pros clientes (ex: **Padaria da Ana**). Sem emoji." },
      { title: "Aguardar aprovação", description: "O Meta revisa em até **48 horas** (geralmente 30 minutos). Você recebe e-mail avisando." },
    ],
    cta: { label: "Abrir integração agora", href: "/settings/connections?open=whatsapp" },
  },
  {
    slug: "gmail",
    name: "Gmail",
    category: "produtividade",
    difficulty: "fácil",
    est_minutes: 3,
    summary: "Conecte a conta do Gmail para o Thor ler e responder e-mails.",
    prereq: [
      "Uma conta Google (Gmail comum ou Google Workspace).",
      "Estar logado nessa conta no navegador ajuda — mas não é obrigatório.",
    ],
    steps: [
      { title: "Abrir a tela de conexões", description: "Clique em **'Abrir integração agora'** aqui em baixo." },
      { title: "Clicar em 'Conectar Gmail'", description: "Botão branco com o logo colorido do Google." },
      { title: "Escolher a conta Google", description: "Clique na conta que quer conectar ou faça login em outra." },
      { title: "Autorizar as permissões", description: "O Google vai listar o que a Clauthor pode fazer. Clique em **'Continuar'** e depois em **'Permitir'**." },
      { title: "Pronto", description: "A tela volta sozinha pra Clauthor com aviso verde." },
    ],
    cta: { label: "Abrir integração agora", href: "/settings/connections?open=gmail" },
  },
  { slug: "google-calendar", name: "Google Calendar", category: "produtividade", difficulty: "fácil", est_minutes: 3, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "hubspot", name: "HubSpot", category: "vendas", difficulty: "média", est_minutes: 8, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "pipedrive", name: "Pipedrive", category: "vendas", difficulty: "média", est_minutes: 8, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "shopify", name: "Shopify", category: "comercio", difficulty: "média", est_minutes: 10, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "stripe", name: "Stripe", category: "pagamento", difficulty: "média", est_minutes: 6, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "notion", name: "Notion", category: "produtividade", difficulty: "fácil", est_minutes: 4, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "slack", name: "Slack", category: "produtividade", difficulty: "fácil", est_minutes: 4, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "zapier", name: "Zapier", category: "automacao", difficulty: "fácil", est_minutes: 5, summary: "Em breve · nossa equipe implementa esta integração sob demanda.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
];

export const INTEGRATION_TUTORIALS: Record<string, IntegrationTutorial> = Object.fromEntries(
  TUTORIALS.map((t) => [t.slug, t]),
);

export const TUTORIAL_SLUGS = TUTORIALS.map((t) => t.slug);

export function getTutorial(slug: string): IntegrationTutorial | null {
  return INTEGRATION_TUTORIALS[slug.toLowerCase().trim()] ?? null;
}
