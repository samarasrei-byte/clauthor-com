import { motion, AnimatePresence } from "framer-motion";
import HelpTooltip from "@/components/HelpTooltip";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, MessageSquare, Globe, Facebook,
  FileSpreadsheet, BookOpen, Trello, BarChart3,
  TrendingUp, Code, ArrowRight, Linkedin, Megaphone,
  Instagram, ShoppingCart, CreditCard, Database,
  Clock, Star, Key, ChevronDown, ChevronUp,
  CheckCircle, Loader2, Shield, AlertTriangle, Sparkles, Zap
} from "lucide-react";
import WhatsAppSetupGuide from "@/components/dashboard/WhatsAppSetupGuide";
import SendGridSetupGuide from "@/components/dashboard/SendGridSetupGuide";
import LinkedInSetupGuide from "@/components/dashboard/LinkedInSetupGuide";
import MetaAdsSetupGuide from "@/components/dashboard/MetaAdsSetupGuide";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

interface Integration {
  icon: any;
  name: string;
  desc: string;
  status: string;
  category: string;
  hasSetup: boolean;
  setupKey?: string;
  difficulty: string;
  difficultyStars: number;
  totalTime: string;
  needsApi: boolean;
  apiInfo: string;
  integrationKey: string;
  quickFields?: CredentialField[];
}

