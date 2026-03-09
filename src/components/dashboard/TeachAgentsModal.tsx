import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, FileUp, Link2, CheckCircle2, Loader2, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeachAgentsModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateKnowledge?: () => void;
}

const scanSteps = [
  { label: "Analisando site", key: "fetching" },
  { label: "Extraindo conteúdo com IA", key: "analyzing" },
  { label: "Criando base de conhecimento", key: "saving" },
];

type Mode = "select" | "url" | "documents" | "crm";

const TeachAgentsModal = ({ open, onClose, onNavigateKnowledge }: TeachAgentsModalProps) => {
  const [mode, setMode] = useState<Mode>("select");
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");

  const handleScanUrl = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setScanStep(0);
    setScanDone(false);
    setScanError("");
    setScanResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast.error("Faça login primeiro."); setScanning(false); return; }

      setScanStep(0); // Fetching via Firecrawl
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firecrawl-scrape`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url: url.trim(), options: { formats: ["markdown"] } }),
        }
      );

      setScanStep(1); // Analyzing with AI

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao analisar o site");
      }

      const scrapeData = await response.json();
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

      if (!markdown) throw new Error("Não foi possível extrair conteúdo da página.");

      // Use AI to extract structured company info from markdown
      const aiResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-scanner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "analyze_content", content: markdown, url: url.trim(), title: metadata.title }),
        }
      );

      const aiData = await aiResponse.json();
      setScanStep(2); // Saving

      const extracted = aiData.success && aiData.data ? aiData.data : {
        companyName: metadata.title || url.trim(),
        description: markdown.substring(0, 500),
      };
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const entries = [
            { title: "Nome da Empresa", content: extracted.companyName || "", category: "company_info" },
            { title: "Segmento", content: extracted.industry || "", category: "company_info" },
            { title: "Descrição", content: extracted.description || "", category: "company_info" },
            { title: "Produtos/Serviços", content: extracted.products || "", category: "products" },
            { title: "Público-Alvo", content: extracted.targetAudience || "", category: "audience" },
            { title: "Tom de Voz", content: extracted.toneOfVoice || "", category: "brand" },
            { title: "Perguntas Frequentes", content: extracted.commonQuestions || "", category: "faq" },
            { title: "Contato", content: extracted.contactInfo || "", category: "contact" },
          ].filter(e => e.content);

          for (const entry of entries) {
            await supabase.from("company_board").upsert(
              { user_id: user.id, title: entry.title, content: entry.content, category: entry.category },
              { onConflict: "user_id,title" }
            ).select();
          }
        }

        setScanResult(extracted);
        setScanDone(true);
        toast.success("Base de conhecimento criada com sucesso!");
      } else {
        throw new Error("Não foi possível extrair informações.");
      }
    } catch (err: any) {
      setScanError(err.message || "Erro desconhecido");
      toast.error(err.message || "Erro ao analisar site");
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setMode("select");
    setUrl("");
    setScanning(false);
    setScanStep(0);
    setScanDone(false);
    setScanResult(null);
    setScanError("");
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

            {/* URL scan — REAL scraping */}
            {mode === "url" && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 pt-2"
              >
                {!scanning && !scanDone && !scanError && (
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

                {scanning && (
                  <div className="space-y-4 py-4">
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground font-mono">{url}</p>
                    </div>
                    {scanSteps.map((step, i) => {
                      const isDone = i < scanStep;
                      const isActive = i === scanStep;
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
                  </div>
                )}

                {scanDone && scanResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 py-4"
                  >
                    <div className="text-center">
                      <div className="text-lg font-display font-bold text-emerald-400 mb-2">
                        ✓ Base de conhecimento criada!
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Seus agentes agora conhecem sua empresa.
                      </p>
                    </div>
                    
                    {/* Show extracted info summary */}
                    <div className="bg-card/50 border border-border/30 rounded-xl p-4 space-y-2 text-sm">
                      {scanResult.companyName && (
                        <div><span className="text-muted-foreground">Empresa:</span> <strong>{scanResult.companyName}</strong></div>
                      )}
                      {scanResult.industry && (
                        <div><span className="text-muted-foreground">Segmento:</span> {scanResult.industry}</div>
                      )}
                      {scanResult.description && (
                        <div><span className="text-muted-foreground">Sobre:</span> {scanResult.description}</div>
                      )}
                    </div>

                    <Button onClick={handleClose} className="w-full">Fechar</Button>
                  </motion.div>
                )}

                {scanError && !scanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4 space-y-3"
                  >
                    <p className="text-sm text-destructive">{scanError}</p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleReset} className="flex-1">Voltar</Button>
                      <Button onClick={handleScanUrl} className="flex-1">Tentar novamente</Button>
                    </div>
                  </motion.div>
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
