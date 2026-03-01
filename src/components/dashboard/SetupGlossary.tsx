import { HelpCircle, PlayCircle, BookOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

/** Glossary of technical terms with friendly explanations */
const GLOSSARY: Record<string, string> = {
  "API Key": "Uma 'senha especial' que identifica seu app. Funciona como uma chave de acesso — quem tem, pode usar o serviço.",
  "API": "Interface de Programação — é como dois sistemas 'conversam' entre si automaticamente, sem precisar de uma pessoa.",
  "Access Token": "Um código temporário que prova que você tem permissão para acessar algo. Pense como um crachá digital.",
  "Token": "Um código temporário que prova que você tem permissão para acessar algo. Pense como um crachá digital.",
  "Client ID": "O 'nome de usuário' do seu aplicativo. Identifica qual app está fazendo a conexão.",
  "Client Secret": "A 'senha' do seu aplicativo. Nunca compartilhe — é como a senha do seu banco.",
  "OAuth": "Um método seguro de login que permite conectar apps sem compartilhar sua senha real. Ex: 'Entrar com Google'.",
  "OAuth 2.0": "Um método seguro de login que permite conectar apps sem compartilhar sua senha real. Ex: 'Entrar com Google'.",
  "Webhook": "Um 'aviso automático' que um sistema envia para outro quando algo acontece. Ex: receber uma notificação quando chega uma mensagem.",
  "Phone Number ID": "O identificador único do seu número de WhatsApp dentro da plataforma Meta. Não é o número em si.",
  "Ad Account ID": "O código que identifica sua conta de anúncios no Facebook/Instagram. Começa com 'act_'.",
  "AES-256-GCM": "Um padrão de criptografia militar — seus dados ficam protegidos como informações de segurança nacional.",
  "Criptografia": "Processo de embaralhar dados para que só quem tem a 'chave' consiga ler. Protege suas informações.",
  "CNPJ": "Cadastro Nacional da Pessoa Jurídica — o 'CPF' da sua empresa.",
  "DNS": "Sistema de Nomes de Domínio — traduz endereços como 'google.com' para números que os computadores entendem.",
  "Redirect URL": "O endereço para onde o usuário é enviado após fazer login. É como dizer 'depois de entrar, volte para cá'.",
  "Escopos": "Permissões específicas que você dá ao app. Ex: 'pode ler meu perfil' ou 'pode postar em meu nome'.",
  "SMTP": "Protocolo para envio de e-mails — é o 'carteiro digital' que entrega suas mensagens.",
  "SendGrid": "Um serviço popular para enviar e-mails em massa de forma confiável e sem cair no spam.",
  "Graph API Explorer": "Ferramenta do Facebook para testar conexões com a API. É como um 'playground' para desenvolvedores.",
  "Business Manager": "Painel central do Facebook/Meta para gerenciar páginas, anúncios e apps da sua empresa.",
  "Marketing API": "A interface que permite criar e gerenciar anúncios no Facebook/Instagram de forma automática.",
  "Company Page": "A página oficial da sua empresa no LinkedIn.",
  "ROAS": "Retorno Sobre Investimento em Anúncios — quanto você ganha para cada R$1 investido em ads.",
};

/** Inline tooltip that explains a technical term */
export const TermTooltip = ({ term, children }: { term: string; children?: React.ReactNode }) => {
  const explanation = GLOSSARY[term];
  if (!explanation) return <span className="font-medium">{children || term}</span>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 border-b border-dashed border-primary/40 cursor-help text-primary/90 font-medium">
            {children || term}
            <HelpCircle className="h-3 w-3 text-primary/50" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          <p className="font-semibold mb-1">{term}</p>
          <p className="text-muted-foreground">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Tutorial/documentation link banner */
export const TutorialBanner = ({
  videoUrl,
  docsUrl,
  label,
}: {
  videoUrl?: string;
  docsUrl?: string;
  label: string;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/10 border border-border/20">
      <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary gap-1">
        <BookOpen className="h-3 w-3" /> Ajuda
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 ml-auto">
        {videoUrl && (
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <PlayCircle className="h-3.5 w-3.5" /> Vídeo tutorial
          </a>
        )}
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <BookOpen className="h-3.5 w-3.5" /> Documentação
          </a>
        )}
      </div>
    </div>
  );
};

export default GLOSSARY;