const integrations: Integration[] = [
  {
    icon: MessageSquare, name: "WhatsApp", desc: "Atenda clientes e envie notificações via WhatsApp.",
    status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "whatsapp",
    difficulty: "Médio", difficultyStars: 2, totalTime: "~30 min", needsApi: true,
    apiInfo: "Phone ID + Access Token (Meta Business)",
    integrationKey: "whatsapp",
    quickFields: [
      { key: "phone_id", label: "Phone Number ID", placeholder: "Ex: 1234567890", required: true },
      { key: "access_token", label: "Access Token", placeholder: "Token do Meta Business", type: "password", required: true },
      { key: "business_account_id", label: "Business Account ID", placeholder: "Opcional" },
    ],
  },
  {
    icon: Mail, name: "E-mail (SendGrid)", desc: "Envie e receba e-mails automaticamente.",
    status: "Disponível", category: "Comunicação", hasSetup: true, setupKey: "email",
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~10 min", needsApi: true,
    apiInfo: "API Key (conta gratuita)",
    integrationKey: "sendgrid",
    quickFields: [
      { key: "api_key", label: "API Key", placeholder: "SG.xxxxxxx...", type: "password", required: true },
      { key: "from_email", label: "E-mail remetente", placeholder: "noreply@suaempresa.com" },
    ],
  },
  {
    icon: Linkedin, name: "LinkedIn", desc: "Automatize prospecção e networking no LinkedIn.",
    status: "Disponível", category: "Social", hasSetup: true, setupKey: "linkedin",
    difficulty: "Médio", difficultyStars: 2, totalTime: "~20 min", needsApi: true,
    apiInfo: "Client ID + Secret + Access Token",
    integrationKey: "linkedin",
    quickFields: [
      { key: "client_id", label: "Client ID", placeholder: "Do painel do app", required: true },
      { key: "client_secret", label: "Client Secret", placeholder: "Gerado na aba Auth", type: "password" },
      { key: "access_token", label: "Access Token", placeholder: "Token de acesso", type: "password", required: true },
    ],
  },
  {
    icon: Megaphone, name: "Meta Ads", desc: "Gerencie campanhas no Facebook e Instagram Ads.",
    status: "Disponível", category: "Ads", hasSetup: true, setupKey: "meta-ads",
    difficulty: "Médio", difficultyStars: 2, totalTime: "~25 min", needsApi: true,
    apiInfo: "Access Token + Ad Account ID",
    integrationKey: "meta_ads",
    quickFields: [
      { key: "access_token", label: "Access Token", placeholder: "Do Graph API Explorer", type: "password", required: true },
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_XXXXXXXXX", required: true },
    ],
  },
  {
    icon: Instagram, name: "Instagram", desc: "Responda DMs e comentários automaticamente.",
    status: "Disponível", category: "Social", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true,
    apiInfo: "Via Meta Business (mesmo token)",
    integrationKey: "instagram",
    quickFields: [
      { key: "access_token", label: "Access Token", placeholder: "Mesmo do Meta Business", type: "password", required: true },
      { key: "instagram_account_id", label: "Instagram Account ID", placeholder: "ID da conta IG" },
    ],
  },
  {
    icon: Facebook, name: "Facebook", desc: "Gerencie mensagens e posts no Facebook.",
    status: "Em Breve", category: "Social", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true,
    apiInfo: "Via Meta Business",
    integrationKey: "facebook",
  },
  {
    icon: FileSpreadsheet, name: "Google Sheets", desc: "Leia e escreva dados em planilhas.",
    status: "Disponível", category: "Produtividade", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true,
    apiInfo: "OAuth Google",
    integrationKey: "google_sheets",
    quickFields: [
      { key: "api_key", label: "API Key / Service Account", placeholder: "Chave de serviço JSON ou API Key", type: "password", required: true },
    ],
  },
  {
    icon: BookOpen, name: "Notion", desc: "Sincronize dados com seu workspace Notion.",
    status: "Disponível", category: "Produtividade", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true,
    apiInfo: "Integration Token",
    integrationKey: "notion",
    quickFields: [
      { key: "api_key", label: "Integration Token", placeholder: "secret_xxxxxxx...", type: "password", required: true },
    ],
  },
  {
    icon: Trello, name: "Trello", desc: "Crie cards e gerencie boards automaticamente.",
    status: "Disponível", category: "Produtividade", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~5 min", needsApi: true,
    apiInfo: "API Key + Token",
    integrationKey: "trello",
    quickFields: [
      { key: "api_key", label: "API Key", placeholder: "Chave da API", type: "password", required: true },
      { key: "token", label: "Token", placeholder: "Token de autorização", type: "password", required: true },
    ],
  },
  {
    icon: BarChart3, name: "HubSpot", desc: "Sincronize leads, deals e contatos.",
    status: "Disponível", category: "CRM", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~3 min", needsApi: true,
    apiInfo: "API Key (gratuito)",
    integrationKey: "hubspot",
    quickFields: [
      { key: "api_key", label: "API Key", placeholder: "pat-xxx...", type: "password", required: true },
    ],
  },
  {
    icon: TrendingUp, name: "Pipedrive", desc: "Gerencie pipeline de vendas automaticamente.",
    status: "Disponível", category: "CRM", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "~3 min", needsApi: true,
    apiInfo: "API Token",
    integrationKey: "pipedrive",
    quickFields: [
      { key: "api_key", label: "API Token", placeholder: "Token do Pipedrive", type: "password", required: true },
    ],
  },
  {
    icon: ShoppingCart, name: "Shopify", desc: "Integre catálogo, pedidos e atendimento.",
    status: "Em Breve", category: "E-commerce", hasSetup: false,
    difficulty: "Médio", difficultyStars: 2, totalTime: "-", needsApi: true,
    apiInfo: "Admin API Key",
    integrationKey: "shopify",
  },
  {
    icon: CreditCard, name: "Stripe", desc: "Gerencie pagamentos e assinaturas.",
    status: "Em Breve", category: "Pagamentos", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true,
    apiInfo: "Secret Key",
    integrationKey: "stripe",
  },
  {
    icon: Database, name: "Zapier", desc: "Conecte com +5000 apps via automações.",
    status: "Em Breve", category: "Automação", hasSetup: false,
    difficulty: "Fácil", difficultyStars: 1, totalTime: "-", needsApi: true,
    apiInfo: "Webhook URL",
    integrationKey: "zapier",
  },
  {
    icon: Code, name: "APIs Customizadas", desc: "Conecte qualquer API REST ou GraphQL.",
    status: "Disponível", category: "Desenvolvimento", hasSetup: false,
    difficulty: "Avançado", difficultyStars: 3, totalTime: "Variável", needsApi: true,
    apiInfo: "Depende da API",
    integrationKey: "custom_api",
    quickFields: [
      { key: "api_key", label: "API Key", placeholder: "Chave da API", type: "password", required: true },
      { key: "base_url", label: "Base URL", placeholder: "https://api.exemplo.com" },
    ],
  },
];

