import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, MessageSquareWarning, RefreshCw, Clock,
  TrendingUp, ListChecks, Sparkles, Eye, History, Send, Heart,
  MessageCircle, Share2, Bookmark, MoreHorizontal, Instagram,
  ArrowUpRight, Wand2, Zap, ShieldCheck, Images, Pencil, Save, X,
  FileSignature, FileText, FileCheck2, Film, Image as ImageIcon,
  StickyNote, CalendarDays, DollarSign, Maximize2, Minimize2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantId } from "@/hooks/useTenantId";
import { cn } from "@/lib/utils";
import ironbergSlide1 from "@/assets/approval-ironberg/ironberg-1.png.asset.json";
import ironbergSlide2 from "@/assets/approval-ironberg/ironberg-2.png.asset.json";


type Status = "pending" | "in_revision" | "approved" | "rejected";
type DeliveryType = "creative" | "video" | "article" | "post" | "email" | "landing" | "report" | "automation" | "stories" | "document" | "contract" | "proposal" | "other";

interface Approval {
  id: string;
  title: string;
  delivery_type: DeliveryType;
  status: Status;
  preview_url: string | null;
  current_version: number;
  agent_id: string | null;
  agent_name?: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  content: any;
  __demo?: boolean;
}

interface AppVersion {
  id: string;
  version_number: number;
  preview_url: string | null;
  notes: string | null;
  created_at: string;
}

interface AppComment {
  id: string;
  body: string;
  is_rejection_reason: boolean;
  user_id: string;
  created_at: string;
}

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  creative: "Criativo", video: "Vídeo", article: "Artigo", post: "Post Social",
  email: "E-mail", landing: "Landing Page", report: "Relatório",
  automation: "Automação", stories: "Stories", document: "Documento",
  contract: "Contrato", proposal: "Proposta", other: "Outro",
};

const STATUS_META: Record<Status, { label: string; chip: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: "Aguardando", chip: "bg-amber-500/10 text-amber-500 border-amber-500/20",   dot: "bg-amber-500",   icon: Clock },
  in_revision: { label: "Em Ajuste",  chip: "bg-sky-500/10 text-sky-400 border-sky-500/20",        dot: "bg-sky-500",     icon: RefreshCw },
  approved:    { label: "Aprovado",   chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2 },
  rejected:    { label: "Reprovado",  chip: "bg-rose-500/10 text-rose-500 border-rose-500/20",     dot: "bg-rose-500",    icon: XCircle },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const INSTAGRAM_CAROUSEL_SLIDES = [
  { url: ironbergSlide1.url, alt: "Post Ironberg — A maioria desiste, os fortes continuam" },
  { url: ironbergSlide2.url, alt: "Post Ironberg — Não é sobre treinar, é sobre se tornar uma máquina" },
] as const;

