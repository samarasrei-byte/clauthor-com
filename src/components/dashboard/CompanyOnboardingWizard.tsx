import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Building2, ArrowRight, ArrowLeft, Sparkles, CheckCircle,
  MessageSquare, Package, Mic, Shield, Loader2,
  Globe, Wand2, FileText, ClipboardPaste, Zap, Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CompanyOnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface CompanyData {
  companyName: string;
  industry: string;
  description: string;
  products: string;
  targetAudience: string;
  toneOfVoice: string;
  commonQuestions: string;
  rules: string;
  contactInfo: string;
}

const EMPTY: CompanyData = {
  companyName: "", industry: "", description: "", products: "",
  targetAudience: "", toneOfVoice: "amigavel", commonQuestions: "",
  rules: "", contactInfo: "",
};

const STEPS = [
  { id: "smart", title: "Importação Inteligente", subtitle: "Escolha como alimentar seus agentes", icon: Brain },
  { id: "identity", title: "Identidade da Empresa", subtitle: "Confirme os dados extraídos", icon: Building2 },
  { id: "offering", title: "Produtos & Público", subtitle: "O que você vende e para quem", icon: Package },
  { id: "personality", title: "Tom de Voz & Regras", subtitle: "Como seus agentes devem se comportar", icon: Mic },
  { id: "support", title: "FAQ & Contato", subtitle: "Perguntas frequentes e informações de contato", icon: MessageSquare },
];

const TONE_OPTIONS = [
  { value: "profissional", label: "Profissional", description: "Formal, corporativo, sério", emoji: "👔" },
  { value: "amigavel", label: "Amigável", description: "Casual, acolhedor, próximo", emoji: "😊" },
  { value: "tecnico", label: "Técnico", description: "Preciso, detalhado, especialista", emoji: "🔬" },
  { value: "vendedor", label: "Persuasivo", description: "Focado em vendas, entusiasmado", emoji: "🚀" },
];

const INDUSTRY_OPTIONS = [
  "Saúde / Clínica", "Tecnologia / SaaS", "E-commerce", "Educação",
  "Imobiliário", "Jurídico", "Financeiro", "Alimentação",
  "Beleza / Estética", "Varejo", "Indústria", "Outro"
];

