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
import ThorLiveGuide from "@/components/dashboard/ThorLiveGuide";

import {
  SourcesSection,
  ChartsSection,
  CompetitorDetailSection,
  FundingCalculator,
} from "@/components/investor/InvestorExtras";
import ParallaxBand from "@/components/investor/ParallaxBand";
import parallaxOrb from "@/assets/investor-parallax-1.jpg";
import parallaxDatacenter from "@/assets/investor-parallax-2.jpg";
import parallaxGlobal from "@/assets/investor-parallax-3.jpg";

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

// Alocação de capital pré-seed R$ 200k
const allocation = [
  { pct: "45%", title: "Marketing & Aquisição", desc: "Tráfego pago, influenciadores, campanhas G8 Prospect em BR, AR, MX, PT, ES, IT, US.", color: "from-primary/40 to-primary/10", help: "Campanhas de performance (Meta, Google, TikTok, LinkedIn), parcerias com criadores B2B em 7 mercados, ativação do programa G8 Prospect (8 verticais de alta conversão) e expansão para Europa e LATAM com conteúdo localizado em 14 idiomas." },
  { pct: "30%", title: "Tecnologia & Produto", desc: "Infraestrutura de IA proprietária, banco vetorial (pgvector), edge functions serverless e marketplace de agentes.", color: "from-foreground/30 to-foreground/5", help: "Stack técnico: orquestração multi-modelo (GPT-5, Claude Opus 4, Gemini 3) com roteamento inteligente por custo/qualidade, memória hierárquica em 4 camadas (episódica, semântica, procedural, reflexiva) usando embeddings pgvector, +50 edge functions serverless para integrações (WhatsApp, LinkedIn, CRMs), e MCP Server nativo para distribuição dos 225 agentes em ferramentas externas como Claude Desktop e Cursor." },
  { pct: "25%", title: "Pessoas & Operação", desc: "Squad de growth, customer success multilíngue e parcerias estratégicas.", color: "from-primary/30 to-foreground/5", help: "Contratação de líderes seniores em growth, engenharia de IA e CS multilíngue (PT/ES/EN/IT), além de parcerias com integradores, agências e consultorias para acelerar adoção enterprise." },
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

// Projeção MRR 24 meses
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
  { icon: TrendingDown, title: "Mercado Exponencial", desc: "Demanda global por IA que entrega resultado — não mais uma ferramenta — cresce 44% ao ano (Gartner)." },
  { icon: Sparkles, title: "Diferencial Insuperável", desc: "225 agentes em 20 squads, memória hierárquica e outcome-based pricing — arquitetura proprietária difícil de replicar." },
  { icon: Target, title: "Timing Perfeito", desc: "Entramos antes da consolidação: zero incumbente dominante em agentes autônomos B2B em português." },
  { icon: LineChart, title: "Potencial Exponencial", desc: "Modelo projeta R$ 15M de MRR em 36 meses com unit economics SaaS top-quartile." },
  { icon: ShieldCheck, title: "Plataforma Pronta", desc: "MVP 100% funcional, multi-tenant, com auditoria criptográfica e infraestrutura para 14 idiomas." },
  { icon: Rocket, title: "Capital-Eficiência", desc: "MVP construído 100% com investimento próprio do fundador. R$ 200k de pré-seed destravam validação comercial em escala." },
];

