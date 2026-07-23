import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Linkedin, Instagram, Facebook, Phone, Music2, Mail, MessageSquare,
  Sparkles, Target, Handshake, Search as SearchIcon, Users,
  Check, Plus, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerChannel } from "./SocialSellerToggle";

// ── Role catalog (mirror of ChannelAgentRecommender) ─────────────────────────
type AgentRole = "social_seller" | "sdr" | "closer" | "hunter";

const ROLES: Record<AgentRole, { label: string; emoji: string; icon: typeof Users; hue: string }> = {
  social_seller: { label: "Social Seller", emoji: "💬", icon: Sparkles,   hue: "text-[#E1306C]" },
  sdr:           { label: "SDR",           emoji: "🎯", icon: Target,     hue: "text-primary" },
  closer:        { label: "Closer",        emoji: "🤝", icon: Handshake,  hue: "text-success" },
  hunter:        { label: "Hunter",        emoji: "🏹", icon: SearchIcon, hue: "text-accent-blue" },
};

const CHANNEL_ROLE_MAP: Record<SellerChannel, AgentRole[]> = {
  linkedin:  ["social_seller", "sdr", "hunter", "closer"],
  instagram: ["social_seller", "sdr"],
  whatsapp:  ["sdr", "closer", "social_seller"],
  facebook:  ["social_seller", "sdr"],
  tiktok:    ["social_seller"],
  email:     ["sdr", "closer", "hunter"],
  dashboard: ["sdr", "closer"],
};

const CHANNELS: Array<{
  id: SellerChannel;
  label: string;
  icon: typeof MessageSquare;
  brand: string;
  bg: string;
}> = [
  { id: "linkedin",  label: "LinkedIn",  icon: Linkedin,      brand: "text-[#0A66C2]", bg: "from-[#0A66C2]/15 to-[#0A66C2]/0" },
  { id: "whatsapp",  label: "WhatsApp",  icon: Phone,         brand: "text-[#25D366]", bg: "from-[#25D366]/15 to-[#25D366]/0" },
  { id: "instagram", label: "Instagram", icon: Instagram,     brand: "text-[#E1306C]", bg: "from-[#E1306C]/15 to-[#E1306C]/0" },
  { id: "facebook",  label: "Messenger", icon: Facebook,      brand: "text-[#0084FF]", bg: "from-[#0084FF]/15 to-[#0084FF]/0" },
  { id: "tiktok",    label: "TikTok",    icon: Music2,        brand: "text-foreground",bg: "from-foreground/10 to-transparent" },
  { id: "email",     label: "E-mail",    icon: Mail,          brand: "text-accent-blue", bg: "from-accent-blue/15 to-accent-blue/0" },
];

// LocalStorage sync with ChannelAgentRecommender
const STORAGE_KEY = "clauthor:inbox-recommender:v1";
interface StoredState {
  seenChannels: SellerChannel[];
  product?: string;
  chosen: Partial<Record<SellerChannel, AgentRole[]>>;
}
function readState(): StoredState {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : { seenChannels: [], chosen: {} }; }
  catch { return { seenChannels: [], chosen: {} }; }
}

interface Props {
  activeChannel: SellerChannel | "all";
  hiredByChannel: Partial<Record<SellerChannel, number>>;
  onSelectChannel: (c: SellerChannel) => void;
}

const InboxTeamHero = ({ activeChannel, hiredByChannel, onSelectChannel }: Props) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const state = useMemo(readState, [activeChannel]);

  const totalHired = Object.values(hiredByChannel).reduce((a, b) => a + (b ?? 0), 0);
  const totalNeeded = CHANNELS.reduce((sum, c) => sum + (CHANNEL_ROLE_MAP[c.id]?.length ?? 0), 0);
  const coveredChannels = CHANNELS.filter(c => (hiredByChannel[c.id] ?? 0) > 0 || (state.chosen[c.id]?.length ?? 0) > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/15 bg-gradient-to-br from-primary/[0.04] via-card/40 to-transparent p-3.5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shadow-primary/20">
              <Users className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 text-[11px]">✨</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">
              Seu time de vendas nas redes
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {coveredChannels}/{CHANNELS.length} canais com agente · monte um time por rede
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-[10px] text-muted-foreground hover:text-foreground shrink-0"
        >
          {collapsed ? "Mostrar" : "Ocultar"}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CHANNELS.map((c, i) => {
            const roles = CHANNEL_ROLE_MAP[c.id] ?? [];
            const hired = hiredByChannel[c.id] ?? 0;
            const chosen = state.chosen[c.id] ?? [];
            const isActive = activeChannel === c.id;
            const hasTeam = hired > 0 || chosen.length > 0;
            const Icon = c.icon;

            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectChannel(c.id)}
                className={cn(
                  "group relative text-left rounded-xl border p-2.5 overflow-hidden transition-all",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                  isActive
                    ? "border-primary/40 bg-primary/[0.06] shadow-md shadow-primary/10"
                    : "border-border/15 bg-card/60 hover:border-primary/25",
                )}
              >
                {/* Ambient brand glow */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
                  c.bg,
                )} />

                <div className="relative flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", c.brand)} strokeWidth={1.75} />
                    <span className="text-[10.5px] font-semibold text-foreground truncate">
                      {c.label}
                    </span>
                  </div>
                  {hasTeam ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-success shrink-0">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      {hired || chosen.length}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground/70 shrink-0">
                      vazio
                    </span>
                  )}
                </div>

                {/* Role chips */}
                <div className="relative flex flex-wrap gap-1 mb-1.5 min-h-[18px]">
                  {roles.slice(0, 3).map(r => {
                    const active = chosen.includes(r);
                    return (
                      <span
                        key={r}
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium border",
                          active
                            ? "bg-primary/10 border-primary/25 text-primary"
                            : "bg-muted/30 border-border/10 text-muted-foreground",
                        )}
                        title={ROLES[r].label}
                      >
                        <span className="text-[9px] leading-none">{ROLES[r].emoji}</span>
                        {ROLES[r].label}
                      </span>
                    );
                  })}
                </div>

                {/* CTA line */}
                <div className={cn(
                  "relative flex items-center justify-between text-[9.5px] font-medium pt-1 border-t",
                  hasTeam
                    ? "border-success/15 text-success"
                    : "border-border/10 text-primary",
                )}>
                  <span className="inline-flex items-center gap-1">
                    {hasTeam ? (
                      <>
                        <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
                        Ativo
                      </>
                    ) : (
                      <>
                        <Plus className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Contratar
                      </>
                    )}
                  </span>
                  <ChevronRight className="h-2.5 w-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {!collapsed && (
        <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-border/10">
          <p className="text-[10px] text-muted-foreground">
            💡 <span className="text-foreground/80">Dica lúdica:</span> monte squads por rede — cada uma tem um jeito de vender.
          </p>
          <button
            onClick={() => navigate("/dashboard/agents?intent=hire&from=inbox")}
            className="text-[10px] font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Ver catálogo →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default InboxTeamHero;
