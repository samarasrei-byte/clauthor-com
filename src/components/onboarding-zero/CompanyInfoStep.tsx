import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Building2, Globe, Palette, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCompanyDna } from "@/hooks/useCompanyDna";

export interface CompanyInfo {
  name: string;
  website: string;
  colors: { primary: string; secondary: string; accent: string };
}

interface Props {
  onDone: (info: CompanyInfo) => void;
  onSkip: () => void;
  departmentName?: string;
}

const DEFAULTS = { primary: "#DC2626", secondary: "#0F172A", accent: "#F59E0B" };

export default function CompanyInfoStep({ onDone, onSkip, departmentName }: Props) {
  const { scrape, scraping } = useCompanyDna();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [colors, setColors] = useState(DEFAULTS);
  const [autoFetched, setAutoFetched] = useState(false);

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const handleAutoDetect = async () => {
    const url = normalizeUrl(website);
    if (!url) {
      toast.error("Informe o website da sua empresa primeiro.");
      return;
    }
    const result = await scrape(url);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setColors({
      primary: result.colors.primary ?? DEFAULTS.primary,
      secondary: result.colors.secondary ?? DEFAULTS.secondary,
      accent: result.colors.accent ?? DEFAULTS.accent,
    });
    if (!name && result.title) setName(result.title);
    setAutoFetched(true);
    toast.success("Cores da marca detectadas automaticamente!");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Diga o nome da sua empresa.");
      return;
    }
    onDone({
      name: name.trim(),
      website: normalizeUrl(website),
      colors,
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Passo final
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Conte um pouco sobre sua empresa
          </h1>
          <p className="text-muted-foreground">
            {departmentName
              ? `Vou personalizar seu ${departmentName} com a identidade da sua marca.`
              : "Vou personalizar seus agentes com a identidade da sua marca."}
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-primary" />
              Nome da empresa
            </Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clauthor Tecnologia"
              maxLength={120}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website" className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-primary" />
              Website
              <span className="text-xs text-muted-foreground font-normal">
                (opcional — usamos para detectar suas cores)
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="company-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="suaempresa.com.br"
                maxLength={255}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoDetect}
                disabled={scraping || !website.trim()}
              >
                {scraping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Detectar"
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-primary" />
              Cores da marca
              {autoFetched && (
                <span className="text-xs text-emerald-500 font-normal">
                  ✓ detectadas do site
                </span>
              )}
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {(["primary", "secondary", "accent"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <span className="text-xs text-muted-foreground capitalize">
                    {key === "primary" ? "Principal" : key === "secondary" ? "Secundária" : "Destaque"}
                  </span>
                  <div className="relative">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                      className="w-full h-10 rounded-md border border-border cursor-pointer bg-transparent"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">
                    {colors[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
            Pular por enquanto
          </Button>
          <Button onClick={handleSubmit} size="lg" className="gap-2">
            Concluir configuração
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
