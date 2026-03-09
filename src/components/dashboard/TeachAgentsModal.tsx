import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, FileUp, Link2, X, CheckCircle2, Loader2, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeachAgentsModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateKnowledge?: () => void;
}

const scanSteps = [
  { label: "Analisando site", duration: 2000 },
  { label: "Mapeando páginas", duration: 2500 },
  { label: "Extraindo conteúdo", duration: 3000 },
  { label: "Criando base de conhecimento", duration: 2000 },
];

type Mode = "select" | "url" | "documents" | "crm";

const TeachAgentsModal = ({ open, onClose, onNavigateKnowledge }: TeachAgentsModalProps) => {
  const [mode, setMode] = useState<Mode>("select");
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanDone, setScanDone] = useState(false);

  const handleScanUrl = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setScanStep(0);
    setScanDone(false);

    for (let i = 0; i < scanSteps.length; i++) {
      setScanStep(i);
      await new Promise(r => setTimeout(r, scanSteps[i].duration));
    }

    setScanDone(true);
    setScanning(false);
  };

  const handleReset = () => {
    setMode("select");
    setUrl("");
    setScanning(false);
    setScanStep(0);
    setScanDone(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const options = [
    {
      id: "url" as const,
      icon: Globe,
      title: "Colar URL do site",
      desc: "Analisamos automaticamente todas as páginas do seu site",
      color: "from-blue-500/20 to-blue-500/5",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      id: "documents" as const,
      icon: FileUp,
      title: "Enviar documentos",
      desc: "PDFs, planilhas, manuais e documentos internos",
      color: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
    {
      id: "crm" as const,
      icon: Link2,
      title: "Conectar CRM",
      desc: "Integre com HubSpot, Salesforce ou RD Station",
      color: "from-purple-500/20 to-purple-500/5",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl bg-background border-border/20 p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-5 bg-gradient-to-b from-primary/8 to-transparent">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-primary/10 blur-[100px] rounded-full" />
          </div>
          <div className="relative z-10 text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center mx-auto"
            >
              <Brain className="h-6 w-6 text-primary" />
            </motion.div>
            <h2 className="font-display text-xl font-bold">Ensinar meus agentes</h2>
            <p className="text-sm text-muted-foreground">
              Quanto mais seus agentes souberem sobre sua empresa, melhores serão as decisões.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {/* Selection screen */}
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 pt-2"
              >
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "documents") {
                        onNavigateKnowledge?.();
                        handleClose();
                      } else {
                        setMode(opt.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-xl border bg-gradient-to-r transition-all hover:scale-[1.02] hover:shadow-lg text-left",
                      opt.color, opt.borderColor
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-card/60 flex items-center justify-center shrink-0">
                      <opt.icon className={cn("h-6 w-6", opt.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{opt.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* URL scan */}
            {mode === "url" && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 pt-2"
              >
                {!scanning && !scanDone && (
                  <>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://suaempresa.com.br"
                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-card/50 border border-border/40 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
                        onKeyDown={(e) => e.key === "Enter" && handleScanUrl()}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleReset} className="flex-1">Voltar</Button>
                      <Button onClick={handleScanUrl} disabled={!url.trim()} className="flex-1">
                        Analisar Site <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}

                {(scanning || scanDone) && (
                  <div className="space-y-4 py-4">
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground font-mono">{url}</p>
                    </div>
                    {scanSteps.map((step, i) => {
                      const isDone = scanDone || i < scanStep;
                      const isActive = scanning && i === scanStep;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all",
                            isDone ? "bg-emerald-500/10 border-emerald-500/30" :
                            isActive ? "bg-primary/10 border-primary/30" :
                            "bg-card/30 border-border/20 opacity-40"
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            isDone ? "text-emerald-400" : isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </span>
                        </motion.div>
                      );
                    })}
                    {scanDone && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center pt-4"
                      >
                        <div className="text-lg font-display font-bold text-emerald-400 mb-2">
                          ✓ Base de conhecimento criada!
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Seus agentes agora conhecem sua empresa.
                        </p>
                        <Button onClick={handleClose}>Fechar</Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* CRM */}
            {mode === "crm" && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 pt-2"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Em breve! Estamos finalizando as integrações com os principais CRMs do mercado.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset} className="flex-1">Voltar</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeachAgentsModal;
