import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  TrendingDown,
  Globe2,
  Users,
  Target,
  Rocket,
  Sparkles,
  ShieldCheck,
  LineChart,
  Check,
  X,
  Languages,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SEO from "@/components/SEO";
import ClauthorLogo from "@/components/ClauthorLogo";
import {
  SourcesSection,
  ChartsSection,
  CompetitorDetailSection,
  FundingCalculator,
} from "@/components/investor/InvestorExtras";

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

// Análise competitiva
const competitors = [
  { name: "Clauthor", squads: true, agents: "225 agentes", langs: "14+ idiomas", outcome: true, marketplace: true, audit: true, price: "Outcome-based", highlight: true },
  { name: "Lindy AI", squads: false, agents: "Agentes isolados", langs: "EN apenas", outcome: false, marketplace: false, audit: false, price: "US$ 49–299/mês" },
  { name: "Relevance AI", squads: false, agents: "Templates", langs: "EN/ES", outcome: false, marketplace: true, audit: false, price: "US$ 19–599/mês" },
  { name: "MultiOn", squads: false, agents: "Agente único", langs: "EN apenas", outcome: false, marketplace: false, audit: false, price: "US$ 20/mês" },
  { name: "Adept", squads: false, agents: "Agente único", langs: "EN apenas", outcome: false, marketplace: false, audit: false, price: "Enterprise" },
  { name: "Cognosys", squads: false, agents: "Workflows", langs: "EN apenas", outcome: false, marketplace: false, audit: false, price: "US$ 15–99/mês" },
];

// Alocação de capital — pré-seed R$ 200k
const allocation = [
  { pct: "45%", title: "Marketing & Aquisição", desc: "Tráfego pago, influenciadores, campanhas G8 Prospect em BR, AR, MX, PT, ES, IT, US.", color: "from-primary/40 to-primary/10", help: "Campanhas de performance (Meta, Google, TikTok, LinkedIn), parcerias com criadores B2B em 7 mercados, ativação do programa G8 Prospect (8 verticais de alta conversão) e expansão para Europa e LATAM com conteúdo localizado em 14 idiomas." },
  { pct: "30%", title: "Tecnologia & Produto", desc: "Infraestrutura de IA proprietária, banco vetorial (pgvector), edge functions serverless e marketplace de agentes.", color: "from-foreground/30 to-foreground/5", help: "Stack técnico: orquestração multi-modelo (GPT-5, Claude Opus 4, Gemini 3) com roteamento inteligente por custo/qualidade, memória hierárquica em 4 camadas (episódica, semântica, procedural, reflexiva) usando embeddings pgvector, +50 edge functions serverless para integrações (WhatsApp, LinkedIn, CRMs), e MCP Server nativo para distribuição dos 225 agentes em ferramentas externas como Claude Desktop e Cursor." },
  { pct: "25%", title: "Pessoas & Operação", desc: "Squad de growth, customer success multilíngue e parcerias estratégicas.", color: "from-primary/30 to-foreground/5" },
];

