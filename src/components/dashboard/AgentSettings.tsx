import { useState, useEffect } from "react";
import { encryptCredential, decryptCredential } from "@/lib/crypto";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bot, Settings, Save, ChevronRight, ChevronDown, Loader2,
  MessageSquare, Plug, Radio, Hash, FileText, Zap,
  Globe, Mail, Phone, Webhook, Code, Check, Key, Link2, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { agentIntegrations } from "@/data/libraryAgentData";

const CHANNEL_OPTIONS = [
  { id: "dashboard", label: "Dashboard Chat", icon: MessageSquare, desc: "Chat interno na plataforma", testable: false },
  { id: "whatsapp", label: "WhatsApp", icon: Phone, desc: "Integração com WhatsApp Business", testable: true },
  { id: "email", label: "E-mail", icon: Mail, desc: "Respostas automáticas por e-mail", testable: true },
  { id: "webhook", label: "Webhook", icon: Webhook, desc: "Notificações via HTTP", testable: false },
  { id: "api", label: "API REST", icon: Code, desc: "Chamadas via API", testable: false },
];

// Map integration names to credential field hints
const INTEGRATION_CREDENTIALS: Record<string, { fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  "LinkedIn Sales Nav": { fields: [{ key: "linkedin_email", label: "Email LinkedIn", placeholder: "seu@email.com" }, { key: "linkedin_token", label: "Token de Acesso", placeholder: "li_at=...", secret: true }] },
  "HubSpot": { fields: [{ key: "hubspot_api_key", label: "API Key HubSpot", placeholder: "pat-na1-...", secret: true }] },
  "Salesforce": { fields: [{ key: "sf_client_id", label: "Client ID", placeholder: "3MVG9..." }, { key: "sf_client_secret", label: "Client Secret", placeholder: "...", secret: true }] },
  "Apollo.io": { fields: [{ key: "apollo_api_key", label: "API Key Apollo", placeholder: "apollo_...", secret: true }] },
  "Google Calendar": { fields: [{ key: "google_oauth", label: "Google OAuth Token", placeholder: "ya29...", secret: true }] },
  "Google Sheets": { fields: [{ key: "google_sheets_id", label: "Spreadsheet ID", placeholder: "1BxiMVs..." }] },
  "Slack": { fields: [{ key: "slack_webhook", label: "Webhook URL", placeholder: "https://hooks.slack.com/..." }] },
  "Zapier": { fields: [{ key: "zapier_webhook", label: "Zapier Webhook URL", placeholder: "https://hooks.zapier.com/..." }] },
  "WhatsApp Business API": { fields: [{ key: "wa_phone_id", label: "Phone Number ID", placeholder: "1234567890" }, { key: "wa_token", label: "Access Token", placeholder: "EAAG...", secret: true }] },
  "Stripe": { fields: [{ key: "stripe_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }] },
  "Meta Business Suite": { fields: [{ key: "meta_token", label: "Access Token", placeholder: "EAAG...", secret: true }] },
  "Google Ads API": { fields: [{ key: "gads_customer_id", label: "Customer ID", placeholder: "123-456-7890" }, { key: "gads_token", label: "Developer Token", placeholder: "...", secret: true }] },
  "DocuSign": { fields: [{ key: "docusign_key", label: "Integration Key", placeholder: "...", secret: true }] },
  "Twilio": { fields: [{ key: "twilio_sid", label: "Account SID", placeholder: "AC..." }, { key: "twilio_token", label: "Auth Token", placeholder: "...", secret: true }] },
  "Instagram API": { fields: [{ key: "ig_token", label: "Access Token", placeholder: "IGQV...", secret: true }] },
  "Shopify": { fields: [{ key: "shopify_store", label: "Store URL", placeholder: "mystore.myshopify.com" }, { key: "shopify_token", label: "Admin API Token", placeholder: "shpat_...", secret: true }] },
};

// Try to match agent name to a key in agentIntegrations
function getAgentIntegrationKey(agentName: string): string | null {
  const normalized = agentName.toLowerCase().trim();
  for (const [key, _] of Object.entries(agentIntegrations)) {
    const keyNorm = key.replace(/_/g, " ");
    if (normalized.includes(keyNorm) || keyNorm.includes(normalized.split(" ")[0]?.toLowerCase() || "")) {
      return key;
    }
  }
  return null;
}

const AgentSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["my-agents-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Configurações dos Agentes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edite prompts, integrações e canais de cada agente
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bot className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold mb-2">Nenhum agente encontrado</h3>
          <p className="text-muted-foreground text-sm">Crie um agente primeiro para configurar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isExpanded={expandedAgent === agent.id}
              onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface AgentCardProps {
  agent: any;
  isExpanded: boolean;
  onToggle: () => void;
}

const AgentCard = ({ agent, isExpanded, onToggle }: AgentCardProps) => {
  const queryClient = useQueryClient();
  const [instructions, setInstructions] = useState(agent.instructions || "");
  const [channels, setChannels] = useState<string[]>(() => {
    try { return Array.isArray(agent.channels) ? agent.channels : []; }
    catch { return []; }
  });
  const [integrations, setIntegrations] = useState<string[]>(() => {
    try { return Array.isArray(agent.integrations) ? agent.integrations : []; }
    catch { return []; }
  });
  const [objective, setObjective] = useState(agent.objective || "");
  const [channelCreds, setChannelCreds] = useState<Record<string, string>>({});
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [channelStatus, setChannelStatus] = useState<Record<string, "valid" | "invalid" | null>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agents")
        .update({
          instructions,
          channels: channels as any,
          integrations: integrations as any,
          objective,
        })
        .eq("id", agent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${agent.name} atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["my-agents-settings"] });
    },
    onError: () => toast.error("Erro ao salvar configurações"),
  });

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const testChannel = async (channelId: string) => {
    setTestingChannel(channelId);
    setChannelStatus(prev => ({ ...prev, [channelId]: null }));
    try {
      let credentials: Record<string, string> = {};
      if (channelId === "whatsapp") {
        credentials = {
          phone_id: channelCreds["wa_phone_id"] || "",
          access_token: channelCreds["wa_token"] || "",
        };
      } else if (channelId === "email") {
        credentials = {
          provider: channelCreds["email_provider"] || "",
          api_key: channelCreds["email_api_key"] || "",
          smtp_host: channelCreds["smtp_host"] || "",
          smtp_port: channelCreds["smtp_port"] || "",
          smtp_user: channelCreds["smtp_user"] || "",
          smtp_pass: channelCreds["smtp_pass"] || "",
        };
      }

      const { data, error } = await supabase.functions.invoke("validate-credentials", {
        body: { channel: channelId, credentials },
      });

      if (error) throw error;
      if (data?.valid) {
        setChannelStatus(prev => ({ ...prev, [channelId]: "valid" }));
        toast.success(data.message || "Conexão validada!");
      } else {
        setChannelStatus(prev => ({ ...prev, [channelId]: "invalid" }));
        toast.error(data?.error || "Validação falhou");
      }
    } catch {
      setChannelStatus(prev => ({ ...prev, [channelId]: "invalid" }));
      toast.error("Erro ao testar conexão");
    } finally {
      setTestingChannel(null);
    }
  };

  const tierColors: Record<string, string> = {
    basic: "bg-muted text-muted-foreground",
    intermediate: "bg-cyan-500/15 text-cyan-400",
    advanced: "bg-emerald-500/15 text-emerald-400",
    enterprise: "bg-primary/15 text-primary",
  };

  return (
    <motion.div layout className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-display font-semibold text-sm">{agent.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[9px] ${tierColors[agent.tier] || ""}`}>{agent.tier}</Badge>
              <Badge variant="secondary" className={`text-[9px] ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}`}>{agent.status}</Badge>
              <span className="text-[10px] text-muted-foreground">{agent.total_executions} execuções</span>
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Expanded Settings */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-5 border-t border-white/[0.06] pt-4">
              {/* Objective */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo do Agente</label>
                <Input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Atender clientes e responder dúvidas sobre produtos..."
                  className="bg-accent/20 border-white/[0.08]"
                />
              </div>

              {/* Instructions / Prompt */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Prompt / Instruções do Agente
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Defina o comportamento, tom de voz e regras do agente..."
                  className="min-h-[140px] bg-accent/20 border-white/[0.08] font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {instructions.length} caracteres — Este prompt define como o agente se comporta e responde
                </p>
              </div>

              {/* Channels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Canais de Comunicação</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const active = channels.includes(ch.id);
                    const status = channelStatus[ch.id];
                    return (
                      <div key={ch.id} className="rounded-xl border overflow-hidden transition-all" style={{ borderColor: active ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border) / 0.2)" }}>
                        <button
                          onClick={() => toggleChannel(ch.id)}
                          className={`w-full flex items-center gap-3 p-3 transition-all text-left ${
                            active ? "bg-primary/5" : "bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-primary/15" : "bg-accent/30"}`}>
                            <ch.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{ch.label}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{ch.desc}</p>
                          </div>
                          {status === "valid" && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                          {active && !status && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>

                        {/* Credential fields for WhatsApp */}
                        {active && ch.id === "whatsapp" && (
                          <div className="px-3 pb-3 space-y-2 border-t border-border/10 pt-2">
                            <Input
                              placeholder="Phone Number ID"
                              value={channelCreds["wa_phone_id"] || ""}
                              onChange={e => setChannelCreds(p => ({ ...p, wa_phone_id: e.target.value }))}
                              className="h-8 text-xs bg-accent/20 border-white/[0.08]"
                            />
                            <Input
                              placeholder="Access Token (Meta Business)"
                              type="password"
                              value={channelCreds["wa_token"] || ""}
                              onChange={e => setChannelCreds(p => ({ ...p, wa_token: e.target.value }))}
                              className="h-8 text-xs bg-accent/20 border-white/[0.08]"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-7 text-[10px] gap-1"
                              onClick={() => testChannel("whatsapp")}
                              disabled={testingChannel === "whatsapp"}
                            >
                              {testingChannel === "whatsapp" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                              Testar Conexão WhatsApp
                            </Button>
                          </div>
                        )}

                        {/* Credential fields for Email */}
                        {active && ch.id === "email" && (
                          <div className="px-3 pb-3 space-y-2 border-t border-border/10 pt-2">
                            <div className="flex gap-2">
                              <select
                                value={channelCreds["email_provider"] || ""}
                                onChange={e => setChannelCreds(p => ({ ...p, email_provider: e.target.value }))}
                                className="h-8 text-xs rounded-md border border-white/[0.08] bg-accent/20 px-2 flex-1 text-foreground"
                              >
                                <option value="">Provedor...</option>
                                <option value="sendgrid">SendGrid</option>
                                <option value="resend">Resend</option>
                                <option value="smtp">SMTP Custom</option>
                              </select>
                            </div>
                            {(channelCreds["email_provider"] === "sendgrid" || channelCreds["email_provider"] === "resend") && (
                              <Input
                                placeholder="API Key"
                                type="password"
                                value={channelCreds["email_api_key"] || ""}
                                onChange={e => setChannelCreds(p => ({ ...p, email_api_key: e.target.value }))}
                                className="h-8 text-xs bg-accent/20 border-white/[0.08]"
                              />
                            )}
                            {channelCreds["email_provider"] === "smtp" && (
                              <>
                                <Input placeholder="SMTP Host" value={channelCreds["smtp_host"] || ""} onChange={e => setChannelCreds(p => ({ ...p, smtp_host: e.target.value }))} className="h-8 text-xs bg-accent/20 border-white/[0.08]" />
                                <Input placeholder="Porta (587)" value={channelCreds["smtp_port"] || ""} onChange={e => setChannelCreds(p => ({ ...p, smtp_port: e.target.value }))} className="h-8 text-xs bg-accent/20 border-white/[0.08]" />
                                <Input placeholder="Usuário" value={channelCreds["smtp_user"] || ""} onChange={e => setChannelCreds(p => ({ ...p, smtp_user: e.target.value }))} className="h-8 text-xs bg-accent/20 border-white/[0.08]" />
                                <Input placeholder="Senha" type="password" value={channelCreds["smtp_pass"] || ""} onChange={e => setChannelCreds(p => ({ ...p, smtp_pass: e.target.value }))} className="h-8 text-xs bg-accent/20 border-white/[0.08]" />
                              </>
                            )}
                            {channelCreds["email_provider"] && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-[10px] gap-1"
                                onClick={() => testChannel("email")}
                                disabled={testingChannel === "email"}
                              >
                                {testingChannel === "email" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                                Testar Conexão E-mail
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Integrations — agent-specific */}
              <AgentIntegrationsPanel
                agentId={agent.id}
                agentName={agent.name}
                integrations={integrations}
                onToggle={toggleIntegration}
              />

              {/* Save */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// === Agent-specific integrations panel ===
interface AgentIntegrationsPanelProps {
  agentId: string;
  agentName: string;
  integrations: string[];
  onToggle: (id: string) => void;
}

const AgentIntegrationsPanel = ({ agentId, agentName, integrations, onToggle }: AgentIntegrationsPanelProps) => {
  const { user } = useAuth();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Find matching integrations for this agent type
  const agentKey = getAgentIntegrationKey(agentName);
  const specificIntegrations = agentKey ? agentIntegrations[agentKey] || [] : [];

  // Fallback generic if no match
  const displayIntegrations = specificIntegrations.length > 0
    ? specificIntegrations
    : ["Google Calendar", "Google Sheets", "Slack", "Zapier", "n8n"];

  // Load saved credentials from DB
  useEffect(() => {
    if (!user || loaded) return;
    (async () => {
      const { data } = await supabase
        .from("agent_credentials")
        .select("integration_name, credential_key, credential_value")
        .eq("agent_id", agentId)
        .eq("user_id", user.id);
      if (data) {
        const creds: Record<string, string> = {};
        for (const row of data as any[]) {
          try {
            creds[`${row.integration_name}__${row.credential_key}`] = await decryptCredential(
              row.credential_value, user.id, agentId
            );
          } catch {
            creds[`${row.integration_name}__${row.credential_key}`] = row.credential_value;
          }
        }
        setCredentials(creds);
      }
      setLoaded(true);
    })();
  }, [agentId, user, loaded]);

  const saveCredential = async (integrationName: string, credKey: string, value: string) => {
    if (!user || !value.trim()) return;
    setSaving(true);
    try {
      const encryptedValue = await encryptCredential(value.trim(), user.id, agentId);
      const { error } = await supabase.from("agent_credentials").upsert({
        agent_id: agentId,
        user_id: user.id,
        integration_name: integrationName,
        credential_key: credKey,
        credential_value: encryptedValue,
        is_secret: true,
      }, { onConflict: "agent_id,integration_name,credential_key" });
      if (error) throw error;
      toast.success("Credencial salva!");
    } catch {
      toast.error("Erro ao salvar credencial");
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        Integrações {agentKey ? `— ${agentName}` : "— Genéricas"}
      </label>
      <p className="text-[10px] text-muted-foreground/60 mb-3">
        Ative e configure as credenciais das ferramentas que este agente precisa
      </p>
      <div className="space-y-2">
        {displayIntegrations.map((intgName) => {
          const intgId = intgName.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const active = integrations.includes(intgId);
          const credConfig = INTEGRATION_CREDENTIALS[intgName];

          return (
            <div key={intgId} className="rounded-xl border border-border/40 overflow-hidden">
              <button
                onClick={() => onToggle(intgId)}
                className={`w-full flex items-center gap-3 p-3 transition-all text-left ${
                  active ? "bg-primary/5 border-primary/20" : "bg-card/30 hover:bg-card/50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-primary/15" : "bg-muted/30"}`}>
                  <Link2 className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{intgName}</p>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>

              {/* Credential fields when active */}
              {active && credConfig && (
                <div className="px-3 pb-3 space-y-2 bg-primary/[0.02]">
                  {credConfig.fields.map((field) => {
                    const credMapKey = `${intgName}__${field.key}`;
                    return (
                      <div key={field.key}>
                        <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          {field.label}
                        </label>
                        <div className="relative">
                          <Input
                            type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                            value={credentials[credMapKey] || ""}
                            onChange={(e) => setCredentials(prev => ({ ...prev, [credMapKey]: e.target.value }))}
                            onBlur={() => {
                              const val = credentials[credMapKey];
                              if (val?.trim()) saveCredential(intgName, field.key, val);
                            }}
                            placeholder={field.placeholder}
                            className="h-8 text-xs bg-background/50 border-border/30 pr-8"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => toggleSecret(field.key)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showSecrets[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[9px] text-muted-foreground/50">
                    🔐 Credenciais salvas automaticamente no seu workspace
                    {saving && " • Salvando..."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentSettings;
