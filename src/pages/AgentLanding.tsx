import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgentBySlug } from "@/data/agentLandingData";
import { ArrowRight, Check, XCircle, CheckCircle2, ChevronDown, Zap, Star, Bot } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WORKFORCE } from "@/data/workforceArchitecture";
import type { AgentRole } from "@/data/workforceArchitecture";
import NotFound from "./NotFound";

const findWorkforceAgent = (slug: string): { agent: AgentRole; deptName: string; squadName: string } | null => {
  for (const dept of WORKFORCE) {
    for (const squad of dept.squads) {
      const found = squad.agents.find(a => a.slug === slug);
      if (found) return { agent: found, deptName: dept.name, squadName: squad.name };
    }
  }
  return null;
};

const AgentFallback = ({ data }: { data: { agent: AgentRole; deptName: string; squadName: string } }) => (
  <div className="min-h-screen">
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/[0.06] to-transparent rounded-full blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
            <Bot className="h-4 w-4 mr-2" /> {data.deptName} • {data.squadName}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">{data.agent.name}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Agente especializado em {data.agent.responsibilities.join(", ").toLowerCase()}.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
            <div className="rounded-xl border border-border/30 bg-card/30 p-5">
              <h3 className="font-display text-sm font-bold mb-3">Responsabilidades</h3>
              <ul className="space-y-2 text-left">
                {data.agent.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border/30 bg-card/30 p-5">
              <h3 className="font-display text-sm font-bold mb-3">Gatilhos de Ação</h3>
              <div className="flex flex-wrap gap-2">
                {data.agent.triggers.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{t.replace(/_/g, " ")}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Link to="/auth" state={{ hireIntent: { type: "agent", label: data.agent.name, slugs: [data.agent.slug] } }}>
            <Button size="lg" className="gap-2">
              <Zap className="h-4 w-4" /> Contratar este agente <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  </div>
);

const AgentLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const agent = getAgentBySlug(slug || "");

  if (!agent) {
    const workforceData = findWorkforceAgent(slug || "");
    if (workforceData) return <AgentFallback data={workforceData} />;
    return <NotFound />;
  }

  const Icon = agent.icon;

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle, hsl(266 100% 50%) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/[0.06] to-transparent rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge variant="outline" className="mb-6 border-primary/15 text-primary/80 px-4 py-2">
              <Icon className="h-4 w-4 mr-2" />
              {agent.solutionTitle}
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {agent.heroHeadline.replace(agent.heroHighlight, "|||").split("|||").map((part, i) =>
                i === 0 ? <span key={i}>{part}</span> : <><span key={i} className="gradient-text">{agent.heroHighlight}</span>{part}</>
              )}
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl mx-auto mb-10">{agent.heroSubheadline}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth" state={{ hireIntent: { type: "agent", label: agent.solutionTitle, slugs: [slug] } }}>
                <Button size="lg" className="glow rounded-xl px-8 h-14 text-lg font-semibold">
                  {agent.ctaButton} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/library">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 text-lg border-border hover:border-primary/20">
                  Ver todos os agentes
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {agent.heroStats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="glass-card rounded-xl p-4 text-center">
                  <p className="font-display text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-destructive/20 text-destructive/80 px-4 py-2">
              <XCircle className="h-4 w-4 mr-2" />
              O Problema
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Você reconhece esses problemas?</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {agent.problems.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-6 border-destructive/10 hover:border-destructive/20 transition-colors">
                <h3 className="font-display font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary/15 text-primary/80 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              A Solução
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{agent.solutionTitle}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{agent.solutionDesc}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {agent.solutions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-8 text-center glass-hover">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Check className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Resultados Reais</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {agent.benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-6 text-center glass-hover">
                <p className="font-display text-3xl font-bold gradient-text mb-1">{b.metric}</p>
                <p className="font-semibold text-sm mb-2">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Como Funciona</h2>
          </motion.div>
          <div className="space-y-8">
            {agent.howItWorks.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-primary text-lg">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-3">
                  Método Tradicional <span className="text-muted-foreground">vs</span> <span className="gradient-text">{agent.solutionTitle}</span>
                </h2>
              </div>
              <div className="space-y-0">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border mb-2">
                  <div />
                  <div className="text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                      <XCircle className="h-3 w-3" /> Tradicional
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> PROMETHEUS
                    </span>
                  </div>
                </div>
                {agent.comparison.map((row, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 hover:bg-foreground/[0.01] transition-colors">
                    <div className="text-sm font-medium text-foreground/80">{row.label}</div>
                    <div className="text-center text-sm text-muted-foreground">{row.traditional}</div>
                    <div className="text-center text-sm font-semibold text-primary">{row.agent}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">O que nossos clientes dizem</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {agent.testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card rounded-2xl p-8 glass-hover">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 text-primary fill-primary" />)}
                </div>
                <p className="text-foreground/90 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Perguntas Frequentes</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {agent.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl border-border px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Integrações Nativas</p>
          <div className="flex flex-wrap justify-center gap-3">
            {agent.integrations.map((int) => (
              <Badge key={int} variant="outline" className="border-border text-muted-foreground px-4 py-2">{int}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] via-primary/[0.02] to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{agent.ctaHeadline}</h2>
            <p className="text-muted-foreground text-lg mb-8">{agent.ctaSubheadline}</p>
            <Link to="/auth" state={{ hireIntent: { type: "agent", label: agent.solutionTitle, slugs: [slug] } }}>
              <Button size="lg" className="glow rounded-xl px-10 h-14 text-lg font-semibold">
                <Zap className="h-5 w-5 mr-2" />
                {agent.ctaButton}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">Sem compromisso · Setup em minutos · Cancele quando quiser</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AgentLanding;