const regions = [
  { flag: "🇧🇷", name: "Brasil" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇲🇽", name: "México" },
  { flag: "🇨🇴", name: "Colômbia" },
  { flag: "🇨🇱", name: "Chile" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇪🇸", name: "Espanha" },
  { flag: "🇮🇹", name: "Itália" },
  { flag: "🇫🇷", name: "França" },
  { flag: "🇩🇪", name: "Alemanha" },
  { flag: "🇬🇧", name: "Reino Unido" },
  { flag: "🇺🇸", name: "EUA" },
];

// Projeção MRR — 24 meses
const mrrProjection = [
  { month: "M3", users: "500", mrr: "R$ 75K" },
  { month: "M6", users: "2.500", mrr: "R$ 375K" },
  { month: "M12", users: "15.000", mrr: "R$ 2,25M" },
  { month: "M18", users: "45.000", mrr: "R$ 6,75M" },
  { month: "M24", users: "100.000", mrr: "R$ 15M" },
];

const unitEconomics = [
  { label: "Ticket Médio Atual", value: "R$ 150", sub: "/mês por usuário" },
  { label: "Ticket Médio Projetado", value: "R$ 280", sub: "M24 (com upsell de squads)" },
  { label: "CAC Estimado", value: "R$ 90", sub: "via G8 Prospect" },
  { label: "LTV (24m)", value: "R$ 3.600", sub: "LTV/CAC = 40x" },
  { label: "Payback", value: "< 1 mês", sub: "do CAC investido" },
  { label: "Margem Bruta", value: "82%", sub: "modelo SaaS + AI" },
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
        description="Pre-seed R$200K for 10%. Roadmap to 100K users and R$15M MRR in 24 months across 12+ countries and 14+ languages."
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <ClauthorLogo size="md" />
          <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-wider text-muted-foreground">
            <a href="#solucao" className="hover:text-primary transition-colors">Solução</a>
            <a href="#concorrencia" className="hover:text-primary transition-colors">Concorrência</a>
            <a href="#economia" className="hover:text-primary transition-colors">Economia</a>
            <a href="#calculadora" className="hover:text-primary transition-colors">Calculadora</a>
            <a href="#investimento" className="hover:text-primary transition-colors">Rodada</a>
          </nav>
          <Button asChild size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="#contact">Investir</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[140px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="absolute inset-0 -z-10 opacity-[0.04] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Pré-Seed · R$ 200K · 10% Equity</span>
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
            225 agentes autônomos, 20 departamentos, 14+ idiomas.
            Meta: <span className="text-foreground font-semibold">100.000 usuários e R$ 15M de MRR em 24 meses.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 text-base shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              <a href="#contact">Investir no Pré-Seed <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-base border-border/60">
              <a href="#concorrencia">Ver Análise Competitiva</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 border-t border-border/40"
          >
            {[
              { v: "225", l: "Agentes de IA" },
              { v: "14+", l: "Idiomas" },
              { v: "12+", l: "Países alvo" },
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

      {/* COMPETITIVE ANALYSIS */}
      <section id="concorrencia" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Análise Competitiva</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Por Que Clauthor Vence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nenhum concorrente entrega squads completos de agentes com pricing por outcome e cobertura multilíngue global.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="overflow-x-auto rounded-2xl border border-border/60 bg-card/30">
            <table className="w-full text-sm">
              <thead className="bg-card/60 border-b border-border/60">
                <tr className="text-left">
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Player</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Squads</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Agentes</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Idiomas</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Outcome Pricing</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Marketplace</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Audit Trail</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Preço</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr
                    key={c.name}
                    className={`border-b border-border/40 last:border-0 ${c.highlight ? "bg-primary/5" : ""}`}
                  >
                    <td className={`p-4 font-semibold ${c.highlight ? "text-primary" : ""}`}>{c.name}{c.highlight && " ⚡"}</td>
                    <td className="p-4">{c.squads ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground/50" />}</td>
                    <td className="p-4 text-muted-foreground">{c.agents}</td>
                    <td className="p-4 text-muted-foreground">{c.langs}</td>
                    <td className="p-4">{c.outcome ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground/50" />}</td>
                    <td className="p-4">{c.marketplace ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground/50" />}</td>
                    <td className="p-4">{c.audit ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground/50" />}</td>
                    <td className="p-4 text-muted-foreground">{c.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div {...fadeUp} className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Languages, t: "14+ Idiomas Nativos", d: "PT, EN, ES, FR, DE, IT, JA, KO, ZH, AR, RU, TR + variantes regionais." },
              { icon: ShieldCheck, t: "Audit Trail Criptográfico", d: "SHA-256 hash chain imutável — único no mercado para compliance enterprise." },
              { icon: Sparkles, t: "Outcome-Based Pricing", d: "Cliente paga por resultado entregue, não por seat — alinhamento total." },
            ].map((m, i) => (
              <motion.div key={m.t} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="p-6 rounded-xl border border-border/60 bg-background">
                <m.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-bold mb-2">{m.t}</h3>
                <p className="text-sm text-muted-foreground">{m.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <CompetitorDetailSection />


      {/* Unfair Advantage — G8 Prospect */}
      <section className="py-32 px-6 bg-card/30 border-y border-border/40">
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
                <li key={item.t} className="flex gap-4 p-6 rounded-xl border border-border/60 bg-background">
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

      {/* GLOBAL REACH */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Alcance Global</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">12+ Países, 14+ Idiomas</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
              América do Sul, América do Norte e Europa — Clauthor já fala a língua dos seus clientes desde o dia 1.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {regions.map((r) => (
              <div key={r.name} className="p-6 rounded-2xl border border-border/60 bg-card/30 hover:border-primary/40 transition-all">
                <div className="text-4xl mb-2">{r.flag}</div>
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{r.name}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* UNIT ECONOMICS */}
      <section id="economia" className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Unit Economics</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Números que Falam por Si</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ticket médio, CAC, LTV e payback validados na operação atual.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {unitEconomics.map((m, i) => (
              <motion.div
                key={m.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.1 }}
                className="p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{m.label}</div>
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">{m.value}</div>
                <div className="text-sm text-muted-foreground">{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MRR PROJECTION */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Projeção 24 Meses</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Roadmap até R$ 15M de MRR</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Crescimento acelerado pela máquina G8 Prospect e cobertura multilíngue.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {mrrProjection.map((p, i) => (
              <motion.div
                key={p.month}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="relative p-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card/60 to-background overflow-hidden"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">{p.month}</div>
                <div className="text-2xl md:text-3xl font-bold mb-1">{p.users}</div>
                <div className="text-xs text-muted-foreground mb-4">usuários</div>
                <div className="pt-3 border-t border-border/40">
                  <div className="text-lg md:text-xl font-bold text-primary">{p.mrr}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">MRR</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-12 p-8 rounded-2xl border border-primary/30 bg-primary/5 text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-3">ARR Projetado M24</div>
            <div className="text-5xl md:text-6xl font-bold text-foreground">R$ 180M / ano</div>
            <p className="text-sm text-muted-foreground mt-4 max-w-xl mx-auto">
              Com margem bruta de 82%, isso representa R$ 147M de lucro bruto anual recorrente.
            </p>
          </motion.div>
        </div>
      </section>

      <ChartsSection />

      {/* INVESTMENT ROUND */}

      <section id="investimento" className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-20">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">A Rodada</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Pré-Seed: R$ 200K por 10%
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Valuation pré-money de <span className="text-foreground font-semibold">R$ 1,8M</span>. Capital total necessário para atingir 100K usuários é de <span className="text-foreground font-semibold">~R$ 400K</span>, complementado por rodadas Seed e Série A sequenciais.
            </p>
          </motion.div>

          {/* Round structure */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { tag: "AGORA", round: "Pré-Seed", amount: "R$ 200K", equity: "10%", desc: "Aceleração de marketing e expansão multilíngue.", highlight: true },
              { tag: "Q3 2026", round: "Seed", amount: "R$ 200K+", equity: "TBD", desc: "Escala internacional após validação de unit economics." },
              { tag: "2027", round: "Série A", amount: "US$ 3M+", equity: "TBD", desc: "Dominância global em outcome-based AI workforce." },
            ].map((r, i) => (
              <motion.div
                key={r.round}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all ${r.highlight ? "border-primary bg-primary/5 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.5)]" : "border-border/60 bg-background"}`}
              >
                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider mb-6 ${r.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {r.tag}
                </div>
                <h3 className="text-2xl font-bold mb-2">{r.round}</h3>
                <div className="text-4xl font-bold text-primary mb-1">{r.amount}</div>
                <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">{r.equity} equity</div>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Why 10% */}
          <motion.div {...fadeUp} className="mb-16 p-10 rounded-2xl border border-border/60 bg-background">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-4">Por Que 10%?</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">Equity Justo para Capital Estratégico</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  10% reflete um valuation pré-money de <strong className="text-foreground">R$ 1,8M</strong> — abaixo do múltiplo de mercado para SaaS de IA com tração comprovada, dando ao investidor pré-seed espaço significativo de upside.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Mantém o cap table limpo para as próximas rodadas (Seed + Série A), preservando incentivo e velocidade dos founders.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: "R$ 1,8M", l: "Pré-money" },
                  { v: "R$ 2,0M", l: "Pós-money" },
                  { v: "180x", l: "Upside potencial M24" },
                  { v: "< 1 mês", l: "Payback CAC" },
                ].map((s) => (
                  <div key={s.l} className="p-5 rounded-xl bg-card/50 border border-border/40">
                    <div className="text-2xl font-bold text-primary">{s.v}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Capital Allocation */}
          <motion.div {...fadeUp}>
            <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">Para Onde Vai o Capital</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {allocation.map((a, i) => (
                <motion.div
                  key={a.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                  className={`relative p-10 rounded-2xl bg-gradient-to-br ${a.color} border border-border/60 overflow-hidden`}
                >
                  <div className="text-6xl font-bold text-foreground mb-4">{a.pct}</div>
                  <h4 className="text-xl font-bold mb-3">{a.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <FundingCalculator />
      <SourcesSection />



      {/* Why Invest */}
      <section className="py-32 px-6">
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
                className="p-8 rounded-2xl bg-card/30 border border-border/60 hover:border-primary/40 transition-all"
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
      <section id="contact" className="py-32 px-6 bg-card/30 border-t border-border/40">
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
            className="space-y-4 p-8 rounded-2xl bg-background border border-border/60 backdrop-blur"
          >
            <Input placeholder="Seu Nome" className="h-12" />
            <Input type="email" placeholder="Seu E-mail Corporativo" className="h-12" />
            <Input placeholder="Empresa / Fundo de Investimento" className="h-12" />
            <Button type="submit" size="lg" className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-base shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              Quero Investir no Pré-Seed <ArrowRight className="ml-2 h-4 w-4" />
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