export default function CompanyOnboardingWizard({ onComplete, onSkip }: CompanyOnboardingWizardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMethod, setScanMethod] = useState<"url" | "paste" | "manual" | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [pasteInput, setPasteInput] = useState("");
  const [aiExtracted, setAiExtracted] = useState(false);
  const [data, setData] = useState<CompanyData>({ ...EMPTY });

  const progress = Math.round(((currentStep) / (STEPS.length - 1)) * 100);
  const step = STEPS[currentStep];

  const update = (key: keyof CompanyData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleScanUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    setScanning(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("company-scanner", {
        body: { action: "scan_url", url },
      });
      if (error) throw error;
      if (result?.error) { toast.error(result.error); return; }
      if (result?.data) {
        setData(prev => ({
          ...prev,
          companyName: result.data.companyName || prev.companyName,
          industry: result.data.industry || prev.industry,
          description: result.data.description || prev.description,
          products: result.data.products || prev.products,
          targetAudience: result.data.targetAudience || prev.targetAudience,
          toneOfVoice: result.data.toneOfVoice || prev.toneOfVoice,
          commonQuestions: result.data.commonQuestions || prev.commonQuestions,
          contactInfo: result.data.contactInfo || prev.contactInfo,
        }));
        setAiExtracted(true);
        toast.success("Site analisado! Revise os dados extraídos. 🎯");
        setCurrentStep(1);
      }
    } catch (err) {
      toast.error("Erro ao analisar o site. Tente novamente.");
    } finally {
      setScanning(false);
    }
  }, [urlInput]);

  const handleScanPaste = useCallback(async () => {
    if (!pasteInput.trim()) return;
    setScanning(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("company-scanner", {
        body: { action: "analyze_text", text: pasteInput },
      });
      if (error) throw error;
      if (result?.error) { toast.error(result.error); return; }
      if (result?.data) {
        setData(prev => ({
          ...prev,
          companyName: result.data.companyName || prev.companyName,
          industry: result.data.industry || prev.industry,
          description: result.data.description || prev.description,
          products: result.data.products || prev.products,
          targetAudience: result.data.targetAudience || prev.targetAudience,
          toneOfVoice: result.data.toneOfVoice || prev.toneOfVoice,
          commonQuestions: result.data.commonQuestions || prev.commonQuestions,
          contactInfo: result.data.contactInfo || prev.contactInfo,
        }));
        setAiExtracted(true);
        toast.success("Texto analisado! Revise os dados extraídos. 🎯");
        setCurrentStep(1);
      }
    } catch {
      toast.error("Erro ao analisar o texto.");
    } finally {
      setScanning(false);
    }
  }, [pasteInput]);

  const canProceed = () => {
    if (currentStep === 0) return false; // Must choose a method
    if (currentStep === 1) return data.companyName.trim().length > 0;
    if (currentStep === 2) return data.products.trim().length > 0;
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const boardEntries = [
        { category: "identidade", title: "Nome da Empresa", content: data.companyName },
        { category: "identidade", title: "Segmento", content: data.industry },
        { category: "identidade", title: "Sobre a Empresa", content: data.description },
        { category: "produtos", title: "Produtos e Serviços", content: data.products },
        { category: "publico", title: "Público-Alvo", content: data.targetAudience },
        { category: "comunicacao", title: "Tom de Voz", content: data.toneOfVoice },
        { category: "suporte", title: "Perguntas Frequentes", content: data.commonQuestions },
        { category: "regras", title: "Regras e Restrições", content: data.rules },
        { category: "contato", title: "Informações de Contato", content: data.contactInfo },
      ].filter(e => e.content.trim().length > 0);

      for (const entry of boardEntries) {
        await supabase.from("company_board").upsert(
          { user_id: user.id, category: entry.category, title: entry.title, content: entry.content },
          { onConflict: "user_id,title" }
        );
      }
      toast.success("Informações da empresa salvas! Seus agentes agora conhecem seu negócio. 🎯");
      // Invalidate the board count cache so the gate doesn't reappear
      await queryClient.invalidateQueries({ queryKey: ["company-board-count-gate"] });
      await queryClient.invalidateQueries({ queryKey: ["company-board"] });
      onComplete();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
    else handleSave();
  };
  const back = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Passo essencial - Ensine seus agentes sobre sua empresa
          </motion.div>
          <h1 className="font-display text-2xl font-bold">
            {currentStep === 0 ? "Como você quer ensinar seus agentes?" : "Seus agentes estão aprendendo"}
          </h1>
          {currentStep === 0 && (
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Escolha a forma mais rápida: cole a URL do seu site e a IA extrai tudo automaticamente,
              ou cole qualquer texto sobre sua empresa.
            </p>
          )}
        </div>

        {/* Progress (only after step 0) */}
        {currentStep > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {aiExtracted && <Zap className="h-3 w-3 text-primary" />}
                {aiExtracted ? "Dados extraídos por IA - revise e ajuste" : `Etapa ${currentStep} de ${STEPS.length - 1}`}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* STEP 0: Smart Import */}
            {currentStep === 0 && (
              <div className="space-y-3">
                {/* URL Scan Card */}
                <Card className={`border-2 transition-all cursor-pointer ${scanMethod === "url" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                  onClick={() => setScanMethod("url")}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Escanear meu site</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">RECOMENDADO</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cole a URL do seu site e a IA extrai nome, serviços, preços, contato - tudo automaticamente.
                        </p>
                        {scanMethod === "url" && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="www.suaempresa.com.br"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                className="h-10 flex-1"
                                onKeyDown={e => e.key === "Enter" && handleScanUrl()}
                              />
                              <Button onClick={handleScanUrl} disabled={scanning || !urlInput.trim()} className="gap-2 shrink-0">
                                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                {scanning ? "Analisando..." : "Escanear"}
                              </Button>
                            </div>
                            {scanning && (
                              <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                                <Brain className="h-3.5 w-3.5" />
                                A IA está lendo seu site e extraindo informações...
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Paste Text Card */}
                <Card className={`border-2 transition-all cursor-pointer ${scanMethod === "paste" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                  onClick={() => setScanMethod("paste")}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0">
                        <ClipboardPaste className="h-6 w-6 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">Colar texto ou documento</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cole qualquer texto: apresentação, proposta comercial, bio do Instagram, PDF copiado - a IA organiza tudo.
                        </p>
                        {scanMethod === "paste" && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Cole aqui qualquer informação sobre sua empresa: texto do site, proposta comercial, lista de serviços, bio do Instagram..."
                              value={pasteInput}
                              onChange={e => setPasteInput(e.target.value)}
                              rows={5}
                              className="resize-none text-sm"
                            />
                            <Button onClick={handleScanPaste} disabled={scanning || !pasteInput.trim()} className="w-full gap-2">
                              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                              {scanning ? "Analisando com IA..." : "Extrair informações"}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Card */}
                <Card className={`border-2 transition-all cursor-pointer ${scanMethod === "manual" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}
                  onClick={() => { setScanMethod("manual"); setCurrentStep(1); }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Preencher manualmente</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Preencha campo por campo - ideal para quem ainda não tem site.
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 1: Identity */}
            {currentStep === 1 && (
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <StepHeader icon={step.icon} title={step.title} subtitle={step.subtitle} extracted={aiExtracted} />
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nome da empresa <span className="text-destructive">*</span></label>
                    <Input placeholder="Ex: Clínica Odonto Smile" value={data.companyName} onChange={e => update("companyName", e.target.value)} className="h-10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Segmento</label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRY_OPTIONS.map(ind => (
                        <button key={ind} onClick={() => update("industry", ind)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${data.industry === ind ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"}`}>
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Descrição curta</label>
                    <Textarea placeholder="Ex: Clínica odontológica especializada em ortodontia..." value={data.description} onChange={e => update("description", e.target.value)} rows={3} className="resize-none" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Products */}
            {currentStep === 2 && (
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <StepHeader icon={step.icon} title={step.title} subtitle={step.subtitle} extracted={aiExtracted} />
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Produtos / Serviços <span className="text-destructive">*</span></label>
                    <Textarea placeholder={"Ex:\n- Limpeza dental: R$ 200\n- Clareamento: R$ 800\n- Implante: a partir de R$ 3.000"} value={data.products} onChange={e => update("products", e.target.value)} rows={5} className="resize-none" />
                    <p className="text-[10px] text-muted-foreground mt-1">Liste seus serviços com preços. Os agentes usarão isso para responder clientes.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Público-alvo</label>
                    <Input placeholder="Ex: Adultos 25-55 anos, classe B/C, região Sul de SP" value={data.targetAudience} onChange={e => update("targetAudience", e.target.value)} className="h-10" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 3: Personality */}
            {currentStep === 3 && (
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <StepHeader icon={step.icon} title={step.title} subtitle={step.subtitle} />
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tom de voz dos agentes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONE_OPTIONS.map(tone => (
                        <button key={tone.value} onClick={() => update("toneOfVoice", tone.value)}
                          className={`p-3 rounded-xl border text-left transition-all ${data.toneOfVoice === tone.value ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-muted/30 border-border hover:border-primary/40"}`}>
                          <span className="text-sm font-medium">{tone.emoji} {tone.label}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{tone.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Regras e restrições</label>
                    <Textarea placeholder={"Ex:\n- Nunca oferecer desconto sem aprovação\n- Não marcar consultas para sábado\n- Não falar de concorrentes"} value={data.rules} onChange={e => update("rules", e.target.value)} rows={4} className="resize-none" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 4: Support */}
            {currentStep === 4 && (
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <StepHeader icon={step.icon} title={step.title} subtitle={step.subtitle} />
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Perguntas frequentes</label>
                    <Textarea placeholder={"Ex:\nP: Qual o horário?\nR: Seg-Sex, 8h às 18h\n\nP: Aceitam convênio?\nR: Sim, Amil e Bradesco"} value={data.commonQuestions} onChange={e => update("commonQuestions", e.target.value)} rows={5} className="resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Informações de contato</label>
                    <Textarea placeholder={"Ex:\nEndereço: Rua X, 123 - SP\nTel: (11) 99999-9999\nEmail: contato@clinica.com"} value={data.contactInfo} onChange={e => update("contactInfo", e.target.value)} rows={3} className="resize-none" />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              {onSkip && (
                <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">Pular por agora</Button>
              )}
            </div>
            <Button onClick={next} disabled={!canProceed() || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : currentStep === STEPS.length - 1 ? (
                <><CheckCircle className="h-4 w-4" /> Salvar e continuar</>
              ) : (<>Próximo <ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </div>
        )}

        {currentStep === 0 && onSkip && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">Pular por agora</Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          Dados armazenados com segurança e usados apenas pelos seus agentes
        </div>
      </motion.div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, subtitle, extracted }: { icon: any; title: string; subtitle: string; extracted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{title}</h2>
          {extracted && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Preenchido por IA
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
