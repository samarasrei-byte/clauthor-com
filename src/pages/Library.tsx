import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic, Bot, Eye
} from "lucide-react";
import ROICalculator from "@/components/library/ROICalculator";
import AgentLivePreview from "@/components/library/AgentLivePreview";

const templates = [
  {
    icon: MessageSquare,
    title: "Atendimento Omnichannel",
    desc: "Atendimento automático 24/7 com triagem inteligente, resolução de tickets, follow-up e escalonamento.",
    tags: ["WhatsApp", "Instagram", "Site", "Telegram"],
    actions: [
      "Responder mensagens em tempo real", "Triagem automática por urgência", "Escalar para humano quando necessário",
      "Fechar tickets resolvidos", "Enviar pesquisa de satisfação", "Gerar relatório de atendimentos",
      "Identificar padrões de reclamação", "Responder FAQs automaticamente", "Criar base de conhecimento",
      "Monitorar SLA de resposta", "Classificar sentimento do cliente", "Encaminhar para departamento correto",
      "Enviar follow-up pós-atendimento", "Agendar callbacks", "Coletar dados de contato",
      "Gerar scripts de atendimento", "Integrar com CRM", "Notificar gestores sobre crises",
      "Traduzir mensagens em tempo real", "Analisar métricas de resolução"
    ],
    integrations: ["WhatsApp API", "Instagram API", "Webhook", "Telegram API"],
    tier: "intermediate",
    price: 189900,
  },
  {
    icon: FileText,
    title: "Conteúdo & Social Media",
    desc: "Criação completa de conteúdo, agendamento, análise de métricas e gestão de redes sociais.",
    tags: ["Instagram", "LinkedIn", "TikTok", "YouTube"],
    actions: [
      "Gerar posts com copy otimizado", "Criar roteiros para Reels/TikTok", "Escrever copy para ads",
      "Agendar publicações automáticas", "Analisar métricas de engajamento", "Criar calendário editorial",
      "Pesquisar tendências e hashtags", "Gerar legendas em múltiplos idiomas", "Criar threads para Twitter/X",
      "Otimizar SEO de posts", "Criar carrosséis automáticos", "Monitorar menções da marca",
      "Responder comentários automáticos", "Gerar relatório semanal de performance", "Criar stories interativos",
      "Sugerir horários ideais de postagem", "A/B testing de headlines", "Criar thumbnails e descrições",
      "Gerar artigos para blog", "Adaptar conteúdo por plataforma"
    ],
    integrations: ["Instagram API", "OpenAI", "Notion", "YouTube API"],
    tier: "basic",
    price: 177900,
  },
  {
    icon: DollarSign,
    title: "Cobrança & Financeiro",
    desc: "Gestão completa de cobranças, conciliação, geração de boletos, PIX e relatórios financeiros.",
    tags: ["PIX", "Boleto", "WhatsApp", "Contábil"],
    actions: [
      "Enviar lembretes de vencimento", "Gerar boletos automaticamente", "Criar links de pagamento PIX",
      "Follow-up de cobrança escalonado", "Conciliar pagamentos recebidos", "Gerar relatórios de inadimplência",
      "Negociar parcelamentos automáticos", "Emitir recibos de pagamento", "Classificar despesas por categoria",
      "Calcular juros e multas", "Enviar segunda via de boleto", "Integrar com sistema contábil",
      "Alertar sobre faturas vencidas", "Gerar fluxo de caixa projetado", "Criar dashboard financeiro",
      "Automatizar DRE mensal", "Controlar contas a pagar e receber", "Gerar nota promissória",
      "Enviar comprovantes automáticos", "Auditoria de transações"
    ],
    integrations: ["WhatsApp API", "Gateway de Pagamento", "Gmail", "Sistema Contábil"],
    tier: "intermediate",
    price: 197900,
  },
  {
    icon: Calendar,
    title: "Agenda & Agendamentos",
    desc: "Gestão completa de agendas, reservas, confirmações, reagendamentos e controle de capacidade.",
    tags: ["Agenda", "WhatsApp", "E-mail", "CRM"],
    actions: [
      "Reservar horários automaticamente", "Enviar lembretes 24h e 1h antes", "Reagendar com um clique",
      "Confirmar presença via WhatsApp", "Gerenciar lista de espera", "Bloquear horários indisponíveis",
      "Enviar link de videoconferência", "Coletar informações pré-consulta", "Calcular taxa de no-show",
      "Enviar pesquisa pós-atendimento", "Gerenciar múltiplas agendas", "Sincronizar com Google Calendar",
      "Criar relatório de ocupação", "Otimizar distribuição de horários", "Enviar confirmação por email",
      "Gerenciar cancelamentos", "Controlar limite de agendamentos/dia", "Exportar dados para planilha",
      "Notificar equipe sobre mudanças", "Integrar com sistema de pagamento"
    ],
    integrations: ["Google Calendar", "WhatsApp API", "Gmail", "Zoom"],
    tier: "basic",
    price: 179900,
  },
  {
    icon: Receipt,
    title: "Fiscal & Documentos",
    desc: "Automação completa de obrigações fiscais, emissão de NFs, relatórios e compliance tributário.",
    tags: ["DARF", "NF-e", "PDF", "SPED"],
    actions: [
      "Gerar DARF automaticamente", "Emitir NF-e e NFS-e", "Criar recibos personalizados",
      "Gerar PDFs formatados", "Calcular impostos por regime", "Enviar obrigações acessórias",
      "Classificar documentos por tipo", "Validar CNPJs e CPFs", "Gerar SPED fiscal",
      "Controlar certidões negativas", "Alertar sobre vencimentos fiscais", "Conciliar notas com pagamentos",
      "Gerar relatórios tributários", "Arquivar documentos digitalmente", "Consultar situação cadastral",
      "Calcular DAS do Simples Nacional", "Gerar livro caixa digital", "Emitir CT-e e MDF-e",
      "Controlar retenções na fonte", "Integrar com contabilidade"
    ],
    integrations: ["SEFAZ", "Google Sheets", "APIs Customizadas", "Contabilidade"],
    tier: "advanced",
    price: 219900,
  },
  {
    icon: Star,
    title: "Reputação Online",
    desc: "Monitoramento, resposta e gestão completa de avaliações em todas as plataformas.",
    tags: ["Google", "Reclame Aqui", "Trustpilot"],
    actions: [
      "Monitorar avaliações em tempo real", "Responder reviews automaticamente", "Propor soluções personalizadas",
      "Classificar avaliações por sentimento", "Gerar relatório de reputação", "Alertar sobre avaliações negativas",
      "Solicitar reviews de clientes satisfeitos", "Identificar padrões de reclamação", "Escalar casos críticos",
      "Monitorar concorrentes", "Gerar análise competitiva", "Criar respostas templates",
      "Acompanhar evolução da nota", "Integrar feedback com produto", "Enviar pesquisa NPS",
      "Monitorar redes sociais", "Rastrear menções da marca", "Gerar alertas de crise",
      "Criar plano de ação corretivo", "Medir impacto de ações"
    ],
    integrations: ["Google Business", "Reclame Aqui API", "Slack", "Trustpilot API"],
    tier: "intermediate",
    price: 187900,
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    desc: "Gestão completa de pedidos, pós-venda, logística, estoque e marketplace integration.",
    tags: ["Shopify", "Mercado Livre", "Correios", "Amazon"],
    actions: [
      "Tracking de pedidos em tempo real", "Pós-venda automatizado", "Atualizar status de pedido",
      "Enviar notificações de entrega", "Gerenciar devoluções e trocas", "Controlar estoque automaticamente",
      "Sincronizar preços entre marketplaces", "Gerar etiquetas de envio", "Calcular frete dinâmico",
      "Responder perguntas de produtos", "Otimizar listagens de produtos", "Gerenciar avaliações de produtos",
      "Criar promoções automáticas", "Alertar sobre estoque baixo", "Gerar relatório de vendas",
      "Processar pedidos em lote", "Gerenciar múltiplos armazéns", "Integrar com ERP",
      "Automatizar remarketing", "Analisar comportamento de compra"
    ],
    integrations: ["Shopify", "Mercado Livre API", "Correios API", "Amazon SP-API"],
    tier: "advanced",
    price: 229900,
  },
  {
    icon: Code,
    title: "Desenvolvedor Autônomo",
    desc: "Desenvolvimento completo de código, revisão, testes, deploy e manutenção de software.",
    tags: ["GitHub", "CI/CD", "IA", "DevOps"],
    actions: [
      "Gerar código sob demanda", "Code review automático", "Corrigir bugs identificados",
      "Deploy automático em produção", "Escrever testes unitários", "Refatorar código legado",
      "Criar documentação técnica", "Monitorar performance de apps", "Gerar migrations de banco",
      "Configurar CI/CD pipelines", "Analisar vulnerabilidades de segurança", "Otimizar queries SQL",
      "Criar APIs RESTful", "Gerenciar dependências", "Implementar monitoramento e alertas",
      "Criar Docker containers", "Gerenciar infraestrutura cloud", "Implementar cache strategies",
      "Code splitting e otimização", "Gerenciar secrets e variáveis"
    ],
    integrations: ["GitHub API", "OpenAI", "Vercel", "Docker"],
    tier: "enterprise",
    price: 244700,
  },
  {
    icon: Shield,
    title: "Segurança & Compliance",
    desc: "Monitoramento contínuo, auditoria de segurança, LGPD compliance e proteção de dados.",
    tags: ["LGPD", "Auditoria", "Segurança", "SOC2"],
    actions: [
      "Scan de vulnerabilidades contínuo", "Auditoria de acessos e permissões", "Relatório LGPD automático",
      "Monitorar tentativas de intrusão", "Classificar dados sensíveis", "Gerar políticas de privacidade",
      "Teste de penetração automatizado", "Monitorar vazamentos de dados", "Gerenciar consentimentos",
      "Criar plano de resposta a incidentes", "Auditar logs de sistema", "Verificar compliance SOC2",
      "Gerenciar certificados SSL", "Implementar 2FA automático", "Treinar equipe em segurança",
      "Avaliar fornecedores terceiros", "Gerar DPIA automático", "Monitorar dark web",
      "Criar backup automático", "Gerar relatório de conformidade"
    ],
    integrations: ["AWS Security", "Azure AD", "Slack", "SentinelOne"],
    tier: "enterprise",
    price: 239900,
  },
  {
    icon: Mic,
    title: "Assistente de Reuniões",
    desc: "Transcrição, resumos, action items, follow-ups e gestão completa de reuniões.",
    tags: ["Zoom", "Meet", "Teams", "Slack"],
    actions: [
      "Transcrever reuniões em tempo real", "Gerar atas detalhadas", "Extrair action items automáticos",
      "Enviar follow-ups personalizados", "Criar resumo executivo", "Identificar decisões tomadas",
      "Atribuir tarefas aos participantes", "Agendar reunião de follow-up", "Gerar timeline de decisões",
      "Traduzir transcrições", "Buscar informações em reuniões antigas", "Classificar por tema/projeto",
      "Alertar sobre prazos mencionados", "Integrar tarefas com Jira/Trello", "Gerar relatório semanal",
      "Analisar tempo gasto em reuniões", "Sugerir otimização de agenda", "Criar wiki de decisões",
      "Enviar highlights para ausentes", "Medir efetividade das reuniões"
    ],
    integrations: ["Zoom API", "Google Meet", "Notion", "Slack"],
    tier: "advanced",
    price: 209900,
  },
];

