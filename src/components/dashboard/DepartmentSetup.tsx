import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle, Shield, Loader2, ArrowRight, Sparkles,
  MessageSquare, Mail, Globe, Target, FileSpreadsheet,
  Linkedin, Phone, BarChart3, X, ChevronDown, ChevronUp,
  Zap, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface SetupField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

interface DeptIntegration {
  id: string;
  name: string;
  icon: any;
  description: string;
  priority: "essencial" | "recomendada" | "opcional";
  fields: SetupField[];
  integrationKey: string;
}

// Maps department IDs to their required integrations
const departmentIntegrations: Record<string, DeptIntegration[]> = {
  comercial: [
    {
      id: "whatsapp", name: "WhatsApp Business", icon: MessageSquare,
      description: "Permite que seus agentes de vendas atendam leads e clientes pelo WhatsApp automaticamente.",
      priority: "essencial",
      integrationKey: "whatsapp",
      fields: [
        { key: "phone_id", label: "Phone Number ID", placeholder: "ID do número (Meta Business)", required: true },
        { key: "access_token", label: "Access Token", placeholder: "Token de acesso da API", type: "password", required: true },
      ],
    },
    {
      id: "email", name: "E-mail (SendGrid)", icon: Mail,
      description: "Envio de propostas comerciais, follow-ups e notificações por e-mail.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "vendas@suaempresa.com" },
      ],
    },
    {
      id: "hubspot", name: "HubSpot CRM", icon: BarChart3,
      description: "Sincroniza leads qualificados e deals com seu CRM automaticamente.",
      priority: "recomendada",
      integrationKey: "hubspot",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "pat-xxx...", type: "password", required: true },
      ],
    },
  ],
  marketing: [
    {
      id: "meta_ads", name: "Meta Ads (Facebook/Instagram)", icon: Target,
      description: "Gerencia campanhas de anúncios no Facebook e Instagram automaticamente.",
      priority: "essencial",
      integrationKey: "meta_ads",
      fields: [
        { key: "access_token", label: "Access Token", placeholder: "Token do Graph API", type: "password", required: true },
        { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_XXXXXXXXX", required: true },
      ],
    },
    {
      id: "email", name: "E-mail Marketing (SendGrid)", icon: Mail,
      description: "Automação de campanhas de email marketing e newsletters.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "marketing@suaempresa.com" },
      ],
    },
    {
      id: "instagram", name: "Instagram", icon: Globe,
      description: "Publicação automática de conteúdo e respostas a DMs.",
      priority: "recomendada",
      integrationKey: "instagram",
      fields: [
        { key: "access_token", label: "Access Token", placeholder: "Mesmo token do Meta Business", type: "password", required: true },
        { key: "instagram_account_id", label: "Instagram Account ID", placeholder: "ID da conta IG" },
      ],
    },
  ],
  suporte: [
    {
      id: "whatsapp", name: "WhatsApp Business", icon: MessageSquare,
      description: "Canal principal de atendimento ao cliente 24/7.",
      priority: "essencial",
      integrationKey: "whatsapp",
      fields: [
        { key: "phone_id", label: "Phone Number ID", placeholder: "ID do número (Meta Business)", required: true },
        { key: "access_token", label: "Access Token", placeholder: "Token de acesso da API", type: "password", required: true },
      ],
    },
    {
      id: "email", name: "E-mail Suporte", icon: Mail,
      description: "Atendimento por e-mail com respostas automáticas inteligentes.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "suporte@suaempresa.com" },
      ],
    },
  ],
  tecnologia: [
    {
      id: "email", name: "E-mail Notificações", icon: Mail,
      description: "Alertas de segurança, deploys e notificações de infraestrutura.",
      priority: "recomendada",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "devops@suaempresa.com" },
      ],
    },
  ],
  financeiro: [
    {
      id: "email", name: "E-mail Financeiro", icon: Mail,
      description: "Envio de relatórios, cobranças e notificações financeiras.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "financeiro@suaempresa.com" },
      ],
    },
    {
      id: "sheets", name: "Google Sheets", icon: FileSpreadsheet,
      description: "Exportação automática de relatórios e dados financeiros para planilhas.",
      priority: "recomendada",
      integrationKey: "google_sheets",
      fields: [
        { key: "api_key", label: "API Key / Service Account", placeholder: "Chave JSON ou API Key", type: "password", required: true },
      ],
    },
  ],
  prospeccao: [
    {
      id: "linkedin", name: "LinkedIn", icon: Linkedin,
      description: "Prospecção B2B automatizada, conexões e mensagens no LinkedIn.",
      priority: "essencial",
      integrationKey: "linkedin",
      fields: [
        { key: "client_id", label: "Client ID", placeholder: "Do painel do app", required: true },
        { key: "access_token", label: "Access Token", placeholder: "Token de acesso", type: "password", required: true },
      ],
    },
    {
      id: "whatsapp", name: "WhatsApp", icon: MessageSquare,
      description: "Prospecção e follow-up de leads via WhatsApp.",
      priority: "essencial",
      integrationKey: "whatsapp",
      fields: [
        { key: "phone_id", label: "Phone Number ID", placeholder: "ID do número (Meta Business)", required: true },
        { key: "access_token", label: "Access Token", placeholder: "Token de acesso da API", type: "password", required: true },
      ],
    },
    {
      id: "email", name: "E-mail (SendGrid)", icon: Mail,
      description: "Cold emails e sequências de prospecção automatizadas.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "prospeccao@suaempresa.com" },
      ],
    },
  ],
  criacao: [
    {
      id: "instagram", name: "Instagram", icon: Globe,
      description: "Publicação direta de peças criativas e vídeos.",
      priority: "recomendada",
      integrationKey: "instagram",
      fields: [
        { key: "access_token", label: "Access Token", placeholder: "Token do Meta Business", type: "password", required: true },
      ],
    },
  ],
  rh: [
    {
      id: "email", name: "E-mail RH", icon: Mail,
      description: "Comunicação com candidatos, onboarding e notificações internas.",
      priority: "essencial",
      integrationKey: "sendgrid",
      fields: [
        { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
        { key: "from_email", label: "E-mail remetente", placeholder: "rh@suaempresa.com" },
      ],
    },
  ],
};

