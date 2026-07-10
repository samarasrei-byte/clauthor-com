import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Users, Layers3, ArrowRight, CheckCircle2, Zap, ShoppingCart, Building2, Target, Clock, DollarSign, Shield, Workflow, Star, HelpCircle, ChevronRight } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { useTranslation } from "react-i18next";
import { formatPrice, getRegion } from "@/lib/pricing";

const HowItWorks = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "pt";
  const region = getRegion(lang);

  const options = [
    {
      id: "agent",
      icon: Bot,
      title: "Agente Individual",
      subtitle: "1 especialista em IA para uma tarefa específica",
      price: `A partir de ${formatPrice(497, lang)}/mês`,
      bestFor: "Resolver um problema pontual",
      example: "\"Preciso de um SDR para prospectar no LinkedIn\"",
      features: [
        "Foco em uma única função",
        "Configuração rápida (5 min)",
        "Ideal para testar a plataforma",
        "Escale adicionando mais agentes",
      ],
      cta: "Explorar Agentes",
      href: "/marketplace",
      gradient: "from-accent-violet/20 to-accent-violet/5",
      border: "border-accent-violet/20 hover:border-accent-violet/40",
      iconBg: "bg-accent-violet/15",
      iconColor: "text-accent-violet",
      badge: null,
    },
    {
      id: "department",
      icon: Building2,
      title: "Departamento Pronto",
      subtitle: "Time completo pré-configurado para um setor",
      price: `A partir de ${formatPrice(2997, lang)}/mês`,
      bestFor: "Substituir ou reforçar um departamento inteiro",
      example: "\"Quero um time de vendas completo operando amanhã\"",
      features: [
        "3-8 agentes que trabalham juntos",
        "Já configurados para colaborar",
        "Economia de até 95% vs CLT",
        "Operação 24/7 imediata",
      ],
      cta: "Ver Departamentos",
      href: "/departamentos",
      gradient: "from-primary/20 to-primary/5",
      border: "border-primary/20 hover:border-primary/40",
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      badge: "Mais Popular",
    },
    {
      id: "team",
      icon: Layers3,
      title: "Time Personalizado",
      subtitle: "Monte sua equipe ideal escolhendo cada agente",
      price: "Preço sob medida",
      bestFor: "Máxima flexibilidade e controle",
      example: "\"Preciso de 2 SDRs + 1 closer + 1 suporte\"",
      features: [
        "Escolha agente por agente",
        "Mix de departamentos diferentes",
        "Visualize o custo em tempo real",
        "Perfeito para necessidades únicas",
      ],
      cta: "Montar Meu Time",
      href: "/team-builder",
      gradient: "from-accent-emerald/20 to-accent-emerald/5",
      border: "border-accent-emerald/20 hover:border-accent-emerald/40",
      iconBg: "bg-accent-emerald/15",
      iconColor: "text-accent-emerald",
      badge: "Novo",
    },
  ];

  const comparisonRows = [
    { label: "Tempo de setup", agent: "5 min", dept: "10 min", team: "15 min" },
    { label: "Nº de agentes", agent: "1", dept: "3-8", team: "Você escolhe" },
    { label: "Pré-configurado", agent: "✓", dept: "✓✓✓", team: "-" },
    { label: "Colaboração entre agentes", agent: "-", dept: "✓", team: "✓" },
    { label: "Flexibilidade", agent: "Média", dept: "Baixa", team: "Máxima" },
    { label: "Melhor para", agent: "Testar / pontual", dept: "Escalar rápido", team: "Sob medida" },
  ];

  const journeys = [
    { persona: "Startup early-stage", need: "Preciso validar outbound rápido", rec: "agent", recLabel: "1 SDR Outbound", icon: Target },
    { persona: "PME com 20-50 funcionários", need: "Quero digitalizar o comercial", rec: "department", recLabel: "Dept. Vendas", icon: Building2 },
    { persona: "Scale-up / Enterprise", need: "Quero montar um time sob medida", rec: "team", recLabel: "Time Personalizado", icon: Layers3 },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <SEO title="How It Works — Clauthor AI Workforce" description="See how Clauthor turns business goals into autonomous AI agents that execute, learn and report — without code." path="/how-it-works" />
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <HelpCircle className="h-4 w-4 mr-2" />
            Guia de Contratação
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Qual é a melhor opção <span className="gradient-text">para você?</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Agente, Departamento ou Time - entenda a diferença e escolha com confiança.
          </p>
        </motion.div>

        {/* 3 Option Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {options.map((opt, i) => (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-card rounded-2xl p-6 border ${opt.border} transition-all duration-300 flex flex-col`}
            >
              {opt.badge && (
                <div className="absolute -top-3 left-6">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {opt.badge}
                  </Badge>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl ${opt.iconBg} flex items-center justify-center mb-4`}>
                <opt.icon className={`h-7 w-7 ${opt.iconColor}`} />
              </div>

              <h2 className="font-display font-bold text-xl mb-1">{opt.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{opt.subtitle}</p>

              <div className="rounded-xl bg-background/50 border border-border/10 p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Melhor para:</p>
                <p className="text-sm font-medium">{opt.bestFor}</p>
              </div>

              <p className="text-xs italic text-muted-foreground/80 mb-4">{opt.example}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {opt.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-4">
                <p className="text-lg font-display font-bold">{opt.price}</p>
              </div>

              <Link to={opt.href}>
                <Button className={`w-full gap-2 ${opt.id === "department" ? "glow" : ""}`} variant={opt.id === "department" ? "default" : "outline"}>
                  {opt.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <h2 className="font-display text-3xl font-bold text-center mb-8">
            Comparação <span className="gradient-text">lado a lado</span>
          </h2>
          <div className="glass-card rounded-2xl overflow-hidden border border-border/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/10">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground w-[200px]" />
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Bot className="h-5 w-5 text-accent-violet" />
                        <span className="text-sm font-bold">Agente</span>
                      </div>
                    </th>
                    <th className="p-4 text-center bg-primary/[0.03]">
                      <div className="flex flex-col items-center gap-1">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-bold">Departamento</span>
                        <Badge className="text-[9px] bg-primary/10 text-primary border-0">Popular</Badge>
                      </div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Layers3 className="h-5 w-5 text-accent-emerald" />
                        <span className="text-sm font-bold">Time</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/5 last:border-0">
                      <td className="p-4 text-sm font-medium">{row.label}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{row.agent}</td>
                      <td className="p-4 text-center text-sm bg-primary/[0.03] font-medium">{row.dept}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{row.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Journey Recommender */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <h2 className="font-display text-3xl font-bold text-center mb-3">
            Não sabe qual <span className="gradient-text">escolher?</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8">Encontre a opção ideal para o seu momento.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {journeys.map((j, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 glass-hover group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <j.icon className="h-5 w-5 text-primary/80" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-1">{j.persona}</p>
                <p className="text-sm font-medium mb-3">"{j.need}"</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{j.recLabel}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card rounded-2xl p-12 text-center gradient-border relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Escolha a opção que faz mais sentido para o seu negócio e comece em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/departamentos">
                <Button size="lg" className="glow rounded-xl px-8 h-12 font-semibold gap-2">
                  <Building2 className="h-5 w-5" />
                  Ver Departamentos
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 border-border hover:border-primary/20 gap-2">
                  <Bot className="h-5 w-5" />
                  Explorar Agentes
                </Button>
              </Link>
              <Link to="/team-builder">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 border-border hover:border-accent-emerald/20 gap-2">
                  <Layers3 className="h-5 w-5" />
                  Montar Time
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;
