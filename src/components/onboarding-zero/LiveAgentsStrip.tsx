import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  focus: "comercial" | "atendimento" | "marketing" | "financeiro" | string;
  companyName?: string;
}

const AGENTS: Record<string, { name: string; role: string; emoji: string; logs: (empresa: string) => string[] }> = {
  comercial: {
    name: "Ana · SDR",
    role: "Prospecção",
    emoji: "🎯",
    logs: (e) => [
      `Buscando leads compatíveis com ${e} no LinkedIn…`,
      "Encontrei 47 empresas alvo · qualificando ICP…",
      "Redigindo follow-up personalizado pro lead #2847…",
      "Agendei 3 reuniões pra próxima semana.",
    ],
  },
  atendimento: {
    name: "Rafa · SAC",
    role: "Atendimento 24/7",
    emoji: "💬",
    logs: (e) => [
      `Conectando ao WhatsApp de ${e}…`,
      "Respondi 12 dúvidas de horário e preço nos últimos 5 min.",
      "Escalei 1 caso complexo pro humano · resto resolvido.",
      "NPS médio subiu 18% essa semana.",
    ],
  },
  marketing: {
    name: "Julia · Conteúdo",
    role: "Redes & campanhas",
    emoji: "",
    logs: (e) => [
      `Analisando tom de voz de ${e}…`,
      "Gerando calendário editorial de 30 dias…",
      "Post pro Instagram pronto · aguardando aprovação.",
      "Campanha de tráfego pago rodando em modo teste.",
    ],
  },
  financeiro: {
    name: "Marco · Financeiro",
    role: "Fluxo & cobrança",
    emoji: "📊",
    logs: (e) => [
      `Importando extrato bancário de ${e}…`,
      "Categorizei 128 lançamentos automaticamente.",
      "3 clientes em atraso · disparei cobrança amigável.",
      "DRE do mês pronto · margem cresceu 4pp.",
    ],
  },
};

/**
 * Live Agents Strip · salto #2.
 * Micro-prova de que o time já está trabalhando · não é promessa, é demonstração.
 */
export default function LiveAgentsStrip({ focus, companyName = "sua empresa" }: Props) {
  const cfg = AGENTS[focus] ?? AGENTS.comercial;
  const [logIndex, setLogIndex] = useState(0);
  const logs = cfg.logs(companyName);

  useEffect(() => {
    const id = setInterval(() => setLogIndex((i) => (i + 1) % logs.length), 2400);
    return () => clearInterval(id);
  }, [logs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 w-full max-w-xl rounded-2xl border border-[hsl(var(--hairline))] bg-card/40 backdrop-blur-sm p-4"
      aria-label="Time de IA trabalhando ao vivo"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-lg">
            {cfg.emoji}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-background animate-pulse" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{cfg.name}</p>
          <p className="text-xs text-muted-foreground">{cfg.role}</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-success font-medium">Live</span>
      </div>
      <div className="mt-3 rounded-lg bg-background/50 border border-[hsl(var(--hairline))] px-3 py-2 font-mono text-[13px] text-muted-foreground min-h-[40px] flex items-center">
        <motion.span
          key={logIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="truncate"
        >
          <span className="text-primary/70">›</span> {logs[logIndex]}
        </motion.span>
      </div>
    </motion.div>
  );
}
