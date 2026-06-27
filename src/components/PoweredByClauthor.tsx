import { Sparkles } from "lucide-react";

interface Props {
  refCode?: string;
  className?: string;
}

/**
 * Watermark "Powered by Clauthor" para entregáveis públicos (posts, PDFs, emails).
 * Distribuição viral: cada deliverable carrega link de indicação do tenant.
 */
export default function PoweredByClauthor({ refCode, className = "" }: Props) {
  const url = refCode
    ? `https://clauthor.com/?ref=${refCode}`
    : "https://clauthor.com";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      <span>
        Powered by <strong className="font-semibold">Clauthor</strong>
      </span>
    </a>
  );
}
