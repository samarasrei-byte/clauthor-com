import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, ArrowRight, ArrowLeft, Sparkles, CheckCircle,
  MessageSquare, Package, Users, Mic, Shield, Loader2,
  Globe, Phone, Target
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

const STEPS = [
  {
    id: "identity",
    title: "Identidade da Empresa",
    subtitle: "Seus agentes precisam saber quem são",
    icon: Building2,
  },
  {
    id: "offering",
    title: "Produtos & Público",
    subtitle: "O que você vende e para quem",
    icon: Package,
  },
  {
    id: "personality",
    title: "Tom de Voz & Regras",
    subtitle: "Como seus agentes devem se comportar",
    icon: Mic,
  },
  {
    id: "support",
    title: "FAQ & Contato",
    subtitle: "Perguntas frequentes e informações de contato",
    icon: MessageSquare,
  },
];

const TONE_OPTIONS = [
  { value: "profissional", label: "Profissional", description: "Formal, corporativo, sério" },
  { value: "amigavel", label: "Amigável", description: "Casual, acolhedor, próximo" },
  { value: "tecnico", label: "Técnico", description: "Preciso, detalhado, especialista" },
  { value: "vendedor", label: "Persuasivo", description: "Focado em vendas, entusiasmado" },
];

const INDUSTRY_OPTIONS = [
  "Saúde / Clínica", "Tecnologia / SaaS", "E-commerce", "Educação",
  "Imobiliário", "Jurídico", "Financeiro", "Alimentação",
  "Beleza / Estética", "Varejo", "Indústria", "Outro"
];

export default function CompanyOnboardingWizard({ onComplete, onSkip }: CompanyOnboardingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CompanyData>({
    companyName: "",
    industry: "",
    description: "",
    products: "",
    targetAudience: "",
    toneOfVoice: "amigavel",
    commonQuestions: "",
    rules: "",
    contactInfo: "",
  });

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);
  const step = STEPS[currentStep];

  const update = (key: keyof CompanyData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.companyName.trim().length > 0;
      case 1: return data.products.trim().length > 0;
      case 2: return data.toneOfVoice.length > 0;
      case 3: return true;
      default: return true;
    }
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
          {
            user_id: user.id,
            category: entry.category,
            title: entry.title,
            content: entry.content,
          },
          { onConflict: "user_id,title" }
        );
      }

      toast.success("Informações da empresa salvas! Seus agentes agora conhecem seu negócio. 🎯");
      onComplete();
    } catch (err) {
      console.error("Error saving company data:", err);
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            Passo essencial — Ensine seus agentes sobre sua empresa
          </div>
          <h1 className="font-display text-2xl font-bold">
            Seus agentes precisam conhecer sua empresa
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sem essas informações, os agentes não sabem o que responder.
            Preencha agora para que eles trabalhem com contexto real.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {currentStep + 1} de {STEPS.length}: {step.title}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i <= currentStep ? "bg-primary" : "bg-muted"
                } ${i < currentStep ? "cursor-pointer" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{step.title}</h2>
                    <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                  </div>
                </div>

                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Nome da empresa <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Ex: Clínica Odonto Smile"
                        value={data.companyName}
                        onChange={e => update("companyName", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Segmento</label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRY_OPTIONS.map(ind => (
                          <button
                            key={ind}
                            onClick={() => update("industry", ind)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              data.industry === ind
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Descrição curta da empresa</label>
                      <Textarea
                        placeholder="Ex: Clínica odontológica especializada em ortodontia e implantes, atendendo em São Paulo desde 2015..."
                        value={data.description}
                        onChange={e => update("description", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Produtos / Serviços <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        placeholder={"Ex:\n- Limpeza dental: R$ 200\n- Clareamento: R$ 800\n- Implante: a partir de R$ 3.000\n- Ortodontia: consulta gratuita"}
                        value={data.products}
                        onChange={e => update("products", e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Liste seus principais produtos/serviços com preços. Os agentes usarão isso para responder consultas.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Público-alvo</label>
                      <Input
                        placeholder="Ex: Adultos 25-55 anos, classe B/C, região Sul de SP"
                        value={data.targetAudience}
                        onChange={e => update("targetAudience", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Tom de voz dos agentes</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TONE_OPTIONS.map(tone => (
                          <button
                            key={tone.value}
                            onClick={() => update("toneOfVoice", tone.value)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              data.toneOfVoice === tone.value
                                ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                                : "bg-muted/30 border-border hover:border-primary/40"
                            }`}
                          >
                            <span className="text-sm font-medium">{tone.label}</span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{tone.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Regras e restrições
                      </label>
                      <Textarea
                        placeholder={"Ex:\n- Nunca oferecer desconto sem aprovação\n- Não marcar consultas para sábado\n- Sempre encaminhar emergências para o WhatsApp do Dr. João\n- Não falar de concorrentes"}
                        value={data.rules}
                        onChange={e => update("rules", e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Perguntas frequentes dos seus clientes
                      </label>
                      <Textarea
                        placeholder={"Ex:\nP: Qual o horário de funcionamento?\nR: Segunda a sexta, 8h às 18h\n\nP: Aceitam convênio?\nR: Sim, Amil, Bradesco e SulAmérica\n\nP: Tem estacionamento?\nR: Sim, gratuito para pacientes"}
                        value={data.commonQuestions}
                        onChange={e => update("commonQuestions", e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Informações de contato
                      </label>
                      <Textarea
                        placeholder={"Ex:\nEndereço: Rua X, 123 - São Paulo\nTelefone: (11) 99999-9999\nEmail: contato@clinica.com\nHorário: Seg-Sex 8h-18h"}
                        value={data.contactInfo}
                        onChange={e => update("contactInfo", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            {onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
                Pular por agora
              </Button>
            )}
          </div>

          <Button
            onClick={next}
            disabled={!canProceed() || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentStep === STEPS.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvar e continuar
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Trust indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="h-3 w-3" />
          Dados armazenados com segurança e usados apenas pelos seus agentes
        </div>
      </motion.div>
    </div>
  );
}
