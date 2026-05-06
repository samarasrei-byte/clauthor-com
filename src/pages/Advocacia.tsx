import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale,
  MessageSquare,
  ClipboardCheck,
  ShieldAlert,
  Handshake,
  RefreshCw,
  FileText,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingUp,
  Users,
  Sparkles,
  Lock,
  Zap,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ClauthorLogo from "@/components/ClauthorLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { HireIntent } from "@/pages/Auth";

// Squad oficial — 6 agentes alinhados aos slugs do plano Growth (sem duplicidade)
const agents = [
  {
    slug: "captacao_juridica",
    icon: MessageSquare,
    name: "Especialista em Captação Jurídica",
    role: "Capta leads 24/7",
    bullets: [
      "Atende leads via WhatsApp, site e landing pages",
      "Identifica área do direito e urgência do caso",
      "Agenda atendimento direto na agenda do advogado",
    ],
    example: '"Olá, recebi sua mensagem sobre rescisão. Posso te fazer 3 perguntas rápidas para encaminhar ao Dr. Paulo?"',
  },
  {
    slug: "qualificacao_juridica",
    icon: ClipboardCheck,
    name: "Especialista em Qualificação Jurídica",
    role: "Triagem estruturada do caso",
    bullets: [
      "Conduz triagem inicial e qualifica o caso",
      "Identifica fatos, prazos e documentos necessários",
      "Educa o cliente sobre o processo, sem orientação definitiva",
    ],
    example: '"Pelo que você me contou, parece um caso trabalhista. Vou organizar o resumo para o advogado validar."',
  },
  {
    slug: "fechamento_juridico",
    icon: Handshake,
    name: "Especialista em Fechamento Jurídico",
    role: "Conduz a contratação",
    bullets: [
      "Gera propostas personalizadas com honorários",
      "Conduz objeções com argumentação técnica",
      "Encaminha contrato e link de pagamento",
    ],
    example: '"Preparei sua proposta de honorários: entrada + êxito. Posso te enviar agora pelo WhatsApp?"',
  },
  {
    slug: "risco_contratual",
    icon: ShieldAlert,
    name: "Analista de Risco Contratual",
    role: "Lê contratos em segundos",
    bullets: [
      "Análise automatizada de contratos e documentos",
      "Identifica cláusulas críticas e ambiguidades",
      "Gera relatório de risco para revisão humana",
    ],
    example: '"Identifiquei 4 pontos de atenção: cláusula 7.2 (multa desproporcional), 11 (foro abusivo). Revisar com o advogado."',
  },
  {
    slug: "producao_juridica",
    icon: FileText,
    name: "Assistente de Produção Jurídica",
    role: "Apoio operacional ao advogado",
    bullets: [
      "Minutas e rascunhos de peças",
      "Pesquisa de jurisprudência com validação humana obrigatória",
      "Organização de documentos do caso",
    ],
    example: '"Rascunhei a contestação com base no caso. Revise antes de protocolar; não substitui sua análise final."',
  },
  {
    slug: "relacionamento_juridico",
    icon: RefreshCw,
    name: "Gestor de Relacionamento Jurídico",
    role: "Pós-venda e reativação",
    bullets: [
      "Follow-ups humanizados e cadenciados",
      "Reagenda no-shows automaticamente",
      "Reativa leads frios e mantém clientes engajados",
    ],
    example: '"Oi João, vi que conversamos há 5 dias sobre o seu caso. Ainda faz sentido conversarmos esta semana?"',
  },
];

const pains = [
  { icon: Users, text: "Falta de novos clientes previsíveis" },
  { icon: Clock, text: "Leads que somem antes do atendimento" },
  { icon: TrendingUp, text: "Tempo demais em tarefas operacionais" },
  { icon: ShieldAlert, text: "Risco de perder prazos e oportunidades" },
];

const benefits = [
  { icon: Users, title: "Mais clientes", desc: "Captação ativa 24/7 via WhatsApp e landing pages" },
  { icon: TrendingUp, title: "Mais conversão", desc: "Triagem qualificada antes de chegar ao advogado" },
  { icon: Clock, title: "Menos tempo perdido", desc: "Operação delegada à IA, advogado foca no que importa" },
  { icon: Zap, title: "Atendimento 24/7", desc: "Nunca mais perde um lead por demora na resposta" },
];

