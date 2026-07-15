import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, Info, Activity, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareTab from "./ShareTab";

interface Gen {
  id: string;
  provider: string;
  model: string | null;
  prompt: string;
  aspect_ratio: string;
  duration_s: number;
  status: string;
  progress: number;
  output_url: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Step {
  id: string;
  step_type: string;
  status: "in_progress" | "completed" | "failed";
  message: string | null;
  created_at: string;
}

interface Props {
  gen: Gen | null;
  steps: Step[];
  providerLabel: string;
}

/**
 * Inspector estilo iOS: segmented tabs (Detalhes / Timeline / Compartilhar).
 * Sticky no desktop, sem sombras exageradas.
 */
export default function VideoInspector({ gen, steps, providerLabel }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur h-fit lg:sticky lg:top-24 overflow-hidden">
      <Tabs defaultValue="details">
        <div className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/40 rounded-lg p-0.5">
            <TabsTrigger value="details" className="rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Info strokeWidth={1.5} className="w-3.5 h-3.5 mr-1.5" /> Detalhes
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Activity strokeWidth={1.5} className="w-3.5 h-3.5 mr-1.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-md text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Share2 strokeWidth={1.5} className="w-3.5 h-3.5 mr-1.5" /> Share
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="p-5 space-y-4">
          {!gen ? (
            <EmptyHint text="Selecione ou gere um vídeo para ver os detalhes." />
          ) : (
            <div className="space-y-3">
              <Row label="Provider" value={providerLabel} />
              {gen.model && <Row label="Modelo" value={gen.model} mono />}
              <Row label="Aspect" value={gen.aspect_ratio} />
              <Row label="Duração" value={`${gen.duration_s}s`} />
              <Row label="Status" value={<StatusPill status={gen.status} progress={gen.progress} />} />
              <Row label="Criado" value={new Date(gen.created_at).toLocaleString()} />
              {gen.completed_at && (
                <Row label="Concluído" value={new Date(gen.completed_at).toLocaleString()} />
              )}
              <div className="pt-2 border-t border-border/50">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  Prompt
                </div>
                <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {gen.prompt}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="p-5">
          {!gen ? (
            <EmptyHint text="Aguardando um vídeo ativo…" />
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {steps.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-start gap-3 py-2 border-b border-border/40 last:border-b-0"
                  >
                    <StepIcon status={s.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground leading-snug">
                        {s.message ?? s.step_type}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(s.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {steps.length === 0 && (
                <div className="text-xs text-muted-foreground py-6 text-center">
                  Aguardando primeiro passo…
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="share" className="p-5">
          {!gen ? (
            <EmptyHint text="Sem vídeo selecionado." />
          ) : (
            <ShareTab
              outputUrl={gen.status === "completed" ? gen.output_url : null}
              prompt={gen.prompt}
              generationId={gen.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </div>
      <div className={`text-xs text-foreground text-right truncate ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status, progress }: { status: string; progress: number }) {
  const tone =
    status === "completed"
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : status === "failed"
      ? "bg-destructive/10 text-destructive"
      : "bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium ${tone}`}>
      {status}
      {status !== "completed" && status !== "failed" && ` · ${progress}%`}
    </span>
  );
}

function StepIcon({ status }: { status: "in_progress" | "completed" | "failed" }) {
  if (status === "failed") return <XCircle strokeWidth={1.5} className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />;
  if (status === "completed") return <CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />;
  return <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 text-primary animate-spin shrink-0 mt-0.5" />;
}

function EmptyHint({ text }: { text: string }) {
  return <div className="text-xs text-muted-foreground py-6 text-center">{text}</div>;
}
