import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, ArrowRight,
  Code, Brain, Shield, Mic, Bot, Filter
} from "lucide-react";

const templates = [
  {
    icon: MessageSquare,
    title: "Atendimento Omnichannel",
    desc: "Atendimento automático 24/7 com triagem inteligente e resolução de tickets.",
    tags: ["WhatsApp", "Instagram", "Site"],
    actions: ["Responder mensagens", "Triagem automática", "Escalar para humano", "Fechar tickets"],
    integrations: ["WhatsApp API", "Instagram API", "Webhook"],
    tier: "intermediate",
    price: 189900,
  },
  {
    icon: FileText,
    title: "Conteúdo & Social Media",
    desc: "Criação de posts, roteiros, copy e agendamento automático para suas redes.",
    tags: ["Instagram", "LinkedIn", "TikTok"],
    actions: ["Gerar posts", "Criar roteiros", "Escrever copy", "Agendar publicações"],
    integrations: ["Instagram API", "OpenAI", "Notion"],
    tier: "basic",
    price: 177900,
  },
  {
    icon: DollarSign,
    title: "Cobrança & Financeiro",
    desc: "Lembretes automáticos, geração de boletos, PIX e follow-up de cobrança.",
    tags: ["PIX", "Boleto", "WhatsApp"],
    actions: ["Enviar lembretes", "Gerar boletos", "Enviar PIX", "Follow-up"],
    integrations: ["WhatsApp API", "Gateway de Pagamento", "Gmail"],
    tier: "intermediate",
    price: 197900,
  },
  {
    icon: Calendar,
    title: "Agenda & Agendamentos",
    desc: "Reserva horários, envia lembretes, reagenda e confirma automaticamente.",
    tags: ["Agenda", "WhatsApp", "E-mail"],
    actions: ["Reservar horários", "Enviar lembretes", "Reagendar", "Confirmar presença"],
    integrations: ["Google Calendar", "WhatsApp API", "Gmail"],
    tier: "basic",
    price: 179900,
  },
  {
    icon: Receipt,
    title: "Fiscal & Documentos",
    desc: "Geração automática de DARF, NFs, recibos, PDFs e relatórios fiscais.",
    tags: ["DARF", "NF-e", "PDF"],
    actions: ["Gerar DARF", "Emitir NF", "Criar recibos", "Gerar PDFs"],
    integrations: ["SEFAZ", "Google Sheets", "APIs Customizadas"],
    tier: "advanced",
    price: 219900,
  },
  {
    icon: Star,
    title: "Reputação Online",
    desc: "Monitora e responde avaliações no Google e Reclame Aqui automaticamente.",
    tags: ["Google", "Reclame Aqui"],
    actions: ["Monitorar avaliações", "Responder reviews", "Propor soluções"],
    integrations: ["Google Business", "Reclame Aqui API", "Slack"],
    tier: "intermediate",
    price: 187900,
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    desc: "Tracking de pedidos, pós-venda automatizado e integração com marketplaces.",
    tags: ["Shopify", "Mercado Livre", "Correios"],
    actions: ["Tracking", "Pós-venda", "Status de pedido", "Notificações"],
    integrations: ["Shopify", "Mercado Livre API", "Correios API"],
    tier: "advanced",
    price: 229900,
  },
  {
    icon: Code,
    title: "Desenvolvedor Autônomo",
    desc: "Escreve código, cria PRs, faz code review e implementa features automaticamente.",
    tags: ["GitHub", "CI/CD", "IA"],
    actions: ["Gerar código", "Code review", "Corrigir bugs", "Deploy automático"],
    integrations: ["GitHub API", "OpenAI", "Vercel", "Docker"],
    tier: "enterprise",
    price: 244700,
  },
  {
    icon: Shield,
    title: "Segurança & Compliance",
    desc: "Monitora vulnerabilidades, audita acessos e verifica compliance LGPD.",
    tags: ["LGPD", "Auditoria", "Segurança"],
    actions: ["Scan de vulnerabilidades", "Auditoria de acessos", "Relatório LGPD"],
    integrations: ["AWS Security", "Azure AD", "Slack"],
    tier: "enterprise",
    price: 239900,
  },
  {
    icon: Mic,
    title: "Assistente de Reuniões",
    desc: "Transcreve reuniões, gera atas, extrai action items e envia follow-ups.",
    tags: ["Zoom", "Meet", "Teams"],
    actions: ["Transcrever áudio", "Gerar atas", "Extrair tarefas"],
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
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  enterprise: "bg-primary/10 text-primary border-primary/20",
};

const tiers = ["all", "basic", "intermediate", "advanced", "enterprise"];

const LibraryPage = () => {
  const [filter, setFilter] = useState("all");

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
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
            <Bot className="h-3 w-3 mr-1" />
            {templates.length} agentes disponíveis
          </Badge>
          <h1 className="font-display text-3xl font-bold mb-2">Nossos Agentes</h1>
          <p className="text-muted-foreground">Contrate, personalize e ative em minutos. Nós cuidamos de tudo.</p>
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
                  : "border-white/10 hover:border-primary/30"
              }`}
            >
              {tier === "all" ? "Todos" : tierLabels[tier]}
            </Button>
          ))}
        </div>
      </motion.div>

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
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Enterprise badge glow */}
              {t.tier === "enterprise" && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
              )}
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    t.tier === "enterprise" 
                      ? "bg-gradient-to-br from-primary/30 to-purple-500/30 shadow-lg shadow-primary/20" 
                      : t.tier === "advanced"
                      ? "bg-gradient-to-br from-purple-500/20 to-primary/20"
                      : "bg-primary/10"
                  }`}>
                    <t.icon className={`h-7 w-7 ${
                      t.tier === "enterprise" ? "text-primary" : "text-primary"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg">{t.title}</h3>
                      {t.tier === "enterprise" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium animate-pulse">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>

              {/* Price & Tier */}
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/5 relative z-10">
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
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] text-muted-foreground border border-white/10 backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="mb-5 flex-1 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Capacidades
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {t.actions.slice(0, 4).map((a) => (
                    <span 
                      key={a} 
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-primary/5 text-primary/90 border border-primary/10"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Integrations preview */}
              <div className="mb-5 relative z-10">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-widest">
                  Integrações
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {t.integrations.slice(0, 3).map((integration, idx) => (
                      <div 
                        key={integration}
                        className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-muted-foreground"
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
              <Link to="/auth" className="relative z-10">
                <Button className={`w-full rounded-xl group h-12 font-semibold ${
                  t.tier === "enterprise" 
                    ? "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25" 
                    : "glow"
                }`}>
                  Contratar Agente
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;
