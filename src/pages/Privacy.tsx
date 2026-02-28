import { motion } from "framer-motion";
import { Shield, Eye, Database, Lock, UserCheck, Globe, Trash2, Mail } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "1. Informações que Coletamos",
    content: `Coletamos as seguintes categorias de dados: (a) Dados de cadastro: nome, e-mail, empresa, telefone; (b) Dados de uso: interações com agentes, logs de execução, métricas de performance; (c) Dados de integração: credenciais de APIs de terceiros fornecidas voluntariamente pelo usuário; (d) Dados técnicos: endereço IP, tipo de navegador, sistema operacional, cookies essenciais para funcionamento da Plataforma.`,
  },
  {
    icon: Database,
    title: "2. Como Utilizamos seus Dados",
    content: `Seus dados são utilizados para: (a) Prover e melhorar os serviços da Plataforma; (b) Personalizar a experiência e as recomendações dos agentes; (c) Processar pagamentos e gerenciar assinaturas; (d) Enviar comunicações relevantes sobre o serviço; (e) Cumprir obrigações legais e regulatórias; (f) Garantir a segurança e prevenir fraudes. Os dados processados pelos agentes de IA são utilizados exclusivamente no contexto da tarefa solicitada e não são usados para treinar modelos de terceiros.`,
  },
  {
    icon: Lock,
    title: "3. Segurança dos Dados",
    content: `Adotamos medidas técnicas e organizacionais robustas para proteger seus dados: criptografia AES-256-GCM para credenciais armazenadas, comunicação SSL/TLS de 256-bit, isolamento multi-tenant com Row Level Security (RLS), validação HMAC-SHA256 para webhooks, sanitização de inputs em todas as Edge Functions, e controle de acesso baseado em roles (RBAC). Nossa infraestrutura segue padrões SOC 2 Type II e diretrizes LGPD.`,
  },
  {
    icon: UserCheck,
    title: "4. Seus Direitos (LGPD)",
    content: `Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a: (a) Confirmar a existência de tratamento de dados; (b) Acessar seus dados pessoais; (c) Corrigir dados incompletos ou desatualizados; (d) Solicitar anonimização ou bloqueio de dados desnecessários; (e) Solicitar a portabilidade dos dados; (f) Solicitar a eliminação de dados tratados com consentimento; (g) Revogar o consentimento a qualquer momento; (h) Ser informado sobre compartilhamento de dados com terceiros.`,
  },
  {
    icon: Globe,
    title: "5. Compartilhamento com Terceiros",
    content: `Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas com: (a) Provedores de infraestrutura necessários para a operação da Plataforma; (b) Processadores de pagamento para transações financeiras; (c) Serviços de terceiros integrados pelo próprio usuário (Meta, LinkedIn, SendGrid, etc.); (d) Autoridades legais quando exigido por lei ou ordem judicial. Todos os provedores são selecionados com base em seus padrões de segurança e conformidade.`,
  },
  {
    icon: Shield,
    title: "6. Cookies e Tecnologias de Rastreamento",
    content: `Utilizamos cookies essenciais para: manter sua sessão ativa, lembrar preferências de idioma e tema, e garantir a segurança da autenticação. Não utilizamos cookies de terceiros para publicidade ou rastreamento comportamental. Você pode gerenciar cookies através das configurações do seu navegador.`,
  },
  {
    icon: Trash2,
    title: "7. Retenção e Exclusão de Dados",
    content: `Seus dados são retidos enquanto sua conta estiver ativa ou conforme necessário para cumprir obrigações legais. Após o encerramento da conta, os dados pessoais são excluídos em até 30 dias, exceto quando a retenção for exigida por lei. Logs de execução e dados analíticos anonimizados podem ser retidos por até 12 meses para fins de melhoria do serviço.`,
  },
  {
    icon: Mail,
    title: "8. Contato do Encarregado (DPO)",
    content: `Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO): E-mail: privacidade@clauthor.com. Respondemos a todas as solicitações no prazo máximo de 15 dias úteis, conforme determinado pela LGPD.`,
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Documento Legal</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Política de Privacidade
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="space-y-8">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold mb-3">{section.title}</h2>
                    <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>© {new Date().getFullYear()} Clauthor. Todos os direitos reservados.</p>
          <p className="mt-1">CNPJ: XX.XXX.XXX/0001-XX • São Paulo, SP, Brasil</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Privacy;
