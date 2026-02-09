import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, TrendingUp, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic
} from "lucide-react";

const templates = [
  {
    icon: MessageSquare,
    title: "Atendimento Omnichannel",
    desc: "Atendimento automático 24/7 com triagem inteligente, mensagens humanizadas e resolução de tickets.",
    tags: ["WhatsApp", "Instagram", "Site"],
    actions: ["Responder mensagens", "Triagem automática", "Escalar para humano", "Fechar tickets"],
    integrations: ["WhatsApp API", "Instagram API", "Webhook"],
  },
  {
    icon: TrendingUp,
    title: "Prospecção & Vendas",
    desc: "Busca leads qualificados, envia mensagens personalizadas, cria cadências e agenda reuniões automaticamente.",
    tags: ["CRM", "E-mail", "LinkedIn"],
    actions: ["Buscar leads", "Enviar e-mails", "Criar cadência", "Agendar reuniões", "Atualizar CRM"],
    integrations: ["HubSpot", "Pipedrive", "Gmail"],
  },
  {
    icon: FileText,
    title: "Conteúdo & Social Media",
    desc: "Criação de posts, roteiros, copy e agendamento automático para suas redes sociais.",
    tags: ["Instagram", "LinkedIn", "TikTok"],
    actions: ["Gerar posts", "Criar roteiros", "Escrever copy", "Agendar publicações"],
    integrations: ["Instagram API", "OpenAI", "Notion"],
  },
  {
    icon: DollarSign,
    title: "Cobrança & Financeiro",
    desc: "Lembretes automáticos, geração de boletos, PIX, e-mails e follow-up de cobrança.",
    tags: ["PIX", "Boleto", "WhatsApp"],
    actions: ["Enviar lembretes", "Gerar boletos", "Enviar PIX", "Follow-up", "Relatórios"],
    integrations: ["WhatsApp API", "Gateway de Pagamento", "Gmail"],
  },
  {
    icon: Calendar,
    title: "Agenda & Agendamentos",
    desc: "Reserva horários, envia lembretes, reagenda e confirma automaticamente com seus clientes.",
    tags: ["Agenda", "WhatsApp", "E-mail"],
    actions: ["Reservar horários", "Enviar lembretes", "Reagendar", "Confirmar presença"],
    integrations: ["Google Calendar", "WhatsApp API", "Gmail"],
  },
  {
    icon: Receipt,
    title: "Fiscal & Documentos",
    desc: "Geração automática de DARF, NFs, recibos, PDFs e relatórios fiscais inteligentes.",
    tags: ["DARF", "NF-e", "PDF"],
    actions: ["Gerar DARF", "Emitir NF", "Criar recibos", "Gerar PDFs", "Relatórios"],
    integrations: ["SEFAZ", "Google Sheets", "APIs Customizadas"],
  },
  {
    icon: Star,
    title: "Reputação Online",
    desc: "Monitora e responde avaliações no Google e Reclame Aqui, propõe soluções e reduz danos.",
    tags: ["Google", "Reclame Aqui"],
    actions: ["Monitorar avaliações", "Responder reviews", "Propor soluções", "Alertar equipe"],
    integrations: ["Google Business", "Reclame Aqui API", "Slack"],
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    desc: "Tracking de pedidos, pós-venda automatizado, status de entrega e integração com marketplaces.",
    tags: ["Shopify", "Mercado Livre", "Correios"],
    actions: ["Tracking", "Pós-venda", "Status de pedido", "Notificações"],
    integrations: ["Shopify", "Mercado Livre API", "Correios API"],
  },
  {
    icon: Code,
    title: "Desenvolvedor Autônomo",
    desc: "Escreve código, cria PRs, faz code review, corrige bugs e implementa features automaticamente.",
    tags: ["GitHub", "CI/CD", "IA"],
    actions: ["Gerar código", "Code review", "Corrigir bugs", "Criar PRs", "Deploy automático"],
    integrations: ["GitHub API", "OpenAI", "Vercel", "Docker"],
  },
  {
    icon: Brain,
    title: "Analista de Dados & BI",
    desc: "Coleta dados, gera insights, cria dashboards e envia relatórios executivos automaticamente.",
    tags: ["Analytics", "BI", "Relatórios"],
    actions: ["Coletar dados", "Análise preditiva", "Gerar dashboards", "Alertas inteligentes"],
    integrations: ["Google Analytics", "BigQuery", "Power BI", "Slack"],
  },
  {
    icon: Shield,
    title: "Segurança & Compliance",
    desc: "Monitora vulnerabilidades, audita acessos, verifica compliance LGPD e gera relatórios de segurança.",
    tags: ["LGPD", "Auditoria", "Segurança"],
    actions: ["Scan de vulnerabilidades", "Auditoria de acessos", "Relatório LGPD", "Alertas críticos"],
    integrations: ["AWS Security", "Azure AD", "Slack", "Email"],
  },
  {
    icon: Mic,
    title: "Assistente de Reuniões",
    desc: "Transcreve reuniões, gera atas, extrai action items e envia follow-ups automaticamente.",
    tags: ["Zoom", "Meet", "Teams"],
    actions: ["Transcrever áudio", "Gerar atas", "Extrair tarefas", "Enviar resumos"],
    integrations: ["Zoom API", "Google Meet", "Notion", "Slack"],
  },
];

const LibraryPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1">Biblioteca de Agentes</h1>
        <p className="text-muted-foreground">Templates prontos para usar. Personalize e ative em minutos.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-background/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg mb-1">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {t.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Ações</p>
              <div className="flex flex-wrap gap-1.5">
                {t.actions.map((a) => (
                  <span key={a} className="text-xs px-2 py-1 rounded bg-accent/50 text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Integrações</p>
              <div className="flex flex-wrap gap-1.5">
                {t.integrations.map((ig) => (
                  <span key={ig} className="text-xs px-2 py-1 rounded neon-border text-primary/80">
                    {ig}
                  </span>
                ))}
              </div>
            </div>

            <Link to="/create-agent">
              <Button size="sm" className="w-full neon-glow group-hover:opacity-100 opacity-80 transition-opacity">
                Usar este template
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;
