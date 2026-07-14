/**
 * /squads · página de squads verticais (produto de entrada para PME).
 * Cada squad = 3–7 agentes especializados em 1 função de negócio.
 * Preços praticados no tier maior (Growth) — deixa espaço para Starter/Pro
 * em cada landing dedicada.
 * Puramente frontend, identidade Clauthor via tokens semânticos.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shield, MessageSquare, Target, Wallet, PenSquare,
  ArrowRight, CheckCircle2, Sparkles, Zap, Users, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

type Squad = {
  id: string;
  icon: typeof Shield;
  name: string;
  tagline: string;
  price: number;
  agents: number;
  features: string[];
  href: string;
  featured?: boolean;
};

const SQUADS: Squad[] = [
  {
    id: "reputacao",
    icon: Shield,
    name: "Reputação IA",
    tagline: "Proteja sua marca 24h por dia. IA monitora e responde avaliações no Google, Reclame Aqui, Instagram, Facebook e LinkedIn.",
    price: 697,
    agents: 7,
    features: [
      "Google Meu Negócio + Reclame Aqui",
      "Instagram, Facebook e LinkedIn",
      "Detecção de crises em tempo real",
      "Análise de sentimento + BI",
      "Painel unificado de menções",
    ],
    href: "/reputacao-ia",
    featured: true,
  },
  {
    id: "atendimento",
    icon: MessageSquare,
    name: "Atendimento IA 24h",
    tagline: "Time de IA que responde clientes no WhatsApp, Instagram DM e chat do site — sem escala humana, sem cliente esperando.",
    price: 797,
    agents: 5,
    features: [
      "WhatsApp Business + Instagram DM",
      "Chat do site + e-mail",
      "Roteirização por intenção",
      "Escalação para humano quando preciso",
      "Histórico unificado por cliente",
    ],
    href: "#",
  },
  {
    id: "sdr",
    icon: Target,
    name: "SDR IA (Hunter)",
    tagline: "Prospecção outbound automatizada no LinkedIn e e-mail. ICP, cadência, follow-up e reunião marcada — sem SDR humano.",
    price: 997,
    agents: 6,
    features: [
      "Prospecção LinkedIn (multi-conta)",
      "E-mail cadência 5 toques",
      "Enriquecimento de lead (Hunter/Apollo)",
      "Qualificação automática",
      "Agendamento direto no Calendar",
    ],
    href: "#",
  },
  {
    id: "financeiro",
    icon: Wallet,
    name: "Financeiro IA",
    tagline: "Cobrança automatizada, conciliação bancária e follow-up de inadimplentes. Reduza inadimplência sem pisar em cliente.",
    price: 597,
    agents: 4,
    features: [
      "Cobrança automática (WhatsApp + e-mail)",
      "Régua de cobrança customizável",
      "Conciliação bancária",
      "Emissão de boletos e Pix",
      "Relatório de inadimplência",
    ],
    href: "#",
  },
  {
    id: "conteudo",
    icon: PenSquare,
    name: "Conteúdo IA",
    tagline: "Time completo de marketing de conteúdo: posts sociais, artigos de blog e SEO — no seu tom, na sua frequência.",
    price: 697,
    agents: 6,
    features: [
      "Instagram + LinkedIn + Facebook",
      "Blog SEO (2–4 posts/semana)",
      "Calendário editorial",
      "Roteiros de vídeo curto",
      "Aprovação antes de publicar",
    ],
    href: "#",
  },
];

const Squads = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <SEO
        title="Squads IA · Times de Inteligência Artificial prontos para PME | Clauthor"
        description="Squads verticais da Clauthor: Reputação IA, Atendimento 24h, SDR IA, Financeiro IA e Conteúdo IA. Contrate um time completo de IA a partir de R$ 597/mês."
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
              Squads IA · Times prontos para PME
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
            {SQUADS.map((squad) => (
              <motion.div key={squad.id} {...fadeUp}>
                <Card
                  className={`relative p-6 h-full rounded-2xl bg-card/60 transition-all flex flex-col ${
                    squad.featured
                      ? "border-primary/40 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.35)] hover:border-primary/60"
                      : "border-border hover:border-primary/30 hover:bg-card"
                  }`}
                >
                  {squad.featured && (
                    <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      <Sparkles className="h-3 w-3" /> Mais vendido
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <squad.icon className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{squad.agents} agentes</span>
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{squad.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{squad.tagline}</p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {squad.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-5 border-t border-border">
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <span className="font-display text-3xl font-semibold text-foreground">
                        {squad.price.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>

                    {squad.href.startsWith("/") ? (
                      <Link to={squad.href} className="block">
                        <Button className="w-full gap-2 rounded-full glow">
                          Contratar squad
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <a
                        href="https://www.g8prospect.com.br/agendar/60e4cd8d-5765-4902-a51b-87d5b9f025fe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="outline" className="w-full gap-2 rounded-full border-border hover:bg-card">
                          Solicitar acesso antecipado
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
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
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> A partir de R$ 597/mês</li>
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
