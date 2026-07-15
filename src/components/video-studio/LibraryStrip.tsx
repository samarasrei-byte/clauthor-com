import { Loader2, XCircle, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface Gen {
  id: string;
  status: string;
  output_url: string | null;
  thumbnail_url: string | null;
  duration_s: number;
  prompt: string;
  provider: string;
}

interface Props {
  generations: Gen[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Carrossel horizontal estilo Apple Photos.
 * Cards quadrados 16:9 com scroll snap.
 */
export default function LibraryStrip({ generations, activeId, onSelect }: Props) {
  if (generations.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-4">
      <div className="flex items-center gap-2 mb-3">
        <Film strokeWidth={1.5} className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Biblioteca
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground">
          {generations.length} {generations.length === 1 ? "item" : "itens"}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-1 px-1 pb-1">
        {generations.slice(0, 24).map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className={cn(
              "shrink-0 w-40 snap-start rounded-xl overflow-hidden border transition-all",
              activeId === g.id
                ? "border-primary/70 ring-2 ring-primary/20"
                : "border-border/60 hover:border-muted-foreground/40",
            )}
          >
            <div className="aspect-video bg-neutral-950 relative flex items-center justify-center">
              {g.status === "completed" && g.output_url ? (
                <video
                  src={g.output_url}
                  poster={g.thumbnail_url ?? undefined}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : g.status === "failed" ? (
                <XCircle strokeWidth={1.5} className="w-5 h-5 text-destructive" />
              ) : (
                <Loader2 strokeWidth={1.5} className="w-5 h-5 text-white/60 animate-spin" />
              )}
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md tracking-wide">
                {g.duration_s}s
              </div>
            </div>
            <div className="px-2 py-1.5">
              <div className="text-[11px] text-foreground line-clamp-1">{g.prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