const tierLabels: Record<string, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
  enterprise: "Enterprise",
};

const tierColors: Record<string, string> = {
  basic: "bg-muted/80 text-muted-foreground border-transparent",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "basic", "intermediate", "advanced", "enterprise"];

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");
  const [previewAgent, setPreviewAgent] = useState<{ name: string; desc: string } | null>(null);
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  const filteredTemplates = filter === "all" 
    ? templates 
    : templates.filter(t => t.tier === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80">
            <Bot className="h-3 w-3 mr-1" />
            {templates.length} agentes disponíveis
          </Badge>
          <h1 className="font-display text-3xl font-bold mb-2">Nossos Agentes</h1>
          <p className="text-muted-foreground">Cada agente faz o trabalho de 20 funcionários. Contrate e ative em minutos.</p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {tiers.map((tier) => (
            <Button
              key={tier}
              variant={filter === tier ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tier)}
              className={`rounded-lg text-xs ${
                filter === tier 
                  ? "glow" 
                  : "border-border hover:border-primary/20"
              }`}
            >
              {tier === "all" ? "Todos" : tierLabels[tier]}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredTemplates.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            layout
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="glass-card rounded-2xl p-6 glass-hover h-full flex flex-col relative overflow-hidden group">
              {/* Glow effect on hover */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Enterprise badge glow */}
              {t.tier === "enterprise" && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />
              )}
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    t.tier === "enterprise" 
                       ? "bg-gradient-to-br from-primary/20 to-primary-glow/20" 
                       : t.tier === "advanced"
                       ? "bg-gradient-to-br from-amber-500/10 to-primary/10"
                      : "bg-primary/5"
                  }`}>
                    <t.icon className="h-7 w-7 text-primary/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg">{t.title}</h3>
                      {t.tier === "enterprise" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 font-medium">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>

              {/* Price & Tier */}
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-border relative z-10">
                <Badge variant="outline" className={`${tierColors[t.tier]} font-medium`}>
                  {tierLabels[t.tier]}
                </Badge>
                <div className="text-right">
                  <p className="font-display font-bold text-2xl gradient-text">
                    R$ {(t.price / 100).toLocaleString("pt-BR")}
                  </p>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                {t.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2.5 py-1 rounded-lg bg-card text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="mb-5 flex-1 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  {t.actions.length} Capacidades — Trabalho de 20 pessoas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.actions.slice(0, expandedActions === t.title ? 20 : 6).map((a) => (
                    <span 
                      key={a} 
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/[0.03] text-foreground/70 border border-primary/10"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                {t.actions.length > 6 && (
                  <button 
                    onClick={() => setExpandedActions(expandedActions === t.title ? null : t.title)}
                    className="text-xs text-primary/70 hover:text-primary mt-2 transition-colors"
                  >
                    {expandedActions === t.title ? "Ver menos" : `+${t.actions.length - 6} capacidades`}
                  </button>
                )}
              </div>

              {/* Integrations preview */}
              <div className="mb-5 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest">
                  Integrações
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {t.integrations.slice(0, 3).map((integration) => (
                      <div 
                        key={integration}
                        className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                        title={integration}
                      >
                        {integration.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {t.integrations.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{t.integrations.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-2 relative z-10">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-border hover:border-primary/20"
                  onClick={() => setPreviewAgent({ name: t.title, desc: t.desc })}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Testar 60s
                </Button>
                <Link to="/auth" className="flex-1">
                  <Button className={`w-full rounded-xl group h-12 font-semibold ${
                    t.tier === "enterprise" 
                      ? "bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90" 
                      : "glow"
                  }`}>
                    Contratar
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Agent Live Preview Modal */}
      <AgentLivePreview
        agentName={previewAgent?.name || ""}
        agentDesc={previewAgent?.desc || ""}
        isOpen={!!previewAgent}
        onClose={() => setPreviewAgent(null)}
      />
    </div>
  );
};

export default LibraryPage;
