import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, Layers, Zap, Shield, Bot, ArrowRight, 
  CheckCircle2, Settings, Play, BarChart3,
  Network, Eye, Cpu, Users, Clock, TrendingUp
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Escolha seu Agente",
    description: "Navegue pela biblioteca e selecione o agente ideal para sua necessidade. Cada um faz o trabalho de 20 funcionários CLT.",
    icon: Bot,
    stat: "10+ agentes",
  },
  {
    number: "02",
    title: "Configure as Integrações",
    description: "Conecte suas ferramentas: WhatsApp, CRM, ERP, planilhas. O agente se adapta ao seu ecossistema existente.",
    icon: Settings,
    stat: "50+ integrações",
  },
  {
    number: "03",
    title: "Ative e Monitore",
    description: "Com um clique, seu agente começa a trabalhar 24/7. Acompanhe métricas, logs e resultados em tempo real no seu painel.",
    icon: Play,
    stat: "Em minutos",
  },
  {
    number: "04",
    title: "Escale sua Operação",
    description: "Adicione mais agentes conforme cresce. O ApexBot coordena todos automaticamente, garantindo eficiência máxima.",
    icon: BarChart3,
    stat: "Sem limites",
  },
];

const features = [
  {
    icon: Target,
    title: "Decisão Inteligente",
    description: "Analisa contexto, prioriza tarefas e toma decisões operacionais sem intervenção humana.",
  },
  {
    icon: Layers,
    title: "Orquestração de Agentes",
    description: "Coordena múltiplos agentes especializados, distribuindo tarefas e garantindo fluxos consistentes.",
  },
  {
    icon: Network,
    title: "Integração Universal",
    description: "Conecta-se a qualquer API, CRM, ERP ou sistema legado. Flexibilidade total para seu stack.",
  },
  {
    icon: Eye,
    title: "Monitoramento Total",
    description: "Dashboards em tempo real, logs detalhados e alertas automáticos para máxima visibilidade.",
  },
  {
    icon: Shield,
    title: "Segurança Enterprise",
    description: "Criptografia end-to-end, LGPD compliance, auditoria completa e controle de acesso granular.",
  },
  {
    icon: Cpu,
    title: "IA de Última Geração",
    description: "Modelos de linguagem avançados, aprendizado contínuo e adaptação ao contexto do seu negócio.",
  },
];

const impactNumbers = [
  { icon: Users, value: "20x", label: "Produtividade por agente", desc: "Cada agente substitui 20 funcionários" },
  { icon: Clock, value: "24/7", label: "Operação contínua", desc: "Zero faltas, zero férias, zero pausas" },
  { icon: TrendingUp, value: "80%", label: "Economia média", desc: "Comparado ao custo CLT equivalente" },
  { icon: Zap, value: "<1s", label: "Tempo de resposta", desc: "Execução instantânea de tarefas" },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(0 65% 48%) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/[0.03] to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            Como Funciona
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Automação que <span className="gradient-text">realmente funciona</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Em 4 passos simples, você transforma sua operação com funcionários digitais 
            que trabalham 24/7 sem erros.
          </p>
        </motion.div>

        {/* Impact Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {impactNumbers.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center glass-hover group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-5 w-5 text-primary/80" />
              </div>
              <p className="text-3xl font-display font-bold gradient-text mb-1">{item.value}</p>
              <p className="text-xs font-semibold mb-1">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Steps */}
        <div className="relative mb-32">
          {/* Connection line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden md:block" />
          
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative md:grid md:grid-cols-2 md:gap-12 ${
                  i % 2 === 0 ? "" : "md:direction-rtl"
                }`}
              >
                <div className={`${i % 2 === 0 ? "md:text-right" : "md:text-left md:col-start-2"}`}>
                  <div className="glass-card rounded-2xl p-8 glass-hover relative overflow-hidden">
                    {/* Stat badge */}
                    <div className="absolute top-4 right-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/5 text-primary/60 border border-primary/10">
                        {step.stat}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <span className="text-primary font-display font-bold text-sm">{step.number}</span>
                        <h3 className="font-display font-bold text-xl">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
                
                {/* Center dot */}
                <div className="absolute left-8 md:left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full bg-primary hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
            O que faz o <span className="gradient-text">ApexBot único</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-6 glass-hover group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/3 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-12 text-center gradient-border relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Crie sua conta gratuita e comece a automatizar sua operação em minutos. 
              Seu painel já estará pronto para gerenciar seus agentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="glow rounded-xl px-8 h-12 font-semibold">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/library">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 border-border hover:border-primary/20">
                  Ver Agentes
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