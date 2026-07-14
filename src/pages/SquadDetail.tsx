/**
 * /squads/:slug · página dedicada por squad.
 * Template rico: hero, problemas, entregáveis, composição do time,
 * canais, 3 tiers de pricing, FAQ e CTA. Consome src/data/squads.ts.
 */
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Sparkles, Users, ArrowLeft,
  AlertTriangle, Package, Radio, MessageCircle, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { getSquadBySlug } from "@/data/squads";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const SquadDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const squad = slug ? getSquadBySlug(slug) : undefined;

  if (!squad) return <Navigate to="/squads" replace />;
  // Se o squad tem página própria (ex.: /reputacao-ia), redireciona.
  if (squad.overrideHref) return <Navigate to={squad.overrideHref} replace />;

  const Icon = squad.icon;
  const highlighted = squad.tiers.find((t) => t.highlighted) ?? squad.tiers[1] ?? squad.tiers[0];

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <SEO title={squad.seoTitle} description={squad.seoDescription} path={`/squads/${squad.slug}`} />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24 px-5">
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

        <div className="max-w-[1100px] mx-auto">
          <Link to="/squads" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Todos os squads
          </Link>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                {squad.hero.kicker}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
                {squad.hero.headline}{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                  {squad.hero.highlight}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
                {squad.hero.subhead}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-8">
                {squad.hero.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {b}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <a href="#pricing">
                  <Button size="lg" className="gap-2 h-12 px-7 rounded-full font-medium glow">
                    Ver planos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 h-12 px-7 rounded-full border-border hover:bg-card font-medium">
                    Falar com especialista
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Card resumo lateral */}
            <motion.div {...fadeUp}>
              <Card className="p-6 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/[0.10] via-card/60 to-transparent">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{squad.category}</div>
                    <div className="font-display text-lg font-semibold">{squad.name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-background/60 border border-border">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-1"><Users className="h-3 w-3" /> Agentes</div>
                    <div className="font-display text-2xl font-semibold">{squad.agents}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-background/60 border border-border">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">A partir de</div>
                    <div className="font-display text-2xl font-semibold">R$ {squad.tiers[0].price.toLocaleString("pt-BR")}<span className="text-sm text-muted-foreground font-normal">/mês</span></div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {squad.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ PROBLEMAS ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <AlertTriangle className="h-3.5 w-3.5" /> Dores que este squad resolve
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Se algum destes sintomas soa <span className="text-primary">familiar</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {squad.problems.map((p) => (
              <motion.div key={p} {...fadeUp}>
                <Card className="p-5 rounded-xl border-border bg-background/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed pt-1">{p}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ENTREGÁVEIS ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <Package className="h-3.5 w-3.5" /> O que você recebe
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Entregáveis <span className="text-primary">concretos</span>, não promessa
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {squad.deliverables.map((d, i) => (
              <motion.div key={d} {...fadeUp}>
                <Card className="p-5 rounded-xl border-border bg-card/60 flex items-start gap-4">
                  <div className="font-display text-2xl font-semibold text-primary/70 shrink-0 w-10">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed pt-1">{d}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPOSIÇÃO DO TIME ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <Users className="h-3.5 w-3.5" /> Composição do squad
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              {squad.agents} agentes especializados,{" "}
              <span className="text-primary">um objetivo comum</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {squad.team.map((agent, i) => (
              <motion.div key={agent.name} {...fadeUp}>
                <Card className="p-5 rounded-xl border-border bg-background/60 hover:border-primary/30 transition-colors">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                    Agente {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agent.role}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CANAIS/INTEGRAÇÕES ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <Radio className="h-3.5 w-3.5" /> Integrações & canais
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Plugado nas ferramentas que você <span className="text-primary">já usa</span>
            </h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {squad.channels.map((c) => (
              <div key={c} className="px-4 py-2 rounded-full border border-border bg-card/60 text-sm text-foreground/85">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1100px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <ShieldCheck className="h-3.5 w-3.5" /> Planos
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Comece pequeno.{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">Escale quando fizer sentido.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Sem fidelidade. Cancele ou faça upgrade quando quiser.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {squad.tiers.map((tier) => (
              <motion.div key={tier.name} {...fadeUp}>
                <Card
                  className={`p-6 h-full rounded-2xl transition-all flex flex-col ${
                    tier.highlighted
                      ? "border-primary/50 bg-gradient-to-br from-primary/[0.08] to-transparent shadow-[0_0_50px_-10px_hsl(var(--primary)/0.4)]"
                      : "border-border bg-background/60 hover:border-primary/30"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="inline-flex items-center gap-1 self-start rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground mb-4">
                      <Sparkles className="h-3 w-3" /> Recomendado
                    </div>
                  )}
                  <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    {tier.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <span className="font-display text-4xl font-semibold text-foreground">
                      {tier.price.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">{tier.tagline}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      className="w-full gap-2 rounded-full"
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      Contratar {tier.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 px-5">
        <div className="max-w-[820px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-3">
              <MessageCircle className="h-3.5 w-3.5" /> Perguntas frequentes
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
              Ainda em <span className="text-primary">dúvida?</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="w-full">
            {squad.faq.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_120%,hsl(var(--primary)/0.22),transparent_70%)]" />
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
              Ative {squad.name}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                em minutos.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              A partir de R$ {squad.tiers[0].price.toLocaleString("pt-BR")}/mês. Sem contrato longo, sem taxa de setup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 h-12 px-7 rounded-full font-medium glow">
                  <Sparkles className="h-4 w-4" />
                  Contratar {highlighted.name}
                </Button>
              </a>
              <Link to="/squads">
                <Button size="lg" variant="outline" className="gap-2 h-12 px-7 rounded-full border-border hover:bg-card font-medium">
                  Ver outros squads
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

export default SquadDetail;
