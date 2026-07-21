/**
 * Native visual themes for each social/messaging platform.
 * Each theme replicates the native chat look (background, bubbles, header, input).
 * Colors are literal here (bg-[#...]) on purpose — we're mimicking real apps.
 */
export type PlatformKey =
  | "whatsapp"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "email"
  | "dashboard";

export interface PlatformTheme {
  key: PlatformKey;
  label: string;
  brandColor: string;
  /** Chat container backdrop */
  chatBg: string;
  /** Header (top bar) classes */
  header: string;
  headerText: string;
  /** Outgoing (me) bubble */
  outgoing: string;
  /** Incoming (them) bubble */
  incoming: string;
  /** Input area classes */
  inputWrap: string;
  inputField: string;
  sendButton: string;
  /** Font family override (Tailwind arbitrary) */
  font: string;
  /** Bubble corner radius */
  radius: string;
}

export const PLATFORM_THEMES: Record<PlatformKey, PlatformTheme> = {
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    brandColor: "#25D366",
    chatBg:
      "bg-[#0B141A] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><circle cx=%2250%22 cy=%2250%22 r=%221%22 fill=%22%23ffffff08%22/></svg>')]",
    header: "bg-[#202C33] border-b border-black/40",
    headerText: "text-[#E9EDEF]",
    outgoing: "bg-[#005C4B] text-white rounded-2xl rounded-tr-sm",
    incoming: "bg-[#202C33] text-[#E9EDEF] rounded-2xl rounded-tl-sm",
    inputWrap: "bg-[#202C33] border-t border-black/40",
    inputField:
      "bg-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] rounded-full px-4",
    sendButton: "bg-[#00A884] hover:bg-[#00806A] text-white rounded-full",
    font: "font-sans",
    radius: "rounded-2xl",
  },
  instagram: {
    key: "instagram",
    label: "Instagram",
    brandColor: "#E1306C",
    chatBg: "bg-black",
    header: "bg-black border-b border-white/10",
    headerText: "text-white",
    outgoing:
      "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#FCAF45] text-white rounded-3xl",
    incoming: "bg-[#262626] text-white rounded-3xl",
    inputWrap: "bg-black border-t border-white/10",
    inputField:
      "bg-transparent border border-white/20 text-white placeholder:text-white/40 rounded-full px-4",
    sendButton:
      "text-[#0095F6] hover:text-[#1EA0FF] bg-transparent font-semibold",
    font: "font-sans",
    radius: "rounded-3xl",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    brandColor: "#0A66C2",
    chatBg: "bg-white",
    header: "bg-white border-b border-[#E0E0E0]",
    headerText: "text-[#000000E6]",
    outgoing: "bg-[#0A66C2] text-white rounded-lg",
    incoming: "bg-[#EDF3F8] text-[#000000E6] rounded-lg border border-[#00000014]",
    inputWrap: "bg-white border-t border-[#E0E0E0]",
    inputField:
      "bg-[#EDF3F8] text-[#000000E6] placeholder:text-[#00000099] rounded-lg px-3",
    sendButton: "bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full",
    font: "font-sans",
    radius: "rounded-lg",
  },
  facebook: {
    key: "facebook",
    label: "Messenger",
    brandColor: "#0084FF",
    chatBg: "bg-white",
    header: "bg-white border-b border-[#E4E6EB]",
    headerText: "text-[#050505]",
    outgoing: "bg-[#0084FF] text-white rounded-3xl",
    incoming: "bg-[#F0F0F0] text-[#050505] rounded-3xl",
    inputWrap: "bg-white border-t border-[#E4E6EB]",
    inputField:
      "bg-[#F0F2F5] text-[#050505] placeholder:text-[#65676B] rounded-full px-4",
    sendButton: "text-[#0084FF] hover:text-[#0066CC] bg-transparent",
    font: "font-sans",
    radius: "rounded-3xl",
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    brandColor: "#FE2C55",
    chatBg: "bg-[#121212]",
    header: "bg-[#121212] border-b border-white/10",
    headerText: "text-white",
    outgoing: "bg-[#FE2C55] text-white rounded-2xl",
    incoming: "bg-[#2A2A2A] text-white rounded-2xl",
    inputWrap: "bg-[#121212] border-t border-white/10",
    inputField:
      "bg-[#1F1F1F] text-white placeholder:text-white/40 rounded-full px-4",
    sendButton: "bg-[#FE2C55] hover:bg-[#E01B44] text-white rounded-full",
    font: "font-sans",
    radius: "rounded-2xl",
  },
  email: {
    key: "email",
    label: "E-mail",
    brandColor: "#D93025",
    chatBg: "bg-white",
    header: "bg-white border-b border-[#E0E0E0]",
    headerText: "text-[#202124]",
    outgoing: "bg-[#F1F3F4] text-[#202124] rounded-lg border border-[#E0E0E0]",
    incoming: "bg-white text-[#202124] rounded-lg border border-[#E0E0E0]",
    inputWrap: "bg-white border-t border-[#E0E0E0]",
    inputField:
      "bg-[#F1F3F4] text-[#202124] placeholder:text-[#5F6368] rounded-lg px-3",
    sendButton: "bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded",
    font: "font-sans",
    radius: "rounded-lg",
  },
  dashboard: {
    key: "dashboard",
    label: "Chat",
    brandColor: "hsl(var(--primary))",
    chatBg: "bg-background",
    header: "bg-card border-b border-border/20",
    headerText: "text-foreground",
    outgoing: "bg-primary text-primary-foreground rounded-2xl rounded-br-sm",
    incoming: "bg-muted text-foreground rounded-2xl rounded-bl-sm",
    inputWrap: "bg-card border-t border-border/20",
    inputField: "bg-muted text-foreground placeholder:text-muted-foreground rounded-full px-4",
    sendButton: "bg-primary hover:bg-primary/90 text-primary-foreground rounded-full",
    font: "font-sans",
    radius: "rounded-2xl",
  },
};
