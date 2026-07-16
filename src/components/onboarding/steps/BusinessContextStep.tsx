interface Props {
  industry: string;
  coreBusiness: string;
  painPoints: string[];
  onChange: (patch: Partial<{ industry: string; coreBusiness: string; painPoints: string[] }>) => void;
}

const INDUSTRIES = [
  "SaaS / Tecnologia", "E-commerce / Varejo", "Serviços profissionais", "Advocacia",
  "Saúde", "Educação", "Indústria", "Marketing / Agência", "Financeiro",
  "Imobiliário", "Alimentação", "Beleza / Estética", "Outro",
];

const PAIN_LIBRARY: Record<string, string[]> = {
  default: [
    "Poucos leads qualificados",
    "Atendimento demora demais",
    "Falta conteúdo em escala",
    "Processos manuais/repetitivos",
    "Sem visão clara de dados",
    "Difícil escalar o time",
  ],
  "Advocacia": ["Petições demoradas", "Contratos manuais", "Prospecção B2B fria", "LGPD e compliance", "Contencioso volumoso"],
  "Saúde": ["Agendamento manual", "Retenção de pacientes", "Prontuário/atendimento", "Marketing regulado"],
  "E-commerce / Varejo": ["Baixa conversão", "SAC volumoso", "Retenção de cliente", "Recuperação de carrinho"],
  "SaaS / Tecnologia": ["Churn alto", "Onboarding lento", "Suporte técnico", "SDR/BDR caro"],
};

export default function BusinessContextStep({ industry, coreBusiness, painPoints, onChange }: Props) {
  const library = PAIN_LIBRARY[industry] || PAIN_LIBRARY.default;

  const togglePain = (p: string) => {
    if (painPoints.includes(p)) onChange({ painPoints: painPoints.filter(x => x !== p) });
    else onChange({ painPoints: [...painPoints, p] });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">03 · Core business e dores</p>
        <h1 className="type-display font-display text-4xl md:text-5xl tracking-tight text-foreground">
          Em uma frase — o que sua empresa faz?
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Isso vira memória do Thor e alimenta cada roteiro, atendimento e estratégia.
        </p>
      </header>

      <div className="space-y-6 max-w-xl mx-auto w-full">
        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Setor</label>
          <select
            value={industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className="w-full h-11 px-3 rounded-lg surface-1 hairline-b border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Selecione o setor</option>
            {INDUSTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Core business</label>
          <textarea
            value={coreBusiness}
            onChange={(e) => onChange({ coreBusiness: e.target.value.slice(0, 400) })}
            placeholder="Ex.: Escritório de advocacia especializado em direito digital para SaaS."
            rows={3}
            className="w-full px-4 py-3 rounded-lg surface-1 hairline-b border-0 text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="type-caption text-muted-foreground/70 text-right">{coreBusiness.length}/400</p>
        </div>

        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Principais dores <span className="text-muted-foreground/60">· escolha quantas quiser</span></label>
          <div className="flex flex-wrap gap-2">
            {library.map((p) => {
              const active = painPoints.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePain(p)}
                  className={[
                    "px-3 h-8 rounded-full text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary border border-primary/40"
                      : "surface-1 hairline-b text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))]",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
