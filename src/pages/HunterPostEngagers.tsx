import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Linkedin, Sparkles, Users, MessageSquare, ArrowRight, Loader2, CheckCircle2, Bot,
  ThumbsUp, MessageCircle, Database, ChevronDown, AlertCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getSocialSellerConfig } from "@/components/inbox/SocialSellerToggle";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useHunterActionJobs, HunterActionJob } from "@/hooks/useHunterActionJobs";

type Engager = {
  name: string;
  headline: string;
  reaction: "like" | "comment";
  snippet?: string;
  suggestedMessage: string;
  linkedin_url: string;
  lead_id?: string; // filled after persistence
};

const CRM_OPTIONS = [
  { id: "hubspot", name: "HubSpot" },
  { id: "pipedrive", name: "Pipedrive" },
  { id: "salesforce", name: "Salesforce" },
  { id: "zoho", name: "Zoho CRM" },
  { id: "rdstation", name: "RD Station" },
] as const;

type CrmId = typeof CRM_OPTIONS[number]["id"];

function StatusPill({ job }: { job?: HunterActionJob }) {
  if (!job) return null;
  const map: Record<HunterActionJob["status"], { label: string; cls: string }> = {
    queued: { label: `Na fila${job.attempt > 1 ? ` · tentativa ${job.attempt}/${job.max_attempts}` : ""}`, cls: "bg-muted text-muted-foreground" },
    running: { label: "Executando…", cls: "bg-info/10 text-info" },
    success: { label: "Concluído ✓", cls: "bg-success/10 text-success" },
    failed: { label: `Falhou (${job.attempt}/${job.max_attempts})`, cls: "bg-destructive/10 text-destructive" },
    skipped_duplicate: { label: "Já enviado", cls: "bg-warning/10 text-warning" },
  };
  const s = map[job.status];
  return <span className={`text-[10px] px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>;
}

const HunterPostEngagers = () => {
  const [postUrl, setPostUrl] = useState("");
  const [tone, setTone] = useState("Consultivo e curioso, mencionar o post especificamente");
  const [loading, setLoading] = useState(false);
  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dispatching, setDispatching] = useState<Set<number>>(new Set());
  const sellerConfig = getSocialSellerConfig("linkedin");

  const leadIds = useMemo(() => engagers.map((e) => e.lead_id).filter(Boolean) as string[], [engagers]);
  const { jobs, retryJob } = useHunterActionJobs({ enabled: leadIds.length > 0, limit: 200 });

  // Newest job per (lead_id, action)
  const jobIndex = useMemo(() => {
    const idx = new Map<string, HunterActionJob>();
    for (const j of jobs) {
      if (!j.lead_id) continue;
      const key = `${j.lead_id}:${j.action}`;
      const existing = idx.get(key);
      if (!existing || new Date(j.created_at) > new Date(existing.created_at)) idx.set(key, j);
    }
    return idx;
  }, [jobs]);

  const extract = async () => {
    if (!postUrl.includes("linkedin.com")) {
      toast.error("Cole uma URL de post do LinkedIn válida");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const mock: Engager[] = [
      {
        name: "Ana Ribeiro",
        headline: "Head de Growth · Fintech B2B",
        reaction: "comment",
        snippet: "Excelente ponto sobre pipeline preditivo, aplicamos algo similar…",
        suggestedMessage:
          "Oi Ana! Vi seu comentário sobre pipeline preditivo — curti muito a abordagem que vocês aplicam na fintech. Faz sentido trocar uma ideia rápida?",
        linkedin_url: "https://linkedin.com/in/ana-ribeiro-mock",
      },
      {
        name: "Rafael Costa",
        headline: "Fundador · SaaS de logística",
        reaction: "like",
        suggestedMessage:
          "Oi Rafael, notei que você curtiu o post sobre automação comercial. Posso te mostrar em 10min como estamos resolvendo isso?",
        linkedin_url: "https://linkedin.com/in/rafael-costa-mock",
      },
      {
        name: "Marina Alves",
        headline: "Diretora Comercial · Indústria",
        reaction: "comment",
        snippet: "Faz total sentido, mas o desafio maior é adoção pelo time…",
        suggestedMessage:
          "Marina, seu comentário sobre adoção pelo time foi certeiro — é o gargalo #1 que ouvimos. Topa uma call de 15min?",
        linkedin_url: "https://linkedin.com/in/marina-alves-mock",
      },
    ];
    setEngagers(mock);
    setSelected(new Set(mock.map((_, i) => i)));
    setLoading(false);
    toast.success(`${mock.length} engajadores extraídos`);
  };

  const ensureLead = async (i: number): Promise<string | null> => {
    const e = engagers[i];
    if (e.lead_id) return e.lead_id;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login para executar ações"); return null; }

    // Ensure a campaign to attach leads to
    const { data: existingCamp } = await supabase
      .from("hunter_campaigns")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let campaignId = existingCamp?.[0]?.id;
    if (!campaignId) {
      const { data: newCamp, error: campErr } = await supabase
        .from("hunter_campaigns")
        .insert({
          user_id: user.id,
          nome: "Post Engagers · " + new Date().toLocaleDateString("pt-BR"),
          status: "ativa",
        })
        .select("id")
        .single();
      if (campErr || !newCamp) { toast.error("Falha ao criar campanha"); return null; }
      campaignId = (newCamp as { id: string }).id;
    }

    const { data: newLead, error: leadErr } = await supabase
      .from("hunter_leads")
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        nome_completo: e.name,
        cargo: e.headline,
        empresa: "",
        linkedin_url: e.linkedin_url,
        icebreaker: e.suggestedMessage,
        status: "novo",
        notas: e.snippet ?? "",
      })
      .select("id")
      .single();
    if (leadErr || !newLead) { toast.error("Falha ao criar lead: " + leadErr?.message); return null; }

    const id = newLead.id;
    setEngagers((prev) => prev.map((x, idx) => idx === i ? { ...x, lead_id: id } : x));
    return id;
  };

  const runAction = async (
    i: number,
    action: "like" | "comment" | "crm_push",
    crmProvider?: CrmId,
  ) => {
    if (dispatching.has(i)) return;
    setDispatching((s) => new Set(s).add(i));
    try {
      const leadId = await ensureLead(i);
      if (!leadId) return;
      const body: Record<string, unknown> = { leadIds: [leadId], action };
      if (action === "comment") body.params = { comment: engagers[i].suggestedMessage };
      if (action === "crm_push") body.params = { crmProvider };

      const { data, error } = await supabase.functions.invoke("hunter-action-dispatch", { body });
      if (error) throw new Error(error.message);
      const skipped = (data as { skipped?: number })?.skipped ?? 0;
      if (skipped > 0) {
        toast.warning("Lead já estava no CRM");
      } else {
        toast.success(
          action === "like" ? `Like agendado para ${engagers[i].name}`
            : action === "comment" ? `Comentário agendado para ${engagers[i].name}`
            : `Envio ao ${crmProvider} agendado`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha ao disparar ação: " + msg);
    } finally {
      setDispatching((s) => {
        const next = new Set(s);
        next.delete(i);
        return next;
      });
    }
  };

  const sendToApproval = () => {
    if (selected.size === 0) { toast.error("Selecione ao menos um engajador"); return; }
    const followUp = sellerConfig.enabled
      ? `Respostas dos leads serão tratadas por ${sellerConfig.agentName || "Social Seller LinkedIn"}${sellerConfig.requireApproval ? " (com aprovação)" : " (automático)"}.`
      : "Ative o Social Seller LinkedIn no Inbox para respostas automáticas.";
    toast.success(`${selected.size} mensagens enviadas ao Approvals Center`, { description: followUp });
    setEngagers([]);
    setSelected(new Set());
    setPostUrl("");
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const getJob = (i: number, action: HunterActionJob["action"]) => {
    const leadId = engagers[i].lead_id;
    if (!leadId) return undefined;
    return jobIndex.get(`${leadId}:${action}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="dash-h1 flex items-center gap-2">
          <Linkedin className="h-6 w-6 text-info" /> Engajadores de Post
        </h1>
        <p className="dash-body text-muted-foreground mt-1">
          Cole a URL de um post no LinkedIn. O Social Seller extrai quem curtiu/comentou e gera mensagens personalizadas.
          <Link to="/dashboard/hunter/atividade" className="text-primary underline ml-2">Ver atividade em tempo real →</Link>
        </p>
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-center gap-3 text-sm">
        <Bot className="h-4 w-4 text-primary shrink-0" />
        {sellerConfig.enabled ? (
          <span>
            <strong>Follow-up ativo:</strong> {sellerConfig.agentName || "Social Seller LinkedIn"} vai continuar a conversa
            {sellerConfig.requireApproval ? " com aprovação humana." : " automaticamente."}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Social Seller LinkedIn desativado.{" "}
            <Link to="/dashboard/inbox" className="text-primary underline">Ativar no Inbox</Link>
          </span>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Passo 1 · Post e tom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL do post no LinkedIn</label>
            <Input placeholder="https://www.linkedin.com/posts/..." value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tom da mensagem</label>
            <Textarea rows={2} value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <Button className="w-full gap-2" onClick={extract} disabled={loading || !postUrl}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? "Extraindo engajadores…" : "Extrair engajadores + gerar mensagens"}
          </Button>
        </CardContent>
      </Card>

      {engagers.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Passo 2 · Revisar e agir
            </CardTitle>
            <Badge variant="secondary">{selected.size}/{engagers.length} selecionados</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {engagers.map((e, i) => {
              const likeJob = getJob(i, "like");
              const commentJob = getJob(i, "comment");
              const crmJob = getJob(i, "crm_push");
              const isBusy = dispatching.has(i);
              return (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selected.has(i) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{e.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {e.reaction === "comment" ? "Comentou" : "Curtiu"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{e.headline}</p>
                      {e.snippet && <p className="text-xs italic text-muted-foreground mt-1">"{e.snippet}"</p>}
                    </div>
                    {selected.has(i) && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <div className="mt-3 p-3 rounded bg-background border text-sm">{e.suggestedMessage}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs"
                      disabled={isBusy || likeJob?.status === "running" || likeJob?.status === "success"}
                      onClick={() => runAction(i, "like")}>
                      <ThumbsUp className="h-3 w-3" /> Curtir post
                    </Button>
                    <StatusPill job={likeJob} />
                    {likeJob?.status === "failed" && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1"
                        onClick={() => retryJob(likeJob.id)}>
                        <RefreshCw className="h-3 w-3" /> Repetir
                      </Button>
                    )}

                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs ml-2"
                      disabled={isBusy || commentJob?.status === "running" || commentJob?.status === "success"}
                      onClick={() => runAction(i, "comment")}>
                      <MessageCircle className="h-3 w-3" /> Comentar
                    </Button>
                    <StatusPill job={commentJob} />
                    {commentJob?.status === "failed" && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] gap-1"
                        onClick={() => retryJob(commentJob.id)}>
                        <RefreshCw className="h-3 w-3" /> Repetir
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs ml-2" disabled={isBusy}>
                          <Database className="h-3 w-3" />
                          {crmJob?.status === "success" ? `Em ${crmJob.provider}` : "Enviar ao CRM"}
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel className="text-xs">Escolher CRM</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {CRM_OPTIONS.map((crm) => (
                          <DropdownMenuItem key={crm.id} onClick={() => runAction(i, "crm_push", crm.id)}>
                            {crm.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <StatusPill job={crmJob} />
                    {crmJob?.error && crmJob.status === "failed" && (
                      <span className="text-[10px] text-destructive flex items-center gap-1" title={crmJob.error}>
                        <AlertCircle className="h-3 w-3" /> {crmJob.error.slice(0, 60)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <Button className="w-full gap-2" onClick={sendToApproval}>
              Enviar {selected.size} para Approvals Center <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HunterPostEngagers;
