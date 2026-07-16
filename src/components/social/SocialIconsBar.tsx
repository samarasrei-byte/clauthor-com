import { Facebook, Instagram, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Barra unificada de ícones sociais.
 * 9 redes: Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Pinterest, Threads, WhatsApp Business.
 * Reutilizável em posts, vídeos, dashboards e páginas de compartilhamento.
 */

// ─── SVGs custom para marcas sem ícone no lucide ─────────────────────────
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.36a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.79Z" />
  </svg>
);
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2H21l-6.53 7.462L22.5 22H16.09l-5.02-6.548L5.24 22H2.482l6.98-7.977L1.5 2h6.573l4.53 5.98L18.244 2Zm-1.14 18.34h1.518L7.02 3.564H5.39l11.714 16.777Z" />
  </svg>
);
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.09 2.46 7.6 5.98 9.12-.08-.77-.16-1.96.03-2.8.18-.76 1.14-4.83 1.14-4.83s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.37 0 .83-.53 2.08-.8 3.24-.23.97.49 1.76 1.44 1.76 1.73 0 3.06-1.83 3.06-4.46 0-2.33-1.68-3.96-4.07-3.96-2.77 0-4.4 2.08-4.4 4.23 0 .84.32 1.74.72 2.23.08.1.09.18.07.28l-.27 1.11c-.04.18-.14.22-.32.13-1.2-.56-1.95-2.31-1.95-3.72 0-3.03 2.2-5.81 6.34-5.81 3.33 0 5.92 2.37 5.92 5.54 0 3.31-2.09 5.98-4.99 5.98-.97 0-1.89-.51-2.2-1.11l-.6 2.28c-.22.83-.8 1.87-1.19 2.5A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10Z" />
  </svg>
);
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.19 2C6.7 2 2.5 6.05 2.5 12s4.2 10 9.69 10c5.5 0 9.69-4.05 9.69-10S17.69 2 12.19 2Zm.05 15.75c-2.36 0-4.07-1.34-4.68-3.28l1.7-.68c.36 1.24 1.34 2.13 2.98 2.13 1.5 0 2.44-.79 2.44-1.75 0-.85-.58-1.36-1.83-1.5-.6-.07-1.35-.13-2.13-.28-2.15-.4-3.24-1.5-3.24-3.13 0-1.94 1.78-3.44 4.5-3.44 2.25 0 3.87.99 4.6 2.72l-1.65.72c-.55-1.19-1.55-1.75-2.98-1.75-1.44 0-2.4.71-2.4 1.63 0 .79.55 1.29 1.76 1.44.53.06 1.24.13 2.06.28 2.28.42 3.4 1.5 3.4 3.19 0 2.04-1.85 3.7-4.53 3.7Z" />
  </svg>
);

// ─── Definição canônica das 9 redes ──────────────────────────────────────
export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "pinterest"
  | "threads"
  | "whatsapp";

export interface SocialNetworkDef {
  key: SocialNetwork;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  brand: string;
  ready: boolean; // true = OAuth implementado, false = "em breve"
}

export const SOCIAL_NETWORKS: SocialNetworkDef[] = [
  { key: "instagram", name: "Instagram", Icon: Instagram, brand: "text-[#E4405F]", ready: true },
  { key: "facebook", name: "Facebook", Icon: Facebook, brand: "text-[#1877F2]", ready: true },
  { key: "tiktok", name: "TikTok", Icon: TikTokIcon, brand: "text-foreground", ready: true },
  { key: "youtube", name: "YouTube", Icon: Youtube, brand: "text-[#FF0000]", ready: true },
  { key: "linkedin", name: "LinkedIn", Icon: Linkedin, brand: "text-[#0A66C2]", ready: true },
  { key: "x", name: "X", Icon: XIcon, brand: "text-foreground", ready: true },
  { key: "pinterest", name: "Pinterest", Icon: PinterestIcon, brand: "text-[#E60023]", ready: false },
  { key: "threads", name: "Threads", Icon: ThreadsIcon, brand: "text-foreground", ready: false },
  { key: "whatsapp", name: "WhatsApp Business", Icon: MessageCircle, brand: "text-[#25D366]", ready: false },
];

interface SocialIconsBarProps {
  /** Se true, mostra apenas os ícones (linha compacta). Se false, mostra ícones + labels. */
  compact?: boolean;
  /** Callback ao clicar. Redes com ready=false disparam com ready=false — trate como "em breve". */
  onSelect?: (network: SocialNetworkDef) => void;
  /** Redes específicas para filtrar (default: todas 9). */
  filter?: SocialNetwork[];
  /** Redes marcadas como conectadas (mostra checkmark). */
  connected?: SocialNetwork[];
  className?: string;
}

export function SocialIconsBar({
  compact = false,
  onSelect,
  filter,
  connected = [],
  className,
}: SocialIconsBarProps) {
  const list = filter ? SOCIAL_NETWORKS.filter((n) => filter.includes(n.key)) : SOCIAL_NETWORKS;
  const connSet = new Set(connected);

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        compact ? "gap-1.5" : "gap-2",
        className,
      )}
      role="group"
      aria-label="Redes sociais disponíveis"
    >
      {list.map((net) => {
        const isConnected = connSet.has(net.key);
        return (
          <button
            key={net.key}
            type="button"
            onClick={() => onSelect?.(net)}
            disabled={!onSelect}
            title={
              net.ready
                ? isConnected
                  ? `${net.name} — conectado`
                  : `${net.name} — clique para conectar`
                : `${net.name} — em breve`
            }
            aria-label={net.name}
            className={cn(
              "relative flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 transition-all",
              "hover:border-primary/50 hover:shadow-sm",
              "disabled:cursor-default disabled:hover:border-border disabled:hover:shadow-none",
              !net.ready && "opacity-60",
              compact && "px-2 py-1.5",
            )}
          >
            <net.Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", net.brand)} />
            {!compact && (
              <span className="text-xs font-medium text-foreground">{net.name}</span>
            )}
            {isConnected && (
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                aria-hidden
              />
            )}
            {!net.ready && (
              <span
                className={cn(
                  "absolute -right-1 -top-1 rounded-full bg-muted px-1 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground ring-2 ring-background",
                  compact && "hidden",
                )}
              >
                em breve
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
