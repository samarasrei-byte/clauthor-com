import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Globe2,
  Users,
  Cpu,
  Lock,
  GitBranch,
  HeadphonesIcon,
  FileCheck,
  Workflow,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Segurança & Compliance",
    desc: "SSO/SAML, SCIM, RBAC granular, criptografia em repouso e trânsito, logs imutáveis, data residency configurável.",
    bullets: ["LGPD/GDPR/SOC2-ready", "Trilhas de auditoria assinadas", "Isolamento multi-tenant por região"],
  },
  {
    icon: Cpu,
    title: "Workforce Dedicada",
    desc: "Squads de IA exclusivas treinadas no seu domínio, com memória corporativa e governança proprietária.",
    bullets: ["Até 225 agentes especializados", "Fine-tuning com seus dados", "Modelos privados (Claude/GPT/Gemini)"],
  },
  {
    icon: Workflow,
    title: "Integrações Profundas",
    desc: "Conectores nativos para SAP, Salesforce, Oracle, Microsoft 365 e qualquer sistema via API/MCP.",
    bullets: ["VPC peering & PrivateLink", "Webhooks bidirecionais", "MCP Server white-label"],
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte White-Glove",
    desc: "Customer Success dedicado, SLA 99.9%, onboarding executivo e arquiteto de soluções in-house.",
    bullets: ["SLA contratual 99.9%", "TAM dedicado 24/7", "Treinamento on-site"],
  },
];

const useCases = [
  { title: "Centros de Serviços Compartilhados", desc: "Automatize finanças, RH e compras com squads de 20+ agentes orquestrados." },
  { title: "Operações Multinacionais", desc: "Atendimento e back-office em 14+ idiomas, 24/7, com qualidade consistente." },
  { title: "Bancos & Seguradoras", desc: "Análise de crédito, KYC, sinistros e compliance com auditoria criptográfica." },
  { title: "Indústria & Logística", desc: "Otimização de cadeia, previsão de demanda e atendimento técnico autônomo." },
  { title: "Saúde & Farma", desc: "Triagem, agendamento, faturamento TISS e suporte regulatório com trilha completa." },
  { title: "Jurídico Corporativo", desc: "Squad Jurídica integrada com OpenClaw, Astrea e DocuSign — peças, prazos e contratos." },
];

const compliance = ["LGPD", "GDPR", "SOC 2 Type II*", "ISO 27001*", "HIPAA-ready*", "PCI DSS*"];

const Enterprise = () => {
  return (
    <>
      <SEO
        title="Clauthor Enterprise — AI Workforce for Large Organizations"
        description="Dedicated AI squads, white-glove support, SSO, SCIM, VPC peering and signed audit trails. Built for Fortune 500 and large enterprises."
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/[0.06] blur-[120px]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <motion.div {...fadeUp} className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Enterprise</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.05]">
              A força de trabalho de IA<br />
              <span className="text-primary">para grandes corporações.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
              Squads dedicadas, governança bancária, integrações com seu stack legado e suporte
              white-glove. Construído para operar em escala global com compliance auditável.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="mailto:enterprise@clauthor.com?subject=Demo%20Enterprise">
                <Button size="lg" className="h-12 px-6 rounded-full text-[14px]">
                  Falar com vendas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
              <Link to="/pricing">
                <Button variant="ghost" size="lg" className="h-12 px-6 rounded-full text-[14px]">
                  Ver planos
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-[12px] text-muted-foreground font-mono">
              Pilotos a partir de 30 dias · Contratos anuais · Faturamento corporativo
            </p>
          </motion.div>
        </section>

        {/* Pillars */}
        <section className="py-24 px-6 bg-card/30 border-y border-border/40">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-16">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-4">
                Por que Enterprise
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Quatro pilares não-negociáveis
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="group p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 transition-all duration-500"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
                      <ul className="space-y-1.5">
                        {p.bullets.map((b) => (
                          <li key={b} className="flex items-center gap-2 text-[13px] text-foreground/80">
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-16">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-4">
                Casos de uso
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Construído para operações complexas
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {useCases.map((u, i) => (
                <motion.div
                  key={u.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                  className="p-6 rounded-xl bg-card/40 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <h3 className="text-[15px] font-semibold mb-2">{u.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{u.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-20 px-6 bg-card/30 border-y border-border/40">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div {...fadeUp}>
              <Lock className="h-8 w-8 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Compliance que seu jurídico aprova
              </h2>
              <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
                Arquitetura preparada para auditorias externas. Itens marcados com * em roadmap de
                certificação para Q3/2026.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {compliance.map((c) => (
                  <span
                    key={c}
                    className="px-4 py-2 rounded-full border border-border/60 bg-background text-[12px] font-mono uppercase tracking-wider text-foreground/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats / commitment */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: "225+", label: "Agentes especializados" },
              { icon: Globe2, value: "14+", label: "Idiomas nativos" },
              { icon: GitBranch, value: "99.9%", label: "SLA contratual" },
              { icon: FileCheck, value: "100%", label: "Auditoria criptográfica" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
              >
                <s.icon className="h-5 w-5 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold tracking-tight mb-1">{s.value}</div>
                <div className="text-[12px] text-muted-foreground font-mono uppercase tracking-wider">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 border-t border-border/40">
          <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Vamos desenhar sua workforce de IA.
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Agende uma sessão executiva de 45 min com nosso time de arquitetos. Saímos com um
              piloto desenhado para sua operação.
            </p>
            <a href="mailto:enterprise@clauthor.com?subject=Sess%C3%A3o%20Executiva%20Enterprise">
              <Button size="lg" className="h-12 px-8 rounded-full text-[14px]">
                Agendar sessão executiva
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default Enterprise;
