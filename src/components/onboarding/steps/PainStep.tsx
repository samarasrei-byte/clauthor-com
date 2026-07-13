import { TrendingUp, MessageSquare, PenTool, Cog, Scale, Compass } from "lucide-react";
import type { Pain } from "@/lib/onboarding-recommendation";

interface Option {
  id: Pain;
  icon: React.ElementType;
  label: string;
  hint: string;
}

const OPTIONS: Option[] = [
  { id: "leads_vendas", icon: TrendingUp, label: "Gerar mais leads e vendas", hint: "Prospecção, follow-up, fechamento" },
  { id: "atendimento", icon: MessageSquare, label: "Atender clientes 24/7", hint: "Suporte, sucesso, retenção" },
  { id: "conteudo", icon: PenTool, label: "Produzir conteúdo em escala", hint: "Redes, blog, campanhas" },
  { id: "operacoes", icon: Cog, label: "Automatizar operações internas", hint: "Processos, dados, back-office" },
  { id: "juridico", icon: Scale, label: "Estruturar jurídico e compliance", hint: "Contratos, LGPD, contencioso" },
  { id: "explorar", icon: Compass, label: "Não sei ainda", hint: "Me mostre o que existe" },
];

export default function PainStep({ value, onSelect }: { value: Pain | null; onSelect: (p: Pain) => void }) {
  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">01 · Sua dor</p>
        <h1 className="type-display font-serif italic text-4xl md:text-5xl tracking-tight text-foreground">
          O que está te tirando o sono?
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Escolha o cenário mais próximo. Vamos usar isso para montar sua recomendação.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                active
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "hover:bg-[hsl(var(--surface-2))]",
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
