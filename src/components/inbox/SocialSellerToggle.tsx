import { useEffect, useState } from "react";
import { Bot, ShieldCheck, Zap, Cpu, AlertTriangle, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { AGENT_MODELS, DEFAULT_SOCIAL_SELLER_MODEL, getModel } from "@/lib/ai-models/registry";
import { SELLER_CHANNELS, type SellerChannelId } from "@/lib/social-seller/channels";

export type SellerChannel = "dashboard" | SellerChannelId;

export interface SocialSellerConfig {
  enabled: boolean;
  requireApproval: boolean;
  agentId?: string | null;
  agentName?: string | null;
  modelId?: string;
}

const STORAGE_KEY = "clauthor:social-seller:v1";

type ConfigMap = Partial<Record<SellerChannel, SocialSellerConfig>>;

function readAll(): ConfigMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConfigMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ConfigMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getSocialSellerConfig(channel: SellerChannel): SocialSellerConfig {
  return readAll()[channel] ?? { enabled: false, requireApproval: true, modelId: DEFAULT_SOCIAL_SELLER_MODEL };
}

interface Props {
  channel: SellerChannel;
  channelLabel: string;
  agents?: Array<{ id: string; name: string }>;
}

const SocialSellerToggle = ({ channel, channelLabel, agents = [] }: Props) => {
  const [config, setConfig] = useState<SocialSellerConfig>(() =>
    getSocialSellerConfig(channel),
  );

  useEffect(() => {
    setConfig(getSocialSellerConfig(channel));
  }, [channel]);

  const update = (patch: Partial<SocialSellerConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    const all = readAll();
    all[channel] = next;
    writeAll(all);
    if (patch.enabled === true) {
      notify.success(`Social Seller ativado em ${channelLabel}`, {
        description: next.requireApproval
          ? "Respostas passarão por aprovação humana antes do envio."
          : "Respostas serão enviadas automaticamente pelo agente.",
      });
    } else if (patch.enabled === false) {
      notify.info(`Social Seller desativado em ${channelLabel}`);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/10 bg-card/40 p-3",
        "flex flex-col gap-2.5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              config.enabled ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground",
            )}
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">
              Social Seller · {channelLabel}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {config.enabled
                ? config.requireApproval
                  ? "Ativo · human-in-the-loop"
                  : "Ativo · resposta autônoma"
                : "Agente responde manualmente"}
            </p>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => update({ enabled: v })}
          aria-label={`Ativar Social Seller em ${channelLabel}`}
        />
      </div>

      {config.enabled && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/10">
          {agents.length > 0 && (
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              Agente:
              <select
                value={config.agentId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const name = agents.find((a) => a.id === id)?.name ?? null;
                  update({ agentId: id, agentName: name });
                }}
                className="bg-muted/30 border border-border/10 rounded-md px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Auto (roteamento)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="button"
            onClick={() => update({ requireApproval: !config.requireApproval })}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors border",
              config.requireApproval
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-muted/20 border-border/10 text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={config.requireApproval}
          >
            {config.requireApproval ? (
              <ShieldCheck className="h-3 w-3" strokeWidth={2} />
            ) : (
              <Zap className="h-3 w-3" strokeWidth={2} />
            )}
            {config.requireApproval ? "Human-in-the-loop" : "Autônomo"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialSellerToggle;
