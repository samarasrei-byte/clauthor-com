import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

interface FAQ {
  q: string;
  a: string;
}

const departmentFAQs: Record<string, FAQ[]> = {
  tecnologia: [
    { q: "Os agentes conseguem acessar meu código real?", a: "Sim, via integrações com GitHub/GitLab. Eles revisam PRs, sugerem melhorias e detectam vulnerabilidades automaticamente." },
    { q: "Como funciona a orquestração entre Dev e DevOps?", a: "O Dev finaliza o código, o CISO revisa segurança, e o DevOps faz deploy — tudo automatizado em sequência, sem intervenção humana." },
    { q: "Posso usar meu stack atual?", a: "Sim. Os agentes se adaptam a qualquer stack (React, Python, Node, etc.) e aprendem com seu codebase existente." },
  ],
  comercial: [
    { q: "Como o SDR qualifica leads automaticamente?", a: "Ele analisa dados públicos, histórico de interações e perfil ideal de cliente (ICP) para gerar um score de 0 a 100." },
    { q: "Os agentes podem ligar para clientes?", a: "Sim. O Operador de Telefonia faz e recebe chamadas com voz natural, qualifica leads e agenda reuniões automaticamente." },
    { q: "Integra com meu CRM?", a: "Sim. Suporte nativo para HubSpot, Salesforce, Pipedrive e qualquer CRM via API/Webhook." },
  ],
  marketing: [
    { q: "O conteúdo gerado é original?", a: "100%. Cada peça é criada do zero com base na voz da sua marca, público-alvo e objetivos de campanha." },
    { q: "Como funciona o teste A/B automático?", a: "O Copywriter gera variações, o Growth distribui para segmentos diferentes e o sistema seleciona o vencedor automaticamente." },
    { q: "Posso aprovar antes de publicar?", a: "Sim. Você pode ativar modo de aprovação manual ou deixar 100% automático com regras de qualidade." },
  ],
  financeiro: [
    { q: "Os dados financeiros ficam seguros?", a: "Absolutamente. Criptografia end-to-end, isolamento por tenant e compliance com LGPD/SOC2." },
    { q: "Integra com meu ERP?", a: "Sim. Suporte para SAP, TOTVS, Omie, Bling e qualquer sistema via API." },
    { q: "O CFO pode prever cenários?", a: "Sim. Ele gera projeções de 30/60/90 dias baseadas em dados históricos e tendências de mercado." },
  ],
  criacao: [
    { q: "Que tipos de design ele cria?", a: "Posts, banners, apresentações, identidade visual, UI/UX e motion graphics — tudo em alta resolução." },
    { q: "Posso usar minha identidade visual?", a: "Sim. Você configura cores, fontes, logo e guidelines. Todos os assets seguem seu brand book automaticamente." },
    { q: "Os vídeos precisam de edição manual?", a: "Não. O Editor de Vídeo entrega peças finalizadas com cortes, transições, legendas e motion graphics." },
  ],
  suporte: [
    { q: "Qual o tempo médio de resposta?", a: "Menos de 30 segundos no chat e menos de 2 minutos no WhatsApp. 24/7, sem fila." },
    { q: "E se o cliente quiser falar com humano?", a: "Escalação automática com todo o contexto da conversa. O humano recebe o resumo completo do atendimento." },
    { q: "Aprende com minha base de conhecimento?", a: "Sim. O agente RAG indexa seus docs, FAQs e histórico para dar respostas precisas e atualizadas." },
  ],
  rh: [
    { q: "Como funciona a triagem de currículos?", a: "O Recrutador analisa CVs contra seus requisitos, aplica scoring e pré-agenda entrevistas com os top candidatos." },
    { q: "Pode rodar pesquisa de clima?", a: "Sim. People Analytics cria, distribui e analisa pesquisas com insights actionáveis e benchmark do setor." },
    { q: "Integra com plataformas de RH?", a: "Sim. Suporte para Gupy, Kenoby, LinkedIn Recruiter e qualquer ATS via API." },
  ],
};

interface DepartmentFAQProps {
  departmentId: string;
}

export default function DepartmentFAQ({ departmentId }: DepartmentFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = departmentFAQs[departmentId] || [];

  if (!faqs.length) return null;

  return (
    <div className="px-5 pb-1">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
        <HelpCircle className="h-3 w-3" />
        Dúvidas frequentes
      </p>
      <div className="space-y-1">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-lg border border-border/40 overflow-hidden bg-white/[0.01]">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[11px] font-medium text-foreground/80 pr-2">{faq.q}</span>
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openIndex === idx ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-3 pb-2.5 text-[10px] text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
