import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, Zap, ArrowRight,
  Shield, Clock, BarChart3, Sparkles, Bot,
  Code, Users, Mail, Briefcase, Search, TrendingUp,
  Play, ChevronRight, Cpu, Globe, Lock
} from "lucide-react";
import { useRef } from "react";

const agents = [
  { icon: MessageSquare, title: "Atendimento Omnichannel", desc: "WhatsApp, Instagram e Site. Atendimento 24/7.", price: "R$ 1.899", hot: true },
  { icon: DollarSign, title: "Cobrança & Financeiro", desc: "PIX, boletos e follow-up automático.", price: "R$ 1.979", hot: true },
  { icon: Code, title: "Desenvolvedor Autônomo", desc: "Code review, PRs e deploy automático.", price: "R$ 2.447", hot: true },
  { icon: Users, title: "SDR & Prospecção", desc: "Qualificação de leads e agendamento de calls.", price: "R$ 2.297", hot: true },
  { icon: Briefcase, title: "RH & Recrutamento", desc: "Triagem de CVs, agendamento e onboarding.", price: "R$ 2.097", hot: false },
  { icon: Shield, title: "Segurança & LGPD", desc: "Compliance, auditoria e vulnerabilidades.", price: "R$ 2.399", hot: false },
];

const features = [
  { icon: Zap, title: "Execução Autônoma", desc: "Processos inteiros sem intervenção humana", stat: "100%" },
  { icon: Shield, title: "Segurança Enterprise", desc: "Auditoria completa e LGPD compliance", stat: "256bit" },
  { icon: Clock, title: "24/7 Operacional", desc: "Zero férias, zero faltas, zero erros", stat: "∞" },
  { icon: BarChart3, title: "Analytics Real-Time", desc: "Métricas de economia e performance", stat: "Live" },
];

// Lightweight background - no blur, simple gradients
const StaticBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full opacity-50" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full opacity-50" />
    <div className="grid-pattern absolute inset-0 opacity-10" />
  </div>
);

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(heroProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, 150]);

  return (
    <div className="relative">
      <StaticBackground />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Badge 
                variant="outline" 
                className="px-5 py-2.5 text-sm font-medium border-primary/40 bg-primary/10 text-primary gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Plataforma de Agentes Autônomos #1 do Brasil
              </Badge>
            </motion.div>

            {/* Main Title with Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
            >
              <span className="block mb-2">Funcionários</span>
              <span className="block gradient-text">
                Digitais
              </span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl text-muted-foreground font-normal mt-4">
                que trabalham por você
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Nós criamos, treinamos e operamos agentes de IA personalizados para sua empresa.
              <span className="text-foreground font-semibold"> Você só acompanha os resultados.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            >
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="glow font-semibold text-base px-10 h-16 rounded-2xl group text-lg"
                >
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="font-semibold text-base px-10 h-16 rounded-2xl border-white/10 hover:bg-white/5 hover:border-primary/40 transition-all text-lg group"
              >
                <Globe className="h-5 w-5 mr-2" />
                Ver Demonstração
                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="flex flex-wrap items-center justify-center gap-6 pt-8 text-muted-foreground text-sm"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>Dados criptografados</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>LGPD Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>IA de última geração</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-8 h-14 rounded-full border-2 border-white/20 flex items-start justify-center p-2.5"
          >
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-sm text-muted-foreground uppercase tracking-[0.3em] mb-4">
              Resultados que falam por si
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "847", label: "Agentes Ativos", icon: Bot },
              { value: "126k", label: "Ações por mês", icon: Zap },
              { value: "99.7%", label: "Taxa de Sucesso", icon: TrendingUp },
              { value: "312", label: "Empresas Atendidas", icon: Users },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="glass-card rounded-3xl p-8 text-center glass-hover group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMETHEUS SPOTLIGHT */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto text-center relative"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed"
          >
            Não viemos substituir pessoas.
            <br />
            <span className="text-foreground font-semibold">Viemos trabalhar ao lado dos seus melhores talentos.</span>
          </motion.p>
          
          <div className="glass-card rounded-[2rem] p-10 md:p-16 gradient-border relative overflow-hidden">
            {/* Static glow instead of animated */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full opacity-30" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-10"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-primary mb-6">
                Conheça nosso agente mais avançado
              </p>
              <h3 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold gradient-text tracking-tight mb-6">
                PROMETHEUS
              </h3>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Inteligência autônoma. Execução implacável.
                <br />
                <span className="text-primary font-semibold text-xl">O fogo que move sua operação.</span>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-2">
              Por que escolher AgentesBot?
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Você não contrata software.
              <br />
              <span className="gradient-text">Você contrata funcionários digitais.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <div className="glass-card rounded-2xl p-8 glass-hover group h-full relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <span className="text-2xl font-display font-bold text-primary/30">{f.stat}</span>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS SHOWCASE */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              Nossos Agentes
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Agentes <span className="gradient-text">prontos para trabalhar</span>
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Nós criamos e configuramos cada agente para sua necessidade específica. 
              Você só precisa contratar.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <Link to="/library" className="block h-full">
                  <div className="glass-card rounded-2xl p-8 glass-hover h-full group cursor-pointer relative overflow-hidden">
                    {agent.hot && (
                      <div className="absolute top-4 right-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center mb-6 group-hover:from-primary/35 group-hover:to-primary/15 transition-all duration-300">
                      <agent.icon className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="font-display font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                      {agent.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{agent.desc}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <span className="text-2xl font-display font-bold gradient-text">{agent.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link to="/library">
              <Button variant="outline" size="lg" className="rounded-2xl border-white/10 hover:border-primary/40 group text-lg px-10 h-14">
                Ver todos os agentes
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-40 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="glass-card rounded-[2rem] p-12 md:p-20 gradient-border relative overflow-hidden">
              {/* Static glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-10">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Pronto para <span className="gradient-text">escalar?</span>
                </h2>
                <p className="text-muted-foreground text-xl mb-10 max-w-lg mx-auto">
                  Comece gratuitamente. Sem cartão de crédito. 
                  Configure em 5 minutos.
                </p>
                
                <Link to="/auth">
                  <Button size="lg" className="glow font-semibold text-lg px-12 h-16 rounded-2xl group">
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Criar minha conta grátis
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl">AGENTESBOT</span>
            </div>
            <div className="flex gap-10 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Termos</a>
              <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
              <a href="#" className="hover:text-primary transition-colors">Contato</a>
              <a href="#" className="hover:text-primary transition-colors">Blog</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 AgentesBot. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