// Agent slugs from workforceArchitecture (advocacia department)
const plans: Array<{
  name: string;
  setup: string;
  monthlyLabel: string;
  monthlyValue: number;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
  intent: HireIntent | null;
}> = [
  {
    name: "Start",
    setup: "R$ 1.497",
    monthlyLabel: "R$ 497",
    monthlyValue: 49700,
    desc: "Advogado autônomo validando captação previsível",
    features: [
      "2 agentes (Captação + Diagnóstico)",
      "Integração WhatsApp Business",
      "Até 200 atendimentos/mês",
      "Prompts OAB-compliant + auditoria",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    highlight: false,
    intent: {
      type: "squad",
      label: "Squad Jurídica - Start",
      slugs: ["captacao_juridica", "diagnostico_juridico"],
      departmentId: "advocacia",
      monthlyOverride: 49700,
      setupFee: 149700,
    },
  },
  {
    name: "Growth",
    setup: "R$ 3.497",
    monthlyLabel: "R$ 1.497",
    monthlyValue: 149700,
    desc: "Escritórios em crescimento que querem previsibilidade",
    features: [
      "6 agentes (squad jurídica completa)",
      "WhatsApp + CRM + Clicksign incluídos",
      "Até 800 atendimentos/mês",
      "Recuperação automática + análise de risco",
      "Suporte prioritário + onboarding guiado",
    ],
    cta: "Ativar minha máquina jurídica",
    highlight: true,
    intent: {
      type: "squad",
      label: "Squad Jurídica - Growth",
      slugs: ["captacao_juridica", "diagnostico_juridico", "fechamento_juridico", "recuperacao_leads_juridico", "risco_contratual", "producao_juridica"],
      departmentId: "advocacia",
      monthlyOverride: 149700,
      setupFee: 349700,
    },
  },
  {
    name: "Compliance",
    setup: "R$ 5.997",
    monthlyLabel: "R$ 2.497",
    monthlyValue: 249700,
    desc: "Growth + Operacional + LGPD/Anti-PLD para escritórios empresariais",
    features: [
      "8 agentes (squad completa + Operacional + Compliance)",
      "KYC reforçado PF/PJ + beneficiário final",
      "Monitoramento PEP, OFAC, ONU e COAF",
      "Relatórios LGPD (RIPD) e PLD prontos",
      "Até 1.500 atendimentos/mês",
      "Onboarding dedicado + gerente de conta",
    ],
    cta: "Blindar meu escritório",
    highlight: false,
    intent: {
      type: "squad",
      label: "Squad Jurídica - Compliance",
      slugs: ["captacao_juridica", "diagnostico_juridico", "fechamento_juridico", "recuperacao_leads_juridico", "risco_contratual", "producao_juridica", "assistente_juridico_operacional", "compliance_lgpd_juridico"],
      departmentId: "advocacia",
      monthlyOverride: 249700,
      setupFee: 599700,
    },
  },
  {
    name: "MCP Enterprise",
    setup: "R$ 9.997",
    monthlyLabel: "R$ 4.997",
    monthlyValue: 499700,
    desc: "Sistema operacional jurídico completo com arquitetura MCP — 14 agentes orquestrados",
    features: [
      "14 agentes (squad comercial + 6 agentes MCP especializados)",
      "Orquestrador inteligente: Segurança, Processual, Prazos, Redator, Estratégico, Financeiro",
      "Validação obrigatória de segurança em cada ação (LGPD + sigilo OAB)",
      "Cálculo automático de prazos com feriados forenses",
      "Análise estratégica com probabilidade de êxito",
      "Atendimentos ilimitados + SLA dedicado",
      "Onboarding white-glove + integração com sistema do escritório",
    ],
    cta: "Operar com MCP",
    highlight: false,
    intent: {
      type: "squad",
      label: "Squad Jurídica - MCP Enterprise",
      slugs: [
        "captacao_juridica",
        "diagnostico_juridico",
        "fechamento_juridico",
        "recuperacao_leads_juridico",
        "risco_contratual",
        "producao_juridica",
        "assistente_juridico_operacional",
        "compliance_lgpd_juridico",
        "mcp_seguranca_juridico",
        "mcp_processual_juridico",
        "mcp_prazos_juridico",
        "mcp_redator_juridico",
        "mcp_estrategico_juridico",
        "mcp_financeiro_juridico",
      ],
      departmentId: "advocacia",
      monthlyOverride: 499700,
      setupFee: 999700,
    },
  },
];

export default function Advocacia() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Squad Jurídica com IA - Mais clientes para seu escritório | Clauthor";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Transforme seu escritório de advocacia em uma operação previsível de captação e conversão. Squad jurídica de IA com ética OAB e validação humana."
      );
    }
  }, []);

  const handleHire = (plan: (typeof plans)[number]) => {
    if (!plan.intent) {
      // Scale → contact sales
      window.location.href = "mailto:contato@clauthor.com?subject=Plano%20Scale%20Advocacia";
      return;
    }

    // Persist intent so checkout flow picks it up post-auth
    localStorage.setItem("hireIntent", JSON.stringify(plan.intent));
    // Flag so post-payment redirect lands on the onboarding wizard, not generic dashboard
    localStorage.setItem("advocacia_post_checkout", "1");

    if (user) {
      toast.success("Redirecionando para o painel do advogado...");
      navigate("/advocacia/painel");
    } else {
      navigate("/auth", {
        state: { hireIntent: plan.intent, signup: true, from: { pathname: "/advocacia/painel" } },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ClauthorLogo size="md" />
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border/60 pl-2 ml-1">
              para Advocacia
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#agentes" className="hidden md:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Squad
            </a>
            <a href="#planos" className="hidden md:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Planos
            </a>
            <ThemeToggle />
            <Button size="sm" variant="outline" asChild className="border-border/60">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" className="glow" asChild>
              <a href="#planos">Começar</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 text-primary bg-primary/5 backdrop-blur"
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              Solução para Escritórios de Advocacia
            </Badge>

            <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight leading-[1.05]">
              Transforme seu escritório em uma{" "}
              <span className="text-primary">máquina previsível</span> de novos clientes.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Uma squad de agentes de IA jurídica especializados em <strong className="text-foreground">captação, qualificação e
              fechamento</strong> - operando 24/7, com ética OAB e validação humana em todas as decisões.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="glow h-12 px-7 text-base" asChild>
                <a href="#planos">
                  Ativar minha máquina jurídica
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base border-border/60"
                asChild
              >
                <a href="#agentes">Conhecer a squad</a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" /> Ética OAB
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Validação humana obrigatória
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Setup em até 7 dias
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOR */}
      <section className="py-20 bg-card/30 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Você reconhece esses problemas?
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Os mesmos gargalos travam 9 em cada 10 escritórios - independentemente da área de atuação.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pains.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 bg-card/60 border-border/40 flex items-start gap-4 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <p className="text-foreground/90 font-medium pt-1.5">{p.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Badge variant="outline" className="mb-5 border-primary/30 text-primary">
            A Solução
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight max-w-3xl mx-auto">
            Seu time jurídico com IA - operando enquanto você dorme.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Não é mais uma ferramenta. É uma squad completa, integrada ao seu WhatsApp, CRM e fluxo de trabalho -
            com responsabilidades claras e fronteiras éticas.
          </p>
        </div>
      </section>

      {/* AGENTES */}
      <section id="agentes" className="py-20 bg-card/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Conheça a squad jurídica completa
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Cada agente tem função, fluxo e tom próprios. Nenhum substitui o advogado - todos amplificam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="p-6 h-full bg-card/60 border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col relative">
                  {(a as any).exclusive && (
                    <Badge className="absolute top-4 right-4 bg-primary/15 text-primary border border-primary/30 text-[10px] uppercase tracking-wider">
                      Exclusivo {(a as any).exclusive}
                    </Badge>
                  )}
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 bg-primary/10 text-primary">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold leading-tight pr-20">{a.name}</h3>
                  <p className="text-sm mt-1 text-primary">{a.role}</p>
                  <ul className="mt-4 space-y-2 flex-1">
                    {a.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-border/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2">Exemplo</p>
                    <p className="text-sm text-foreground/80 italic leading-relaxed">{a.example}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Ética */}
          <Card className="mt-10 p-6 border-2 border-primary/20 bg-card/60">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Compromisso ético</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum agente fornece aconselhamento jurídico definitivo. Toda peça, parecer ou orientação técnica
                  passa por validação obrigatória do advogado responsável. Operamos dentro das diretrizes do Código de
                  Ética e Disciplina da OAB.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              O que muda no seu escritório
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <Card
                key={i}
                className="p-6 bg-card/60 border-border/40 hover:border-primary/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 bg-primary/10 text-primary">
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CREDIBILIDADE */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-6">Construído sobre boas práticas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: "OAB", l: "Código de Ética respeitado" },
              { v: "LGPD", l: "Dados de clientes protegidos" },
              { v: "24/7", l: "Atendimento ininterrupto" },
              { v: "100%", l: "Validação humana" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-display font-semibold text-primary">{s.v}</div>
                <div className="text-sm mt-1 text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFORCE MCP — Vitrine completa com 15 agentes (ícones lucide, sem emoji) */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5 text-[10px]">
              Workforce MCP · 15 agentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Toda a squad jurídica orquestrada
            </h2>
            <p className="mt-3 text-muted-foreground text-base">
              7 agentes MCP (núcleo inteligente) + 4 comerciais + 4 operacionais. Sem duplicidade — cada agente tem papel único.
            </p>
            <div className="mt-5">
              <Link to="/apresentacaoadv">
                <Button variant="outline" size="sm" className="h-9">
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Ver apresentação completa
                </Button>
              </Link>
            </div>
          </div>

          {/* Grid 15 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { Icon: Sparkles, name: "Orquestrador MCP", layer: "MCP", desc: "Classifica e roteia em < 800ms" },
              { Icon: Lock, name: "Segurança & LGPD", layer: "MCP", desc: "Validação obrigatória OAB" },
              { Icon: Scale, name: "Processual", layer: "MCP", desc: "Fase + classificação documental" },
              { Icon: Clock, name: "Prazos", layer: "MCP", desc: "CPC art. 219 + feriados" },
              { Icon: FileText, name: "Redator", layer: "MCP", desc: "Peças, contratos, pareceres" },
              { Icon: TrendingUp, name: "Estratégico", layer: "MCP", desc: "Tese + probabilidade de êxito" },
              { Icon: Briefcase, name: "Financeiro", layer: "MCP", desc: "Honorários, custas, relatórios" },
              { Icon: MessageSquare, name: "Captação", layer: "Comercial", desc: "WhatsApp + LP 24/7" },
              { Icon: ClipboardCheck, name: "Diagnóstico", layer: "Comercial", desc: "Triagem estruturada" },
              { Icon: Handshake, name: "Fechamento", layer: "Comercial", desc: "Proposta + contratação" },
              { Icon: RefreshCw, name: "Recuperação", layer: "Comercial", desc: "Reativa leads frios" },
              { Icon: ShieldAlert, name: "Risco Contratual", layer: "Op", desc: "Análise em segundos" },
              { Icon: FileText, name: "Produção Jurídica", layer: "Op", desc: "Minutas + jurisprudência" },
              { Icon: Briefcase, name: "Op. Jurídico", layer: "Op", desc: "Análise + propostas" },
              { Icon: Lock, name: "Compliance KYC/PLD", layer: "Op", desc: "PEP, OFAC, COAF" },
            ].map((a) => {
              const colors =
                a.layer === "MCP"
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : a.layer === "Comercial"
                  ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-500"
                  : "border-amber-500/25 bg-amber-500/5 text-amber-500";
              return (
                <div
                  key={a.name}
                  className="rounded-xl border border-border/50 bg-card p-3.5 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg border ${colors} flex items-center justify-center mb-2.5`}>
                    <a.Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{a.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Risco CRÍTICO exige aprovação humana antes de qualquer ação sensível</span>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
              Planos para cada estágio do escritório
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Setup único + mensalidade. Cancele quando quiser. Pagamento seguro via PayPal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((p, i) => (
              <Card
                key={i}
                className={`p-7 flex flex-col bg-card/60 transition-all ${
                  p.highlight
                    ? "border-2 border-primary shadow-xl shadow-primary/10 scale-[1.02] relative"
                    : "border border-border/40"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Mais escolhido
                  </Badge>
                )}
                <h3 className="text-xl font-display font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{p.desc}</p>

                <div className="mt-6 pb-6 border-b border-border/40">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/70">Setup único</div>
                  <div className="text-2xl font-display font-semibold mt-1">{p.setup}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground/70 mt-4">Mensalidade</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-display font-semibold">{p.monthlyLabel}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`mt-7 w-full h-11 ${p.highlight ? "glow" : ""}`}
                  variant={p.highlight ? "default" : "outline"}
                  onClick={() => handleHire(p)}
                >
                  {p.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Pagamento processado com segurança via PayPal · Cancele a qualquer momento · Sem fidelidade
          </p>
        </div>
      </section>

      {/* INTEGRAÇÕES */}
      <section className="py-20 bg-card/30 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-display font-semibold">Integra com o que você já usa</h3>
          <p className="text-muted-foreground mt-2">WhatsApp Business · CRMs jurídicos · Assinatura digital · Google Agenda</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["WhatsApp Business", "CRM Jurídico", "Assinatura Digital", "Google Agenda", "Drive"].map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="px-4 py-2 text-sm bg-card/60 border-border/60"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden border-t border-border/40">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[400px] bg-primary/40 blur-[140px] rounded-full" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-semibold tracking-tight">
            Seu próximo cliente está chegando agora.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Enquanto você lê esta página, escritórios concorrentes estão respondendo leads em segundos.
            Ative sua squad jurídica em até 7 dias.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="glow h-12 px-7 text-base" asChild>
              <a href="#planos">
                Ativar minha máquina jurídica
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base border-border/60"
              asChild
            >
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="py-10 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            Clauthor · Squad Jurídica com IA
          </div>
          <div className="flex gap-6">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
