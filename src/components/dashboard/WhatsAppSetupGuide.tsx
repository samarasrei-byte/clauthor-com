import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Phone, ExternalLink, CheckCircle, Circle, Loader2, Shield,
  ArrowRight, ArrowLeft, Copy, AlertTriangle, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { TermTooltip, TutorialBanner } from "./SetupGlossary";

const STEPS = [
  {
    title: "Criar conta Meta Business",
    description: "Acesse o Meta Business Suite e crie sua conta empresarial gratuita.",
    link: "https://business.facebook.com",
    linkLabel: "Abrir Meta Business Suite",
    details: [
      "Use o e-mail da sua empresa",
      "Tenha o CNPJ em mãos",
      "A conta é 100% gratuita",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Verificar sua empresa",
    description: "A Meta precisa confirmar que sua empresa é real. Envie os documentos solicitados.",
    link: "https://business.facebook.com/settings/security",
    linkLabel: "Ir para Verificação",
    details: [
      "CNPJ ou documento da empresa",
      "Site com domínio próprio (ajuda muito)",
      "Conta de luz ou documento com endereço",
      "⏱ Aprovação leva 1-3 dias úteis",
    ],
    estimatedTime: "1-3 dias",
  },
  {
    title: "Criar App no Meta Developers",
    description: 'Crie um novo aplicativo do tipo "Business" no portal de desenvolvedores.',
    link: "https://developers.facebook.com/apps/create/",
    linkLabel: "Criar App",
    details: [
      'Escolha o tipo "Business"',
      "Dê um nome (ex: MeuApp WhatsApp)",
      "Vincule à sua conta Business",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Adicionar produto WhatsApp",
    description: 'No painel do app, clique em "Adicionar Produto" e selecione WhatsApp.',
    link: "https://developers.facebook.com/apps/",
    linkLabel: "Abrir Meus Apps",
    details: [
      'Clique em "Configurar" no card do WhatsApp',
      "Siga o wizard de configuração rápida",
      "Aceite os termos do WhatsApp Business",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Cadastrar número de telefone",
    description: "Registre um número dedicado para o WhatsApp Business. NÃO pode ser um número já no WhatsApp pessoal.",
    link: null,
    linkLabel: null,
    details: [
      "Use um número NOVO ou chip dedicado",
      "O número recebe um código de verificação por SMS",
      "Depois de verificado, aparece no painel",
    ],
    estimatedTime: "10 min",
  },
  {
    title: "Copiar Phone ID e Access Token",
    description: "No painel do WhatsApp, copie o Phone Number ID e gere um Access Token permanente.",
    link: "https://developers.facebook.com/apps/",
    linkLabel: "Abrir Painel do App",
    details: [
      "Phone Number ID: aparece em WhatsApp > Configuração da API",
      "Access Token: gere em Configurações > Tokens de Acesso",
      "⚠️ Guarde o token em local seguro!",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Colar credenciais na CLAUTHOR",
    description: "Cole o Phone ID e o Access Token nos campos abaixo. Validaremos a conexão automaticamente.",
    link: null,
    linkLabel: null,
    details: [
      "A validação testa a conexão em tempo real",
      "Credenciais são criptografadas (AES-256-GCM)",
      "Seus agentes terão acesso automático ao WhatsApp",
    ],
    estimatedTime: "2 min",
  },
];

const WhatsAppSetupGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const skipToCredentials = () => setCurrentStep(STEPS.length - 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [phoneId, setPhoneId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("validate-credentials", {
        body: {
          channel: "whatsapp",
          credentials: { phone_id: phoneId, access_token: accessToken },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(data.message || "WhatsApp conectado com sucesso!");
        markComplete(6);
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
        { key: "phone_id", value: phoneId },
        { key: "access_token", value: accessToken },
        ...(businessAccountId ? [{ key: "business_account_id", value: businessAccountId }] : []),
      ];
      for (const cred of credentials) {
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: "whatsapp",
            credential_key: cred.key,
            credential_value: cred.value,
            description: `WhatsApp - ${cred.key}`,
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
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Phone className="h-5 w-5 text-emerald-500" />
          Configurar WhatsApp Business API
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Siga os 7 passos abaixo para conectar o WhatsApp aos seus agentes.
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
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
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
            {completedSteps.has(i) ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {i + 1}
          </button>
        ))}
      </div>

      {/* Tutorial banner */}
      <TutorialBanner
        label="Precisa de ajuda? Veja o tutorial completo."
        videoUrl="https://www.youtube.com/results?search_query=whatsapp+business+api+setup+tutorial"
        docsUrl="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
      />

      {/* Skip to credentials shortcut */}
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

      {/* Current step detail */}
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
                <Badge variant="outline" className="text-[10px]">
                  ⏱ {step.estimatedTime}
                </Badge>
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

              {/* Link externo */}
              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 mt-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {step.linkLabel}
                  </Button>
                </a>
              )}

              {/* Step 7: Credential input */}
              {isLastStep && (
                <div className="space-y-3 mt-4 p-4 rounded-xl bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Suas credenciais</span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Phone Number ID" /> - encontrado no painel do WhatsApp
                    </label>
                    <Input
                      placeholder="Phone Number ID"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="Access Token" /> - gerado nas configurações do app
                    </label>
                    <Input
                      placeholder="Access Token"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Input
                    placeholder="Business Account ID (opcional)"
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={!phoneId || !accessToken || validateMutation.isPending}
                    onClick={() => validateMutation.mutate()}
                  >
                    {validateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Validar e Conectar WhatsApp
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

              {/* Navigation + Complete */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Anterior
                </Button>
                <div className="flex gap-2">
                  {!isLastStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        markComplete(currentStep);
                        toast.success(`Etapa ${currentStep + 1} concluída!`);
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Marcar como feito
                    </Button>
                  )}
                  {currentStep < STEPS.length - 1 && (
                    <Button
                      size="sm"
                      onClick={() => setCurrentStep((s) => s + 1)}
                      className="gap-1"
                    >
                      Próximo <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Success state */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold mb-1">WhatsApp Conectado! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Todos os seus agentes agora podem enviar e receber mensagens via WhatsApp Business.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cost info */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Custos do WhatsApp Business API</p>
              <p className="text-xs text-muted-foreground mt-1">
                Primeiras <strong>1.000 conversas/mês são gratuitas</strong>. Após isso, o custo é de ~R$0,25 por conversa
                iniciada pelo negócio. Conversas iniciadas pelo cliente são mais baratas (~R$0,10).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default WhatsAppSetupGuide;
