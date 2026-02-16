import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, Zap, ArrowRight,
  Shield, Clock, BarChart3, Sparkles, Bot,
  Code, Users, Mail, Briefcase, Search, TrendingUp,
  Play, ChevronRight, Cpu, Globe, Lock,
  Target, Layers, Eye, CheckCircle2, XCircle, Network
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

// Futuristic grid background
const FuturisticBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Dot grid pattern */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `radial-gradient(circle, hsl(0 65% 48%) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    />
    {/* Top ambient glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/[0.04] to-transparent rounded-full blur-[120px]" />
    {/* Bottom ambient */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-primary/[0.02] to-transparent rounded-full blur-[100px]" />
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
      <FuturisticBackground />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 scan-line pointer-events-none" />
        
        {/* Horizontal line accents */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/5 to-transparent" />

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
                className="px-5 py-2.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary gap-2 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4" />
                Plataforma de Agentes Autônomos #1 do Brasil
              </Badge>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold leading-[0.95] tracking-tight"
            >
              <span className="block mb-2 text-foreground">Funcionários</span>
              <span className="block gradient-text">
                de IA
              </span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl text-muted-foreground/70 font-normal mt-4">
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
              <span className="text-foreground/90 font-semibold"> Você só acompanha os resultados.</span>
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
                  className="glow font-semibold text-base px-10 h-14 rounded-xl group text-lg"
                >
                  <Play className="h-5 w-5 mr-2 fill-current" />
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="font-semibold text-base px-10 h-14 rounded-xl border-border hover:border-primary/20 hover:bg-primary/[0.03] transition-all text-lg group"
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
              className="flex flex-wrap items-center justify-center gap-8 pt-10 text-muted-foreground text-sm"
            >
              {[
                { icon: Lock, label: "Dados criptografados" },
                { icon: Shield, label: "LGPD Compliant" },
                { icon: Cpu, label: "IA de última geração" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 opacity-60">
                  <item.icon className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs tracking-wide">{item.label}</span>
                </div>
              ))}
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
            className="w-7 h-12 rounded-full border border-border flex items-start justify-center p-2"
          >
            <div className="w-1 h-2.5 bg-primary/50 rounded-full" />
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
            <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
              Resultados que falam por si
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="glass-card rounded-2xl p-8 text-center glass-hover group">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                    <stat.icon className="h-6 w-6 text-primary/80" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground tracking-wide">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMETHEUS SPOTLIGHT */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />
        
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
            <span className="text-foreground/90 font-semibold">Viemos trabalhar ao lado dos seus melhores talentos.</span>
          </motion.p>
          
          <div className="glass-card rounded-[2rem] p-10 md:p-16 gradient-border relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full opacity-20 blur-[80px]" />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative z-10"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-primary/80 mb-6">
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

      {/* ABOUT APEXBOT */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
        
        <div className="max-w-6xl mx-auto relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2 backdrop-blur-sm">
              <Target className="h-4 w-4 mr-2" />
              O que é o ApexBot?
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              O agente que <span className="gradient-text">governa outros agentes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              O ApexBot não é um chatbot comum. Ele não existe para responder perguntas ou simular conversas.
              <span className="text-foreground/80 font-semibold block mt-2">
                É um agente de decisão e orquestração no nível mais alto da automação.
              </span>
            </p>
          </motion.div>

          {/* Core Concept Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-10 relative overflow-hidden glass-hover"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
              <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-6">
                <Layers className="h-7 w-7 text-primary/80" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Camada Superior de Controle</h3>
              <p className="text-muted-foreground leading-relaxed">
                Enquanto bots tradicionais executam tarefas isoladas, o ApexBot atua como uma camada superior, 
                responsável por coordenar agentes, priorizar ações e garantir que o sistema trabalhe de forma 
                consistente, segura e eficiente.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-10 relative overflow-hidden glass-hover"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-glow/5 to-transparent rounded-bl-full" />
              <div className="w-14 h-14 rounded-xl bg-primary-glow/5 flex items-center justify-center mb-6">
                <Network className="h-7 w-7 text-primary-glow/80" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Nível Executivo da Automação</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ele define objetivos, distribui tarefas, monitora resultados e ajusta rotas automaticamente. 
                Seu papel não é executar microações, mas tomar decisões operacionais e manter o fluxo 
                funcionando corretamente.
              </p>
            </motion.div>
          </div>

          {/* Why "Apex" */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-12 md:p-16 text-center mb-20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-primary-glow/[0.02]" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.4em] text-primary/70 mb-4">Por que "APEX"?</p>
              <h3 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                A palavra <span className="gradient-text">Apex</span> significa ápice ou ponto mais alto
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                {[
                  { icon: Target, text: "Topo da hierarquia" },
                  { icon: Eye, text: "Supervisiona processos" },
                  { icon: Layers, text: "Coordena automações" },
                  { icon: Cpu, text: "Camada de decisão" },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center gap-3 p-4"
                  >
                    <div className="w-11 h-11 rounded-lg bg-primary/5 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary/70" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h3 className="font-display text-3xl font-bold text-center mb-12">
              Como o <span className="gradient-text">ApexBot</span> funciona
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { icon: Target, title: "Define prioridades", desc: "Estabelece o que importa" },
                { icon: Users, title: "Distribui tarefas", desc: "Entre agentes especializados" },
                { icon: BarChart3, title: "Acompanha resultados", desc: "Desempenho em tempo real" },
                { icon: Zap, title: "Ajusta estratégias", desc: "Automaticamente" },
                { icon: Shield, title: "Interrompe riscos", desc: "Identifica inconsistências" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-xl p-6 text-center glass-hover group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-5 w-5 text-primary/70" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What ApexBot is NOT */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-10"
            >
              <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-destructive/70" />
                O que o ApexBot NÃO é
              </h3>
              <ul className="space-y-4">
                {[
                  "Não é um chatbot de atendimento",
                  "Não é uma automação simples",
                  "Não funciona por respostas prontas",
                  "Não depende de interação constante",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive/40" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-6">
                Ele opera como uma <span className="text-foreground/80 font-semibold">infraestrutura invisível</span>, focada em execução real.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-10"
            >
              <h3 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary/80" />
                Para quem o ApexBot existe
              </h3>
              <ul className="space-y-4">
                {[
                  "Empresas que usam múltiplos agentes",
                  "Operações que exigem controle e decisão",
                  "Fluxos complexos que não podem falhar",
                  "Times que precisam escalar com governança",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-6">
                Perfeito para quem precisa de <span className="text-foreground/80 font-semibold">escala sem perder controle</span>.
              </p>
            </motion.div>
          </div>

          {/* Summary Quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-block glass-card rounded-2xl px-12 py-8 gradient-border">
              <p className="font-display text-2xl sm:text-3xl font-bold mb-2">
                O ApexBot transforma automação em <span className="gradient-text">operação real</span>.
              </p>
              <p className="text-muted-foreground text-lg">
                Não é sobre conversar com IA. É sobre <span className="text-foreground/80 font-semibold">executar, decidir e controlar</span>.
              </p>
            </div>
          </motion.div>
        </div>
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
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              Por que escolher ApexBot?
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Você não contrata software.
              <br />
              <span className="gradient-text">Você contrata funcionários de IA.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <span className="text-2xl font-display font-bold text-primary/15">{f.stat}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                    <f.icon className="h-6 w-6 text-primary/70" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
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
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              Nossos Agentes
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Agentes <span className="gradient-text">prontos para trabalhar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nós criamos e configuramos cada agente para sua necessidade específica. 
              Você só precisa contratar.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary/80 border border-primary/15">
                          <TrendingUp className="h-3 w-3" />
                          Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-all duration-300">
                      <agent.icon className="h-7 w-7 text-primary/70" />
                    </div>
                    
                    <h3 className="font-display font-bold text-lg mb-3 group-hover:text-primary/90 transition-colors">
                      {agent.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm mb-6">{agent.desc}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <span className="text-xl font-display font-bold gradient-text">{agent.price}</span>
                      <span className="text-xs text-muted-foreground">/mês</span>
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
              <Button variant="outline" size="lg" className="rounded-xl border-border hover:border-primary/20 group text-base px-10 h-12">
                Ver todos os agentes
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-40 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] via-primary/[0.02] to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="glass-card rounded-[2rem] p-12 md:p-20 gradient-border relative overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-10">
                  <Sparkles className="h-8 w-8 text-primary/70" />
                </div>
                
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Pronto para <span className="gradient-text">escalar?</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
                  Comece gratuitamente. Sem cartão de crédito. 
                  Configure em 5 minutos.
                </p>
                
                <Link to="/auth">
                  <Button size="lg" className="glow font-semibold text-base px-12 h-14 rounded-xl group">
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
      <footer className="border-t border-border py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 text-primary/70" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">ApexBot</span>
            </div>
            <div className="flex gap-10 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground/80 transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">Contato</a>
              <a href="#" className="hover:text-foreground/80 transition-colors">Blog</a>
            </div>
          </div>

          {/* Security & Payment Badges */}
          <div className="flex flex-col items-center gap-6 pt-8 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Segurança e pagamentos verificados</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Shield, label: "SSL 256-bit", color: "text-primary/60" },
                { icon: Lock, label: "LGPD Compliant", color: "text-primary/60" },
                { icon: Shield, label: "SOC 2 Type II", color: "text-emerald-500/60" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                  <span className="text-[11px] font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Visa / Mastercard", "PIX", "Bitcoin", "Ethereum", "USDC"].map((method) => (
                <div key={method} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <span className="text-[11px] font-medium text-muted-foreground">{method}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-6">
            <p className="text-xs text-muted-foreground">
              © 2026 ApexBot. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
