/**
 * /squads · vitrine de todos os squads verticais.
 * Cada card leva para /squads/:slug (ou rota dedicada, ex.: /reputacao-ia).
 * Fonte única: src/data/squads.ts
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Sparkles, Zap, Users, TrendingUp, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { SQUADS, type Squad } from "@/data/squads";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const demandBadge: Record<NonNullable<Squad["demand"]>, { label: string; className: string }> = {
  TOP: { label: "Mais procurado", className: "bg-primary text-primary-foreground" },
  ALTA: { label: "Alta demanda", className: "bg-foreground/90 text-background" },
  NOVA: { label: "Novo", className: "bg-card border border-primary/40 text-primary" },
};

const Squads = () => {
  const targetHref = (s: Squad) => s.overrideHref ?? `/squads/${s.slug}`;

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <SEO
        title="Squads IA · Times de Inteligência Artificial prontos para PME | Clauthor"
        description="Squads verticais: Reputação, Atendimento 24h, SDR, Vendas, Tráfego Pago, Conteúdo, E-commerce, RH, Sucesso do Cliente, Financeiro e Jurídico. A partir de R$ 297/mês."
        path="/squads"
      />

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

        <div className="max-w-[1000px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {SQUADS.length} squads · os times mais procurados do mercado
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              Contrate um{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                time inteiro de IA
              </span>
              <br className="hidden sm:block" />
              para uma função específica.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Squads são times verticais de 4 a 7 agentes de IA especializados em resolver{" "}
              <strong className="text-foreground">uma dor de negócio</strong>. Sem contratar pessoas,
              sem departamento inteiro — só o resultado.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Ativação em minutos</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem equipe técnica</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Cancele quando quiser</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ GRID DE SQUADS ============ */}
      <section className="pb-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SQUADS.map((squad) => {
              const Icon = squad.icon;
              const demand = squad.demand ? demandBadge[squad.demand] : null;
              return (
                <motion.div key={squad.slug} {...fadeUp}>
                  <Card
                    className={`relative p-6 h-full rounded-2xl bg-card/60 transition-all flex flex-col ${
                      squad.featured
                        ? "border-primary/40 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.35)] hover:border-primary/60"
                        : "border-border hover:border-primary/30 hover:bg-card"
                    }`}
                  >
                    {demand && (
                      <div className={`absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${demand.className}`}>
                        {squad.demand === "TOP" && <Flame className="h-3 w-3" />}
                        {demand.label}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{squad.agents} agentes</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                      {squad.category}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">{squad.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{squad.tagline}</p>

                    <ul className="space-y-2 mb-6 flex-1">
                      {squad.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-5 border-t border-border">
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-xs text-muted-foreground">a partir de R$</span>
                        <span className="font-display text-3xl font-semibold text-foreground">
                          {squad.tiers[0]?.price.toLocaleString("pt-BR") ?? squad.price.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>

                      <Link to={targetHref(squad)} className="block">
                        <Button className={`w-full gap-2 rounded-full ${squad.featured ? "glow" : ""}`} variant={squad.featured ? "default" : "outline"}>
                          Ver squad
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SQUAD vs DEPARTAMENTO ============ */}
      <section className="py-20 px-5 bg-card/30 border-y border-border">
        <div className="max-w-[1000px] mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Squad ou <span className="text-primary">Departamento?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comece pelo squad, expanda para o departamento quando fizer sentido.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-7 rounded-2xl border-border bg-background/60">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-primary">Squad</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Para PME e profissionais liberais</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                4 a 7 agentes especializados em uma função. Você resolve uma dor específica sem
                mudar o resto do negócio.
              </p>
              <ul className="space-y-2 text-sm text-foreground/85">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Ativação em minutos, self-serve</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> A partir de R$ 297/mês</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Escopo vertical (1 função)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Cancelamento livre</li>
              </ul>
            </Card>

            <Card className="p-7 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/[0.08] to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-primary">Departamento</span>
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Para média e grande empresa</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                20+ agentes cobrindo uma área inteira (Comercial, Marketing, RH, Financeiro).
                Substitui um departamento humano completo.
              </p>
              <ul className="space-y-2 text-sm text-foreground/85">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Onboarding assistido (7 dias)</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> A partir de R$ 1.700/mês</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> 20 departamentos disponíveis</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> +200 especialistas de IA</li>
              </ul>
              <Link to="/departamentos" className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-primary hover:underline">
                Ver departamentos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_120%,hsl(var(--primary)/0.22),transparent_70%)]" />
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-5">
              Um squad hoje.{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-foreground">
                Um departamento inteiro amanhã.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Comece pequeno, prove o valor, escale quando fizer sentido.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/reputacao-ia">
                <Button size="lg" className="gap-2 h-12 px-7 rounded-full font-medium glow">
                  <Sparkles className="h-4 w-4" />
                  Ver Reputação IA
                </Button>
              </Link>
              <a href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2 h-12 px-7 rounded-full border-border hover:bg-card font-medium">
                  Falar com especialista
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Squads;
