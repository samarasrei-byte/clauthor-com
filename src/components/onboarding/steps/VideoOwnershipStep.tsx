import { Building2, Users, SkipForward } from "lucide-react";

export type Ownership = "own" | "client" | "skip";

interface Props {
  value: Ownership | null;
  onSelect: (v: Ownership) => void;
}

const OPTIONS: { id: Ownership; icon: React.ElementType; label: string; hint: string }[] = [
  { id: "own",    icon: Building2,   label: "Sim, é da minha empresa",       hint: "Vou personalizar tudo com o DNA do meu negócio" },
  { id: "client", icon: Users,       label: "É de um cliente que eu atendo",  hint: "Sou agência/consultor · configuro por marca" },
  { id: "skip",   icon: SkipForward, label: "Prefiro pular por agora",        hint: "Você pode configurar depois no Thor" },
];

export default function VideoOwnershipStep({ value, onSelect }: Props) {
  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">00 · DNA da empresa</p>
        <h1 className="type-display font-display text-4xl md:text-5xl tracking-tight text-foreground">
          Aquele vídeo que você viu · é da sua empresa?
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Em 60 segundos o Thor lê a identidade da marca (cores, tipografia, core business) e passa a criar vídeos e estratégias no seu tom.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 max-w-xl mx-auto">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={[
                "group text-left px-5 py-4 rounded-xl transition-all duration-300",
                "surface-1 hairline-t hairline-b border border-transparent",
                active ? "border-primary/40 bg-primary/[0.04]" : "hover:bg-[hsl(var(--surface-2))]",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div className={[
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  active ? "bg-primary/10 text-primary" : "bg-[hsl(var(--surface-2))] text-muted-foreground group-hover:text-foreground",
                ].join(" ")}>
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="type-title text-[15px] font-medium text-foreground leading-tight">{opt.label}</p>
                  <p className="type-caption text-muted-foreground mt-1">{opt.hint}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