const IntegrationQuickConnect = ({ ig, connectedKeys, onSaved }: { ig: Integration; connectedKeys: Set<string>; onSaved: () => void }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  const fields = ig.quickFields || [];
  const allRequiredFilled = fields.filter(f => f.required).every(f => values[f.key]?.trim());
  const allConnected = fields.filter(f => f.required).every(f => connectedKeys.has(f.key));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate first if has setup
      if (ig.setupKey) {
        setValidating(true);
        const channelMap: Record<string, string> = { whatsapp: "whatsapp", email: "email", linkedin: "linkedin", "meta-ads": "meta_ads" };
        const channel = channelMap[ig.setupKey] || ig.integrationKey;
        const { data } = await supabase.functions.invoke("validate-credentials", {
          body: { channel, credentials: values },
        });
        setValidating(false);
        if (data && !data.valid) {
          toast.error(data.error || "Credencial inválida. Verifique e tente novamente.");
          setSaving(false);
          return;
        }
      }

      // Save all credentials
      for (const field of fields) {
        if (!values[field.key]?.trim()) continue;
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_platform",
            integration_name: ig.integrationKey,
            credential_key: field.key,
            credential_value: values[field.key],
            description: `${ig.name} - ${field.key}`,
          },
        });
      }
      toast.success(`${ig.name} conectado com sucesso! 🎉`);
      setValues({});
      onSaved();
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
      setValidating(false);
    }
  };

  if (allConnected) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Conectado e funcionando</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-3 rounded-xl bg-muted/5 border border-border/20">
      <div className="flex items-center gap-1.5 mb-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">Conexão Rápida</span>
        <Badge variant="outline" className="text-[9px] ml-auto">
          <Shield className="h-2.5 w-2.5 mr-0.5" /> Criptografado
        </Badge>
      </div>
      {fields.map(field => (
        <div key={field.key}>
          <label className="text-[11px] text-muted-foreground mb-0.5 block">
            {field.label} {field.required && <span className="text-destructive">*</span>}
            {connectedKeys.has(field.key) && <span className="text-emerald-500 ml-1">✓ salvo</span>}
          </label>
          <Input
            placeholder={field.placeholder}
            type={field.type || "text"}
            value={values[field.key] || ""}
            onChange={(e) => setValues(v => ({ ...v, [field.key]: e.target.value }))}
            className="text-xs h-8"
            disabled={connectedKeys.has(field.key)}
          />
        </div>
      ))}
      <Button
        size="sm"
        className="w-full gap-1.5 h-8 text-xs"
        disabled={!allRequiredFilled || saving}
        onClick={handleSave}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : validating ? (
          <>Validando...</>
        ) : (
          <>
            <CheckCircle className="h-3.5 w-3.5" />
            Conectar {ig.name}
          </>
        )}
      </Button>
    </div>
  );
};

