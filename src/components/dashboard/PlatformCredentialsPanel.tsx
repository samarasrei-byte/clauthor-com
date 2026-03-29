import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Key, Plus, Trash2, Loader2, Shield, Globe, Mail, Phone, Check, Lock } from "lucide-react";
import { toast } from "sonner";

const PRESET_INTEGRATIONS = [
  { name: "anthropic", label: "Anthropic (Claude Sonnet)", icon: Shield, keys: ["api_key"], highlight: true, description: "AI Planner — raciocínio avançado e planejamento estratégico" },
  { name: "elevenlabs", label: "ElevenLabs (Thor Voice)", icon: Key, keys: ["api_key", "agent_id", "voice_id"], highlight: true },
  { name: "whatsapp", label: "WhatsApp Business", icon: Phone, keys: ["phone_id", "access_token", "business_account_id"] },
  { name: "email", label: "E-mail (SMTP/API)", icon: Mail, keys: ["provider", "api_key", "smtp_host", "smtp_port", "smtp_user", "smtp_password", "from_email"] },
  { name: "linkedin", label: "LinkedIn API", icon: Globe, keys: ["client_id", "client_secret", "access_token"] },
  { name: "sendgrid", label: "SendGrid", icon: Mail, keys: ["api_key", "from_email"] },
  { name: "resend", label: "Resend", icon: Mail, keys: ["api_key", "from_email"] },
  { name: "meta_ads", label: "Meta Ads", icon: Globe, keys: ["access_token", "ad_account_id"] },
  { name: "slack", label: "Slack", icon: Globe, keys: ["webhook_url", "bot_token"] },
];

const PlatformCredentialsPanel = () => {
  const queryClient = useQueryClient();
  const [newIntegration, setNewIntegration] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal state for preset credential input
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIntegration, setModalIntegration] = useState("");
  const [modalKey, setModalKey] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["platform-credentials"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("credential-manager", {
        body: { action: "list_platform" },
      });
      if (error) throw error;
      return data?.credentials || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ integration, key, value, desc }: { integration: string; key: string; value: string; desc: string }) => {
      const { data, error } = await supabase.functions.invoke("credential-manager", {
        body: {
          action: "save_platform",
          integration_name: integration.toLowerCase(),
          credential_key: key.toLowerCase(),
          credential_value: value,
          description: desc,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Credencial de plataforma salva!");
      queryClient.invalidateQueries({ queryKey: ["platform-credentials"] });
      setNewIntegration("");
      setNewKey("");
      setNewValue("");
      setNewDesc("");
    },
    onError: () => toast.error("Erro ao salvar credencial"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const { error } = await supabase.functions.invoke("credential-manager", {
        body: { action: "delete_platform", credential_id: credentialId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credencial removida!");
      queryClient.invalidateQueries({ queryKey: ["platform-credentials"] });
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handlePresetSave = (integration: string, key: string) => {
    setModalIntegration(integration);
    setModalKey(key);
    setModalValue("");
    setModalOpen(true);
  };

  const confirmPresetSave = () => {
    if (!modalValue.trim()) return;
    saveMutation.mutate(
      {
        integration: modalIntegration,
        key: modalKey,
        value: modalValue,
        desc: `${modalIntegration} - ${modalKey}`,
      },
      {
        onSuccess: () => {
          setModalSuccess(true);
          setTimeout(() => {
            setModalOpen(false);
            setModalSuccess(false);
            setModalValue("");
          }, 1500);
        },
      }
    );
  };

  // Group credentials by integration
  const grouped = credentials.reduce((acc: Record<string, any[]>, c: any) => {
    if (!acc[c.integration_name]) acc[c.integration_name] = [];
    acc[c.integration_name].push(c);
    return acc;
  }, {});

  const connectedIntegrations = new Set(Object.keys(grouped));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Credenciais da Plataforma
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Credenciais centrais usadas como fallback para todos os clientes. Clientes podem sobrescrever com as suas próprias.
        </p>
      </div>

      {/* Preset integrations */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Integrações Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PRESET_INTEGRATIONS.map((preset) => {
            const isConnected = connectedIntegrations.has(preset.name);
            return (
              <div key={preset.name} className="rounded-xl border border-border/30 p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isConnected ? "bg-emerald-500/15" : "bg-muted/30"}`}>
                    <preset.icon className={`h-4 w-4 ${isConnected ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{preset.label}</p>
                      {isConnected && (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Conectado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {preset.keys.map((key) => {
                    const hasCred = grouped[preset.name]?.some((c: any) => c.credential_key === key);
                    return (
                      <button
                        key={key}
                        onClick={() => handlePresetSave(preset.name, key)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${
                          hasCred
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-primary/10 hover:border-primary/20 hover:text-primary"
                        }`}
                      >
                        {hasCred && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom credential form */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Adicionar Credencial Customizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Integração (ex: twilio)" value={newIntegration} onChange={(e) => setNewIntegration(e.target.value)} className="text-sm" />
            <Input placeholder="Chave (ex: api_key)" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="text-sm" />
            <Input placeholder="Valor" type="password" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="text-sm" />
            <Input placeholder="Descrição (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="text-sm" />
          </div>
          <Button
            className="mt-3 gap-2"
            size="sm"
            disabled={!newIntegration || !newKey || !newValue || saveMutation.isPending}
            onClick={() => saveMutation.mutate({ integration: newIntegration, key: newKey, value: newValue, desc: newDesc })}
          >
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
            Salvar Credencial
          </Button>
        </CardContent>
      </Card>

      {/* Saved credentials */}
      <Card className="bg-background/40 backdrop-blur-xl border border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> Credenciais Salvas ({credentials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma credencial de plataforma configurada ainda.</p>
          ) : (
            <div className="space-y-2">
              {credentials.map((cred: any) => (
                <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-primary/60" />
                    <div>
                      <p className="text-xs font-medium">{cred.integration_name} / {cred.credential_key}</p>
                      <p className="text-[10px] text-muted-foreground">{cred.description || "••••••••"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[9px] ${cred.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted"}`}>
                      {cred.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(cred.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credential input modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          {modalSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
                >
                  <Check className="h-8 w-8 text-emerald-500" />
                </motion.div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-medium text-foreground"
              >
                Credencial salva com sucesso!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-[10px] text-muted-foreground"
              >
                {modalIntegration} / {modalKey}
              </motion.p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  <Lock className="h-4 w-4 text-primary" />
                  {modalIntegration} / {modalKey}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label className="text-sm text-muted-foreground">
                  Insira o valor para <span className="font-semibold text-foreground">{modalKey}</span> da integração <span className="font-semibold text-foreground">{modalIntegration}</span>
                </Label>
                <Input
                  placeholder={`Valor de ${modalKey}`}
                  type="password"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmPresetSave()}
                  autoFocus
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Criptografado com AES-256-GCM no cofre seguro
                </p>
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </DialogClose>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!modalValue.trim() || saveMutation.isPending}
                  onClick={confirmPresetSave}
                >
                  {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
                  Salvar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlatformCredentialsPanel;
