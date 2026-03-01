import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, ExternalLink, CheckCircle, Circle, Loader2, Shield,
  ArrowRight, ArrowLeft, AlertTriangle, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { TermTooltip, TutorialBanner } from "./SetupGlossary";

const STEPS = [
  {
    title: "Criar conta Meta Business Suite",
    description: "Acesse o Meta Business Suite e crie ou configure sua conta empresarial.",
    link: "https://business.facebook.com",
    linkLabel: "Abrir Meta Business Suite",
    details: [
      "Use o e-mail da sua empresa",
      "Vincule sua página do Facebook",
      "Se já tem conta WhatsApp Business, pode ser a mesma",
      "A conta é 100% gratuita",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Criar App no Meta Developers",
    description: 'Crie um aplicativo do tipo "Business" no portal de desenvolvedores.',
    link: "https://developers.facebook.com/apps/create/",
    linkLabel: "Criar App",
    details: [
      'Escolha o tipo "Business"',
      "Vincule à sua conta Business Manager",
      'Adicione o produto "Marketing API"',
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Configurar Marketing API",
    description: "No painel do app, adicione o produto Marketing API e configure as permissões.",
    link: "https://developers.facebook.com/apps/",
    linkLabel: "Abrir Meus Apps",
    details: [
      'Clique em "Adicionar Produto" → Marketing API',
      "Solicite permissões: ads_management, ads_read",
      "Para públicos: business_management",
      "⏱ Aprovação pode levar 1-5 dias úteis",
    ],
    estimatedTime: "10 min",
  },
  {
    title: "Obter Ad Account ID",
    description: "No Business Manager, identifique o ID da sua conta de anúncios.",
    link: "https://business.facebook.com/settings/ad-accounts",
    linkLabel: "Abrir Ad Accounts",
    details: [
      "O Ad Account ID tem o formato: act_XXXXXXXXX",
      "Está em Configurações → Contas de Anúncio",
      "Copie o número completo incluindo 'act_'",
      "Certifique-se que a conta está ativa e com método de pagamento",
    ],
    estimatedTime: "3 min",
  },
  {
    title: "Gerar Access Token",
    description: "Gere um token de acesso com permissões de Marketing API.",
    link: "https://developers.facebook.com/tools/explorer/",
    linkLabel: "Abrir Graph API Explorer",
    details: [
      "Use o Graph API Explorer",
      "Selecione seu app",
      "Adicione permissões: ads_management, ads_read, business_management",
      "Clique em 'Generate Access Token'",
      "⚠️ Token de teste expira em ~1h — gere um de longa duração na aba de configurações",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Colar credenciais na CLAUTHOR",
    description: "Cole o Access Token e o Ad Account ID nos campos abaixo.",
    link: null,
    linkLabel: null,
    details: [
      "Credenciais são criptografadas (AES-256-GCM)",
      "Seus agentes de marketing e growth terão acesso automático",
      "Permite criar campanhas, analisar métricas e otimizar anúncios",
    ],
    estimatedTime: "2 min",
  },
];

const MetaAdsSetupGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("validate-credentials", {
        body: {
          channel: "meta_ads",
          credentials: { access_token: accessToken, ad_account_id: adAccountId },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(data.message || "Meta Ads conectado com sucesso!");
        markComplete(5);
        saveMutation.mutate();
      } else {
        toast.error(data.error || "Falha na validação");
      }
    },
    onError: () => toast.error("Erro ao validar credenciais"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const credentials = [
        { key: "access_token", value: accessToken },
        { key: "ad_account_id", value: adAccountId },
      ].filter((c) => c.value);
      for (const cred of credentials) {
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: "meta_ads",
            credential_key: cred.key,
            credential_value: cred.value,
            description: `Meta Ads - ${cred.key}`,
          },
        });
      }
    },
    onSuccess: () => toast.success("Credenciais salvas no cofre criptografado!"),
    onError: () => toast.error("Erro ao salvar credenciais"),
  });

  const markComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const progress = (completedSteps.size / STEPS.length) * 100;
  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const allDone = completedSteps.size === STEPS.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Configurar Meta Ads (Facebook/Instagram Ads)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Siga os 6 passos para conectar o Meta Ads aos seus agentes de marketing e growth.
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {completedSteps.size} de {STEPS.length} etapas concluídas
            </span>
            <Badge variant="secondary" className={`text-[10px] ${allDone ? "bg-emerald-500/15 text-emerald-500" : ""}`}>
              {allDone ? "✅ Completo" : `${Math.round(progress)}%`}
            </Badge>
          </div>
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              currentStep === i
                ? "bg-primary/10 border-primary/30 text-primary"
                : completedSteps.has(i)
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20"
            }`}
          >
            {completedSteps.has(i) ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {i + 1}
          </button>
        ))}
      </div>

      {/* Tutorial banner */}
      <TutorialBanner
        label="Precisa de ajuda com Meta Ads? Veja o guia completo."
        videoUrl="https://www.youtube.com/results?search_query=meta+ads+api+setup+tutorial"
        docsUrl="https://developers.facebook.com/docs/marketing-apis/get-started"
      />

      {/* Current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {currentStep + 1}
                  </span>
                  {step.title}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">⏱ {step.estimatedTime}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <ul className="space-y-2">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 mt-2">
                    <ExternalLink className="h-3.5 w-3.5" /> {step.linkLabel}
                  </Button>
                </a>
              )}

              {/* Step 6: Credential input */}
              {isLastStep && (
                <div className="space-y-3 mt-4 p-4 rounded-xl bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Suas credenciais Meta Ads</span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Access Token" /> — gerado no Graph API Explorer
                    </label>
                    <Input placeholder="Access Token" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Ad Account ID" /> — formato: act_XXXXXXXXX
                    </label>
                    <Input placeholder="Ad Account ID (act_XXXXXXXXX)" value={adAccountId} onChange={(e) => setAdAccountId(e.target.value)} className="text-sm" />
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!accessToken || !adAccountId || validateMutation.isPending}
                    onClick={() => validateMutation.mutate()}
                  >
                    {validateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Validar e Conectar Meta Ads
                  </Button>
                  {validateMutation.data && !validateMutation.data.valid && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">{validateMutation.data.error}</p>
                        {validateMutation.data.hint && (
                          <p className="text-muted-foreground text-xs mt-1">{validateMutation.data.hint}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => s - 1)} className="gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Anterior
                </Button>
                <div className="flex gap-2">
                  {!isLastStep && (
                    <Button variant="outline" size="sm" onClick={() => { markComplete(currentStep); toast.success(`Etapa ${currentStep + 1} concluída!`); }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Marcar como feito
                    </Button>
                  )}
                  {currentStep < STEPS.length - 1 && (
                    <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)} className="gap-1">
                      Próximo <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold mb-1">Meta Ads Conectado! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Seus agentes de marketing e growth agora podem criar e otimizar campanhas no Facebook e Instagram.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Agentes desbloqueados com Meta Ads</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao conectar o Meta Ads, ~5 agentes ganham capacidades: criação de campanhas, otimização de budget,
                análise de ROAS, segmentação de público e relatórios automáticos de performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Custos do Meta Ads</p>
              <p className="text-xs text-muted-foreground mt-1">
                O uso da Marketing API é gratuito. Os custos dos anúncios dependem do budget que você configurar
                em cada campanha. Os agentes apenas gerenciam — você controla o investimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaAdsSetupGuide;
