import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompanySize, Familiarity } from "@/lib/onboarding-recommendation";

const SECTORS = [
  "SaaS / Tecnologia", "E-commerce / Varejo", "Serviços profissionais",
  "Advocacia", "Saúde", "Educação", "Indústria", "Marketing / Agência",
  "Financeiro", "Imobiliário", "Alimentação", "Outro",
];

const SIZES: { id: CompanySize; label: string; hint: string }[] = [
  { id: "solo", label: "Solo", hint: "Só eu" },
  { id: "2-10", label: "2 · 10", hint: "Time pequeno" },
  { id: "11-50", label: "11 · 50", hint: "Em crescimento" },
  { id: "50+", label: "50+", hint: "Empresa estabelecida" },
];

const FAMILIARITIES: { id: Familiarity; label: string }[] = [
  { id: "iniciante", label: "Iniciante" },
  { id: "intermediario", label: "Intermediário" },
  { id: "avancado", label: "Avançado" },
];

interface Props {
  sector: string;
  size: CompanySize | null;
  familiarity: Familiarity | null;
  onChange: (patch: Partial<{ sector: string; size: CompanySize; familiarity: Familiarity }>) => void;
}

export default function ContextStep({ sector, size, familiarity, onChange }: Props) {
  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">02 · Contexto</p>
        <h1 className="type-display font-serif italic text-4xl md:text-5xl tracking-tight text-foreground">
          Rapidamente sobre você.
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Três respostas · usamos para calibrar entre agente, squad ou departamento.
        </p>
      </header>

      <div className="space-y-8 max-w-lg mx-auto w-full">
        {/* Sector */}
        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Setor</label>
          <Select value={sector} onValueChange={(v) => onChange({ sector: v })}>
            <SelectTrigger className="h-11 surface-1 border-0 hairline-b rounded-lg">
              <SelectValue placeholder="Selecione o setor" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Tamanho da operação</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SIZES.map((opt) => {
              const active = size === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ size: opt.id })}
                  className={[
                    "px-3 py-3 rounded-lg transition-all text-center",
                    active
                      ? "border border-primary/40 bg-primary/[0.04] text-foreground"
                      : "surface-1 border border-transparent hover:bg-[hsl(var(--surface-2))] text-muted-foreground",
                  ].join(" ")}
                >
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="type-caption mt-0.5 text-muted-foreground">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Familiarity */}
        <div className="space-y-2">
          <label className="type-caption text-muted-foreground">Familiaridade com IA</label>
          <div className="grid grid-cols-3 gap-2">
            {FAMILIARITIES.map((opt) => {
              const active = familiarity === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ familiarity: opt.id })}
                  className={[
                    "px-3 py-2.5 rounded-lg transition-all text-sm",
                    active
                      ? "border border-primary/40 bg-primary/[0.04] text-foreground"
                      : "surface-1 border border-transparent hover:bg-[hsl(var(--surface-2))] text-muted-foreground",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
