/**
 * Catálogo de tutoriais de integração — linguagem 100% leiga.
 *
 * IMPORTANTE: espelhe qualquer alteração em src/lib/integrationTutorials.ts.
 * As duas cópias existem porque edge functions (Deno) e o frontend (Vite)
 * não podem compartilhar o mesmo arquivo diretamente.
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
      {
        title: "Abrir a tela de conexões da Clauthor",
        description: "Aqui dentro da Clauthor, clique no botão azul **'Abrir integração agora'** logo abaixo. Vamos abrir uma nova aba pra você.",
      },
      {
        title: "Clicar em 'Conectar Facebook'",
        description: "Você vai ver um botão azul com o logo do Facebook. Clique nele — o Facebook vai abrir pedindo sua permissão.",
      },
      {
        title: "Autorizar a Clauthor",
        description: "Faça login no Facebook (se já não estiver logado) e clique em **'Continuar como [seu nome]'**. Depois clique em **'Sim, conceder acesso'**. Isso permite que o Thor leia e responda mensagens no seu lugar.",
      },
      {
        title: "Escolher a página",
        description: "Marque a caixinha da página da sua empresa e clique em **'Avançar'**. Se você administra várias, escolha só as que quer conectar agora.",
      },
      {
        title: "Voltar para a Clauthor",
        description: "A tela vai voltar sozinha para cá com uma mensagem verde de sucesso. Pronto — o Thor já está conectado ao seu Facebook.",
      },
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
      "Ela precisa estar vinculada a uma página do Facebook (é assim que o Instagram funciona).",
      "Se ainda não é comercial, entra no app do Instagram → Configurações → Conta → **Mudar para conta profissional**.",
    ],
    steps: [
      {
        title: "Abrir a tela de conexões",
        description: "Clique em **'Abrir integração agora'** aqui em baixo. Vamos te levar direto.",
      },
      {
        title: "Clicar em 'Conectar Instagram'",
        description: "Você vai ver um botão gradiente laranja/rosa com o logo do Instagram. Clique.",
      },
      {
        title: "Fazer login com Facebook",
        description: "O Instagram usa o Facebook por baixo dos panos — então a tela que abre é do Facebook. Entre com a mesma conta que administra a página conectada ao Instagram.",
      },
      {
        title: "Escolher a conta do Instagram",
        description: "Marque a caixinha da conta do Instagram da sua empresa. Se aparecer só uma opção, é ela mesma. Clique em **'Avançar'**.",
      },
      {
        title: "Confirmar permissões",
        description: "Deixe todas as permissões marcadas (ler mensagens, responder comentários, publicar). Clique em **'Concluir'** e a tela volta pra Clauthor.",
      },
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
      "Um número de telefone que **não esteja** ativo em nenhum WhatsApp — pode ser um chip novo ou um número virtual.",
      "Uma conta comercial no Meta Business Manager (a gente ajuda a criar se não tiver).",
    ],
    steps: [
      {
        title: "Abrir a tela de conexões",
        description: "Clique em **'Abrir integração agora'** logo abaixo.",
      },
      {
        title: "Iniciar cadastro guiado",
        description: "Clique no botão verde **'Conectar WhatsApp'**. Uma janela do Meta vai abrir por cima.",
      },
      {
        title: "Escolher a conta comercial",
        description: "Se você já tem uma conta no Meta Business, escolha ela. Se não tem, clique em **'Criar nova conta'** e preencha o nome da empresa e o e-mail. Leva 1 minuto.",
      },
      {
        title: "Cadastrar o número de telefone",
        description: "Digite o número que vai atender no WhatsApp (com DDI, ex: **+55 11 91234-5678**). O Meta vai enviar um código por SMS ou ligação — digite o código de 6 dígitos que chegar.",
      },
      {
        title: "Escolher o nome do remetente",
        description: "É o nome que aparece pros clientes quando o Thor manda mensagem. Coloque o nome da empresa (ex: **Padaria da Ana**). Não pode ter emoji.",
      },
      {
        title: "Aguardar aprovação",
        description: "O Meta revisa em até **48 horas** (geralmente é bem mais rápido, uns 30 minutos). Você recebe um e-mail avisando. Quando aprovar, o botão vira verde aqui na Clauthor e o Thor já começa a atender.",
      },
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
      "Uma conta Google (Gmail comum ou Google Workspace da empresa serve).",
      "Estar logado nessa conta no navegador ajuda — mas não é obrigatório.",
    ],
    steps: [
      {
        title: "Abrir a tela de conexões",
        description: "Clique em **'Abrir integração agora'** aqui em baixo.",
      },
      {
        title: "Clicar em 'Conectar Gmail'",
        description: "Você vai ver um botão branco com o logo colorido do Google. Clique nele.",
      },
      {
        title: "Escolher a conta Google",
        description: "Uma janela do Google abre. Clique na conta que quer conectar. Se não aparecer, clique em **'Usar outra conta'** e faça login.",
      },
      {
        title: "Autorizar as permissões",
        description: "O Google vai listar o que a Clauthor pode fazer: **ler e-mails**, **enviar e-mails** e **organizar em pastas**. Clique em **'Continuar'** e depois em **'Permitir'**.",
      },
      {
        title: "Pronto",
        description: "A tela volta sozinha pra Clauthor com aviso verde. O Thor começa a monitorar sua caixa de entrada nos próximos minutos.",
      },
    ],
    cta: { label: "Abrir integração agora", href: "/settings/connections?open=gmail" },
  },
  // Stubs — implementação completa na fase 2
  { slug: "google-calendar", name: "Google Calendar", category: "produtividade", difficulty: "fácil", est_minutes: 3, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "hubspot", name: "HubSpot", category: "vendas", difficulty: "média", est_minutes: 8, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "pipedrive", name: "Pipedrive", category: "vendas", difficulty: "média", est_minutes: 8, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "shopify", name: "Shopify", category: "comercio", difficulty: "média", est_minutes: 10, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "stripe", name: "Stripe", category: "pagamento", difficulty: "média", est_minutes: 6, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "notion", name: "Notion", category: "produtividade", difficulty: "fácil", est_minutes: 4, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "slack", name: "Slack", category: "produtividade", difficulty: "fácil", est_minutes: 4, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
  { slug: "zapier", name: "Zapier", category: "automacao", difficulty: "fácil", est_minutes: 5, summary: "Em breve · nossa equipe implementa esta integração sob demanda no momento.", prereq: [], steps: [], cta: { label: "Falar com o time", href: "/support" }, stub: true },
];

export const INTEGRATION_TUTORIALS: Record<string, IntegrationTutorial> = Object.fromEntries(
  TUTORIALS.map((t) => [t.slug, t]),
);

export const TUTORIAL_SLUGS = TUTORIALS.map((t) => t.slug);

export function getTutorial(slug: string): IntegrationTutorial | null {
  return INTEGRATION_TUTORIALS[slug.toLowerCase().trim()] ?? null;
}
