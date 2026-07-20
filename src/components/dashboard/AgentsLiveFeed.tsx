import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  FileText,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Mail,
  Users,
  Megaphone,
  ScrollText,
  LayoutGrid,
  Handshake,
  Wand,
  Wrench,
  Brain,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * AgentsLiveFeed · feed fixo no topo do dashboard mostrando, em tempo real,
 * o que cada agente está produzindo (contrato, post, imagem, CRM, campanha…).
 *
 * Fonte de verdade: `execution_steps` (todos os agentes já gravam aqui).
 * Detecta o tipo de artefato via `tool_name` e `content.artifact_type`,
 * renderiza um card compacto com ícone/cor específicos e navega pro replay.
 */

type ArtifactKind =
  | "contract"
  | "proposal"
  | "carousel"
  | "post"
  | "email"
  | "image"
  | "video"
  | "crm"
  | "campaign"
  | "message"
  | "report"
  | "thought"
  | "generic";

interface FeedItem {
  id: string;
  run_id: string;
  agent: string;
  title: string;
  kind: ArtifactKind;
  tool_name: string | null;
  step_type: string;
  created_at: string;
}

const KIND_META: Record<ArtifactKind, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  contract:  { icon: ScrollText,    label: "Contrato",    tone: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  proposal:  { icon: Handshake,     label: "Proposta",    tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  carousel:  { icon: LayoutGrid,    label: "Carrossel",   tone: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20" },
  post:      { icon: Megaphone,     label: "Post",        tone: "text-sky-300 bg-sky-500/10 border-sky-500/20" },
  email:     { icon: Mail,          label: "E-mail",      tone: "text-blue-300 bg-blue-500/10 border-blue-500/20" },
  image:     { icon: ImageIcon,     label: "Imagem",      tone: "text-pink-300 bg-pink-500/10 border-pink-500/20" },
  video:     { icon: Video,         label: "Vídeo",       tone: "text-red-300 bg-red-500/10 border-red-500/20" },
  crm:       { icon: Users,         label: "CRM",         tone: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20" },
  campaign:  { icon: Megaphone,     label: "Campanha",    tone: "text-violet-300 bg-violet-500/10 border-violet-500/20" },
  message:   { icon: MessageSquare, label: "Mensagem",    tone: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20" },
  report:    { icon: FileText,      label: "Relatório",   tone: "text-teal-300 bg-teal-500/10 border-teal-500/20" },
  thought:   { icon: Brain,         label: "Pensamento",  tone: "text-slate-300 bg-slate-500/10 border-slate-500/20" },
  generic:   { icon: Wrench,        label: "Execução",    tone: "text-muted-foreground bg-muted/20 border-border" },
};

function detectKind(tool: string | null, stepType: string, title: string): ArtifactKind {
  const s = `${tool ?? ""} ${title ?? ""}`.toLowerCase();
  if (/contract|contrato|nda|acordo/.test(s)) return "contract";
  if (/proposal|proposta|orcamento|orçamento|quote/.test(s)) return "proposal";
  if (/carousel|carrossel|slides?/.test(s)) return "carousel";
  if (/post(_|-)?(linkedin|social)|linkedin|instagram|social/.test(s)) return "post";
  if (/email|mail|smtp|resend/.test(s)) return "email";
  if (/image|imagem|logo|banner|figma|midjourney|dall/.test(s)) return "image";
  if (/video|veo|replicate|reels|shorts/.test(s)) return "video";
  if (/crm|deal|pipeline|lead|hubspot|salesforce/.test(s)) return "crm";
  if (/campaign|campanha|ads?|meta_ads|google_ads/.test(s)) return "campaign";
  if (/whatsapp|slack|telegram|dm|inbox/.test(s)) return "message";
  if (/report|relatorio|relatório|dashboard/.test(s)) return "report";
  if (stepType === "thought") return "thought";
  return "generic";
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export default function AgentsLiveFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);

  // Initial load · most recent steps across all runs of the tenant (RLS filters)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("execution_steps")
        .select("id, run_id, agent_slug, title, tool_name, step_type, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!mounted || !data) return;
      setItems(
        (data as any[]).map((s) => ({
          id: s.id,
          run_id: s.run_id,
          agent: s.agent_slug || "Agente",
          title: s.title || "Executando…",
          kind: detectKind(s.tool_name, s.step_type, s.title),
          tool_name: s.tool_name,
          step_type: s.step_type,
          created_at: s.created_at,
        })),
      );
    })();
    return () => { mounted = false; };
  }, []);

  // Realtime · new steps append to the feed
  useEffect(() => {
    const channel = supabase
      .channel("agents-live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "execution_steps" },
        (payload) => {
          const s = payload.new as any;
          setItems((prev) => {
            const next: FeedItem = {
              id: s.id,
              run_id: s.run_id,
              agent: s.agent_slug || "Agente",
              title: s.title || "Executando…",
              kind: detectKind(s.tool_name, s.step_type, s.title),
              tool_name: s.tool_name,
              step_type: s.step_type,
              created_at: s.created_at,
            };
            if (prev.some((p) => p.id === next.id)) return prev;
            return [next, ...prev].slice(0, 20);
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const hasItems = items.length > 0;

  return (
    <div className="glass-card rounded-2xl p-3 border border-white/[0.06]">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Seus agentes agora
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{items.length} eventos</span>
      </div>

      {!hasItems ? (
        <div className="flex items-center gap-3 px-2 py-4 text-xs text-muted-foreground">
          <Radio className="h-4 w-4 opacity-40" />
          Quando um agente executar contrato, post, imagem, CRM ou campanha, aparece aqui em tempo real.
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              const StatusIcon =
                it.step_type === "error" ? AlertTriangle :
                it.step_type === "final_output" ? Wand :
                it.step_type === "tool_result" ? CheckCircle2 : Radio;
              return (
                <motion.button
                  key={it.id}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => navigate(`/replay/${it.run_id}`)}
                  className={cn(
                    "shrink-0 w-[240px] text-left rounded-xl p-2.5 border bg-background/40 hover:bg-background/70 transition-all group",
                    "border-white/[0.06] hover:border-white/[0.15]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] uppercase tracking-wider", meta.tone)}>
                      <Icon className="h-2.5 w-2.5" />
                      {meta.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{timeAgo(it.created_at)}</span>
                  </div>
                  <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug">
                    {it.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                    <StatusIcon className="h-2.5 w-2.5" />
                    <span className="truncate">{it.agent}</span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
