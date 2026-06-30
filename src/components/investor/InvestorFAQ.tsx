import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ShieldAlert, TrendingDown, Users, Zap, Lock, Scale, DollarSign, Rocket, Brain, Globe, AlertTriangle, Swords } from "lucide-react";

type FAQ = { q: string; a: string; icon: React.ElementType; tag: string };

const FAQS: FAQ[] = [
  {
    tag: "Concorrência",
    icon: Swords,
    q: "Por que vocês e não OpenAI, Anthropic ou Google? Eles têm bilhões — vão te esmagar em 6 meses.",
    a: "OpenAI/Anthropic vendem modelo bruto (LLM-as-a-service). Clauthor vende força de trabalho operacional pronta — 225 agentes orquestrados em 20 departamentos, com memória hierárquica, RLS multi-tenant, governança e billing por outcome. Eles competem na camada de infraestrutura (commodity, margem em queda). Nós competimos na camada de aplicação vertical (margem 80%+). Quando o GPT-6 sair, ele vira combustível para a Clauthor — não substituto. Mesma lógica de AWS vs. Shopify: ninguém abre uma loja na AWS crua."
  },
  {
    tag: "Moat",
    icon: Lock,
    q: "Qual é o seu moat real? Qualquer dev com Cursor faz isso em um fim de semana.",
    a: "Faz uma demo. Não faz produto. O moat são 4 camadas que levam 18+ meses para replicar: (1) Memória hierárquica episódica/semântica/procedural com pgvector — dados proprietários que melhoram a cada execução; (2) Orquestração A2A entre 225 agentes com policy engine, autonomy engine e approval workflow; (3) Integration router white-label multi-tenant (PhantomBuster, Evolution, Astrea, Stripe, ClickSign); (4) Compliance LGPD/SOC2-ready com audit trail nativo. Um dev sozinho clona o chat. Não clona a operação."
  },
  {
    tag: "Tração",
    icon: TrendingDown,
    q: "Vocês não têm cliente pagante. Por que eu investiria em vaporware?",
    a: "Não é vaporware — é MVP em testes finais. A plataforma roda hoje com 225 agentes funcionais, 10 integrações ativas e arquitetura pronta para 4.000 usuários simultâneos. O que falta não é produto: é capital para infra de produção (vector DB dedicado, observability, SRE). Em 10 dias após o aporte estamos em go-live. O fundador bootstrappou tudo até aqui — você está entrando no momento exato em que R$1 vira R$10, não em que R$1 vira pitch deck."
  },
  {
    tag: "Time",
    icon: Users,
    q: "Solo founder. Sem time técnico sênior. Como você executa isso?",
    a: "Solo founder construiu 225 agentes, 14 idiomas, MCP server, RLS completo, billing híbrido e 80+ Edge Functions em bootstrapping. Isso já é a prova técnica. Parte do capital (~30%) vai para 2 hires-chave: Staff Engineer (infra/SRE) e Head of Growth. O resto da operação roda com agentes — é literalmente o produto se aplicando à própria empresa. Dogfooding extremo."
  },
  {
    tag: "Mercado",
    icon: Globe,
    q: "O mercado de 'AI agents' está saturado. Tem 500 startups fazendo isso.",
    a: "Tem 500 fazendo chatbot com prompt. Tem menos de 10 fazendo força de trabalho autônoma vertical com governança enterprise — e nenhuma em português com compliance LGPD nativo e foco em PMEs brasileiras/LATAM. TAM global: US$ 47B em 2030 (Gartner). SAM LATAM PME: US$ 4,2B. Não precisamos vencer o mundo — precisamos dominar um nicho de US$ 400M. Isso é IPO."
  },
  {
    tag: "Receita",
    icon: DollarSign,
    q: "Projeção de R$ 15M MRR em 36 meses. Por que eu deveria acreditar nisso?",
    a: "Math simples: ticket médio R$ 1.500/mês (1/120 do custo de um departamento humano). 10.000 clientes = R$ 15M MRR. Em um mercado de 6 milhões de PMEs no Brasil, isso é 0,16% de penetração. Conservador. Se errarmos por 50%, ainda é R$ 7,5M MRR — múltiplo de 25x sobre o aporte. Pior cenário ainda devolve capital."
  },
  {
    tag: "Risco Técnico",
    icon: AlertTriangle,
    q: "E se a OpenAI mudar os preços ou cortar API? Vocês quebram.",
    a: "Multi-model gateway desde o dia zero — Gemini, Claude, GPT, Llama via Lovable AI Gateway. Switch de provider é config, não refactor. Margem bruta calculada já assumindo 3x o custo atual de tokens. Além disso, 60% dos workloads rodam em modelos abertos self-hosted no roadmap (Llama 3.3, Qwen). Vendor lock-in zero."
  },
  {
    tag: "Churn",
    icon: TrendingDown,
    q: "SaaS B2B tem churn altíssimo. Como vocês retêm cliente?",
    a: "Outcome-based pricing: cliente só paga pelo resultado entregue (lead qualificado, contrato fechado, atendimento resolvido). Churn vira função de performance, não de preço. Plus: a memória hierárquica cria lock-in positivo — quanto mais tempo o cliente fica, mais os agentes aprendem o negócio dele. Trocar = começar do zero. Net revenue retention projetada: 130%+."
  },
  {
    tag: "Regulação",
    icon: Scale,
    q: "E a regulação de IA? EU AI Act, marco regulatório brasileiro — pode te matar.",
    a: "Compliance-first desde o design: audit trail em toda decisão de agente, approval workflow obrigatório para ações de alto risco (financeiro, jurídico, comunicação externa), RLS multi-tenant, LGPD-ready. EU AI Act classifica nossos agentes como 'limited risk' (transparência + supervisão humana) — já implementado. Regulação não é ameaça: é moat. Mata os concorrentes que fizeram gambiarra."
  },
  {
    tag: "Diluição",
    icon: DollarSign,
    q: "R$ 200k por 10% é caro. Empresas em estágio similar levantam por menos.",
    a: "Valuation R$ 2M para uma plataforma com 80+ Edge Functions, 225 agentes, 14 idiomas, multi-tenant RLS, MCP server e arquitetura pronta para escala é múltiplo de 0,15x sobre custo de replicação (mínimo R$ 13M e 18 meses para refazer). Você não está comprando ideia — está comprando ativo construído. Comparáveis: Adept AI levantou US$ 350M em seed pré-receita. Estamos cobrando 0,01% disso."
  },
  {
    tag: "Estratégia",
    icon: Rocket,
    q: "Plano B se nada disso funcionar?",
    a: "Três saídas defensáveis: (1) Aquisição estratégica por player de CRM/ERP brasileiro (TOTVS, Linx, Stone) — eles precisam de IA e não têm; comparáveis pagaram US$ 50-200M por techs menores. (2) White-label para agências e consultorias — receita de licenciamento sem CAC. (3) Pivot para vertical específica (advocacia, contabilidade, saúde) onde já temos tração técnica. Capital não evapora — vira ativo transferível."
  },
  {
    tag: "Ego",
    icon: Brain,
    q: "Você acha mesmo que vai construir a próxima unicórnio sozinho?",
    a: "Não sozinho. Com 225 agentes, com o investidor certo, com 2 hires de elite e com uma janela de mercado que abre uma vez por década. Sam Altman começou a OpenAI sem nada do que tem hoje. Tobi Lutke vendeu snowboard antes do Shopify. A pergunta não é se sou capaz — é se você quer estar na cap table quando isso virar óbvio em 24 meses. Depois, o cheque custa 100x."
  },
  {
    tag: "Defesa",
    icon: ShieldAlert,
    q: "Por que não esperar mais 6 meses para investir? Quero ver tração primeiro.",
    a: "Justo. Mas o preço sobe. Hoje: R$ 200k por 10%. Com 100 clientes pagantes (Q2/2026): R$ 1M por 10%. Com R$ 500k MRR (Q4/2026): R$ 5M por 10%. Você está pagando pelo risco que assume agora. Esperar é racional — só não reclame do preço depois. Os melhores deals da história foram feitos quando ninguém mais queria entrar."
  },
  {
    tag: "Honestidade",
    icon: Zap,
    q: "Me diga uma coisa em que vocês podem falhar de verdade.",
    a: "Velocidade de execução. Se demorarmos mais de 12 meses para chegar em R$ 500k MRR, um player com capital infinito (OpenAI, Microsoft) pode lançar um produto vertical e nos pressionar em distribuição. Mitigação: foco obsessivo em PMEs brasileiras (mercado que big tech ignora), parcerias com contadores/consultores (canal proprietário) e outcome pricing (impossível de copiar sem refazer a stack). Risco real, mas endereçado."
  },
];

