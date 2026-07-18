import { Loader2, XCircle, Film, PanelRightOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Aba lateral colapsável (Sheet) com a biblioteca de vídeos gerados.
 * Substitui o antigo strip horizontal para economizar espaço vertical.
 */
export default function VideoLibrarySheet({
  generations,
  activeId,
  onSelect,
  open,
  onOpenChange,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-[11px]"
          aria-label="Abrir biblioteca de vídeos"
        >
          <PanelRightOpen strokeWidth={1.5} className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Biblioteca</span>
          <span className="ml-1 text-[10px] rounded-full bg-muted px-1.5 py-0.5 font-mono">
            {generations.length}
          </span>
          <kbd className="hidden md:inline-flex ml-1 h-4 px-1 items-center rounded bg-muted text-[9px] font-mono text-muted-foreground">
            L
          </kbd>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-[13px]">
            <Film strokeWidth={1.5} className="w-4 h-4" />
            Biblioteca
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">
              {generations.length} {generations.length === 1 ? "item" : "itens"}
            </span>
          </SheetTitle>
          <SheetDescription className="text-[11px]">
            Selecione um vídeo para inspecionar no palco.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {generations.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12">
              Nada por aqui ainda. Gere seu primeiro vídeo.
            </div>
          ) : (
            generations.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  onSelect(g.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full flex gap-3 p-2 rounded-xl border text-left transition-all",
                  activeId === g.id
                    ? "border-primary/70 ring-2 ring-primary/20 bg-primary/5"
                    : "border-border/60 hover:border-muted-foreground/40 hover:bg-muted/30",
                )}
              >
                <div className="w-24 aspect-video shrink-0 bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center">
                  {g.status === "completed" && g.output_url ? (
                    <video
                      src={g.output_url}
                      poster={g.thumbnail_url ?? undefined}
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : g.status === "failed" ? (
                    <XCircle strokeWidth={1.5} className="w-4 h-4 text-destructive" />
                  ) : (
                    <Loader2 strokeWidth={1.5} className="w-4 h-4 text-white/60 animate-spin" />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded tracking-wide">
                    {g.duration_s}s
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="text-[12px] text-foreground line-clamp-2 leading-snug">
                    {g.prompt}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {g.provider} · {g.status}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
