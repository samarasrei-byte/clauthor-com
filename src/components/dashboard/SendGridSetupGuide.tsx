import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mail, ExternalLink, CheckCircle, Circle, Loader2, Shield,
  ArrowRight, ArrowLeft, AlertTriangle, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { TermTooltip, TutorialBanner } from "./SetupGlossary";

const STEPS = [
  {
    title: "Criar conta no SendGrid",
    description: "Acesse o site do SendGrid e crie uma conta gratuita. O plano Free permite até 100 e-mails por dia.",
    link: "https://signup.sendgrid.com/",
    linkLabel: "Criar conta SendGrid",
    details: [
      "Use o e-mail da sua empresa",
      "Plano gratuito: 100 emails/dia",
      "Não precisa de cartão de crédito",
    ],
    estimatedTime: "3 min",
  },
  {
    title: "Verificar identidade do remetente",
    description: "O SendGrid exige verificação do e-mail ou domínio remetente antes de enviar.",
    link: "https://app.sendgrid.com/settings/sender_auth",
    linkLabel: "Verificar Remetente",
    details: [
      "Opção 1: Verificar um e-mail único (mais rápido)",
      "Opção 2: Autenticar domínio inteiro (mais profissional)",
      "Verificação por e-mail leva segundos",
      "Autenticação de domínio requer DNS (leva até 48h)",
    ],
    estimatedTime: "5 min",
  },
  {
    title: "Criar API Key",
    description: "No painel do SendGrid, crie uma chave de API com permissão de envio.",
    link: "https://app.sendgrid.com/settings/api_keys",
    linkLabel: "Criar API Key",
    details: [
      'Clique em "Create API Key"',
      'Escolha "Restricted Access" para mais segurança',
      'Ative apenas a permissão "Mail Send"',
      "⚠️ Copie a chave — ela só aparece uma vez!",
    ],
    estimatedTime: "3 min",
  },
  {
    title: "Colar credenciais na CLAUTHOR",
    description: "Cole a API Key e o e-mail remetente nos campos abaixo. Validaremos a conexão automaticamente.",
    link: null,
    linkLabel: null,
    details: [
      "A validação testa a conexão com o SendGrid em tempo real",
      "Credenciais são criptografadas (AES-256-GCM)",
      "Seus agentes terão acesso automático ao envio de e-mails",
    ],
    estimatedTime: "2 min",
  },
];

const SendGridSetupGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("validate-credentials", {
        body: {
          channel: "email",
          credentials: { provider: "sendgrid", api_key: apiKey },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(data.message || "SendGrid conectado com sucesso!");
        markComplete(3);
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
        { key: "api_key", value: apiKey },
        ...(fromEmail ? [{ key: "from_email", value: fromEmail }] : []),
      ];
      for (const cred of credentials) {
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: "sendgrid",
            credential_key: cred.key,
            credential_value: cred.value,
            description: `SendGrid - ${cred.key}`,
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
          <Mail className="h-5 w-5 text-primary" />
          Configurar SendGrid (E-mail)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Siga os 4 passos abaixo para seus agentes enviarem e-mails.
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
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
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
        label="Primeira vez configurando e-mail? Veja o guia."
        videoUrl="https://www.youtube.com/results?search_query=sendgrid+setup+tutorial"
        docsUrl="https://docs.sendgrid.com/for-developers/sending-email/api-getting-started"
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

              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 mt-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {step.linkLabel}
                  </Button>
                </a>
              )}

              {/* Step 4: Credential input */}
              {isLastStep && (
                <div className="space-y-3 mt-4 p-4 rounded-xl bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Suas credenciais</span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TermTooltip term="API Key" /> — copiada do painel do SendGrid
                    </label>
                    <Input
                      placeholder="API Key (SG.xxxxxxx...)"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Input
                    placeholder="E-mail remetente (ex: noreply@suaempresa.com)"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={!apiKey || validateMutation.isPending}
                    onClick={() => validateMutation.mutate()}
                  >
                    {validateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Validar e Conectar SendGrid
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

      {/* Success */}
      {allDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold mb-1">SendGrid Conectado! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Seus agentes agora podem enviar e-mails automaticamente. Até 100 emails/dia no plano gratuito.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Agentes desbloqueados com e-mail</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ao conectar o SendGrid, ~8 agentes ganham capacidade de enviar e-mails: follow-ups, relatórios, 
                notificações, propostas e comunicações automáticas com leads e clientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendGridSetupGuide;
