import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Save, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface APIEntry {
  integration: string;
  label: string;
  keys: string[];
}

const API_LIST: APIEntry[] = [
  { integration: "paypal", label: "PayPal", keys: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"] },
  { integration: "whatsapp", label: "WhatsApp Business", keys: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"] },
  { integration: "elevenlabs", label: "ElevenLabs", keys: ["ELEVENLABS_API_KEY"] },
  { integration: "anthropic", label: "AI Planner", keys: ["ANTHROPIC_API_KEY"] },
];

interface CredentialStatus {
  configured: boolean;
  active: boolean;
}

const APICredentialEditor = () => {
  const [statuses, setStatuses] = useState<Record<string, CredentialStatus>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("platform_credentials")
        .select("integration_name, credential_key, is_active");

      const map: Record<string, CredentialStatus> = {};
      API_LIST.forEach((api) => {
        const creds = data?.filter((d) => d.integration_name === api.integration) || [];
        const allConfigured = api.keys.every((k) =>
          creds.some((c) => c.credential_key === k)
        );
        const allActive = creds.length > 0 && creds.every((c) => c.is_active);
        map[api.integration] = { configured: allConfigured, active: allActive };
      });
      setStatuses(map);
    } catch {
      // silent
    }
    setLoading(false);
  };

  const handleSave = async (api: APIEntry) => {
    setSaving(api.integration);
    try {
      for (const key of api.keys) {
        const val = values[`${api.integration}_${key}`];
        if (!val || val.trim() === "") continue;

        const { data: existing } = await supabase
          .from("platform_credentials")
          .select("id")
          .eq("integration_name", api.integration)
          .eq("credential_key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("platform_credentials")
            .update({
              credential_value: val.trim(),
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("platform_credentials").insert({
            integration_name: api.integration,
            credential_key: key,
            credential_value: val.trim(),
            is_active: true,
            description: `${api.label} - ${key}`,
          });
        }
      }

      // Notify admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: `API ${api.label} configurada`,
          message: `Gabriel salvou as credenciais de ${api.label}. Verifique no painel admin.`,
          type: "credential_update",
        });
      }

      toast.success(`${api.label} salvo e validado com sucesso!`);
      setEditing(null);
      setValues({});
      await loadStatuses();
    } catch {
      toast.error("Erro ao salvar credencial");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[11px]">Verificando APIs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
      {API_LIST.map((api, i) => {
        const status = statuses[api.integration];
        const isEditing = editing === api.integration;
        const isSaving = saving === api.integration;

        return (
          <motion.div
            key={api.integration}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-xl border p-3 transition-all",
              status?.configured && status?.active
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-amber-500/15 bg-amber-500/5"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {status?.configured && status?.active ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="text-[12px] font-semibold text-foreground">
                    {api.label}
                  </span>
                  <span
                    className={cn(
                      "ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-mono",
                      status?.configured && status?.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    )}
                  >
                    {status?.configured && status?.active ? "✅ Validado" : "⏳ Pendente"}
                  </span>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(api.integration);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                >
                  <KeyRound className="h-3 w-3 inline mr-1" />
                  Editar
                </button>
              )}
            </div>

            {/* Inline editor */}
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 space-y-2"
              >
                {api.keys.map((key) => {
                  const fieldId = `${api.integration}_${key}`;
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono">
                        {key}
                      </label>
                      <div className="relative">
                        <input
                          type={showValue[fieldId] ? "text" : "password"}
                          value={values[fieldId] || ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [fieldId]: e.target.value }))
                          }
                          placeholder={`Cole a ${key} aqui...`}
                          className="w-full text-[11px] bg-background/50 border border-border/30 rounded-lg px-3 py-2 pr-8 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowValue((s) => ({ ...s, [fieldId]: !s[fieldId] }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showValue[fieldId] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(api);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Salvar & Validar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(null);
                    }}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:bg-muted/30 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default APICredentialEditor;
