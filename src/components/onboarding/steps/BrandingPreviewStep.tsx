import { useState } from "react";
import type { BrandColors, BrandFont } from "@/hooks/useCompanyDna";

interface Props {
  colors: BrandColors;
  fonts: BrandFont[];
  logo: string | null;
  onColorsChange: (c: BrandColors) => void;
  onFontsChange: (f: BrandFont[]) => void;
}

const COLOR_FIELDS: { key: keyof BrandColors; label: string }[] = [
  { key: "primary",       label: "Primária" },
  { key: "secondary",     label: "Secundária" },
  { key: "accent",        label: "Destaque" },
  { key: "background",    label: "Fundo" },
  { key: "textPrimary",   label: "Texto" },
];

function normalizeHex(v: string): string | null {
  if (!v) return null;
  const s = v.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^([0-9a-f]{6})$/i.test(s)) return `#${s}`;
  return null;
}

export default function BrandingPreviewStep({ colors, fonts, logo, onColorsChange, onFontsChange }: Props) {
  const [addingFont, setAddingFont] = useState("");
  const primary = colors.primary || "#3B82F6";
  const bg = colors.background || "#0F172A";
  const text = colors.textPrimary || "#FFFFFF";
  const headingFont = fonts.find(f => f.role === "heading")?.family || fonts[0]?.family || "system-ui";
  const bodyFont = fonts.find(f => f.role === "body")?.family || fonts[1]?.family || fonts[0]?.family || "system-ui";

  const updateColor = (key: keyof BrandColors, value: string) => {
    const hex = normalizeHex(value);
    onColorsChange({ ...colors, [key]: hex ?? value });
  };

  const removeFont = (family: string) => onFontsChange(fonts.filter(f => f.family !== family));
  const addFont = () => {
    if (!addingFont.trim()) return;
    onFontsChange([...fonts, { family: addingFont.trim() }]);
    setAddingFont("");
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="type-eyebrow text-muted-foreground">02 · Identidade visual</p>
        <h1 className="type-display font-display text-4xl md:text-5xl tracking-tight text-foreground">
          Este é o DNA da sua marca.
        </h1>
        <p className="type-body text-muted-foreground max-w-lg mx-auto">
          Confirme ou ajuste. É assim que seus vídeos e materiais vão aparecer.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Editor */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="type-caption text-muted-foreground">Paleta</p>
            <div className="space-y-2">
              {COLOR_FIELDS.map(({ key, label }) => {
                const val = colors[key] || "";
                const displayHex = normalizeHex(val) || "#00000000";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <label className="w-24 shrink-0 type-caption text-muted-foreground">{label}</label>
                    <div className="relative flex-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={normalizeHex(val) || "#000000"}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                        aria-label={`Cor ${label}`}
                      />
                      <input
                        type="text"
                        value={val || ""}
                        onChange={(e) => updateColor(key, e.target.value)}
                        placeholder="#000000"
                        className="flex-1 h-9 px-3 rounded-lg surface-1 hairline-b border-0 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="type-caption text-muted-foreground">Tipografia</p>
            <div className="flex flex-wrap gap-2">
              {fonts.length === 0 && (
                <p className="type-caption text-muted-foreground/70">Nenhuma fonte detectada · adicione uma abaixo.</p>
              )}
              {fonts.map((f) => (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => removeFont(f.family)}
                  className="inline-flex items-center gap-2 px-3 h-8 rounded-full surface-1 hairline-b text-sm text-foreground hover:bg-[hsl(var(--surface-2))] transition-colors"
                >
                  <span style={{ fontFamily: `"${f.family}", system-ui, sans-serif` }}>{f.family}</span>
                  <span className="text-muted-foreground">×</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={addingFont}
                onChange={(e) => setAddingFont(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFont(); }}}
                placeholder="Inter, Roboto, Playfair..."
                className="flex-1 h-9 px-3 rounded-lg surface-1 hairline-b border-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addFont}
                disabled={!addingFont.trim()}
                className="h-9 px-3 rounded-lg surface-1 hairline-b text-sm text-foreground hover:bg-[hsl(var(--surface-2))] transition-colors disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div
          className="rounded-2xl overflow-hidden hairline-t hairline-b p-6 min-h-[280px] flex flex-col justify-between"
          style={{ background: bg, color: text }}
        >
          <div className="flex items-center justify-between">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="logo" className="h-8 w-auto object-contain" />
            ) : (
              <div className="text-xs uppercase tracking-widest opacity-60" style={{ fontFamily: `"${bodyFont}", system-ui` }}>
                Sua marca
              </div>
            )}
            <div className="flex gap-1.5">
              {[colors.primary, colors.secondary, colors.accent].filter(Boolean).slice(0, 3).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c as string }} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3
              className="text-3xl leading-tight"
              style={{ fontFamily: `"${headingFont}", serif`, color: colors.textPrimary || text }}
            >
              O jeito da sua marca falar,<br />
              agora automatizado.
            </h3>
            <p className="text-sm opacity-80" style={{ fontFamily: `"${bodyFont}", system-ui` }}>
              Vídeos, posts e roteiros vão sair já com essa cara.
            </p>
            <button
              className="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium"
              style={{ background: primary, color: colors.background || "#fff", fontFamily: `"${bodyFont}", system-ui` }}
              type="button"
            >
              Assinar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
