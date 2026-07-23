// Mapa honesto de capacidades por canal para o Social Seller.
// Fonte: docs oficiais Meta Graph API, LinkedIn Marketing/Messages API, TikTok for Developers.
// Atualize aqui quando um provedor liberar novo escopo.

export type SellerChannelId =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "whatsapp"
  | "email";

export type CapabilityStatus = "supported" | "beta" | "unsupported";

export interface ChannelCapability {
  id: SellerChannelId;
  label: string;
  provider: "Meta" | "LinkedIn (Hunter)" | "TikTok" | "WhatsApp Cloud" | "SMTP/Gmail";
  // O que o Social Seller consegue fazer neste canal HOJE.
  canReadInbox: CapabilityStatus;
  canReplyDM: CapabilityStatus;
  canProspectColdOutbound: CapabilityStatus;
  // Como o cliente conecta a conta dele
  connectionMethod:
    | "OAuth (Meta Business App)"
    | "OAuth (LinkedIn) + Hunter session cookie"
    | "OAuth (TikTok Login Kit)"
    | "WhatsApp Business Cloud API"
    | "OAuth Gmail / SMTP";
  requiredScopes: string[];
  // Bloqueios legais/técnicos que você precisa saber ANTES de vender
  caveats: string[];
}

export const SELLER_CHANNELS: Record<SellerChannelId, ChannelCapability> = {
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    provider: "LinkedIn (Hunter)",
    canReadInbox: "beta",
    canReplyDM: "beta",
    canProspectColdOutbound: "beta",
    connectionMethod: "OAuth (LinkedIn) + Hunter session cookie",
    requiredScopes: ["r_liteprofile", "w_member_social"],
    caveats: [
      "LinkedIn oficial NÃO libera envio de InMail/DM por API. Usamos o motor Hunter (sessão do próprio cliente) — mesmo padrão de PhantomBuster/Expandi.",
      "Cada conexão exige cookie li_at do próprio cliente (não pode ser compartilhado).",
      "Respeitar limites: 100 convites/semana, 25 msgs/dia por conta pra não trigar restrição.",
    ],
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    provider: "Meta",
    canReadInbox: "supported",
    canReplyDM: "supported",
    canProspectColdOutbound: "unsupported",
    connectionMethod: "OAuth (Meta Business App)",
    requiredScopes: [
      "instagram_basic",
      "instagram_manage_messages",
      "pages_manage_metadata",
      "pages_show_list",
    ],
    caveats: [
      "Conta precisa ser Instagram Business/Creator vinculada a uma Página do Facebook.",
      "Meta só permite responder DMs recebidos nas últimas 24h (janela de mensagem). Fora disso, só templates aprovados.",
      "Cold outbound (mandar DM pra quem nunca falou com você) é PROIBIDO pela política Meta — banimento imediato.",
    ],
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    provider: "Meta",
    canReadInbox: "supported",
    canReplyDM: "supported",
    canProspectColdOutbound: "unsupported",
    connectionMethod: "OAuth (Meta Business App)",
    requiredScopes: ["pages_messaging", "pages_manage_metadata", "pages_show_list", "pages_read_engagement"],
    caveats: [
      "Mesma regra da janela de 24h do Messenger Platform.",
      "Cold outbound proibido. Prospecção só via comentários em posts (permitido) + reply em DM que o lead iniciar.",
    ],
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    provider: "TikTok",
    canReadInbox: "unsupported",
    canReplyDM: "unsupported",
    canProspectColdOutbound: "unsupported",
    connectionMethod: "OAuth (TikTok Login Kit)",
    requiredScopes: ["user.info.basic", "video.list", "video.publish"],
    caveats: [
      "TikTok NÃO oferece API pública de DMs — nem leitura nem envio. Ponto.",
      "O que dá pra automatizar: publicar vídeos, ler analytics de posts, capturar comentários públicos.",
      "Se o cliente quer 'prospectar no TikTok', o único caminho legal é comentar+capturar leads que interagem, e mover conversa pra WhatsApp/E-mail.",
    ],
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    provider: "WhatsApp Cloud",
    canReadInbox: "supported",
    canReplyDM: "supported",
    canProspectColdOutbound: "beta",
    connectionMethod: "WhatsApp Business Cloud API",
    requiredScopes: [],
    caveats: [
      "Cold outbound só com template HSM aprovado pela Meta. Templates são analisados 1–3 dias úteis.",
      "Janela de 24h também vale: fora dela, só template.",
    ],
  },
  email: {
    id: "email",
    label: "E-mail",
    provider: "SMTP/Gmail",
    canReadInbox: "supported",
    canReplyDM: "supported",
    canProspectColdOutbound: "supported",
    connectionMethod: "OAuth Gmail / SMTP",
    requiredScopes: ["gmail.send", "gmail.readonly"],
    caveats: ["Aquecer domínio antes de enviar volume. Respeitar CAN-SPAM/LGPD (opt-out obrigatório)."],
  },
};

export function getChannelCapability(id: SellerChannelId): ChannelCapability {
  return SELLER_CHANNELS[id];
}
