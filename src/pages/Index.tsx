import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, Zap, ArrowRight,
  CheckCircle, Shield, Clock, BarChart3, Sparkles, Bot,
  Code
} from "lucide-react";
import { useRef } from "react";

const agents = [
  { icon: MessageSquare, title: "Atendimento Omnichannel", desc: "WhatsApp, Instagram e Site. Atendimento 24/7.", price: "R$ 1.899" },
  { icon: FileText, title: "Conteúdo & Social", desc: "Posts, roteiros e agendamento automático.", price: "R$ 1.779" },
  { icon: DollarSign, title: "Cobrança & Financeiro", desc: "PIX, boletos e follow-up automático.", price: "R$ 1.979" },
  { icon: Calendar, title: "Agenda", desc: "Reservas, lembretes e confirmações.", price: "R$ 1.799" },
  { icon: Receipt, title: "Fiscal & Documentos", desc: "NFs, DARF e relatórios inteligentes.", price: "R$ 2.199" },
  { icon: Star, title: "Reputação Online", desc: "Google e Reclame Aqui automatizados.", price: "R$ 1.879" },
  { icon: Code, title: "Desenvolvedor", desc: "Code review, PRs e deploy automático.", price: "R$ 2.447" },
  { icon: Shield, title: "Segurança & Compliance", desc: "LGPD, auditoria e vulnerabilidades.", price: "R$ 2.399" },
];

const features = [
  { icon: Zap, title: "Execução Autônoma", desc: "Processos inteiros sem intervenção humana" },
  { icon: Shield, title: "Segurança Enterprise", desc: "Auditoria completa e LGPD compliance" },
  { icon: Clock, title: "24/7 Operacional", desc: "Zero férias, zero faltas, zero erros" },
  { icon: BarChart3, title: "Analytics Real-Time", desc: "Métricas de economia e performance" },
];

const HomePage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-primary/3 blur-[120px] rounded-full" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <motion.div 
          style={{ opacity, scale }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className="px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5 text-primary gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Plataforma de Agentes Autônomos
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              Funcionários Digitais.
              <br />
              <span className="gradient-text">Agentes Autônomos</span>
              <br />
              para sua Empresa.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Crie, treine e opere agentes inteligentes que executam processos completos 
              — atendimento, vendas, financeiro, fiscal e muito mais. 
              <span className="text-foreground font-medium"> Sua operação 24/7.</span>
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="glow font-semibold text-base px-8 h-14 rounded-xl shine group"
                >
                  Começar agora — grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/library">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-semibold text-base px-8 h-14 rounded-xl border-white/10 hover:bg-white/5 hover:border-primary/30 transition-all"
                >
                  Explorar agentes
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-primary/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* AGENT SPOTLIGHT */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <p className="text-muted-foreground text-lg sm:text-xl mb-6 leading-relaxed">
            Não estamos substituindo seres humanos.
            <br />
            <span className="text-foreground font-medium">Estamos colocando máquinas para trabalhar por você.</span>
          </p>
          
          <div className="glass-card rounded-3xl p-8 md:p-12 gradient-border inline-block">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Conheça o agente mais avançado
              </p>
              <h3 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold gradient-text glow-text tracking-tight mb-3">
                PROMETHEUS
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Inteligência autônoma. Execução implacável.
                <br />
                <span className="text-primary font-medium">O fogo que move sua operação.</span>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground uppercase tracking-[0.2em] mb-16"
          >
            Automação real. Resultados reais.
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "847", label: "Agentes Ativos" },
              { value: "126k", label: "Ações/mês" },
              { value: "99.7%", label: "Uptime" },
              { value: "312", label: "Empresas" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl sm:text-5xl font-display font-bold gradient-text glow-text mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-6 border-primary/20 text-primary">
              Por que AgentesBot?
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Você não contrata software.
              <br />
              <span className="gradient-text">Você contrata funcionários digitais.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 glass-hover group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS LIBRARY */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-6 border-primary/20 text-primary">
              <Bot className="h-3 w-3 mr-1" />
              Biblioteca de Templates
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Agentes <span className="gradient-text">prontos para usar</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Escolha, personalize e ative em minutos. 
              De R$ 1.779 a R$ 2.447/mês dependendo da complexidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to="/library" className="block">
                  <div className="glass-card rounded-xl p-5 glass-hover h-full group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <agent.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-primary">{agent.price}/mês</span>
                    </div>
                    <h3 className="font-display font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">
                      {agent.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/library">
              <Button variant="outline" size="lg" className="rounded-xl border-white/10 hover:border-primary/30 group">
                Ver todos os agentes
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-card rounded-3xl p-12 md:p-16 gradient-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Pronto para escalar?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Comece gratuitamente. Sem cartão de crédito. Configure em 5 minutos.
              </p>
              <Link to="/auth">
                <Button size="lg" className="glow font-semibold text-base px-10 h-14 rounded-xl shine group">
                  Criar minha conta
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-lg">AGENTESBOT</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="link-underline hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="link-underline hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="link-underline hover:text-foreground transition-colors">Contato</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 AgentesBot
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
