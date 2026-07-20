import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clapperboard, Scissors, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDenseMode } from "@/hooks/useDenseMode";

const VideoStudio = lazy(() => import("./VideoStudio"));
const VideoClipper = lazy(() => import("./VideoClipper"));

/**
 * Video Hub · unifica Video Studio (geração) + Auto-Clipper (cortes) em abas.
 * Query param `?tab=studio|clipper` controla a aba ativa.
 */

export default function VideoHub() {
  useDenseMode();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = useMemo(() => (params.get("tab") === "clipper" ? "clipper" : "studio"), [params]);

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Helmet>
        <title>Video Hub · Clauthor</title>
        <meta name="description" content="Gere vídeos com IA e corte reels automáticos em um só lugar." />
      </Helmet>

      <div className="shrink-0 border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 sm:px-6 pt-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="studio"
              className="h-8 px-3 gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs"
            >
              <Clapperboard className="h-3.5 w-3.5" />
              Video Studio
              <span className="hidden sm:inline text-[10px] text-muted-foreground ml-1">Gerar</span>
            </TabsTrigger>
            <TabsTrigger
              value="clipper"
              className="h-8 px-3 gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs"
            >
              <Scissors className="h-3.5 w-3.5" />
              Auto-Clipper
              <span className="hidden sm:inline text-[10px] text-muted-foreground ml-1">Cortar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="studio" className="mt-0">
            <Suspense fallback={<HubFallback label="Carregando Studio…" />}>
              <VideoStudio />
            </Suspense>
          </TabsContent>
          <TabsContent value="clipper" className="mt-0">
            <Suspense fallback={<HubFallback label="Carregando Clipper…" />}>
              <VideoClipper />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HubFallback({ label }: { label: string }) {
  return (
    <div className="h-[60vh] flex items-center justify-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
