import { useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRIMARY = "217 91% 45%"; // legal blue
const PRIMARY_DARK = "222 47% 18%";

const agents = [
  {
    icon: MessageSquare,
    name: "Especialista em Captação Jurídica",
    role: "Capta & qualifica leads 24/7",
    bullets: [
      "Atende leads via WhatsApp, site e landing pages",
      "Qualifica caso e área do direito",
      "Agenda atendimento direto na agenda do advogado",
    ],
    example: '"Olá, recebi sua mensagem sobre rescisão. Posso te fazer 3 perguntas rápidas para encaminhar ao Dr. Paulo?"',
  },
  {
    icon: ClipboardCheck,
    name: "Consultor de Diagnóstico Jurídico",
    role: "Pré-atendimento estruturado",
    bullets: [
      "Conduz a triagem inicial do caso",
      "Identifica fatos, prazos e documentos necessários",
      "Educa o cliente sobre o processo — sem orientação definitiva",
    ],
    example: '"Pelo que você me contou, parece um caso da área trabalhista. Vou organizar o resumo para o advogado validar."',
  },
  {
    icon: ShieldAlert,
    name: "Analista de Risco Contratual",
    role: "Lê contratos em segundos",
    bullets: [
      "Análise automatizada de contratos e documentos",
      "Identifica cláusulas críticas e ambiguidades",
      "Gera relatório de risco para revisão humana",
    ],
    example: '"Identifiquei 4 pontos de atenção: cláusula 7.2 (multa desproporcional), 11 (foro abusivo)... revisar com o advogado."',
  },
  {
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
    icon: RefreshCw,
    name: "Gestor de Recuperação de Leads",
    role: "Reativa oportunidades perdidas",
    bullets: [
      "Follow-ups humanizados e cadenciados",
      "Reagenda no-shows automaticamente",
      "Reativa leads frios com novos gatilhos",
    ],
    example: '"Oi João, vi que conversamos há 5 dias sobre o seu caso. Ainda faz sentido conversarmos esta semana?"',
  },
  {
    icon: FileText,
    name: "Assistente de Produção Jurídica",
    role: "Apoio operacional, não substitui o advogado",
    bullets: [
      "Minutas e rascunhos de peças",
      "Pesquisa de jurisprudência (validação humana obrigatória)",
      "Organização de documentos do caso",
    ],
    example: '"Rascunhei a contestação com base no caso. Revise antes de protocolar — não substitui sua análise final."',
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

const plans = [
  {
    name: "Start",
    setup: "R$ 1.997",
    monthly: "R$ 497",
    desc: "Para advogados autônomos validando o modelo",
    features: [
      "2 agentes ativos (Captação + Diagnóstico)",
      "Integração WhatsApp",
      "Até 200 atendimentos/mês",
      "Suporte por e-mail",
    ],
    cta: "Começar agora",
    highlight: false,
  },
  {
    name: "Growth",
    setup: "R$ 3.997",
    monthly: "R$ 997",
    desc: "Escritórios em crescimento que querem previsibilidade",
    features: [
      "4 agentes ativos",
      "WhatsApp + CRM + Assinatura digital",
      "Até 800 atendimentos/mês",
      "Recuperação automática de leads",
      "Suporte prioritário",
    ],
    cta: "Ativar minha máquina jurídica",
    highlight: true,
  },
  {
    name: "Scale",
    setup: "R$ 7.997+",
    monthly: "R$ 1.997+",
    desc: "Escritórios consolidados que querem escalar",
    features: [
      "Squad jurídica completa (6 agentes)",
      "Integrações ilimitadas",
      "Atendimentos ilimitados",
      "Onboarding dedicado",
      "Gerente de sucesso",
    ],
    cta: "Falar com especialista",
    highlight: false,
  },
];

export default function Advocacia() {
  useEffect(() => {
    document.title = "Squad Jurídica com IA — Mais clientes para seu escritório | Clauthor";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Transforme seu escritório de advocacia em uma operação previsível de captação e conversão. 6 agentes de IA especializados, 24/7, com ética OAB."
      );
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ ["--legal" as any]: PRIMARY, ["--legal-dark" as any]: PRIMARY_DARK }}
    >
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--legal)) 0, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--legal-dark)) 0, transparent 50%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge
              variant="outline"
              className="mb-6 border-slate-300 text-slate-700 bg-white/80 backdrop-blur"
              style={{ borderColor: `hsl(var(--legal) / 0.3)`, color: `hsl(var(--legal))` }}
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              Solução para Escritórios de Advocacia
            </Badge>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
              Transforme seu escritório em uma{" "}
              <span style={{ color: `hsl(var(--legal))` }}>máquina previsível</span> de novos clientes.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed">
              Uma squad de 6 agentes de IA jurídica especializados em <strong>captação, qualificação e
              fechamento</strong> — operando 24/7, com ética OAB e validação humana em todas as decisões.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="text-white shadow-lg shadow-blue-900/20 h-12 px-7 text-base"
                style={{ backgroundColor: `hsl(var(--legal))` }}
                asChild
              >
                <a href="#planos">
                  Ativar minha máquina jurídica
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base border-slate-300 text-slate-700 hover:bg-slate-50"
                asChild
              >
                <a href="#agentes">Conhecer a squad</a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-500">
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
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              Você reconhece esses problemas?
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Os mesmos gargalos travam 9 em cada 10 escritórios — independentemente da área de atuação.
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
                <Card className="p-6 bg-white border-slate-200 flex items-start gap-4 hover:border-slate-300 transition-colors">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `hsl(var(--legal) / 0.08)`, color: `hsl(var(--legal))` }}
                  >
                    <p.icon className="w-5 h-5" />
                  </div>
                  <p className="text-slate-700 font-medium pt-1.5">{p.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Badge
            variant="outline"
            className="mb-5"
            style={{ borderColor: `hsl(var(--legal) / 0.3)`, color: `hsl(var(--legal))` }}
          >
            A Solução
          </Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 max-w-3xl mx-auto">
            Seu time jurídico com IA — operando enquanto você dorme.
          </h2>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Não é mais uma ferramenta. É uma squad completa, integrada ao seu WhatsApp, CRM e fluxo de trabalho —
            com responsabilidades claras e fronteiras éticas.
          </p>
        </div>
      </section>

      {/* AGENTES */}
      <section id="agentes" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              Conheça os 6 agentes da squad
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Cada agente tem função, fluxo e tom próprios. Nenhum substitui o advogado — todos amplificam.
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
                <Card className="p-6 h-full bg-white border-slate-200 hover:shadow-lg hover:shadow-blue-900/5 hover:border-slate-300 transition-all flex flex-col">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: `hsl(var(--legal) / 0.08)`,
                      color: `hsl(var(--legal))`,
                    }}
                  >
                    <a.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 leading-tight">{a.name}</h3>
                  <p className="text-sm mt-1" style={{ color: `hsl(var(--legal))` }}>
                    {a.role}
                  </p>
                  <ul className="mt-4 space-y-2 flex-1">
                    {a.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: `hsl(var(--legal))` }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Exemplo</p>
                    <p className="text-sm text-slate-700 italic leading-relaxed">{a.example}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Ética */}
          <Card
            className="mt-10 p-6 border-2 bg-white"
            style={{ borderColor: `hsl(var(--legal) / 0.2)` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(var(--legal) / 0.08)`, color: `hsl(var(--legal))` }}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Compromisso ético</h4>
                <p className="text-sm text-slate-600 mt-1">
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
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              O que muda no seu escritório
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <Card
                key={i}
                className="p-6 bg-white border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `hsl(var(--legal) / 0.08)`, color: `hsl(var(--legal))` }}
                >
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{b.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CREDIBILIDADE */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-wider text-slate-500 mb-6">Construído sobre boas práticas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-slate-600">
            {[
              { v: "OAB", l: "Código de Ética respeitado" },
              { v: "LGPD", l: "Dados de clientes protegidos" },
              { v: "24/7", l: "Atendimento ininterrupto" },
              { v: "100%", l: "Validação humana" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-semibold" style={{ color: `hsl(var(--legal))` }}>
                  {s.v}
                </div>
                <div className="text-sm mt-1 text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
              Planos para cada estágio do escritório
            </h2>
            <p className="mt-3 text-slate-600 text-lg">
              Setup único + mensalidade. Cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <Card
                key={i}
                className={`p-7 flex flex-col bg-white transition-all ${
                  p.highlight
                    ? "border-2 shadow-xl shadow-blue-900/10 scale-[1.02] relative"
                    : "border border-slate-200"
                }`}
                style={p.highlight ? { borderColor: `hsl(var(--legal))` } : {}}
              >
                {p.highlight && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-white"
                    style={{ backgroundColor: `hsl(var(--legal))` }}
                  >
                    Mais escolhido
                  </Badge>
                )}
                <h3 className="text-xl font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-500 mt-1 min-h-[40px]">{p.desc}</p>

                <div className="mt-6 pb-6 border-b border-slate-100">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Setup único</div>
                  <div className="text-2xl font-semibold text-slate-900 mt-1">{p.setup}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mt-4">Mensalidade</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-semibold text-slate-900">{p.monthly}</span>
                    <span className="text-sm text-slate-500">/mês</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: `hsl(var(--legal))` }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`mt-7 w-full h-11 ${p.highlight ? "text-white" : ""}`}
                  variant={p.highlight ? "default" : "outline"}
                  style={
                    p.highlight
                      ? { backgroundColor: `hsl(var(--legal))` }
                      : { borderColor: `hsl(var(--legal) / 0.3)`, color: `hsl(var(--legal))` }
                  }
                  asChild
                >
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRAÇÕES */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-semibold text-slate-900">Integra com o que você já usa</h3>
          <p className="text-slate-600 mt-2">WhatsApp Business · CRMs jurídicos · Assinatura digital · Google Agenda</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["WhatsApp Business", "CRM Jurídico", "Assinatura Digital", "Google Agenda", "Drive"].map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="px-4 py-2 text-sm bg-white border-slate-300 text-slate-700"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="py-24 text-white relative overflow-hidden"
        style={{ backgroundColor: `hsl(var(--legal-dark))` }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, hsl(var(--legal)) 0, transparent 50%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Seu próximo cliente está chegando agora.
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            Enquanto você lê esta página, escritórios concorrentes estão respondendo leads em segundos.
            Ative sua squad jurídica em até 7 dias.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white hover:bg-slate-100 h-12 px-7 text-base"
              style={{ color: `hsl(var(--legal-dark))` }}
              asChild
            >
              <a href="#planos">
                Ativar minha máquina jurídica
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base border-white/30 text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link to="/auth">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="py-10 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4" style={{ color: `hsl(var(--legal))` }} />
            Clauthor · Squad Jurídica com IA
          </div>
          <div className="flex gap-6">
            <Link to="/termos" className="hover:text-slate-900">Termos</Link>
            <Link to="/privacidade" className="hover:text-slate-900">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
