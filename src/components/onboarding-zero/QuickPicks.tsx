import { motion } from "framer-motion";

export type QuickAnswers = {
  team: "solo" | "team" | "enterprise";
  focus: "clientes" | "conteudo" | "organizar" | "vender";
  budget: "1700" | "3400" | "5100" | "unknown";
};

interface Props {
  step: 0;
  onPick: (key: keyof QuickAnswers, value: string) => void;
}

interface Choice {
  value: string;
  emoji: string;
  label: string;
}

const QUESTIONS: { key: keyof QuickAnswers; question: string; choices: Choice[] }[] = [
  {
    key: "focus",
    question: "O que mais te consome tempo hoje?",
    choices: [
      { value: "clientes", emoji: "📞", label: "Falar com clientes" },
      { value: "conteudo", emoji: "✍️", label: "Criar conteúdo" },
      { value: "organizar", emoji: "📊", label: "Organizar tudo" },
      { value: "vender", emoji: "💼", label: "Vender mais" },
    ],
  },
];

/**
 * Tela 2 · 3 perguntas de 1 clique.
 * Cada clique avança sozinho. Sem "próximo", sem digitar.
 * Botões enormes (≥ 96px alt) com emoji + palavra pra ficar universal.
 */
export default function QuickPicks({ step, onPick }: Props) {
  const q = QUESTIONS[step];
  const cols = q.choices.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";

  return (
    <main className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 py-10">
      <motion.h1
        key={q.key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-display text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-center max-w-3xl leading-[1.05] mb-12"
      >
        {q.question}
      </motion.h1>

      <motion.div
        key={q.key + "-choices"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`w-full max-w-4xl grid grid-cols-1 ${cols} gap-4`}
      >
        {q.choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onPick(q.key, c.value)}
            className="group flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-[hsl(var(--hairline))] bg-card/40 p-6 hover:border-primary hover:bg-primary/5 hover:-translate-y-1 active:scale-95 transition-all"
            aria-label={c.label}
          >
            <span className="text-5xl" aria-hidden>{c.emoji}</span>
            <span className="text-lg font-semibold text-foreground">{c.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Step dots · 3 dots for Tela 1, 2, 3 */}
      <div className="mt-12 flex items-center gap-2" aria-hidden>
        <span className="w-2 h-2 rounded-full bg-primary/40" />
        <span className={`h-2 rounded-full bg-primary transition-all ${step === 0 ? "w-6" : step === 1 ? "w-6" : "w-2"}`} />
        <span className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted/40"}`} />
      </div>
    </main>
  );
}