export default function InvestorFAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq-investidor" className="py-32 px-6 bg-card/30 border-y border-border/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-6">
            <Swords className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Perguntas Difíceis · Respostas Diretas</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            O Investidor Vai Jogar Sujo.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aqui estão as 14 perguntas mais cínicas, mais cortantes e mais reais que um investidor pode fazer — com a resposta que ele merece ouvir.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            const Icon = faq.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen ? "border-primary/40 bg-card/60 shadow-lg shadow-primary/5" : "border-border/60 bg-card/30 hover:border-border"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start gap-4 px-6 py-5 text-left"
                >
                  <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center ring-1 ${
                    isOpen ? "bg-primary/15 ring-primary/40 text-primary" : "bg-muted/40 ring-border/60 text-muted-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-1.5">
                      {String(i + 1).padStart(2, "0")} · {faq.tag}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold leading-snug">{faq.q}</h3>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform mt-1 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pl-[76px]">
                        <div className="pt-2 border-t border-border/40">
                          <p className="text-sm md:text-base text-foreground/85 leading-relaxed pt-4">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 text-center"
        >
          <p className="text-base md:text-lg font-medium text-foreground/90 max-w-3xl mx-auto leading-relaxed">
            "Tem mais pergunta? Ótimo. As melhores due diligences viram as melhores parcerias.
            <span className="text-primary"> Pergunte qualquer coisa — eu respondo com a mesma franqueza."</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
