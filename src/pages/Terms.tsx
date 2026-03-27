import { motion } from "framer-motion";
import { FileText, Shield, Scale, AlertTriangle, Users, Globe, Mail } from "lucide-react";

const sections = [
  {
    icon: Scale,
    title: "1. Aceitação dos Termos",
    content: `Ao acessar e utilizar a plataforma Clauthor ("Plataforma"), você concorda com estes Termos e Condições de Uso. Se você não concordar com qualquer parte destes termos, não utilize a Plataforma. A Clauthor reserva-se o direito de modificar estes termos a qualquer momento, sendo sua responsabilidade verificá-los periodicamente.`,
  },
  {
    icon: FileText,
    title: "2. Descrição do Serviço",
    content: `A Clauthor é uma plataforma de agentes autônomos que oferece automação empresarial através de agentes especializados organizados em departamentos. Os serviços incluem, mas não se limitam a: automação de tarefas, geração de relatórios, gestão de leads, comunicação multicanal (e-mail, WhatsApp, LinkedIn), análise de dados e orquestração de equipes de agentes.`,
  },
  {
    icon: Users,
    title: "3. Cadastro e Conta do Usuário",
    content: `Para utilizar os serviços, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. A Clauthor poderá suspender ou encerrar contas que violem estes termos ou apresentem atividade suspeita.`,
  },
  {
    icon: Shield,
    title: "4. Privacidade e Proteção de Dados",
    content: `A Clauthor opera em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018) e padrões SOC 2 Type II. Todas as credenciais são armazenadas com criptografia AES-256-GCM, e a comunicação é protegida por SSL de 256-bit. Os dados dos usuários são processados exclusivamente para a prestação dos serviços contratados e não são compartilhados com terceiros sem consentimento explícito. Para mais detalhes, consulte nossa Política de Privacidade.`,
  },
  {
    icon: AlertTriangle,
    title: "5. Uso Aceitável",
    content: `Você concorda em não utilizar a Plataforma para: (a) atividades ilegais ou fraudulentas; (b) envio de spam ou comunicações não solicitadas; (c) violação de direitos de propriedade intelectual de terceiros; (d) tentativas de acesso não autorizado a sistemas ou dados; (e) engenharia reversa ou tentativa de extrair código-fonte; (f) uso que possa prejudicar a infraestrutura ou outros usuários da Plataforma.`,
  },
  {
    icon: Globe,
    title: "6. Integrações com Terceiros",
    content: `A Plataforma permite integrações com serviços de terceiros como Meta (Facebook/Instagram), LinkedIn, WhatsApp Business API, SendGrid e outros. O uso dessas integrações está sujeito aos termos e políticas de cada provedor. A Clauthor não se responsabiliza por alterações, indisponibilidades ou limitações impostas por serviços de terceiros. As credenciais de integração fornecidas pelo usuário são armazenadas de forma segura e utilizadas exclusivamente para a operação dos agentes contratados.`,
  },
  {
    icon: Scale,
    title: "7. Planos, Créditos e Pagamentos",
    content: `Os serviços são oferecidos mediante planos de créditos com diferentes limites e funcionalidades. Os créditos são renovados mensalmente conforme o plano contratado. Pagamentos são processados via PayPal e outras formas de pagamento disponíveis. Cancelamentos e reembolsos seguem a política vigente no momento da contratação. A Clauthor reserva-se o direito de alterar preços e planos com aviso prévio de 30 dias.`,
  },
  {
    icon: Shield,
    title: "8. Propriedade Intelectual",
    content: `Todo o conteúdo, design, código, marcas e tecnologia da Plataforma são de propriedade exclusiva da Clauthor. Os dados e conteúdos gerados pelos agentes em nome do usuário pertencem ao usuário, desde que não violem direitos de terceiros. O usuário concede à Clauthor licença para processar seus dados conforme necessário para a prestação dos serviços.`,
  },
  {
    icon: AlertTriangle,
    title: "9. Limitação de Responsabilidade",
    content: `A Clauthor não garante que os serviços serão ininterruptos ou livres de erros. Os agentes de IA podem gerar resultados imprecisos e não substituem o julgamento humano profissional. A responsabilidade total da Clauthor é limitada ao valor pago pelo usuário nos últimos 12 meses. A Clauthor não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da Plataforma.`,
  },
  {
    icon: Mail,
    title: "10. Contato e Foro",
    content: `Para dúvidas sobre estes termos, entre em contato pelo e-mail contato@clauthor.com. Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias.`,
  },
];

const Terms = () => {
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
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Documento Legal</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Termos e Condições de Uso
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Last updated: {new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
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
          <p className="mt-1">São Paulo, SP, Brasil</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Terms;
