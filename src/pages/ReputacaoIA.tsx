/**
 * /reputacao-ia · landing page premium do SaaS Reputação IA.
 * Identidade visual Clauthor: fundo dark (--background), accent vermelho
 * via tokens semânticos (--primary), tipografia herdada do design system
 * (Space Grotesk display + Inter body definidos em index.html/tailwind).
 * Puramente frontend — sem lógica de negócio.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield, Star, Zap, TrendingUp, Heart, MessageSquare, AlertTriangle,
  BarChart3, Clock, CheckCircle2, ArrowRight, Sparkles, Users, Bell,
  ThumbsUp, Instagram, Facebook, Linkedin, Globe, Search, Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const PrimaryCTA = ({ label = "Contratar Reputação IA" }: { label?: string }) => (
  <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
    <Button size="lg" className="gap-2 h-12 px-7 rounded-full font-medium glow">
      <Shield className="h-4 w-4" strokeWidth={2} />
      {label}
    </Button>
  </a>
);

const SecondaryCTA = ({ label = "Solicitar Demonstração" }: { label?: string }) => (
  <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
    <Button size="lg" variant="outline" className="gap-2 h-12 px-7 rounded-full border-border text-foreground hover:bg-card/60 font-medium">
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  </a>
);

const ReputacaoIA = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <SEO
        title="Reputação IA · Gestão de reputação online com Inteligência Artificial | Clauthor"
        description="A Reputação IA da Clauthor monitora e responde automaticamente avaliações no Google Meu Negócio, Reclame Aqui, Instagram, Facebook e LinkedIn — proteja sua marca 24h por dia."
        path="/reputacao-ia"
      />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 px-5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(var(--primary)/0.18),transparent_70%)]" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary mb-6">
              <Shield className="h-3.5 w-3.5" />
              IA para Gestão de Reputação
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              O primeiro colaborador de IA que{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                toda empresa deveria contratar.
              </span>
            </h1>
            <p className="text-lg text-foreground/90 leading-relaxed max-w-xl mb-4">
              <strong>Proteja sua marca 24 horas por dia.</strong>
            </p>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl mb-8">
              A Reputação IA monitora, responde e gerencia automaticamente tudo o que falam sobre sua empresa
              na internet, mantendo sua imagem profissional e ajudando você a conquistar mais clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <PrimaryCTA />
              <SecondaryCTA />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Configuração rápida</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem equipe técnica</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> IA trabalhando na hora</div>
            </div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-gradient-to-br from-primary/25 via-transparent to-transparent blur-3xl -z-10" />
            <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card/80 backdrop-blur-xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.4)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Reputação IA · Ao vivo</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Painel</span>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-5">
                {[
                  { label: "Google", icon: Globe },
                  { label: "R.Aqui", icon: AlertTriangle },
                  { label: "Insta", icon: Instagram },
                  { label: "Face", icon: Facebook },
                  { label: "LinkedIn", icon: Linkedin },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-background/60 border border-border/70 px-2 py-3">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 mb-5">
                {[
                  { name: "Maria S.", stars: 5, text: "Atendimento incrível, super recomendo!", status: "respondida", ago: "há 2min" },
                  { name: "João P.", stars: 2, text: "Demorou pra responder minha dúvida...", status: "IA respondendo", ago: "agora" },
                  { name: "Ana R.", stars: 5, text: "Melhor serviço da região.", status: "respondida", ago: "há 5min" },
                ].map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/60"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-[11px] font-semibold shrink-0">
                      {r.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-foreground">{r.name}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <Star key={k} className={`h-2.5 w-2.5 ${k < r.stars ? "fill-primary text-primary" : "text-border"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-auto">{r.ago}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug truncate">{r.text}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary font-medium">
                        <CheckCircle2 className="h-3 w-3" /> {r.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Reputação</div>
                  <div className="text-lg font-semibold text-foreground flex items-center gap-1">4.8 <TrendingUp className="h-3.5 w-3.5 text-primary" /></div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Respondidas</div>
                  <div className="text-lg font-semibold text-foreground">2.184</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Tempo médio</div>
                  <div className="text-lg font-semibold text-primary">3 min</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ============ PROVA SOCIAL ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <motion.h2 {...fadeUp} className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-14">
            Empresas que cuidam da reputação{" "}
            <span className="text-primary">vendem mais.</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Star, title: "Avaliações respondidas", desc: "Automaticamente e no tom certo" },
              { icon: Zap, title: "Tempo de resposta", desc: "De horas para minutos" },
              { icon: TrendingUp, title: "Confiança da marca", desc: "Mais reviews positivos" },
              { icon: Heart, title: "Clientes satisfeitos", desc: "Fidelização e recompra" },
            ].map((c) => (
              <motion.div key={c.title} {...fadeUp}>
                <Card className="p-6 h-full rounded-2xl border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-all">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <c.icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.12] via-primary/[0.06] to-transparent p-8 sm:p-10 text-center">
            <p className="text-lg sm:text-xl text-foreground font-medium max-w-2xl mx-auto">
              Monitore sua reputação <strong className="text-primary">24 horas por dia</strong> com Inteligência Artificial.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ O QUE A REPUTAÇÃO IA FAZ ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">O que a Reputação IA faz?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Uma equipe de IA especializada em cada canal onde sua marca é mencionada.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Star, title: "Google Meu Negócio",
                items: ["Responde avaliações automaticamente", "Agradece avaliações positivas", "Responde negativas com inteligência", "Identifica clientes insatisfeitos", "Sugere ações para melhorar sua nota"],
              },
              {
                icon: AlertTriangle, title: "Reclame Aqui",
                items: ["Responde reclamações automaticamente", "Classifica urgência", "Encaminha casos críticos", "Sugere soluções", "Acompanha até a resolução"],
              },
              {
                icon: MessageSquare, title: "Redes Sociais",
                items: ["Instagram, Facebook e LinkedIn", "Mensagens privadas", "Comentários públicos", "Detecta ofensas e ameaças", "Detecta crises de imagem"],
              },
              {
                icon: ThumbsUp, title: "Marketplaces & Avaliações",
                items: ["Google, Facebook, iFood", "Mercado Livre, Amazon, Shopee", "Booking, Airbnb", "Todas centralizadas em um painel", "Respostas contextualizadas"],
              },
              {
                icon: Radar, title: "Gestão de Crises",
                items: ["Detecta comentários negativos em tempo real", "Alerta imediatamente sua equipe", "Sugere respostas estratégicas", "Prioriza casos urgentes", "Monitora a evolução da crise"],
              },
              {
                icon: BarChart3, title: "Inteligência & Analytics",
                items: ["Índice de satisfação", "Evolução da reputação", "Principais reclamações e elogios", "Tendências e padrões", "Comparativo com concorrentes"],
              },
            ].map((card) => (
              <motion.div key={card.title} {...fadeUp}>
                <Card className="p-6 h-full rounded-2xl border-border bg-background/60 hover:border-primary/30 hover:bg-card transition-all">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <card.icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{card.title}</h3>
                  <ul className="space-y-2">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENEFÍCIOS ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <motion.h2 {...fadeUp} className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-14">
            Sua reputação trabalhando para <span className="text-primary">vender mais.</span>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, text: "Responde clientes 24 horas" },
              { icon: Bell, text: "Nunca deixa reclamações sem resposta" },
              { icon: TrendingUp, text: "Melhora sua reputação online" },
              { icon: Zap, text: "Economiza horas da equipe" },
              { icon: Shield, text: "Aumenta a confiança da marca" },
              { icon: Users, text: "Ajuda a conquistar novos clientes" },
            ].map((b) => (
              <motion.div key={b.text} {...fadeUp}>
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card/50 hover:border-primary/30 hover:bg-card transition-all">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3">
            <PrimaryCTA />
            <SecondaryCTA />
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[900px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Em 4 passos, sua marca protegida por IA.</p>
          </motion.div>

          <div className="relative space-y-6">
            <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent hidden sm:block" />

            {[
              { title: "Conecte suas contas", desc: "Google, redes sociais e plataformas de avaliação em poucos cliques." },
              { title: "A IA começa a monitorar automaticamente", desc: "Sem configuração técnica — a IA já entende seu negócio." },
              { title: "Ela responde com inteligência contextual", desc: "No tom da sua marca, seguindo suas regras e políticas." },
              { title: "Você acompanha tudo em um painel inteligente", desc: "Métricas, alertas, evolução e insights em tempo real." },
            ].map((step, i) => (
              <motion.div key={step.title} {...fadeUp} className="relative flex gap-5 items-start">
                <div className="relative z-10 h-12 w-12 shrink-0 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-semibold shadow-[0_0_24px_hsl(var(--primary)/0.3)]">
                  {i + 1}
                </div>
                <Card className="flex-1 p-5 rounded-2xl border-border bg-background/60">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARA QUEM É ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <motion.h2 {...fadeUp} className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-14">
            Para quem é a Reputação IA
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { emoji: "🏥", label: "Clínicas" },
              { emoji: "⚖️", label: "Escritórios" },
              { emoji: "🍽", label: "Restaurantes" },
              { emoji: "🛒", label: "Lojas" },
              { emoji: "🏭", label: "Indústrias" },
              { emoji: "🚗", label: "Concessionárias" },
              { emoji: "🏨", label: "Hotéis" },
              { emoji: "🏢", label: "Imobiliárias" },
              { emoji: "🛍", label: "E-commerce" },
              { emoji: "🛠", label: "Prestadores" },
            ].map((seg) => (
              <motion.div key={seg.label} {...fadeUp}>
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-card/50 border border-border hover:border-primary/30 hover:bg-card transition-all cursor-default">
                  <span className="text-3xl">{seg.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{seg.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DIFERENCIAIS ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Muito mais do que <span className="text-primary">responder comentários.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A Reputação IA é uma plataforma completa de inteligência de marca.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, title: "Monitoramento 24h", desc: "Sem pausas, feriados ou fins de semana." },
              { icon: MessageSquare, title: "Resposta automática com IA", desc: "No tom da sua marca, sempre." },
              { icon: Heart, title: "Análise de sentimento", desc: "Entende emoção e intenção do cliente." },
              { icon: Radar, title: "Detecção de crises", desc: "Alerta antes que o problema cresça." },
              { icon: BarChart3, title: "Relatórios inteligentes", desc: "Métricas que importam para decisão." },
              { icon: Sparkles, title: "Insights estratégicos", desc: "IA sugere ações baseadas nos dados." },
              { icon: TrendingUp, title: "Comparativo com concorrentes", desc: "Saiba como sua marca se posiciona." },
              { icon: Search, title: "Aprendizado contínuo", desc: "Fica mais precisa a cada resposta." },
              { icon: Users, title: "Escalável para qualquer porte", desc: "De PME a grandes redes." },
            ].map((d) => (
              <motion.div key={d.title} {...fadeUp}>
                <Card className="p-5 h-full rounded-2xl border-border bg-background/60 hover:border-primary/30 hover:bg-card transition-all">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                    <d.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ POR QUE COMEÇAR ============ */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-card/40" />
        <div className="max-w-[900px] mx-auto text-center relative">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary mb-6">
              <Shield className="h-3.5 w-3.5" />
              Por que começar pela Reputação IA
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
              Sua reputação é o ativo mais importante da sua empresa.
            </h2>
            <div className="space-y-4 text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              <p>Toda empresa depende da confiança dos clientes.</p>
              <p>Uma única avaliação negativa sem resposta pode afastar novas vendas.</p>
              <p className="text-foreground/90">
                A Reputação IA protege sua imagem, responde rapidamente e transforma comentários, avaliações
                e reclamações em <strong className="text-primary">oportunidades para fortalecer sua marca</strong>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_120%,hsl(var(--primary)/0.22),transparent_70%)]" />
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
              Sua reputação{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                não pode esperar.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Ative agora a Reputação IA e deixe sua empresa protegida 24 horas por dia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <PrimaryCTA />
              <SecondaryCTA label="Agendar Demonstração" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Configuração rápida</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem equipe técnica</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> IA trabalhando imediatamente</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[820px] mx-auto">
          <motion.h2 {...fadeUp} className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-12">
            Perguntas frequentes
          </motion.h2>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "A IA responde sozinha?", a: "Sim. Ela responde automaticamente seguindo o tom da sua empresa e regras definidas por você." },
              { q: "Posso aprovar respostas antes que sejam publicadas?", a: "Sim. É possível trabalhar em modo automático (a IA responde direto) ou mediante aprovação prévia." },
              { q: "Funciona com o Google Meu Negócio?", a: "Sim. A Reputação IA se conecta ao Google Meu Negócio e responde avaliações automaticamente." },
              { q: "Funciona com o Reclame Aqui?", a: "Sim. Monitora, responde e acompanha os casos até a resolução dentro do Reclame Aqui." },
              { q: "Funciona nas redes sociais?", a: "Sim. Instagram, Facebook e LinkedIn — comentários, DMs e menções." },
              { q: "Consigo acompanhar tudo?", a: "Sim. Você terá um painel completo com métricas, indicadores, alertas em tempo real e histórico de todas as interações." },
            ].map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-border bg-background/60 px-5 data-[state=open]:border-primary/30 data-[state=open]:bg-card transition-all"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ RODAPÉ CTA ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <Shield className="h-10 w-10 text-primary mx-auto mb-5" strokeWidth={1.5} />
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
              Proteja sua marca com Inteligência Artificial.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <PrimaryCTA />
              <Link to="/pricing">
                <Button size="lg" variant="ghost" className="gap-2 h-12 px-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-card">
                  Ver planos e preços
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReputacaoIA;
