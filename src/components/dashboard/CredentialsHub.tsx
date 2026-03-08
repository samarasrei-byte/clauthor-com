import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Zap, Phone, Mail, Globe, Database, Webhook, 
  Check, Plus, Loader2, Shield, Activity, Link2,
  Sparkles, Radio, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  label: string;
  icon: React.ElementType;
  category: "communication" | "crm" | "marketing" | "data" | "automation";
  color: string;
  keys: { key: string; label: string; secret?: boolean }[];
}

const INTEGRATIONS: Integration[] = [
  { id: "whatsapp", name: "whatsapp", label: "WhatsApp", icon: Phone, category: "communication", color: "emerald", keys: [{ key: "phone_id", label: "Phone ID" }, { key: "access_token", label: "Token de Acesso", secret: true }, { key: "business_account_id", label: "Business ID" }] },
  { id: "email", name: "email", label: "Email (SMTP)", icon: Mail, category: "communication", color: "blue", keys: [{ key: "smtp_host", label: "Host SMTP" }, { key: "smtp_port", label: "Porta" }, { key: "smtp_user", label: "Usuário" }, { key: "smtp_password", label: "Senha", secret: true }, { key: "from_email", label: "Email Remetente" }] },
  { id: "sendgrid", name: "sendgrid", label: "SendGrid", icon: Mail, category: "communication", color: "cyan", keys: [{ key: "api_key", label: "API Key", secret: true }, { key: "from_email", label: "Email Remetente" }] },
  { id: "linkedin", name: "linkedin", label: "LinkedIn", icon: Globe, category: "marketing", color: "blue", keys: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", secret: true }, { key: "access_token", label: "Access Token", secret: true }] },
  { id: "meta_ads", name: "meta_ads", label: "Meta Ads", icon: Globe, category: "marketing", color: "violet", keys: [{ key: "access_token", label: "Access Token", secret: true }, { key: "ad_account_id", label: "Ad Account ID" }] },
  { id: "hubspot", name: "hubspot", label: "HubSpot", icon: Database, category: "crm", color: "orange", keys: [{ key: "api_key", label: "API Key", secret: true }] },
  { id: "salesforce", name: "salesforce", label: "Salesforce", icon: Database, category: "crm", color: "blue", keys: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", secret: true }] },
  { id: "slack", name: "slack", label: "Slack", icon: Webhook, category: "automation", color: "violet", keys: [{ key: "webhook_url", label: "Webhook URL" }, { key: "bot_token", label: "Bot Token", secret: true }] },
  { id: "zapier", name: "zapier", label: "Zapier", icon: Zap, category: "automation", color: "orange", keys: [{ key: "webhook_url", label: "Webhook URL" }] },
];

const CATEGORY_LABELS = {
  communication: "Comunicação",
  crm: "CRM",
  marketing: "Marketing",
  data: "Dados",
  automation: "Automação",
};

const CredentialsHub = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["user-credentials-hub", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("credential-manager", {
        body: { action: "list_all" },
      });
      if (error) throw error;
      return data?.credentials || [];
    },
    enabled: !!user,
  });

  // Group credentials by integration
  const connectedMap = credentials.reduce((acc: Record<string, any[]>, c: any) => {
    const name = c.integration_name?.toLowerCase();
    if (!acc[name]) acc[name] = [];
    acc[name].push(c);
    return acc;
  }, {});

  const getConnectionStatus = (integrationId: string) => {
    const creds = connectedMap[integrationId] || [];
    const integration = INTEGRATIONS.find(i => i.id === integrationId);
    if (!integration) return { status: "disconnected", completeness: 0 };
    const required = integration.keys.length;
    const filled = creds.length;
    if (filled >= required) return { status: "connected", completeness: 100 };
    if (filled > 0) return { status: "partial", completeness: Math.round((filled / required) * 100) };
    return { status: "disconnected", completeness: 0 };
  };

  const openConnection = (integration: Integration) => {
    setSelectedIntegration(integration);
    setFormValues({});
    setSuccess(false);
    setModalOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    setConnecting(true);
    try {
      for (const keyDef of selectedIntegration.keys) {
        const value = formValues[keyDef.key];
        if (!value) continue;
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save",
            integration_name: selectedIntegration.name,
            credential_key: keyDef.key,
            credential_value: value,
            description: `${selectedIntegration.label} - ${keyDef.label}`,
          },
        });
      }
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["user-credentials-hub"] });
      toast.success(`${selectedIntegration.label} conectado com sucesso!`);
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(false);
      }, 1500);
    } catch {
      toast.error("Erro ao salvar credenciais");
    } finally {
      setConnecting(false);
    }
  };

  const filteredIntegrations = filter 
    ? INTEGRATIONS.filter(i => i.category === filter)
    : INTEGRATIONS;

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  const colorClasses: Record<string, { bg: string; border: string; glow: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-[0_0_30px_hsl(160_55%_42%/0.2)]" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", glow: "shadow-[0_0_30px_hsl(220_70%_55%/0.2)]" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", glow: "shadow-[0_0_30px_hsl(180_70%_50%/0.2)]" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "shadow-[0_0_30px_hsl(266_100%_58%/0.2)]" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-[0_0_30px_hsl(30_90%_55%/0.2)]" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Hub de Conexões</span>
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Central de Integrações</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Conecte seus sistemas e veja o fluxo de dados atravessando sua equipe de IA
          </p>
        </motion.div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant={filter === null ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter(null)}
          className="h-8 text-xs gap-1.5"
        >
          <Radio className="h-3 w-3" />
          Todas
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(cat)}
            className="h-8 text-xs capitalize"
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Integration Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredIntegrations.map((integration, idx) => {
              const { status, completeness } = getConnectionStatus(integration.id);
              const colors = colorClasses[integration.color] || colorClasses.blue;
              const Icon = integration.icon;
              
              return (
                <motion.div
                  key={integration.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => openConnection(integration)}
                  className={cn(
                    "group relative cursor-pointer rounded-2xl border p-5 transition-all duration-500",
                    "bg-card/50 hover:bg-card/80",
                    status === "connected" ? colors.border : "border-border/20",
                    status === "connected" && colors.glow
                  )}
                >
                  {/* Energy Flow Animation for Connected */}
                  {status === "connected" && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                      <motion.div
                        className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                        animate={{ 
                          top: ["0%", "100%", "0%"],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Icon & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        status === "connected" ? colors.bg : "bg-muted/30"
                      )}>
                        <Icon className={cn(
                          "h-6 w-6 transition-colors",
                          status === "connected" ? "text-foreground" : "text-muted-foreground"
                        )} />
                      </div>
                      
                      {status === "connected" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-medium text-emerald-500">Online</span>
                        </motion.div>
                      )}
                      
                      {status === "partial" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                          <Activity className="h-3 w-3 text-amber-500" />
                          <span className="text-[10px] font-medium text-amber-500">{completeness}%</span>
                        </div>
                      )}
                      
                      {status === "disconnected" && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Name & Category */}
                    <h3 className="font-display font-semibold text-sm mb-1">{integration.label}</h3>
                    <p className="text-[11px] text-muted-foreground capitalize">{CATEGORY_LABELS[integration.category]}</p>

                    {/* Connection Bar */}
                    {status !== "disconnected" && (
                      <div className="mt-4 h-1 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${completeness}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            status === "connected" ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                      </div>
                    )}

                    {/* Keys Preview */}
                    {status === "disconnected" && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {integration.keys.slice(0, 3).map(k => (
                          <span key={k.key} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">
                            {k.label}
                          </span>
                        ))}
                        {integration.keys.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{integration.keys.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Connection Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/30">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <h3 className="font-display text-lg font-bold">Conexão Estabelecida</h3>
              <p className="text-sm text-muted-foreground">{selectedIntegration?.label} agora está ativo</p>
              
              {/* Energy Flow Animation */}
              <div className="w-48 h-1 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                />
              </div>
            </motion.div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-display">
                  {selectedIntegration && (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <selectedIntegration.icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <span>Conectar {selectedIntegration?.label}</span>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                      Insira as credenciais para estabelecer conexão segura
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedIntegration?.keys.map(keyDef => (
                  <div key={keyDef.key} className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{keyDef.label}</label>
                    <Input
                      type={keyDef.secret ? "password" : "text"}
                      placeholder={`Digite ${keyDef.label.toLowerCase()}...`}
                      value={formValues[keyDef.key] || ""}
                      onChange={e => setFormValues(prev => ({ ...prev, [keyDef.key]: e.target.value }))}
                      className="bg-accent/20 border-border/30"
                    />
                  </div>
                ))}

                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-[10px] text-muted-foreground">
                    Credenciais criptografadas com AES-256-GCM e armazenadas em cofre seguro
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </DialogClose>
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={connecting || Object.values(formValues).filter(Boolean).length === 0}
                  className="gap-2"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Estabelecer Conexão
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CredentialsHub;
