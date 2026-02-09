import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NeuralBackground from "@/components/NeuralBackground";
import {
  MessageSquare, TrendingUp, FileText, DollarSign,
  Calendar, Receipt, Star, ShoppingCart, Zap, ArrowRight,
  CheckCircle, Shield, Clock, BarChart3
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const agents = [
  { icon: MessageSquare, title: "Atendimento Omnichannel", desc: "WhatsApp, Instagram e Site. Atendimento 24/7 com triagem inteligente." },
  { icon: TrendingUp, title: "Prospecção & Vendas", desc: "Busca leads, envia mensagens, cria cadência e agenda reuniões." },
  { icon: FileText, title: "Conteúdo & Social Media", desc: "Criação de posts, roteiros, copy e agendamento automático." },
  { icon: DollarSign, title: "Cobrança & Financeiro", desc: "Lembretes, boletos, PIX, e-mails e follow-up automático." },
  { icon: Calendar, title: "Agenda & Agendamentos", desc: "Reserva horários, envia lembretes, reagenda e confirma." },
  { icon: Receipt, title: "Fiscal & Documentos", desc: "DARF, NFs, recibos, PDFs e relatórios inteligentes." },
  { icon: Star, title: "Reputação Online", desc: "Google e Reclame Aqui. Responde avaliações e reduz danos." },
  { icon: ShoppingCart, title: "E-commerce", desc: "Tracking, pós-venda, status de pedido e marketplaces." },
];

const features = [
  { icon: Zap, title: "Execução Autônoma", desc: "Agentes que completam processos inteiros sem intervenção humana." },
  { icon: Shield, title: "Segurança Total", desc: "Auditoria, logs e controle de permissões em cada ação." },
  { icon: Clock, title: "24/7 Operacional", desc: "Sua operação rodando sem parar, sem férias, sem faltas." },
  { icon: BarChart3, title: "Métricas em Tempo Real", desc: "Dashboard completo com economia, execuções e performance." },
];

const HomePage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <NeuralBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary neon-border">
                <Zap className="h-3 w-3" /> Plataforma de Agentes Autônomos
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
            >
              Funcionários Digitais.{" "}
              <span className="text-gradient">Agentes Autônomos</span>{" "}
              para sua Empresa.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Crie, treine e coloque para rodar agentes inteligentes que executam
              processos completos — atendimento, vendas, conteúdo, financeiro, agenda,
              fiscal, reputação e muito mais. Sua operação funcionando 24 horas por dia.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/create-agent">
                <Button size="lg" className="neon-glow font-semibold text-base px-8 h-12">
                  Criar meu primeiro agente — grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/library">
                <Button size="lg" variant="outline" className="font-semibold text-base px-8 h-12 neon-border">
                  Ver demonstração
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm text-muted-foreground uppercase tracking-widest mb-12"
          >
            Automação real. Resultados reais.
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10k+", label: "Agentes Criados" },
              { value: "2M+", label: "Ações Executadas" },
              { value: "98%", label: "Uptime" },
              { value: "500+", label: "Empresas" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-2"
              >
                <p className="text-3xl sm:text-4xl font-display font-bold text-gradient">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Você não contrata um software.{" "}
              <span className="text-gradient">Você contrata funcionários digitais.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Agentes que executam processos completos de ponta a ponta.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6 hover:neon-border transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:neon-glow transition-shadow">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENTS LIBRARY */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Biblioteca de{" "}
              <span className="text-gradient">Agentes Prontos</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sua operação rodando 24/7 com IA. Escolha, personalize e ative.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 hover:neon-border transition-all duration-300 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <agent.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1.5">{agent.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Usar template <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link to="/library">
              <Button variant="outline" className="neon-border">
                Ver todos os agentes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 neon-border"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Pronto para automatizar sua operação?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Comece gratuitamente. Sem cartão de crédito.
            </p>
            <Link to="/create-agent">
              <Button size="lg" className="neon-glow font-semibold text-base px-8 h-12">
                Criar meu primeiro agente — grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 AgentesBot. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
