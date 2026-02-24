import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  agent: string;
  text: string;
  delay: number; // ms before showing
}

const departmentChats: Record<string, ChatMessage[]> = {
  tecnologia: [
    { agent: "Dev Full-Stack", text: "Acabei o endpoint da API de pagamentos. Preciso de review de segurança.", delay: 0 },
    { agent: "CISO", text: "Analisando... Encontrei uma vulnerabilidade no header CORS. Corrigindo agora.", delay: 2500 },
    { agent: "DevOps", text: "Deploy em staging pronto. Pipeline CI/CD verde. ✅", delay: 5000 },
    { agent: "Gerente de Projetos", text: "Atualizado no board: task movida para 'Done'. Sprint no prazo. 📊", delay: 7500 },
  ],
  comercial: [
    { agent: "SDR", text: "Novo lead qualificado: empresa de e-commerce, 200 funcionários. Score: 87.", delay: 0 },
    { agent: "Closer", text: "Perfeito. Agendando call de apresentação para amanhã 14h.", delay: 2500 },
    { agent: "CS Manager", text: "Preparei o onboarding kit personalizado para esse segmento.", delay: 5000 },
    { agent: "Atendente", text: "Canal WhatsApp ativo. First response time configurado: < 2 min. 🚀", delay: 7500 },
  ],
  marketing: [
    { agent: "Copywriter", text: "Campanha de Black Friday pronta: 5 variações de copy para teste A/B.", delay: 0 },
    { agent: "Growth", text: "Automação de email configurada: sequência de 7 dias com segmentação.", delay: 2500 },
    { agent: "SEO", text: "Keywords rankeando: 12 termos na primeira página. Tráfego +34%. 📈", delay: 5000 },
    { agent: "Social Media", text: "Conteúdo agendado: 30 posts, 15 reels, 8 stories para o mês.", delay: 7500 },
  ],
  financeiro: [
    { agent: "CFO", text: "Relatório mensal: receita +18%, margem EBITDA estável em 23%.", delay: 0 },
    { agent: "Fiscal", text: "Notas fiscais do mês emitidas. Zero pendências com o fisco.", delay: 2500 },
    { agent: "BI", text: "Dashboard atualizado: previsão de caixa para os próximos 90 dias. 💰", delay: 5000 },
    { agent: "Gestor Financeiro", text: "Contas a pagar reconciliadas. Fluxo de caixa positivo.", delay: 7500 },
  ],
  criacao: [
    { agent: "Designer", text: "Nova identidade visual do produto finalizada. 3 conceitos para aprovação.", delay: 0 },
    { agent: "Editor de Vídeo", text: "Vídeo institucional renderizado em 4K. Motion graphics aplicados. 🎬", delay: 2500 },
    { agent: "Redator", text: "Storytelling da marca revisado. Tom de voz alinhado ao novo posicionamento.", delay: 5000 },
    { agent: "Produtor", text: "Calendário de conteúdo visual integrado com o time de marketing.", delay: 7500 },
  ],
  suporte: [
    { agent: "Atendente N1", text: "127 tickets resolvidos hoje. SLA médio: 4 min. Satisfação: 98%. ⭐", delay: 0 },
    { agent: "CS Manager", text: "Churn risk detectado em 3 contas. Iniciando retenção proativa.", delay: 2500 },
    { agent: "Call Center", text: "Fila de ligações zerada. Tempo médio de espera: 12 segundos.", delay: 5000 },
    { agent: "Base de Conhecimento", text: "15 novos artigos criados baseados nos tickets mais frequentes. 📚", delay: 7500 },
  ],
  rh: [
    { agent: "Recrutador", text: "Pipeline de candidatos: 45 CVs triados, 12 entrevistas agendadas.", delay: 0 },
    { agent: "T&D", text: "Programa de onboarding atualizado. Trilha de 30 dias pronta.", delay: 2500 },
    { agent: "People Analytics", text: "Turnover caiu 22% com as ações do último trimestre. 📉", delay: 5000 },
    { agent: "Analista RH", text: "Relatório de clima organizacional gerado. eNPS: 72 (+8 pontos).", delay: 7500 },
  ],
};

interface DepartmentMiniChatProps {
  departmentId: string;
}

export default function DepartmentMiniChat({ departmentId }: DepartmentMiniChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messages = departmentChats[departmentId] || [];

  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Auto-play messages one by one
    setVisibleCount(1);
    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > messages.length) {
        // Loop: restart after a pause
        count = 0;
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 800);
        return;
      }
      setVisibleCount(count);
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, messages.length]);

  if (!messages.length) return null;

  return (
    <div className="px-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors text-xs"
      >
        <span className="flex items-center gap-2 text-primary/80 font-medium">
          <MessageSquare className="h-3.5 w-3.5" />
          Ver orquestração ao vivo
        </span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-background/50 border border-border/50 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Orquestração ativa</span>
              </div>
              <AnimatePresence>
                {messages.slice(0, visibleCount).map((msg, idx) => (
                  <motion.div
                    key={`${departmentId}-${idx}-${visibleCount}`}
                    initial={{ opacity: 0, x: -8, y: 4 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-primary/70 block">{msg.agent}</span>
                      <p className="text-[11px] text-foreground/80 leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleCount < messages.length && visibleCount > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground">Agente digitando...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
