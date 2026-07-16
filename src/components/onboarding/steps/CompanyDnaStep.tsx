import { useState } from "react";
import { Loader2, Globe, Sparkles } from "lucide-react";

interface Props {
  scope: "own" | "client";
  clientLabel: string;
  onClientLabelChange: (v: string) => void;
  scraping: boolean;
  onScrape: (url: string) => Promise<void>;
  onManual: () => void;
  error: string | null;
}

export default function CompanyDnaStep({
  scope, clientLabel, onClientLabelChange, scraping, onScrape, onManual, error,
}: Props) {
  const [url, setUrl] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || scraping) return;
    onScrape(url.trim());
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">01 · Site da { scope === "client" ? "marca" : "empresa" }</p>
        <h1 className="type-display font-serif italic text-4xl md:text-5xl tracking-tight text-foreground">
          Cole o site — o Thor cuida do resto.
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Extraímos automaticamente paleta de cores, tipografia, logo e uma descrição do negócio direto do seu domínio.
        </p>
      </header>

      <div className="space-y-6 max-w-lg mx-auto w-full">
        {scope === "client" && (
          <div className="space-y-2">
            <label className="type-caption text-muted-foreground">Nome do cliente / marca</label>
            <input
              type="text"
              value={clientLabel}
              onChange={(e) => onClientLabelChange(e.target.value)}
              placeholder="Ex.: Ironberg Fitness"
              className="w-full h-11 px-4 rounded-lg surface-1 hairline-b border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        <form onSubmit={submit} className="space-y-2">
          <label className="type-caption text-muted-foreground">URL do site</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="minhaempresa.com.br"
                className="w-full h-11 pl-10 pr-4 rounded-lg surface-1 hairline-b border-0 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={scraping}
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || scraping}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scraping
                ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} /> Analisando</>
                : <><Sparkles className="w-4 h-4" strokeWidth={1.75} /> Analisar</>}
            </button>
          </div>
          {error && <p className="type-caption text-destructive mt-2">{error}</p>}
        </form>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
          <span className="type-caption text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
        </div>

        <button
          type="button"
          onClick={onManual}
          className="w-full h-11 rounded-lg surface-1 hairline-t hairline-b text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--surface-2))] transition-colors"
        >
          Não tenho site · configurar cores manualmente
        </button>
      </div>
    </div>
  );
}
