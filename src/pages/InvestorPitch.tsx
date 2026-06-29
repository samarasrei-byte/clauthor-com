import { motion } from "framer-motion";
import { ArrowRight, Zap, TrendingDown, Globe2, Users, Target, Rocket, Sparkles, ShieldCheck, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import ClauthorLogo from "@/components/ClauthorLogo";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const solutions = [
  { icon: Zap, title: "Eficiência Incomparável", desc: "Agentes de IA executam tarefas complexas 24/7 com precisão e velocidade superiores, eliminando gargalos." },
  { icon: TrendingDown, title: "Redução Drástica de Custos", desc: "Economia média de 88% em comparação com equipes humanas, sem encargos trabalhistas ou burocracia." },
  { icon: Globe2, title: "Escalabilidade Ilimitada", desc: "Lide com picos de demanda e expanda globalmente sem fricção. Squads de IA que se adaptam instantaneamente." },
];

const allocation = [
  { title: "Equity", desc: "Fortalecer a estrutura de capital, atrair talentos sênior e garantir sustentabilidade a longo prazo." },
  { title: "Influenciadores", desc: "Parcerias estratégicas com líderes de opinião para amplificar a mensagem em novos mercados." },
  { title: "Tráfego Pago", desc: "Campanhas agressivas de marketing digital para gerar leads qualificados em alta velocidade." },
];

const reasons = [
  { icon: TrendingDown, title: "Mercado Exponencial", desc: "A demanda por IA que entrega resultado, não ferramenta, está explodindo globalmente." },
  { icon: Sparkles, title: "Diferencial Insuperável", desc: "Squads de IA autônomos + máquina de prospecção G8 Prospect é uma combinação única." },
  { icon: Target, title: "Timing Perfeito", desc: "Lançamento capitalizando o pico de interesse global em automação com IA." },
  { icon: LineChart, title: "ROI Exponencial", desc: "Meta de 100K usuários em 24 meses projeta retorno significativo para investidores." },
  { icon: ShieldCheck, title: "Equipe Experiente", desc: "Liderança com décadas em tecnologia, IA e crescimento de negócios de alto impacto." },
  { icon: Rocket, title: "Tração Comprovada", desc: "Pipeline de clientes enterprise e demanda validada em múltiplos verticais." },
];

const InvestorPitch = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Clauthor — Invest in the Autonomous AI Workforce"
        description="Investor pitch: Clauthor builds autonomous AI departments scaling to 100K users in 24 months across BR, AR, EU and US."
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <ClauthorLogo size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <a href="#solucao" className="hover:text-primary transition-colors">Solução</a>
            <a href="#escala" className="hover:text-primary transition-colors">Escala</a>
            <a href="#investimento" className="hover:text-primary transition-colors">Investimento</a>
          </nav>
          <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="#contact">Fale Conosco</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.04] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Series Seed · 2026</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8"
          >
            A Revolução da<br />
            <span className="bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
              Força de Trabalho com IA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Departamentos de IA autônomos para escala global.
            Invista no futuro da produtividade empresarial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-base shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              <a href="#contact">Invista Agora <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-base border-border/60">
              <a href="#solucao">Ver a Solução</a>
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-24 grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-border/40"
          >
            {[
              { v: "225", l: "Agentes de IA" },
              { v: "20", l: "Departamentos" },
              { v: "88%", l: "Redução de Custo" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-3xl md:text-4xl font-bold text-foreground">{s.v}</div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-32 px-6">
        <motion.div {...fadeUp} className="max-w-4xl mx-auto text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">O Problema</div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
            Onde a Produtividade<br />Encontra Seus Limites?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            A força de trabalho tradicional enfrenta limites de escala, custo e consistência.
            Empresas gastam fortunas, mas continuam presas em gargalos e ineficiências.
            <span className="text-foreground"> Clauthor nasceu para resolver isso.</span>
          </p>
        </motion.div>
      </section>

      {/* Solution */}
      <section id="solucao" className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">A Solução</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Departamentos de IA Autônomos</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="group relative p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.3)]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unfair Advantage — G8 Prospect */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Vantagem Injusta</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">G8 Prospect</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nossa máquina proprietária de aquisição de clientes em escala industrial.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.ul {...fadeUp} className="space-y-6">
              {[
                { t: "Banco de Dados Exclusivo", d: "Acesso a 17 milhões de contatos qualificados de WhatsApp." },
                { t: "Campanhas Multicanais", d: "Prospecção e engajamento via WhatsApp e e-mail em escala massiva." },
                { t: "Validação Instantânea", d: "Teste ofertas e valide mercados em tempo recorde com feedback real." },
              ].map((item) => (
                <li key={item.t} className="flex gap-4 p-6 rounded-xl border border-border/60 bg-card/30">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{item.t}</h4>
                    <p className="text-sm text-muted-foreground">{item.d}</p>
                  </div>
                </li>
              ))}
            </motion.ul>

            <motion.div {...fadeUp} className="relative aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="relative text-center">
                <div className="text-7xl font-bold text-primary mb-2">17M</div>
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Contatos Qualificados</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scale Vision */}
      <section id="escala" className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">A Visão</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">100.000 Usuários em 24 Meses</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
              Meta ambiciosa e alcançável, impulsionada pela proposta de valor e pela máquina G8 Prospect.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { v: "100K+", l: "Usuários Ativos", icon: Users },
              { v: "24", l: "Meses", icon: Rocket },
              { v: "4+", l: "Mercados Globais", icon: Globe2 },
            ].map((m, i) => (
              <motion.div
                key={m.l}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="p-10 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all"
              >
                <m.icon className="h-6 w-6 text-primary mx-auto mb-6" />
                <div className="text-6xl md:text-7xl font-bold bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent mb-3">
                  {m.v}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{m.l}</div>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp} className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            🇧🇷 Brasil · 🇦🇷 Argentina · 🇪🇺 Europa · 🇺🇸 Estados Unidos
          </motion.p>
        </div>
      </section>

      {/* Capital Allocation */}
      <section id="investimento" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Destino do Capital</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Impulsionando o Crescimento</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Alocação estratégica para garantir crescimento exponencial e liderança consolidada.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {allocation.map((a, i) => (
              <motion.div
                key={a.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="relative p-10 rounded-2xl bg-gradient-to-br from-card/60 to-card/20 border border-border/60 hover:border-primary/40 transition-all overflow-hidden group"
              >
                <div className="absolute top-0 right-0 text-[120px] font-bold text-primary/5 leading-none -mt-4 -mr-2 group-hover:text-primary/10 transition-colors">
                  0{i + 1}
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold mb-4 text-primary">{a.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Por Que Agora</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Por Que Investir na Clauthor</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.1 }}
                className="p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all"
              >
                <r.icon className="h-6 w-6 text-primary mb-5" />
                <h3 className="text-lg font-bold mb-3">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Contato</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Pronto para Redefinir<br />o Futuro?
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Clauthor não é uma aposta no futuro da IA. É um investimento na redefinição da produtividade global.
            </p>
          </motion.div>

          <motion.form
            {...fadeUp}
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4 p-8 rounded-2xl bg-card/50 border border-border/60 backdrop-blur"
          >
            <Input placeholder="Seu Nome" className="h-12" />
            <Input type="email" placeholder="Seu E-mail Corporativo" className="h-12" />
            <Input placeholder="Empresa / Fundo de Investimento" className="h-12" />
            <Button type="submit" size="lg" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              Quero Investir <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <ClauthorLogo size="sm" />
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            © 2026 Clauthor · Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InvestorPitch;