// ─────────────── DEMO DATA (exemplo de post para revisão) ───────────────
const now = Date.now();
const DEMO_APPROVALS: Approval[] = [
  {
    id: "demo-post-1",
    title: "Post Instagram — Ironberg Training Center",
    delivery_type: "post",
    status: "pending",
    preview_url: null,
    current_version: 2,
    agent_id: null,
    agent_name: "Aurora · Social Media Agent",
    created_at: new Date(now - 1000 * 60 * 23).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 5).toISOString(),
    approved_at: null,
    __demo: true,
    content: {
      platform: "instagram",
      post_format: "carousel",
      carousel_slides: INSTAGRAM_CAROUSEL_SLIDES,
      caption:
        "A MAIORIA DESISTE. OS FORTES CONTINUAM. 🔥\n\nAqui você não compra uma mensalidade. Você constrói uma nova versão de si mesmo.\n\nDisciplina. Foco. Constância. Resultados.\n\n#Ironberg #TrainingCenter #Bodybuilder #Disciplina #NoPainNoGain",
      hashtags: ["#Ironberg", "#TrainingCenter", "#Bodybuilder", "#Disciplina", "#NoPainNoGain"],
      hook: "Carrossel Ironberg • 2 slides",
      cta: "Aprovar carrossel →",
      stats: { likes: 0, comments: 0, reach_estimate: "22k–30k", slides_count: INSTAGRAM_CAROUSEL_SLIDES.length },
    },
  },
  {
    id: "demo-email-1",
    title: "E-mail — Sequência de boas-vindas (passo 2)",
    delivery_type: "email",
    status: "in_revision",
    preview_url: null,
    current_version: 3,
    agent_id: null,
    agent_name: "Echo · Email Agent",
    created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 30).toISOString(),
    approved_at: null,
    __demo: true,
    content: { subject: "Roberto, seu primeiro agente está pronto 🚀", preheader: "Veja como ativar em 90 segundos." },
  },
  {
    id: "demo-creative-1",
    title: "Criativo — Anúncio Meta Ads (variação A)",
    delivery_type: "creative",
    status: "approved",
    preview_url: null,
    current_version: 1,
    agent_id: null,
    agent_name: "Pixel · Creative Agent",
    created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    approved_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    __demo: true,
    content: { headline: "Sua equipe de IA, montada em 5 minutos" },
  },
  {
    id: "demo-video-1",
    title: "Vídeo — Influencer Avatar IA (edição final)",
    delivery_type: "video",
    status: "pending",
    preview_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    current_version: 2,
    agent_id: null,
    agent_name: "Reel · Video Editor Agent",
    created_at: new Date(now - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 10).toISOString(),
    approved_at: null,
    __demo: true,
    content: {
      format: "Reels 9:16 • 32s",
      avatar: "Influencer Avatar — Sofia (HeyGen)",
      script:
        "Hook (0–3s): Você ainda edita vídeo manualmente?\nDesenvolvimento (3–22s): mostre o agente clonando voz, cortando silêncios e gerando legendas.\nCTA (22–32s): Teste grátis em clauthor.com",
      cuts: [
        { at: "00:00", note: "Hook com zoom no avatar" },
        { at: "00:08", note: "B-roll: timeline editando sozinha" },
        { at: "00:22", note: "Logo + CTA piscando" },
      ],
      caption_overlay: "Edição 100% por IA — voz, cortes e legenda automáticos.",
    },
  },
  {
    id: "demo-proposal-1",
    title: "Proposta Comercial — Squad de Vendas IA",
    delivery_type: "proposal",
    status: "pending",
    preview_url: null,
    current_version: 1,
    agent_id: null,
    agent_name: "Nova · Sales Agent",
    created_at: new Date(now - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 90).toISOString(),
    approved_at: null,
    __demo: true,
    content: {
      client: "TechFlow Soluções",
      headline: "Squad de Vendas com IA — 3 agentes 24/7",
      summary: "Time autônomo cobrindo prospecção, qualificação e follow-up. Setup em 7 dias.",
      items: [
        { title: "Hunter — prospecção LinkedIn", price: "R$ 2.900/mês" },
        { title: "SDR — qualificação por WhatsApp", price: "R$ 3.400/mês" },
        { title: "Closer — follow-up e fechamento", price: "R$ 4.200/mês" },
      ],
      total: "R$ 10.500/mês",
      validity: "Válido por 7 dias",
    },
  },
  {
    id: "demo-stories-1",
    title: "Stories — Anúncio Black Friday (3 frames)",
    delivery_type: "stories",
    status: "pending",
    preview_url: null,
    current_version: 1,
    agent_id: null,
    agent_name: "Pixel · Creative Agent",
    created_at: new Date(now - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 15).toISOString(),
    approved_at: null,
    __demo: true,
    content: {
      caption: "Stories vertical 9:16 — gancho forte, CTA clicável, swipe up para checkout.",
      cta: "Arrasta pra cima",
    },
  },
  {
    id: "demo-document-1",
    title: "Documento — Briefing de campanha Q4",
    delivery_type: "document",
    status: "in_revision",
    preview_url: null,
    current_version: 2,
    agent_id: null,
    agent_name: "Sage · Strategy Agent",
    created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(now - 1000 * 60 * 40).toISOString(),
    approved_at: null,
    __demo: true,
    content: {
      doc_title: "Campanha Q4 — Estratégia 360º",
      sections: [
        "1. Contexto e objetivos",
        "2. Persona, dor e gatilhos",
        "3. Mix de canais e calendário",
        "4. KPIs e metas de conversão",
      ],
    },
  },
];




