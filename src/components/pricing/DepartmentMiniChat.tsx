import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap } from "lucide-react";

interface ChatMessage {
  agent: string;
  text: string;
}

const departmentChats: Record<string, ChatMessage[]> = {
  tecnologia: [
    { agent: "Dev Full-Stack", text: "Endpoint da API pronto. Preciso de review de segurança." },
    { agent: "CISO", text: "Vulnerabilidade no CORS detectada. Corrigindo..." },
    { agent: "DevOps", text: "Deploy staging: pipeline verde ✅" },
    { agent: "PM", text: "Sprint atualizado. Task → Done 📊" },
  ],
  comercial: [
    { agent: "SDR", text: "Lead qualificado: e-commerce, 200 func. Score: 87" },
    { agent: "Closer", text: "Call agendada para amanhã 14h" },
    { agent: "CS", text: "Onboarding kit personalizado pronto" },
    { agent: "Atendente", text: "WhatsApp ativo. Response time: < 2min 🚀" },
  ],
  marketing: [
    { agent: "Copywriter", text: "5 variações A/B para Black Friday prontas" },
    { agent: "Growth", text: "Automação: sequência 7 dias segmentada" },
    { agent: "SEO", text: "12 termos na 1ª página. Tráfego +34% 📈" },
    { agent: "Social", text: "30 posts + 15 reels agendados pro mês" },
  ],
  financeiro: [
    { agent: "CFO", text: "Receita +18%. EBITDA estável: 23%" },
    { agent: "Fiscal", text: "NFs emitidas. Zero pendências" },
    { agent: "BI", text: "Forecast 90 dias atualizado 💰" },
    { agent: "Financeiro", text: "Contas reconciliadas. Caixa positivo" },
  ],
  criacao: [
    { agent: "Designer", text: "3 conceitos de identidade visual prontos" },
    { agent: "Editor", text: "Vídeo 4K renderizado. Motion applied 🎬" },
    { agent: "Redator", text: "Tom de voz alinhado ao novo posicionamento" },
    { agent: "Produtor", text: "Calendário visual integrado com marketing" },
  ],
  suporte: [
    { agent: "N1", text: "127 tickets hoje. SLA: 4min. CSAT: 98% ⭐" },
    { agent: "CS", text: "3 contas em risco. Retenção proativa iniciada" },
    { agent: "Call Center", text: "Fila zerada. Espera: 12s" },
    { agent: "RAG", text: "15 artigos criados dos tickets frequentes 📚" },
  ],
  rh: [
    { agent: "Recruiter", text: "45 CVs triados. 12 entrevistas agendadas" },
    { agent: "T&D", text: "Onboarding 30 dias atualizado" },
    { agent: "People", text: "Turnover -22% no trimestre 📉" },
    { agent: "Analista", text: "eNPS: 72 (+8 pontos)" },
  ],
};

interface DepartmentMiniChatProps {
  departmentId: string;
  autoPlay?: boolean;
  compact?: boolean;
}

export default function DepartmentMiniChat({ departmentId, autoPlay = true, compact = false }: DepartmentMiniChatProps) {
  const [visibleCount, setVisibleCount] = useState(autoPlay ? 1 : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messages = departmentChats[departmentId] || [];

  useEffect(() => {
    if (!autoPlay || !messages.length) return;

    setVisibleCount(1);
    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > messages.length) {
        count = 0;
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 1200);
        return;
      }
      setVisibleCount(count);
    }, 2800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, messages.length]);

  if (!messages.length) return null;

  return (
    <div className={`rounded-xl bg-black/30 border border-white/[0.04] overflow-hidden ${compact ? "p-2" : "p-3"}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Zap className="h-3 w-3 text-primary/60" />
        <span className="text-[9px] text-primary/50 uppercase tracking-[0.15em] font-bold">Orquestração ao vivo</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] text-emerald-400/60">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className={`space-y-1.5 ${compact ? "max-h-28" : "max-h-40"} overflow-y-auto`}>
        <AnimatePresence mode="popLayout">
          {messages.slice(0, visibleCount).map((msg, idx) => (
            <motion.div
              key={`${departmentId}-msg-${idx}`}
              initial={{ opacity: 0, x: -6, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-start gap-2 group"
            >
              <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 border border-primary/10">
                <Bot className="h-2.5 w-2.5 text-primary/70" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-primary/50 block leading-none mb-0.5">{msg.agent}</span>
                <p className="text-[11px] text-foreground/70 leading-snug">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {visibleCount > 0 && visibleCount < messages.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 pl-7"
          >
            <div className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary/30 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.8s" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
