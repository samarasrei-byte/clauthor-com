import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ExternalLink, Shield, CheckCircle, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ConnectorData } from "./connectorData";

// Meta OAuth is shared by Facebook Pages, Meta Ads and Instagram (all covered by the same
// long-lived Meta access token). We surface a one-click OAuth button on those cards.
const META_OAUTH_KEYS = new Set(["meta_ads", "instagram", "meta_business", "facebook"]);

interface Props {
  connector: ConnectorData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedKeys: Set<string>;
  onSaved: () => void;
}

const ConnectorDetailDialog = ({ connector, open, onOpenChange, connectedKeys, onSaved }: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [metaConnecting, setMetaConnecting] = useState(false);

  if (!connector) return null;

  const isMetaOAuth = META_OAUTH_KEYS.has(connector.integrationKey);

  const handleMetaOAuth = async () => {
    // Pre-open popup synchronously to survive popup blockers.
    let popup: Window | null = null;
    try {
      popup = window.open("about:blank", "meta_oauth_popup", "width=600,height=720,resizable=yes,scrollbars=yes");
    } catch { /* ignore */ }

    setMetaConnecting(true);
    try {
      const redirect_uri = window.location.origin + "/settings/social";
      sessionStorage.setItem("oauth_provider", "meta");
      const { data, error } = await supabase.functions.invoke("meta-oauth", {
        body: { action: "authorize", redirect_uri },
      });
      if (error) throw error;
      const authUrl = (data as { url: string }).url;
      if (popup && !popup.closed) {
        try { popup.location.href = authUrl; } catch { window.location.href = authUrl; }
      } else {
        // Popup blocked — fall back to a redirect in this tab.
        window.location.href = authUrl;
      }
      toast.success("Autorize a Meta na janela aberta. Você será redirecionado para /settings/social ao concluir.");
      onOpenChange(false);
    } catch (e: unknown) {
      try { popup?.close(); } catch { /* ignore */ }
      const msg = e instanceof Error ? e.message : "Falha ao iniciar OAuth Meta";
      toast.error(msg + " — verifique se META_APP_ID e META_APP_SECRET estão configurados.");
    } finally {
      setMetaConnecting(false);
    }
  };

  const allRequiredConnected = connector.fields
    .filter(f => f.required)
    .every(f => connectedKeys.has(f.key));

  const allRequiredFilled = connector.fields
    .filter(f => f.required)
    .every(f => connectedKeys.has(f.key) || values[f.key]?.trim());

  const handleConnect = async () => {
    setSaving(true);
    try {
      for (const field of connector.fields) {
        if (connectedKeys.has(field.key)) continue;
        if (!values[field.key]?.trim()) continue;
        await supabase.functions.invoke("credential-manager", {
          body: {
            action: "save_user_integration",
            integration_name: connector.integrationKey,
            credential_key: field.key,
            credential_value: values[field.key],
            description: `${connector.name} - ${field.label}`,
          },
        });
      }
      toast.success(`${connector.name} vinculado com sucesso! 🎉`);
      setValues({});
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao vincular. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 bg-card border-border/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-5 pt-4 pb-2">
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
        </div>


        {/* Connector info */}
        <div className="px-6 pb-4 pt-2">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center shrink-0">
              {connector.iconUrl ? (
                <img src={connector.iconUrl} alt={connector.name} className="w-8 h-8 rounded" />
              ) : (
                <connector.icon className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">{connector.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{connector.shortDesc}</p>
                </div>
                {allRequiredConnected ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" /> Vinculado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={!allRequiredFilled || saving}
                    onClick={handleConnect}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Vincular
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {connector.longDesc}
          </p>
        </div>

        {/* Developer */}
        {connector.developer && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground">
              Desenvolvido por{" "}
              {connector.developerUrl ? (
                <a
                  href={connector.developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
                >
                  {connector.developer} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : (
                <span className="text-foreground font-medium">{connector.developer}</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Use apenas conectores de desenvolvedores em quem você confia. A Clauthor não controla quais ferramentas os desenvolvedores disponibilizam.
            </p>
          </div>
        )}

        <div className="border-t border-border/20" />

        {/* Credentials fields */}
        {connector.fields.length > 0 && !allRequiredConnected && (
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Credenciais</h3>
              <Badge variant="outline" className="text-[9px] ml-auto">
                <Shield className="h-2.5 w-2.5 mr-0.5" /> Criptografado AES-256
              </Badge>
            </div>
            {connector.fields.map(field => (
              <div key={field.key}>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                  {connectedKeys.has(field.key) && (
                    <span className="text-emerald-500 ml-1">✓ salvo</span>
                  )}
                </label>
                <Input
                  placeholder={field.placeholder}
                  type={field.type || "text"}
                  value={values[field.key] || ""}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  className="text-sm h-9"
                  disabled={connectedKeys.has(field.key)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border/20" />

        {/* Tools / Capabilities */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-sm">Ferramentas</h3>
            <Badge variant="secondary" className="text-[10px]">{connector.tools.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {connector.tools.map(tool => (
              <span
                key={tool}
                className="text-[11px] px-2.5 py-1 rounded-md bg-muted/30 border border-border/30 text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectorDetailDialog;