const IntegrationsPage = () => {
  const [activeSetup, setActiveSetup] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch connected integrations from platform_credentials
  const { data: connectedCreds = [], refetch: refetchCreds } = useQuery({
    queryKey: ["integration-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("credential-manager", {
        body: { action: "list_platform" },
      });
      if (error) return [];
      return data?.credentials || [];
    },
    enabled: !!user,
  });

  // Build a map: integrationKey -> Set of connected keys
  const connectedMap = connectedCreds.reduce((acc: Record<string, Set<string>>, c: any) => {
    if (!acc[c.integration_name]) acc[c.integration_name] = new Set();
    acc[c.integration_name].add(c.credential_key);
    return acc;
  }, {} as Record<string, Set<string>>);

  const getConnectionStatus = (ig: Integration) => {
    const keys = connectedMap[ig.integrationKey];
    if (!keys || keys.size === 0) return "none";
    const required = ig.quickFields?.filter(f => f.required) || [];
    if (required.length === 0) return keys.size > 0 ? "connected" : "none";
    return required.every(f => keys.has(f.key)) ? "connected" : "partial";
  };

  if (activeSetup) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveSetup(null)} className="gap-1 mb-2">
          ← {t("integrations.back", { defaultValue: "Voltar para Integrações" })}
        </Button>
        {activeSetup === "whatsapp" && <WhatsAppSetupGuide />}
        {activeSetup === "email" && <SendGridSetupGuide />}
        {activeSetup === "linkedin" && <LinkedInSetupGuide />}
        {activeSetup === "meta-ads" && <MetaAdsSetupGuide />}
      </div>
    );
  }

  // Count connected
  const connectedCount = integrations.filter(ig => getConnectionStatus(ig) === "connected").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          {t("nav.integrations", { defaultValue: "Integrações" })}
          <HelpTooltip id="integrations-intro" text={t("integrations.help", { defaultValue: "Conecte seus agentes com WhatsApp, E-mail, LinkedIn, Meta Ads e mais. Cole suas chaves direto no card ou clique 'Passo a passo' para o tutorial completo." })} position="bottom" size={16} />
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">{t("integrations.subtitle", { defaultValue: "Conecte seus agentes com as ferramentas que você já usa." })}</p>
          {connectedCount > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              {connectedCount} {t("integrations.connected", { defaultValue: "conectada" })}{connectedCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
      >
        <Sparkles className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{t("integrations.tip_label", { defaultValue: "Dica:" })}</strong> {t("integrations.tip_text", { defaultValue: "Já tem as credenciais? Clique no card e cole direto — sem precisar seguir o tutorial inteiro. Para integrações complexas, use o botão \"Passo a passo\"." })}
        </p>
      </motion.div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">{t("integrations.tab_all", { defaultValue: "Todas" })}</TabsTrigger>
          <TabsTrigger value="Comunicação">{t("integrations.tab_comm", { defaultValue: "Comunicação" })}</TabsTrigger>
          <TabsTrigger value="Social">Social</TabsTrigger>
          <TabsTrigger value="Ads">Ads</TabsTrigger>
          <TabsTrigger value="CRM">CRM</TabsTrigger>
          <TabsTrigger value="Produtividade">{t("integrations.tab_prod", { defaultValue: "Produtividade" })}</TabsTrigger>
          <TabsTrigger value="outros">{t("integrations.tab_others", { defaultValue: "Outros" })}</TabsTrigger>
        </TabsList>

        {["all", "Comunicação", "Social", "Ads", "CRM", "Produtividade", "outros"].map((tab) => {
          const filtered = tab === "all"
            ? integrations
            : tab === "outros"
            ? integrations.filter((ig) => !["Comunicação", "Social", "Ads", "CRM", "Produtividade"].includes(ig.category))
            : integrations.filter((ig) => ig.category === tab);

          return (
            <TabsContent key={tab} value={tab}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((ig, i) => {
                  const connectionStatus = getConnectionStatus(ig);
                  const isExpanded = expandedCard === ig.integrationKey;
                  const hasQuickFields = ig.quickFields && ig.quickFields.length > 0;

                  return (
                    <motion.div
                      key={ig.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={`glass border-border hover:neon-border transition-all h-full ${
                        connectionStatus === "connected" ? "border-primary/30 bg-primary/[0.02]" : ""
                      }`}>
                        <CardContent className="p-5 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              connectionStatus === "connected" ? "bg-primary/10" : "bg-primary/10"
                            }`}>
                              <ig.icon className={`h-5 w-5 ${
                                connectionStatus === "connected" ? "text-primary" : "text-primary"
                              }`} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {connectionStatus === "connected" && (
                                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                                  {t("integrations.status_connected", { defaultValue: "Conectado" })}
                                </Badge>
                              )}
                              {connectionStatus === "partial" && (
                                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 text-[10px]">
                                  {t("integrations.status_partial", { defaultValue: "Parcial" })}
                                </Badge>
                              )}
                              {connectionStatus === "none" && (
                                <Badge
                                  variant="secondary"
                                  className={ig.status === "Disponível" ? "bg-primary/15 text-primary" : ""}
                                >
                                  {ig.status === "Disponível" ? t("integrations.status_available", { defaultValue: "Disponível" }) : t("integrations.status_soon", { defaultValue: "Em Breve" })}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h3 className="font-display font-semibold text-base mb-1">{ig.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3 flex-1">{ig.desc}</p>
                          
                          {/* Difficulty + Time + API info */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {ig.difficulty === "Fácil" ? "⭐" : ig.difficulty === "Médio" ? "⭐⭐" : "⭐⭐⭐"} {ig.difficulty}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {ig.totalTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                              <Key className="h-3 w-3 shrink-0" />
                              <span className="truncate">{ig.apiInfo}</span>
                            </div>
                          </div>

                          {/* Quick connect expandable area */}
                          {hasQuickFields && ig.status === "Disponível" && (
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden mb-3"
                                >
                                  <IntegrationQuickConnect
                                    ig={ig}
                                    connectedKeys={connectedMap[ig.integrationKey] || new Set()}
                                    onSaved={() => refetchCreds()}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{ig.category}</Badge>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-3">
                            {/* Quick connect toggle */}
                            {hasQuickFields && ig.status === "Disponível" && connectionStatus !== "connected" && (
                              <Button
                                size="sm"
                                variant={isExpanded ? "secondary" : "default"}
                                className={`flex-1 gap-1.5 ${!isExpanded ? "neon-glow" : ""}`}
                                onClick={() => setExpandedCard(isExpanded ? null : ig.integrationKey)}
                              >
                                {isExpanded ? (
                                  <>{t("integrations.close", { defaultValue: "Fechar" })} <ChevronUp className="h-3.5 w-3.5" /></>
                                ) : (
                                  <>
                                    <Zap className="h-3.5 w-3.5" />
                                    {t("integrations.quick_connect", { defaultValue: "Conectar Rápido" })}
                                  </>
                                )}
                              </Button>
                            )}
                            {/* Full wizard button */}
                            {ig.hasSetup && ig.status === "Disponível" && (
                              <Button
                                size="sm"
                                variant={hasQuickFields && connectionStatus !== "connected" ? "outline" : "default"}
                                className={`gap-1.5 ${!hasQuickFields || connectionStatus === "connected" ? "flex-1 neon-glow" : ""}`}
                                onClick={() => setActiveSetup(ig.setupKey!)}
                              >
                                {t("integrations.step_by_step", { defaultValue: "Passo a passo" })} <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {/* Non-setup available */}
                            {!ig.hasSetup && ig.status === "Disponível" && !hasQuickFields && (
                              <Button size="sm" variant="default" className="flex-1 neon-glow" disabled>
                                {t("integrations.connect", { defaultValue: "Conectar" })}
                              </Button>
                            )}
                            {/* Coming soon */}
                            {ig.status !== "Disponível" && (
                              <Button size="sm" variant="secondary" className="flex-1" disabled>
                                {t("integrations.status_soon", { defaultValue: "Em Breve" })}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;