const InvestorPitch = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Clauthor Invest in the Autonomous AI Workforce"
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
          <div className="hidden md:block font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Apresentação para Investidores
          </div>
        </div>
      </header>

      {/* Hero — Apple-grade minimalism */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.35),transparent_60%)] blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px]"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 -right-40 w-[700px] h-[700px] rounded-full bg-foreground/10 blur-[160px]"
          />
        </div>

        {/* Precision grid */}
        <div className="absolute inset-0 -z-10 opacity-[0.035] bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        {/* Floating orb — futuristic centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
        >
          <div className="relative w-[460px] h-[460px] md:w-[640px] md:h-[640px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-primary/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-foreground/10"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute inset-20 rounded-full border border-primary/10"
            />
            <div className="absolute inset-[35%] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.4),transparent_70%)] blur-2xl animate-pulse" />
          </div>
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-background/60 backdrop-blur-xl mb-8 shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.4)]"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Pré-Seed · 4ª Rodada · R$ 200K · 10% Equity</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[8.5rem] font-bold tracking-[-0.04em] leading-[0.95] mb-8"
          >
            A força de trabalho
            <br />
            <span className="bg-gradient-to-br from-primary via-foreground to-primary bg-clip-text text-transparent">
              autônoma do futuro.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light"
          >
            225 agentes. 20 departamentos. 14+ idiomas.
            <br className="hidden md:block" />
            Meta: <span className="text-foreground font-medium">100K usuários e R$ 15M de MRR em 24 meses.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex justify-center"
          >
            <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-base border-border/60 bg-background/40 backdrop-blur-xl hover:bg-background/60">
              <a href="#concorrencia">Ver Análise Competitiva</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px max-w-4xl mx-auto rounded-2xl border border-border/40 bg-border/40 overflow-hidden backdrop-blur-xl"
          >
            {[
              { v: "225", l: "Agentes de IA" },
              { v: "14+", l: "Idiomas" },
              { v: "12+", l: "Países alvo" },
              { v: "88%", l: "Redução de Custo" },
            ].map((s) => (
              <div key={s.l} className="bg-background/80 backdrop-blur-xl p-6">
                <div className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">{s.v}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-2">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 60s Pitch */}
      <section id="pitch-60s" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Pitch de 60 Segundos</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              A Tese em <span className="text-primary">60 Segundos</span>
            </h2>
            <p className="text-muted-foreground">Leia em voz alta. É exatamente esse o tempo que você precisa para entender por que Clauthor vai dominar.</p>
          </motion.div>

          <motion.div {...fadeUp} className="grid md:grid-cols-5 gap-4">
            {[
              { tag: "Problema", color: "text-red-500", title: "Folha de pagamento devorando margem", body: "Empresas gastam R$ 240k/mês com 20 pessoas para tarefas repetitivas, lentas e inconsistentes. O trabalho de conhecimento ainda é manual." },
              { tag: "Solução", color: "text-primary", title: "20 squads de IA prontos pra operar", body: "225 agentes especializados, organizados em 20 departamentos, executam Marketing, Vendas, RH, Jurídico, Financeiro e mais. 24/7. Multilíngue. Auditável." },
              { tag: "Diferencial", color: "text-emerald-500", title: "O que ninguém mais entrega", body: "Outcome-based pricing, memória hierárquica em 4 camadas, MCP nativo, Trust Center com audit trail criptográfico e 14+ idiomas. Lindy, Relevance e MultiOn não chegam perto." },
              { tag: "Uso do Capital", color: "text-amber-500", title: "R$ 200k agora · R$ 3M no roadmap", body: "45% Marketing (G8 Prospect em 7 países), 30% Tecnologia (memória, MCP, marketplace), 25% Pessoas (growth + CS multilíngue). Payback do round em <12 meses." },
              { tag: "Por Que Agora", color: "text-fuchsia-500", title: "Janela de 18 meses", body: "Modelos atingiram maturidade (GPT-5, Claude Opus 4, Gemini 3), CAC de SaaS B2B no menor patamar histórico e nenhum player ainda consolidou squads multilíngues. Quem capturar agora vence a década." },
            ].map((p, i) => (
              <motion.div
                key={p.tag}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="relative p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition-all"
              >
                <div className={`font-mono text-[10px] uppercase tracking-[0.25em] mb-3 ${p.color}`}>{p.tag}</div>
                <h3 className="text-base font-bold mb-2 leading-tight">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 text-center">
            <p className="text-lg md:text-xl leading-relaxed">
              <span className="text-muted-foreground">Clauthor substitui departamentos inteiros por IA autônoma a </span>
              <span className="font-bold text-primary">1/120 do custo</span>
              <span className="text-muted-foreground">. Estamos levantando </span>
              <span className="font-bold text-foreground">R$ 200k por 10%</span>
              <span className="text-muted-foreground"> para escalar de centenas para </span>
              <span className="font-bold text-foreground">100 mil usuários</span>
              <span className="text-muted-foreground"> e </span>
              <span className="font-bold text-foreground">R$ 15M de MRR</span>
              <span className="text-muted-foreground"> em 36 meses.</span>
            </p>
          </motion.div>

          {/* Transparência: estágio MVP + gaps técnicos para escala */}
          <motion.div {...fadeUp} className="mt-8 p-8 rounded-2xl bg-card/60 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">Transparência Radical · Standby Técnico Controlado</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Em testes finais — produção em até 10 dias, escalada para 3.000–4.000 usuários simultâneos</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A plataforma está <span className="text-foreground font-semibold">100% funcional ponta a ponta</span> (225 agentes, 20 squads, multi-tenant, auditoria criptográfica, 14 idiomas) e atualmente em <span className="text-foreground font-semibold">standby controlado</span> enquanto concluímos a bateria final de testes de carga, segurança e UX.
              O go-live em produção acontece em <span className="text-foreground font-semibold">no máximo 10 dias</span>, já dimensionado para atender <span className="text-foreground font-semibold">3.000 a 4.000 usuários simultâneos</span> desde o primeiro dia. As peças abaixo são os investimentos de infraestrutura que sustentam essa escala — fornecedores definidos, custos previsíveis:
            </p>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {[
                { gap: "Servidor de produção dimensionado", solution: "Cluster dedicado para 3–4k usuários simultâneos", when: "Go-live" },
                { gap: "Observabilidade em escala", solution: "Datadog/Grafana Cloud · ~R$ 8k/mês", when: "Mês 2" },
                { gap: "Vector DB dedicado para memória", solution: "Pinecone/Weaviate cluster · ~R$ 6k/mês", when: "Mês 3" },
                { gap: "Fila de jobs distribuída", solution: "Inngest/Trigger.dev para 10M+ execuções/mês", when: "Mês 2" },
                { gap: "CDN global + edge cache", solution: "Cloudflare Enterprise para 14 regiões", when: "Mês 4" },
                { gap: "SOC 2 Type II + ISO 27001", solution: "Vanta + auditoria · ~R$ 80k one-time", when: "Mês 6" },
              ].map((item) => (
                <div key={item.gap} className="p-4 rounded-xl bg-background/60 border border-border/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{item.gap}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{item.when}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.solution}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm leading-relaxed">
                <span className="text-primary font-semibold">Por que isso é positivo para o investidor:</span>{" "}
                <span className="text-muted-foreground">o produto já existe, está testado e entra em produção em até 10 dias com capacidade para milhares de usuários simultâneos. O risco técnico já foi pago com capital próprio do fundador. Os R$ 200k entram para </span>
                <span className="text-foreground font-semibold">acelerar comercialização e blindar a infra para o próximo salto</span>
                <span className="text-muted-foreground">, não para descobrir se a tecnologia funciona — isso já está provado.</span>
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Investor Metrics */}
      <section id="metricas-investidor" className="py-32 px-6 bg-card/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-primary/40 bg-primary/10">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Estágio MVP · pré-receita · validando ICP</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Potencial & Diferencial</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ainda <span className="text-foreground font-semibold">sem clientes pagantes</span> — somos um MVP com plataforma 100% funcional pronta para comercialização.
              Os números abaixo refletem <span className="text-foreground font-semibold">o que já está construído</span> e
              <span className="text-foreground font-semibold"> as projeções modeladas</span> que o capital irá validar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Estágio", value: "MVP", delta: "Plataforma 100% funcional · pré-receita", icon: Rocket, tag: "Hoje" },
              { label: "Agentes Operacionais", value: "225", delta: "20 squads · 10 departamentos prontos", icon: Sparkles, tag: "Hoje" },
              { label: "Idiomas Suportados", value: "14", delta: "Infra i18n nativa — pronta p/ global", icon: Target, tag: "Hoje" },
              { label: "MRR Projetado 12m", value: "R$ 1,2M", delta: "Pós Pré-Seed · 800 tenants alvo", icon: TrendingUp, tag: "Meta" },
              { label: "Gross Margin", value: "82%", delta: "SaaS top-quartile (modelo)", icon: PieChart, tag: "Modelo" },
              { label: "CAC Blended", value: "R$ 180", delta: "Payback <1 mês (premissa)", icon: DollarSign, tag: "Premissa" },
              { label: "LTV / CAC", value: "40x", delta: "Benchmark mercado: 3x+", icon: LineChart, tag: "Modelo" },
              { label: "Burn Multiple", value: "0,4x", delta: "Eficiência by design", icon: Zap, tag: "Meta" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="p-6 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{m.label}</div>
                  <m.icon className="h-4 w-4 text-primary/70" />
                </div>
                <div className="text-3xl font-bold tracking-tight mb-1">{m.value}</div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-primary">{m.delta}</div>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-border bg-card/50 text-muted-foreground shrink-0">
                    {m.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="grid md:grid-cols-3 gap-4">
            {[
              { when: "Hoje", title: "MVP em produção", desc: "Plataforma funcional · 225 agentes · 14 idiomas · zero clientes pagantes", done: true },
              { when: "Q1 2026", title: "Pré-Seed · R$ 200k", desc: "Capital para destravar GTM e converter pilotos em receita recorrente" },
              { when: "Q3 2026", title: "Seed Round", desc: "R$ 800k · meta 5k tenants · MRR R$ 600k · expansão LATAM" },
              { when: "Q2 2027", title: "Série A", desc: "R$ 2M · meta 30k tenants · MRR R$ 4M · Europa + US" },
              { when: "Q4 2027", title: "Marketplace público", desc: "Receita de terceiros >15% do GMV de agentes" },
              { when: "Q4 2028", title: "100k usuários · R$ 15M MRR", desc: "Liderança consolidada em PT/ES/IT e top-3 em EN" },
            ].map((mk, i) => (
              <motion.div
                key={mk.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{mk.when}</span>
                  {mk.done && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono">EM ROTA</span>}
                </div>
                <h3 className="font-bold mb-2">{mk.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mk.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <ParallaxBand
        image={parallaxOrb}
        eyebrow="A Tese"
        title="A próxima década é de agentes, não de ferramentas"
        subtitle="Empresas vão comprar resultado entregue por IA autônoma — não mais software para humanos operarem. Clauthor está construído para essa transição."
      />

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
              { icon: ShieldCheck, t: "Audit Trail Criptográfico", d: "SHA-256 hash chain imutável único no mercado para compliance enterprise." },
              { icon: Sparkles, t: "Outcome-Based Pricing", d: "Cliente paga por resultado entregue, não por seat alinhamento total." },
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


      {/* Unfair Advantage G8 Prospect */}
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

      <ParallaxBand
        image={parallaxGlobal}
        eyebrow="Mercado Endereçável"
        title="US$ 47B em IA workforce até 2030"
        subtitle="Nascemos multilíngues e multi-região. A mesma plataforma atende um SaaS em São Paulo, uma agência em Milão e uma fintech em Miami."
        align="left"
      />

      {/* GLOBAL REACH */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Alcance Global</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">12+ Países, 14+ Idiomas</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
              América do Sul, América do Norte e Europa Clauthor já fala a língua dos seus clientes desde o dia 1.
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

      {/* DEPARTMENT COST COMPARISON */}
      <section id="comparativo-departamento" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">Custo Real vs Clauthor</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Um departamento de 20 pessoas custa <span className="text-primary">R$ 240K/mês</span></h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Na Clauthor, o mesmo departamento (20 agentes especializados, 24/7, multilíngue) custa a partir de <strong className="text-foreground">R$ 1.997/mês</strong>. É <strong className="text-primary">120× mais barato</strong> e entrega mais.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Traditional */}
            <motion.div {...fadeUp} className="relative p-10 rounded-2xl bg-card/40 border border-border/60 overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono uppercase tracking-wider">Modelo Antigo</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Departamento Humano</div>
              <h3 className="text-2xl font-bold mb-6">20 pessoas CLT</h3>
              <div className="text-5xl font-bold text-foreground mb-2">R$ 240.000</div>
              <div className="text-sm text-muted-foreground mb-8">/mês · R$ 2,88M por ano</div>
              <ul className="space-y-3 text-sm">
                {[
                  "20 salários médios (R$ 8K) + encargos (70%) = R$ 13,6K/pessoa",
                  "Horário comercial limitado (8h/dia, 5 dias)",
                  "Férias, atestados, turnover ~25% ao ano",
                  "Treinamento contínuo, onboarding 3-6 meses",
                  "Infra física, software, BI, gestão de pessoas",
                  "Escala = contratar mais gente (linear e lento)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-muted-foreground">
                    <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Clauthor */}
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="relative p-10 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/40 overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono uppercase tracking-wider">Clauthor</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-3">Departamento de IA</div>
              <h3 className="text-2xl font-bold mb-6">20 agentes autônomos</h3>
              <div className="text-5xl font-bold text-foreground mb-2">R$ 1.997</div>
              <div className="text-sm text-muted-foreground mb-8">/mês · R$ 23,9K por ano</div>
              <ul className="space-y-3 text-sm">
                {[
                  "Squad completo pré-treinado (Vendas, Marketing, etc.)",
                  "Operação 24/7/365 sem pausas, em 14 idiomas",
                  "Zero turnover, zero férias, zero RH",
                  "Onboarding em minutos com memória hierárquica",
                  "Infra, integrações e BI incluídos",
                  "Escala instantânea: 1 ou 1.000 tarefas em paralelo",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-foreground/90">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Headline savings */}
          <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: "120×", l: "Mais barato" },
              { v: "R$ 238K", l: "Economia mensal" },
              { v: "R$ 2,85M", l: "Economia anual" },
              { v: "< 24h", l: "Para ativar squad" },
            ].map((s) => (
              <div key={s.l} className="p-6 rounded-xl bg-background border border-border/60 text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{s.v}</div>
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
            * Base: salário médio CLT R$ 8.000 + 70% encargos (FGTS, INSS, 13º, férias, vale-transporte, vale-refeição). Fonte: Catho / Glassdoor / pesquisa Robert Half 2025.
          </p>
        </div>
      </section>

      <ParallaxBand
        image={parallaxDatacenter}
        eyebrow="Infraestrutura Pronta"
        title="Construído para escalar do dia 1"
        subtitle="225 agentes, edge functions serverless, memória hierárquica em pgvector e roteamento multi-modelo — a stack já suporta milhares de tenants sem refactor."
      />

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
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">A Rodada · 1ª Captação Externa</div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Pré-Seed: R$ 200K por 10%
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Esta é a <span className="text-foreground font-semibold">1ª rodada externa</span> da Clauthor — todo o MVP foi construído com <span className="text-foreground font-semibold">investimento próprio do fundador</span>, sem FFF nem anjos. Para alcançar <span className="text-foreground font-semibold">100.000 usuários e R$ 15M de MRR</span>, o capital total mapeado é de <span className="text-primary font-semibold">R$ 3 milhões</span>, distribuído em rodadas sequenciais com diluição controlada e marcos de tração validados.
            </p>
          </motion.div>

          {/* Round structure */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { tag: "AGORA · 1ª EXTERNA", round: "Pré-Seed", amount: "R$ 200K", equity: "10%", desc: "Marketing, expansão multilíngue e G8 Prospect em 7 mercados.", highlight: true, muted: false },
              { tag: "Q3 2026", round: "Seed", amount: "R$ 800K", equity: "12-15%", desc: "Escala em LATAM e Europa após 5.000 usuários pagantes.", highlight: false, muted: false },
              { tag: "Q2 2027", round: "Série A", amount: "R$ 2M", equity: "15-18%", desc: "Dominância global em outcome-based AI workforce.", highlight: false, muted: false },
              { tag: "TOTAL", round: "Capital Mapeado", amount: "R$ 3M", equity: "~35%", desc: "Caminho completo até 100K usuários e R$ 15M MRR.", highlight: false, muted: true },
            ].map((r, i) => (
              <motion.div
                key={r.round}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className={`relative p-8 rounded-2xl border transition-all ${r.highlight ? "border-primary bg-primary/5 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.5)]" : r.muted ? "border-dashed border-border/60 bg-background/40" : "border-border/60 bg-background"}`}
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
                  10% reflete um valuation pré-money de <strong className="text-foreground">R$ 1,8M</strong> abaixo do múltiplo de mercado para SaaS de IA com tração comprovada, dando ao investidor pré-seed espaço significativo de upside.
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
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="text-xl font-bold">{a.title}</h4>
                    {a.help && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Saiba mais sobre ${a.title}`}
                            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full border border-border/60 bg-background/60 backdrop-blur hover:bg-primary/10 hover:border-primary/40 transition-colors"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-80 text-sm leading-relaxed">
                          <div className="font-semibold mb-2">{a.title}</div>
                          <p className="text-muted-foreground">{a.help}</p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
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

      {/* Closing — strong narrative, no CTA */}
      <section id="contact" className="relative py-40 px-6 bg-card/30 border-t border-border/40 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_65%)] blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-8">O Próximo Capítulo</div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-10 leading-[1.05]">
              A próxima década<br />
              <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                não vai ser construída por software.
              </span><br />
              Vai ser construída por agentes.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light mb-12">
              Clauthor já tem a arquitetura, os 225 agentes, a memória hierárquica e o modelo de cobrança por resultado.
              <br className="hidden md:block" />
              O que falta agora é apenas <span className="text-foreground font-medium">capital para escalar o inevitável.</span>
            </p>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/30 bg-primary/5 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground">
                Quem entra agora, define o padrão da próxima década.
              </span>
            </div>
          </motion.div>
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

      {/* Thor — guia ao vivo (mesmo do painel) */}
      <ThorLiveGuide activeSection="investidores" onNavigate={() => {}} onDismiss={() => {}} />
    </div>
  );

};

export default InvestorPitch;
