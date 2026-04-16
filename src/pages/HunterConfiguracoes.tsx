import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Target, Save, Loader2, Send, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const HunterConfiguracoes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [config, setConfig] = useState({
    phantombuster_api_key: "mY2h4ZN68EP3GZZxGZFrMEFUdF2r9BoJN01DBDwZZs",
    phantombuster_search_agent_id: "7724203656674356",
    phantombuster_connect_agent_id: "3165042093343795",
    evolution_url: "",
    evolution_instance: "",
    evolution_notify_number: "",
    evolution_api_key: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [cfgRes, logsRes] = await Promise.all([
        supabase.from("hunter_config").select("*").eq("user_id", user.id).single(),
        supabase.from("hunter_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (cfgRes.data) {
        setConfig({
          phantombuster_api_key: cfgRes.data.phantombuster_api_key_encrypted ? "••••••••" : "",
          phantombuster_search_agent_id: cfgRes.data.phantombuster_search_agent_id || "",
          phantombuster_connect_agent_id: cfgRes.data.phantombuster_connect_agent_id || "",
          evolution_url: cfgRes.data.evolution_url || "",
          evolution_instance: cfgRes.data.evolution_instance || "",
          evolution_notify_number: cfgRes.data.evolution_notify_number || "",
          evolution_api_key: cfgRes.data.evolution_api_key_encrypted ? "••••••••" : "",
        });
      }
      setLogs(logsRes.data || []);
      setLoading(false);
    })();
  }, [user]);

  const saveConfig = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        phantombuster_search_agent_id: config.phantombuster_search_agent_id,
        phantombuster_connect_agent_id: config.phantombuster_connect_agent_id,
        evolution_url: config.evolution_url,
        evolution_instance: config.evolution_instance,
        evolution_notify_number: config.evolution_notify_number.replace(/\D/g, ""),
      };
      // Only update encrypted fields if changed
      if (config.phantombuster_api_key && !config.phantombuster_api_key.includes("•")) {
        payload.phantombuster_api_key_encrypted = config.phantombuster_api_key;
      }
      if (config.evolution_api_key && !config.evolution_api_key.includes("•")) {
        payload.evolution_api_key_encrypted = config.evolution_api_key;
      }

      const { error } = await supabase.from("hunter_config").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Configurações salvas");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const testWhatsApp = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("hunter-notificar-resposta", {
        body: { test: true },
      });
      if (error) throw error;
      toast.success("Mensagem de teste enviada!");
    } catch {
      toast.error("Erro ao enviar teste");
    } finally {
      setTesting(false);
    }
  };

  const update = (k: string, v: string) => setConfig(p => ({ ...p, [k]: v }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const LOG_ICONS: Record<string, any> = {
    info: <Info className="w-4 h-4 text-blue-400" />,
    sucesso: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    erro: <XCircle className="w-4 h-4 text-red-400" />,
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Target className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações do Hunter</h1>
      </div>

      {/* PhantomBuster */}
      <Card>
        <CardHeader><CardTitle className="text-lg">PhantomBuster</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            PhantomBuster é o serviço que executa ações no LinkedIn. Crie conta grátis em{" "}
            <a href="https://phantombuster.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">phantombuster.com</a>
          </p>
          <div className="space-y-2">
            <Label>API Key do PhantomBuster</Label>
            <Input type="password" value={config.phantombuster_api_key} onChange={e => update("phantombuster_api_key", e.target.value)} placeholder="Sua API key" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID do Phantom de Busca</Label>
              <Input value={config.phantombuster_search_agent_id} onChange={e => update("phantombuster_search_agent_id", e.target.value)} placeholder="Search Agent ID" />
            </div>
            <div className="space-y-2">
              <Label>ID do Phantom de Conexão</Label>
              <Input value={config.phantombuster_connect_agent_id} onChange={e => update("phantombuster_connect_agent_id", e.target.value)} placeholder="Connect Agent ID" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution API */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Notificações WhatsApp (Evolution API)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL da Evolution API</Label>
              <Input value={config.evolution_url} onChange={e => update("evolution_url", e.target.value)} placeholder="https://api.evolution.com" />
            </div>
            <div className="space-y-2">
              <Label>Nome da instância</Label>
              <Input value={config.evolution_instance} onChange={e => update("evolution_instance", e.target.value)} placeholder="minha-instancia" />
            </div>
            <div className="space-y-2">
              <Label>Número para notificações</Label>
              <Input value={config.evolution_notify_number} onChange={e => update("evolution_notify_number", e.target.value)} placeholder="5511999999999" />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" value={config.evolution_api_key} onChange={e => update("evolution_api_key", e.target.value)} placeholder="Sua API key" />
            </div>
          </div>
          <Button variant="outline" onClick={testWhatsApp} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Salvar e Testar
          </Button>
        </CardContent>
      </Card>

      <Button className="w-full gap-2" onClick={saveConfig} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Configurações
      </Button>

      {/* Logs */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Status do Robô</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum log registrado</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  {LOG_ICONS[log.tipo] || LOG_ICONS.info}
                  <div className="flex-1">
                    <p className="text-foreground">{log.mensagem}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterConfiguracoes;
