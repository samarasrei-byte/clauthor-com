import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { formatBRL, getDepartmentById } from "@/data/departmentPackages";
import LiveAgentsStrip from "./LiveAgentsStrip";


interface Props {
  deptId: string;
  humanBenefit: string;
  onAccept: () => void;
  onExplain: () => void;
  loading?: boolean;
}

/**
 * Tela 3 · Recomendação humana.
 * Uma frase, um preço, um botão. Zero jargão.
 */
export default function Recommendation({ deptId, humanBenefit, onAccept, onExplain, loading }: Props) {
  const dept = getDepartmentById(deptId) ?? getDepartmentById("comercial")!;
  const label = dept.name.replace(/^Departamento\s+(de\s+)?/i, "");

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
        aria-hidden
      >
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 flex items-center justify-center">
          <span className="font-display text-xl font-bold text-primary">T</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-center max-w-3xl leading-[1.1] mb-6"
      >
        Achei. Você precisa do time de <span className="text-primary">{label}</span>.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-xl sm:text-2xl text-muted-foreground text-center max-w-2xl leading-relaxed mb-3"
      >
        Eles cuidam de <span className="text-foreground font-medium">{humanBenefit}</span> pra você.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-3xl sm:text-4xl font-display font-semibold text-foreground mt-6"
      >
        {formatBRL(dept.priceMonthly)}<span className="text-lg text-muted-foreground font-normal">/mês</span>
      </motion.p>
      <p className="text-sm text-muted-foreground mt-1">Cancela quando quiser.</p>

      {/* Micro prova social · reduz ansiedade antes do próximo passo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Beta fechado · vagas limitadas
        </span>
        <span className="hidden sm:inline text-muted-foreground/40">·</span>
        <span>Sem cartão pra testar</span>
        <span className="hidden sm:inline text-muted-foreground/40">·</span>
        <span>Aprovação em 1 clique</span>
      </motion.div>

      {/* Live proof · agentes trabalhando ao vivo (salto #2) */}
      <LiveAgentsStrip focus={deptId} />


      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-12 flex flex-col items-center gap-4"
      >
        <button
          type="button"
          onClick={onAccept}
          disabled={loading}
          className="inline-flex items-center gap-2 h-16 px-10 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          Quero conhecer eles <ArrowRight className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onExplain}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> Explicar melhor
        </button>
      </motion.div>

      <div className="mt-12 flex items-center gap-2" aria-hidden>
        <span className="w-2 h-2 rounded-full bg-primary/40" />
        <span className="w-2 h-2 rounded-full bg-primary/40" />
        <span className="w-6 h-2 rounded-full bg-primary" />
      </div>
    </main>
  );
}