const ApprovalsCenter = () => {
  const { user } = useAuth();
  const { data: tenantId } = useTenantId();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Status>("pending");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<{ mode: "reject" | "request_changes"; approval: Approval } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [quickNote, setQuickNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (selected) { setDraft(selected.content); setEditing(false); setQuickNote(""); }
  }, [selected?.id]);


  const { data: real = [], isLoading } = useQuery({
    queryKey: ["approvals", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Approval[];
    },
  });

  // Quando não há entregas reais, mostramos exemplos para o usuário sentir o produto
  const approvals: Approval[] = real.length > 0 ? real : DEMO_APPROVALS;
  const isDemoMode = real.length === 0;

  const { data: versions = [] } = useQuery({
    queryKey: ["approval-versions", selected?.id],
    enabled: !!selected && !selected.__demo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_versions").select("*")
        .eq("approval_id", selected!.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as AppVersion[];
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["approval-comments", selected?.id],
    enabled: !!selected && !selected.__demo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_comments").select("*")
        .eq("approval_id", selected!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AppComment[];
    },
  });

  const demoVersions: AppVersion[] = selected?.__demo
    ? [
        { id: "v2", version_number: 2, preview_url: null, notes: "Ajuste de tom + CTA mais direto", created_at: new Date(now - 1000 * 60 * 5).toISOString() },
        { id: "v1", version_number: 1, preview_url: null, notes: "Versão inicial gerada pelo agente", created_at: new Date(now - 1000 * 60 * 60).toISOString() },
      ]
    : [];
  const demoComments: AppComment[] = selected?.__demo
    ? [
        { id: "c1", body: "Tira o emoji do início e deixa o CTA mais urgente.", is_rejection_reason: false, user_id: "demo", created_at: new Date(now - 1000 * 60 * 12).toISOString() },
      ]
    : [];

  const showVersions = selected?.__demo ? demoVersions : versions;
  const showComments = selected?.__demo ? demoComments : comments;

  // ── Mutations (guard contra demo) ──
  const updateStatus = useMutation({
    mutationFn: async ({ approval, status, action, details }: { approval: Approval; status: Status; action: string; details?: any }) => {
      if (approval.__demo) return;
      const patch: any = { status };
      if (status === "approved") { patch.approved_by = user!.id; patch.approved_at = new Date().toISOString(); }
      const { error } = await supabase.from("approvals").update(patch).eq("id", approval.id);
      if (error) throw error;
      await supabase.from("approval_actions").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id, action, details: details || {},
      });
    },
    onSuccess: (_, vars) => {
      if (vars.approval.__demo) toast.success(`Exemplo: ${vars.status === "approved" ? "aprovado" : "atualizado"}`);
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
    },
  });

  const addFeedback = useMutation({
    mutationFn: async ({ approval, body, isRejection, newStatus }: { approval: Approval; body: string; isRejection: boolean; newStatus: Status }) => {
      if (approval.__demo) return;
      await supabase.from("approval_comments").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id,
        body, is_rejection_reason: isRejection, version_number: approval.current_version,
      });
      await supabase.from("approvals").update({ status: newStatus }).eq("id", approval.id);
      await supabase.from("approval_actions").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id,
        action: isRejection ? "reject" : "request_changes", details: { feedback: body },
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.approval.__demo ? "Exemplo: feedback enviado ao agente" : "Feedback enviado ao agente responsável");
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
      setFeedbackOpen(null); setFeedbackText("");
    },
  });

  const newVersion = useMutation({
    mutationFn: async (approval: Approval) => {
      if (approval.__demo) return;
      const nextV = approval.current_version + 1;
      await supabase.from("approval_versions").insert({
        approval_id: approval.id, tenant_id: tenantId, version_number: nextV,
        content: approval.content, preview_url: approval.preview_url,
        generated_by_agent: approval.agent_id, notes: "Nova versão gerada manualmente",
      });
      await supabase.from("approvals").update({ current_version: nextV, status: "pending" }).eq("id", approval.id);
      await supabase.from("approval_actions").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id, action: "new_version", details: { version: nextV },
      });
    },
    onSuccess: (_, v) => {
      toast.success(v.__demo ? "Exemplo: nova versão gerada" : "Nova versão criada");
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
    },
  });

  const saveEdits = useMutation({
    mutationFn: async ({ approval, newContent }: { approval: Approval; newContent: any }) => {
      if (approval.__demo) return;
      const nextV = approval.current_version + 1;
      await supabase.from("approval_versions").insert({
        approval_id: approval.id, tenant_id: tenantId, version_number: nextV,
        content: newContent, preview_url: approval.preview_url,
        generated_by_agent: approval.agent_id, notes: "Edição manual no card de aprovação",
      });
      await supabase.from("approvals")
        .update({ content: newContent, current_version: nextV, status: "pending" })
        .eq("id", approval.id);
      await supabase.from("approval_actions").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id,
        action: "edit_inline", details: { version: nextV },
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.approval.__demo ? "Exemplo: alterações aplicadas" : "Alterações salvas como nova versão");
      qc.invalidateQueries({ queryKey: ["approvals", tenantId] });
      setEditing(false);
      // refletir localmente
      setSelected((s) => s ? { ...s, content: vars.newContent } : s);
    },
  });

  const addQuickNote = useMutation({
    mutationFn: async ({ approval, body }: { approval: Approval; body: string }) => {
      if (approval.__demo) return;
      await supabase.from("approval_comments").insert({
        approval_id: approval.id, tenant_id: tenantId, user_id: user!.id,
        body, is_rejection_reason: false, version_number: approval.current_version,
      });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.approval.__demo ? "Exemplo: observação registrada" : "Observação registrada");
      qc.invalidateQueries({ queryKey: ["approval-comments", vars.approval.id] });
      setQuickNote("");
    },
  });



  // ── Metrics ──
  const metrics = useMemo(() => {
    const total = approvals.length;
    const approved = approvals.filter((a) => a.status === "approved").length;
    const pending = approvals.filter((a) => a.status === "pending" || a.status === "in_revision").length;
    const rate = total ? Math.round((approved / total) * 100) : 0;
    const avgHours = (() => {
      const done = approvals.filter((a) => a.approved_at);
      if (!done.length) return 0;
      const sum = done.reduce((acc, a) => acc + (new Date(a.approved_at!).getTime() - new Date(a.created_at).getTime()), 0);
      return Math.round(sum / done.length / 3600000);
    })();
    const revisions = approvals.reduce((acc, a) => acc + Math.max(0, a.current_version - 1), 0);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const today = approvals.filter((a) => new Date(a.created_at) >= startOfDay).length;
    return { total, approved, pending, rate, avgHours, revisions, today };
  }, [approvals]);

  const filtered = approvals.filter((a) => a.status === tab);
  const counts: Record<Status, number> = {
    pending: approvals.filter((a) => a.status === "pending").length,
    in_revision: approvals.filter((a) => a.status === "in_revision").length,
    approved: approvals.filter((a) => a.status === "approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <ShieldCheck className="h-3 w-3" /> Controle de qualidade
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Central de Aprovações</h1>
            <p className="text-sm text-muted-foreground">
              Cada entrega gerada pelos seus agentes passa por aqui. Aprove em um clique, peça ajustes em linguagem natural — o agente reescreve sozinho.
            </p>
            {isDemoMode && (
              <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-500 mt-1">
                <Sparkles className="h-3 w-3" />
                Modo demonstração — exemplos prontos para você sentir o fluxo.
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" />Regras automáticas</Button>
            <Button className="gap-1.5"><Zap className="h-3.5 w-3.5" />Aprovar lote</Button>
          </div>
        </div>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard icon={CalendarDays} label="Hoje"         value={metrics.today}   accent="primary" />
        <MetricCard icon={ListChecks}   label="Geradas"      value={metrics.total} />
        <MetricCard icon={CheckCircle2} label="Aprovadas"    value={metrics.approved} accent="emerald" />
        <MetricCard icon={Clock}        label="Pendentes"    value={metrics.pending}  accent="amber" />
        <MetricCard icon={TrendingUp}   label="Taxa aprov."  value={`${metrics.rate}%`} accent="primary" />
        <MetricCard icon={Sparkles}     label="Tempo médio"  value={`${metrics.avgHours}h`} />
        <MetricCard icon={RefreshCw}    label="Revisões"     value={metrics.revisions} accent="sky" />
      </div>



      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="bg-muted/40 p-1 h-auto">
          {(Object.keys(STATUS_META) as Status[]).map((s) => {
            const M = STATUS_META[s];
            return (
              <TabsTrigger key={s} value={s} className="gap-2 data-[state=active]:bg-background">
                <span className={cn("h-1.5 w-1.5 rounded-full", M.dot)} />
                {M.label}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{counts[s]}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(STATUS_META) as Status[]).map((s) => (
          <TabsContent key={s} value={s} className="mt-5">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-12 text-center">Carregando...</div>
            ) : filtered.length === 0 ? (
              (() => {
                const EmptyIcon = STATUS_META[s].icon;
                return (
                  <Card className="border-dashed bg-muted/10">
                    <div className="py-20 text-center space-y-2">
                      <EmptyIcon className="h-8 w-8 mx-auto text-muted-foreground/40" strokeWidth={1.4} />
                      <p className="text-sm text-muted-foreground">Nada em "{STATUS_META[s].label}" por enquanto.</p>
                    </div>
                  </Card>
                );
              })()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filtered.map((a) => (
                    <ApprovalCard
                      key={a.id}
                      approval={a}
                      onOpen={() => setSelected(a)}
                      onApprove={() => updateStatus.mutate({ approval: a, status: "approved", action: "approve" })}
                      onRequestChanges={() => { setFeedbackOpen({ mode: "request_changes", approval: a }); setFeedbackText(""); }}
                      onReject={() => { setFeedbackOpen({ mode: "reject", approval: a }); setFeedbackText(""); }}
                      onNewVersion={() => newVersion.mutate(a)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Drawer ─────────────────────────────────────────────── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className={cn(
            "p-0 flex flex-col !left-1/2 !right-auto !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-2xl !border data-[state=open]:!animate-in data-[state=closed]:!animate-out data-[state=closed]:!fade-out-0 data-[state=open]:!fade-in-0 data-[state=closed]:!zoom-out-95 data-[state=open]:!zoom-in-95 data-[state=closed]:!slide-out-to-left-0 data-[state=closed]:!slide-out-to-right-0 data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-right-0 transition-[width,height,max-width] duration-300",
            expanded
              ? "!w-[98vw] !max-w-[1600px] !h-[98vh] !max-h-[98vh]"
              : "!w-[95vw] sm:!max-w-3xl !h-[88vh] !max-h-[88vh]",
          )}
        >
          {selected && (
            <>
              <div className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border/50 px-6 py-4">
                <SheetHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge className={cn("border", STATUS_META[selected.status].chip)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", STATUS_META[selected.status].dot)} />
                      {STATUS_META[selected.status].label}
                    </Badge>
                    <Badge variant="outline">v{selected.current_version}</Badge>
                    <Badge variant="secondary">{DELIVERY_LABEL[selected.delivery_type]}</Badge>
                    <span>há {timeAgo(selected.created_at)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 mt-2">
                    <SheetTitle className="text-xl">{selected.title}</SheetTitle>
                    {!editing ? (
                      <Button size="sm" variant="outline" className="gap-1.5 shrink-0"
                        onClick={() => { setDraft(selected.content); setEditing(true); }}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                    ) : (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="ghost" className="gap-1.5"
                          onClick={() => { setEditing(false); setDraft(selected.content); }}>
                          <X className="h-3.5 w-3.5" /> Cancelar
                        </Button>
                        <Button size="sm" className="gap-1.5"
                          onClick={() => saveEdits.mutate({ approval: selected, newContent: draft })}>
                          <Save className="h-3.5 w-3.5" /> Salvar + OK
                        </Button>
                      </div>
                    )}
                  </div>
                  {selected.agent_name && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" /> Gerado por {selected.agent_name}
                    </div>
                  )}
                </SheetHeader>
              </div>

              <div className="p-6 space-y-6">
                <PreviewBlock
                  approval={selected}
                  editing={editing}
                  draft={draft}
                  setDraft={setDraft}
                />

                {/* Observação rápida no próprio card */}
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    <StickyNote className="h-3 w-3" /> Observação rápida neste {DELIVERY_LABEL[selected.delivery_type].toLowerCase()}
                  </div>
                  <Textarea
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    rows={2}
                    placeholder={`Ex: ${selected.delivery_type === "video" ? "Cortar os 2s finais e legendar." : selected.delivery_type === "contract" ? "Revisar cláusula 3 antes de assinar." : "Deixar o título mais direto."}`}
                    className="resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" className="gap-1.5"
                      disabled={!quickNote.trim() || addQuickNote.isPending}
                      onClick={() => addQuickNote.mutate({ approval: selected, body: quickNote.trim() })}>
                      <Send className="h-3 w-3" /> Anexar observação
                    </Button>
                  </div>
                </div>


                <Section icon={History} title="Histórico de versões">
                  <div className="space-y-1.5">
                    {showVersions.length === 0 && (
                      <div className="text-xs text-muted-foreground">Apenas a versão atual.</div>
                    )}
                    {showVersions.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/40">
                        <Badge variant={i === 0 ? "default" : "outline"} className="text-[10px]">v{v.version_number}</Badge>
                        <span className="flex-1 truncate text-muted-foreground">{v.notes || "—"}</span>
                        <span className="text-muted-foreground/60">há {timeAgo(v.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section icon={MessageSquareWarning} title="Conversa com o agente">
                  <div className="space-y-2">
                    {showComments.length === 0 && (
                      <div className="text-xs text-muted-foreground">Sem feedback ainda. Use "Solicitar Ajustes" para iniciar.</div>
                    )}
                    {showComments.map((c) => (
                      <div key={c.id} className={cn(
                        "p-3 rounded-lg text-xs border",
                        c.is_rejection_reason ? "bg-rose-500/5 border-rose-500/20" : "bg-muted/40 border-border/40"
                      )}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {c.is_rejection_reason && <Badge variant="destructive" className="text-[9px]">Motivo</Badge>}
                          <span className="text-muted-foreground">há {timeAgo(c.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Action bar fixa */}
              <div className="sticky bottom-0 bg-background/85 backdrop-blur-xl border-t border-border/50 px-6 py-3 flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5 flex-1 min-w-[120px]"
                  onClick={() => { updateStatus.mutate({ approval: selected, status: "approved", action: "approve" }); setSelected(null); }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 flex-1 min-w-[120px]"
                  onClick={() => { setFeedbackOpen({ mode: "request_changes", approval: selected }); setFeedbackText(""); }}>
                  <MessageSquareWarning className="h-3.5 w-3.5" /> Solicitar Ajustes
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => newVersion.mutate(selected)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Nova versão
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30"
                  onClick={() => { setFeedbackOpen({ mode: "reject", approval: selected }); setFeedbackText(""); }}>
                  <XCircle className="h-3.5 w-3.5" /> Reprovar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Feedback dialog ─────────────────────────────────────── */}
      <Dialog open={!!feedbackOpen} onOpenChange={(o) => !o && setFeedbackOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackOpen?.mode === "reject" ? (
                <><XCircle className="h-4 w-4 text-destructive" /> Motivo da reprovação</>
              ) : (
                <><Wand2 className="h-4 w-4 text-primary" /> Solicitar ajustes ao agente</>
              )}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Escreva como falaria com um colega. O agente entende contexto e gera uma nova versão automaticamente.
          </p>
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Ex: O tom está formal demais. Deixa mais leve, com humor sutil, e remove o emoji do início."
            rows={5}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeedbackOpen(null)}>Cancelar</Button>
            <Button
              disabled={!feedbackText.trim() || addFeedback.isPending}
              onClick={() => feedbackOpen && addFeedback.mutate({
                approval: feedbackOpen.approval,
                body: feedbackText.trim(),
                isRejection: feedbackOpen.mode === "reject",
                newStatus: feedbackOpen.mode === "reject" ? "rejected" : "in_revision",
              })}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Enviar ao agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─────────────── Subcomponents ───────────────

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2.5 flex items-center gap-1.5">
      <Icon className="h-3 w-3" /> {title}
    </h3>
    {children}
  </div>
);

const ACCENTS = {
  emerald: "text-emerald-500 bg-emerald-500/10",
  amber:   "text-amber-500 bg-amber-500/10",
  primary: "text-primary bg-primary/10",
  sky:     "text-sky-500 bg-sky-500/10",
} as const;

const MetricCard = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: keyof typeof ACCENTS }) => (
  <Card className="p-4 hover:border-primary/30 transition-colors group">
    <div className="flex items-center justify-between mb-3">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center",
        accent ? ACCENTS[accent] : "bg-muted text-muted-foreground")}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      </div>
      <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="text-2xl font-semibold tracking-tight">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">{label}</div>
  </Card>
);

// ─── Preview: renderiza diferente por tipo e suporta edição inline ───
interface PreviewBlockProps {
  approval: Approval;
  editing: boolean;
  draft: any;
  setDraft: (v: any) => void;
}

const PreviewBlock = ({ approval, editing, draft, setDraft }: PreviewBlockProps) => {
  const { delivery_type, preview_url, title } = approval;
  const content = editing ? draft : approval.content;
  const patch = (p: any) => setDraft({ ...draft, ...p });

  // ─── Post Instagram ───
  if (delivery_type === "post" && content?.platform === "instagram") {
    return (
      <div className="space-y-3">
        <InstagramMockup
          caption={content.caption}
          hook={content.hook}
          cta={content.cta}
          stats={content.stats}
          slides={content.carousel_slides}
        />
        {editing && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary flex items-center gap-1.5">
              <Pencil className="h-3 w-3" /> Editar postagem
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">Gancho</label>
              <Input value={content.hook || ""} onChange={(e) => patch({ hook: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">Legenda</label>
              <Textarea rows={5} value={content.caption || ""} onChange={(e) => patch({ caption: e.target.value })} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">CTA</label>
                <Input value={content.cta || ""} onChange={(e) => patch({ cta: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Hashtags (separadas por espaço)</label>
                <Input
                  value={(content.hashtags || []).join(" ")}
                  onChange={(e) => patch({ hashtags: e.target.value.split(/\s+/).filter(Boolean) })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── E-mail ───
  if (delivery_type === "email") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-muted/40 px-4 py-3 border-b border-border/40 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Assunto</div>
          {editing ? (
            <>
              <Input value={content?.subject || ""} onChange={(e) => patch({ subject: e.target.value })} />
              <Input value={content?.preheader || ""} onChange={(e) => patch({ preheader: e.target.value })} placeholder="Preheader" />
            </>
          ) : (
            <>
              <div className="text-sm font-medium">{content?.subject || "—"}</div>
              {content?.preheader && <div className="text-xs text-muted-foreground">{content.preheader}</div>}
            </>
          )}
        </div>
        <div className="p-6 text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>Olá Roberto,</p>
          <p>Seu primeiro agente está armado e pronto para rodar. Em 90 segundos você ativa, conecta uma fonte de dados e vê os primeiros outputs aparecerem em tempo real.</p>
          <Button size="sm" className="mt-2">Ativar agente agora</Button>
        </div>
      </div>
    );
  }

  // ─── Contrato ───
  if (delivery_type === "contract") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500/10 via-card to-card px-5 py-4 border-b border-border/40 flex items-center gap-3">
          <FileSignature className="h-5 w-5 text-amber-500" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Contrato — análise antes da assinatura</div>
            <div className="text-sm font-semibold">{content?.contract_party_a} ⇄ {content?.contract_party_b}</div>
          </div>
          {content?.signature_required && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Assinatura</Badge>}
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor" editing={editing} value={content?.contract_value} onChange={(v) => patch({ contract_value: v })} />
            <Field label="Vigência" editing={editing} value={content?.contract_term} onChange={(v) => patch({ contract_term: v })} />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cláusulas</div>
            {(content?.clauses || []).map((c: string, i: number) => (
              editing ? (
                <Input key={i} value={c}
                  onChange={(e) => {
                    const next = [...(content.clauses || [])]; next[i] = e.target.value;
                    patch({ clauses: next });
                  }} />
              ) : (
                <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs leading-relaxed">
                  <FileCheck2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Proposta ───
  if (delivery_type === "proposal") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-card to-card px-5 py-4 border-b border-border/40">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Proposta comercial — {content?.client}</div>
          {editing ? (
            <Input className="mt-1" value={content?.headline || ""} onChange={(e) => patch({ headline: e.target.value })} />
          ) : (
            <div className="text-base font-semibold mt-1">{content?.headline}</div>
          )}
          {editing ? (
            <Textarea rows={2} className="mt-2 resize-none" value={content?.summary || ""} onChange={(e) => patch({ summary: e.target.value })} />
          ) : (
            <div className="text-xs text-muted-foreground mt-1">{content?.summary}</div>
          )}
        </div>
        <div className="p-5 space-y-2">
          {(content?.items || []).map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs">
              {editing ? (
                <>
                  <Input value={it.title}
                    onChange={(e) => { const next = [...content.items]; next[i] = { ...it, title: e.target.value }; patch({ items: next }); }} />
                  <Input className="w-32" value={it.price}
                    onChange={(e) => { const next = [...content.items]; next[i] = { ...it, price: e.target.value }; patch({ items: next }); }} />
                </>
              ) : (
                <><span className="flex-1">{it.title}</span><span className="font-semibold">{it.price}</span></>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Total</span>
            {editing ? (
              <Input className="w-40 text-right" value={content?.total || ""} onChange={(e) => patch({ total: e.target.value })} />
            ) : (
              <span className="font-bold text-primary">{content?.total}</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground text-right">{content?.validity}</div>
        </div>
      </div>
    );
  }

  // ─── Documento ───
  if (delivery_type === "document") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-muted/30 px-5 py-4 border-b border-border/40 flex items-center gap-3">
          <FileText className="h-5 w-5 text-sky-500" />
          {editing ? (
            <Input value={content?.doc_title || ""} onChange={(e) => patch({ doc_title: e.target.value })} />
          ) : (
            <div className="text-sm font-semibold">{content?.doc_title}</div>
          )}
        </div>
        <div className="p-5 space-y-2">
          {(content?.sections || []).map((s: string, i: number) => (
            editing ? (
              <Input key={i} value={s}
                onChange={(e) => { const next = [...(content.sections || [])]; next[i] = e.target.value; patch({ sections: next }); }} />
            ) : (
              <div key={i} className="text-xs p-2.5 rounded bg-muted/30 border border-border/40">{s}</div>
            )
          ))}
        </div>
      </div>
    );
  }

  // ─── Stories ───
  if (delivery_type === "stories") {
    return (
      <div className="space-y-3">
        <div className="mx-auto aspect-[9/16] max-w-[260px] rounded-2xl border border-border/60 bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-500 relative overflow-hidden shadow-xl">
          <div className="absolute inset-x-3 top-3 flex gap-1">
            {[0,1,2].map(i => <div key={i} className="h-0.5 flex-1 rounded-full bg-white/70" />)}
          </div>
          <div className="absolute inset-x-4 bottom-6 text-center text-white space-y-2">
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">Stories • 9:16</div>
            <div className="text-lg font-bold leading-tight">{content?.cta || "Arrasta pra cima"}</div>
          </div>
        </div>
        {editing && (
          <Textarea rows={3} value={content?.caption || ""} onChange={(e) => patch({ caption: e.target.value })}
            className="resize-none" placeholder="Texto do stories" />
        )}
      </div>
    );
  }

  if (preview_url) {
    if (delivery_type === "video") return <video src={preview_url} controls className="w-full rounded-xl border border-border/40" />;
    if (delivery_type === "landing") return <iframe src={preview_url} sandbox="allow-same-origin" className="w-full h-80 rounded-xl border border-border/40 bg-background" />;
    return <img src={preview_url} alt={title} className="w-full rounded-xl border border-border/40" />;
  }

  return (
    <div className="aspect-video bg-gradient-to-br from-muted/40 to-muted/10 rounded-xl flex flex-col items-center justify-center text-xs text-muted-foreground border border-border/40 gap-2">
      <Eye className="h-6 w-6 opacity-40" />
      Preview será gerado quando o agente concluir a entrega
    </div>
  );
};

const Field = ({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    {editing ? <Input value={value || ""} onChange={(e) => onChange(e.target.value)} /> : <div className="text-sm font-medium">{value || "—"}</div>}
  </div>
);


interface InstagramSlide {
  url: string;
  alt: string;
}

interface InstagramMockupProps {
  caption: string;
  hook?: string;
  cta?: string;
  stats?: {
    likes?: number;
    comments?: number;
    reach_estimate?: string;
    slides_count?: number;
  };
  slides?: readonly InstagramSlide[];
}

const InstagramMockup = ({ caption, hook, cta, stats, slides = [] }: InstagramMockupProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const totalSlides = slides.length || 1;

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);


  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-amber-400 p-[2px]">
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center text-[10px] font-bold">CL</div>
          </div>
          <div>
            <div className="text-xs font-semibold leading-tight">clauthor.ai</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Carrossel patrocinado</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 border-border/60 bg-background/70">
            <Images className="h-3 w-3" /> {current + 1}/{totalSlides}
          </Badge>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="relative bg-muted/20 border-b border-border/40">
        {slides.length > 0 ? (
          <Carousel setApi={setApi} opts={{ loop: false }} className="w-full">
            <CarouselContent className="ml-0">
              {slides.map((slide) => (
                <CarouselItem key={slide.url} className="pl-0">
                  <div className="aspect-square overflow-hidden bg-background">
                    <img src={slide.url} alt={slide.alt} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 top-1/2 h-9 w-9 -translate-y-1/2 border-border/60 bg-background/85 text-foreground backdrop-blur hover:bg-background" />
            <CarouselNext className="right-3 top-1/2 h-9 w-9 -translate-y-1/2 border-border/60 bg-background/85 text-foreground backdrop-blur hover:bg-background" />
          </Carousel>
        ) : (
          <div className="aspect-square relative bg-gradient-to-br from-primary via-rose-500 to-fuchsia-600 flex items-center justify-center p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="relative text-center space-y-2">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/80">Instagram</div>
              <div className="text-2xl font-bold text-white leading-tight">{hook || "Sua operação no automático"}</div>
              {cta && <div className="inline-flex items-center gap-1 text-xs text-white/90 mt-2 border border-white/30 rounded-full px-3 py-1 backdrop-blur">{cta}</div>}
            </div>
          </div>
        )}

        {slides.length > 1 && (
          <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/50 bg-background/75 px-2 py-1 backdrop-blur">
            {slides.map((slide, index) => (
              <span
                key={slide.url}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  index === current ? "bg-foreground" : "bg-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-2 flex items-center gap-4">
        <Heart className="h-5 w-5" strokeWidth={1.6} />
        <MessageCircle className="h-5 w-5" strokeWidth={1.6} />
        <Share2 className="h-5 w-5" strokeWidth={1.6} />
        <Bookmark className="h-5 w-5 ml-auto" strokeWidth={1.6} />
      </div>

      <div className="px-4 pb-4 text-xs space-y-1.5">
        <div className="font-semibold text-foreground">{hook || "Carrossel Instagram"}</div>
        <div className="text-muted-foreground">
          <span className="font-semibold text-foreground">clauthor.ai</span>{" "}
          <span className="whitespace-pre-line leading-relaxed">{caption}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {cta && <Badge variant="secondary" className="text-[10px]">{cta}</Badge>}
          {stats?.slides_count && <Badge variant="outline" className="text-[10px]">{stats.slides_count} slides</Badge>}
        </div>
        {stats?.reach_estimate && (
          <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/40 mt-3">
            Alcance estimado pela IA: <span className="font-medium text-foreground">{stats.reach_estimate}</span>
          </div>
        )}
      </div>
    </div>
  );
};


interface CardProps {
  approval: Approval;
  onOpen: () => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onNewVersion: () => void;
}

const ApprovalCard = ({ approval, onOpen, onApprove, onRequestChanges, onReject, onNewVersion }: CardProps) => {
  const M = STATUS_META[approval.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden flex flex-col h-full border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all">
        <button onClick={onOpen} className="block text-left">
          <CardPreview approval={approval} />
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("border text-[10px] gap-1", M.chip)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", M.dot)} />
                {M.label}
              </Badge>
              <Badge variant="outline" className="text-[10px]">v{approval.current_version}</Badge>
              <Badge variant="secondary" className="text-[10px]">{DELIVERY_LABEL[approval.delivery_type]}</Badge>
            </div>
            <div className="text-sm font-medium truncate">{approval.title}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {approval.agent_name ? (
                <><Sparkles className="h-3 w-3 text-primary" />{approval.agent_name}</>
              ) : (
                <>Gerado há {timeAgo(approval.created_at)}</>
              )}
            </div>
          </div>
        </button>
        <div className="px-4 pb-4 grid grid-cols-2 gap-1.5 mt-auto">
          <Button size="sm" className="h-8 text-[11px] gap-1" onClick={onApprove}>
            <CheckCircle2 className="h-3 w-3" /> Aprovar
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" onClick={onRequestChanges}>
            <MessageSquareWarning className="h-3 w-3" /> Ajustes
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1" onClick={onNewVersion}>
            <RefreshCw className="h-3 w-3" /> Nova v.
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-[11px] gap-1 text-destructive hover:text-destructive" onClick={onReject}>
            <XCircle className="h-3 w-3" /> Reprovar
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

const CardPreview = ({ approval }: { approval: Approval }) => {
  const { delivery_type, content, preview_url } = approval;

  // Post Instagram — mini preview de carrossel
  if (delivery_type === "post" && content?.platform === "instagram") {
    const firstSlide = content?.carousel_slides?.[0]?.url;
    const slidesCount = content?.carousel_slides?.length ?? 0;

    return (
      <div className="aspect-[16/10] relative overflow-hidden bg-muted/20">
        {firstSlide ? (
          <img src={firstSlide} alt={content?.carousel_slides?.[0]?.alt || approval.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-rose-500 to-fuchsia-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge className="border-0 bg-background/80 text-foreground text-[10px] gap-1 backdrop-blur">
            <Instagram className="h-3 w-3" /> Carrossel
          </Badge>
        </div>
        {slidesCount > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="border-0 bg-background/80 text-foreground text-[10px] backdrop-blur">
              1/{slidesCount}
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-[10px] uppercase tracking-wider text-white/80">Instagram • Aprovação</div>
          <div className="text-sm font-bold text-white leading-tight line-clamp-2 mt-0.5">{content.hook}</div>
        </div>
      </div>
    );
  }


  if (delivery_type === "email") {
    return (
      <div className="aspect-[16/10] bg-gradient-to-br from-sky-500/10 via-background to-primary/10 p-4 flex flex-col justify-center border-b border-border/40">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Assunto</div>
        <div className="text-sm font-semibold line-clamp-2">{content?.subject || "—"}</div>
        {content?.preheader && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{content.preheader}</div>}
      </div>
    );
  }

  if (delivery_type === "creative") {
    return (
      <div className="aspect-[16/10] relative bg-gradient-to-br from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div className="relative text-center text-white text-base font-bold leading-snug line-clamp-3">
          {content?.headline || approval.title}
        </div>
      </div>
    );
  }

  if (delivery_type === "contract") {
    return (
      <div className="aspect-[16/10] relative bg-gradient-to-br from-amber-500/15 via-background to-background p-4 border-b border-border/40">
        <FileSignature className="h-5 w-5 text-amber-500 mb-2" />
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Contrato — assinatura</div>
        <div className="text-sm font-semibold line-clamp-2 mt-0.5">{content?.contract_party_a} ⇄ {content?.contract_party_b}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{content?.contract_value}</div>
      </div>
    );
  }

  if (delivery_type === "proposal") {
    return (
      <div className="aspect-[16/10] relative bg-gradient-to-br from-primary/15 via-background to-background p-4 border-b border-border/40">
        <FileText className="h-5 w-5 text-primary mb-2" />
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Proposta — {content?.client}</div>
        <div className="text-sm font-semibold line-clamp-2 mt-0.5">{content?.headline}</div>
        <div className="text-[11px] text-primary font-semibold mt-1">{content?.total}</div>
      </div>
    );
  }

  if (delivery_type === "document") {
    return (
      <div className="aspect-[16/10] relative bg-gradient-to-br from-sky-500/15 via-background to-background p-4 border-b border-border/40">
        <FileText className="h-5 w-5 text-sky-500 mb-2" />
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Documento</div>
        <div className="text-sm font-semibold line-clamp-2 mt-0.5">{content?.doc_title}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{(content?.sections || []).length} seções</div>
      </div>
    );
  }

  if (delivery_type === "stories") {
    return (
      <div className="aspect-[16/10] relative bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-500 flex items-center justify-center overflow-hidden">
        <Film className="absolute top-3 right-3 h-4 w-4 text-white/80" />
        <div className="text-center text-white space-y-1 px-4">
          <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">Stories • 9:16</div>
          <div className="text-sm font-bold leading-tight line-clamp-2">{content?.cta || approval.title}</div>
        </div>
      </div>
    );
  }


  if (preview_url) {
    if (delivery_type === "video") return <video src={preview_url} className="aspect-[16/10] w-full object-cover" />;
    return <img src={preview_url} alt="" className="aspect-[16/10] w-full object-cover" />;
  }

  return (
    <div className="aspect-[16/10] bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
      <Eye className="h-6 w-6 text-muted-foreground/40" />
    </div>
  );
};

export default ApprovalsCenter;
