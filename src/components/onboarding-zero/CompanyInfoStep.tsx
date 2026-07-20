import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, ArrowRight, Wand, Check, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/**
 * Tela 4 · Salto #3 · "Website-only".
 *
 * O usuário digita apenas o site. O Thor (Firecrawl) extrai nome + cores + logo
 * em ~4s e mostra um preview animado. Um único botão finaliza.
 *
 * Fallback: se o scrape falhar, aceita nome manual · sem obrigar site.
 */
export default function CompanyInfoStep({ onDone, onSkip, departmentName }: Props) {
  const { scrape, scraping } = useCompanyDna();
  const [website, setWebsite] = useState("");
  const [detected, setDetected] = useState<{
    name: string;
    website: string;
    logo?: string;
    colors: { primary: string; secondary: string; accent: string };
  } | null>(null);
  const [manualName, setManualName] = useState("");
  const [showManual, setShowManual] = useState(false);

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const detect = async () => {
    const url = normalizeUrl(website);
    if (!url) {
      toast.error("Digite o site da sua empresa.");
      return;
    }
    const result = await scrape(url);
    if ("error" in result) {
      toast.error(result.error);
      setShowManual(true);
      return;
    }
    setDetected({
      name: result.title || "",
      website: url,
      logo: result.logo || undefined,
      colors: {
        primary: result.colors.primary ?? DEFAULTS.primary,
        secondary: result.colors.secondary ?? DEFAULTS.secondary,
        accent: result.colors.accent ?? DEFAULTS.accent,
      },
    });
  };

  const confirm = () => {
    if (!detected) return;
    if (!detected.name.trim()) {
      toast.error("Não consegui detectar o nome · pode me contar?");
      setShowManual(true);
      return;
    }
    onDone({
      name: detected.name.trim(),
      website: detected.website,
      colors: detected.colors,
    });
  };

  const confirmManual = () => {
    if (!manualName.trim()) {
      toast.error("Digite o nome da sua empresa.");
      return;
    }
    onDone({
      name: manualName.trim(),
      website: normalizeUrl(website),
      colors: DEFAULTS,
    });
  };

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

      <AnimatePresence mode="wait">
        {!detected ? (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full max-w-xl flex flex-col items-center"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-center max-w-2xl leading-[1.1] mb-4">
              Qual o <span className="text-primary">site</span> da sua empresa?
            </h1>
            <p className="text-lg text-muted-foreground text-center mb-8">
              Vou pegar seu nome, suas cores e seu tom de voz em 4 segundos.
              {departmentName && <> Assim seu {departmentName} já nasce com sua cara.</>}
            </p>

            <div className="w-full flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !scraping) detect(); }}
                  placeholder="suaempresa.com.br"
                  className="h-14 pl-12 text-lg rounded-full border-2 border-[hsl(var(--hairline))] focus:border-primary/60 bg-card/40"
                  autoFocus
                />
              </div>
              <Button
                onClick={detect}
                disabled={scraping || !website.trim()}
                className="h-14 px-6 rounded-full text-base font-semibold"
              >
                {scraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Detectar <Wand className="w-4 h-4 ml-1" /></>}
              </Button>
            </div>

            {showManual && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 w-full rounded-2xl border border-[hsl(var(--hairline))] bg-card/40 p-5"
              >
                <p className="text-sm text-muted-foreground mb-3">Sem problema. Só me diz o nome então:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                    <Input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nome da empresa"
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={confirmManual} className="gap-2">
                    Concluir <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            <button
              type="button"
              onClick={onSkip}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Não tenho site · pular
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="detected"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl flex flex-col items-center"
          >
            <p className="text-xs uppercase tracking-widest text-emerald-500 font-medium mb-4 inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> DNA detectado
            </p>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="w-full rounded-3xl border-2 border-[hsl(var(--hairline))] bg-card/50 p-6 md:p-8 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                {detected.logo ? (
                  <img
                    src={detected.logo}
                    alt=""
                    className="w-14 h-14 rounded-xl object-contain bg-background border border-[hsl(var(--hairline))]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-xl font-bold text-white"
                    style={{ background: detected.colors.primary }}
                  >
                    {(detected.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl font-semibold truncate">{detected.name || "Sua empresa"}</p>
                  <p className="text-sm text-muted-foreground truncate">{detected.website.replace(/^https?:\/\//, "")}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Cores da marca</p>
                <div className="flex gap-2">
                  {(["primary", "secondary", "accent"] as const).map((k, i) => (
                    <motion.div
                      key={k}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                      className="flex-1 h-14 rounded-xl border border-[hsl(var(--hairline))]"
                      style={{ background: detected.colors[k] }}
                      aria-label={`Cor ${k}: ${detected.colors[k]}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-muted-foreground text-center"
            >
              Seus agentes já vão nascer com essa cara.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 flex flex-col sm:flex-row items-center gap-3"
            >
              <Button onClick={confirm} size="lg" className="h-14 px-8 rounded-full text-base gap-2">
                <Check className="w-5 h-5" /> É a minha empresa
              </Button>
              <button
                type="button"
                onClick={() => { setDetected(null); setShowManual(false); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Não é essa · corrigir
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
