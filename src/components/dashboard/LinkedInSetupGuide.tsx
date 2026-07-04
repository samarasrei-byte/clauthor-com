import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink, CheckCircle, Circle, Loader2, Shield, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";
import { Sparkles } from "@/components/icons/Sparkles";
import { toast } from "sonner";
import { TermTooltip, TutorialBanner } from "./SetupGlossary";

const STEPS = [
  {
    title: "Criar app no LinkedIn Developers",
    description: "Acesse o portal de desenvolvedores do LinkedIn e crie um novo aplicativo.",
    link: "https://www.linkedin.com/developers/apps/new",
    linkLabel: "Criar App no LinkedIn",
    details: [
      "Use sua conta LinkedIn pessoal (admin da Company Page)",
      "Vincule a uma Company Page existente",
      "Preencha nome, logo e URL do app",
      "A Company Page precisa ter pelo menos 1 administrador",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Solicitar produtos de API",
    description: "No painel do app, vá em Products e solicite acesso aos produtos necessários.",
    link: "https://www.linkedin.com/developers/apps",
    linkLabel: "Abrir Meus Apps",
    details: [
      '"Share on LinkedIn" - para postar conteúdo',
      '"Sign In with LinkedIn using OpenID Connect" - para autenticação',
      '"Marketing Developer Platform" - para campanhas (requer aprovação)',
      "⏱ Alguns produtos são aprovados automaticamente, outros levam dias",
    ],
    estimatedTime: "5-10 min",
  },
  {
    title: "Configurar OAuth 2.0",
    description: "Em Auth, adicione a URL de callback e anote os escopos necessários.",
    link: null,
    linkLabel: null,
    details: [
      "Adicione como Redirect URL: https://ihzfwkiqkwbgbgjjbeih.supabase.co/auth/v1/callback",
      "Escopos recomendados: r_liteprofile, r_emailaddress, w_member_social",
      "Para ads: r_ads, r_ads_reporting, w_organization_social",
    ],
    estimatedTime: "3 min",
  },
  {
    title: "Copiar Client ID e Client Secret",
    description: "Na aba Auth do seu app, copie o Client ID e gere o Client Secret.",
    link: "https://www.linkedin.com/developers/apps",
    linkLabel: "Abrir App Settings",
    details: [
      "Client ID: visível diretamente na aba Auth",
      "Client Secret: clique em 'Generate' (aparece só uma vez!)",
      "⚠️ Guarde ambos em local seguro",
    ],
    estimatedTime: "2 min",
  },
  {
    title: "Gerar Access Token",
    description: "Use o OAuth 2.0 flow para gerar um token de acesso. O LinkedIn Developer Portal oferece um token de teste.",
    link: null,
    linkLabel: null,
    details: [
      "Opção rápida: Use o 'Token Generator' no portal do app",
      "Opção produção: implemente o fluxo OAuth completo",
      "Tokens de teste expiram em 60 dias",
      "Tokens de produção podem ser renovados automaticamente",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Colar credenciais na CLAUTHOR",
    description: "Cole as credenciais nos campos abaixo para conectar o LinkedIn aos seus agentes.",
    link: null,
    linkLabel: null,
    details: [
      "Credenciais são criptografadas (AES-256-GCM)",
      "Seus agentes de marketing e prospecção terão acesso automático",
      "Permite postar conteúdo, buscar perfis e gerenciar campanhas",
    ],
    estimatedTime: "2 min",
  },
];

const LinkedInSetupGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const skipToCredentials = () => setCurrentStep(STEPS.length - 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("validate-credentials", {
        body: {
          channel: "linkedin",
          credentials: { access_token: accessToken, client_id: clientId },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(data.message || "LinkedIn conectado com sucesso!");
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
        { key: "client_id", value: clientId },
        { key: "client_secret", value: clientSecret },
        { key: "access_token", value: accessToken },
      ].filter((c) => c.value);
      for (const cred of credentials) {
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: "linkedin",
            credential_key: cred.key,
            credential_value: cred.value,
            description: `LinkedIn - ${cred.key}`,
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
          <Globe className="h-5 w-5 text-blue-500" />
          Configurar LinkedIn API
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Siga os 6 passos para conectar o LinkedIn aos seus agentes de marketing e prospecção.
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
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
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
        label="Precisa de ajuda com o LinkedIn API? Veja o guia."
        videoUrl="https://www.youtube.com/results?search_query=linkedin+api+setup+tutorial"
        docsUrl="https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access"
      />

      {currentStep < STEPS.length - 1 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
          onClick={skipToCredentials}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Já tenho as credenciais - pular para o último passo
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}

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
                    <span className="text-sm font-medium">Suas credenciais LinkedIn</span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Client ID" /> - encontrado na aba Auth do app
                    </label>
                    <Input placeholder="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Client Secret" /> - gerado na aba Auth
                    </label>
                    <Input placeholder="Client Secret" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Access Token" /> - gerado pelo Token Generator
                    </label>
                    <Input placeholder="Access Token" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="text-sm" />
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!clientId || !accessToken || validateMutation.isPending}
                    onClick={() => validateMutation.mutate()}
                  >
                    {validateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Validar e Conectar LinkedIn
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
              <h3 className="font-display text-lg font-bold mb-1">LinkedIn Conectado! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Seus agentes de marketing e prospecção agora podem publicar conteúdo e buscar leads no LinkedIn.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Agentes desbloqueados com LinkedIn</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao conectar o LinkedIn, ~6 agentes ganham capacidades: publicação de conteúdo, prospecção de leads,
                análise de perfis, campanhas InMail e monitoramento de engajamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInSetupGuide;
