/**
 * InstantWow — momento "uau" pós-signup em <90s.
 * Fluxo: captura (2 campos + categoria) → geração streaming → aprovar/regerar.
 * Fallback determinístico se a Edge Function falhar/timeout.
 */
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PAIN_OPTIONS, type PainCategory, getPainOption } from "@/lib/wow-router";
import { useWowFlow } from "@/hooks/useWowFlow";
import { WowPreview } from "./WowPreview";
import { WowConfetti } from "./WowConfetti";
import { WowVoiceCapture } from "./WowVoiceCapture";
import { trackKpi } from "@/lib/kpiTracker";

const VARIANT_KEY = "wow-variant-v1";
type Variant = "form" | "voice";
function resolveVariant(): Variant {
  try {
    const stored = localStorage.getItem(VARIANT_KEY) as Variant | null;
    if (stored === "form" || stored === "voice") return stored;
    const next: Variant = Math.random() < 0.5 ? "form" : "voice";
    localStorage.setItem(VARIANT_KEY, next);
    return next;
  } catch {
    return "form";
  }
}


interface InstantWowProps {
  onDone: () => void;
  onSkip: () => void;
}

export function InstantWow({ onDone, onSkip }: InstantWowProps) {
  const flow = useWowFlow();
  const [step, setStep] = useState<"capture" | "output">(
    flow.state === "ready" ? "output" : "capture",
  );
  const [company, setCompany] = useState(flow.company);
  const [pain, setPain] = useState(flow.pain);
  const [painCategory, setPainCategory] = useState<PainCategory>(flow.painCategory);

  useEffect(() => { flow.start(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    if (flow.state === "generating" || flow.state === "ready") setStep("output");
  }, [flow.state]);

  const option = getPainOption(painCategory);

  const canSubmit =
    company.trim().length > 0 && pain.trim().length > 4 && flow.state !== "generating";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await flow.generate({ company: company.trim(), pain: pain.trim(), painCategory });
  };

  const handleApprove = async () => {
    const res = await flow.approve();
    if (res.ok) {
      toast({ title: "Primeiro output aprovado 🎉", description: "Já está no seu Approvals Center." });
      setTimeout(onDone, 900);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(flow.output).catch(() => { /* clipboard blocked */ });
    toast({ title: "Copiado!", description: "Cole onde precisar." });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04040a] text-foreground overflow-y-auto">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/3 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full bg-red-500/10 blur-3xl" />
      </div>

      {flow.state === "approved" && <WowConfetti />}

      <button
        onClick={() => { flow.skip(); onSkip(); }}
        className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 hover:border-border/80 transition"
        aria-label="Pular momento wow"
      >
        Pular <X className="h-3.5 w-3.5" />
      </button>

      <div className="relative w-full max-w-2xl px-5 py-10">
        <AnimatePresence mode="wait">
          {step === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Momento uau em 60 segundos
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Diga sua maior dor.<br />
                  <span className="text-primary">Um agente resolve agora.</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Sem demo, sem vídeo. Você sai daqui com um entregável real, com o nome da sua empresa, pronto pra usar.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Sua empresa</label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value.slice(0, 120))}
                    placeholder="Ex: Acme Advocacia"
                    maxLength={120}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Área da dor esta semana
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAIN_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPainCategory(p.id)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-sm transition text-left flex items-center gap-2",
                          painCategory === p.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                      >
                        <span className="text-base">{p.emoji}</span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Descreva a dor em 1-2 frases
                  </label>
                  <Textarea
                    value={pain}
                    onChange={(e) => setPain(e.target.value.slice(0, 500))}
                    placeholder="Ex: Nossos SDRs mandam cold emails que ninguém responde. Preciso de um template que funcione pra CFOs de mid-market."
                    maxLength={500}
                    rows={3}
                  />
                  <div className="text-xs text-muted-foreground text-right">{pain.length}/500</div>
                </div>

                <Button
                  className="w-full h-11 text-base"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  Ver o {option.outputLabel.toLowerCase()} agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Fica pronto em ~30 segundos. Você aprova ou descarta no fim.
                </p>
              </div>
            </motion.div>
          )}

          {step === "output" && (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Seu primeiro entregável</div>
                  <h2 className="text-xl font-semibold">{option.outputLabel}</h2>
                </div>
                <button
                  onClick={() => setStep("capture")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ← editar dados
                </button>
              </div>

              <WowPreview
                agentLabel={option.agentLabel}
                outputLabel={option.outputLabel}
                output={flow.output}
                isStreaming={flow.state === "generating"}
                company={flow.company || company}
              />

              {flow.usedFallback && flow.state === "ready" && (
                <p className="text-xs text-amber-400/80 text-center">
                  Usamos um template de referência (agente estava aquecendo). Clique em "Rodar de novo" para uma versão personalizada.
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="default"
                  className="col-span-2 md:col-span-2 h-11"
                  onClick={handleApprove}
                  disabled={flow.state !== "ready"}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprovar & salvar
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={handleCopy}
                  disabled={flow.state !== "ready"}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button
                  variant="ghost"
                  className="h-11"
                  onClick={flow.regenerate}
                  disabled={flow.state === "generating"}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", flow.state === "generating" && "animate-spin")} />
                  Rodar de novo
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Ao aprovar, criamos seu Approvals Center e abrimos o dashboard.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
