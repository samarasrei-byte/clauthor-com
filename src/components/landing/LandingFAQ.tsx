/**
 * LandingFAQ · seção de perguntas frequentes com acordeão.
 *
 * Estilo Apple: fundo off-white, tipografia densa, divisores hairline,
 * acento vermelho apenas no ícone ativo. Emite KPI a cada abertura.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackKpi } from "@/lib/kpiTracker";

interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

const FAQS: FaqEntry[] = [
  {
    id: "different",
    q: "Qual a diferença entre Clauthor e contratar um GPT ou n8n?",
    a: "Clauthor não é um chat genérico nem um automatizador de workflows. Você contrata departamentos inteiros de IA (Comercial, Atendimento, Marketing…) com playbook, memória hierárquica, integrações reais (WhatsApp, LinkedIn, PayPal, CRM) e um Approvals Center que pede seu OK nos momentos críticos. GPT executa perguntas; Clauthor executa operações.",
  },
  {
    id: "autonomy",
    q: "A IA opera sozinha ou preciso aprovar tudo?",
    a: "Autônomo com aprovações inteligentes. Tarefas rotineiras (responder lead, qualificar, follow-up, emitir relatório) rodam sozinhas. Ações críticas (envio de proposta, publicação pública, pagamento, contrato) entram no Approvals Center e você aprova em 1 clique. Human-in-the-loop de verdade, não teatro.",
  },
  {
    id: "pricing",
    q: "Quanto custa e o que está incluído?",
    a: "A partir de R$ 1.497/mês por departamento. Inclui squad de especialistas de IA (~10 agentes por departamento), integrações prontas, memória persistente, dashboard com ROI auditável e acompanhamento 1:1 do time Clauthor durante o beta. Sem taxa de setup, sem cobrança por token.",
  },
  {
    id: "onboarding",
    q: "Quanto tempo leva pra colocar em produção?",
    a: "Diagnóstico em ~90s com o Thor (chat consultivo mapeia seu site e dores). Departamento no ar em 24-72h dependendo de integrações. Nossa promessa: você vê o primeiro output real (proposta enviada, lead qualificado, post publicado) na primeira semana ou a mensalidade daquele mês é estornada.",
  },
  {
    id: "data",
    q: "Meus dados ficam seguros? A IA aprende com concorrentes?",
    a: "Multi-tenant com Row-Level Security no banco: sua memória, seus contatos e seus playbooks são isolados por tenant e nunca cruzam com outros clientes. Rodamos sobre infraestrutura auditável (OpenAI, Anthropic, Gemini, Supabase) com criptografia em repouso e em trânsito.",
  },
  {
    id: "integrations",
    q: "Quais ferramentas se conectam?",
    a: "WhatsApp Business, LinkedIn, Instagram, Meta Ads, Google Ads, PayPal, Stripe, HubSpot, Pipedrive, RD Station, Google Sheets, Notion, Slack, e qualquer API via MCP Server. Se algo que você usa não está na lista, o time faz a integração customizada durante o onboarding do beta.",
  },
  {
    id: "cancel",
    q: "Posso cancelar quando quiser?",
    a: "Sim. Mensalidade sem fidelidade, cancela em 1 clique no dashboard. Você mantém acesso à memória e aos outputs gerados até o fim do ciclo pago. Sem multa, sem burocracia.",
  },
  {
    id: "beta",
    q: "Por que \"beta fechado\"? Vocês não têm clientes ainda?",
    a: "Temos clientes rodando em produção — mas estamos limitando novas vagas em 2026 para garantir acompanhamento 1:1 do nosso time durante o onboarding. Preferimos 50 clientes bem-servidos a 5.000 abandonados. Quando a operação escalar, o modelo abre self-service.",
  },
];

export default function LandingFAQ() {
  const [openId, setOpenId] = useState<string>("");

  return (
    <section
      className="relative bg-background border-t border-border/60"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16">
          {/* Coluna esquerda · title + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 mb-6">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Dúvidas frequentes
              </span>
            </div>
            <h2
              id="faq-heading"
              className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-foreground mb-6"
            >
              Ainda tem dúvida?
              <br />
              <span className="text-muted-foreground">Aqui vão as mais comuns.</span>
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
              Se não encontrar a resposta, fale direto com o Thor — nosso concierge
              consultivo responde em segundos.
            </p>
            <Link
              to="/thor"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              Falar com o Thor
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {/* Coluna direita · acordeão */}
          <Accordion
            type="single"
            collapsible
            value={openId}
            onValueChange={(v) => {
              setOpenId(v);
              if (v) trackKpi("home_faq_toggle", { label: v });
            }}
            className="w-full"
          >
            {FAQS.map((item, i) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-border/60 last:border-b-0"
              >
                <AccordionTrigger className="group py-6 text-left hover:no-underline">
                  <span className="flex items-start gap-4 pr-4">
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground/60 pt-1 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] sm:text-[17px] font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                      {item.q}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-10 pr-4 text-[15px] text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* JSON-LD FAQ para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