// Default for departments without specific mappings
const defaultIntegrations: DeptIntegration[] = [
  {
    id: "email", name: "E-mail (SendGrid)", icon: Mail,
    description: "Comunicação por e-mail para notificações e relatórios.",
    priority: "recomendada",
    integrationKey: "sendgrid",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
      { key: "from_email", label: "E-mail remetente", placeholder: "contato@suaempresa.com" },
    ],
  },
];

const priorityColors = {
  essencial: "bg-red-500/10 text-red-500 border-red-500/20",
  recomendada: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  opcional: "bg-muted text-muted-foreground border-border",
};

const priorityLabels = {
  essencial: "Essencial",
  recomendada: "Recomendada",
  opcional: "Opcional",
};

interface DepartmentSetupProps {
  departmentId: string;
  departmentName: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function DepartmentSetup({ departmentId, departmentName, onComplete, onSkip }: DepartmentSetupProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const integrations = departmentIntegrations[departmentId] || defaultIntegrations;

  const [expandedId, setExpandedId] = useState<string | null>(integrations[0]?.id || null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Fetch already-connected credentials
  const { data: connectedCreds = [], refetch } = useQuery({
    queryKey: ["dept-setup-creds"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("credential-manager", {
        body: { action: "list_platform" },
      });
      if (error) return [];
      return data?.credentials || [];
    },
    enabled: !!user,
  });

  // Check which integrations are already connected
  useEffect(() => {
    const connMap: Record<string, Set<string>> = {};
    for (const c of connectedCreds as any[]) {
      if (!connMap[c.integration_name]) connMap[c.integration_name] = new Set();
      connMap[c.integration_name].add(c.credential_key);
    }

    const completed = new Set<string>();
    for (const ig of integrations) {
      const keys = connMap[ig.integrationKey];
      const required = ig.fields.filter(f => f.required);
      if (keys && required.every(f => keys.has(f.key))) {
        completed.add(ig.id);
      }
    }
    setCompletedIds(completed);
  }, [connectedCreds, integrations]);

  const progress = integrations.length > 0
    ? Math.round((completedIds.size / integrations.length) * 100)
    : 100;

  const essentialCount = integrations.filter(ig => ig.priority === "essencial").length;
  const essentialDone = integrations.filter(ig => ig.priority === "essencial" && completedIds.has(ig.id)).length;

  const handleSave = async (ig: DeptIntegration) => {
    const igValues = values[ig.id] || {};
    const required = ig.fields.filter(f => f.required);
    if (!required.every(f => igValues[f.key]?.trim())) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSavingId(ig.id);
    try {
      for (const field of ig.fields) {
        if (!igValues[field.key]?.trim()) continue;
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: ig.integrationKey,
            credential_key: field.key,
            credential_value: igValues[field.key],
            description: `${departmentName} - ${ig.name} - ${field.key}`,
          },
        });
      }

      toast.success(`${ig.name} conectado com sucesso!`);
      setCompletedIds(prev => new Set([...prev, ig.id]));
      setValues(prev => ({ ...prev, [ig.id]: {} }));
      refetch();

      // Auto-expand next uncompleted
      const nextIdx = integrations.findIndex(i => i.id !== ig.id && !completedIds.has(i.id));
      if (nextIdx >= 0) setExpandedId(integrations[nextIdx].id);
    } catch {
      toast.error("Erro ao salvar credenciais. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  const updateValue = (igId: string, fieldKey: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [igId]: { ...(prev[igId] || {}), [fieldKey]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">
              Configurar Departamento: {departmentName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure as integrações abaixo para que seus agentes possam operar em canais externos.
              Sem isso, eles funcionam apenas pelo chat interno do dashboard.
            </p>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
              Pular por agora
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {completedIds.size} de {integrations.length} integrações configuradas
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {essentialCount > 0 && essentialDone < essentialCount && (
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{essentialCount - essentialDone} integração(ões) essencial(is) pendente(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-3">
        {integrations.map((ig, idx) => {
          const isCompleted = completedIds.has(ig.id);
          const isExpanded = expandedId === ig.id;
          const isSaving = savingId === ig.id;
          const Icon = ig.icon;

          return (
            <motion.div
              key={ig.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`transition-all ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
                <CardContent className="p-4 space-y-3">
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ig.id)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted ? "bg-emerald-500/15" : "bg-primary/10"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ig.name}</span>
                        <Badge variant="outline" className={`text-[9px] ${priorityColors[ig.priority]}`}>
                          {priorityLabels[ig.priority]}
                        </Badge>
                        {isCompleted && (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[9px]">
                            Conectado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {ig.description}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Expanded Fields */}
                  <AnimatePresence>
                    {isExpanded && !isCompleted && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-border space-y-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            Credenciais criptografadas com AES-256-GCM
                          </div>

                          {ig.fields.map(field => (
                            <div key={field.key}>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                              </label>
                              <Input
                                placeholder={field.placeholder}
                                type={field.type || "text"}
                                value={values[ig.id]?.[field.key] || ""}
                                onChange={(e) => updateValue(ig.id, field.key, e.target.value)}
                                className="text-sm h-9"
                              />
                            </div>
                          ))}

                          <Button
                            className="w-full gap-2 h-9"
                            disabled={isSaving || !ig.fields.filter(f => f.required).every(f => values[ig.id]?.[f.key]?.trim())}
                            onClick={() => handleSave(ig)}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Conectar {ig.name}
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[11px] text-muted-foreground max-w-md">
          Você pode configurar ou alterar estas integrações a qualquer momento em Integrações no menu lateral.
        </p>
        {onComplete && (
          <Button
            onClick={onComplete}
            className="gap-2"
            variant={progress === 100 ? "default" : "outline"}
          >
            {progress === 100 ? (
              <>
                <Sparkles className="h-4 w-4" />
                Tudo pronto — Acessar Dashboard
              </>
            ) : (
              <>
                Continuar sem configurar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
