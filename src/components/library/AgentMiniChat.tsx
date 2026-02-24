import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

// Pre-scripted demo conversations per agent key (no tokens consumed)
const agentDemos: Record<string, ChatMessage[]> = {
  voice_ai: [
    { role: "user", text: "Preciso ligar para 50 leads qualificados hoje." },
    { role: "agent", text: "Iniciando discagem automática. Prioridade: leads score > 80. Primeira chamada em 3s... 📞" },
    { role: "user", text: "E se o lead não atender?" },
    { role: "agent", text: "Agendo callback automático em 2h e envio SMS personalizado. Taxa de reconexão: 73%." },
  ],
  orchestrator: [
    { role: "user", text: "Preciso de um relatório financeiro + análise de mercado." },
    { role: "agent", text: "Delegando para CFO Agent (financeiro) e Research Agent (mercado). ETA: 4 min." },
    { role: "agent", text: "✅ CFO: relatório pronto. ✅ Research: análise concluída. Consolidando..." },
  ],
  coding: [
    { role: "user", text: "Tem um bug no checkout, clientes não finalizam compra." },
    { role: "agent", text: "Analisando logs... Encontrei: timeout na API de pagamento (linha 247). Corrigindo e abrindo PR." },
    { role: "agent", text: "PR #142 aberto com fix + teste unitário. Pipeline verde. ✅" },
  ],
  sales: [
    { role: "user", text: "Qual o status do pipeline esse mês?" },
    { role: "agent", text: "47 oportunidades ativas. R$ 380k em forecast. 12 deals para fechar essa semana. Agendei follow-ups." },
  ],
  omnichannel: [
    { role: "user", text: "Cliente reclamando no WhatsApp sobre atraso." },
    { role: "agent", text: "Identifiquei o pedido #4521. Rastreamento mostra entrega para amanhã. Respondi o cliente com tracking link e cupom de desculpas." },
  ],
  content: [
    { role: "user", text: "Preciso de posts para a Black Friday." },
    { role: "agent", text: "Criados: 5 carrosséis Instagram, 3 reels com copy, 10 stories com countdown. Agendados de 20-29/nov. 🎯" },
  ],
  security: [
    { role: "user", text: "Rodou o scan de vulnerabilidade?" },
    { role: "agent", text: "Scan completo. 0 críticos, 2 médios (deps desatualizadas). PRs de fix já abertos. Relatório LGPD atualizado. 🛡️" },
  ],
  revenue: [
    { role: "user", text: "Como está o fluxo de caixa?" },
    { role: "agent", text: "Positivo em R$ 142k. Projeção 90 dias: estável. 3 faturas vencendo sexta — lembretes enviados automaticamente. 💰" },
  ],
  customer_success: [
    { role: "user", text: "Algum cliente em risco de churn?" },
    { role: "agent", text: "3 contas com health score < 40. Já iniciei playbook de retenção: call personalizada + oferta exclusiva agendada." },
  ],
  hr: [
    { role: "user", text: "Como está o processo seletivo?" },
    { role: "agent", text: "45 CVs triados, 12 entrevistas agendadas. Top 3 candidatos com fit cultural > 90%. Relatório enviado ao seu email. 📋" },
  ],
  data_analytics: [
    { role: "user", text: "Qual produto vende mais às terças?" },
    { role: "agent", text: "Produto A: +47% às terças vs média. Correlação com campanha de email (enviada segunda 18h). Recomendo replicar padrão. 📊" },
  ],
  legal: [
    { role: "user", text: "Revisa esse contrato de fornecedor?" },
    { role: "agent", text: "Analisado. 3 cláusulas de risco identificadas: penalidade desproporcional (§4.2), foro desfavorável (§12), IP ambígua (§7). Sugestões de redação prontas. ⚖️" },
  ],
  ecommerce: [
    { role: "user", text: "Quais produtos preciso repor?" },
    { role: "agent", text: "7 SKUs com estoque < 3 dias. Pedido de reposição gerado automaticamente. Previsão de demanda atualizada para próximos 30 dias. 📦" },
  ],
  marketing_automation: [
    { role: "user", text: "Como está a campanha de nutrição?" },
    { role: "agent", text: "Sequência ativa: 2.340 leads. Taxa abertura: 42% (acima do benchmark). 89 MQLs prontos para vendas. Disparando notificação ao time. 🎯" },
  ],
};

// Fallback for agents without custom demo
const defaultDemo: ChatMessage[] = [
  { role: "user", text: "O que você pode fazer por mim?" },
  { role: "agent", text: "Posso automatizar suas tarefas, gerar relatórios e tomar decisões baseadas em dados. Tudo 24/7, sem pausas. 🚀" },
];

interface AgentMiniChatProps {
  agentKey: string;
  agentName: string;
}

export default function AgentMiniChat({ agentKey, agentName }: AgentMiniChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messages = agentDemos[agentKey] || defaultDemo;

  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setVisibleCount(1);
    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > messages.length) {
        count = 0;
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 800);
        return;
      }
      setVisibleCount(count);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, messages.length]);

  return (
    <div className="mt-auto">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors text-[10px]"
      >
        <span className="flex items-center gap-1.5 text-primary/70 font-medium">
          <MessageSquare className="h-3 w-3" />
          Demo ao vivo
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-2.5 rounded-lg bg-background/60 border border-border/40 space-y-1.5 max-h-36 overflow-y-auto">
              <AnimatePresence>
                {messages.slice(0, visibleCount).map((msg, idx) => (
                  <motion.div
                    key={`${agentKey}-${idx}-${visibleCount}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-1.5 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "agent" && (
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-2 w-2 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-2 py-1 rounded-lg text-[10px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground/80"
                        : "bg-white/[0.03] text-foreground/70 border border-white/[0.04]"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleCount > 0 && visibleCount < messages.length && (
                <div className="flex items-center gap-1 pt-0.5">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground">{agentName.split("—")[0].trim()} digitando...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
