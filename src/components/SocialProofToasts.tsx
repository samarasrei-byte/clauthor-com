import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SOCIAL_PROOF_DATA = [
  { emoji: "🟢", text: "João de São Paulo ativou o SDR Outbound agora" },
  { emoji: "🟢", text: "Empresa de e-commerce economizou R$12.400 este mês" },
  { emoji: "🟢", text: "15 novas empresas entraram esta semana" },
  { emoji: "🟢", text: "Maria do Rio contratou o Agente Financeiro" },
  { emoji: "🟢", text: "Startup SaaS automatizou 92% do atendimento" },
  { emoji: "🟢", text: "Pedro de BH ativou o squad de Marketing" },
  { emoji: "🟢", text: "Agência Digital economizou 120h este mês" },
  { emoji: "🟢", text: "Lucas de Curitiba configurou integração WhatsApp" },
];

const SocialProofToasts = () => {
  const [current, setCurrent] = useState<number | null>(null);
  const [shown, setShown] = useState(false);

  const showNext = useCallback(() => {
    const idx = Math.floor(Math.random() * SOCIAL_PROOF_DATA.length);
    setCurrent(idx);
    setShown(true);
    setTimeout(() => setShown(false), 4000);
  }, []);

  useEffect(() => {
    // First toast after 20s, then every 45s
    const initial = setTimeout(showNext, 20_000);
    const interval = setInterval(showNext, 45_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [showNext]);

  const item = current !== null ? SOCIAL_PROOF_DATA[current] : null;

  return (
    <div className="fixed bottom-6 left-6 z-40 pointer-events-none">
      <AnimatePresence>
        {shown && item && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: -10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="pointer-events-auto px-4 py-3 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-lg max-w-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">{item.emoji}</span>
              <p className="text-xs text-foreground/80 font-mono leading-snug">{item.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialProofToasts;
